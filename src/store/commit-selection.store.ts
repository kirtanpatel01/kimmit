import { create } from "zustand";
import type {
  GithubCommitSummary,
  GithubRepoSummary,
} from "@/actions/commits.actions";
import type { PostGenerationContext } from "@/actions/posts.actions";

type RecentCommitCacheKey = string;

type CommitSelectionState = {
  repos: GithubRepoSummary[];
  selectedRepoFullName: string | null;
  commits: GithubCommitSummary[];
  selectedCommitShas: string[];
  repoCommitsCache: Record<string, GithubCommitSummary[]>;
  recentCommitsCache: Record<RecentCommitCacheKey, GithubCommitSummary[]>;
  postContext: PostGenerationContext;
  setRepos: (repos: GithubRepoSummary[]) => void;
  selectRepo: (repoFullName: string) => void;
  setCommits: (commits: GithubCommitSummary[]) => void;
  cacheRepoCommits: (repoFullName: string, commits: GithubCommitSummary[]) => void;
  cacheRecentCommits: (cacheKey: RecentCommitCacheKey, commits: GithubCommitSummary[]) => void;
  setPostContext: (context: PostGenerationContext) => void;
  toggleCommitSelection: (sha: string) => void;
  clearCommitSelection: () => void;
};

const isSamePostContext = (current: PostGenerationContext, next: PostGenerationContext) => {
  return (
    current.activeTab === next.activeTab &&
    current.recentMode === next.recentMode &&
    current.countPreset === next.countPreset &&
    current.customCount === next.customCount &&
    current.dayPreset === next.dayPreset &&
    current.customStartDate === next.customStartDate &&
    current.customEndDate === next.customEndDate
  );
};

const defaultPostContext: PostGenerationContext = {
  activeTab: "repo-wise",
  recentMode: "count",
  countPreset: "5",
  customCount: "20",
  dayPreset: "today",
  customStartDate: "",
  customEndDate: "",
};

export const useCommitSelectionStore = create<CommitSelectionState>()((set) => ({
  repos: [],
  selectedRepoFullName: null,
  commits: [],
  selectedCommitShas: [],
  repoCommitsCache: {},
  recentCommitsCache: {},
  postContext: defaultPostContext,
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
  setPostContext: (context) =>
    set((state) => {
      if (isSamePostContext(state.postContext, context)) {
        return state;
      }

      return { postContext: context };
    }),
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
