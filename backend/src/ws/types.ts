// Socket.IO é totalmente tipado com generics:
// Server<ClientToServer, ServerToClient, ServerToServer, SocketData>
// O TypeScript garante que só emites eventos que existem, com o payload correto.

export interface    ServerToClientEvents
{
    //É enviado à um cliente quando o Socket é authenticado
    'authenticated'     :   (data : { userId : number; workspaceIds : number[] }) => void;

    //É enviado à um cliente quando o Socket se connecta, e no caso lista todos os seus amigos e membros do mesmo workspace que estão online
    'presence:sync'     :   (data : | { type : 'workspace' ; workspaceId : number; onlineUserIds : number[] } | { type: 'friends'; onlineUserIds : number[] } ) => void;
    'presence:online'   :   (data : { userId : number; username : string; avatarUrl : string; workspaceId? : number}) => void;
    'presence:offline'  :   (data : { userId : number; username : string; workspaceId? : number}) => void;
    'comment:new'       :   (data : { taskId : number; comment : unknown }) => void;
    'comment:deleted'   :   (data : { taskId : number; commentId : number}) => void;
    'task:created'      :   (data : { workspaceId : number; task : unknown }) => void;
    'task:updated'      :   (data : { workspaceId : number; task : unknown }) => void;
    'task:deleted'      :   (data : { workspaceId : number; taskId : number }) => void;
    'notification'      :   (data : { notification : unknown }) => void;
    'error'             :   (data : { message : string }) => void;
};

export interface    ClientToServerEvents
{
    // Callback-based → o cliente recebe a resposta directamente, sem evento separado
    'ping'  :   (callback : (res : { timestamp : string }) => void) => void;
};

// Dados persistentes em cada socket após autenticação
export interface    SocketData
{
    userId?          :   number;
    workspaceIds?    :   number[];
    friendIds?       :   number[];
};
