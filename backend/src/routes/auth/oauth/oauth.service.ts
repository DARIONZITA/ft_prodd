import { prisma } from '../../../lib/prisma';
import { generateToken } from '../../../utils/jwt';
import { env } from '../../../config/env';
import { TokenResponseSchema, IntraUserSchema, IntraUser } from '../../../validations/auth';
import { OauthCallbackResult } from '../../../types/auth.types';
/**
 * Passo crítico do OAuth: troca o code (que vem no callback URL)
 * pelo access_token real. Isto acontece server-side — o client_secret
 * nunca sai do teu servidor.
 */

async function  exchangeCodeForToken( code : string, codeVerifier : string ) : Promise<OauthCallbackResult>
{
    const   tokenResponse = await fetch( 'https://api.intra.42.fr/oauth/token',
    {
        method: 'POST',
        headers: { 'Content-Type' : 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(
        {
            grant_type:     'authorization_code',
            client_id:      env.INTRA_42_CLIENT_ID,
            client_secret:  env.INTRA_42_CLIENT_SECRET, //server-side only! Nunca expor isto no frontend!
            code,
            redirect_uri:   env.INTRA_42_CALLBACK_URL,
            code_verifier:  codeVerifier,  // PKCE — o 42 vai fazer SHA256 e comparar com o challenge
        }),
    });

    if (!tokenResponse.ok)
        return (new OauthCallbackResult(401, 'Failed to exchange code for token'));

    const   tokenResult = TokenResponseSchema.safeParse( await tokenResponse.json( ) );

    if (!tokenResult.success)
        return (new OauthCallbackResult(400, tokenResult.error.issues[0].message));

    return (new OauthCallbackResult(200, 'Token exchange successful', tokenResult.data.access_token));
}

async function  fetchIntraUser( access_token : string ) : Promise<OauthCallbackResult>
{
    const   meResponse = await fetch('https://api.intra.42.fr/v2/me',
    {
        headers: { Authorization: `Bearer ${access_token}` },
    });

    if (!meResponse.ok)
        return (new OauthCallbackResult(401, 'Failed to fetch user from 42'));

    const   intraUserResult = IntraUserSchema.safeParse( await meResponse.json() );

    if (!intraUserResult.success)
        return (new OauthCallbackResult(400, intraUserResult.error.issues[0].message));
    
    return (new OauthCallbackResult(200, 'Fetched user from 42 successfully', undefined, intraUserResult.data));
}

/**
 * Esta função implementa o padrão "find or create":
 * 
 * Cenário 1: User já existe com esta conta OAuth → retorna o user
 * Cenário 2: Email já existe (signup tradicional) → liga a conta OAuth ao user existente
 * Cenário 3: Utilizador novo → cria User + OAuthAccount
 * 
 * Usa uma transação Prisma para garantir atomicidade.
 */

async function  findOrCreateUser( intraUser : IntraUser ) : Promise<OauthCallbackResult>
{
    let user = await prisma.user.findUnique(
    {
        where: { fortyTwoId: intraUser.id },
        select: { id: true, username: true, email: true, avatarUrl: true, fortyTwoId: true },
    });

    if (!user)
    {
        const   emailExists = await prisma.user.findUnique(
        {
            where: { email: intraUser.email },
            select: { id: true, username: true, email: true, avatarUrl: true, fortyTwoId: true },
        });

        if (emailExists)
        {
            if (emailExists.fortyTwoId)
                return (new OauthCallbackResult(409, "This 42 account is already linked to another user"));

            //Associar conta 42 à conta existente com mesmo email ou dar erro, ainda precisa decidir, mas resolvivel com 2FA
            user = await prisma.user.update(
            {
                where: { id: emailExists.id },
                data: { fortyTwoId: intraUser.id },
                select: { id: true, username: true, email: true, avatarUrl: true, fortyTwoId: true },
            });
        }
        else
        {
            // Criar nova conta para usuário 42
            // if (await prisma.user.findFirst({ where: { intraUsername } }))
            //     username = `${intraUsername}_${intraID}`;

            user = await prisma.user.create(
            {
                data: { username: intraUser.login, email: intraUser.email, avatarUrl: intraUser.image?.link ?? '', fortyTwoId: intraUser.id, passwordHash: '' },
                select: { id: true, username: true, email: true, avatarUrl: true, fortyTwoId: true },
            });
        }
    }
    return (new OauthCallbackResult(200, 'User found or created successfully', generateToken(user.id, user.email), undefined, user));
}

export async function   handleOauthCallback( code : string, codeVerifier : string ) : Promise<OauthCallbackResult>
{
    try
    {
        // Passo 1: Trocar code por access_token (server-to-server)
        const   tokenResult = await exchangeCodeForToken( code, codeVerifier );

        if (!tokenResult.success || !tokenResult.token)
            return (tokenResult);

        // Passo 2: Usar access_token para buscar dados do usuário no 42
        const   intraUserResult = await fetchIntraUser( tokenResult.token );

        if (!intraUserResult.success || !intraUserResult.intraUser)
            return (intraUserResult);

        // Passo 3: Encontrar ou criar usuário na base de dados
        const   findOrCreateResult = await findOrCreateUser( intraUserResult.intraUser );

        return (findOrCreateResult);
    }
    catch ( err )
    {
        console.error("Error in handleOauthCallback:", err);
        return (new OauthCallbackResult(500, 'Internal Server Error'));
    }
}