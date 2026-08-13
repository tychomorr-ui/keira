import { useEffect, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Activity,
  BrainCircuit,
  ChevronRight,
  Compass,
  Eye,
  Layers3,
  Loader2,
  LogIn,
  Menu,
  MessageCircle,
  Plus,
  Send,
  Settings2,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
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

const CINEMATIC_NAV = [
  { label: "Conversation", icon: MessageCircle, detail: "Active thread" },
  { label: "Memory", icon: BrainCircuit, detail: "Held in context" },
  { label: "Revelation", icon: Sparkles, detail: "Emergent insight" },
  { label: "Insights", icon: Eye, detail: "Observed patterns" },
  { label: "Journey", icon: Compass, detail: "Learning stage" },
  { label: "Systems", icon: Layers3, detail: "Portal state" },
  { label: "Settings", icon: Settings2, detail: "Operator controls" },
] as const;

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
  const [showContextPanel, setShowContextPanel] = useState(false);
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
      <main className="min-h-screen bg-[#05070c] text-[#f4f4f5] grid place-items-center">
        <div className="flex items-center gap-3 text-sm text-[#a6aec0]" role="status">
          <Loader2 className="h-4 w-4 animate-spin" /> Establishing Portal session
        </div>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-[#05070c] text-[#f4f4f5] grid place-items-center px-6">
        <section className="w-full max-w-lg border border-[#474865] bg-[#0c1018] p-8 shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
          <div className="mb-8 flex items-center gap-3 text-[#f5ede3]">
            <ShieldCheck className="h-5 w-5" />
            <span className="text-xs uppercase tracking-[0.28em]">Portal / Awaiting Handshake</span>
          </div>
          <h1 className="font-serif text-4xl tracking-tight">Enter the Portal.</h1>
          <p className="mt-4 max-w-md text-sm leading-7 text-[#a6aec0]">
            A focused intelligence workspace for conversation, mission context, and the next clear move.
          </p>
          <Button
            onClick={() => (window.location.href = getLoginUrl())}
            className="mt-8 rounded-none bg-[#e5c158] text-[#07090f] hover:bg-[#f1d279]"
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
  const presenceState = cmap?.handshakeComplete ? "Present" : "Awaiting Handshake";
  const currentState = strategy ? STRATEGY_LABELS[strategy] : presenceState;

  return (
    <main className="min-h-screen bg-[#08090c] text-[#f4f4f5] selection:bg-[#e5c158] selection:text-[#07090f]">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <aside
          className={`${showThreads ? "fixed inset-0 z-40 flex" : "hidden"} w-full flex-col border-r border-[#1d2230] bg-[#090b10] lg:static lg:flex lg:w-[19rem]`}
          aria-label="Portal threads"
        >
          <div className="border-b border-[#1d2230] px-5 py-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[0.65rem] uppercase tracking-[0.32em] text-[#f5ede3]">Portal</div>
                <div className="mt-1 text-[0.58rem] uppercase tracking-[0.22em] text-[#737b8f]">Converse with the signal</div>
              </div>
              <div className="grid h-9 w-9 place-items-center rounded-full border border-[#474865] text-[#f5ede3]" aria-hidden="true">
                <Sparkles className="h-4 w-4" />
              </div>
              <button
                type="button"
                onClick={() => setShowThreads(false)}
                className="rounded-sm p-2 text-[#a7a2c2] hover:bg-[#171b2a] hover:text-[#f3eadb] lg:hidden"
                aria-label="Close conversation list"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="border-b border-[#1d2230] px-3 py-4" role="list" aria-label="Portal surfaces">
            {CINEMATIC_NAV.map(({ label, icon: Icon, detail }, index) => (
              <div
                key={label}
                role="listitem"
                aria-current={index === 0 ? "page" : undefined}
                className={`mb-1 flex items-center gap-3 border-l-2 px-3 py-2.5 ${index === 0 ? "border-[#f1d279] bg-[#171b2a] text-[#f3eadb]" : "border-transparent text-[#737b8f]"}`}
              >
                <Icon className={`h-4 w-4 shrink-0 ${index === 0 ? "text-[#f5ede3]" : "text-[#474865]"}`} />
                <div className="min-w-0">
                  <div className="text-[0.68rem] uppercase tracking-[0.16em]">{label}</div>
                  <div className="mt-0.5 truncate text-[0.62rem] text-[#5d667c]">{detail}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="border-b border-[#1d2230] p-4">
            <Button
              onClick={() => setShowNewConversation((current) => !current)}
              className="w-full justify-start rounded-none border border-[#474865] bg-transparent text-[#f5ede3] hover:bg-[#171b2a]"
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
                  className="rounded-none border-[#1d2230] bg-[#101522] text-[#f4f4f5] placeholder:text-[#737b8f]"
                />
                <Button
                  onClick={() => void handleCreateConversation()}
                  className="w-full rounded-none bg-[#e5c158] text-[#07090f] hover:bg-[#f1d279]"
                >
                  Open thread
                </Button>
              </div>
            )}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-3">
            <div className="px-2 pb-2 text-[0.62rem] uppercase tracking-[0.28em] text-[#737b8f]">Threads</div>
            {conversations.length === 0 && (
              <p className="px-2 py-6 text-sm leading-6 text-[#737b8f]">No threads yet. Start with the objective in front of you.</p>
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
                    ? "border-[#f1d279] bg-[#171b2a] text-[#f3eadb]"
                    : "border-transparent text-[#9ba2b5] hover:bg-[#101522] hover:text-[#f3eadb]"
                }`}
              >
                <div className="truncate text-sm">{conversation.title}</div>
                <div className="mt-1 text-[0.68rem] uppercase tracking-[0.16em] text-[#737b8f]">{formatDate(conversation.createdAt)}</div>
              </button>
            ))}
          </div>

          <div className="border-t border-[#1d2230] px-5 py-4 text-xs text-[#737b8f]">
            <div className="mb-4 flex items-center gap-2 text-[0.62rem] uppercase tracking-[0.2em] text-[#737b8f]">
              <Activity className="h-3.5 w-3.5 text-[#f1d279]" /> Operator
            </div>
            <div className="truncate text-[#c7c9d5]">{user?.name || "Operator"}</div>
            <div className="mt-1 truncate">{user?.email || "Authenticated"}</div>
          </div>
        </aside>

        <section className="flex min-h-screen min-w-0 flex-1 flex-col">
          <header className="border-b border-[#1d2230] bg-[#090b10]/95 px-4 py-4 backdrop-blur lg:px-8">
            <div className="mx-auto flex w-full max-w-5xl items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  onClick={() => setShowThreads(true)}
                  className="mt-0.5 rounded-sm p-2 text-[#a7a2c2] hover:bg-[#171b2a] hover:text-[#f3eadb] lg:hidden"
                  aria-label="Open conversation list"
                >
                  <Menu className="h-5 w-5" />
                </button>
                <div>
                  <div className="flex items-center gap-2 text-[0.64rem] uppercase tracking-[0.28em] text-[#a7a2c2]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#f1d279]" /> Portal / Cognitive workspace
                  </div>
                  <h1 className="mt-2 font-serif text-2xl tracking-tight text-[#f3eadb]">{conversations.find((item) => item.id === activeConversationId)?.title || "New mission"}</h1>
                </div>
              </div>
              <div className="hidden text-right sm:block">
                <div className="flex items-center justify-end gap-2 text-xs text-[#c7c9d5]">
                  <ShieldCheck className="h-3.5 w-3.5 text-[#f1d279]" />
                  {cmap?.handshakeComplete ? "Handshake active" : "Awaiting Handshake"}
                </div>
                <div className="mt-1 text-[0.64rem] uppercase tracking-[0.2em] text-[#737b8f]">No simulated telemetry</div>
              </div>
            </div>
          </header>

          <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 lg:px-8">
            <div className="relative overflow-hidden border-b border-[#1d2230] py-9 sm:py-12">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(109,40,217,0.18),rgba(229,193,88,0.08)_34%,transparent_64%)]" />
              <div className="relative flex items-center justify-between gap-4 text-[0.62rem] uppercase tracking-[0.28em] text-[#a7a2c2]">
                <span className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-[#f1d279]" /> Cinematic moment</span>
                <span className="hidden sm:block">{cmap?.handshakeComplete ? "Returning to conversation" : "Awaiting presence"}</span>
              </div>
              <div className="relative mt-7 max-w-3xl">
                <div className="font-serif text-4xl leading-none tracking-[0.08em] text-[#f3eadb] sm:text-6xl">Purpose</div>
                <div className="mt-3 text-[0.7rem] uppercase tracking-[0.32em] text-[#a7a2c2]">is something you build</div>
                <p className="mt-6 max-w-xl text-sm leading-7 text-[#a6aec0]">Portal keeps the conversation in motion while the session holds the objective, evidence, and next clear move.</p>
              </div>
            </div>

            <div className="grid gap-3 border-b border-[#1d2230] py-4 text-xs sm:grid-cols-3">
              <div>
                <div className="uppercase tracking-[0.2em] text-[#737b8f]">Current objective</div>
                <div className="mt-1 truncate text-[#f1d279]" title={missionIntent}>{missionIntent}</div>
              </div>
              <div>
                <div className="uppercase tracking-[0.2em] text-[#737b8f]">Next action</div>
                <div className="mt-1 truncate text-[#f1d279]" title={nextAction}>{nextAction}</div>
              </div>
              <div className="sm:text-right">
                <div className="uppercase tracking-[0.2em] text-[#737b8f]">Living context</div>
                <button
                  type="button"
                  onClick={() => setShowContextPanel((current) => !current)}
                  className="mt-1 inline-flex items-center gap-1 text-[#a6aec0] transition hover:text-[#f3eadb]"
                  aria-expanded={showContextPanel}
                >
                  {cmap ? `${cmap.decisions.length} decisions · ${cmap.evidence.length} evidence · ${cmap.openQuestions.length} questions` : "Awaiting Handshake"}
                  <ChevronRight className={`h-3.5 w-3.5 transition-transform ${showContextPanel ? "rotate-90" : ""}`} />
                </button>
              </div>
            </div>

            {showContextPanel && (
              <div className="grid gap-4 border-b border-[#202637] py-4 text-xs sm:grid-cols-3" aria-label="Living context details">
                <div>
                  <div className="uppercase tracking-[0.18em] text-[#737b8f]">Decisions</div>
                  <p className="mt-2 leading-6 text-[#a6aec0]">{cmap?.decisions[0] || "Awaiting Handshake"}</p>
                </div>
                <div>
                  <div className="uppercase tracking-[0.18em] text-[#737b8f]">Evidence</div>
                  <p className="mt-2 leading-6 text-[#a6aec0]">{cmap?.evidence[0] || "Awaiting Handshake"}</p>
                </div>
                <div>
                  <div className="uppercase tracking-[0.18em] text-[#737b8f]">Open question</div>
                  <p className="mt-2 leading-6 text-[#a6aec0]">{cmap?.openQuestions[0] || "Awaiting Handshake"}</p>
                </div>
              </div>
            )}

            {(stage || strategy) && (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-[#202637] py-3 text-[0.68rem] uppercase tracking-[0.18em] text-[#a7a2c2]">
                {stage && <span>Stage / {STAGE_LABELS[stage]}</span>}
                {strategy && <span>Mode / {STRATEGY_LABELS[strategy]}</span>}
                {lastMessageMetadata?.stageTransition && <span className="text-[#f1d279]">Transition / {lastMessageMetadata.stageTransition}</span>}
              </div>
            )}

            <div className="flex-1 overflow-y-auto py-8" aria-live="polite">
              {activeConversationId === null && (
                <div className="mx-auto flex max-w-2xl flex-col items-center justify-center py-24 text-center">
                  <Sparkles className="h-8 w-8 text-[#e5c158]" />
                  <h2 className="mt-5 font-serif text-3xl text-[#f3eadb]">What is the mission?</h2>
                  <p className="mt-3 max-w-md text-sm leading-7 text-[#9ba2b5]">Open a thread and place the real objective in front of the Portal. Context will accumulate from what is actually said.</p>
                </div>
              )}

              {activeConversationId !== null && messages.length === 0 && (
                <div className="mx-auto max-w-2xl py-16">
                  <div className="border-l border-[#e5c158] pl-5">
                    <div className="text-[0.68rem] uppercase tracking-[0.22em] text-[#e5c158]">Portal ingress</div>
                    <p className="mt-3 font-serif text-2xl leading-snug text-[#f3eadb]">Bring the unfinished thing. We will establish the objective from there.</p>
                  </div>
                </div>
              )}

              <div className="space-y-7">
                {messages.map((message, index) => (
                  <div key={`${message.role}-${index}`} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-3xl ${message.role === "user" ? "max-w-2xl" : "w-full"}`}>
                      <div className="mb-2 text-[0.62rem] uppercase tracking-[0.24em] text-[#737b8f]">{message.role === "user" ? "Operator" : "Portal"}</div>
                      <div className={`${message.role === "user" ? "border border-[#474865] bg-[#101522] text-[#f3eadb]" : "border-l border-[#e5c158] text-[#e7e9ef]"} px-4 py-1 text-[0.98rem] leading-8`}>
                        {message.role === "portal" ? <Streamdown>{message.content}</Streamdown> : <p>{message.content}</p>}
                      </div>
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex justify-start" role="status">
                    <div className="border-l border-[#e5c158] px-4 py-1 text-sm text-[#a6aec0]">
                      <span className="mr-2 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-[#f1d279]" /> Portal is composing the next move…
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            <div className="border-t border-[#1d2230] py-4">
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
                  className="h-12 rounded-none border-[#1d2230] bg-[#0c1018] text-[#f4f4f5] placeholder:text-[#737b8f] focus-visible:ring-[#e5c158]"
                />
                <Button
                  aria-label="Send message"
                  onClick={() => void handleSendMessage()}
                  disabled={isLoading || activeConversationId === null || !inputValue.trim()}
                  className="h-12 w-12 shrink-0 rounded-none bg-[#e5c158] p-0 text-[#07090f] hover:bg-[#f1d279] disabled:bg-[#2c3245]"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
              <div className="mt-3 flex justify-between gap-4 text-[0.62rem] uppercase tracking-[0.16em] text-[#737b8f]">
                <span>Portal remains the active feature</span>
                <span className="hidden sm:inline">Truthful state only</span>
              </div>
            </div>
          </div>
        </section>

        <aside className="hidden w-[18rem] shrink-0 flex-col border-l border-[#1d2230] bg-[#0b0d10] xl:flex" aria-label="Portal presence and context">
          <div className="border-b border-[#1d2230] px-5 py-5">
            <div className="flex items-center justify-between text-[0.62rem] uppercase tracking-[0.22em] text-[#737b8f]">
              <span>Presence</span>
              <span className="flex items-center gap-2 text-[#f1d279]"><span className="h-1.5 w-1.5 rounded-full bg-[#f1d279]" /> {presenceState}</span>
            </div>
            <div className="mx-auto mt-7 grid h-24 w-24 place-items-center rounded-full border border-[#474865] bg-[radial-gradient(circle,rgba(109,40,217,0.18),rgba(229,193,88,0.12)_42%,transparent_70%)] text-[#f5ede3] shadow-[0_0_50px_rgba(109,40,217,0.18)]">
              <div className="grid h-12 w-12 place-items-center rounded-full border border-[#f1d279]/70"><Sparkles className="h-5 w-5" /></div>
            </div>
            <div className="mt-5 text-center text-[0.62rem] uppercase tracking-[0.2em] text-[#737b8f]">Current state</div>
            <div className="mt-2 text-center font-serif text-lg text-[#f3eadb]">{currentState}</div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5">
            <div className="mb-3 text-[0.62rem] uppercase tracking-[0.22em] text-[#737b8f]">Conversation flow</div>
            <div className="space-y-2">
              <div className="border border-[#202637] bg-[#101217] px-3 py-3"><div className="text-[0.62rem] uppercase tracking-[0.16em] text-[#a7a2c2]">Objective</div><div className="mt-1 line-clamp-2 text-sm leading-6 text-[#c7c9d5]">{missionIntent}</div></div>
              <div className="border border-[#202637] bg-[#101217] px-3 py-3"><div className="text-[0.62rem] uppercase tracking-[0.16em] text-[#a7a2c2]">Pattern state</div><div className="mt-1 text-sm leading-6 text-[#c7c9d5]">{stage ? STAGE_LABELS[stage] : "Awaiting Handshake"}</div></div>
              <div className="border border-[#202637] bg-[#101217] px-3 py-3"><div className="text-[0.62rem] uppercase tracking-[0.16em] text-[#a7a2c2]">Next move</div><div className="mt-1 line-clamp-3 text-sm leading-6 text-[#c7c9d5]">{nextAction}</div></div>
            </div>
          </div>

          <div className="border-t border-[#1d2230] px-4 py-4 text-[0.62rem] uppercase tracking-[0.16em] text-[#5d667c]">Truthful state only</div>
        </aside>
      </div>
    </main>
  );
}
