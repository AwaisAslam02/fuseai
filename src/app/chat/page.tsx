'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Plus, MessageSquare, ArrowLeft, Bot, User, Settings, Trash2, Paperclip, ChevronDown, LogOut, Menu, X, Copy, Check } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { ThemeToggle } from '@/components/theme-provider';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  model: string;
}

interface Chat {
  id: string;
  session_id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  model: string;
}

const AI_MODELS = [
  { id: 'fusedaipro', name: 'FusedAI Pro', description: 'Smartest model - auto-selects the best AI for your query', color: 'bg-gradient-to-r from-indigo-500 to-purple-600' },
  { id: 'claude', name: 'Claude', description: 'Advanced reasoning and thoughtful analysis', color: 'bg-blue-500' },
  { id: 'openai', name: 'GPT', description: 'Creative writing and programming excellence', color: 'bg-green-500' },
  { id: 'gemini', name: 'Gemini', description: 'Google\'s multimodal AI with strong vision capabilities', color: 'bg-orange-500' },
  { id: 'grok', name: 'Grok', description: 'Real-time insights and current information access', color: 'bg-red-500' },
  { id: 'deepseek', name: 'DeepSeek', description: 'High-performance reasoning and technical analysis', color: 'bg-purple-500' },
  { id: 'fusedai', name: 'FusedAI', description: 'Multi-model synthesis for comprehensive research', color: 'bg-indigo-500' },
  { id: 'perplexity', name: 'Perplexity', description: 'Real-time search and web-connected AI assistant', color: 'bg-teal-500' },
];
   
export default function ChatPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const [message, setMessage] = useState('');
  const [selectedModel, setSelectedModel] = useState('fusedaipro');
  const [isLoading, setIsLoading] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [deletingChatId, setDeletingChatId] = useState<string | null>(null);
  const [isClearingChat, setIsClearingChat] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modelDropdownRef = useRef<HTMLDivElement>(null);

  // Load chat sessions on component mount
  useEffect(() => {
    loadChatSessions();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentChat?.messages]);

  // Check authentication and load sessions
  const loadChatSessions = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Invalid token"
        });
        window.location.href = '/login';
        return;
      }

      const response = await fetch('https://chikaai.net/api/fusedai/get-chat-sessions', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'token': `${token}`
        }
      });

      const data = await response.json();

      if (response.status === 401 || (data.detail && data.detail.includes('401'))) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Invalid token"
        });
        localStorage.removeItem('token');
        window.location.href = '/login';
        return;
      }

      if (!response.ok) {
        throw new Error(data.detail || data.message || 'Failed to load chat sessions');
      }

      // Handle the response format - check if data has sessions array or is directly an array
      let sessions = [];
      if (Array.isArray(data)) {
        sessions = data;
      } else if (data.sessions && Array.isArray(data.sessions)) {
        sessions = data.sessions;
      } else if (data.chat_sessions && Array.isArray(data.chat_sessions)) {
        sessions = data.chat_sessions;
      } else {
        console.log('Unexpected response format:', data);
        sessions = [];
      }

      // Transform sessions to match our Chat interface
      const transformedChats: Chat[] = sessions.map((session: any) => ({
        id: session.session_id,
        session_id: session.session_id,
        title: session.chat_session_name,
        messages: [],
        createdAt: new Date(session.updated_at),
        updatedAt: new Date(session.updated_at),
        model: 'gemini'
      }));

      setChats(transformedChats);
    } catch (error) {
      console.error('Error loading chat sessions:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to load chat sessions'
      });
    } finally {
      setIsLoadingSessions(false);
    }
  };

  // Create new chat session
  const createChatSession = async (firstMessage: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Invalid token"
        });
        window.location.href = '/login';
        return null;
      }

      const sessionName = firstMessage.length > 30 ? firstMessage.substring(0, 30) + '...' : firstMessage;

      const response = await fetch('https://chikaai.net/api/fusedai/create-chat-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'token': `${token}`
        },
        body: JSON.stringify({
          chat_session_name: sessionName
        })
      });

      const data = await response.json();

      if (response.status === 401 || (data.detail && data.detail.includes('401'))) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Invalid token"
        });
        localStorage.removeItem('token');
        window.location.href = '/login';
        return null;
      }

      if (!response.ok) {
        throw new Error(data.detail || data.message || 'Failed to create chat session');
      }

      return data.session_id;
    } catch (error) {
      console.error('Error creating chat session:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to create chat session'
      });
      return null;
    }
  };

  // Send message to AI
  const sendMessageToAI = async (sessionId: string, userMessage: string, model: string, file?: File) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Invalid token"
        });
        window.location.href = '/login';
        return null;
      }

      const formData = new FormData();
      formData.append('session_id', sessionId);
      formData.append('message', userMessage);
      formData.append('model', model);
      
      if (file) {
        formData.append('file', file);
      }

      const response = await fetch('https://chikaai.net/api/fusedai/chat-with-ai', {
        method: 'POST',
        headers: {
          'token': `${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (response.status === 401 || (data.detail && data.detail.includes('401'))) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Invalid token"
        });
        localStorage.removeItem('token');
        window.location.href = '/login';
        return null;
      }

      if (!response.ok) {
        throw new Error(data.detail || data.message || 'Failed to send message');
      }

      return data.ai_response;
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to send message'
      });
      return null;
    }
  };

  // Load messages for existing chat
  const loadChatMessages = async (sessionId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Invalid token"
        });
        window.location.href = '/login';
        return;
      }

      const response = await fetch('https://chikaai.net/api/fusedai/get-chat-session-messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'token': `${token}`
        },
        body: JSON.stringify({
          session_id: sessionId
        })
      });

      const data = await response.json();

      if (response.status === 401 || (data.detail && data.detail.includes('401'))) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Invalid token"
        });
        localStorage.removeItem('token');
        window.location.href = '/login';
        return;
      }

      if (!response.ok) {
        throw new Error(data.detail || data.message || 'Failed to load messages');
      }

      // Transform messages to match our Message interface
      const messages: Message[] = [];
      data.chat_messages.forEach((msg: any, index: number) => {
        if (msg.user_message) {
          messages.push({
            id: `user_${index}`,
            content: msg.user_message,
            role: 'user',
            timestamp: new Date(msg.user_time),
            model: selectedModel
          });
        }
        if (msg.ai_message) {
          messages.push({
            id: `ai_${index}`,
            content: msg.ai_message,
            role: 'assistant',
            timestamp: new Date(msg.ai_time),
            model: selectedModel
          });
        }
      });

      return messages;
    } catch (error) {
      console.error('Error loading messages:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to load messages'
      });
      return [];
    }
  };

  // Close attachment menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      const attachmentMenu = document.querySelector('[data-attachment-menu]');
      const attachmentButton = document.querySelector('[data-attachment-button]');
      
      if (showAttachmentMenu && 
          attachmentMenu && 
          !attachmentMenu.contains(target) && 
          attachmentButton && 
          !attachmentButton.contains(target)) {
        setShowAttachmentMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showAttachmentMenu]);

  // Close model dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(event.target as Node)) {
        setShowModelDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const createNewChat = () => {
    const newChat: Chat = {
      id: Date.now().toString(),
      title: 'New Chat',
      model: selectedModel,
      createdAt: new Date(),
      updatedAt: new Date(),
      session_id: '', // Will be populated after first message
      messages: []
    };
    setChats([newChat, ...chats]);
    setCurrentChat(newChat);
  };

  const selectChat = async (chat: Chat) => {
    if (chat.session_id && chat.messages.length === 0) {
      // Load messages for existing chat
      setIsLoadingMessages(true);
      const messages = await loadChatMessages(chat.session_id);
      const updatedChat = {
        ...chat,
        messages: messages || []
      };
      setCurrentChat(updatedChat);
      // Update the chat in the chats array
      setChats(chats.map(c => c.id === chat.id ? updatedChat : c));
      setIsLoadingMessages(false);
    } else {
      setCurrentChat(chat);
    }
  };

  const sendMessage = async () => {
    if (!message.trim()) return;

    let chatToUpdate = currentChat;
    let sessionId = currentChat?.session_id;

    // If no current chat or no session_id, create a new chat session
    if (!currentChat || !currentChat.session_id) {
      // Create new chat session
      sessionId = await createChatSession(message.trim());
      if (!sessionId) {
        return; // Error already handled in createChatSession
      }

      if (!currentChat) {
        // Create new chat object
        const newChat: Chat = {
          id: Date.now().toString(),
          session_id: sessionId,
          title: message.length > 30 ? message.substring(0, 30) + '...' : message,
          messages: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          model: selectedModel
        };
        setCurrentChat(newChat);
        setChats([newChat, ...chats]);
        chatToUpdate = newChat;
      } else {
        // Update existing chat with session_id
        chatToUpdate = {
          ...currentChat,
          session_id: sessionId,
          title: message.length > 30 ? message.substring(0, 30) + '...' : message
        };
        setCurrentChat(chatToUpdate);
        setChats(chats.map(chat => chat.id === chatToUpdate!.id ? chatToUpdate! : chat));
      }

      // Reload chat sessions to get the updated list
      await loadChatSessions();
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      content: message,
      role: 'user',
      timestamp: new Date(),
      model: selectedModel
    };

    const updatedChat = {
      ...chatToUpdate!,
      messages: [...chatToUpdate!.messages, userMessage]
    };

    setCurrentChat(updatedChat);
    setChats(chats.map(chat => chat.id === updatedChat.id ? updatedChat : chat));
    setMessage('');
    setSelectedFile(null); // Clear selected file
    setIsLoading(true);

    // Send message to AI
    const aiResponse = await sendMessageToAI(sessionId!, message, selectedModel, selectedFile || undefined);
    
    if (aiResponse) {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: aiResponse,
        role: 'assistant',
        timestamp: new Date(),
        model: selectedModel
      };

      const finalChat = {
        ...updatedChat,
        messages: [...updatedChat.messages, aiMessage],
        updatedAt: new Date()
      };

      setCurrentChat(finalChat);
      setChats(chats.map(chat => chat.id === finalChat.id ? finalChat : chat));
    }
    
    setIsLoading(false);
  };

  const deleteChat = async (chatId: string) => {
    try {
      const chat = chats.find(c => c.id === chatId);
      if (!chat || !chat.session_id) return;

      setDeletingChatId(chatId);

      const token = localStorage.getItem('token');
      if (!token) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Invalid token"
        });
        window.location.href = '/login';
        return;
      }

      const response = await fetch('https://chikaai.net/api/fusedai/delete-chat-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'token': `${token}`
        },
        body: JSON.stringify({
          session_id: chat.session_id
        })
      });

      const data = await response.json();

      if (response.status === 401 || (data.detail && data.detail.includes('401'))) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Invalid token"
        });
        localStorage.removeItem('token');
        window.location.href = '/login';
        return;
      }

      if (!response.ok) {
        throw new Error(data.detail || data.message || 'Failed to delete chat');
      }

      // Remove chat from local state
      setChats(chats.filter(chat => chat.id !== chatId));
      if (currentChat?.id === chatId) {
        setCurrentChat(null);
      }

      // Reload chat sessions
      await loadChatSessions();

      toast({
        title: "Success",
        description: "Chat deleted successfully"
      });

    } catch (error) {
      console.error('Error deleting chat:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to delete chat'
      });
    } finally {
      setDeletingChatId(null);
    }
  };

  const clearChat = async () => {
    if (!currentChat || !currentChat.session_id) return;
    
    try {
      setIsClearingChat(true);

      const token = localStorage.getItem('token');
      if (!token) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Invalid token"
        });
        window.location.href = '/login';
        return;
      }

      const response = await fetch('https://chikaai.net/api/fusedai/clear-chat-messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'token': `${token}`
        },
        body: JSON.stringify({
          session_id: currentChat.session_id
        })
      });

      const data = await response.json();

      if (response.status === 401 || (data.detail && data.detail.includes('401'))) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Invalid token"
        });
        localStorage.removeItem('token');
        window.location.href = '/login';
        return;
      }

      if (!response.ok) {
        throw new Error(data.detail || data.message || 'Failed to clear chat messages');
      }

      // Clear messages from state
      const clearedChat = {
        ...currentChat,
        messages: []
      };
      setCurrentChat(clearedChat);
      setChats(chats.map(chat => chat.id === currentChat.id ? clearedChat : chat));

      toast({
        title: "Success",
        description: "Chat messages cleared successfully"
      });

    } catch (error) {
      console.error('Error clearing chat messages:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to clear chat messages'
      });
    } finally {
      setIsClearingChat(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const file = files[0]; // Take the first file
      console.log(`Selected file: ${file.name} (${file.type}) - ${(file.size / 1024).toFixed(2)} KB`);
      
      // Store the selected file
      setSelectedFile(file);
      
      // Show success toast
      toast({
        title: "File Selected",
        description: `${file.name} is ready to send`
      });
      
      // Close the menu
      setShowAttachmentMenu(false);
      
      // Clear the input so the same file can be selected again
      event.target.value = '';
    }
  };

  const openFileSelector = (type: 'document' | 'photo') => {
    console.log(`Opening file selector for: ${type}`);
    if (fileInputRef.current) {
      fileInputRef.current.accept = type === 'document' 
        ? '.pdf,.doc,.docx,.txt,.rtf,.odt,.pages'
        : 'image/*';
      console.log(`Set accept to: ${fileInputRef.current.accept}`);
      fileInputRef.current.click();
    } else {
      console.error('File input ref is not available');
    }
  };

  const handleSignOut = () => {
    // Clear session storage
    localStorage.removeItem('token');
    
    // Show sign out message
    toast({
      title: "Success",
      description: "Signed out successfully"
    });

    // Redirect to home page
    router.push('/');
  };

  // Function to format message content with bold text
  const formatMessageContent = (content: string) => {
    // Split content by ** markers and create formatted elements
    const parts = content.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        // Remove ** markers and make bold
        const boldText = part.slice(2, -2);
        return <strong key={index}>{boldText}</strong>;
      }
      return part;
    });
  };

  // Function to copy message content
  const copyMessageContent = async (content: string) => {
    try {
      // Remove ** markers for plain text copy
      const plainText = content.replace(/\*\*(.*?)\*\*/g, '$1');
      await navigator.clipboard.writeText(plainText);
      
      toast({
        title: "Copied!",
        description: "Message copied to clipboard"
      });
    } catch (error) {
      console.error('Failed to copy message:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to copy message"
      });
    }
  };

  // Function to handle copy button click
  const handleCopyClick = (messageId: string, content: string) => {
    copyMessageContent(content);
    setCopiedMessageId(messageId);
    // Reset copied state after 2 seconds
    setTimeout(() => {
      setCopiedMessageId(null);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Toaster />
      
      {/* Full Screen Loading Overlay */}
      {isLoadingMessages && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center">
          <div className="bg-gradient-to-br from-white via-gray-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 rounded-2xl p-8 shadow-2xl border border-gray-200 dark:border-gray-700 max-w-sm w-full mx-4">
            <div className="flex flex-col items-center space-y-6">
              {/* Animated Logo */}
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <MessageSquare className="w-8 h-8 text-white" />
                </div>
                {/* Pulsing ring effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl animate-ping opacity-20"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl animate-pulse opacity-10"></div>
              </div>
              
              {/* Loading Animation */}
              <div className="flex flex-col items-center space-y-3">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce [animation-delay:150ms]"></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:300ms]"></div>
                </div>
                
                {/* Progress Bar */}
                <div className="w-48 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-pulse"></div>
                </div>
              </div>
              
              <div className="text-center space-y-2">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Loading Messages
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Fetching your conversation...
                </p>
              </div>
              
              {/* Decorative elements */}
              <div className="flex space-x-2">
                <div className="w-1 h-1 bg-blue-400 rounded-full animate-pulse"></div>
                <div className="w-1 h-1 bg-purple-400 rounded-full animate-pulse [animation-delay:200ms]"></div>
                <div className="w-1 h-1 bg-blue-400 rounded-full animate-pulse [animation-delay:400ms]"></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo/Brand */}
            <div className="flex items-center">
              <Link href="/" className="text-xl font-bold text-gray-900 dark:text-white">
                FusedAI
              </Link>
            </div>
            
            {/* Center Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/chat" className="text-black dark:text-white font-medium">
                Chat
              </Link>
              <Link href="/projects" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
                Projects
              </Link>
            </div>
            
            {/* Actions */}
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <button
                onClick={handleSignOut}
                className="flex items-center space-x-2 px-3 py-1.5 text-sm bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 rounded-md transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-3.5rem)]">
        {/* Left Sidebar - Static (Fixed Position) */}
        <div className="w-64 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 border-r border-gray-700 dark:border-gray-600 flex flex-col fixed left-0 top-16 h-[calc(100vh-3.5rem)] shadow-2xl">
          {/* Sidebar Header */}
          <div className="p-4 border-b border-gray-700 dark:border-gray-600">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-lg font-bold text-white">Chats</h2>
            </div>
            <button
              onClick={createNewChat}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
            >
              <Plus className="w-4 h-4" />
              <span>New chat</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="px-3 py-0.5">
              <div className="space-y-0">
                {isLoadingSessions ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="relative">
                      <div className="w-5 h-5 border-2 border-gray-600 rounded-full"></div>
                      <div className="absolute top-0 left-0 w-5 h-5 border-2 border-transparent border-t-blue-500 rounded-full animate-spin"></div>
                    </div>
                  </div>
                ) : chats.length === 0 ? (
                  <div className="text-center py-4">
                    <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-2">
                      <MessageSquare className="w-4 h-4 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-400">No chats yet</p>
                    <p className="text-xs text-gray-500 mt-1">Start a new conversation</p>
                  </div>
                ) : (
                  chats.map((chat) => (
                   <motion.div
                     key={chat.id}
                     initial={{ opacity: 0, x: -20 }}
                     animate={{ opacity: 1, x: 0 }}
                     className={`p-2 rounded-md cursor-pointer transition-all duration-200 group ${
                       currentChat?.id === chat.id
                         ? 'bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 shadow-sm'
                         : 'hover:bg-gray-700/50 hover:border hover:border-gray-600/50'
                     }`}
                     onClick={() => selectChat(chat)}
                   >
                     <div className="flex items-center justify-between">
                       <div className="flex-1 min-w-0">
                         <p className={`text-sm font-medium truncate ${
                           currentChat?.id === chat.id
                             ? 'text-white'
                             : 'text-gray-300 group-hover:text-white'
                         }`}>
                           {chat.title}
                         </p>
                       </div>
                                              <div className="flex items-center space-x-2 ml-2">
                         <p className="text-xs text-gray-500 leading-tight">
                           {new Date(chat.updatedAt).toLocaleDateString()}
                         </p>
                       </div>
                       <button
                         onClick={(e) => {
                           e.stopPropagation();
                           deleteChat(chat.id);
                         }}
                         disabled={deletingChatId === chat.id}
                         className="text-gray-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-gray-700/50 relative"
                       >
                         {deletingChatId === chat.id ? (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-2.5 h-2.5 relative">
                              <div className="absolute inset-0 border-2 border-gray-600 rounded-full"></div>
                              <div className="absolute inset-0 border-2 border-transparent border-t-red-400 rounded-full animate-spin"></div>
                            </div>
                          </div>
                        ) : (
                          <Trash2 className="w-2.5 h-2.5" />
                        )}
                      </button>
                     </div>
                   </motion.div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Sidebar Footer */}
          <div className="p-3 border-t border-gray-700 dark:border-gray-600">
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 bg-gradient-to-r from-green-500 to-blue-500 rounded-full"></div>
              <span className="text-xs text-gray-400">FusedAI</span>
            </div>
          </div>
        </div>

        {/* Main Chat Area - ChatGPT Style with Left Margin for Fixed Sidebar */}
        <div className="flex-1 flex flex-col bg-white dark:bg-gray-900 ml-64">
          {currentChat ? (
            <>
              {/* Chat Header - ChatGPT Style */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {/* Modern AI Model Dropdown */}
                    <div className="relative" ref={modelDropdownRef}>
                      <button
                        onClick={() => setShowModelDropdown(!showModelDropdown)}
                        className="flex items-center space-x-2 text-base font-medium text-gray-900 dark:text-white hover:text-gray-700 dark:hover:text-gray-300 transition-colors cursor-pointer"
                      >
                        <span>{AI_MODELS.find(m => m.id === selectedModel)?.name}</span>
                        <ChevronDown className={`w-4 h-4 transition-transform ${showModelDropdown ? 'rotate-180' : ''}`} />
                      </button>
                      
                      {showModelDropdown && (
                        <div className="absolute top-full left-0 mt-2 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
                          <div className="p-0.5">
                            {AI_MODELS.map((model) => (
                              <button
                                key={model.id}
                                onClick={() => {
                                  setSelectedModel(model.id);
                                  setShowModelDropdown(false);
                                }}
                                className={`w-full text-left p-2 rounded-md transition-colors flex items-start space-x-3 ${
                                  selectedModel === model.id
                                    ? 'bg-gray-100 dark:bg-gray-700'
                                    : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                                }`}
                              >
                                <div className={`w-2 h-2 rounded-full mt-1.5 ${model.color}`}></div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                                    {model.name}
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0 leading-tight">
                                    {model.description}
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={clearChat}
                      disabled={isClearingChat || currentChat.messages.length === 0}
                      className="flex items-center space-x-2 px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isClearingChat ? (
                        <div className="w-4 h-4 relative">
                          <div className="absolute inset-0 border-2 border-gray-200 dark:border-gray-600 rounded-full"></div>
                          <div className="absolute inset-0 border-2 border-transparent border-t-gray-400 rounded-full animate-spin"></div>
                        </div>
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                      <span>Clear Chat</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Messages Area - ChatGPT Style */}
              <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {currentChat.messages.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                      <MessageSquare className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      Start a conversation
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Send a message to begin chatting with {AI_MODELS.find(m => m.id === selectedModel)?.name}
                    </p>
                  </div>
                ) : (
                  currentChat.messages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex items-start space-x-3 max-w-3xl ${msg.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          msg.role === 'user' 
                            ? 'bg-gray-900 dark:bg-white' 
                            : 'bg-gray-100 dark:bg-gray-700'
                        }`}>
                          {msg.role === 'user' ? (
                            <User className="w-4 h-4 text-white dark:text-gray-900" />
                          ) : (
                            <Bot className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                          )}
                        </div>
                        <div className={`px-4 py-3 rounded-lg relative group ${
                          msg.role === 'user'
                            ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                        }`}>
                          {/* Copy button for AI messages */}
                          {msg.role === 'assistant' && (
                            <button
                              onClick={() => handleCopyClick(msg.id, msg.content)}
                              className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors opacity-0 group-hover:opacity-100"
                              title="Copy message"
                            >
                              {copiedMessageId === msg.id ? (
                                <Check className="w-3 h-3 text-green-500" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          )}
                          
                          <div className="pr-8">
                            <p className="text-sm whitespace-pre-wrap">
                              {formatMessageContent(msg.content)}
                            </p>
                            <div className={`text-xs mt-2 ${
                              msg.role === 'user' 
                                ? 'text-gray-300 dark:text-gray-600' 
                                : 'text-gray-500 dark:text-gray-400'
                            }`}>
                              {msg.timestamp.toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
                
                {/* Loading Message */}
                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-start"
                  >
                    <div className="flex items-start space-x-3 max-w-3xl">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 dark:bg-gray-700">
                        <Bot className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                      </div>
                      <div className="px-4 py-3 rounded-lg bg-gray-100 dark:bg-gray-700">
                        <div className="flex items-center space-x-2">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                          </div>
                          <span className="text-xs text-gray-500 dark:text-gray-400">Thinking...</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area - Updated Design to Match Screenshot */}
              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <div className="max-w-4xl mx-auto">
                  {/* Selected File Preview */}
                  {selectedFile && (
                    <div className="mb-3 flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <Paperclip className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{selectedFile.name}</span>
                      <button
                        onClick={() => setSelectedFile(null)}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 ml-auto"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  
                  <div className="relative flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-2">
                    {/* Plus Button */}
                    <button
                      data-attachment-button
                      onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
                      className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                    
                    {/* Attachment Menu */}
                    {showAttachmentMenu && (
                      <div 
                        data-attachment-menu
                        className="absolute bottom-full left-0 mb-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50"
                      >
                        <div className="p-1">
                          <button
                            onClick={() => openFileSelector('document')}
                            className="w-full text-left p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 text-sm text-gray-700 dark:text-gray-300"
                          >
                            📄 Upload Document
                          </button>
                          <button
                            onClick={() => openFileSelector('photo')}
                            className="w-full text-left p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 text-sm text-gray-700 dark:text-gray-300"
                          >
                            🖼️ Upload Photo
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Hidden File Input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={handleFileSelect}
                      className="hidden"
                    />

                    {/* Message Input */}
                    <div className="flex-1 mx-2">
                      <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            sendMessage();
                          }
                        }}
                        placeholder="Ask anything"
                        className="w-full bg-transparent border-none outline-none resize-none text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-none focus:ring-0 focus:outline-none"
                        rows={1}
                        style={{
                          minHeight: '24px',
                          maxHeight: '120px',
                        }}
                      />
                    </div>

                    {/* Send Button */}
                    <button
                      onClick={sendMessage}
                      disabled={!message.trim() || isLoading}
                      className="p-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-300 dark:hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* Welcome Screen */
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center max-w-md">
                <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                  <MessageSquare className="w-10 h-10 text-gray-400" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  Welcome to FusedAI
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-8">
                  Select a chat from the sidebar or start a new conversation to begin.
                </p>
                <button
                  onClick={createNewChat}
                  className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-6 py-3 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 font-semibold transition-colors"
                >
                  Start New Chat
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}