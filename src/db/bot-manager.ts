import { WhereFilterOp, CollectionReference } from "@google-cloud/firestore";

import TelegramBot from "../telegram/bot";
import appLogger from "../utils/logger";
import { DoesNotExist } from "./errors";
import store from "./store";

const logger = appLogger.child({ name: "firebase" });

type FilterArgs = [keyof BotRecord, WhereFilterOp, BotRecord[keyof BotRecord]];

const botManager = {
  collection: store.db.collection("bot") as CollectionReference<BotRecord>,
  instances: new Map<string, TelegramBot>(),

  async exists(telegramToken: string): Promise<boolean> {
    const { collection } = this;
    return (await collection.doc(telegramToken).get()).exists;
  },

  async get(telegramToken: string, strict = true): Promise<BotRecord> {
    const { collection } = this;

    const doc = await collection.doc(telegramToken).get();

    if (!doc.exists && strict) {
      throw new DoesNotExist(
        `Bot record witn Telegram token ${telegramToken} does not exist`
      );
    }

    return doc.data() as BotRecord;
  },

  async filter(...args: FilterArgs[]): Promise<BotRecord[]> {
    const { collection } = this;

    const query = await args
      .reduce(
        (c, arg) => c.where(...arg),
        collection as FirebaseFirestore.Query<BotRecord>
      )
      .get();

    const docs = [...query.docs.values()];

    return docs.map((v) => v.data());
  },

  async create(params: BotParams): Promise<BotRecord> {
    const { telegramToken } = params;
    const { collection } = this;
    await collection.doc(telegramToken).set(params);
    logger.info({ msg: "created bot", params });
    return params;
  },

  async update(
    record: BotRecord,
    params: Partial<BotParams>
  ): Promise<BotRecord> {
    const { collection } = this;
    const updated = { ...record, ...params };
    await collection.doc(record.telegramToken).set(updated);
    logger.info({ msg: "updated bot", updated });
    return updated;
  },

  async reload(): Promise<void> {
    const { instances } = this;

    await Promise.all([...instances.keys()].map((token) => this.stop(token)));

    const records = await this.filter(["isLinked", "==", true]);

    for (const { telegramToken: token } of records) {
      if (!token) continue;
      instances.set(token, new TelegramBot(token));
    }

    logger.info("reloaded active bot instances");

    await Promise.all([...instances.keys()].map((token) => this.start(token)));
  },

  async link(
    params: Pick<BotParams, "telegramToken" | "slackChannelId">
  ): Promise<BotRecord> {
    const { telegramToken } = params;
    const payload = { ...params, isLinked: true, telegramChatId: null };
    const existing = await this.get(telegramToken, false);

    const record = await (existing
      ? this.update(existing, payload)
      : this.create(payload));

    return record;
  },

  async unlink(
    params: Pick<BotParams, "telegramToken"> | Pick<BotParams, "slackChannelId">
  ): Promise<BotRecord> {
    const delta = { isLinked: false };

    if ("telegramToken" in params) {
      return this.update(await this.get(params.telegramToken), delta);
    }

    const existing = await this.filter([
      "slackChannelId",
      "==",
      params.slackChannelId,
    ]);

    if (!existing?.[0]) {
      throw new DoesNotExist(
        `Bot with slack channel id ${params.slackChannelId} does not exist`
      );
    }

    return this.update(existing[0], params);
  },

  async start(telegramToken: string): Promise<TelegramBot> {
    const { instances } = this;
    let bot = instances.get(telegramToken);

    if (!bot) {
      bot = new TelegramBot(telegramToken);
    }

    try {
      await bot.telegram.getMe();
    } catch (e) {
      throw new DoesNotExist(`Bot with token ${telegramToken} does not exist`);
    }

    instances.set(telegramToken, bot);

    if (bot.isRunning) return bot;

    await bot.start();

    logger.info({
      msg: "started bot instance",
      telegramToken,
      activeBots: [...instances.keys()],
    });

    return bot;
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

export interface BotParams {
  isLinked: boolean;
  slackChannelId: string;
  telegramToken: string;
  telegramChatId: string | null;
}

export type BotRecord = Readonly<BotParams>;
