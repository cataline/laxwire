import { Middleware } from "telegraf";
import { TelegrafContext } from "telegraf/typings/context";

import botManager from "../../db/bot";
import appLogger from "../../utils/logger";

const logger = appLogger.child({ name: "telegram" });

export function linkToSlack(
  telegramToken: string
): Middleware<TelegrafContext> {
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
      const record = await botManager.findByTelegramToken(telegramToken);
      const updated = await botManager.update(record.slackToken, {
        telegramChatId: `${chat.id}`,
        isLinked: true,
      });

      await botManager.start(telegramToken);

      await reply(
        `Integrated chat #${chat.id} with Slack channel #${updated.slackChannel}.`,
        { reply_to_message_id: message?.message_id }
      );
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

export function unlinkFromSlack(
  telegramToken: string
): Middleware<TelegrafContext> {
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
      const record = await botManager.findByTelegramToken(telegramToken);
      await botManager.update(record.slackToken, {
        telegramToken: null,
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
