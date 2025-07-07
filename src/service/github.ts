import { summary } from "@actions/core";
import { context, getOctokit } from "@actions/github";
import { env } from "process";
import { info, warn } from "../utils";
import { OutputEntryPagesDeployment, OutputEntryDeployment } from "../wranglerArtifactManager";
import { WranglerActionConfig } from "../wranglerAction";

type Octokit = ReturnType<typeof getOctokit>;

export async function createGitHubDeployment({
	config,
	octokit,
	productionBranch,
	environment,
	deploymentId,
	projectName,
	deploymentUrl,
}: {
	config: WranglerActionConfig;
	octokit: Octokit;
	productionBranch: string;
	environment: string;
	deploymentId: string | null;
	projectName: string;
	deploymentUrl?: string;
}) {
	const githubBranch = env.GITHUB_HEAD_REF || env.GITHUB_REF_NAME;
	const productionEnvironment = githubBranch === productionBranch;

	const deployment = await octokit.rest.repos.createDeployment({
		owner: context.repo.owner,
		repo: context.repo.repo,
		ref: githubBranch || context.ref,
		auto_merge: false,
		description: "Cloudflare Pages",
		required_contexts: [],
		environment,
		production_environment: productionEnvironment,
	});

	if (deployment.status !== 201) {
		info(config, "Error creating GitHub deployment");
		return;
	}
	await octokit.rest.repos.createDeploymentStatus({
		owner: context.repo.owner,
		repo: context.repo.repo,
		deployment_id: deployment.data.id,
		environment,
		environment_url: deploymentUrl,
		production_environment: productionEnvironment,
		// don't have project_name or deployment_id I think
		log_url: `https://dash.cloudflare.com/${config.CLOUDFLARE_ACCOUNT_ID}/pages/view/${projectName}/${deploymentId}`,
		description: "Cloudflare Pages",
		state: "success",
		auto_inactive: false,
	});
}

export async function createWorkersGitHubDeployment({
	config,
	octokit,
	deploymentUrl,
	workerName,
}: {
	config: WranglerActionConfig;
	octokit: Octokit;
	deploymentUrl?: string;
	workerName?: string;
}) {
	const githubBranch = env.GITHUB_HEAD_REF || env.GITHUB_REF_NAME;
	const environment = githubBranch === "main" || githubBranch === "master" ? "production" : "preview";
	const productionEnvironment = environment === "production";

	const deployment = await octokit.rest.repos.createDeployment({
		owner: context.repo.owner,
		repo: context.repo.repo,
		ref: githubBranch || context.ref,
		auto_merge: false,
		description: "Cloudflare Workers",
		required_contexts: [],
		environment,
		production_environment: productionEnvironment,
	});

	if (deployment.status !== 201) {
		info(config, "Error creating GitHub deployment");
		return;
	}

	const logUrl = workerName 
		? `https://dash.cloudflare.com/${config.CLOUDFLARE_ACCOUNT_ID}/workers/services/view/${workerName}`
		: `https://dash.cloudflare.com/${config.CLOUDFLARE_ACCOUNT_ID}/workers`;

	await octokit.rest.repos.createDeploymentStatus({
		owner: context.repo.owner,
		repo: context.repo.repo,
		deployment_id: deployment.data.id,
		environment,
		environment_url: deploymentUrl,
		production_environment: productionEnvironment,
		log_url: logUrl,
		description: "Cloudflare Workers",
		state: "success",
		auto_inactive: false,
	});
}

export async function createJobSummary({
	commitHash,
	deploymentUrl,
	aliasUrl,
}: {
	commitHash: string;
	deploymentUrl?: string;
	aliasUrl?: string;
}) {
	await summary
		.addRaw(
			`
# Deploying with Cloudflare Pages

| Name                    | Result |
| ----------------------- | - |
| **Last commit:**        | ${commitHash} |
| **Preview URL**:        | ${deploymentUrl} |
| **Branch Preview URL**: | ${aliasUrl} |
  `,
		)
		.write();
}

export async function createJobSummaryForWorkers({
	commitHash,
	deploymentUrl,
	workerName,
}: {
	commitHash?: string;
	deploymentUrl?: string;
	workerName?: string;
}) {
	await summary
		.addRaw(
			`
# Deploying with Cloudflare Workers

| Name                    | Result |
| ----------------------- | - |
${commitHash ? `| **Last commit:**        | ${commitHash} |` : ''}
${workerName ? `| **Worker Name:**        | ${workerName} |` : ''}
| **Deployment URL**:     | ${deploymentUrl || 'N/A'} |
  `,
		)
		.write();
}

/**
 * Create github deployment, if GITHUB_TOKEN is present in config
 */
export async function createGitHubDeploymentAndJobSummary(
	config: WranglerActionConfig,
	pagesArtifactFields: OutputEntryPagesDeployment,
) {
	if (
		config.GITHUB_TOKEN &&
		pagesArtifactFields.production_branch &&
		pagesArtifactFields.pages_project &&
		pagesArtifactFields.deployment_trigger
	) {
		const octokit = getOctokit(config.GITHUB_TOKEN);
		const [createGitHubDeploymentRes, createJobSummaryRes] =
			await Promise.allSettled([
				createGitHubDeployment({
					config,
					octokit,
					deploymentUrl: pagesArtifactFields.url,
					productionBranch: pagesArtifactFields.production_branch,
					environment: pagesArtifactFields.environment,
					deploymentId: pagesArtifactFields.deployment_id,
					projectName: pagesArtifactFields.pages_project,
				}),
				createJobSummary({
					commitHash:
						pagesArtifactFields.deployment_trigger.metadata.commit_hash.substring(
							0,
							8,
						),
					deploymentUrl: pagesArtifactFields.url,
					aliasUrl: pagesArtifactFields.alias,
				}),
			]);

		if (createGitHubDeploymentRes.status === "rejected") {
			warn(config, "Creating Github Deployment failed");
		}

		if (createJobSummaryRes.status === "rejected") {
			warn(config, "Creating Github Job summary failed");
		}
	}
}

/**
 * Create github deployment, if GITHUB_TOKEN is present in config
 */
export async function createWorkersGitHubDeploymentAndJobSummary(
	config: WranglerActionConfig,
	workersArtifactFields: OutputEntryDeployment,
) {
	if (config.GITHUB_TOKEN) {
		const octokit = getOctokit(config.GITHUB_TOKEN);
		const deploymentUrl = workersArtifactFields.targets?.[0];
		
		// Extract worker name from deployment URL if possible
		let workerName: string | undefined;
		if (deploymentUrl) {
			const match = deploymentUrl.match(/https:\/\/([^.]+)\./);
			workerName = match?.[1];
		}

		// Get commit hash from git context
		const commitHash = context.sha?.substring(0, 8);

		const [createGitHubDeploymentRes, createJobSummaryRes] =
			await Promise.allSettled([
				createWorkersGitHubDeployment({
					config,
					octokit,
					deploymentUrl,
					workerName,
				}),
				createJobSummaryForWorkers({
					commitHash,
					deploymentUrl,
					workerName,
				}),
			]);

		if (createGitHubDeploymentRes.status === "rejected") {
			warn(config, "Creating Workers Github Deployment failed");
		}

		if (createJobSummaryRes.status === "rejected") {
			warn(config, "Creating Workers Github Job summary failed");
		}
	}
}
