import { create } from "zustand";
import type {
  GithubCommitSummary,
  GithubRepoSummary,
} from "@/actions/commits.actions";

type CommitSelectionState = {
  repos: GithubRepoSummary[];
  selectedRepoFullName: string | null;
  commits: GithubCommitSummary[];
  selectedCommitShas: string[];
  setRepos: (repos: GithubRepoSummary[]) => void;
  selectRepo: (repoFullName: string) => void;
  setCommits: (commits: GithubCommitSummary[]) => void;
  toggleCommitSelection: (sha: string) => void;
  clearCommitSelection: () => void;
};

export const useCommitSelectionStore = create<CommitSelectionState>((set) => ({
  repos: [],
  selectedRepoFullName: null,
  commits: [],
  selectedCommitShas: [],
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
