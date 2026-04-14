import { useMemo, useState } from "react";
import { IconCheck, IconCopy } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCommitSelectionStore } from "@/store/commit-selection.store";

export default function SelectedCommitsJsonPanel() {
  const [copied, setCopied] = useState(false);
  const { repos, selectedRepoFullName, commits, selectedCommitShas } = useCommitSelectionStore();

  const selectedRepo = useMemo(() => {
    return repos.find((repo) => repo.fullName === selectedRepoFullName) ?? null;
  }, [repos, selectedRepoFullName]);

  const selectedCommits = useMemo(() => {
    return commits.filter((commit) => selectedCommitShas.includes(commit.sha));
  }, [commits, selectedCommitShas]);

  const payload = useMemo(() => {
    const selectedRepoNames = Array.from(new Set(selectedCommits.map((commit) => commit.repoFullName)));
    const hasMultipleRepos = selectedRepoNames.length > 1;

    const resolvedRepo =
      selectedCommits.length > 0
        ? repos.find((repo) => repo.fullName === selectedCommits[0].repoFullName) ?? selectedRepo
        : selectedRepo;

    return {
      repoName: hasMultipleRepos ? "multiple" : resolvedRepo?.fullName ?? null,
      repoDescription: hasMultipleRepos ? null : resolvedRepo?.description ?? null,
      repoTags: hasMultipleRepos ? [] : resolvedRepo?.topics ?? [],
      commits: selectedCommits.map((commit) => ({
        sha: commit.sha,
        message: commit.message,
        authorName: commit.authorName,
        date: commit.date,
        url: commit.url,
        repoFullName: commit.repoFullName,
      })),
    };
  }, [repos, selectedCommits, selectedRepo]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Card className="h-full min-h-0">
      <CardHeader>
        <CardTitle>Selected Commits JSON</CardTitle>
        <CardDescription>
          Selected commits from the table are represented as JSON in this panel.
        </CardDescription>
        <CardAction>
          <Button type="button" variant="outline" size="sm" onClick={handleCopy} disabled={selectedCommits.length === 0}>
            {copied ? <IconCheck data-icon="inline-start" /> : <IconCopy data-icon="inline-start" />}
            {copied ? "Copied" : "Copy JSON"}
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1">
        <ScrollArea className="h-full w-full rounded-xl border bg-muted/40">
          <pre className="p-4 text-xs leading-6">{JSON.stringify(payload, null, 2)}</pre>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
