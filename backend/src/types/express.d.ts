import { User } from '@prisma/client';
import express from 'express';

//Declaration merging
declare global
{
	namespace	Express
	{
		interface	Request
		{
			user? : Prisma.User;
			apiUser? : { id : number, email : string, nickname : string };
		}
	}
}
