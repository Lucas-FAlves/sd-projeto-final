import { Candidate } from "./exam-results";

export type DocumentReviewed = {
  id: string;
  examId: string;
  candidate: Candidate & { age: number };
  status: "approved" | "rejected";
};
