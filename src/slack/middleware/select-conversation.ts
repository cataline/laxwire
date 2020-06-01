import appLogger from "../../utils/logger";
import botManager from "../../db/bot";
import {
  SlackActionMiddlewareArgs,
  BlockConversationsSelectAction,
  Middleware,
} from "@slack/bolt";

const logger = appLogger.child({ name: "slack" });

export const selectConversation: Middleware<SlackActionMiddlewareArgs<
  BlockConversationsSelectAction
>> = async ({ ack, action, context: { botToken } }): Promise<void> => {
  if (action.type !== CONVERSATION_SELECT.accessory.type) return;

  const { selected_conversation: channel } = action;

  logger.info("selecting channel %s", channel);

  await ack();

  await botManager.add({
    telegramToken: null,
    telegramChatId: null,
    slackChannel: channel,
    slackTeamId: null,
    slackToken: botToken,
    isLinked: false,
  });
};

export const CONVERSATION_SELECT = {
  type: "section",
  block_id: "token-conversation-select",
  text: { type: "plain_text", text: "Conversation" },
  accessory: {
    action_id: "bot-conversation-select",
    type: "conversations_select",
    placeholder: { type: "plain_text", text: "Select channel" },
  },
} as const;
