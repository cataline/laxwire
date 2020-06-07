import { Middleware, SlackCommandMiddlewareArgs } from "@slack/bolt";

import botManager from "../../db/bot-manager";
import TelegramBot from "../../telegram/bot";

export const link: Middleware<SlackCommandMiddlewareArgs> = async ({
  ack,
  respond,
  payload: {
    channel_id: slackChannelId,
    team_domain: team,
    text: telegramToken,
    channel_name: channel,
  },
}) => {
  if (!telegramToken) {
    await ack({
      text:
        "Oops! You didn't paste your telegram token :(\nLet's try this again.\n" +
        "Command should look like this: `/link 1002003000:31415FooBarr-AAABBBCcCDDDeeeFFFGGGh`",
      mrkdwn: true,
    });

    return;
  }

  await ack();

  let telegramBot: TelegramBot;

  try {
    telegramBot = await botManager.start(telegramToken);
    const { username } = await telegramBot.telegram.getMe();

    const { telegramChatId } = await botManager.link({
      telegramToken,
      slackChannelId,
    });

    if (telegramChatId) {
      telegramBot.post(
        { id: telegramChatId },
        { text: `Linked with ${team}.slack.com #${channel}. Awesome!` }
      );

      await respond({
        text: `Done! Linked with @${username}. Eavesdropin' time.`,
      });
    } else {
      await respond({
        text: `Half done linking! Don't forget to /start @${username} in Telegram now.`,
      });
    }
  } catch (e) {
    await respond({
      text: `Uh-oh. Telegram knows nothing about this bot. Are you sure the token is correct?`,
    });
    return;
  }

  // TODO: handle errors
  // what if token is incorrect
  // what if bot does not exist
};

export const unlink: Middleware<SlackCommandMiddlewareArgs> = async ({
  ack,
  respond,
  payload: { channel_id: slackChannelId, channel_name: channel },
}) => {
  await ack();

  try {
    const record = await botManager.unlink({ slackChannelId });
    await botManager.stop(record.telegramToken);
    await respond({
      text: `Unlinked from #${channel}. No more peepin'.`,
    });
  } catch (e) {
    await respond({
      text: `Something went wrong. Try again?`,
    });
    return;
  }
};
