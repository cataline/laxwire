import { App, LogLevel } from "@slack/bolt";

import { BotRecord } from "../db/bot-manager";
import { Message } from "../types";
import appLogger from "../utils/logger";
import SlackChannel from "./channel";
import { link, unlink } from "./middleware/link";
import { message } from "./middleware/message";

const logger = appLogger.child({ name: "slack" });

const { SLACK_BOT_TOKEN, SLACK_SIGNING_SECRET, PORT } = process.env;

const slackBot = {
  bot: new App({
    token: SLACK_BOT_TOKEN,
    signingSecret: SLACK_SIGNING_SECRET,
    logLevel: "debug" as LogLevel.DEBUG,
    logger: {
      setLevel() {
        //
      },
      setName() {
        //
      },
      getLevel() {
        return "debug" as LogLevel.DEBUG;
      },
      debug(args) {
        logger.debug({ msg: args });
      },
      error(args) {
        logger.error({ msg: args });
      },
      warn(args) {
        logger.warn({ msg: args });
      },
      info(args) {
        logger.info({ msg: args });
      },
    },
  }),

  async start(): Promise<void> {
    const { bot } = this;
    bot.command("/link_telegram_bot", link);
    bot.command("/unlink_telegram_bot", unlink);
    bot.message(message);
    await bot.start(PORT);
    logger.info("started bot");
  },

  async post(channel: SlackChannel, { text }: Message): Promise<void> {
    const {
      bot: { client },
    } = this;

    await client.chat.postMessage({
      text,
      token: SLACK_BOT_TOKEN,
      channel: channel.id,
      as_user: true,
    });
  },

  async getChannel(record: BotRecord): Promise<SlackChannel> {
    const {
      bot: { client },
    } = this;

    const result: any = await client.conversations.info({
      token: SLACK_BOT_TOKEN,
      channel: record.slackChannelId,
    });

    return new SlackChannel(result.channel);
  },
};

export default slackBot;
