import { Telegraf } from "telegraf";
import { TelegrafContext } from "telegraf/typings/context";

import botManager, { BotRecord } from "../db/bot";
import slackBot from "../slack/bot";
import { Message, Chat } from "../types";
import appLogger from "../utils/logger";
import { linkToSlack, unlinkFromSlack } from "./middleware/link-to-slack";

type Conversation = { id: string; name: string };

export default class TelegramBot {
  bot: Telegraf<TelegrafContext>;
  token: string;
  channels: Conversation[] = [];
  logger: typeof appLogger;

  isRunning = false;

  constructor(token: string) {
    this.bot = new Telegraf(token);
    this.token = token;
    this.logger = appLogger.child({ name: "telegram", token });
  }

  async start(): Promise<void> {
    const { bot, token } = this;
    const record = await this.getRecord();

    bot.command("hello", Telegraf.reply("λ"));
    bot.start(linkToSlack(token));
    bot.command("stop", unlinkFromSlack(token));

    bot.on("message", ({ message }) => {
      const { slackChannel } = record;

      if (!message) return;
      const { text = "", from: author } = message;

      this.logger.debug({ author });

      slackBot.post({ id: slackChannel }, { text });
    });

    await bot.launch();
    this.isRunning = true;
  }

  async getRecord(): Promise<BotRecord> {
    const { token } = this;
    return botManager.findByTelegramToken(token);
  }

  async stop(): Promise<void> {
    const { bot } = this;
    this.isRunning = false;
    bot.stop();
  }

  async post(channel: Chat, { text }: Message): Promise<void> {
    const { bot } = this;
    bot.telegram.sendMessage(channel.id, text);
  }
}
