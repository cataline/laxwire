export default class SlackChannel {
  id: string;
  name: string;

  constructor({ id, name }: SlackChannel) {
    this.id = id;
    this.name = name;
  }
}
