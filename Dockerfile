FROM node:14.4-alpine

WORKDIR /opt/laxwire

COPY . .

RUN apk add --no-cache git
RUN yarn --immutable
RUN yarn build

CMD [ "yarn", "start" ]