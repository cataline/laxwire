import { Telegraf } from "telegraf";
import { TelegrafContext } from "telegraf/typings/context";

export default function createTelegramBot(): Telegraf<TelegrafContext> {
  const { TELEGRAM_BOT_TOKEN } = process.env;
  if (!TELEGRAM_BOT_TOKEN) throw new Error("TELEGRAM_BOT_TOKEN not set");

  return new Telegraf(TELEGRAM_BOT_TOKEN);
}
