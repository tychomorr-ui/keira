import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Loader2, Send, Plus } from "lucide-react";
import { Streamdown } from "streamdown";

export default function PortalChat() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const getConversationsQuery = trpc.portal.chat.getConversations.useQuery();
  const createConversationMutation = trpc.portal.chat.createConversation.useMutation();
  const getConversationQuery = trpc.portal.chat.getConversation.useQuery(
    { conversationId: activeConversationId! },
    { enabled: !!activeConversationId }
  );
  const sendMessageMutation = trpc.portal.chat.sendMessage.useMutation();

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
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleCreateConversation = async () => {
    if (!newTitle.trim()) return;

    try {
      const id = await createConversationMutation.mutateAsync({ title: newTitle });
      setNewTitle("");
      setShowNewConversation(false);
      setActiveConversationId(id);
      await getConversationsQuery.refetch();
    } catch (error) {
      console.error("Failed to create conversation:", error);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !activeConversationId || isLoading) return;

    setIsLoading(true);
    const userMessage = inputValue;
    setInputValue("");

    try {
      const result = await sendMessageMutation.mutateAsync({
        conversationId: activeConversationId,
        message: userMessage,
      });

      setMessages((prev) => [
        ...prev,
        { role: "user", content: userMessage },
        { role: "portal", content: result.portalResponse },
      ]);
    } catch (error) {
      console.error("Failed to send message:", error);
      setInputValue(userMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Sidebar - Conversations */}
      <div className="w-64 bg-slate-800 border-r border-slate-700 flex flex-col">
        <div className="p-4 border-b border-slate-700">
          <h2 className="text-white font-bold text-lg mb-4">Portal Conversations</h2>
          <Button
            onClick={() => setShowNewConversation(!showNewConversation)}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2"
            size="sm"
          >
            <Plus size={16} /> New Chat
          </Button>
        </div>

        {showNewConversation && (
          <div className="p-4 border-b border-slate-700 space-y-2">
            <Input
              placeholder="Conversation title..."
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="bg-slate-700 border-slate-600 text-white"
            />
            <Button
              onClick={handleCreateConversation}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
              size="sm"
            >
              Create
            </Button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto space-y-2 p-4">
          {conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => setActiveConversationId(conv.id)}
              className={`w-full text-left p-3 rounded transition-colors ${
                activeConversationId === conv.id
                  ? "bg-purple-600 text-white"
                  : "text-slate-300 hover:bg-slate-700"
              }`}
            >
              <div className="font-semibold text-sm truncate">{conv.title}</div>
              <div className="text-xs opacity-75">{conv.messageCount} messages</div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {activeConversationId ? (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-slate-400 mb-2">Start a conversation with your Portal</p>
                    <p className="text-slate-500 text-sm">Type a message to begin</p>
                  </div>
                </div>
              ) : (
                messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <Card
                      className={`max-w-md p-4 ${
                        msg.role === "user"
                          ? "bg-purple-600 text-white border-purple-500"
                          : "bg-slate-700 text-slate-100 border-slate-600"
                      }`}
                    >
                      {msg.role === "portal" ? (
                        <Streamdown>{msg.content}</Streamdown>
                      ) : (
                        <p>{msg.content}</p>
                      )}
                    </Card>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-slate-700 p-6 bg-slate-800">
              <div className="flex gap-3">
                <Input
                  placeholder="Type your message..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  disabled={isLoading}
                  className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={isLoading || !inputValue.trim()}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-white mb-2">Portal Chat</h3>
              <p className="text-slate-400">Select or create a conversation to begin</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
