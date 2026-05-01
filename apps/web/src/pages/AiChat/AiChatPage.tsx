import { useState, useRef, useEffect, useCallback } from 'react';
import { Bot, Send, Trash2, Leaf, ImagePlus, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { cn } from '@/lib/utils';
import { streamChatMessage, identifyPlant, IChatMessage, IChatDisplayMessage } from './ai';

const SUGGESTIONS = [
  'How often should I water my monstera?',
  'What plants thrive in low light?',
  'How do I fix yellowing leaves?',
  'What is the best soil for succulents?',
];

export function AiChatPage(): JSX.Element {
  const [messages, setMessages] = useState<IChatDisplayMessage[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  useEffect(() => {
    return () => {
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    };
  }, [imagePreviewUrl]);

  const clearImage = () => {
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    setSelectedImage(null);
    setImagePreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    setSelectedImage(file);
    setImagePreviewUrl(URL.createObjectURL(file));
  };

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if ((!trimmed && !selectedImage) || isStreaming) return;

      setError(null);
      setIsStreaming(true);
      setInput('');

      if (selectedImage && imagePreviewUrl) {
        const imageFile = selectedImage;
        const previewUrl = imagePreviewUrl;
        setSelectedImage(null);
        setImagePreviewUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = '';

        setMessages((prev) => [
          ...prev,
          { role: 'user', content: trimmed || '📷 Plant photo', imageUrl: previewUrl },
        ]);

        try {
          const result = await identifyPlant(imageFile);
          setMessages((prev) => [...prev, { role: 'model', content: result }]);
        } catch (err) {
          setError((err as Error).message ?? 'Failed to identify plant.');
        } finally {
          setIsStreaming(false);
        }
        return;
      }

      const history: IChatMessage[] = messages.map(({ role, content }) => ({ role, content }));
      setMessages((prev) => [...prev, { role: 'user', content: trimmed }]);
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
    [messages, isStreaming, selectedImage, imagePreviewUrl],
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
    clearImage();
  };

  const isEmpty = messages.length === 0 && !isStreaming;
  const canSend = (input.trim().length > 0 || !!selectedImage) && !isStreaming;

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
        {imagePreviewUrl && (
          <div className="relative inline-block mb-2">
            <img
              src={imagePreviewUrl}
              alt="Selected plant"
              className="h-20 w-20 object-cover rounded-lg border border-border-default"
            />
            <button
              onClick={clearImage}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-bg-card border border-border-default flex items-center justify-center hover:bg-bg-muted"
              aria-label="Remove image"
            >
              <X size={10} className="text-text-muted" />
            </button>
          </div>
        )}
        <div className="flex items-end gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleImageChange}
          />
          <Button
            variant="ghost"
            size="icon"
            disabled={isStreaming}
            aria-label="Upload image"
            onClick={() => fileInputRef.current?.click()}
          >
            <ImagePlus size={18} className={cn('transition-colors', selectedImage ? 'text-primary' : 'text-text-muted')} />
          </Button>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={selectedImage ? 'Add a message or send the photo…' : 'Ask about plant care...'}
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
            disabled={!canSend}
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
  message: IChatDisplayMessage;
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
          'max-w-[75%] rounded-xl px-3 py-2 text-sm',
          isUser
            ? 'bg-primary text-primary-foreground whitespace-pre-wrap'
            : 'bg-bg-card border border-border-default text-text-base',
        )}
      >
        {message.imageUrl && (
          <img
            src={message.imageUrl}
            alt="Plant photo"
            className="rounded-lg mb-1 max-h-48 object-cover"
          />
        )}
        {isUser ? (
          message.content
        ) : (
          <ReactMarkdown
            components={{
              p: ({ children }) => <p className="mb-1 last:mb-0">{children}</p>,
              strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
              ul: ({ children }) => <ul className="list-disc pl-4 mb-1 space-y-0.5">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal pl-4 mb-1 space-y-0.5">{children}</ol>,
              li: ({ children }) => <li>{children}</li>,
              h1: ({ children }) => <p className="font-semibold mb-1">{children}</p>,
              h2: ({ children }) => <p className="font-semibold mb-1">{children}</p>,
              h3: ({ children }) => <p className="font-medium mb-0.5">{children}</p>,
            }}
          >
            {message.content}
          </ReactMarkdown>
        )}
        {isStreaming && (
          <span className="inline-block w-0.5 h-3.5 bg-current ml-0.5 animate-pulse" />
        )}
      </div>
    </div>
  );
}
