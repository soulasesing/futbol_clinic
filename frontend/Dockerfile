FROM node:20

WORKDIR /app

ENV NODE_TLS_REJECT_UNAUTHORIZED=0

COPY package.json yarn.lock* ./
RUN yarn install

COPY . .

EXPOSE 3000

CMD ["yarn", "dev"] 