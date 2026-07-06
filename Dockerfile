FROM node:20-alpine

RUN apk add --no-cache git

RUN git config --global user.email "autodeploy@local" && \
    git config --global user.name "AutoDeploy"

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 3000

VOLUME ["/app/data"]

CMD ["node", "server.js"]
