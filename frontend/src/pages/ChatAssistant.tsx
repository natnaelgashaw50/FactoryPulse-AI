import React, { useState, useRef, useEffect } from "react";
import client from "../api/client";
import { Send, Bot, User } from "lucide-react";

type Msg = { role: "user" | "assistant"; text: string };

export default function ChatAssistant() {
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", text: "Ask me things like \"Why did Machine 5 alarm?\" or \"What's the failure risk for CNC Mill 01?\"" },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send() {
    if (!input.trim()) return;
    const question = input;
    setMessages((m) => [...m, { role: "user", text: question }]);
    setInput("");
    setBusy(true);
    try {
      const res = await client.post("/chat", { question });
      setMessages((m) => [...m, { role: "assistant", text: res.data.answer }]);
    } catch {
      setMessages((m) => [...m, { role: "assistant", text: "Sorry, I couldn't reach the assistant service." }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col h-[70vh] bg-panel border border-border rounded">
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-2 ${m.role === "user" ? "justify-end" : ""}`}>
            {m.role === "assistant" && <Bot size={16} className="text-cyan mt-1 shrink-0" />}
            <div className={`max-w-[70%] text-sm rounded px-3 py-2 ${m.role === "user" ? "bg-cyan text-bg" : "bg-panelAlt"}`}>
              {m.text}
            </div>
            {m.role === "user" && <User size={16} className="text-muted mt-1 shrink-0" />}
          </div>
        ))}
        <div ref={endRef} />
      </div>
      <div className="p-3 border-t border-border flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Ask about a machine…"
          className="flex-1 bg-panelAlt border border-border rounded px-3 py-2 text-sm"
        />
        <button onClick={send} disabled={busy} className="bg-cyan text-bg rounded px-4 py-2">
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
