FROM node:20 As development

WORKDIR /usr/src/app

COPY package*.json yarn.lock ./

RUN yarn

# RUN yarn add graphql-subscriptions

COPY prisma ./prisma/

COPY . .

# RUN  npm rebuild bcrypt --build-from-source

RUN npx prisma generate --schema=./prisma/schema-consumer.prisma



RUN yarn build


CMD ["node", "dist/apps/consumer/main"]

FROM node:20 as production

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /usr/src/app

COPY package*.json yarn.lock./

# Install dependencies using Yarn
RUN yarn install --production

COPY . .

COPY --from=development /usr/src/app/dist ./dist

CMD ["node", "dist/apps/consumer/main"]
