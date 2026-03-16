import { useState, useCallback, useEffect, useRef } from 'react';
import { streamChatMessage, isChatConfigured } from '@/apis/openai/chat';
import { buildDateRangeContext, buildVoiceNoteContext } from '@/apis/audio/context';
import { logger } from "@/utils/logger";


/**
 * Hook for managing AI chat sessions with voice note context
 */
export function useChatSession(voiceNotes, dateRange = null) {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [contextInfo, setContextInfo] = useState(null);

  // Build context when voice notes or date range changes
  useEffect(() => {
    if (voiceNotes.length === 0) {
      setContextInfo(null);
      return;
    }

    let context;
    if (dateRange && dateRange.startDate && dateRange.endDate) {
      context = buildDateRangeContext(voiceNotes, dateRange.startDate, dateRange.endDate);
    } else {
      context = buildVoiceNoteContext(voiceNotes);
    }

    setContextInfo(context);
  }, [voiceNotes, dateRange]);

  // Ref to track streaming message index
  const streamingIndexRef = useRef(null);

  /**
   * Send a message to the AI with streaming response
   * @param {string} userMessage - User's message
   */
  const sendMessage = useCallback(async (userMessage) => {
    if (!userMessage.trim()) return;

    if (!isChatConfigured()) {
      setError('OpenAI API key not configured. Please add VITE_OPENAI_API_KEY to your environment variables.');
      return;
    }

    setIsLoading(true);
    setError(null);

    // Add user message to conversation
    const newUserMessage = { role: 'user', content: userMessage };
    const updatedMessages = [...messages, newUserMessage];

    // Add empty AI message that will be filled progressively
    const aiMessage = { role: 'assistant', content: '' };
    setMessages([...updatedMessages, aiMessage]);

    // Track the index of the streaming message
    const streamingIndex = updatedMessages.length;
    streamingIndexRef.current = streamingIndex;

    try {
      // Build context from voice notes
      const context = contextInfo?.context || '';

      // Stream response from AI
      await streamChatMessage(updatedMessages, context, (chunk, fullText) => {
        // Update the streaming message content
        setMessages(prev => {
          const newMessages = [...prev];
          if (newMessages[streamingIndex]) {
            newMessages[streamingIndex] = {
              role: 'assistant',
              content: fullText
            };
          }
          return newMessages;
        });
      });

    } catch (err) {
      logger.error('Chat error:', err);
      setError(err.message);

      // Update the streaming message with error
      setMessages(prev => {
        const newMessages = [...prev];
        if (newMessages[streamingIndex]) {
          newMessages[streamingIndex] = {
            role: 'assistant',
            content: `Sorry, I encountered an error: ${err.message}`
          };
        }
        return newMessages;
      });
    } finally {
      setIsLoading(false);
      streamingIndexRef.current = null;
    }
  }, [messages, contextInfo]);

  /**
   * Clear the chat conversation
   */
  const clearChat = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  /**
   * Add a welcome message when context is available
   */
  useEffect(() => {
    if (contextInfo && contextInfo.transcriptionCount > 0 && messages.length === 0) {
      const welcomeMessage = {
        role: 'assistant',
        content: `Hello! I can help you analyze your voice notes. I currently have access to ${contextInfo.includedInContext} transcribed voice notes${contextInfo.dateRange ? ` from ${contextInfo.dateRange.earliest.toLocaleDateString()} to ${contextInfo.dateRange.latest.toLocaleDateString()}` : ''}. What would you like to know about them?`
      };
      setMessages([welcomeMessage]);
    }
  }, [contextInfo]); // Only run when contextInfo changes, not when messages change

  return {
    messages,
    sendMessage,
    clearChat,
    isLoading,
    error,
    contextInfo,
    isConfigured: isChatConfigured()
  };
}