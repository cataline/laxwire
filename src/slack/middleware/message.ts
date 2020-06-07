import { Middleware, SlackEventMiddlewareArgs } from "@slack/bolt";

import botManager from "../../db/bot-manager";
import logger from "../../utils/logger";

export const message: Middleware<SlackEventMiddlewareArgs<"message">> = async ({
  message,
  payload: { channel },
}) => {
  const {
    telegramChatId,
    telegramToken,
    isLinked,
  } = await botManager.getBySlackChannelId(channel);

  if (!telegramChatId || !isLinked) {
    logger.warn({
      msg: "Telegram bot appears to be linked incorrectly",
      telegramChatId,
      isLinked,
    });
    return;
  }

  const telegramBot = await botManager.instances.get(telegramToken);

  if (!telegramBot) {
    logger.warn({
      msg: "Telegram bot does not appear to be running",
      telegramToken,
    });
    return;
  }

  await telegramBot.post({ id: telegramChatId }, { text: message.text || "" });
};
