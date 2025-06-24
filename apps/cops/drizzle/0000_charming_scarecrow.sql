CREATE TABLE `candidates` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `exam_results` (
	`exam_id` text NOT NULL,
	`candidate_id` text NOT NULL,
	`grade` real NOT NULL,
	`is_approved` integer DEFAULT false NOT NULL,
	`approval_rank` integer,
	PRIMARY KEY(`exam_id`, `candidate_id`),
	FOREIGN KEY (`exam_id`) REFERENCES `exams`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`candidate_id`) REFERENCES `candidates`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `exams` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`date` text NOT NULL
);
