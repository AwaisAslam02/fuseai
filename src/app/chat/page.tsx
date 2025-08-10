'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Plus, MessageSquare, ArrowLeft, Bot, User, Settings, Trash2, Paperclip, ChevronDown, LogOut, Menu, X } from 'lucide-react';
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
  { id: 'claude', name: 'Claude', description: 'Advanced reasoning and thoughtful analysis', color: 'bg-blue-500' },
  { id: 'openai', name: 'GPT', description: 'Creative writing and programming excellence', color: 'bg-green-500' },
  { id: 'gemini', name: 'Gemini', description: 'Google\'s multimodal AI with strong vision capabilities', color: 'bg-orange-500' },
  { id: 'grok', name: 'Grok', description: 'Real-time insights and current information access', color: 'bg-red-500' },
  { id: 'deepseek', name: 'DeepSeek', description: 'High-performance reasoning and technical analysis', color: 'bg-purple-500' },
  { id: 'fusedai', name: 'FusedAI', description: 'Multi-model synthesis for comprehensive research', color: 'bg-indigo-500' },
];
   
export default function ChatPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const [message, setMessage] = useState('');
  const [selectedModel, setSelectedModel] = useState('gemini');
  const [isLoading, setIsLoading] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [deletingChatId, setDeletingChatId] = useState<string | null>(null);
  const [isClearingChat, setIsClearingChat] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
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

      const response = await fetch('http://localhost:8000/api/fusedai/get-chat-sessions', {
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

      const response = await fetch('http://localhost:8000/api/fusedai/create-chat-session', {
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

      const response = await fetch('http://localhost:8000/api/fusedai/chat-with-ai', {
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

      const response = await fetch('http://localhost:8000/api/fusedai/get-chat-session-messages', {
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

      const response = await fetch('http://localhost:8000/api/fusedai/delete-chat-session', {
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

      const response = await fetch('http://localhost:8000/api/fusedai/clear-chat-messages', {
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

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Toaster />
      
      {/* Full Screen Loading Overlay */}
      {isLoadingMessages && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-2xl">
            <div className="flex flex-col items-center space-y-4">
              {/* Donut Loader */}
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 border-4 border-gray-200 dark:border-gray-600 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-transparent border-t-gray-900 dark:border-t-white rounded-full animate-spin"></div>
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                  Loading Messages
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Please wait while we fetch your conversation...
                </p>
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
         {/* Left Sidebar - Collapsible */}
         <div className="group relative">
           {/* Hover Trigger */}
           <div className="w-12 h-full bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col items-center py-4">
             <button
               onClick={createNewChat}
               className="w-8 h-8 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-md hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors flex items-center justify-center"
             >
               <Plus className="w-4 h-4" />
             </button>
           </div>

           {/* Expanded Sidebar */}
           <div className="absolute left-0 top-0 w-64 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 h-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none group-hover:pointer-events-auto">
             <div className="p-4">
               <button
                 onClick={createNewChat}
                 className="w-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-4 py-3 rounded-md hover:bg-gray-800 dark:hover:bg-gray-100 font-semibold text-sm transition-colors flex items-center justify-center space-x-2"
               >
                 <Plus className="w-4 h-4" />
                 <span>New chat</span>
               </button>
             </div>

                         <div className="px-2">
              <div className="space-y-1">
                {isLoadingSessions ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                  </div>
                ) : chats.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-400">No chats yet</p>
                    <p className="text-xs text-gray-500 mt-1">Start a new conversation</p>
                  </div>
                ) : (
                  chats.map((chat) => (
                   <motion.div
                     key={chat.id}
                     initial={{ opacity: 0, x: -20 }}
                     animate={{ opacity: 1, x: 0 }}
                     className={`p-2 rounded-lg cursor-pointer transition-colors group ${
                       currentChat?.id === chat.id
                         ? 'bg-gray-200 dark:bg-gray-700'
                         : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                     }`}
                     onClick={() => selectChat(chat)}
                   >
                     <div className="flex items-center justify-between">
                       <div className="flex-1 min-w-0">
                         <p className="text-sm text-gray-900 dark:text-white truncate">
                           {chat.title}
                         </p>
                       </div>
                       <button
                         onClick={(e) => {
                           e.stopPropagation();
                           deleteChat(chat.id);
                         }}
                         disabled={deletingChatId === chat.id}
                         className="text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 relative"
                       >
                         {deletingChatId === chat.id ? (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-4 h-4 relative">
                              <div className="absolute inset-0 border-2 border-gray-200 dark:border-gray-600 rounded-full"></div>
                              <div className="absolute inset-0 border-2 border-transparent border-t-red-500 rounded-full animate-spin"></div>
                            </div>
                          </div>
                        ) : (
                          <Trash2 className="w-3 h-3" />
                        )}
                      </button>
                     </div>
                                      </motion.div>
                  ))
                )}
              </div>
            </div>
           </div>
         </div>

        {/* Main Chat Area - ChatGPT Style */}
        <div className="flex-1 flex flex-col bg-white dark:bg-gray-900">
          {currentChat ? (
            <>
                             {/* Chat Header - ChatGPT Style */}
                               <div className="p-4">
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
                           <div className="absolute top-full left-0 mt-2 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
                             <div className="p-1">
                               {AI_MODELS.map((model) => (
                                 <button
                                   key={model.id}
                                   onClick={() => {
                                     setSelectedModel(model.id);
                                     setShowModelDropdown(false);
                                   }}
                                   className={`w-full text-left p-2 rounded-md transition-colors ${
                                     selectedModel === model.id
                                       ? 'bg-gray-100 dark:bg-gray-700'
                                       : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                                   }`}
                                 >
                                   <div className="flex items-center justify-between">
                                     <div className="flex-1">
                                       <div className="flex items-center space-x-2">
                                         <span className="text-sm font-medium text-gray-900 dark:text-white">
                                           {model.name}
                                         </span>
                                         {selectedModel === model.id && (
                                           <svg className="w-3.5 h-3.5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                             <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                           </svg>
                                         )}
                                       </div>
                                       <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 leading-tight text-[10px]">
                                         {model.description}
                                       </p>
                                     </div>
                                   </div>
                                 </button>
                               ))}
                             </div>
                           </div>
                         )}
                      </div>
                    </div>
                                       <div className="flex items-center space-x-4">
                      <button
                        onClick={clearChat}
                        disabled={isClearingChat}
                        className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-3 py-1.5 rounded-md hover:bg-gray-800 dark:hover:bg-gray-100 text-sm font-medium transition-colors relative disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className={isClearingChat ? 'invisible' : ''}>Clear Chat</span>
                        {isClearingChat && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-4 h-4 relative">
                              <div className="absolute inset-0 border-2 border-gray-200 dark:border-gray-600 rounded-full"></div>
                              <div className="absolute inset-0 border-2 border-transparent border-t-white dark:border-t-gray-900 rounded-full animate-spin"></div>
                            </div>
                          </div>
                        )}
                      </button>
                    </div>
                 </div>
               </div>

                             {/* Messages - Chat Bubble Style */}
               <div className="flex-1 overflow-y-auto">
                 <div className="max-w-4xl mx-auto p-4 space-y-4">
                   {currentChat.messages.map((msg) => (
                     <motion.div
                       key={msg.id}
                       initial={{ opacity: 0, y: 10 }}
                       animate={{ opacity: 1, y: 0 }}
                       className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                     >
                       <div className={`flex items-start space-x-3 max-w-[70%] min-w-0 ${msg.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                         <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                           msg.role === 'user' 
                             ? 'bg-gray-600' 
                             : 'bg-black dark:bg-white'
                         }`}>
                           {msg.role === 'user' ? (
                             <User className="w-4 h-4 text-white" />
                           ) : (
                             <Bot className="w-4 h-4 text-white dark:text-black" />
                           )}
                         </div>
                         <div className={`px-4 py-2 rounded-lg break-words min-w-0 flex-1 ${
                           msg.role === 'user'
                             ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                             : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                         }`}>
                           <p className="text-sm leading-relaxed whitespace-pre-wrap break-words overflow-hidden">
                             {msg.content}
                           </p>
                         </div>
                       </div>
                     </motion.div>
                   ))}
                                     {isLoading && (
                     <motion.div
                       initial={{ opacity: 0, y: 10 }}
                       animate={{ opacity: 1, y: 0 }}
                       className="flex justify-start"
                     >
                       <div className="flex items-start space-x-3 max-w-[70%]">
                         <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-black dark:bg-white`}>
                           <Bot className="w-4 h-4 text-white dark:text-black" />
                         </div>
                         <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded-lg">
                           <div className="flex space-x-1">
                             <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                             <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                             <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                           </div>
                         </div>
                       </div>
                     </motion.div>
                   )}
                </div>
                <div ref={messagesEndRef} />
              </div>

                             {/* Input Area - ChatGPT Style */}
               <div className="p-4">
                 <div className="max-w-xl mx-auto">
                   {/* Show selected file indicator above input */}
                   {selectedFile && (
                     <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                       <div className="flex items-center justify-between">
                         <div className="flex items-center space-x-2">
                           <Paperclip className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                           <span className="text-sm text-blue-800 dark:text-blue-200 font-medium">
                             {selectedFile.name}
                           </span>
                           <span className="text-xs text-blue-600 dark:text-blue-400">
                             ({(selectedFile.size / 1024).toFixed(1)} KB)
                           </span>
                         </div>
                         <button
                           onClick={() => setSelectedFile(null)}
                           className="p-1 hover:bg-blue-200 dark:hover:bg-blue-800 rounded transition-colors"
                         >
                           <X className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                         </button>
                       </div>
                     </div>
                   )}
                   
                   <div className="relative">
                     <textarea
                       value={message}
                       onChange={(e) => setMessage(e.target.value)}
                       onKeyPress={(e) => {
                         if (e.key === 'Enter' && !e.shiftKey) {
                           e.preventDefault();
                           sendMessage();
                         }
                       }}
                       placeholder={selectedFile ? `Message FusedAI with ${selectedFile.name}...` : "Message FusedAI..."}
                       className="w-full p-3 pr-32 border border-gray-300 dark:border-gray-600 rounded-full resize-none focus:outline-none focus:ring-2 focus:ring-gray-500 bg-black text-white"
                       rows={1}
                     />
                     
                     {/* Hidden file input */}
                     <input
                       ref={fileInputRef}
                       type="file"
                       multiple
                       onChange={handleFileSelect}
                       className="hidden"
                     />
                     
                     <div className="absolute right-3 bottom-3 flex items-center space-x-2">
                                               {/* Attachment Button */}
                        <div className="relative">
                          <button
                            data-attachment-button
                            onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                          >
                            <Paperclip className="w-4 h-4" />
                          </button>
                          
                          {/* Attachment Menu */}
                          {showAttachmentMenu && (
                            <div 
                              data-attachment-menu
                              className="absolute bottom-full right-0 mb-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-2 min-w-[160px]"
                            >
                             <button
                               onClick={() => openFileSelector('document')}
                               className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors flex items-center space-x-2"
                             >
                               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                               </svg>
                               <span>Documents</span>
                             </button>
                             <button
                               onClick={() => openFileSelector('photo')}
                               className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors flex items-center space-x-2"
                             >
                               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                               </svg>
                               <span>Photos</span>
                             </button>
                           </div>
                         )}
                       </div>
                       
                       <button
                         onClick={sendMessage}
                         disabled={!message.trim() || isLoading}
                         className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 p-2 rounded-md hover:bg-gray-800 dark:hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                       >
                         <Send className="w-4 h-4" />
                       </button>
                       <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                         ⋮
                       </button>
                     </div>
                   </div>
                 </div>
               </div>
            </>
          ) : (
            /* Welcome Screen - ChatGPT Style */
            <div className="flex-1 flex flex-col">
              {/* Welcome Page Header with Model Selection */}
              <div className="p-4">
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
                        <div className="absolute top-full left-0 mt-2 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
                          <div className="p-1">
                            {AI_MODELS.map((model) => (
                              <button
                                key={model.id}
                                onClick={() => {
                                  setSelectedModel(model.id);
                                  setShowModelDropdown(false);
                                }}
                                className={`w-full text-left p-2 rounded-md transition-colors ${
                                  selectedModel === model.id
                                    ? 'bg-gray-100 dark:bg-gray-700'
                                    : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center space-x-2">
                                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                                        {model.name}
                                      </span>
                                      {selectedModel === model.id && (
                                        <svg className="w-3.5 h-3.5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                      )}
                                    </div>
                                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 leading-tight text-[10px]">
                                      {model.description}
                                    </p>
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center max-w-2xl">
                  <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                    FusedAI
                  </h1>
                  <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
                    How can I help you today?
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
                    <button
                      onClick={createNewChat}
                      className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-left transition-colors"
                    >
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Generate a quote</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Create professional quotes for your business</p>
                    </button>
                    <button
                      onClick={createNewChat}
                      className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-left transition-colors"
                    >
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Analyze documents</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Extract insights from your business documents</p>
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Input Area for Welcome Screen */}
              <div className="p-4">
                <div className="max-w-2xl mx-auto">
                  <div className="relative">
                    {/* Show selected file indicator above input */}
                    {selectedFile && (
                      <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Paperclip className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            <span className="text-sm text-blue-800 dark:text-blue-200 font-medium">
                              {selectedFile.name}
                            </span>
                            <span className="text-xs text-blue-600 dark:text-blue-400">
                              ({(selectedFile.size / 1024).toFixed(1)} KB)
                            </span>
                          </div>
                          <button
                            onClick={() => setSelectedFile(null)}
                            className="p-1 hover:bg-blue-200 dark:hover:bg-blue-800 rounded transition-colors"
                          >
                            <X className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          </button>
                        </div>
                      </div>
                    )}
                    
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                      placeholder="Message FusedAI..."
                      className="w-full p-3 pr-32 border border-gray-300 dark:border-gray-600 rounded-full resize-none focus:outline-none focus:ring-2 focus:ring-gray-500 dark:bg-gray-800 dark:text-white"
                      rows={1}
                    />
                    
                    {/* Hidden file input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    
                    <div className="absolute right-3 bottom-3 flex items-center space-x-2">
                      {/* Attachment Button */}
                      <div className="relative">
                        <button
                          data-attachment-button
                          onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                          <Paperclip className="w-4 h-4" />
                        </button>
                        
                        {/* Attachment Menu */}
                        {showAttachmentMenu && (
                          <div 
                            data-attachment-menu
                            className="absolute bottom-full right-0 mb-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-2 min-w-[160px]"
                          >
                           <button
                             onClick={() => openFileSelector('document')}
                             className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors flex items-center space-x-2"
                           >
                             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                             </svg>
                             <span>Documents</span>
                           </button>
                           <button
                             onClick={() => openFileSelector('photo')}
                             className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors flex items-center space-x-2"
                           >
                             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                             </svg>
                             <span>Photos</span>
                           </button>
                         </div>
                       )}
                     </div>
                     
                     <button
                       onClick={sendMessage}
                       disabled={!message.trim() || isLoading}
                       className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 p-2 rounded-md hover:bg-gray-800 dark:hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                     >
                       <Send className="w-4 h-4" />
                     </button>
                     <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                       ⋮
                     </button>
                   </div>
                 </div>
               </div>
             </div>
           </div>
          )}
        </div>
      </div>
    </div>
  );
} 