FROM node:24-alpine
WORKDIR /app
COPY package.json server.mjs roster.mjs ./
USER node
EXPOSE 3100
CMD ["node", "server.mjs"]
