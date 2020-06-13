FROM node:14-alpine

WORKDIR /opt/laxwire

COPY . .

RUN yarn --frozen-lockfile --production
RUN yarn build

ENTRYPOINT [ "yarn", "start" ]