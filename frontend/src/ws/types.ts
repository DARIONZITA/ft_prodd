export type NotificationType = 'friendship' | 'workspace' | 'task' | 'mention' | 'comment' | 'invite';

export interface    ServerToClientEvents
{
    'authenticated'         :   (data : { userId : number; workspaceIds : number[] }) => void;
    'presence:sync'         :   (data : | { type : 'workspace' ; workspaceId : number; onlineUserIds : number[] } | { type: 'friends'; onlineUserIds : number[] } ) => void;
    'presence:online'       :   (data : { userId : number; username : string; avatarUrl : string; workspaceId? : number}) => void;
    'presence:offline'      :   (data : { userId : number; username : string; workspaceId? : number}) => void;
    'comment:new'           :   (data : { taskId : number; comment : unknown }) => void;
    'comment:updated'       :   (data : { taskId : number; comment : unknown }) => void;
    'comment:deleted'       :   (data : { taskId : number; commentId : number}) => void;
    'comment:typing'        :   (data : { taskId : number; userId : number; username : string; isTyping : boolean }) => void;
    'notification'          :   (data : { payload : NotificationPayload }) => void;
    'notification:read'     :   (data: { notificationId: number }) => void;
    'notification:read_all' :   (data: Record<string, never>) => void;
    'notification:deleted'  :   (data: { notificationId: number }) => void;
    'notification:cleared'  :   (data: Record<string, never>) => void;
    'error'                 :   (data : { message : string }) => void;
};

export interface   NotificationPayload
{
    type        : NotificationType;
    data?       :   unknown; // payload específico do tipo (ex: o objecto FriendRequest)
    persisted?  :   unknown; // o registo Notification da DB, quando existe
};

export interface    ClientToServerEvents
{
    'ping'  :   (callback : (res : { timestamp : string }) => void) => void;
    'comment:typing' :  (data : { workspaceId : number; taskId : number; isTyping : boolean }) => void;
};

export interface    SocketData
{
    userId?          :   number;
    username?        :   string;
    workspaceIds?    :   number[];
    friendIds?       :   number[];
};
