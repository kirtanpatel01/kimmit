import { useEffect, useMemo, useState } from "react";
import {
  fetchRecentCommitsAcrossRepos,
  fetchRepoCommits,
  fetchUserRepos,
  type GithubCommitSummary,
} from "@/actions/commits.actions";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCommitSelectionStore } from "@/store/commit-selection.store";

export default function RepoCommitsPanel() {
  const {
    repos,
    selectedRepoFullName,
    commits,
    selectedCommitShas,
    repoCommitsCache,
    recentCommitsCache,
    setRepos,
    selectRepo,
    setCommits,
    cacheRepoCommits,
    cacheRecentCommits,
    clearCommitSelection,
    toggleCommitSelection,
  } = useCommitSelectionStore();

  const [activeTab, setActiveTab] = useState<"repo-wise" | "recent">("repo-wise");
  const [recentMode, setRecentMode] = useState<"count" | "day">("count");
  const [countPreset, setCountPreset] = useState<"5" | "10" | "15" | "custom">("5");
  const [customCount, setCustomCount] = useState("20");
  const [dayPreset, setDayPreset] = useState<"today" | "yesterday" | "last2days" | "last3days" | "lastWeek" | "custom">("today");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [isLoadingRepos, setIsLoadingRepos] = useState(false);
  const [isLoadingCommits, setIsLoadingCommits] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recentCacheKey = useMemo(() => {
    return JSON.stringify({
      mode: recentMode,
      countPreset,
      customCount: recentMode === "count" ? Number(customCount || 0) : null,
      dayPreset: recentMode === "day" ? dayPreset : null,
      customStartDate: recentMode === "day" ? customStartDate : null,
      customEndDate: recentMode === "day" ? customEndDate : null,
    });
  }, [countPreset, customCount, customEndDate, customStartDate, dayPreset, recentMode]);

  useEffect(() => {
    if (repos.length > 0) {
      return;
    }

    const loadRepos = async () => {
      setIsLoadingRepos(true);
      setError(null);

      try {
        const reposData = await fetchUserRepos();
        setRepos(reposData);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load repositories");
      } finally {
        setIsLoadingRepos(false);
      }
    };

    void loadRepos();
  }, [setRepos]);

  useEffect(() => {
    if (activeTab !== "repo-wise" || !selectedRepoFullName) {
      return;
    }

    const cachedCommits = repoCommitsCache[selectedRepoFullName];
    if (cachedCommits) {
      setCommits(cachedCommits);
      clearCommitSelection();
      return;
    }

    const loadCommits = async () => {
      setIsLoadingCommits(true);
      setError(null);

      try {
        const commitsData = await fetchRepoCommits({ data: { repoFullName: selectedRepoFullName } });
        setCommits(commitsData);
        cacheRepoCommits(selectedRepoFullName, commitsData);
        clearCommitSelection();
      } catch (loadError) {
        setCommits([]);
        setError(loadError instanceof Error ? loadError.message : "Unable to load commits");
      } finally {
        setIsLoadingCommits(false);
      }
    };

    void loadCommits();
  }, [activeTab, cacheRepoCommits, clearCommitSelection, repoCommitsCache, selectedRepoFullName, setCommits]);

  useEffect(() => {
    if (activeTab !== "recent") {
      return;
    }

    const cachedCommits = recentCommitsCache[recentCacheKey];
    if (cachedCommits) {
      setCommits(cachedCommits);
      clearCommitSelection();
      return;
    }

    const loadRecentCommits = async () => {
      setIsLoadingCommits(true);
      setError(null);

      try {
        const commitsData = await fetchRecentCommitsAcrossRepos({
          data: {
            mode: recentMode,
            countPreset,
            customCount: Number(customCount || 0),
            dayPreset,
            customStartDate,
            customEndDate,
          },
        });
        setCommits(commitsData);
        cacheRecentCommits(recentCacheKey, commitsData);
        clearCommitSelection();
      } catch (loadError) {
        setCommits([]);
        setError(loadError instanceof Error ? loadError.message : "Unable to load recent commits");
      } finally {
        setIsLoadingCommits(false);
      }
    };

    void loadRecentCommits();
  }, [
    activeTab,
    clearCommitSelection,
    countPreset,
    customCount,
    customEndDate,
    customStartDate,
    dayPreset,
    recentMode,
    recentCacheKey,
    recentCommitsCache,
    cacheRecentCommits,
    setCommits,
  ]);

  const isAllSelected = useMemo(() => {
    if (commits.length === 0) {
      return false;
    }

    return commits.every((commit) => selectedCommitShas.includes(commit.sha));
  }, [commits, selectedCommitShas]);

  const toggleAll = (checked: boolean) => {
    if (!checked) {
      commits.forEach((commit) => {
        if (selectedCommitShas.includes(commit.sha)) {
          toggleCommitSelection(commit.sha);
        }
      });
      return;
    }

    commits.forEach((commit) => {
      if (!selectedCommitShas.includes(commit.sha)) {
        toggleCommitSelection(commit.sha);
      }
    });
  };

  const showRepoColumn = activeTab === "recent";

  const renderCommitRows = (rows: GithubCommitSummary[]) => {
    return rows.map((commit) => (
      <TableRow key={commit.sha} data-state={selectedCommitShas.includes(commit.sha) ? "selected" : undefined}>
        <TableCell>
          <Checkbox
            checked={selectedCommitShas.includes(commit.sha)}
            onCheckedChange={(checked) => {
              if (typeof checked === "boolean") {
                toggleCommitSelection(commit.sha);
              }
            }}
            aria-label={`Select commit ${commit.sha}`}
          />
        </TableCell>
        {showRepoColumn ? <TableCell className="max-w-48 truncate">{commit.repoFullName}</TableCell> : null}
        <TableCell className="font-mono">{commit.sha.slice(0, 7)}</TableCell>
        <TableCell className="max-w-84 truncate">{commit.message}</TableCell>
        <TableCell>{commit.authorName}</TableCell>
        <TableCell>{new Date(commit.date).toLocaleString()}</TableCell>
      </TableRow>
    ));
  };

  return (
    <Card className="h-full min-h-0">
      <CardHeader>
        <CardTitle>Repositories and Commits</CardTitle>
        <CardDescription>Pick commits repo-wise or across repositories, then send selected rows to JSON.</CardDescription>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col gap-4">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "repo-wise" | "recent")} className="min-h-0 w-full">
          <TabsList>
            <TabsTrigger value="repo-wise">Repo Wise</TabsTrigger>
            <TabsTrigger value="recent">Recent Across Repos</TabsTrigger>
          </TabsList>

          <TabsContent value="repo-wise" className="flex min-h-0 flex-col gap-4">
            <Select
              value={selectedRepoFullName ?? ""}
              onValueChange={(value) => {
                selectRepo(value);
              }}
              disabled={isLoadingRepos || repos.length === 0}
            >
              <SelectTrigger size="sm" className="w-52 max-w-full">
                <SelectValue placeholder={isLoadingRepos ? "Loading repositories..." : "Select repository"} />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                <SelectGroup>
                  {repos.map((repo) => (
                    <SelectItem key={repo.id} value={repo.fullName}>
                      {repo.fullName}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </TabsContent>

          <TabsContent value="recent" className="flex min-h-0 flex-col gap-3">
            <div className="flex flex-wrap items-end gap-2">
              <Select value={recentMode} onValueChange={(value) => setRecentMode(value as "count" | "day")}>
                <SelectTrigger size="sm" className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="count">Commit Count</SelectItem>
                    <SelectItem value="day">Day Wise</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>

              {recentMode === "count" ? (
                <>
                  <Select value={countPreset} onValueChange={(value) => setCountPreset(value as "5" | "10" | "15" | "custom") }>
                    <SelectTrigger size="sm" className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="5">Last 5</SelectItem>
                        <SelectItem value="10">Last 10</SelectItem>
                        <SelectItem value="15">Last 15</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  {countPreset === "custom" ? (
                    <Input
                      type="number"
                      min={1}
                      max={200}
                      value={customCount}
                      onChange={(event) => setCustomCount(event.target.value)}
                      className="h-8 w-28"
                      placeholder="Count"
                    />
                  ) : null}
                </>
              ) : (
                <>
                  <Select
                    value={dayPreset}
                    onValueChange={(value) =>
                      setDayPreset(value as "today" | "yesterday" | "last2days" | "last3days" | "lastWeek" | "custom")
                    }
                  >
                    <SelectTrigger size="sm" className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="today">Today</SelectItem>
                        <SelectItem value="yesterday">Yesterday</SelectItem>
                        <SelectItem value="last2days">Last 2 Days</SelectItem>
                        <SelectItem value="last3days">Last 3 Days</SelectItem>
                        <SelectItem value="lastWeek">Last Week</SelectItem>
                        <SelectItem value="custom">Custom Range</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  {dayPreset === "custom" ? (
                    <>
                      <Input
                        type="date"
                        value={customStartDate}
                        onChange={(event) => setCustomStartDate(event.target.value)}
                        className="h-8 w-40"
                      />
                      <Input
                        type="date"
                        value={customEndDate}
                        onChange={(event) => setCustomEndDate(event.target.value)}
                        className="h-8 w-40"
                      />
                    </>
                  ) : null}
                </>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <div className="min-h-0 flex-1 rounded-xl border">
          <ScrollArea className="h-full w-full">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={isAllSelected}
                      onCheckedChange={(checked) => {
                        if (typeof checked === "boolean") {
                          toggleAll(checked);
                        }
                      }}
                      aria-label="Select all commits"
                      disabled={commits.length === 0}
                    />
                  </TableHead>
                  {showRepoColumn ? <TableHead>Repo</TableHead> : null}
                  <TableHead>SHA</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingCommits ? (
                  <TableRow>
                    <TableCell colSpan={showRepoColumn ? 6 : 5}>Loading commits...</TableCell>
                  </TableRow>
                ) : commits.length > 0 ? (
                  renderCommitRows(commits)
                ) : (
                  <TableRow>
                    <TableCell colSpan={showRepoColumn ? 6 : 5}>No commits found for this filter.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </CardContent>
    </Card>
  );
}
