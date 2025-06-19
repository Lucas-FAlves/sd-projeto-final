export type ExamResults = {
  id: string;
  exam: Exam;
  results: ExamResult[];
};

export type Exam = {
  id: string;
  name: string;
  date: string;
};

export type ExamResult = {
  candidate: Candidate;
  grade: number;
};

export type Candidate = {
  id: string;
  name: string;
  email: string;
};
