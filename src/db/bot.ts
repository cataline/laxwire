import { firestore } from "firebase-admin";

import TelegramBot from "../telegram/bot";
import appLogger from "../utils/logger";
import { DoesNotExist } from "./errors";
import store from "./store";

type CollectionReference<D> = firestore.CollectionReference<D>;

const logger = appLogger.child({ name: "firebase" });

const botManager = {
  collection: store.db.collection("bot") as CollectionReference<BotRecord>,
  instances: new Map<string, TelegramBot>(),

  async get(slackToken: string): Promise<BotRecord> {
    const { collection } = this;
    const doc = await collection.doc(slackToken).get();

    if (!doc.exists) {
      throw new DoesNotExist(
        `Bot record witn Slack token ${slackToken} does not exist`
      );
    }

    return doc.data() as BotRecord;
  },

  async findAllLinked(): Promise<BotRecord[]> {
    const { collection } = this;
    const query = await collection.where("isLinked", "==", true).get();

    const docs = [...query.docs.values()];

    if (!docs.length) {
      logger.warn(`Nope, sadly no linked bots currently`);
    }

    return docs
      .map((v) => v.data())
      .filter(({ telegramToken }) => telegramToken);
  },

  async findByTelegramToken(telegramToken: string): Promise<BotRecord> {
    const { collection } = this;
    const query = await collection
      .where("telegramToken", "==", telegramToken)
      .get();

    const [doc] = [...query.docs.values()];

    if (!doc) {
      throw new DoesNotExist(
        `Bot record witn Telegram token ${telegramToken} does not exist`
      );
    }

    return doc.data();
  },

  async add(config: BotRecord): Promise<BotRecord> {
    const { collection } = this;
    await collection.doc(config.slackToken).set(config);
    logger.info({ msg: "added bot", config });
    return this.get(config.slackToken);
  },

  async update(
    slackToken: string,
    config: Partial<BotRecord>
  ): Promise<BotRecord> {
    const { collection } = this;
    const bot = await this.get(slackToken);
    await collection.doc(slackToken).set({ ...bot, ...config });
    logger.info({ msg: "updated bot", config });
    return this.get(slackToken);
  },

  async reload(): Promise<void> {
    const { instances } = this;

    await Promise.all([...instances.keys()].map((token) => this.stop(token)));

    const records = await this.findAllLinked();

    for (const { telegramToken: token } of records) {
      if (!token) continue;
      instances.set(token, new TelegramBot(token));
    }

    logger.info("reloaded active bot instances");

    await Promise.all([...instances.keys()].map((token) => this.start(token)));
  },

  async start(token: string): Promise<void> {
    const { instances } = this;
    let bot = instances.get(token);

    if (!bot) {
      bot = new TelegramBot(token);
    }

    instances.set(token, bot);
    if (bot.isRunning) return;
    await bot.start();

    logger.info({
      msg: "started bot instance",
      token,
      activeBots: [...instances.keys()],
    });
  },

  async stop(token: string): Promise<void> {
    const { instances } = this;

    const bot = instances.get(token);

    if (!bot) {
      throw new DoesNotExist(
        `Cannot stop bot with token ${token}, does not exist`
      );
    }

    instances.delete(token);
    if (!bot.isRunning) return;
    await bot.stop();

    logger.info({
      msg: "stopped bot instance",
      token,
      activeBots: [...instances.keys()],
    });
  },
};

export default botManager;

export interface BotRecord {
  slackToken: string;
  isLinked: boolean;
  telegramToken: string | null;
  telegramChatId: string | null;
  slackChannel: string | null;
  slackTeamId: string | null;
}
