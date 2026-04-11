import { createServerFn } from "@tanstack/react-start";

export const fetchAllCommits = createServerFn({ method: 'GET' }).handler(async () => {
  const token = process.env.GITHUB_TOKEN!;
  // For demo purposes, we fetch from the 'kimmit' repo of the authenticated user
  // We can get the user's login from the /user endpoint first if needed
  
  // First, get the authenticated user's login
  const userRes = await fetch("https://api.github.com/user", {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github+json',
    },
  });
  
  if (!userRes.ok) return [];
  const user = await userRes.json();
  const username = user.login;

  // Now fetch commits from a repo (hardcoding 'kimmit' for now as it seems to be the project name)
  const commitsRes = await fetch(`https://api.github.com/repos/${username}/kimmit/commits`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });

  if (!commitsRes.ok) {
     // If 'kimmit' doesn't exist, maybe fetch recent events instead?
     // For now, let's try the events API to get ALL recent activity
     const eventsRes = await fetch(`https://api.github.com/users/${username}/events`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github+json',
        },
     });
     if (!eventsRes.ok) return [];
     const events = await eventsRes.json();
     
     // Filter for PushEvents and extract commits
     return events
       .filter((e: any) => e.type === "PushEvent")
       .flatMap((e: any) => e.payload.commits.map((c: any) => ({
         sha: c.sha.substring(0, 7),
         message: c.message,
         repo: e.repo.name,
         date: e.created_at
       })));
  }

  const commits = await commitsRes.json();
  return commits.map((c: any) => ({
    sha: c.sha.substring(0, 7),
    message: c.commit.message,
    repo: `${username}/kimmit`,
    date: c.commit.author.date
  }));
});