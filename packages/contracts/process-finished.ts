import { Candidate } from "./exam-results";

export type ProcessFinished = {
  id: string;
  examId: string;
  approvedCandidates: (Candidate & { age: number })[];
};
