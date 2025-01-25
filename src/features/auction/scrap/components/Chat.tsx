"use client";

import StyledMarkdown from "@/components/StyledMarkdown";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { type Message, useChat } from "ai/react";
import {
  Loader2,
  Maximize2,
  MessageCircle,
  Minimize2,
  PlusCircle,
  Trash2,
  X,
} from "lucide-react";
import { type KeyboardEvent, useEffect, useRef, useState } from "react";

export default function Chat({ scrapId }: { scrapId: number }) {
  const [isOpen, setIsOpen] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [maximize, toggleMaximize] = useState(false);
  const {
    isLoading,
    messages,
    setMessages,
    input,
    handleInputChange,
    handleSubmit,
  } = useChat({
    api: `/api/lot/${scrapId}/chat`,
    body: {
      scrapId,
    },
  });

  const onRemove = (index: number) => {
    setMessages(messages.slice(0, index));
  };
  const toggleChat = () => setIsOpen(!isOpen);
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && e.shiftKey && !isLoading) {
      e.preventDefault();
      handleSubmit();
    }
  };

  let chatWidth = "w-[500px]";
  let chatHeight = "h-[600px]";
  if (maximize) {
    chatWidth = "w-[800px]";
    chatHeight = "h-[800px]";
  }

  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector(
        "[data-radix-scroll-area-viewport]",
      ) as HTMLDivElement;
      if (scrollElement && !isLoading) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [messages, isLoading]);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isOpen && (
        <Button
          onClick={toggleChat}
          className="rounded-full w-12 h-12 shadow-lg"
        >
          <MessageCircle />
        </Button>
      )}
      {isOpen && (
        <div
          className={`bg-white rounded-lg shadow-xl ${chatWidth} ${chatHeight} flex flex-col`}
        >
          <div className="flex justify-between items-center px-4 border-b">
            <h3 className="font-semibold">Chat</h3>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMessages([])}
                title="Iniciar novo chat"
              >
                <PlusCircle className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={(_) => toggleMaximize(!maximize)}
              >
                {!maximize ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </Button>
              <Button variant="ghost" size="icon" onClick={toggleChat}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <ScrollArea ref={scrollAreaRef} className="flex-grow p-4 h-80">
            <div className="space-y-4">
              <Messages messages={messages} onRemove={onRemove} />
            </div>
          </ScrollArea>
          <form onSubmit={handleSubmit} className="p-4 border-t">
            <div className="flex flex-col gap-2">
              <Textarea
                placeholder="Digite sua mensagem..."
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                className="resize-none"
                rows={3}
              />
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                      <span>Aguarde a resposta...</span>
                    </div>
                  ) : (
                    "Pressione Shift+Enter para enviar"
                  )}
                </span>
                <Button type="submit" disabled={isLoading}>
                  Enviar
                </Button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function Messages({
  messages,
  onRemove,
}: {
  messages: Message[];
  onRemove: (index: number) => void;
}) {
  return messages
    .filter((m) => m.content)
    .map((message, index) => (
      <Message
        key={message.id}
        message={message}
        remove={() => onRemove(index)}
      />
    ));
}

function Message({
  message,
  remove,
}: {
  message: Message;
  remove: () => void;
}) {
  const [isOnHover, setIsOnHover] = useState(false);
  return (
    <div
      className={`flex gap-2 items-center ${message.role === "user" ? "justify-end" : "justify-start"}`}
      onMouseEnter={() => setIsOnHover(true)}
      onMouseLeave={() => setIsOnHover(false)}
    >
      {message.role === "user" && isOnHover && (
        <div className="flex justify-end">
          <Trash2 className="h-3 w-3 cursor-pointer" onClick={() => remove()} />
        </div>
      )}
      <div className="max-w-[80%]">
        <div
          className={`rounded-lg p-3 break-words ${
            message.role === "user" ? "bg-blue-100" : "bg-gray-100"
          }`}
        >
          <StyledMarkdown>{message.content}</StyledMarkdown>
        </div>
      </div>
    </div>
  );
}
