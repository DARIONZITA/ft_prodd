import { User } from '@prisma/client';
import express from 'express';

//Declaration merging
declare global
{
	namespace	Express
	{
		interface	Request
		{
			user? : {
				id: number,
				email?: string,
				username?: string,
				avatarUrl?: string,
			}
		}
	}
}
