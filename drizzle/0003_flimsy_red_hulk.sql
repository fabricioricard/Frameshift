CREATE TABLE `liveStreams` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`thumbnailUrl` text,
	`streamUrl` text NOT NULL,
	`status` enum('scheduled','live','ended') NOT NULL DEFAULT 'scheduled',
	`viewers` int NOT NULL DEFAULT 0,
	`startedAt` timestamp,
	`endedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `liveStreams_id` PRIMARY KEY(`id`)
);
