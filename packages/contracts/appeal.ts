import type { Candidate } from "./exam-results";

export type Appeal = {
  id: string;
  candidate: Candidate;
  grade: number;
};
