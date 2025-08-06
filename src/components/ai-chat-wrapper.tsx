'use client';

import { AIChat } from '@reverse-ui/react';
import { useEffect, useState } from 'react';

interface AIChatWrapperProps {
  name?: string;
  description?: string;
}

export default function AIChatWrapper({ name, description }: AIChatWrapperProps) {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const checkTheme = () => {
      const isDarkMode = document.documentElement.classList.contains('dark');
      setIsDark(isDarkMode);
    };

    checkTheme();

    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className={`relative -ml-8 ${isDark ? 'ai-chat-dark' : 'ai-chat-light'}`}>
      <style jsx>{`
        .ai-chat-dark {
          filter: contrast(1.1) brightness(1.05);
        }
        .ai-chat-dark :global([style*="color: #c2e6eb"]) {
          color: #e2e8f0 !important;
        }
        .ai-chat-dark :global([style*="color: #c2e6eb8f"]) {
          color: #cbd5e0 !important;
        }
        .ai-chat-dark :global([style*="color: #c2e6eb59"]) {
          color: #a0aec0 !important;
        }
        .ai-chat-dark :global([style*="color: #c2e6ebd4"]) {
          color: #e2e8f0 !important;
        }
        .ai-chat-dark :global([style*="background: #c2e6eb0a"]) {
          background: rgba(45, 55, 72, 0.3) !important;
        }
        .ai-chat-dark :global([style*="border: 1px solid #c2e6eb1f"]) {
          border: 1px solid rgba(226, 232, 240, 0.2) !important;
        }
        .ai-chat-dark :global([style*="border: 1px solid #c2e6eb14"]) {
          border: 1px solid rgba(226, 232, 240, 0.15) !important;
        }
        
        .ai-chat-light {
          filter: contrast(1.1) brightness(1.05);
        }
        .ai-chat-light :global([style*="color: #c2e6eb"]) {
          color: #1f2937 !important;
        }
        .ai-chat-light :global([style*="color: #c2e6eb8f"]) {
          color: #4b5563 !important;
        }
        .ai-chat-light :global([style*="color: #c2e6eb59"]) {
          color: #6b7280 !important;
        }
        .ai-chat-light :global([style*="color: #c2e6ebd4"]) {
          color: #1f2937 !important;
        }
        .ai-chat-light :global([style*="background: #c2e6eb0a"]) {
          background: rgba(243, 244, 246, 0.8) !important;
        }
        .ai-chat-light :global([style*="border: 1px solid #c2e6eb1f"]) {
          border: 1px solid rgba(31, 41, 55, 0.2) !important;
        }
        .ai-chat-light :global([style*="border: 1px solid #c2e6eb14"]) {
          border: 1px solid rgba(31, 41, 55, 0.15) !important;
        }
      `}</style>
      <AIChat name={name} description={description} />
    </div>
  );
} 