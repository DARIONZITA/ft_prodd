import type { Server }                      from 'socket.io';
import type { ServerToClientEvents,
    ClientToServerEvents, SocketData    }   from './types';

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
            _io.to(`user:${userId}`).emit('presence:offline', payload);
    },

    //-------------------------------------------------Comments--------------------------------------------------------------------------

    commentNew( workspaceId : number, taskId : number, comment : unknown, authorId : number )
    {
        // .except() exclui o autor — ele já sabe que criou o comentário
        _io.to(`workspace:${workspaceId}`).except(`user:${authorId}`).emit('comment:new', { taskId, comment } );
    },

    commentDeleted( workspaceId : number, taskId : number, commentId : number )
    {
        _io.to(`workspace:${workspaceId}`).emit('comment:deleted', { taskId, commentId })
    },

    //-------------------------------------------------Tasks----------------------------------------------------------------------------

    taskCreated( workspaceId : number, task : unknown )
    {
        _io.to(`workspace:${workspaceId}`).emit('task:created', { workspaceId, task });
    },

    taskUpdated( workspaceId : number, task : unknown )
    {
        _io.to(`workspace:${workspaceId}`).emit('task:updated', { workspaceId, task });
    },

    taskDeleted( workspaceId : number, taskId : number )
    {
        _io.to(`workspace:${workspaceId}`).emit('task:deleted', { workspaceId, taskId });
    },

    //-------------------------------------------------Notification----------------------------------------------------------------------------

    notification( userId : number, notification : unknown )
    {
        // user:${userId} é a room privada — só os sockets deste user a recebem
        _io.to(`user:${userId}`).emit('notification', { notification });
    },
};