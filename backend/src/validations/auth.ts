import { z } from 'zod';

/**
 * Schema de registo - validação rigorosa de tudo que vem do frontend
 * Zod faz a ponte entre runtime (segurança) e compile-time (TypeScript)
 */
 
 //Em JS/TS ':' tem significado diferente, dependendo se é um obj ou uma estrutura/classe
 //Em objs { } significa chave : valor
 //Em Classes/Structs { } significa var : tipo
 
 const	name_length = { min : 3, max : 30 };
 const	password_length = { min: 8, max: 128 }; 
 const	email_max_length = 255;
 
 export const	registerSchema = z.object(
 {
 	nickname: z
 		.string()
 		.min(name_length.min, `Username deve ter pelo menos ${name_length.min} caracteres`)
 		.max(name_length.max, `Username demasiado longo, só pode ter até ${name_length.max} caracteres`)
 		.regex(/^[a-zA-Z0-9_]+$/, "Username só pode conter caracteres alfanumericos e '_' "),
 		/*O regex diz ^ do início da string
 		[ ] define o range ou os valores permitidos
 		+ pelo menos um caractere ou seja >= 1
 		$ até ao final da string, para uma validação completa e não parcial
 		*/

 	email: z
	 	.string()
	 	.email('Email Inválido')
	 	.max(email_max_length, 'Email demasiado longo'),

	password: z
		.string()
		.min(password_length.min, `Password deve conter pelo menos ${password_length.min} caracteres`)
		.max(password_length.max, `Password demasiado longa, só pode ter até ${password_length.max} caracteres`),

	avatarUrl: z
		.string()
		.url("URL Inválida")
		.optional()
		.or( z.literal('') ),
		//.or() significa que se alguma validação anterior falhar
		// tem de ser pq o valor recebido é um '' caso não erro na mesma
 
 });
 
export const	loginSchema = z.object(
{
	email: z.string().email("Email Inválido"),
	password: z.string().min(1, "Password é Obrigatória")
});

/*export type	RegisterInput = z.infer<typeof registerSchema>;
export type	LoginInput = z.infer<typeof loginSchema>;*/
