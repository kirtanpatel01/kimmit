import { useMemo, useState } from "react";
import { IconBrandLinkedin, IconBrandX, IconCheck, IconCopy, IconSparkles } from "@tabler/icons-react";
import { generatePostsFromCommits, type GeneratedPosts } from "@/actions/posts.actions";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCommitSelectionStore } from "@/store/commit-selection.store";

export default function SelectedCommitsJsonPanel() {
  const [copiedJson, setCopiedJson] = useState(false);
  const [activePostTab, setActivePostTab] = useState<"x" | "linkedin">("x");
  const [copiedPost, setCopiedPost] = useState(false);
  const [generatedPosts, setGeneratedPosts] = useState<GeneratedPosts | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  const { repos, selectedRepoFullName, commits, selectedCommitShas, postContext } = useCommitSelectionStore();

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

  const handleGenerate = async () => {
    setGenerationError(null);
    setIsGenerating(true);

    try {
      const posts = await generatePostsFromCommits({
        data: {
          payload,
          context: postContext,
          selectedCount: selectedCommits.length,
          totalVisibleCount: commits.length,
        },
      });

      setGeneratedPosts(posts);
    } catch (error) {
      setGenerationError(error instanceof Error ? error.message : "Failed to generate posts");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyJson = async () => {
    await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    setCopiedJson(true);
    window.setTimeout(() => setCopiedJson(false), 1500);
  };

  const handleCopyGenerated = async () => {
    if (!generatedPosts) {
      return;
    }

    const value = activePostTab === "x" ? generatedPosts.xPost : generatedPosts.linkedinPost;
    await navigator.clipboard.writeText(value);
    setCopiedPost(true);
    window.setTimeout(() => setCopiedPost(false), 1500);
  };

  return (
    <Card className="h-full min-h-0">
      <CardHeader>
        <CardTitle>Post Generator</CardTitle>
        <CardDescription>
          Generate share-ready posts for X and LinkedIn from selected commits.
        </CardDescription>
        <CardAction>
          <div className="flex items-center gap-2">
            <Button type="button" size="sm" onClick={handleGenerate} disabled={selectedCommits.length === 0 || isGenerating}>
              <IconSparkles data-icon="inline-start" />
              {isGenerating ? "Generating..." : "Generate"}
            </Button>
          </div>
        </CardAction>
      </CardHeader>

      <CardContent className="flex min-h-0 flex-1 flex-col gap-4">
        <div className="rounded-xl border p-3">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-medium">Selected Commits JSON</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopyJson}
              disabled={selectedCommits.length === 0}
            >
              {copiedJson ? <IconCheck data-icon="inline-start" /> : <IconCopy data-icon="inline-start" />}
              {copiedJson ? "Copied" : "Copy JSON"}
            </Button>
          </div>

          <ScrollArea className="h-44 w-full rounded-lg border bg-muted/30">
            <pre className="p-3 text-xs leading-6">{JSON.stringify(payload, null, 2)}</pre>
          </ScrollArea>
        </div>

        <div className="min-h-0 flex-1 rounded-xl border p-3">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-medium">Generated Post Content</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopyGenerated}
              disabled={!generatedPosts}
            >
              {copiedPost ? <IconCheck data-icon="inline-start" /> : <IconCopy data-icon="inline-start" />}
              {copiedPost ? "Copied" : "Copy"}
            </Button>
          </div>

          <Tabs value={activePostTab} onValueChange={(value) => setActivePostTab(value as "x" | "linkedin")}>
            <TabsList>
              <TabsTrigger value="x" aria-label="X post" title="X post">
                <IconBrandX />
              </TabsTrigger>
              <TabsTrigger value="linkedin" aria-label="LinkedIn post" title="LinkedIn post">
                <IconBrandLinkedin />
              </TabsTrigger>
            </TabsList>

            <TabsContent value="x" className="mt-3">
              <div className="max-h-44 overflow-auto rounded-lg border bg-muted/30 p-3 text-sm leading-6">
                {generatedPosts?.xPost ?? "Click Generate to create an X post."}
              </div>
              {generatedPosts?.xPost ? (
                <p className="mt-2 text-xs text-muted-foreground">{generatedPosts.xPost.length}/280 characters</p>
              ) : null}
            </TabsContent>

            <TabsContent value="linkedin" className="mt-3">
              <div className="max-h-44 overflow-auto rounded-lg border bg-muted/30 p-3 text-sm leading-6">
                {generatedPosts?.linkedinPost ?? "Click Generate to create a LinkedIn post."}
              </div>
            </TabsContent>
          </Tabs>

          {generationError ? <p className="mt-3 text-sm text-destructive">{generationError}</p> : null}
        </div>
      </CardContent>
    </Card>
  );
}
