import { Middleware } from "telegraf";
import { TelegrafContext } from "telegraf/typings/context";

import botManager from "../../db/bot-manager";
import slackBot from "../../slack/bot";
import appLogger from "../../utils/logger";

const logger = appLogger.child({ name: "telegram" });

export function link(telegramToken: string): Middleware<TelegrafContext> {
  return async (
    { chat, reply, message }: TelegrafContext,
    next: () => Promise<void>
  ): Promise<void> => {
    logger.info({ msg: "start bot", chat });
    if (!chat?.id) {
      logger.warn("no chat selected");
      return;
    }

    try {
      const record = await botManager.get(telegramToken);
      await botManager.update(record, { telegramChatId: `${chat.id}` });
      const bot = await botManager.start(record.telegramToken);
      const channel = await bot.getSlackChannel();
      const { username } = await bot.telegram.getMe();

      await reply(
        `#${channel.name} has been linked! You can start worrying about your privacy now ( ͡° ͜ʖ ͡°) `,
        { reply_to_message_id: message?.message_id }
      );

      slackBot.post(channel, {
        text: `We asked and Telegram answered. #${channel.name} and @${username} are now one. Rejoice!`,
      });
    } catch (e) {
      logger.error(e);

      await reply(
        `Something went wrong! You should first link the bot with Slack`,
        { reply_to_message_id: message?.message_id }
      );
    }

    await next();
  };
}

export function unlink(telegramToken: string): Middleware<TelegrafContext> {
  return async (
    { chat, reply, message }: TelegrafContext,
    next: () => Promise<void>
  ): Promise<void> => {
    logger.info({ msg: "stop bot", chat });

    if (!chat?.id) {
      logger.warn("no chat selected");
      return;
    }

    try {
      const record = await botManager.get(telegramToken);
      await botManager.update(record, {
        telegramChatId: null,
        isLinked: false,
      });

      await botManager.stop(telegramToken);

      await reply(
        `OK, disabled message forwarding. To reenable it, you have to link the bot via Slack shortcut.`,
        { reply_to_message_id: message?.message_id }
      );
    } catch (e) {
      logger.error(e);

      await reply(
        `Something went wrong! Chats are not linked in the first place`,
        { reply_to_message_id: message?.message_id }
      );
    }

    await next();
  };
}
