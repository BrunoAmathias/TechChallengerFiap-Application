# Usa imagem do Node
FROM node:18

# Cria diretório dentro do container
WORKDIR /app

# Copia package.json primeiro (melhor performance)
COPY package*.json ./

# Instala dependências
RUN npm install

# Copia o resto do projeto
COPY . .

# Porta da sua API
EXPOSE 3000

# Comando pra rodar
CMD ["npm", "run", "dev"]