import dotenv from "dotenv";
import createSlackBot from "./slack";
import createTelegramBot from "./telegram";

dotenv.config();

(async () => {
  const lax = createSlackBot();
  const wire = createTelegramBot();

  await lax.start(process.env.PORT);
  console.log("⚡️ Bolt app is running!");
})();
