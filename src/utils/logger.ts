import * as pino from "pino";

const isDev = process.env.NODE_ENV === "development";

const appLogger = pino({
  level: isDev ? "debug" : "info",
  prettyPrint: isDev,
});

export default appLogger;
