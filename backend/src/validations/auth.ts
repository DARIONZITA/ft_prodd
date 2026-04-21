import { z } from 'zod';

/**
 * Schema de registo - validação rigorosa de tudo que vem do frontend
 * Zod faz a ponte entre runtime (segurança) e compile-time (TypeScript)
 */
 
 //Em JS/TS ':' tem significado diferente, dependendo se é um obj ou uma estrutura/classe
 //Em objs { } significa chave : valor
 //Em Classes/Structs { } significa var : tipo
 
const	username_length = { min : 3, max : 42 };
 
export const	emailSchema = z.object(
{
	email: z
		.string()
		.min(1, 'Email cannot be empty')
		.email('Invalid Email')
		.max(256, 'Email too long')

});

export const	signupUsernameSchema = z.object(
{
	username: z
		.string()
		.min(1, 'Username cannot be empty')
		.min(username_length.min, `Username must be at least ${username_length.min} characters`)
		.max(username_length.max, `Username too long, it can have up to ${username_length.max} characters`)
		.regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain alphanumeric characters and '_', '-'")
 		/*O regex diz ^ do início da string
 		[ ] define o range ou os valores permitidos
 		+ pelo menos um caractere ou seja >= 1
 		$ até ao final da string, para uma validação completa e não parcial
 		*/
});

export const	signinUsernameSchema = z.object(
{
	username: z
		.string()
		.min(1, 'Username cannot be empty')
		.max(username_length.max, `Username too long, it can have up to ${username_length.max} characters`)
		.regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain alphanumeric characters and '_', '-'")

});

export const	passwordSchema = z.object(
{
	password: z
		.string()
		.min(1, 'Password cannot be empty')
		.min(8, "Password must be at least 8 characters")
		.max(128, "Password too long, it can have up to 128 characters")
		.regex(/[a-z]/, "Password must contain a lowercase letter")
		.regex(/[A-Z]/, "Password must contain a uppercase letter")
		.regex(/[0-9]/, "Password must contain a number")
		.regex(/[^a-zA-Z0-9]/, "Password must contain a special character")

});

 export const	signupSchema = z.object(
 {
 	username: signupUsernameSchema.shape.username,

 	email: emailSchema.shape.email,

	password: passwordSchema.shape.password,

	avatarUrl: z
		.string()
		.url("Invalid URL")
		.optional()
		.or( z.literal('') ),
 
 });
 
export const	signinSchema = z.object(
{
	identifier: signinUsernameSchema.shape.username.or( emailSchema.shape.email ),

	password: passwordSchema.shape.password,

});

/*
export type	RegisterInput = z.infer<typeof registerSchema>;
export type	LoginInput = z.infer<typeof loginSchema>;
*/

/*
Retorno do safeParse em caso de erro, é mais ou menos isto, ou seja um objeto com success: false, e um array de issues com as mensagens de erro detalhadas:
{
	success: false,
	error: {
		issues: [
			{ message: "At least 8 characters" },
			{ message: "Must contain an uppercase letter" },
			...
		]
	}
}
 */
