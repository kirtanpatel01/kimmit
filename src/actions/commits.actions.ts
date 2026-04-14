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
  repoFullName: string;
  repoDescription: string | null;
  repoTags: string[];
};

export type RecentCommitMode = "count" | "day";
export type CountPreset = "5" | "10" | "15" | "custom";
export type DayPreset = "today" | "yesterday" | "last2days" | "last3days" | "lastWeek" | "custom";

export type FetchRecentCommitsInput = {
  mode: RecentCommitMode;
  countPreset?: CountPreset;
  customCount?: number;
  dayPreset?: DayPreset;
  customStartDate?: string;
  customEndDate?: string;
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
      repoFullName: data.repoFullName,
      repoDescription: null,
      repoTags: [],
    }));
  });

const getDayBounds = (input: FetchRecentCommitsInput) => {
  if (input.mode !== "day") {
    return { since: undefined as string | undefined, until: undefined as string | undefined };
  }

  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  if (input.dayPreset === "yesterday") {
    const yesterdayStart = new Date(startOfToday);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    return {
      since: yesterdayStart.toISOString(),
      until: startOfToday.toISOString(),
    };
  }

  if (input.dayPreset === "last2days") {
    const since = new Date(now);
    since.setDate(since.getDate() - 2);
    return {
      since: since.toISOString(),
      until: undefined,
    };
  }

  if (input.dayPreset === "last3days") {
    const since = new Date(now);
    since.setDate(since.getDate() - 3);
    return {
      since: since.toISOString(),
      until: undefined,
    };
  }

  if (input.dayPreset === "lastWeek") {
    const since = new Date(now);
    since.setDate(since.getDate() - 7);
    return {
      since: since.toISOString(),
      until: undefined,
    };
  }

  if (input.dayPreset === "custom") {
    const customStartDate = input.customStartDate ? new Date(input.customStartDate) : null;
    const customEndDate = input.customEndDate ? new Date(input.customEndDate) : null;

    if (!customStartDate || Number.isNaN(customStartDate.getTime())) {
      return { since: undefined, until: undefined };
    }

    customStartDate.setHours(0, 0, 0, 0);

    if (!customEndDate || Number.isNaN(customEndDate.getTime())) {
      return { since: customStartDate.toISOString(), until: undefined };
    }

    customEndDate.setHours(23, 59, 59, 999);

    return {
      since: customStartDate.toISOString(),
      until: customEndDate.toISOString(),
    };
  }

  return {
    since: startOfToday.toISOString(),
    until: undefined,
  };
};

const resolveCountLimit = (input: FetchRecentCommitsInput) => {
  if (input.mode !== "count") {
    return 200;
  }

  if (input.countPreset === "10") {
    return 10;
  }

  if (input.countPreset === "15") {
    return 15;
  }

  if (input.countPreset === "custom") {
    const parsed = Number(input.customCount ?? 0);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return 5;
    }
    return Math.min(Math.floor(parsed), 200);
  }

  return 5;
};

export const fetchRecentCommitsAcrossRepos = createServerFn({ method: "POST" })
  .inputValidator((input: FetchRecentCommitsInput) => input)
  .handler(async ({ data }) => {
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
      return [] as GithubCommitSummary[];
    }

    const repos = (await reposRes.json()) as GithubRepoApi[];
    const reposToScan = repos.slice(0, 30);
    const countLimit = resolveCountLimit(data);
    const { since, until } = getDayBounds(data);
    const perRepo = data.mode === "count" ? Math.min(Math.max(countLimit, 15), 100) : 100;

    const commitsByRepo = await Promise.all(
      reposToScan.map(async (repo) => {
        const query = new URLSearchParams({ per_page: String(perRepo) });

        if (since) {
          query.set("since", since);
        }

        if (until) {
          query.set("until", until);
        }

        const commitsRes = await fetch(
          `https://api.github.com/repos/${repo.full_name}/commits?${query.toString()}`,
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
          repoFullName: repo.full_name,
          repoDescription: repo.description,
          repoTags: repo.topics ?? [],
        }));
      }),
    );

    const sorted = commitsByRepo
      .flat()
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (data.mode === "count") {
      return sorted.slice(0, countLimit);
    }

    return sorted;
  });
