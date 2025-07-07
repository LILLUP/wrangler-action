import { http, HttpResponse } from "msw";
import { z } from "zod";

export function mockGithubDeployments({
	githubUser,
	githubRepoName,
}: {
	githubUser: string;
	githubRepoName: string;
}) {
	return {
		handlers: [
			http.post(
				`https://api.github.com/repos/${githubUser}/${githubRepoName}/deployments`,
				async ({ request }) => {
					if (request.headers.get("Authorization") === null) {
						return HttpResponse.text("error: no auth token", { status: 400 });
					}
					const GithubDeploymentsRequest = z.object({
						auto_merge: z.literal(false),
						description: z.union([z.literal("Cloudflare Pages"), z.literal("Cloudflare Workers")]),
						required_contexts: z.array(z.string()).length(0),
						environment: z.union([z.literal("production"), z.literal("preview")]),
						production_environment: z.boolean(),
					});
					// validate request body
					GithubDeploymentsRequest.parse(await request.json());

					return HttpResponse.json({ id: 123 }, { status: 201 });
				},
			),
			http.post(
				`https://api.github.com/repos/${githubUser}/${githubRepoName}/deployments/123/statuses`,
				async ({ request }) => {
					if (request.headers.get("Authorization") === null) {
						return HttpResponse.text("error: no auth token", { status: 400 });
					}
					const GithubDeploymentStatusRequest = z.object({
						environment: z.union([z.literal("production"), z.literal("preview")]),
						environment_url: z.string().optional(),
						production_environment: z.boolean(),
						log_url: z.string(),
						description: z.union([z.literal("Cloudflare Pages"), z.literal("Cloudflare Workers")]),
						state: z.literal("success"),
						auto_inactive: z.literal(false),
					});
					// validate request body
					GithubDeploymentStatusRequest.parse(await request.json());

					return HttpResponse.json(null);
				},
			),
		],
	};
}
