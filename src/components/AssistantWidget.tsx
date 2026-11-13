import { useEffect, useRef, useState } from "react";
import { MessageCircle, Mountain, RotateCcw, X } from "lucide-react";
import { languages, quickActionKeys, t, type Language } from "@/data/resort";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputSubmit,
} from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import type { AssistantMessage } from "@/lib/assistant-contract";

export function AssistantWidget({ openSignal = 0 }: { openSignal?: number }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState<Language>("English");
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<AssistantMessage[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState<AssistantMessage[] | null>(null);
  const abort = useRef<AbortController | null>(null);
  const tr = t(lang);
  useEffect(() => {
    if (openSignal > 0) setOpen(true);
  }, [openSignal]);
  useEffect(() => {
    abort.current?.abort();
    setMsgs([]);
    setError("");
    setRetry(null);
  }, [user?.id]);
  useEffect(() => () => abort.current?.abort(), []);

  const requestAnswer = async (history: AssistantMessage[]) => {
    if (busy) return;
    setBusy(true);
    setError("");
    setRetry(null);
    setMsgs([...history, { role: "model", text: "" }]);
    const controller = new AbortController();
    abort.current = controller;
    try {
      const response = await fetch("/api/public/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({ language: lang, messages: history.slice(-19) }),
      });
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || `Assistant unavailable (HTTP ${response.status}).`);
      }
      if (!response.body) throw new Error("No answer was received.");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let answer = "";
      let completed = false;
      try {
        while (true) {
          const { value, done } = await reader.read();
          buffer += decoder.decode(value, { stream: !done });
          let pos;
          while ((pos = buffer.indexOf("\n")) >= 0) {
            const line = buffer.slice(0, pos);
            buffer = buffer.slice(pos + 1);
            if (!line.trim()) continue;
            const event = JSON.parse(line);
            if (event.error) throw new Error(event.error);
            if (event.text) {
              answer += event.text;
              setMsgs([...history, { role: "model", text: answer }]);
            }
            if (event.done) completed = true;
          }
          if (done) break;
        }
        if (!completed) throw new Error("The answer was interrupted. Please retry.");
      } finally {
        reader.releaseLock();
      }
    } catch (failure) {
      if (controller.signal.aborted) setError("Answer stopped.");
      else {
        setError(
          failure instanceof Error
            ? failure.message
            : "The assistant is unavailable. Please retry.",
        );
        setRetry(history);
      }
    } finally {
      setBusy(false);
    }
  };
  const send = (text: string) => {
    const question = text.trim();
    if (!question || busy) return;
    setInput("");
    return requestAnswer([...msgs.filter((m) => m.text), { role: "user", text: question }]);
  };
  return (
    <>
      {!open && (
        <Button
          onClick={() => setOpen(true)}
          className="btn btn-primary fixed bottom-5 right-5 z-40 !px-5 !py-3.5 shadow-card"
          aria-label="Open AI Guest Assistant"
        >
          <MessageCircle />
          <span className="hidden sm:inline">Ask AI Assistant</span>
        </Button>
      )}
      {open && (
        <div
          role="dialog"
          aria-label="AI Guest Assistant"
          className="fixed inset-x-3 bottom-3 z-50 flex h-[min(620px,80dvh)] flex-col overflow-hidden rounded-2xl border bg-card shadow-card sm:inset-x-auto sm:right-5 sm:bottom-5 sm:w-[400px]"
        >
          <div className="flex items-center justify-between gap-2 bg-primary px-4 py-3 text-primary-foreground">
            <div className="flex min-w-0 items-center gap-2">
              <Mountain className="h-4 w-4 shrink-0" />
              <span className="truncate font-semibold">{tr.title}</span>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <select
                aria-label="Assistant language"
                value={lang}
                onChange={(e) => setLang(e.target.value as Language)}
                className="max-w-24 rounded-md bg-primary-foreground/15 px-1 py-1 text-xs text-primary-foreground"
              >
                {languages.map((l) => (
                  <option key={l} className="text-foreground">
                    {l}
                  </option>
                ))}
              </select>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setOpen(false)}
                aria-label="Close assistant"
              >
                <X />
              </Button>
            </div>
          </div>
          <Conversation className="min-h-0">
            <ConversationContent className="gap-4 text-sm">
              <p>{tr.greeting}</p>
              <div className="flex flex-wrap gap-1.5">
                {quickActionKeys.map((k) => (
                  <Button
                    key={k}
                    variant="outline"
                    size="sm"
                    disabled={busy}
                    onClick={() => send(tr.actions[k])}
                  >
                    {tr.actions[k]}
                  </Button>
                ))}
              </div>
              {msgs.map(
                (m, i) =>
                  m.text && (
                    <Message key={i} from={m.role === "model" ? "assistant" : "user"}>
                      <MessageContent
                        className={m.role === "user" ? "!bg-primary !text-primary-foreground" : ""}
                      >
                        <MessageResponse>{m.text}</MessageResponse>
                      </MessageContent>
                    </Message>
                  ),
              )}
              {busy && (
                <div role="status">
                  <Shimmer>Thinking…</Shimmer>
                </div>
              )}
              {error && (
                <div role="alert" className="space-y-2 text-destructive">
                  <p>{error}</p>
                  {retry && (
                    <Button variant="outline" size="sm" onClick={() => requestAnswer(retry)}>
                      <RotateCcw />
                      Retry
                    </Button>
                  )}
                </div>
              )}
            </ConversationContent>
            <ConversationScrollButton />
          </Conversation>
          <div className="border-t p-3">
            <PromptInput onSubmit={({ text }) => send(text)}>
              <PromptInputTextarea
                aria-label={tr.placeholder}
                placeholder={tr.placeholder}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                maxLength={4000}
                disabled={busy}
              />
              <PromptInputFooter className="justify-end">
                <PromptInputSubmit
                  aria-label={busy ? "Stop answer" : tr.send}
                  status={busy ? "streaming" : "ready"}
                  disabled={!busy && !input.trim()}
                  onStop={() => abort.current?.abort()}
                />
              </PromptInputFooter>
            </PromptInput>
          </div>
        </div>
      )}
    </>
  );
}
