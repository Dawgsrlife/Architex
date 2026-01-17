import { Octokit } from "@octokit/rest";

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

export interface GitHubRepo {
  name: string;
  fullName: string;
  description: string;
  url: string;
  stars: number;
  language: string;
}

export async function getUserRepos(): Promise<GitHubRepo[]> {
  try {
    const { data } = await octokit.repos.listForAuthenticatedUser({
      sort: "updated",
      per_page: 100,
    });

    return data.map((repo) => ({
      name: repo.name,
      fullName: repo.full_name,
      description: repo.description || "",
      url: repo.html_url,
      stars: repo.stargazers_count || 0,
      language: repo.language || "Unknown",
    }));
  } catch (error) {
    console.error("Error fetching GitHub repos:", error);
    throw new Error("Failed to fetch GitHub repositories");
  }
}

export async function createRepo(
  name: string,
  description: string,
  isPrivate: boolean = false
) {
  try {
    const { data } = await octokit.repos.createForAuthenticatedUser({
      name,
      description,
      private: isPrivate,
      auto_init: true,
    });

    return {
      name: data.name,
      fullName: data.full_name,
      url: data.html_url,
    };
  } catch (error) {
    console.error("Error creating GitHub repo:", error);
    throw new Error("Failed to create GitHub repository");
  }
}

export async function createOrUpdateFile(
  owner: string,
  repo: string,
  path: string,
  content: string,
  message: string
) {
  try {
    // Check if file exists
    let sha: string | undefined;
    try {
      const { data } = await octokit.repos.getContent({
        owner,
        repo,
        path,
      });
      if ("sha" in data) {
        sha = data.sha;
      }
    } catch (error) {
      // File doesn't exist, that's okay
    }

    const { data } = await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      message,
      content: Buffer.from(content).toString("base64"),
      sha,
    });

    return data;
  } catch (error) {
    console.error("Error creating/updating file in GitHub:", error);
    throw new Error("Failed to create or update file in GitHub");
  }
}

export async function getRepoContent(
  owner: string,
  repo: string,
  path: string = ""
) {
  try {
    const { data } = await octokit.repos.getContent({
      owner,
      repo,
      path,
    });

    return data;
  } catch (error) {
    console.error("Error getting repo content:", error);
    throw new Error("Failed to get repository content");
  }
}
