import * as dotenv from "dotenv";
dotenv.config();

import "./db/store";

import botManager from "./db/bot-manager";
import slackBot from "./slack/bot";
import appLogger from "./utils/logger";

process.on("unhandledRejection", (error) => {
  appLogger.fatal({ msg: "Unhandled rejection", error });
  process.exit(1);
});

process.on("uncaughtException", (error) => {
  appLogger.fatal({ msg: "Uncaught exception", error });
  process.exit(1);
});

process.on("SIGINT", () => {
  appLogger.fatal("SIGINT, bye");
  process.exit(0);
});

(async () => {
  const {
    PUBLIC_URL: url,
    SLACK_BOT_TOKEN: token,
    SLACK_SIGNING_SECRET: signingSecret,
  } = process.env;

  if (!url) throw new Error("PUBLIC_URL should be set");
  if (!token) throw new Error("SLACK_BOT_TOKEN should be set");
  if (!signingSecret) throw new Error("SLACK_SIGNING_SECRET should be set");

  await Promise.all([slackBot.start(), botManager.reload()])
})();
