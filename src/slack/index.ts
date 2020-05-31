import { App } from "@slack/bolt";
import { Chat, Message, BotArgs } from "../types";
import appLogger from "../utils/logger";
import Store from "../db/store";
import { linkTelegram } from "./middleware/modal";
import TelegramBot from "../telegram";
import noop from "../utils/noop";

interface SlackBotArgs extends BotArgs {
  port: string;
  signingSecret: string;
}
export default class SlackBot {
  bot: App;
  token: string;
  port: string;
  store: Store;
  url: string;
  logger: typeof appLogger;

  constructor({ store, url, port, token, signingSecret }: SlackBotArgs) {
    const logger = appLogger.child({ name: "slack" });
    this.logger = logger;
    this.token = token;
    this.url = url;
    this.port = port;
    this.store = store;
    this.bot = new App({
      token,
      signingSecret,
      logger: {
        debug: (msg, ...payload) => logger.debug({ msg, ...payload }),
        info: (msg, ...payload) => logger.info({ msg, ...payload }),
        error: (msg, ...payload) => logger.error({ msg, ...payload }),
        warn: (msg, ...payload) => logger.warn({ msg, ...payload }),
        getLevel: () => this.logger.level as any,
        setLevel: noop,
        setName: noop,
      },
    });
  }

  async start(): Promise<void> {
    const { bot, store, port, url } = this;

    const {
      create,
      view: {
        callback_id: modelId,
        blocks: [input, select],
      },
    } = linkTelegram();

    bot.shortcut("link_global", create);

    bot.view(modelId, async ({ ack, view, payload, ...rest }) => {
      const { values } = view.state;

      this.logger.info({ rest });

      if (!values[select.block_id]) {
        await ack({
          response_action: "errors",
          errors: { [input.block_id]: "Please select conversation below" },
        });
        return;
      }

      await ack();

      const token = values[input.block_id][input.element.action_id];
      const channel = values[select.block_id][select.accessory.action_id];

      const saved = await store.db.collection("bot").add({
        telegramToken: token,
        telegramChatId: null,
        slackChannel: channel,
        slackTeamId: payload.team_id,
      });

      const telegram = new TelegramBot({ token, store, url });
      await telegram.start();

      await telegram.bot.start(async ({ chat }) => {
        if (!chat) return;

        await saved.update({ telegramChatId: chat.id });

        await telegram.post(chat, {
          text: `Integrated with Slack channel ${channel}`,
        });
      });
    });

    await bot.start(port);
  }

  async post(channel: Chat, { text }: Message): Promise<void> {
    const {
      token,
      bot: { client },
    } = this;

    await client.chat.postMessage({
      text,
      token,
      channel: channel.id,
    });
  }
}
