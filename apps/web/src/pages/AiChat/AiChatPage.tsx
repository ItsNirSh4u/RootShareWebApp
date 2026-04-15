import { useState, useRef, useEffect, useCallback } from 'react';
import { Bot, Send, Trash2, Leaf, ImagePlus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { cn } from '@/lib/utils';
import { streamChatMessage, IChatMessage } from './ai';

const SUGGESTIONS = [
  'How often should I water my monstera?',
  'What plants thrive in low light?',
  'How do I fix yellowing leaves?',
  'What is the best soil for succulents?',
];

export function AiChatPage(): JSX.Element {
  const [messages, setMessages] = useState<IChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isStreaming) return;

      const history = [...messages];
      setMessages((prev) => [...prev, { role: 'user', content: trimmed }]);
      setInput('');
      setError(null);
      setIsStreaming(true);
      setStreamingContent('');

      abortRef.current = new AbortController();
      let accumulated = '';

      try {
        await streamChatMessage(
          trimmed,
          history,
          (chunk) => {
            accumulated += chunk;
            setStreamingContent(accumulated);
          },
          abortRef.current.signal,
        );
        if (accumulated) {
          setMessages((prev) => [...prev, { role: 'model', content: accumulated }]);
        } else {
          setError('No response received. Please try again.');
        }
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setError((err as Error).message ?? 'Something went wrong.');
        }
      } finally {
        setStreamingContent('');
        setIsStreaming(false);
      }
    },
    [messages, isStreaming],
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const handleClear = () => {
    abortRef.current?.abort();
    setMessages([]);
    setStreamingContent('');
    setIsStreaming(false);
    setError(null);
  };

  const isEmpty = messages.length === 0 && !isStreaming;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border-default bg-bg-card flex-shrink-0">
        <div className="flex items-center gap-2">
          <Bot size={20} className="text-primary" />
          <span className="text-sm font-semibold text-text-base">Plant Assistant</span>
        </div>
        {messages.length > 0 && (
          <Button variant="ghost" size="icon" onClick={handleClear} aria-label="New chat">
            <Trash2 size={16} className="text-text-muted" />
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center h-full gap-6 text-center">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
              <Leaf size={32} className="text-primary" />
            </div>
            <div>
              <p className="text-base font-semibold text-text-base">Ask me anything about plants</p>
              <p className="text-sm text-text-muted mt-1">
                Plant care, watering, soil, seasons, and more.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 w-full max-w-md">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="text-left text-sm px-3 py-2 rounded-lg border border-border-default bg-bg-card hover:bg-bg-muted text-text-muted hover:text-text-base transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, i) => (
              <MessageBubble key={i} message={msg} />
            ))}
            {streamingContent && (
              <MessageBubble message={{ role: 'model', content: streamingContent }} isStreaming />
            )}
            {isStreaming && !streamingContent && (
              <div className="flex items-start gap-2">
                <BotAvatar />
                <div className="bg-bg-card border border-border-default rounded-xl px-3 py-2">
                  <Spinner size="sm" className="text-text-muted" />
                </div>
              </div>
            )}
          </>
        )}
        {error && <p className="text-sm text-destructive text-center">{error}</p>}
        <div ref={bottomRef} />
      </div>

      <div className="flex-shrink-0 border-t border-border-default bg-bg-card px-4 py-3">
        <div className="flex items-end gap-2">
          <Button
            variant="ghost"
            size="icon"
            disabled={isStreaming}
            aria-label="Upload image"
            title="Upload image (coming soon)"
          >
            <ImagePlus size={18} className="text-text-muted" />
          </Button>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about plant care..."
            rows={1}
            disabled={isStreaming}
            className={cn(
              'flex-1 resize-none rounded-md border border-border-input bg-bg-main px-3 py-2 text-sm',
              'placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
              'disabled:opacity-50 transition-colors max-h-32 overflow-y-auto',
            )}
            style={{ lineHeight: '1.5rem' }}
          />
          <Button
            size="icon"
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isStreaming}
            aria-label="Send message"
          >
            <Send size={16} />
          </Button>
        </div>
        <p className="text-xs text-text-muted mt-1.5">Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  );
}

interface MessageBubbleProps {
  message: IChatMessage;
  isStreaming?: boolean;
}

function BotAvatar(): JSX.Element {
  return (
    <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
      <Bot size={14} className="text-primary" />
    </div>
  );
}

function MessageBubble({ message, isStreaming = false }: MessageBubbleProps): JSX.Element {
  const isUser = message.role === 'user';
  return (
    <div className={cn('flex items-start gap-2', isUser && 'flex-row-reverse')}>
      {!isUser && <BotAvatar />}
      <div
        className={cn(
          'max-w-[75%] rounded-xl px-3 py-2 text-sm whitespace-pre-wrap',
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-bg-card border border-border-default text-text-base',
        )}
      >
        {message.content}
        {isStreaming && (
          <span className="inline-block w-0.5 h-3.5 bg-current ml-0.5 animate-pulse" />
        )}
      </div>
    </div>
  );
}
