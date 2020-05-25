import { App } from "@slack/bolt";

export default function createSlackBot(): App {
  const { SLACK_BOT_TOKEN: token, SLACK_SIGNING_SECRET: signingSecret } = process.env;

  if (!token) throw new Error("SLACK_BOT_TOKEN not set");
  if (!signingSecret) throw new Error("SLACK_SIGNING_SECRET not set");

  return new App({token, signingSecret});
}
