ALTER TABLE `users_table` RENAME TO `users`;--> statement-breakpoint
DROP INDEX `users_table_email_unique`;--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);