import { SendHorizontal } from "lucide-react";
import { type FormEvent, useState } from "react";

import { Button } from "../ui/button";
import { Input } from "../ui/input";

export type MessageInputProps = {
  readonly disabled: boolean;
  readonly onDraftChange?: (body: string) => void;
  readonly onSend: (body: string) => boolean;
};

export const MessageInput = ({ disabled, onDraftChange, onSend }: MessageInputProps) => {
  const [body, setBody] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();

    if (onSend(body)) {
      setBody("");
    }
  };

  return (
    <form
      className="flex gap-2 border-t border-line bg-paper-strong/95 px-4 py-4 shadow-sm backdrop-blur md:px-6"
      onSubmit={handleSubmit}
    >
      <Input
        aria-label="Message"
        disabled={disabled}
        maxLength={1000}
        onChange={(event) => {
          const nextBody = event.target.value;
          setBody(nextBody);
          onDraftChange?.(nextBody);
        }}
        placeholder="Write a message"
        value={body}
      />
      <Button
        aria-label="Send message"
        disabled={disabled || body.trim().length === 0}
        size="icon"
        title="Send message"
        type="submit"
      >
        <SendHorizontal className="h-4 w-4" />
      </Button>
    </form>
  );
};
