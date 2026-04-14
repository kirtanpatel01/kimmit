import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { and, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { account } from "@/lib/db/schema";

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

export const getGithubData = createServerFn({ method: 'GET' }).handler(async () => {
  const token = await getGithubAccessTokenForCurrentUser();
  const res = await fetch("https://api.github.com/user", {
    headers: {
      'Authorization': `Bearer ${token}`,
      'X-Github-Api-Version': '2022-11-28',
      'Accept': 'application/vnd.github+json',
    },
  });

  if(!res.ok) {
    return { success: false, message: "Failled to fetch from github" }
  }

  return res.json();
})
