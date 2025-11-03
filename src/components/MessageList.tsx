/**
 * Message list component
 * Displays conversation history with visual distinction between student and tutor
 */

import { useEffect, useRef } from 'react';
import type { Message } from '@/types/conversation';
import MathRenderer from './MathRenderer';

interface MessageListProps {
  messages: Message[];
  problemStatement: string;
  isLoading?: boolean;
}

export default function MessageList({
  messages,
  problemStatement,
  isLoading = false,
}: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to newest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    <div className="flex-1 overflow-y-auto p-6">
      {/* Problem statement header */}
      <div className="bg-gray-100 rounded-lg p-4 mb-6 sticky top-0 shadow-sm">
        <h3 className="text-sm font-medium text-gray-600 mb-1">Problem:</h3>
        <div className="text-gray-900">
          <MathRenderer content={problemStatement} />
        </div>
      </div>

      {/* Messages */}
      <div className="space-y-4">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${
              msg.role === 'student' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-3 ${
                msg.role === 'student'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-900'
              }`}
            >
              <div className="text-xs opacity-75 mb-1">
                {msg.role === 'student' ? 'You' : 'Socrates'}
              </div>
              <MathRenderer content={msg.content} />
              <div className="text-xs opacity-75 mt-1">
                {msg.timestamp.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="max-w-[80%] rounded-lg px-4 py-3 bg-gray-200 text-gray-900">
              <div className="text-xs opacity-75 mb-1">Socrates</div>
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
                <span className="text-sm text-gray-600">thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
