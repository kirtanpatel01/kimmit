import { useEffect, useMemo, useState } from "react";
import {
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCommitSelectionStore } from "@/store/commit-selection.store";

export default function RepoCommitsPanel() {
  const {
    repos,
    selectedRepoFullName,
    commits,
    selectedCommitShas,
    setRepos,
    selectRepo,
    setCommits,
    toggleCommitSelection,
  } = useCommitSelectionStore();

  const [isLoadingRepos, setIsLoadingRepos] = useState(false);
  const [isLoadingCommits, setIsLoadingCommits] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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
    if (!selectedRepoFullName) {
      return;
    }

    const loadCommits = async () => {
      setIsLoadingCommits(true);
      setError(null);

      try {
        const commitsData = await fetchRepoCommits({ data: { repoFullName: selectedRepoFullName } });
        setCommits(commitsData);
      } catch (loadError) {
        setCommits([]);
        setError(loadError instanceof Error ? loadError.message : "Unable to load commits");
      } finally {
        setIsLoadingCommits(false);
      }
    };

    void loadCommits();
  }, [selectedRepoFullName, setCommits]);

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
        <CardDescription>Select a repository and choose commits to include in the JSON payload.</CardDescription>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col gap-4">
        <Select
          value={selectedRepoFullName ?? ""}
          onValueChange={(value) => {
            selectRepo(value);
          }}
          disabled={isLoadingRepos || repos.length === 0}
        >
          <SelectTrigger size="sm" className="w-56 max-w-full">
            <SelectValue placeholder={isLoadingRepos ? "Loading repositories..." : "Select repository"} />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {repos.map((repo) => (
                <SelectItem key={repo.id} value={repo.fullName}>
                  {repo.fullName}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>

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
                  <TableHead>SHA</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingCommits ? (
                  <TableRow>
                    <TableCell colSpan={5}>Loading commits...</TableCell>
                  </TableRow>
                ) : commits.length > 0 ? (
                  renderCommitRows(commits)
                ) : (
                  <TableRow>
                    <TableCell colSpan={5}>No commits found for this repository.</TableCell>
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
