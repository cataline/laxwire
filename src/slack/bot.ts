import { App, LogLevel } from "@slack/bolt";

import { BotRecord } from "../db/bot-manager";
import { Message } from "../types";
import SlackChannel from "./channel";
import { link, unlink } from "./middleware/link";

const { SLACK_BOT_TOKEN, SLACK_SIGNING_SECRET, PORT } = process.env;

const slackBot = {
  bot: new App({
    token: SLACK_BOT_TOKEN,
    signingSecret: SLACK_SIGNING_SECRET,
    logLevel: "debug" as LogLevel,
  }),

  async start(): Promise<void> {
    const { bot } = this;
    bot.command("/link_telegram_bot", link);
    bot.command("/unlink_telegram_bot", unlink);
    await bot.start(PORT);
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

    console.log(result);

    return new SlackChannel(result.channel);
  },
};

export default slackBot;
