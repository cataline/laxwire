import Store from "./db/store";

export interface Message {
  text: string;
}

export interface Chat {
  id: any;
  title?: string;
}

export interface BotArgs {
  url: string;
  token: string;
  store: Store;
}
