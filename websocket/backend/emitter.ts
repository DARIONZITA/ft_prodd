import type { Server }                  from 'socket.io';
import type { ServerToClientEvents,
    ClientToServerEvents, SocketData,
    NotificationPayload }               from '../types';

type IO = Server<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>;

let _io : IO;

export function initEmitter( io : IO ) { _io = io; }

export const    wsEmitter = {

    //-------------------------------------------------Presença--------------------------------------------------------------------------

    userOnline( userId : number, username : string, avatarUrl : string, workspaceIds : number[], friendIds : number[])
    {
        const   payload = { userId, username, avatarUrl };

        for (const wId of workspaceIds)
            _io.to(`workspace:${wId}`).except(`user:${userId}`).emit('presence:online', { ...payload, workspaceId: wId });

        for (const fId of friendIds)
            _io.to(`user:${fId}`).emit('presence:online', payload);
    },

    userOffline( userId : number, username : string, workspaceIds : number[], friendIds : number[] )
    {
        const   payload = { userId, username };

        for (const wId of workspaceIds)
            _io.to(`workspace:${wId}`).except(`user:${userId}`).emit('presence:offline', { ...payload, workspaceId: wId});

        for (const fId of friendIds)
            _io.to(`user:${fId}`).emit('presence:offline', payload);
    },

    //-------------------------------------------------Comments--------------------------------------------------------------------------

    commentNew( workspaceId : number, taskId : number, comment : unknown, authorId : number )
    {
        // .except() exclui o autor — ele já sabe que criou o comentário
        _io.to(`workspace:${workspaceId}`).except(`user:${authorId}`).emit('comment:new', { taskId, comment } );
    },

    commentUpdated( workspaceId : number, taskId : number, comment : unknown )
    {
        _io.to(`workspace:${workspaceId}`).emit('comment:updated', { taskId, comment } );
    },

    commentDeleted( workspaceId : number, taskId : number, commentId : number )
    {
        _io.to(`workspace:${workspaceId}`).emit('comment:deleted', { taskId, commentId })
    },


    //------------------------------------------------Notificações--------------------------------------------------------------------------

    notification( userId : number, payload : NotificationPayload )
    {
        _io.to(`user:${userId}`).emit('notification', { payload });
    },

    notificationRead(userId: number, notificationId: number)
    {
        _io.to(`user:${userId}`).emit('notification:read', { notificationId });
    },

    notificationReadAll(userId: number) //Não sei se esta rota é necessária, mas fica aqui para o caso de querer implementar um "Marcar todas como lidas" no futuro
    {
        _io.to(`user:${userId}`).emit('notification:read_all', {});
    },

    notificationDeleted(userId: number, notificationId: number)
    {
        _io.to(`user:${userId}`).emit('notification:deleted', { notificationId });
    },

    notificationCleared(userId: number)
    {
        _io.to(`user:${userId}`).emit('notification:cleared', {});
    },
};