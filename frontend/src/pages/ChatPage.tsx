import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAnalysis } from '../context/AnalysisContext';
import { 
  Send, 
  Bot, 
  User as UserIcon, 
  HelpCircle,
  FileSpreadsheet
} from 'lucide-react';

export const ChatPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { chatHistory, askQuestion } = useAnalysis();

  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const suggestionChips = [
    'Explain authentication flow',
    'Where is database query code?',
    'Find security risks in controller path',
    'Show project API endpoints',
    'Generate developer learning roadmap'
  ];

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const handleSend = async (text: string) => {
    if (!text.trim() || sending) return;
    setInput('');
    setSending(true);
    
    await askQuestion(Number(id), text);
    setSending(false);
  };

  const parseRelevantFiles = (filesJson?: string): string[] => {
    if (!filesJson) return [];
    try {
      return JSON.parse(filesJson);
    } catch {
      return [];
    }
  };

  const formatMessageText = (text: string) => {
    if (!text) return '';
    // 1. Remove markdown horizontal rules (---)
    let formatted = text.replace(/^-{3,}\s*$/gm, '');
    
    // 2. Remove headers syntax (## or ###) but keep the text
    formatted = formatted.replace(/^#+\s*(.*)$/gm, '$1');

    // 3. Remove bold indicators (**)
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '$1');

    // 4. Clean up lists (convert leading "- " or "* " to bullet points "• ")
    formatted = formatted.replace(/^[-*]\s+/gm, '• ');

    return formatted;
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col justify-between border border-white/5 rounded-2xl overflow-hidden glass-container">
      
      {/* Top Header */}
      <div className="px-6 py-4 border-b border-white/5 bg-slate-950/20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl">
            <Bot className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm">Repo-Aware AI Assistant</h3>
            <span className="text-[10px] text-slate-500">Retrieval-Augmented Generation (RAG) active</span>
          </div>
        </div>
      </div>

      {/* Main Conversation Feed */}
      <div className="flex-grow overflow-y-auto p-6 space-y-4 bg-slate-950/10">
        {chatHistory.map((msg) => {
          const filesRef = parseRelevantFiles(msg.relevantFiles);
          const isAi = msg.sender === 'AI';

          return (
            <div 
              key={msg.id}
              className={`flex gap-4 max-w-[85%] ${isAi ? '' : 'ml-auto flex-row-reverse'}`}
            >
              {/* Avatar */}
              <div className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center border border-white/5 text-xs font-semibold
                ${isAi ? 'bg-indigo-600/15 text-indigo-400' : 'bg-slate-800 text-slate-300'}`}>
                {isAi ? <Bot className="w-4 h-4" /> : <UserIcon className="w-4 h-4" />}
              </div>

              {/* Chat bubble body */}
              <div className="space-y-2">
                <div className={`rounded-2xl p-4 text-xs leading-relaxed whitespace-pre-wrap
                  ${isAi 
                    ? 'bg-slate-900/50 text-slate-300 border border-white/5' 
                    : 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10'}`}>
                  {formatMessageText(msg.messageText)}
                </div>

                {/* Consulted Files indicators */}
                {isAi && filesRef.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[9px] text-slate-500 font-bold uppercase mr-1">RAG Context:</span>
                    {filesRef.map((file, idx) => (
                      <button
                        key={idx}
                        onClick={() => navigate(`/project/${id}/explorer`)}
                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded border border-indigo-500/15 text-[10px] font-semibold transition-colors"
                      >
                        <FileSpreadsheet className="w-3 h-3" />
                        <span>{file.substring(file.lastIndexOf('/') + 1)}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {sending && (
          <div className="flex gap-4 max-w-[85%]">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/15 text-indigo-400 border border-white/5 flex items-center justify-center text-xs animate-pulse">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Footer panel with suggestions & input */}
      <div className="p-4 border-t border-white/5 bg-slate-950/20 space-y-4">
        
        {/* Suggestion Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <HelpCircle className="w-4 h-4 text-slate-500 shrink-0" />
          {suggestionChips.map((chip, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(chip)}
              className="px-3 py-1 bg-slate-900/40 hover:bg-slate-800 border border-white/5 rounded-lg text-[10px] text-slate-400 hover:text-white transition-colors shrink-0 whitespace-nowrap"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSend(input); }} 
          className="flex items-center gap-3 bg-slate-950/60 border border-white/5 rounded-xl px-4 py-2 text-slate-300"
        >
          <input
            type="text"
            placeholder="Ask a question about this workspace (RAG retrieves relevant files)..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-grow bg-transparent text-xs py-2 outline-none placeholder-slate-600 text-white"
          />
          <button
            type="submit"
            disabled={!input.trim() || sending}
            className="p-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-md shadow-indigo-600/10 disabled:opacity-40 disabled:hover:bg-indigo-600 transition-all"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

    </div>
  );
};
export default ChatPage;
