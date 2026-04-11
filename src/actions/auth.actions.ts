import { createServerFn } from "@tanstack/react-start";

export const getGithubData = createServerFn({ method: 'GET' }).handler(async () => {
  const token = process.env.GITHUB_TOKEN!;
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
