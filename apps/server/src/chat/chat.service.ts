import { MESSAGE_MAX_LENGTH, type ChatMessage } from "@pulse-chat/contracts";

export type IdFactory = (prefix: string) => string;
export type Clock = () => string;

export type CreateMessageInput = {
  readonly userId: string;
  readonly username: string;
  readonly body: string;
};

export type CreateMessageResult =
  | {
      readonly ok: true;
      readonly message: ChatMessage;
    }
  | {
      readonly ok: false;
      readonly code: "MESSAGE_TOO_LONG";
      readonly message: string;
    };

export type ChatService = {
  readonly createMessage: (input: CreateMessageInput) => CreateMessageResult;
  readonly getHistory: () => readonly ChatMessage[];
  readonly clear: () => void;
};

export type ChatServiceOptions = {
  readonly historyLimit: number;
  readonly createId: IdFactory;
  readonly now: Clock;
};

export const createChatService = ({
  historyLimit,
  createId,
  now,
}: ChatServiceOptions): ChatService => {
  const messages: ChatMessage[] = [];

  const createMessage = (input: CreateMessageInput): CreateMessageResult => {
    const body = input.body.trim();

    if (body.length > MESSAGE_MAX_LENGTH) {
      return {
        ok: false,
        code: "MESSAGE_TOO_LONG",
        message: "Message is too long.",
      };
    }

    const message: ChatMessage = {
      id: createId("msg"),
      userId: input.userId,
      username: input.username,
      body,
      sentAt: now(),
    };

    messages.push(message);

    if (messages.length > historyLimit) {
      messages.splice(0, messages.length - historyLimit);
    }

    return {
      ok: true,
      message,
    };
  };

  return {
    createMessage,
    getHistory: () => [...messages],
    clear: () => {
      messages.length = 0;
    },
  };
};
