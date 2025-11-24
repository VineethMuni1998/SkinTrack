"use client";

import { useEffect, useRef, useState, type JSX } from "react";
import Image from "next/image";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const renderMessageHtml = (content: string) => {
  const OPEN = "__STRONG_OPEN__";
  const CLOSE = "__STRONG_CLOSE__";
  const injected = content
    .replace(/\*\*(.+?)\*\*/g, `${OPEN}$1${CLOSE}`)
    .replace(/<strong>/gi, OPEN)
    .replace(/<\/strong>/gi, CLOSE);

  const escaped = injected
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  const withStrong = escaped
    .replace(new RegExp(OPEN, "g"), "<strong>")
    .replace(new RegExp(CLOSE, "g"), "</strong>");

  const withBreaks = withStrong.replace(/\n/g, "<br />");
  return withBreaks;
};

const renderContentBlocks = (content: string) => {
  const lines = content
    .split(/\n+/)
    .map((l) => l.trim())
    .filter((line) => line !== "");
  const blocks: JSX.Element[] = [];
  let bulletBuffer: string[] = [];

  const flushBullets = () => {
    if (bulletBuffer.length === 0) return;
    blocks.push(
      <ul key={`ul-${blocks.length}`} className="list-disc pl-4 space-y-1">
        {bulletBuffer.map((line, idx) => (
          <li
            key={idx}
            dangerouslySetInnerHTML={{ __html: renderMessageHtml(line) }}
          />
        ))}
      </ul>
    );
    bulletBuffer = [];
  };

  lines.forEach((line) => {
    if (line.startsWith("•")) {
      bulletBuffer.push(line.replace(/^•\s*/, ""));
    } else {
      flushBullets();
      blocks.push(
        <div
          key={`p-${blocks.length}`}
          className="leading-relaxed mb-1 last:mb-0"
          dangerouslySetInnerHTML={{ __html: renderMessageHtml(line) }}
        />
      );
    }
  });
  flushBullets();
  return blocks;
};

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Hi! I'm your skincare guide. Ask me about your routine, ingredients, or what to add next.",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (open && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages, open]);

  const resetChat = () => {
    setMessages([
      {
        role: "assistant",
        content:
          "Hi! I'm your skincare guide. Ask me about your routine, ingredients, or what to add next.",
      },
    ]);
    setInput("");
  };

  const handleToggleOpen = () => {
    if (open) {
      setOpen(false);
      resetChat();
      return;
    }
    setOpen(true);
    resetChat();
  };

  const sendMessage = async () => {
    const content = input.trim();
    if (!content || loading) return;
    const nextMessages: ChatMessage[] = [...messages, { role: "user", content }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.message) {
        throw new Error(data?.error || "Chat failed");
      }
      setMessages((prev) => [...prev, { role: "assistant", content: data.message }]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I couldn't respond right now. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div
        className="fixed bottom-6 right-6 z-40 flex items-center justify-center w-14 h-14 rounded-full shadow-lg bg-purple-600 cursor-pointer hover:bg-purple-500 transition"
        onClick={handleToggleOpen}
        aria-label="Open skincare chat"
      >
        <Image
          src="/chat-bot-purple.svg"
          alt="Chat bot"
          width={32}
          height={32}
          className="w-8 h-8"
        />
      </div>
      {open && (
        <div className="fixed bottom-24 right-6 z-40 w-96 max-w-[90vw] bg-white border border-gray-200 rounded-xl shadow-2xl flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900">Skincare Chat</p>
              <p className="text-xs text-gray-500">Powered by AI, tailored to your routine</p>
            </div>
            <button
              className="text-gray-500 hover:text-gray-700"
              onClick={handleToggleOpen}
              aria-label="Close chat"
            >
              ✕
            </button>
          </div>
          <div
            ref={containerRef}
            className="flex-1 px-4 py-3 space-y-3 overflow-y-auto max-h-[400px]"
          >
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex ${
                  m.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`px-3 py-2 rounded-lg text-sm max-w-[80%] ${
                    m.role === "user"
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  <div className="space-y-1">{renderContentBlocks(m.content)}</div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="text-xs text-gray-500">Thinking...</div>
            )}
          </div>
          <div className="px-4 py-3 border-t border-gray-200">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Ask about your routine, ingredients, or what to add..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
              />
              <button
                onClick={sendMessage}
                disabled={loading}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
              >
                Send
              </button>
            </div>
            <p className="mt-2 text-[11px] text-gray-500">
              I only answer skincare questions and tailor advice to your age, skin type, and routine.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
