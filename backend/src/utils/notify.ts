import { NotificationType } from '@prisma/client'
import { prisma }           from "../lib/prisma";
import { wsEmitter }        from "../ws/emitter";

interface   NotifyParams
{
    userIds                 : number[];
    message                 : string;
    type                    : NotificationType;
    relatedTaskId?          : number;
    relatedWorkspaceId?     : number;
    data?                   : unknown; // payload específico do tipo (ex: o objecto FriendRequest)
};

// Helper que cria a notificação na DB E emite via WebSocket num só passo.
// Assim qualquer rota notifica com uma linha: await notify({ ... })

export async function   notify( params: NotifyParams, client : any, excludeUserIds? : Set<number>, add_to_set? : boolean )
{
    for (const id of params.userIds)
    {
        if (excludeUserIds?.has(id))
            continue;

        if (add_to_set)
            excludeUserIds?.add(id); // Evita notificações duplicadas se houver ids repetidos

        const notifications = await client.notification.create(
        {
            data:
            {
                userId:                 id,
                message:                params.message,
                type:                   params.type
            },
        });
        wsEmitter.notification(id, { type: params.type, data: params.data, persisted: notifications } );
    }
}
