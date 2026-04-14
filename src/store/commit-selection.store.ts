import { create } from "zustand";
import type {
  GithubCommitSummary,
  GithubRepoSummary,
} from "@/actions/commits.actions";

type RecentCommitCacheKey = string;

type CommitSelectionState = {
  repos: GithubRepoSummary[];
  selectedRepoFullName: string | null;
  commits: GithubCommitSummary[];
  selectedCommitShas: string[];
  repoCommitsCache: Record<string, GithubCommitSummary[]>;
  recentCommitsCache: Record<RecentCommitCacheKey, GithubCommitSummary[]>;
  setRepos: (repos: GithubRepoSummary[]) => void;
  selectRepo: (repoFullName: string) => void;
  setCommits: (commits: GithubCommitSummary[]) => void;
  cacheRepoCommits: (repoFullName: string, commits: GithubCommitSummary[]) => void;
  cacheRecentCommits: (cacheKey: RecentCommitCacheKey, commits: GithubCommitSummary[]) => void;
  toggleCommitSelection: (sha: string) => void;
  clearCommitSelection: () => void;
};

export const useCommitSelectionStore = create<CommitSelectionState>()((set) => ({
  repos: [],
  selectedRepoFullName: null,
  commits: [],
  selectedCommitShas: [],
  repoCommitsCache: {},
  recentCommitsCache: {},
  setRepos: (repos) =>
    set((state) => ({
      repos,
      selectedRepoFullName: state.selectedRepoFullName ?? repos[0]?.fullName ?? null,
    })),
  selectRepo: (repoFullName) =>
    set(() => ({
      selectedRepoFullName: repoFullName,
      commits: [],
      selectedCommitShas: [],
    })),
  setCommits: (commits) => set(() => ({ commits })),
  cacheRepoCommits: (repoFullName, commits) =>
    set((state) => ({
      repoCommitsCache: {
        ...state.repoCommitsCache,
        [repoFullName]: commits,
      },
    })),
  cacheRecentCommits: (cacheKey, commits) =>
    set((state) => ({
      recentCommitsCache: {
        ...state.recentCommitsCache,
        [cacheKey]: commits,
      },
    })),
  toggleCommitSelection: (sha) =>
    set((state) => {
      const isAlreadySelected = state.selectedCommitShas.includes(sha);

      return {
        selectedCommitShas: isAlreadySelected
          ? state.selectedCommitShas.filter((selectedSha) => selectedSha !== sha)
          : [...state.selectedCommitShas, sha],
      };
    }),
  clearCommitSelection: () => set(() => ({ selectedCommitShas: [] })),
}));
