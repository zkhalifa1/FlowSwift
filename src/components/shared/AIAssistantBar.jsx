import React, { useRef, useEffect, useState, useCallback } from "react";
import { Send, AlertCircle, Sparkles, X } from "lucide-react";
import { colors } from "@/styles/colors";

/**
 * AIAssistantBar component - Floating chat widget
 * Circle button in bottom right that opens a resizable/draggable chat window
 */
export default function AIAssistantBar({
  input,
  setInput,
  sendMessage,
  isLoading = false,
  error = null,
  isConfigured = true,
  messages = [],
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [size, setSize] = useState({ width: 400, height: 500 });
  // Initialize position to bottom right (flush with corner)
  const [position, setPosition] = useState(() => ({
    x: typeof window !== 'undefined' ? window.innerWidth - 400 : 0,
    y: typeof window !== 'undefined' ? window.innerHeight - 500 : 0,
  }));
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const inputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const chatWindowRef = useRef(null);
  const buttonRef = useRef(null);

  // Update position if window resizes while closed
  useEffect(() => {
    const handleResize = () => {
      if (!isOpen) {
        setPosition({
          x: window.innerWidth - size.width,
          y: window.innerHeight - size.height,
        });
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isOpen, size]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && !isAnimating) {
      inputRef.current?.focus();
    }
  }, [isOpen, isAnimating]);

  const handleOpen = () => {
    setIsAnimating(true);
    setIsOpen(true);
    setTimeout(() => setIsAnimating(false), 200);
  };

  const handleClose = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setIsOpen(false);
      setIsAnimating(false);
    }, 150);
  };

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        isOpen &&
        !isAnimating &&
        chatWindowRef.current &&
        !chatWindowRef.current.contains(e.target) &&
        !isDragging
      ) {
        handleClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, isAnimating, isDragging]);

  // Dragging logic
  const handleDragStart = useCallback((e) => {
    if (e.target.closest('[data-no-drag]')) return;
    setIsDragging(true);
    const rect = chatWindowRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    e.preventDefault();
  }, []);

  const handleDrag = useCallback(
    (e) => {
      if (!isDragging) return;
      const newX = Math.max(0, Math.min(e.clientX - dragOffset.x, window.innerWidth - size.width));
      const newY = Math.max(0, Math.min(e.clientY - dragOffset.y, window.innerHeight - size.height));
      setPosition({ x: newX, y: newY });
    },
    [isDragging, dragOffset, size]
  );

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Global mouse events for drag
  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleDrag);
      document.addEventListener("mouseup", handleDragEnd);
      return () => {
        document.removeEventListener("mousemove", handleDrag);
        document.removeEventListener("mouseup", handleDragEnd);
      };
    }
  }, [isDragging, handleDrag, handleDragEnd]);

  const handleSend = () => {
    if (input.trim() && !isLoading && isConfigured) {
      sendMessage();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          ref={buttonRef}
          onClick={handleOpen}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110"
          style={{
            backgroundColor: colors.primary.main,
            color: colors.text.inverted,
          }}
        >
          <Sparkles className="w-6 h-6" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div
          ref={chatWindowRef}
          className="fixed z-50 flex flex-col rounded-xl overflow-hidden shadow-2xl"
          style={{
            left: position.x,
            top: position.y,
            width: size.width,
            height: size.height,
            backgroundColor: colors.background.white,
            border: `1px solid ${colors.ui.borderLight}`,
            transform: isAnimating ? (isOpen ? 'scale(0.9)' : 'scale(1)') : 'scale(1)',
            opacity: isAnimating && !isOpen ? 0 : 1,
            transition: 'transform 0.2s ease-out, opacity 0.15s ease-out',
            transformOrigin: 'bottom right',
            cursor: isDragging ? 'grabbing' : 'default',
          }}
        >
          {/* Header - Draggable */}
          <div
            className="px-4 py-3 flex items-center justify-between cursor-grab active:cursor-grabbing"
            style={{
              backgroundColor: colors.background.hover,
              borderBottom: `1px solid ${colors.ui.borderLight}`,
            }}
            onMouseDown={handleDragStart}
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" style={{ color: colors.primary.main }} />
              <span className="font-medium text-sm" style={{ color: colors.text.primary }}>
                AI Assistant
              </span>
            </div>
            <button
              data-no-drag
              onClick={handleClose}
              className="p-1 rounded transition-colors"
              style={{ color: colors.text.secondary }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = colors.ui.borderSubtle;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Warning/Error Messages */}
          {!isConfigured && (
            <div
              className="px-4 py-2 flex items-center gap-2 text-xs"
              style={{
                backgroundColor: "#FFF3E0",
                color: colors.status.warning,
                borderBottom: `1px solid ${colors.ui.borderLight}`,
              }}
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>OpenAI API not configured.</span>
            </div>
          )}

          {error && (
            <div
              className="px-4 py-2 flex items-center gap-2 text-xs"
              style={{
                backgroundColor: "#FFEBEE",
                color: colors.status.error,
                borderBottom: `1px solid ${colors.ui.borderLight}`,
              }}
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Messages Area */}
          <div
            className="flex-1 overflow-y-auto px-4 py-3 space-y-3"
            style={{ backgroundColor: colors.background.cream }}
          >
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <p className="text-sm" style={{ color: colors.text.tertiary }}>
                  Ask me anything about your voice notes...
                </p>
              </div>
            ) : (
              <>
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`max-w-[85%] text-sm px-3 py-2 rounded-lg ${
                      msg.role === "user" ? "ml-auto" : "mr-auto"
                    }`}
                    style={{
                      backgroundColor:
                        msg.role === "user"
                          ? colors.primary.main
                          : colors.background.white,
                      color:
                        msg.role === "user"
                          ? colors.text.inverted
                          : colors.text.primary,
                      border:
                        msg.role === "user"
                          ? "none"
                          : `1px solid ${colors.ui.borderLight}`,
                    }}
                  >
                    {msg.content}
                  </div>
                ))}
                {isLoading && (
                  <div
                    className="mr-auto max-w-[85%] text-sm px-3 py-2 rounded-lg flex items-center gap-2"
                    style={{
                      backgroundColor: colors.background.white,
                      border: `1px solid ${colors.ui.borderLight}`,
                      color: colors.text.secondary,
                    }}
                  >
                    <div
                      className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"
                      style={{
                        borderColor: colors.primary.main,
                        borderTopColor: "transparent",
                      }}
                    />
                    Thinking...
                  </div>
                )}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div
            className="px-4 py-3 flex items-center gap-2"
            style={{
              backgroundColor: colors.background.white,
              borderTop: `1px solid ${colors.ui.borderLight}`,
            }}
          >
            <input
              ref={inputRef}
              data-no-drag
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading || !isConfigured}
              placeholder={isLoading ? "AI is thinking..." : "Ask a question..."}
              className="flex-1 px-3 py-2 rounded-lg text-sm outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed placeholder:text-gray-400"
              style={{
                backgroundColor: colors.background.hover,
                color: colors.text.primary,
                border: `1px solid ${colors.ui.borderLight}`,
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = colors.text.secondary;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = colors.ui.borderLight;
              }}
            />
            <button
              data-no-drag
              onClick={handleSend}
              disabled={isLoading || !isConfigured || !input.trim()}
              className="w-9 h-9 rounded-lg flex items-center justify-center transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
              style={{
                backgroundColor: colors.primary.main,
                color: colors.text.inverted,
              }}
              onMouseEnter={(e) => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.backgroundColor = colors.primary.hover;
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = colors.primary.main;
              }}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
