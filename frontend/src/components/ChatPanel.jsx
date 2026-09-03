import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Bot, User, FileText, ArrowUpRight, Loader2, Compass, ShieldAlert, Zap, GraduationCap, GitFork, Activity, Search, History, Plus, MessageSquare, Clock, ChevronLeft, ChevronRight, Trash2, Key, Settings } from 'lucide-react';
import MarkdownRenderer from './MarkdownRenderer';
import { ChatAPI } from '../services/api';
import { PROVIDERS } from '../constants/apiEndpoints';

export default function ChatPanel({
  repository,
  onOpenFileWithLines,
  isFullWidth = false,
  messages,
  setMessages,
  initialPrompt = null,
  onClearInitialPrompt = null,
  onOpenLLMSettings = null
}) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [provider, setProvider] = useState(() => localStorage.getItem('byok_provider') || PROVIDERS.GEMINI);
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const scrollContainerRef = useRef(null);

  const scrollToBottom = (instant = false) => {
    const container = scrollContainerRef.current;
    if (container) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: instant ? 'instant' : 'smooth'
      });
    }
  };

  useEffect(() => {
    // Only scroll the internal chat container, never the window
    scrollToBottom(loading);
  }, [messages, loading]);

  const loadConversations = async () => {
    if (!repository) return;
    try {
      const res = await ChatAPI.getConversations(repository.id);
      const convList = res.data || [];
      setConversations(convList);

      const savedConvId = localStorage.getItem(`last_conv_${repository.id}`);
      if (savedConvId && convList.some(c => c.id === savedConvId)) {
        loadConversationMessages(savedConvId);
      } else if (convList.length > 0 && !activeConversationId && messages.length <= 1) {
        loadConversationMessages(convList[0].id);
      }
    } catch (err) {
      console.error("Failed to load conversations:", err);
    }
  };

  const loadConversationMessages = async (convId) => {
    try {
      setLoading(true);
      const res = await ChatAPI.getMessages(convId);
      const msgList = res.data || [];
      if (msgList.length > 0) {
        const formatted = msgList.map(m => ({
          role: m.role,
          content: m.content,
          evidence: (m.evidence || []).filter(
            (ev) => ev.filePath && ev.filePath.trim().length > 1 && ev.filePath !== ':-' && ev.filePath !== '-'
          )
        }));
        setMessages(formatted);
        setActiveConversationId(convId);
        localStorage.setItem(`last_conv_${repository.id}`, convId);
      }
    } catch (err) {
      console.error("Failed to load messages:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartNewChat = () => {
    setActiveConversationId(null);
    localStorage.removeItem(`last_conv_${repository?.id}`);
    setMessages([
      {
        role: 'assistant',
        content: '👋 Started a new session! I am your **Senior AI Codebase Architect & Mentor**.\n\nAsk any question, request a **UML Class / Sequence Diagram**, or ask where specific features are implemented.',
        evidence: []
      }
    ]);
  };

  const handleDeleteConversation = async (e, convId) => {
    e.stopPropagation();
    if (deletingId) return;

    setDeletingId(convId);
    try {
      await ChatAPI.deleteConversation(convId);
      const updatedList = conversations.filter(c => c.id !== convId);
      setConversations(updatedList);

      if (activeConversationId === convId) {
        if (updatedList.length > 0) {
          loadConversationMessages(updatedList[0].id);
        } else {
          handleStartNewChat();
        }
      }
    } catch (err) {
      console.error("Failed to delete conversation:", err);
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    if (repository) {
      loadConversations();
    }
  }, [repository]);

  useEffect(() => {
    if (initialPrompt) {
      handleSend(initialPrompt);
      if (onClearInitialPrompt) onClearInitialPrompt();
    }
  }, [initialPrompt]);

  const handleProviderSelect = (newProvider) => {
    setProvider(newProvider);
    localStorage.setItem('byok_provider', newProvider);
  };

  const handleSend = async (customPrompt) => {
    const textToSend = customPrompt || input;
    if (!textToSend.trim() || loading) return;

    if (!repository || !repository.id) {
      setMessages((prev) => [
        ...prev,
        { role: 'user', content: textToSend },
        { 
          role: 'assistant', 
          content: '⚠️ **No Repository Selected**: Please open, import, or clone a repository using the **+ Repository** button in the top header before chatting with the codebase.',
          evidence: [],
          isStreaming: false
        }
      ]);
      if (!customPrompt) setInput('');
      return;
    }

    const userMessage = { role: 'user', content: textToSend };
    
    // Add user message and empty streaming assistant placeholder
    setMessages((prev) => [
      ...prev,
      userMessage,
      { role: 'assistant', content: '', evidence: [], isStreaming: true }
    ]);
    if (!customPrompt) setInput('');
    setLoading(true);

    // Read dynamic BYOK settings from localStorage
    const activeProv = localStorage.getItem('byok_provider') || provider;
    const customApiKey = localStorage.getItem(`byok_key_${activeProv}`) || null;
    const customModel = localStorage.getItem(`byok_model_${activeProv}`) || null;
    const customBaseUrl = localStorage.getItem(`byok_url_${activeProv}`) || null;

    try {
      await ChatAPI.streamMessage(
        {
          repositoryId: repository.id,
          conversationId: activeConversationId,
          message: textToSend,
          provider: activeProv,
          custom_api_key: customApiKey,
          custom_model: customModel,
          custom_base_url: customBaseUrl
        },
        // onToken callback (live typing)
        (token) => {
          setMessages((prev) => {
            const updated = [...prev];
            const lastIndex = updated.length - 1;
            if (lastIndex >= 0 && updated[lastIndex].role === 'assistant') {
              updated[lastIndex] = {
                ...updated[lastIndex],
                content: updated[lastIndex].content + token
              };
            }
            return updated;
          });
        },
        // onDone callback (finalize metadata & evidence)
        (doneData) => {
          const convId = doneData.conversation_id || activeConversationId;
          if (convId) {
            setActiveConversationId(convId);
            localStorage.setItem(`last_conv_${repository.id}`, convId);
            loadConversations();
          }

          const validEvidence = (doneData.evidence || []).filter(
            (ev) => ev.filePath && ev.filePath.trim().length > 1 && ev.filePath !== ':-' && ev.filePath !== '-'
          );

          setMessages((prev) => {
            const updated = [...prev];
            const lastIndex = updated.length - 1;
            if (lastIndex >= 0 && updated[lastIndex].role === 'assistant') {
              updated[lastIndex] = {
                ...updated[lastIndex],
                isStreaming: false,
                evidence: validEvidence
              };
            }
            return updated;
          });
          setLoading(false);
        },
        // onError callback
        (err) => {
          console.error("Stream error, falling back to standard API:", err);
          ChatAPI.sendMessage({
            repositoryId: repository.id,
            conversationId: activeConversationId,
            message: textToSend,
            provider: activeProv,
            custom_api_key: customApiKey,
            custom_model: customModel,
            custom_base_url: customBaseUrl
          }).then((res) => {
            const data = res.data;
            if (data.conversationId) {
              setActiveConversationId(data.conversationId);
              localStorage.setItem(`last_conv_${repository.id}`, data.conversationId);
              loadConversations();
            }
            const validEvidence = (data.evidence || []).filter(
              (ev) => ev.filePath && ev.filePath.trim().length > 1 && ev.filePath !== ':-' && ev.filePath !== '-'
            );
            setMessages((prev) => {
              const updated = [...prev];
              const lastIndex = updated.length - 1;
              updated[lastIndex] = {
                role: 'assistant',
                content: data.response,
                evidence: validEvidence,
                isStreaming: false
              };
              return updated;
            });
          }).catch((fallbackErr) => {
            const errorMsg = fallbackErr.response?.data?.message || fallbackErr.message || 'Request failed';
            setMessages((prev) => {
              const updated = [...prev];
              const lastIndex = updated.length - 1;
              updated[lastIndex] = {
                role: 'assistant',
                content: `⚠️ Failed to get answer: ${errorMsg}`,
                evidence: [],
                isStreaming: false
              };
              return updated;
            });
          }).finally(() => {
            setLoading(false);
          });
        }
      );
    } catch (err) {
      setLoading(false);
    }
  };

  const quickPrompts = [
    { 
      label: "📐 UML Class Diagram", 
      icon: GitFork, 
      prompt: "Draw a comprehensive Mermaid UML class diagram for this repository showing key service classes, models, interfaces, and their relationships." 
    },
    { 
      label: "🔄 Sequence Diagram", 
      icon: Activity, 
      prompt: "Draw a detailed Mermaid sequence diagram showing the primary end-to-end request flow across controllers, services, and database layers in this codebase." 
    },
    { 
      label: "🔍 Core Logic & Endpoints", 
      icon: Search, 
      prompt: "Where are the core business logic, services, and entrypoint endpoints implemented in this repository? Explain their responsibilities with exact code citations." 
    },
    { 
      label: "👶 Beginner Guide", 
      icon: GraduationCap, 
      prompt: "Explain this project and all its services as if I am a beginner developer. Break down each service step-by-step with simple analogies, what each component does, and how data moves between them." 
    },
    { 
      label: "🧭 Architecture Flow", 
      icon: Compass, 
      prompt: "Explain the overall architecture, key components, and request flow of this repository. Include a visual Mermaid architecture diagram." 
    },
    { 
      label: "🛡️ Security Audit", 
      icon: ShieldAlert, 
      prompt: "Perform a security analysis on the codebase. Check for potential vulnerabilities, secret leakage, and unsafe endpoints with verified code citations." 
    },
  ];

  const containerClasses = isFullWidth
    ? "flex-1 bg-[#060912] flex flex-col h-full min-h-0 overflow-hidden relative"
    : "w-[460px] bg-surface flex flex-col h-full min-h-0 shrink-0 border-l border-surfaceBorder overflow-hidden relative";

  return (
    <div className={containerClasses}>
      {/* Chat Header */}
      <div className="h-11 bg-surface/90 backdrop-blur-md border-b border-surfaceBorder flex items-center justify-between px-4 shrink-0 z-10">
        <div className="flex items-center space-x-2 text-xs">
          <button
            onClick={() => setIsHistoryOpen(!isHistoryOpen)}
            className={`p-1.5 rounded-lg border transition flex items-center space-x-1 ${
              isHistoryOpen
                ? 'bg-primary-600/30 border-primary-500/50 text-white'
                : 'bg-surfaceLight border-surfaceBorder text-slate-400 hover:text-white'
            }`}
            title="Toggle Historical Chats"
          >
            <History className="w-3.5 h-3.5 text-primary-400" />
            <span className="text-[11px] font-medium hidden sm:inline">Threads ({conversations.length})</span>
          </button>

          <button
            onClick={handleStartNewChat}
            className="p-1.5 rounded-lg bg-surfaceLight hover:bg-surfaceBorder border border-surfaceBorder text-slate-300 hover:text-white text-[11px] font-medium flex items-center space-x-1 transition"
            title="Start New Chat"
          >
            <Plus className="w-3.5 h-3.5 text-accent" />
            <span className="hidden sm:inline">New Chat</span>
          </button>
        </div>

        {/* Model Provider Selector & Settings Trigger */}
        <div className="flex items-center space-x-1.5">
          <select
            value={provider}
            onChange={(e) => handleProviderSelect(e.target.value)}
            className="bg-surfaceLight border border-surfaceBorder text-[11px] text-slate-300 rounded-lg px-2.5 py-1 focus:outline-none focus:border-primary-500 font-sans cursor-pointer"
          >
            <option value={PROVIDERS.GEMINI}>Gemini 2.5</option>
            <option value={PROVIDERS.OPENAI}>OpenAI (GPT-4o)</option>
            <option value={PROVIDERS.ANTHROPIC}>Claude 3.5</option>
            <option value={PROVIDERS.GROQ}>Groq (Llama 3.3)</option>
            <option value={PROVIDERS.DEEPSEEK}>DeepSeek V3</option>
            <option value={PROVIDERS.OLLAMA}>Ollama / Local</option>
          </select>

          {onOpenLLMSettings && (
            <button
              onClick={onOpenLLMSettings}
              className="p-1.5 rounded-lg bg-surfaceLight hover:bg-surfaceBorder border border-surfaceBorder text-slate-400 hover:text-amber-400 transition"
              title="Configure API Keys & Endpoints"
            >
              <Key className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Main Chat Body & Historical Drawer */}
      <div className="flex-1 min-h-0 flex overflow-hidden relative">
        {/* Historical Conversations Drawer */}
        {isHistoryOpen && (
          <div className="w-64 bg-[#080C18]/95 backdrop-blur-xl border-r border-surfaceBorder flex flex-col shrink-0 animate-in slide-in-from-left duration-150 z-20">
            <div className="p-3 border-b border-surfaceBorder flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold uppercase tracking-wider text-[10px] flex items-center space-x-1.5">
                <Clock className="w-3 h-3 text-primary-400" />
                <span>Past Conversations</span>
              </span>
              <button
                onClick={handleStartNewChat}
                className="text-[10px] text-primary-400 hover:text-primary-300 font-semibold"
              >
                + New
              </button>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-1.5 custom-scrollbar">
              {conversations.length === 0 ? (
                <div className="text-slate-500 text-[11px] text-center p-4">No past chats yet.</div>
              ) : (
                conversations.map((c) => {
                  const isActive = c.id === activeConversationId;
                  const isDeleting = deletingId === c.id;

                  return (
                    <div
                      key={c.id}
                      onClick={() => loadConversationMessages(c.id)}
                      className={`p-2.5 rounded-xl text-[11.5px] cursor-pointer transition flex items-center justify-between border group ${
                        isActive
                          ? 'bg-primary-600/20 border-primary-500/50 text-white font-medium shadow-sm'
                          : 'bg-surfaceLight/30 border-transparent text-slate-300 hover:bg-surfaceLight hover:border-surfaceBorder'
                      }`}
                    >
                      <div className="flex flex-col space-y-0.5 truncate flex-1 mr-2">
                        <div className="flex items-center space-x-1.5 truncate">
                          <MessageSquare className="w-3 h-3 text-primary-400 shrink-0" />
                          <span className="truncate">{c.title || 'Architect Chat'}</span>
                        </div>
                        <span className="text-[9.5px] text-slate-500 font-mono">
                          {new Date(c.createdAt).toLocaleDateString()} {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <button
                        onClick={(e) => handleDeleteConversation(e, c.id)}
                        disabled={isDeleting}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 opacity-0 group-hover:opacity-100 transition shrink-0"
                        title="Delete Conversation"
                      >
                        {isDeleting ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-400" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Messages Feed */}
        <div 
          ref={scrollContainerRef}
          className={`flex-1 min-h-0 overflow-y-auto p-4 space-y-4 text-xs select-text custom-scrollbar ${isFullWidth ? 'max-w-5xl mx-auto w-full' : ''}`}
        >
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className="flex items-center space-x-1.5 text-[10px] text-slate-400 mb-1 font-medium">
                {msg.role === 'user' ? (
                  <>
                    <span>You</span>
                    <User className="w-3 h-3 text-primary-300" />
                  </>
                ) : (
                  <>
                    <Bot className="w-3 h-3 text-primary-400" />
                    <span className="text-primary-300">AI Architect</span>
                    {msg.isStreaming && <span className="inline-block w-2 h-2 rounded-full bg-primary-400 animate-pulse ml-1" />}
                  </>
                )}
              </div>

              <div
                className={`p-4 rounded-2xl max-w-[98%] leading-relaxed shadow-lg ${
                  msg.role === 'user'
                    ? 'bg-primary-600 text-white font-medium rounded-tr-none'
                    : 'bg-[#0B1020] border border-surfaceBorder text-slate-200 rounded-tl-none font-sans'
                }`}
              >
                {msg.role === 'user' ? (
                  <p className="whitespace-pre-wrap text-[13px]">{msg.content}</p>
                ) : (
                  <MarkdownRenderer content={msg.content || (msg.isStreaming ? 'Thinking...' : '')} onOpenFileWithLines={onOpenFileWithLines} />
                )}
              </div>

              {/* Evidence Citations */}
              {msg.evidence && msg.evidence.length > 0 && (
                <div className="mt-2.5 space-y-1.5 w-full max-w-[98%]">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider pl-1">
                    Verified Repository Evidence:
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                    {msg.evidence.map((ev, eIdx) => (
                      <div
                        key={eIdx}
                        onClick={() => onOpenFileWithLines(ev.filePath, ev.startLine || 1, ev.endLine || 30)}
                        className="p-2 bg-surfaceLight/40 hover:bg-surfaceLight border border-surfaceBorder hover:border-primary-500/50 rounded-xl text-[11px] font-mono cursor-pointer transition flex items-center justify-between group"
                      >
                        <div className="flex items-center space-x-2 truncate">
                          <FileText className="w-3.5 h-3.5 text-primary-400 shrink-0" />
                          <span className="text-slate-300 group-hover:text-white truncate">
                            {ev.filePath}:{ev.startLine || 1}-{ev.endLine || 30}
                          </span>
                        </div>
                        <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-primary-400 shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}

          {loading && messages[messages.length - 1]?.role !== 'assistant' && (
            <div className="flex items-center space-x-2.5 text-slate-300 text-xs py-3 bg-surfaceLight/40 border border-surfaceBorder rounded-xl p-4">
              <Loader2 className="w-4 h-4 animate-spin text-primary-400" />
              <span>AI Architect is streaming response and analyzing AST symbols...</span>
            </div>
          )}
        </div>
      </div>

      {/* Quick Prompts */}
      <div className="px-3 py-2 border-t border-surfaceBorder bg-surfaceLight/20 flex space-x-2 overflow-x-auto shrink-0 custom-scrollbar z-10">
        {quickPrompts.map((qp, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(qp.prompt)}
            disabled={loading || !repository}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-surfaceLight border border-surfaceBorder hover:border-primary-500 text-[11px] text-slate-300 hover:text-white shrink-0 transition disabled:opacity-50 font-medium"
          >
            <qp.icon className="w-3.5 h-3.5 text-primary-400" />
            <span>{qp.label}</span>
          </button>
        ))}
      </div>

      {/* Input Box */}
      <div className="p-3.5 border-t border-surfaceBorder bg-surface shrink-0 z-10">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className={`flex items-center space-x-2 ${isFullWidth ? 'max-w-5xl mx-auto' : ''}`}
        >
          <input
            type="text"
            placeholder={repository ? "Ask anything: 'draw uml class diagram', 'where is speech to text logic', 'explain auth'..." : "Connect a repository first..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={!repository || loading}
            className="flex-1 bg-surfaceLight border border-surfaceBorder rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary-500 disabled:opacity-50 font-sans"
          />
          <button
            type="submit"
            disabled={!repository || !input.trim() || loading}
            className="p-2.5 px-4 bg-primary-600 hover:bg-primary-500 disabled:opacity-50 text-white rounded-xl transition shadow-lg shadow-primary-600/25 flex items-center space-x-1.5 font-medium text-xs"
          >
            <span>Send</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
