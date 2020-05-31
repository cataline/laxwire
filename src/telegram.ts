import { Telegraf } from "telegraf";
import { TelegrafContext } from "telegraf/typings/context";
import { Message, Chat, BotArgs } from "./types";
import appLogger from "./utils/logger";
import Store from "./db/store";

type Conversation = { id: string; name: string };

export default class TelegramBot {
  bot: Telegraf<TelegrafContext>;
  token: string;
  url: string;
  store: Store;
  channels: Conversation[] = [];
  logger: typeof appLogger;

  constructor({ store, url, token }: BotArgs) {
    this.bot = new Telegraf(token);
    this.token = token;
    this.url = url;
    this.store = store;
    this.logger = appLogger.child({ name: "telegram" });
  }

  async start(): Promise<void> {
    const { bot, url, logger } = this;

    await bot.telegram.setWebhook(url);
    await bot.launch();
    logger.info("telegram bot is running");
  }

  async post(channel: Chat, { text }: Message): Promise<void> {
    const { bot } = this;

    bot.telegram.sendMessage(channel.id, text);
  }
}
