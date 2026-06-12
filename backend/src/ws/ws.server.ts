import { Server, Socket }               from 'socket.io';
import { Server as HttpServer }         from 'http';
import { verifyToken }                  from '../utils/jwt';
import { prisma }                       from '../lib/prisma';
import { presenceStore }                from './store';
import { wsEmitter, initEmitter }       from './emitter';
import { env }                          from '../config/env';
import type { ServerToClientEvents, SocketData, ClientToServerEvents } from './types';


//----------------------------------Tipos---------------------------------------


// Definir aqui evita repetir os 4 generics em todo o lado.
// IO       → o servidor Socket.IO tipado
// AppSocket → um socket individual tipado (usado nos handlers)

type    IO = Server<ClientToServerEvents,  ServerToClientEvents, Record<string, never>, SocketData>;
type    AppSocket = Socket<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>;

//-------------------------------------------Helpers------------------------------------------------

export async function   getFriendAndWorkspaceMembersIds( userId : number ) : Promise<{ workspaceIds: number[], friendIds: number[] }>
{
    const   [ workspaceMembers, friendRequests ] = await Promise.all(
    [
        prisma.workspaceMember.findMany(
        {
            where: { userId },
            select: { workspaceId: true },
        }),
        prisma.friendRequest.findMany(
        {
            where:
            {
                status: 'accepted',
                OR : [{senderId: userId}, {receiverId: userId}]
            },
            select: { senderId: true, receiverId: true },
        }),
    ]);
    return ({ workspaceIds: workspaceMembers.map( m => m.workspaceId ),
              friendIds:    friendRequests.map(r => r.senderId === userId ? r.receiverId : r.senderId) });
}

//-------------------------------------------Setup------------------------------------------------

// ExtendedError do Socket.IO aceita qualquer Error — usamos Error base para simplicidade.

async function  authWebSocket( socket : AppSocket, next : ( err? : Error ) => void)
{
    const   token = socket.handshake.auth?.token;

    if (!token || typeof token !== 'string')
        return (next( new Error("Missing or Invalid Token")));

    try
    {
        const   { id: userId } = verifyToken(token);

        const   [ user, memberships, friendIds ] = await Promise.all(
        [
            prisma.user.findUnique(
            {
                where: { id: userId },
                select: { id: true, username: true, avatarUrl: true },
            }),
            prisma.workspaceMember.findMany(
            {
                where: { userId },
                select: { workspaceId: true },
            }),
            prisma.friendRequest.findMany(
            {
                where:
                {
                    status: 'accepted',
                    OR : [{senderId: userId}, {receiverId: userId}]
                },
                select: { senderId: true, receiverId: true },
            }),
        ]);

        if (!user)
            return (next( new Error('User not found')));

        // Persiste dados no socket — acessíveis em todos os handlers via socket.data
        socket.data.userId = userId;
        socket.data.workspaceIds = memberships.map( m => m.workspaceId );
        socket.data.friendIds = friendIds.map(r => r.senderId === userId ? r.receiverId : r.senderId);

        next( );
    }
    catch ( err )
    {
        console.error('[Socket.IO Auth Error]:', err);
        next( new Error( 'Invalid or expired token' ));
    }
}

export function   setupSocketIO( server : HttpServer ) : IO
{
    const   io : IO = new Server( server,
    {
        cors:
        {
            origin: env.FRONTEND_URL,
            credentials: true,
        },
        // Socket.IO envia um ping a cada 25s.
        // Se não receber pong em 20s adicionais → considera a conexão morta.
        pingInterval: 25000,
        pingTimeout: 20000,
    });

    initEmitter( io );

    // ── Middleware de autenticação ─────────────────────────────────────────
    // Corre ANTES de qualquer 'connection' ser emitido.
    // O cliente envia o token no handshake:
    //   const socket = io(URL, { auth: { token: 'eyJ...' } })
    // Se next(new Error(...)) → socket nunca chega ao handler 'connection'.
    io.use( authWebSocket );

    io.on( 'connection', ( socket : AppSocket ) =>
    {
        // SocketData tem campos opcionais mas aqui SABEMOS que estão preenchidos
        // (o middleware garantiu-o). Usamos asserção para evitar verificações redundantes.

        const   userId = socket.data.userId             as number;
        const   workspaceIds = socket.data.workspaceIds as number[];
        const   friendIds = socket.data.friendIds       as number[];

        console.log(`[WS] User ${userId} connected — socket ${socket.id}`);

        // ── Entrar nas rooms ───────────────────────────────────────────────
        // user:N  → room privada (notificações, mensagens directas)
        // workspace:N → room do workspace (broadcast de tasks, comentários, presença)

        void socket.join(`user:${userId}`);
        for (const wId of workspaceIds)
            void socket.join(`workspace:${wId}`);

        // ── Confirmação ao cliente ─────────────────────────────────────────

        socket.emit('authenticated', { userId, workspaceIds });

        // ── Snapshot de presença ───────────────────────────────────────────
        // fetchSockets() é async → IIFE para não tornar o handler 'connection' async
        // (io.on não espera por Promises — torná-lo async silencia erros sem os tratar)

        void ( async ( ) =>
        {
            for (const wId of workspaceIds)
            {
                const   sockets = await io.in(`workspace:${wId}`).fetchSockets( );

                // s.data.userId pode ser undefined (campo opcional no SocketData)
                // O type guard `(id): id is number => typeof id === 'number'`
                // estreita o tipo de (number | undefined)[] para number[]

                const   onlineUserIds = [
                    ...new Set(
                        sockets.map( s => s.data.userId )
                        .filter((id): id is number => typeof id === 'number')
                    ),
                ];

                socket.emit('presence:sync', { type: 'workspace', workspaceId: wId, onlineUserIds });
            }
            socket.emit('presence:sync', { type: 'friends', onlineUserIds: friendIds.filter( id => presenceStore.isOnline( id ) ) });
        })();

        // ── Presença: notifica outros se é a 1ª conexão deste user ─────────

        if (presenceStore.connect( userId ))
        {
            void prisma.user
            .findUnique( { where: { id: userId }, select: { username: true, avatarUrl: true } } )
            .then( user =>
            {
                if (user)
                    wsEmitter.userOnline( userId, user.username, user.avatarUrl, workspaceIds, friendIds );
            });
        }

        // ── Ping aplicacional ──────────────────────────────────────────────
        // O Socket.IO já tem o seu próprio heartbeat (pingInterval/pingTimeout).
        // Este ping é opcional — serve para o cliente medir latência com ack callback.

        socket.on('ping', (callback : ( res : { timestamp : string } ) => void) =>
        {
            if (typeof callback === 'function')
                callback( { timestamp: new Date().toISOString() } );
        });

        // ── Desconexão ─────────────────────────────────────────────────────
        // 'disconnect' corre após o socket sair de todas as rooms automaticamente.

        socket.on( 'disconnect', (reason : string) =>
        {
            console.log(`[WS] User ${userId} disconnected — ${reason}`);

            //Se for a última conexão → ficou offline, e a funcao retorna true
            if (presenceStore.disconnect( userId ))
            {
                void prisma.user
                .findUnique( { where: { id: userId }, select: { username: true } })
                .then( user =>
                {
                    if (user)
                        wsEmitter.userOffline( userId, user.username, workspaceIds, friendIds );
                });
            }
        });
    });

    console.log('[WS] Socket.IO ready');
    return (io);
}