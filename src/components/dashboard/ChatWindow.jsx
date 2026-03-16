import { X, Maximize2, Minimize2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";

export default function ChatWindow({
  onClose,
  messages,
  input,
  setInput,
  sendMessage,
  isLoading = false,
  error = null,
  contextInfo = null,
  isConfigured = true
}) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [position, setPosition] = useState(() => {
    // Try to load saved position from localStorage
    const saved = localStorage.getItem('chatWindowPosition');
    if (saved) {
      return JSON.parse(saved);
    }
    // Default centered position
    return {
      x: (window.innerWidth - 500) / 2,
      y: window.innerHeight * 0.15
    };
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [messages]);

  // Save position to localStorage whenever it changes
  useEffect(() => {
    if (!isFullscreen) {
      localStorage.setItem('chatWindowPosition', JSON.stringify(position));
    }
  }, [position, isFullscreen]);

  // Drag handlers
  const handleMouseDown = (e) => {
    if (isFullscreen) return;
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handleMouseMove = (e) => {
    if (!isDragging || isFullscreen) return;
    setPosition({
      x: e.clientX - dragOffset.x,
      y: e.clientY - dragOffset.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset]);

  return (
    <AnimatePresence>
      <motion.div
        className={clsx(
          "fixed z-50 bg-[#1e1e1e] text-white shadow-xl border border-neutral-700 rounded-xl flex flex-col overflow-hidden",
          isFullscreen
            ? "top-0 left-0 w-screen h-screen"
            : "w-[500px] h-[600px]"
        )}
        style={!isFullscreen ? {
          left: `${position.x}px`,
          top: `${position.y}px`,
          cursor: isDragging ? 'grabbing' : 'default'
        } : {}}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
      >
        <div
          className="flex items-center justify-between px-4 py-2 bg-[#2b2b2b] border-b border-neutral-700 cursor-grab active:cursor-grabbing select-none"
          onMouseDown={handleMouseDown}
        >
          <div className="flex items-center gap-2">
            <div className="text-sm font-medium">Ask Me</div>
            {contextInfo && (
              <div className="text-xs text-gray-400">
                {contextInfo.includedInContext} notes
              </div>
            )}
            {!isConfigured && (
              <div className="text-xs text-red-400">Not configured</div>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="text-white hover:bg-[#3b3b3b]"
            >
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-white hover:bg-[#3b3b3b]"
            >
              <X size={16} />
            </Button>
          </div>
        </div>

        <div
          ref={scrollRef}
          className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#1e1e1e]"
        >
          {!isConfigured && (
            <div className="p-4 bg-red-900/20 border border-red-500/20 rounded-md text-red-300 text-sm">
              <div className="font-medium mb-1">OpenAI API not configured</div>
              <div>Please add your OpenAI API key to the environment variables as VITE_OPENAI_API_KEY to enable AI chat.</div>
            </div>
          )}
          
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={clsx(
                "max-w-[80%] text-sm px-4 py-2 rounded-md",
                msg.role === "user"
                  ? "ml-auto bg-[#3b3b3b]"
                  : "mr-auto bg-[#2a2a2a]"
              )}
            >
              {msg.content}
            </div>
          ))}
          
          {isLoading && (
            <div className="mr-auto bg-[#2a2a2a] max-w-[80%] text-sm px-4 py-2 rounded-md">
              <div className="flex items-center gap-2">
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                Thinking...
              </div>
            </div>
          )}
          
          {error && (
            <div className="p-3 bg-red-900/20 border border-red-500/20 rounded-md text-red-300 text-sm">
              <div className="font-medium mb-1">Error</div>
              {error}
            </div>
          )}
        </div>

        <div className="p-3 border-t border-neutral-700 bg-[#2b2b2b] flex gap-2">
          <Input
            className="bg-[#1e1e1e] text-white border-neutral-700 focus-visible:ring-0 focus-visible:ring-offset-0"
            placeholder={isLoading ? "AI is thinking..." : "Type something..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && !isLoading && sendMessage()}
            disabled={isLoading || !isConfigured}
          />
          <Button
            onClick={sendMessage}
            className="bg-white text-black hover:bg-gray-200"
            disabled={isLoading || !isConfigured || !input.trim()}
          >
            {isLoading ? "..." : "Send"}
          </Button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}