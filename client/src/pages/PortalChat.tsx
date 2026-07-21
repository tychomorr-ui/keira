import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Loader2, Send, Plus, Zap, Brain, TrendingUp, AlertCircle, Lightbulb } from "lucide-react";
import { Streamdown } from "streamdown";

type LearningStage = 'awakening' | 'exploration' | 'integration' | 'mastery' | 'resistance';
type DialogueStrategy = 'socratic' | 'prophetic' | 'forensic' | 'catalytic';

interface MessageMetadata {
  strategy?: DialogueStrategy;
  learningStage?: LearningStage;
  breakthroughReadiness?: number;
  resistanceLevel?: number;
  stageTransition?: string | null;
  nextAction?: string;
}

const STAGE_COLORS: Record<LearningStage, string> = {
  awakening: 'bg-blue-900 text-blue-100',
  exploration: 'bg-purple-900 text-purple-100',
  integration: 'bg-amber-900 text-amber-100',
  mastery: 'bg-emerald-900 text-emerald-100',
  resistance: 'bg-red-900 text-red-100',
};

const STAGE_DESCRIPTIONS: Record<LearningStage, string> = {
  awakening: 'Just beginning your journey',
  exploration: 'Actively exploring patterns',
  integration: 'Ready to integrate insights',
  mastery: 'Transcending patterns',
  resistance: 'In a resistance cycle',
};

const STRATEGY_ICONS: Record<DialogueStrategy, string> = {
  socratic: '❓',
  prophetic: '🔮',
  forensic: '🔍',
  catalytic: '⚡',
};

const STRATEGY_NAMES: Record<DialogueStrategy, string> = {
  socratic: 'Socratic',
  prophetic: 'Prophetic',
  forensic: 'Forensic',
  catalytic: 'Catalytic',
};

export default function PortalChat() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [lastMessageMetadata, setLastMessageMetadata] = useState<MessageMetadata | null>(null);
  const [learningProfile, setLearningProfile] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const getConversationsQuery = trpc.portal.chat.getConversations.useQuery();
  const createConversationMutation = trpc.portal.chat.createConversation.useMutation();
  const getConversationQuery = trpc.portal.chat.getConversation.useQuery(
    { conversationId: activeConversationId! },
    { enabled: !!activeConversationId }
  );
  const sendMessageMutation = trpc.portal.chat.sendMessage.useMutation();
  const getLearningProfileQuery = trpc.portal.chat.getLearningProfile.useQuery();

  useEffect(() => {
    if (getConversationsQuery.data) {
      setConversations(getConversationsQuery.data);
    }
  }, [getConversationsQuery.data]);

  useEffect(() => {
    if (getConversationQuery.data) {
      setMessages(getConversationQuery.data.messages || []);
    }
  }, [getConversationQuery.data]);

  useEffect(() => {
    if (getLearningProfileQuery.data) {
      setLearningProfile(getLearningProfileQuery.data);
    }
  }, [getLearningProfileQuery.data]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleCreateConversation = async () => {
    if (!newTitle.trim()) return;

    try {
      const id = await createConversationMutation.mutateAsync({ title: newTitle });
      setNewTitle("");
      setShowNewConversation(false);
      setActiveConversationId(id);
      getConversationsQuery.refetch();
    } catch (error) {
      console.error("Failed to create conversation:", error);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !activeConversationId || isLoading) return;

    const userMessage = inputValue;
    setInputValue("");
    setIsLoading(true);

    try {
      const response = await sendMessageMutation.mutateAsync({
        conversationId: activeConversationId,
        message: userMessage,
      });

      setLastMessageMetadata(response.metadata);

      // Refetch learning profile to show updated stage
      getLearningProfileQuery.refetch();

      await getConversationQuery.refetch();
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectConversation = (id: number) => {
    setActiveConversationId(id);
  };

  return (
    <div className="flex h-full bg-background">
      {/* Sidebar - Conversations */}
      <div className="w-64 border-r border-border bg-slate-950 flex flex-col">
        <div className="p-4 border-b border-border space-y-3">
          <Button
            onClick={() => setShowNewConversation(!showNewConversation)}
            className="w-full bg-orange-600 hover:bg-orange-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Conversation
          </Button>

          {/* Learning Stage Badge */}
          {learningProfile && (
            <div className={`p-3 rounded-lg text-center text-sm ${STAGE_COLORS[learningProfile.learningStage as LearningStage]}`}>
              <div className="font-semibold">{(learningProfile.learningStage as LearningStage).toUpperCase()}</div>
              <div className="text-xs opacity-90">{STAGE_DESCRIPTIONS[learningProfile.learningStage as LearningStage]}</div>
              <div className="text-xs mt-1">Confidence: {learningProfile.confidence}%</div>
            </div>
          )}
        </div>

        {showNewConversation && (
          <div className="p-4 border-b border-border space-y-2">
            <Input
              placeholder="Conversation title..."
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleCreateConversation()}
              className="bg-slate-800 border-slate-700"
            />
            <Button
              onClick={handleCreateConversation}
              size="sm"
              className="w-full bg-orange-600 hover:bg-orange-700"
            >
              Create
            </Button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => handleSelectConversation(conv.id)}
              className={`w-full text-left p-3 border-b border-slate-800 hover:bg-slate-800 transition ${
                activeConversationId === conv.id ? "bg-slate-800 border-l-2 border-l-orange-600" : ""
              }`}
            >
              <div className="text-sm font-medium text-gray-200 truncate">{conv.title}</div>
              <div className="text-xs text-gray-500 mt-1">
                {new Date(conv.createdAt).toLocaleDateString()}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {activeConversationId ? (
          <>
            {/* Header with Strategy & Insights */}
            {lastMessageMetadata && (
              <div className="border-b border-border bg-slate-900 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{STRATEGY_ICONS[lastMessageMetadata.strategy || 'socratic']}</div>
                    <div>
                      <div className="text-sm font-semibold text-gray-300">
                        Strategy: {STRATEGY_NAMES[lastMessageMetadata.strategy || 'socratic']}
                      </div>
                      <div className="text-xs text-gray-500">
                        Stage: {lastMessageMetadata.learningStage?.toUpperCase()}
                      </div>
                    </div>
                  </div>

                  {/* Breakthrough Readiness */}
                  {lastMessageMetadata.breakthroughReadiness !== undefined && (
                    <div className="text-right">
                      <div className="text-xs text-gray-400 mb-1">Breakthrough Ready</div>
                      <div className="w-24 h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-orange-500 to-amber-500 transition-all"
                          style={{ width: `${lastMessageMetadata.breakthroughReadiness}%` }}
                        />
                      </div>
                      <div className="text-xs text-gray-400 mt-1">{lastMessageMetadata.breakthroughReadiness}%</div>
                    </div>
                  )}
                </div>

                {/* Resistance Level & Next Action */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-400" />
                    <span className="text-gray-400">
                      Resistance: {lastMessageMetadata.resistanceLevel}%
                    </span>
                  </div>
                  {lastMessageMetadata.stageTransition && (
                    <div className="flex items-center gap-2 bg-emerald-900 text-emerald-100 px-2 py-1 rounded">
                      <Lightbulb className="w-3 h-3" />
                      <span>Breakthrough Ready!</span>
                    </div>
                  )}
                </div>

                {/* Next Action */}
                {lastMessageMetadata.nextAction && (
                  <div className="bg-orange-900 bg-opacity-30 border border-orange-700 rounded p-2 text-xs text-orange-100">
                    <div className="font-semibold mb-1">Next Step:</div>
                    <div>{lastMessageMetadata.nextAction}</div>
                  </div>
                )}
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2`}
                >
                  <div
                    className={`max-w-2xl px-4 py-3 rounded-lg ${
                      msg.role === "user"
                        ? "bg-orange-600 text-white rounded-br-none"
                        : "bg-slate-800 text-gray-100 rounded-bl-none border border-slate-700"
                    }`}
                  >
                    {msg.role === "portal" ? (
                      <Streamdown>{msg.content}</Streamdown>
                    ) : (
                      <p className="text-sm">{msg.content}</p>
                    )}
                  </div>
                </div>
              ))}

              {/* Suspenseful loading indicator */}
              {isLoading && (
                <div className="flex justify-start animate-in fade-in">
                  <div className="bg-slate-800 text-gray-100 px-4 py-3 rounded-lg border border-slate-700 rounded-bl-none">
                    <div className="flex items-center space-x-2">
                      <Zap className="w-4 h-4 text-orange-500 animate-pulse" />
                      <span className="text-sm text-gray-400">Portal is reflecting...</span>
                      <span className="flex space-x-1 ml-2">
                        <span className="w-2 h-2 bg-orange-500 rounded-full animate-bounce"></span>
                        <span className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></span>
                        <span className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></span>
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="border-t border-border bg-slate-950 p-4">
              <div className="flex gap-2">
                <Input
                  placeholder="What troubles you? What do you need clarity on?"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  disabled={isLoading}
                  className="flex-1 bg-slate-800 border-slate-700 text-gray-100 placeholder-gray-500"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={isLoading || !inputValue.trim()}
                  className="bg-orange-600 hover:bg-orange-700 disabled:opacity-50"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <Zap className="w-12 h-12 mx-auto mb-4 text-orange-600 opacity-50" />
              <p>Select or create a conversation to begin</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
