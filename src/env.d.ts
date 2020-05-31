declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: "development" | "production";
    PORT: string;
    PUBLIC_URL: string;
    SLACK_SIGNING_SECRET: string;
    SLACK_BOT_TOKEN: string;
    GOOGLE_APPLICATION_CREDENTIALS: string;
    GOOGLE_APPLICATION_URL: string;
  }
}
