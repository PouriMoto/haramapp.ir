FROM node:22-alpine
WORKDIR /app
COPY package.json index.mjs ./
COPY src ./src
USER node
EXPOSE 8787
CMD ["node", "index.mjs"]
