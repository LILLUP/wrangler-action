import mockfs from "mock-fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { handleCommandOutputParsing } from "./commandOutputParsing";
import { getTestConfig } from "./test/test-utils";
import * as githubModule from "./service/github";

// Mock the GitHub service functions
vi.mock("./service/github", () => ({
	createGitHubDeploymentAndJobSummary: vi.fn(),
	createWorkersGitHubDeploymentAndJobSummary: vi.fn(),
	createWorkersVersionsGitHubDeploymentAndJobSummary: vi.fn(),
}));

afterEach(() => {
	mockfs.restore();
	vi.clearAllMocks();
});

describe("commandOutputParsing", () => {
	it("Calls Workers GitHub deployment for Workers deploy output", async () => {
		const testConfig = getTestConfig();
		const mockCreateWorkersGitHubDeploymentAndJobSummary = vi.mocked(
			githubModule.createWorkersGitHubDeploymentAndJobSummary,
		);

		// Mock the wrangler output directory with a Workers deployment output
		mockfs({
			[testConfig.WRANGLER_OUTPUT_DIR]: {
				"wrangler-output-2024-10-17_18-48-40_463-2e6e83.json": JSON.stringify({
					version: 1,
					type: "deploy",
					targets: ["https://my-worker.example.workers.dev"],
				}),
			},
		});

		await handleCommandOutputParsing(testConfig, "deploy", "");

		expect(mockCreateWorkersGitHubDeploymentAndJobSummary).toHaveBeenCalledWith(
			testConfig,
			{
				version: 1,
				type: "deploy",
				targets: ["https://my-worker.example.workers.dev"],
			},
		);
	});

	it("Calls Workers GitHub deployment for Workers deploy output with custom domain", async () => {
		const testConfig = getTestConfig();
		const mockCreateWorkersGitHubDeploymentAndJobSummary = vi.mocked(
			githubModule.createWorkersGitHubDeploymentAndJobSummary,
		);

		// Mock the wrangler output directory with a Workers deployment output using custom domain
		mockfs({
			[testConfig.WRANGLER_OUTPUT_DIR]: {
				"wrangler-output-2024-10-17_18-48-40_463-2e6e83.json": JSON.stringify({
					version: 1,
					type: "deploy",
					targets: ["https://my-custom-domain.com"],
				}),
			},
		});

		await handleCommandOutputParsing(testConfig, "deploy", "");

		expect(mockCreateWorkersGitHubDeploymentAndJobSummary).toHaveBeenCalledWith(
			testConfig,
			{
				version: 1,
				type: "deploy",
				targets: ["https://my-custom-domain.com"],
			},
		);
	});

	it("Calls Pages GitHub deployment for Pages deploy output", async () => {
		const testConfig = getTestConfig();
		const mockCreateGitHubDeploymentAndJobSummary = vi.mocked(
			githubModule.createGitHubDeploymentAndJobSummary,
		);

		// Mock the wrangler output directory with a Pages deployment output
		mockfs({
			[testConfig.WRANGLER_OUTPUT_DIR]: {
				"wrangler-output-2024-10-17_18-48-40_463-2e6e83.json": JSON.stringify({
					version: 1,
					type: "pages-deploy-detailed",
					pages_project: "my-pages-project",
					deployment_id: "abc123",
					url: "https://abc123.my-pages-project.pages.dev",
					alias: "https://branch.my-pages-project.pages.dev",
					environment: "production",
					production_branch: "main",
					deployment_trigger: {
						metadata: {
							commit_hash: "1234567890abcdef",
						},
					},
				}),
			},
		});

		await handleCommandOutputParsing(testConfig, "pages deploy", "");

		expect(mockCreateGitHubDeploymentAndJobSummary).toHaveBeenCalledWith(
			testConfig,
			{
				version: 1,
				type: "pages-deploy-detailed",
				pages_project: "my-pages-project",
				deployment_id: "abc123",
				url: "https://abc123.my-pages-project.pages.dev",
				alias: "https://branch.my-pages-project.pages.dev",
				environment: "production",
				production_branch: "main",
				deployment_trigger: {
					metadata: {
						commit_hash: "1234567890abcdef",
					},
				},
			},
		);
	});

	it("Calls Workers Versions GitHub deployment for versions upload output", async () => {
		const testConfig = getTestConfig();
		const mockCreateWorkersVersionsGitHubDeploymentAndJobSummary = vi.mocked(
			githubModule.createWorkersVersionsGitHubDeploymentAndJobSummary,
		);

		// Mock the wrangler output directory with a Workers versions upload output
		mockfs({
			[testConfig.WRANGLER_OUTPUT_DIR]: {
				"wrangler-output-2024-10-17_18-48-40_463-2e6e83.json": JSON.stringify({
					version: 1,
					type: "version-upload",
					preview_url: "https://my-worker.example.workers.dev",
				}),
			},
		});

		await handleCommandOutputParsing(testConfig, "versions upload", "");

		expect(mockCreateWorkersVersionsGitHubDeploymentAndJobSummary).toHaveBeenCalledWith(
			testConfig,
			{
				version: 1,
				type: "version-upload",
				preview_url: "https://my-worker.example.workers.dev",
			},
		);
	});

	it("Calls Workers Versions GitHub deployment for versions upload with custom domain", async () => {
		const testConfig = getTestConfig();
		const mockCreateWorkersVersionsGitHubDeploymentAndJobSummary = vi.mocked(
			githubModule.createWorkersVersionsGitHubDeploymentAndJobSummary,
		);

		// Mock the wrangler output directory with a Workers versions upload output using custom domain
		mockfs({
			[testConfig.WRANGLER_OUTPUT_DIR]: {
				"wrangler-output-2024-10-17_18-48-40_463-2e6e83.json": JSON.stringify({
					version: 1,
					type: "version-upload",
					preview_url: "nextjs.aisk-svr.net (custom domain)",
				}),
			},
		});

		await handleCommandOutputParsing(testConfig, "versions upload", "");

		expect(mockCreateWorkersVersionsGitHubDeploymentAndJobSummary).toHaveBeenCalledWith(
			testConfig,
			{
				version: 1,
				type: "version-upload",
				preview_url: "nextjs.aisk-svr.net (custom domain)",
			},
		);
	});

	it("Does not call GitHub deployment functions when no output file exists", async () => {
		const testConfig = getTestConfig();
		const mockCreateWorkersGitHubDeploymentAndJobSummary = vi.mocked(
			githubModule.createWorkersGitHubDeploymentAndJobSummary,
		);
		const mockCreateGitHubDeploymentAndJobSummary = vi.mocked(
			githubModule.createGitHubDeploymentAndJobSummary,
		);
		const mockCreateWorkersVersionsGitHubDeploymentAndJobSummary = vi.mocked(
			githubModule.createWorkersVersionsGitHubDeploymentAndJobSummary,
		);

		// Mock empty output directory
		mockfs({
			[testConfig.WRANGLER_OUTPUT_DIR]: {},
		});

		await handleCommandOutputParsing(testConfig, "deploy", "some stdout");

		expect(mockCreateWorkersGitHubDeploymentAndJobSummary).not.toHaveBeenCalled();
		expect(mockCreateGitHubDeploymentAndJobSummary).not.toHaveBeenCalled();
		expect(mockCreateWorkersVersionsGitHubDeploymentAndJobSummary).not.toHaveBeenCalled();
	});
});
