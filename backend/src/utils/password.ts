import bcrypt from 'bcryptjs';

export const	hashPassword = async ( password : string ) : Promise<string> => {
	const salt = await bcrypt.genSalt(12);

	return (bcrypt.hash(password, salt));
};

export const	comparePassword = async ( password: string, hashed: string ): Promise<boolean> => {
	return (bcrypt.compare(password, hashed));
};


/*
1 - .genSalt( ) internamente

	1. Gera bytes aleatórios → exemplo: 16 bytes
	2. Formata no padrão bcrypt: $2b$12$<22 caracteres base64 do salt>
	   - $2b$ → versão do algoritmo
	   - 12   → cost factor (2^12 rounds)
	   - <salt> → 22 caracteres aleatórios
	3. Retorna o salt como string
           - Ex: $2b$12$KIXmQq3oe1Lx5dP5XzK2he

2 - para gerar o .hash( )

	password + salt
	       ↓
	bcrypt aplica 2^12 rounds de mistura criptográfica
	       ↓
	resultado = hash criptográfico
	       ↓
	string final = $2b$12$KIXmQq3oe1Lx5dP5XzK2he + hash

	Ex: $2b$12$KIXmQq3oe1Lx5dP5XzK2he8fGxS1y7R2kLZq0fXn9qUO1v0WlPZq
3 - para .compare( inputPassword, hashFromDB )

	1. extrai salt do hash
	2. recalcula hash para a inputPassWord com o salt extraido
	3. compara
	4. retorna true/false 

*/
