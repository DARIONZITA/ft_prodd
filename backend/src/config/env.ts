/**
 * Importação da biblioteca Zod.
 *
 * `z` é o namespace principal.
 * A partir dele criamos schemas que descrevem:
 *  - Estrutura de dados
 *  - Tipos esperados
 *  - Regras de validação
 *  - Transformações
 */
import { z } from 'zod';


/**
 * Definição do schema que descreve a estrutura esperada
 * para as variáveis de ambiente.
 *
 * Este objeto NÃO valida ainda.
 * Apenas define as regras que serão aplicadas depois.
 */
const envSchema = z.object({

  /**
   * PORT
   *
   * Observação importante:
   * process.env sempre fornece valores como string (ou undefined).
   *
   * Etapas aplicadas:
   * 1. Exige que o valor seja string
   * 2. Define "3000" como padrão caso não exista
   * 3. Verifica se pode ser convertido para número válido
   * 4. Converte definitivamente para number
   *
   * Resultado final após parse(): tipo number
   */
  PORT: z
    .string()
    .default('3000')
    .refine( ( val ) => !isNaN( Number(val) ), { message: 'PORT deve ser um número válido' } )
    .transform( ( val ) => Number( val ) ),

  /**
   * DATABASE_URL
   *
   * Regras:
   * - Obrigatória
   * - Deve ser string
   * - Deve estar no formato válido de URL
   *
   * Nenhuma transformação é aplicada.
   * Resultado final: string
   */
  DATABASE_URL: z.string().url(),

  /**
   * JWT_SECRET
   *
   * Regras:
   * - Obrigatória
   * - Deve ser string
   * - Deve ter no mínimo 32 caracteres
   *
   * O tamanho mínimo aumenta a segurança
   * contra ataques de força bruta.
   */
  JWT_SECRET: z.string().min(32, 'JWT_SECRET precisa ter pelo menos 32 caracteres'),

  /**
   * JWT_REFRESH_SECRET
   *
   * Mesmas regras do JWT_SECRET.
   * Deve idealmente ser diferente do secret principal.
   */
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET precisa ter pelo menos 32 caracteres'),
});


/**
 * Validação efetiva.
 *
 * .parse():
 *  - Lê os valores fornecidos
 *  - Aplica defaults
 *  - Executa validações
 *  - Executa transformações
 *  - Lança erro se algo falhar
 *
 * Se ocorrer erro, a aplicação não inicia.
 * Basicamente A criação do envSchema com z.object(...) é para o .parse( process.env ), saber oque esperar e como parsear 
 */
export const	env = envSchema.parse(process.env);


/**
 * Após o parse:
 *
 * env.PORT               -> number
 * env.DATABASE_URL       -> string
 * env.JWT_SECRET         -> string
 * env.JWT_REFRESH_SECRET -> string
 *
 * O objeto final já está validado e tipado.
 * Não são necessários casts manuais.
 */