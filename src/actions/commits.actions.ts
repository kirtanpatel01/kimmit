import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { and, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { account } from "@/lib/db/schema";

export type GithubRepoSummary = {
  id: number;
  name: string;
  fullName: string;
  description: string | null;
  topics: string[];
};

export type GithubCommitSummary = {
  sha: string;
  message: string;
  authorName: string;
  date: string;
  url: string;
};

type GithubRepoApi = {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  topics?: string[];
};

type GithubCommitApi = {
  sha: string;
  html_url: string;
  commit: {
    message: string;
    author: {
      name: string;
      date: string;
    };
  };
};

const getGithubAccessTokenForCurrentUser = async () => {
  const headers = getRequestHeaders();
  const session = await auth.api.getSession({ headers });

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const [githubAccount] = await db
    .select({ accessToken: account.accessToken })
    .from(account)
    .where(
      and(eq(account.userId, session.user.id), eq(account.providerId, "github")),
    )
    .limit(1);

  if (!githubAccount?.accessToken) {
    throw new Error("GitHub account is not connected for this user");
  }

  return githubAccount.accessToken;
};

export const fetchUserRepos = createServerFn({ method: "GET" }).handler(async () => {
  const token = await getGithubAccessTokenForCurrentUser();

  const reposRes = await fetch(
    "https://api.github.com/user/repos?sort=updated&per_page=100",
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    },
  );

  if (!reposRes.ok) {
    return [] as GithubRepoSummary[];
  }

  const repos = (await reposRes.json()) as GithubRepoApi[];

  return repos.map((repo) => ({
    id: repo.id,
    name: repo.name,
    fullName: repo.full_name,
    description: repo.description,
    topics: repo.topics ?? [],
  }));
});

export const fetchRepoCommits = createServerFn({ method: "POST" })
  .inputValidator((input: { repoFullName: string }) => input)
  .handler(async ({ data }) => {
    const token = await getGithubAccessTokenForCurrentUser();

    const commitsRes = await fetch(
      `https://api.github.com/repos/${data.repoFullName}/commits?per_page=100`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
      },
    );

    if (!commitsRes.ok) {
      return [] as GithubCommitSummary[];
    }

    const commits = (await commitsRes.json()) as GithubCommitApi[];

    return commits.map((commit) => ({
      sha: commit.sha,
      message: commit.commit.message,
      authorName: commit.commit.author.name,
      date: commit.commit.author.date,
      url: commit.html_url,
    }));
  });