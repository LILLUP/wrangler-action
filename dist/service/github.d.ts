import { getOctokit } from "@actions/github";
import { OutputEntryPagesDeployment, OutputEntryDeployment } from "../wranglerArtifactManager";
import { WranglerActionConfig } from "../wranglerAction";
type Octokit = ReturnType<typeof getOctokit>;
export declare function createGitHubDeployment({ config, octokit, productionBranch, environment, deploymentId, projectName, deploymentUrl, }: {
    config: WranglerActionConfig;
    octokit: Octokit;
    productionBranch: string;
    environment: string;
    deploymentId: string | null;
    projectName: string;
    deploymentUrl?: string;
}): Promise<void>;
export declare function createWorkersGitHubDeployment({ config, octokit, deploymentUrl, workerName, }: {
    config: WranglerActionConfig;
    octokit: Octokit;
    deploymentUrl?: string;
    workerName?: string;
}): Promise<void>;
export declare function createJobSummary({ commitHash, deploymentUrl, aliasUrl, }: {
    commitHash: string;
    deploymentUrl?: string;
    aliasUrl?: string;
}): Promise<void>;
export declare function createJobSummaryForWorkers({ commitHash, deploymentUrl, workerName, }: {
    commitHash?: string;
    deploymentUrl?: string;
    workerName?: string;
}): Promise<void>;
/**
 * Create github deployment, if GITHUB_TOKEN is present in config
 */
export declare function createGitHubDeploymentAndJobSummary(config: WranglerActionConfig, pagesArtifactFields: OutputEntryPagesDeployment): Promise<void>;
/**
 * Create github deployment, if GITHUB_TOKEN is present in config
 */
export declare function createWorkersGitHubDeploymentAndJobSummary(config: WranglerActionConfig, workersArtifactFields: OutputEntryDeployment): Promise<void>;
export {};
