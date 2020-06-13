FROM node:14-alpine

WORKDIR /opt/laxwire

COPY . .

RUN yarn --immutable
RUN yarn build

ENTRYPOINT [ "yarn", "start" ]