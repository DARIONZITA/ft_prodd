import { WorkspaceRole, LabelColor }	from '@prisma/client';

// Declaration merging
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
				avatarUrl?: string
			}

			workspace?: {
				id: number,
				name: string,
				role: WorkspaceRole
			};

			column?: {
				id: number,
				name: string
			};

			task?: {
				id: number,
				title: string,
				creatorId: number
			};

			label?: {
				id: number,
				name: string,
				color: LabelColor
			};
		}
	}
}
