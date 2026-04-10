// Declaration merging for passport's Express.User
declare global
{
	namespace Express
	{
		interface User
		{
			id: number;
			email?: string;
			nickname?: string;
			avatarUrl?: string;
		}
	}
}

export {};
