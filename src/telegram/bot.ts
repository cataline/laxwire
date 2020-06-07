import { Telegraf, Telegram } from "telegraf";
import { TelegrafContext } from "telegraf/typings/context";

import botManager, { BotRecord } from "../db/bot-manager";
import slackBot from "../slack/bot";
import SlackChannel from "../slack/channel";
import { Message, Chat } from "../types";
import appLogger from "../utils/logger";
import { link, unlink } from "./middleware/link";

type Conversation = { id: string; name: string };

export default class TelegramBot {
  bot: Telegraf<TelegrafContext>;
  token: string;
  channels: Conversation[] = [];
  logger: typeof appLogger;

  isRunning = false;

  slackChannel: SlackChannel | null;

  constructor(token: string) {
    this.bot = new Telegraf(token);
    this.token = token;
    this.logger = appLogger.child({ name: "telegram", token });

    this.slackChannel = null;
  }

  get telegram(): Telegram {
    return this.bot.telegram;
  }

  async start(): Promise<void> {
    const { bot, token } = this;

    bot.command("hello", Telegraf.reply("λ"));
    bot.start(link(token));
    bot.command("stop", unlink(token));

    bot.on("message", async ({ message }) => {
      if (!message) return;

      const { text = "", from: author } = message;

      this.logger.debug({ author });

      const channel = await this.getSlackChannel();
      slackBot.post(channel, { text });
    });

    await bot.launch();
    this.isRunning = true;
  }

  async getRecord(): Promise<BotRecord> {
    const { token } = this;
    return botManager.get(token);
  }

  async getSlackChannel(): Promise<SlackChannel> {
    if (!this.slackChannel) {
      this.slackChannel = await slackBot.getChannel(await this.getRecord());
    }

    return this.slackChannel as SlackChannel;
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
