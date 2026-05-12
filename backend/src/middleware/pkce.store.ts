import crypto from 'crypto';

// Em produção usa Redis. Para desenvolvimento, Map em memória serve.
// O state expira em 10 minutos — tempo suficiente para o utilizador fazer login.
interface   PKCEEntry
{
    codeVerifier : string;
    expiresAt    : number;
}

const   store = new Map<string, PKCEEntry>( );

const   PKCE_EXPIRATION_TIME = 10 * 60_000; // 10 minutos

//Limpeza periódica para não acumular entradas expiradas
setInterval( ( ) => {
    const   now = Date.now();

    for ( const [ key, value ] of store.entries() )
    {
        if (value.expiresAt < now)
            store.delete( key );
    }
}, 60_000);

export const    pkceStore = {
    /**
     * Gera um par (state, codeVerifier) e guarda-os associados.
     * O state vai para o URL de redirect
     * O codeVerifier fica guardado no servidor - NUNCA vai para o cliente
    */
   generate( ) : { state : string; codeChallenge : string }
   {
        // code_verifier : string aleatória entre 43 à 128 chars (specificado RFC 7636)
        const   codeVerifier = crypto.randomBytes( 64 ).toString( 'base64url' );

        // code_challenge : BASE64URL(SHA256(code_verifier))
        const   codeChallenge = crypto.createHash( 'sha256' ).update( codeVerifier ).digest( 'base64url' );

        // state : string aleatória/token opaco para associar o callback ao pedido original
        const   state = crypto.randomBytes( 32 ).toString( 'base64url' );

        store.set( state, {
            codeVerifier,
            expiresAt: Date.now() + PKCE_EXPIRATION_TIME
        });
        return ({ state, codeChallenge });
    },

    /**
     * Valida o state recebido no callback e retorna o codeVerifier associado.
     * Retorna null se o state for inválido ou expirado.
     * Elimina a entrada após validação para evitar reutilização(one-time use).
    */
    consume( state : string ) : string | null
    {
        const   entry = store.get( state );

        store.delete( state ); // One-time use: remove a entrada imediatamente

        if ( !entry || entry.expiresAt < Date.now())
            return (null);

        return (entry.codeVerifier);
    },
};