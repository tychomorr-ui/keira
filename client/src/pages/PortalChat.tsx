import { useEffect, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Menu, Plus, Send, ShieldCheck, Sparkles, X, LogIn } from "lucide-react";
import { Streamdown } from "streamdown";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";

type LearningStage = "awakening" | "exploration" | "integration" | "mastery" | "resistance";
type DialogueStrategy = "socratic" | "prophetic" | "forensic" | "catalytic";
type MessageRole = "user" | "portal";

type PortalMessage = {
  role: MessageRole;
  content: string;
};

type Conversation = {
  id: number;
  title: string;
  createdAt: string | number | Date;
};

type CmapState = {
  sessionId: string;
  handshakeComplete: boolean;
  missionIntent: string;
  missionStatus: "active" | "paused" | "completed";
  decisions: string[];
  evidence: string[];
  openQuestions: string[];
  nextAction: string;
};

type MessageMetadata = {
  strategy?: DialogueStrategy;
  learningStage?: LearningStage;
  breakthroughReadiness?: number;
  resistanceLevel?: number;
  stageTransition?: string | null;
  nextAction?: string;
  cmap?: CmapState;
};

const STAGE_LABELS: Record<LearningStage, string> = {
  awakening: "Awakening",
  exploration: "Exploration",
  integration: "Integration",
  mastery: "Mastery",
  resistance: "Resistance",
};

const STRATEGY_LABELS: Record<DialogueStrategy, string> = {
  socratic: "Socratic",
  prophetic: "Prophetic",
  forensic: "Forensic",
  catalytic: "Catalytic",
};

function formatDate(value: Conversation["createdAt"]) {
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export default function PortalChat() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const [messages, setMessages] = useState<PortalMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [showThreads, setShowThreads] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [lastMessageMetadata, setLastMessageMetadata] = useState<MessageMetadata | null>(null);
  const [learningProfile, setLearningProfile] = useState<{
    learningStage?: LearningStage;
    confidence?: number;
  } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const conversationsQuery = trpc.portal.chat.getConversations.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const createConversationMutation = trpc.portal.chat.createConversation.useMutation();
  const conversationQuery = trpc.portal.chat.getConversation.useQuery(
    { conversationId: activeConversationId ?? 0 },
    { enabled: isAuthenticated && activeConversationId !== null },
  );
  const sendMessageMutation = trpc.portal.chat.sendMessage.useMutation();
  const learningProfileQuery = trpc.portal.chat.getLearningProfile.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (conversationsQuery.data) {
      setConversations(conversationsQuery.data as Conversation[]);
      if (activeConversationId === null && conversationsQuery.data[0]) {
        setActiveConversationId(conversationsQuery.data[0].id);
      }
    }
  }, [conversationsQuery.data, activeConversationId]);

  useEffect(() => {
    if (conversationQuery.data) {
      setMessages((conversationQuery.data.messages || []) as PortalMessage[]);
    }
  }, [conversationQuery.data]);

  useEffect(() => {
    if (learningProfileQuery.data) {
      setLearningProfile(learningProfileQuery.data);
    }
  }, [learningProfileQuery.data]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleCreateConversation = async () => {
    const title = newTitle.trim() || "Untitled mission";
    try {
      const id = await createConversationMutation.mutateAsync({ title });
      setNewTitle("");
      setShowNewConversation(false);
      setShowThreads(false);
      setActiveConversationId(id);
      await conversationsQuery.refetch();
    } catch (error) {
      console.error("Failed to create Portal conversation", error);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || activeConversationId === null || isLoading) return;

    const userMessage = inputValue.trim();
    setInputValue("");
    setIsLoading(true);

    try {
      const response = await sendMessageMutation.mutateAsync({
        conversationId: activeConversationId,
        message: userMessage,
      });
      setLastMessageMetadata(response.metadata as MessageMetadata);
      await Promise.all([conversationQuery.refetch(), learningProfileQuery.refetch()]);
    } catch (error) {
      console.error("Failed to send Portal message", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <main className="min-h-screen bg-[#130f0b] text-[#f2e7d5] grid place-items-center">
        <div className="flex items-center gap-3 text-sm text-[#c6aa83]" role="status">
          <Loader2 className="h-4 w-4 animate-spin" /> Establishing Portal session
        </div>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-[#130f0b] text-[#f2e7d5] grid place-items-center px-6">
        <section className="w-full max-w-lg border border-[#6f4c2d] bg-[#1b140e] p-8 shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
          <div className="mb-8 flex items-center gap-3 text-[#e4b56d]">
            <ShieldCheck className="h-5 w-5" />
            <span className="text-xs uppercase tracking-[0.28em]">Portal / Awaiting Handshake</span>
          </div>
          <h1 className="font-serif text-4xl tracking-tight">Enter the Portal.</h1>
          <p className="mt-4 max-w-md text-sm leading-7 text-[#b9a38a]">
            A focused intelligence workspace for conversation, mission context, and the next clear move.
          </p>
          <Button
            onClick={() => (window.location.href = getLoginUrl())}
            className="mt-8 rounded-none bg-[#b67837] text-[#1a1008] hover:bg-[#d39a57]"
          >
            <LogIn className="mr-2 h-4 w-4" /> Connect operator
          </Button>
        </section>
      </main>
    );
  }

  const cmap = lastMessageMetadata?.cmap;
  const stage = lastMessageMetadata?.learningStage || learningProfile?.learningStage;
  const strategy = lastMessageMetadata?.strategy;
  const missionIntent = cmap?.missionIntent && cmap.missionIntent !== "Awaiting Intent"
    ? cmap.missionIntent
    : "Awaiting mission objective";
  const nextAction = cmap?.nextAction || lastMessageMetadata?.nextAction || "Awaiting a clear next action";

  return (
    <main className="min-h-screen bg-[#130f0b] text-[#f2e7d5] selection:bg-[#b67837] selection:text-[#1a1008]">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <aside
          className={`${showThreads ? "fixed inset-0 z-40 flex" : "hidden"} w-full flex-col border-r border-[#49321f] bg-[#17100b] lg:static lg:flex lg:w-[19rem]`}
          aria-label="Portal threads"
        >
          <div className="flex items-center justify-between border-b border-[#49321f] px-5 py-5">
            <div>
              <div className="text-[0.65rem] uppercase tracking-[0.32em] text-[#9d7950]">Sovereign interface</div>
              <div className="mt-1 font-serif text-2xl tracking-tight text-[#f0d2a4]">Portal</div>
            </div>
            <button
              type="button"
              onClick={() => setShowThreads(false)}
              className="rounded-sm p-2 text-[#9d7950] hover:bg-[#2a1c12] hover:text-[#f0d2a4] lg:hidden"
              aria-label="Close conversation list"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="border-b border-[#49321f] p-4">
            <Button
              onClick={() => setShowNewConversation((current) => !current)}
              className="w-full justify-start rounded-none border border-[#72502e] bg-transparent text-[#e4b56d] hover:bg-[#2a1c12]"
            >
              <Plus className="mr-2 h-4 w-4" /> New thread
            </Button>
            {showNewConversation && (
              <div className="mt-3 space-y-2">
                <Input
                  autoFocus
                  placeholder="Mission title (optional)"
                  value={newTitle}
                  onChange={(event) => setNewTitle(event.target.value)}
                  onKeyDown={(event) => event.key === "Enter" && void handleCreateConversation()}
                  className="rounded-none border-[#49321f] bg-[#21160e] text-[#f2e7d5] placeholder:text-[#806b55]"
                />
                <Button
                  onClick={() => void handleCreateConversation()}
                  className="w-full rounded-none bg-[#b67837] text-[#1a1008] hover:bg-[#d39a57]"
                >
                  Open thread
                </Button>
              </div>
            )}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-3">
            <div className="px-2 pb-2 text-[0.62rem] uppercase tracking-[0.28em] text-[#806b55]">Threads</div>
            {conversations.length === 0 && (
              <p className="px-2 py-6 text-sm leading-6 text-[#806b55]">No threads yet. Start with the objective in front of you.</p>
            )}
            {conversations.map((conversation) => (
              <button
                key={conversation.id}
                type="button"
                onClick={() => {
                  setActiveConversationId(conversation.id);
                  setShowThreads(false);
                }}
                className={`mb-1 w-full border-l-2 px-3 py-3 text-left transition ${
                  activeConversationId === conversation.id
                    ? "border-[#d39a57] bg-[#2a1c12] text-[#f0d2a4]"
                    : "border-transparent text-[#a88e72] hover:bg-[#21160e] hover:text-[#f0d2a4]"
                }`}
              >
                <div className="truncate text-sm">{conversation.title}</div>
                <div className="mt-1 text-[0.68rem] uppercase tracking-[0.16em] text-[#806b55]">{formatDate(conversation.createdAt)}</div>
              </button>
            ))}
          </div>

          <div className="border-t border-[#49321f] px-5 py-4 text-xs text-[#806b55]">
            <div className="truncate text-[#c8ab82]">{user?.name || "Operator"}</div>
            <div className="mt-1 truncate">{user?.email || "Authenticated"}</div>
          </div>
        </aside>

        <section className="flex min-h-screen min-w-0 flex-1 flex-col">
          <header className="border-b border-[#49321f] bg-[#17100b]/95 px-4 py-4 backdrop-blur lg:px-8">
            <div className="mx-auto flex w-full max-w-5xl items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  onClick={() => setShowThreads(true)}
                  className="mt-0.5 rounded-sm p-2 text-[#9d7950] hover:bg-[#2a1c12] hover:text-[#f0d2a4] lg:hidden"
                  aria-label="Open conversation list"
                >
                  <Menu className="h-5 w-5" />
                </button>
                <div>
                  <div className="flex items-center gap-2 text-[0.64rem] uppercase tracking-[0.28em] text-[#9d7950]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#d39a57]" /> Portal / Cognitive workspace
                  </div>
                  <h1 className="mt-2 font-serif text-2xl tracking-tight text-[#f0d2a4]">{conversations.find((item) => item.id === activeConversationId)?.title || "New mission"}</h1>
                </div>
              </div>
              <div className="hidden text-right sm:block">
                <div className="flex items-center justify-end gap-2 text-xs text-[#c8ab82]">
                  <ShieldCheck className="h-3.5 w-3.5 text-[#d39a57]" />
                  {cmap?.handshakeComplete ? "Handshake active" : "Awaiting Handshake"}
                </div>
                <div className="mt-1 text-[0.64rem] uppercase tracking-[0.2em] text-[#806b55]">No simulated telemetry</div>
              </div>
            </div>
          </header>

          <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 lg:px-8">
            <div className="grid gap-3 border-b border-[#49321f] py-4 text-xs sm:grid-cols-3">
              <div>
                <div className="uppercase tracking-[0.2em] text-[#806b55]">Current objective</div>
                <div className="mt-1 truncate text-[#e0c08e]" title={missionIntent}>{missionIntent}</div>
              </div>
              <div>
                <div className="uppercase tracking-[0.2em] text-[#806b55]">Next action</div>
                <div className="mt-1 truncate text-[#e0c08e]" title={nextAction}>{nextAction}</div>
              </div>
              <div className="sm:text-right">
                <div className="uppercase tracking-[0.2em] text-[#806b55]">Living context</div>
                <div className="mt-1 text-[#b9a38a]">
                  {cmap ? `${cmap.decisions.length} decisions · ${cmap.evidence.length} evidence · ${cmap.openQuestions.length} questions` : "Awaiting Handshake"}
                </div>
              </div>
            </div>

            {(stage || strategy) && (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-[#302116] py-3 text-[0.68rem] uppercase tracking-[0.18em] text-[#9d7950]">
                {stage && <span>Stage / {STAGE_LABELS[stage]}</span>}
                {strategy && <span>Mode / {STRATEGY_LABELS[strategy]}</span>}
                {lastMessageMetadata?.stageTransition && <span className="text-[#d39a57]">Transition / {lastMessageMetadata.stageTransition}</span>}
              </div>
            )}

            <div className="flex-1 overflow-y-auto py-8" aria-live="polite">
              {activeConversationId === null && (
                <div className="mx-auto flex max-w-2xl flex-col items-center justify-center py-24 text-center">
                  <Sparkles className="h-8 w-8 text-[#b67837]" />
                  <h2 className="mt-5 font-serif text-3xl text-[#f0d2a4]">What is the mission?</h2>
                  <p className="mt-3 max-w-md text-sm leading-7 text-[#a88e72]">Open a thread and place the real objective in front of the Portal. Context will accumulate from what is actually said.</p>
                </div>
              )}

              {activeConversationId !== null && messages.length === 0 && (
                <div className="mx-auto max-w-2xl py-16">
                  <div className="border-l border-[#b67837] pl-5">
                    <div className="text-[0.68rem] uppercase tracking-[0.22em] text-[#b67837]">Portal ingress</div>
                    <p className="mt-3 font-serif text-2xl leading-snug text-[#f0d2a4]">Bring the unfinished thing. We will establish the objective from there.</p>
                  </div>
                </div>
              )}

              <div className="space-y-7">
                {messages.map((message, index) => (
                  <div key={`${message.role}-${index}`} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-3xl ${message.role === "user" ? "max-w-2xl" : "w-full"}`}>
                      <div className="mb-2 text-[0.62rem] uppercase tracking-[0.24em] text-[#806b55]">{message.role === "user" ? "Operator" : "Portal"}</div>
                      <div className={`${message.role === "user" ? "border border-[#72502e] bg-[#21160e] text-[#f0d2a4]" : "border-l border-[#b67837] text-[#ead9bd]"} px-4 py-1 text-[0.98rem] leading-8`}>
                        {message.role === "portal" ? <Streamdown>{message.content}</Streamdown> : <p>{message.content}</p>}
                      </div>
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex justify-start" role="status">
                    <div className="border-l border-[#b67837] px-4 py-1 text-sm text-[#b9a38a]">
                      <span className="mr-2 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-[#d39a57]" /> Portal is composing the next move…
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            <div className="border-t border-[#49321f] py-4">
              <div className="flex items-end gap-3">
                <Input
                  aria-label="Message Portal"
                  placeholder="State the thing that needs to move."
                  value={inputValue}
                  onChange={(event) => setInputValue(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      void handleSendMessage();
                    }
                  }}
                  disabled={isLoading || activeConversationId === null}
                  className="h-12 rounded-none border-[#49321f] bg-[#1b140e] text-[#f2e7d5] placeholder:text-[#806b55] focus-visible:ring-[#b67837]"
                />
                <Button
                  aria-label="Send message"
                  onClick={() => void handleSendMessage()}
                  disabled={isLoading || activeConversationId === null || !inputValue.trim()}
                  className="h-12 w-12 shrink-0 rounded-none bg-[#b67837] p-0 text-[#1a1008] hover:bg-[#d39a57] disabled:bg-[#4b3725]"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
              <div className="mt-3 flex justify-between gap-4 text-[0.62rem] uppercase tracking-[0.16em] text-[#806b55]">
                <span>Portal remains the active feature</span>
                <span className="hidden sm:inline">Truthful state only</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
