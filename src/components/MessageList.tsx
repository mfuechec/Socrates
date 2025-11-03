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
}

export default function MessageList({
  messages,
  problemStatement,
}: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to newest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto p-6">
      {/* Problem statement header */}
      <div className="bg-gray-100 rounded-lg p-4 mb-6 sticky top-0 shadow-sm">
        <h3 className="text-sm font-medium text-gray-600 mb-1">Problem:</h3>
        <p className="text-gray-900">{problemStatement}</p>
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
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
