import { Candidate } from "./exam-results";

export type AwaitingAppeals = {
  id: string;
  message: string;
  approvedCandidates: Candidate[];
};
