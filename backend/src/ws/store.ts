// Socket.IO gere as rooms internamente — não precisamos de Map<workspaceId, Set<userId>>.
// Só precisamos de saber se um user tem conexões abertas (para presença online/offline).
// userId → nº de conexões activas (múltiplas abas do mesmo user)

const   connectionCount = new Map<number, number>( );

export const    presenceStore = {
    connect( userId : number ) : boolean
    {
        const   n = ( connectionCount.get( userId ) ?? 0 ) + 1;

        connectionCount.set( userId, n )
        return (n === 1); // primeira conexão → ficou online
    },

    disconnect( userId : number ) : boolean
    {
        const   n = Math.max(0, ( connectionCount.get(userId) ?? 1 ) - 1);

        if (n === 0)
        {
            connectionCount.delete(userId);
            return (true); // última conexão → ficou offline
        }
        connectionCount.set(userId, n);
        return (false);
    },

    isOnline( userId : number ) : boolean
    {
        return ((connectionCount.get(userId) ?? 0) > 0);
    },
};