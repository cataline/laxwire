import appLogger from "../../utils/logger";
import { CONVERSATION_SELECT } from "./select-conversation";
import botManager from "../../db/bot";
import {
  ViewSubmitAction,
  Middleware,
  SlackViewMiddlewareArgs,
} from "@slack/bolt";

const logger = appLogger.child({ name: "slack" });

export const submitTokenModal: Middleware<SlackViewMiddlewareArgs<
  ViewSubmitAction
>> = async ({
  ack,
  view,
  payload: { team_id: slackTeamId },
  context: { botToken },
}): Promise<void> => {
  const { values } = view.state;

  await ack();

  logger.info({ msg: "submit bot token modal", botToken, values });

  const telegramToken = values?.[blockId]?.[actionId]?.value;

  if (!telegramToken) throw new Error("telegram token not received");

  await botManager.start(telegramToken);

  await botManager.update(botToken, {
    telegramToken,
    slackTeamId,
    isLinked: true,
  });
};

export async function openTokenModal({
  shortcut,
  ack,
  context,
  client,
}): Promise<void> {
  await ack();

  await client.views.open({
    token: context.botToken,
    trigger_id: shortcut.trigger_id,
    view: TOKEN_MODAL as any,
  });
}

export const TOKEN_MODAL = {
  type: "modal",
  callback_id: "link-telegram-bot",
  title: { type: "plain_text", text: "Link telegram bot" },
  submit: { type: "plain_text", text: "Link" },
  blocks: [
    {
      type: "input",
      block_id: "link-telegram-bot-token",
      label: {
        type: "plain_text",
        // TODO: explain how to create a bot
        text: "Paste the token you got from BotFather",
      },
      element: {
        type: "plain_text_input",
        action_id: "bot-token-value",
        placeholder: {
          type: "plain_text",
          text: "1002003000:31415FooBarr-AAABBBCcCDDDeeeFFFGGGh",
        },
      },
    },
    CONVERSATION_SELECT,
  ],
} as const;

const {
  block_id: blockId,
  element: { action_id: actionId },
} = TOKEN_MODAL.blocks[0];
