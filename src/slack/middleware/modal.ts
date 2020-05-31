import { Middleware, SlackShortcutMiddlewareArgs } from "@slack/bolt";

export function linkTelegram(): ModalMiddleware<typeof MODALS["linkTelegram"]> {
  const view = MODALS.linkTelegram;
  return modal(view as any);
}

interface ModalMiddleware<V> {
  view: V;
  create: Middleware<SlackShortcutMiddlewareArgs>;
}

function modal<V>(view: V): ModalMiddleware<V> {
  async function create({ shortcut, ack, context, client }): Promise<void> {
    await ack();

    await client.views.open({
      token: context.botToken,
      trigger_id: shortcut.trigger_id,
      view,
    });
  }

  return { view, create };
}

const MODALS = {
  linkTelegram: {
    type: "modal",
    callback_id: "link-telegram-bot",
    title: {
      type: "plain_text",
      text: "Link telegram bot",
    },
    submit: {
      type: "plain_text",
      text: "Link",
    },
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
      {
        type: "section",
        block_id: "link-telegram-bot-channel",
        text: {
          type: "plain_text",
          text: "Conversation",
        },
        accessory: {
          action_id: "bot-channel-select",
          type: "conversations_select",
          default_to_current_conversation: true,
          placeholder: {
            type: "plain_text",
            text: "Select channel",
          },
        },
      },
    ],
  },
} as const;
