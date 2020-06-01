import { App, LogLevel } from "@slack/bolt";
import { Chat, Message } from "../types";
import {
  selectConversation,
  CONVERSATION_SELECT,
} from "./middleware/select-conversation";
import {
  openTokenModal,
  submitTokenModal,
  TOKEN_MODAL,
} from "./middleware/token-modal";

const { SLACK_BOT_TOKEN, SLACK_SIGNING_SECRET, PORT } = process.env;

const slackBot = {
  bot: new App({
    token: SLACK_BOT_TOKEN,
    signingSecret: SLACK_SIGNING_SECRET,
    logLevel: "debug" as LogLevel,
  }),

  async start(): Promise<void> {
    const { bot } = this;

    bot.shortcut("link_global", openTokenModal);
    bot.action(CONVERSATION_SELECT.accessory["action_id"], selectConversation);
    bot.view(TOKEN_MODAL["callback_id"], submitTokenModal);

    await bot.start(PORT);
  },

  async post(channel: Chat, { text }: Message): Promise<void> {
    const {
      bot: { client },
    } = this;

    await client.chat.postMessage({
      text,
      token: SLACK_BOT_TOKEN,
      channel: channel.id,
      as_user: true,
    });
  },
};

export default slackBot;
