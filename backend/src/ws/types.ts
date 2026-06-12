// Socket.IO é totalmente tipado com generics:
// Server<ClientToServer, ServerToClient, ServerToServer, SocketData>
// O TypeScript garante que só emites eventos que existem, com o payload correto.

export interface    ServerToClientEvents
{
    'authenticated'         :   (data : { userId : number; workspaceIds : number[] }) => void;
    'presence:sync'         :   (data : | { type : 'workspace' ; workspaceId : number; onlineUserIds : number[] } | { type: 'friends'; onlineUserIds : number[] } ) => void;
    'presence:online'       :   (data : { userId : number; username : string; avatarUrl : string; workspaceId? : number}) => void;
    'presence:offline'      :   (data : { userId : number; username : string; workspaceId? : number}) => void;
    'comment:new'           :   (data : { taskId : number; comment : unknown }) => void;
    'comment:updated'       :   (data : { taskId : number; comment : unknown }) => void;
    'comment:deleted'       :   (data : { taskId : number; commentId : number}) => void;
    'notification'          :   (data : { payload : NotificationPayload }) => void;
    'notification:read'     :   (data: { notificationId: number }) => void;
    'notification:read_all' :   (data: Record<string, never>) => void;
    'notification:deleted'  :   (data: { notificationId: number }) => void;
    'notification:cleared'  :   (data: Record<string, never>) => void;
    'error'                 :   (data : { message : string }) => void;
};

export interface   NotificationPayload
{
    type        :   | 'mention'
                    | 'invite'
                    | 'comment'
                    | 'taskAssignment'
                    | 'taskUpdated'
                    | 'taskDeleted'
                    | 'workspaceInvite'
                    | 'friendRequest'
                    | 'friendRequestAccepted'
                    | 'friendRequestRejected'
                    | 'friendRemoved';
    //message?     :   string;
    data?       :   unknown; // payload específico do tipo (ex: o objecto FriendRequest)
    persisted?  :   unknown; // o registo Notification da DB, quando existe
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
