'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Edit3, 
  MessageCircle, 
  Eye, 
  FileText, 
  Quote, 
  Brain, 
  Package, 
  Upload,
  Send,
  Bot,
  User,
  Maximize2,
  Minimize2,
  Mail,
  Phone,
  Building2,
  Calendar,
  Info,
  Settings,
  Download,
  Trash2,
  File,
  Image,
  FileSpreadsheet,
  Search,
  Filter,
  Plus
} from 'lucide-react';
import Link from 'next/link';
import { ThemeToggle } from '@/components/theme-provider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";

interface Message {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface Project {
  id: string;
  title: string;
  status: 'active' | 'completed' | 'pending' | 'on-hold';
  description: string;
  company: string;
  contact: {
    name: string;
    email: string;
    phone: string;
  };
  date: string;
}

interface Document {
  id: string;
  name: string;
  type: 'pdf' | 'image' | 'spreadsheet' | 'document' | 'other';
  size: string;
  uploadedBy: string;
  uploadedAt: string;
  category: 'contract' | 'blueprint' | 'invoice' | 'report' | 'other';
  url: string;
}

const getCategoryFromType = (fileType: string): Document['category'] => {
  const type = fileType.toLowerCase();
  if (type.includes('contract')) return 'contract';
  if (type.includes('blueprint') || type.includes('drawing')) return 'blueprint';
  if (type.includes('invoice')) return 'invoice';
  if (type.includes('report')) return 'report';
  return 'other';
};

export default function ProjectChatPage({ params }: { params: { id: string } }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      role: 'assistant',
      content: 'Hello! I\'m here to help you with this project. What would you like to know?',
      timestamp: new Date().toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      })
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeSection, setActiveSection] = useState('Project Chat');
  const [activeQuoteTab, setActiveQuoteTab] = useState('Customer Setup');
  const [isSidebarMinimized, setIsSidebarMinimized] = useState(true);
  const [documentSearch, setDocumentSearch] = useState('');
  const [documentFilter, setDocumentFilter] = useState('all');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load project data from session storage or use default values
  const [project, setProject] = useState<Project>(() => {
    if (typeof window !== 'undefined') {
      const storedProject = sessionStorage.getItem('currentProject');
      if (storedProject) {
        return JSON.parse(storedProject);
      }
    }
    return {
    id: params.id,
      title: 'Loading...',
      status: 'pending',
      description: 'Loading project details...',
      company: '',
    contact: {
        name: '',
        email: '',
        phone: ''
      },
      date: ''
    };
  });

  interface BackendDocument {
    document_id: string;
    document_name: string;
    document_type: string;
    document_size: string;
    document_url: string;
  }

  const [documents, setDocuments] = useState<Document[]>([]);
  const [isDocumentsLoading, setIsDocumentsLoading] = useState(true);
  const [documentsError, setDocumentsError] = useState<string | null>(null);

  // Fetch documents from backend
  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setDocumentsError('Authentication token not found');
          setIsDocumentsLoading(false);
          return;
        }

        const response = await fetch('http://localhost:8000/api/fusedai/get-all-documents', {
          method: 'POST',  // Changed to POST to send body
          headers: {
            'Content-Type': 'application/json',
            'token': token
          },
          body: JSON.stringify({
            project_id: params.id
          })
        });

        const data = await response.json();
        
        if (response.ok) {
          // Transform backend documents to our Document interface
          const transformedDocs = data.documents.map((doc: BackendDocument) => ({
            id: doc.document_id,
            name: doc.document_name,
            type: getFileType(doc.document_name),
            size: doc.document_size,
            uploadedBy: 'You',
            uploadedAt: new Date().toISOString().split('T')[0],
            category: getCategoryFromType(doc.document_type),
            url: doc.document_url
          }));
          setDocuments(transformedDocs);
          setDocumentsError(null);
        } else {
          throw new Error(data.message || 'Failed to fetch documents');
        }
      } catch (err) {
        setDocumentsError('Failed to fetch documents. Please try again later.');
        console.error('Error fetching documents:', err);
      } finally {
        setIsDocumentsLoading(false);
      }
    };

    fetchDocuments();
  }, []);

  const sidebarSections = [
    { name: 'Project Chat', icon: MessageCircle, active: true },
    { name: 'Overview', icon: Eye },
    { name: 'Documents', icon: FileText },
    { name: 'Quotes', icon: Quote },
    { name: 'AI Estimation', icon: Brain },
    { name: 'Bill of Materials', icon: Package }
  ];

     const getStatusColor = (status: string) => {
     switch (status) {
       case 'active':
         return 'bg-black dark:bg-white text-white dark:text-black';
       case 'completed':
         return 'bg-green-500 text-white dark:text-green-100';
       case 'pending':
         return 'bg-yellow-500 text-white dark:text-yellow-100';
       case 'on-hold':
         return 'bg-red-500 text-white dark:text-red-100';
       default:
         return 'bg-gray-500 text-white dark:text-gray-100';
     }
   };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return FileText;
      case 'image':
        return Image;
      case 'spreadsheet':
        return FileSpreadsheet;
      case 'document':
        return FileText;
      default:
        return File;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'contract':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'blueprint':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'invoice':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'report':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  // Filter documents based on search and category
  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch = documentSearch === '' || 
      doc.name.toLowerCase().includes(documentSearch.toLowerCase()) ||
      doc.uploadedBy.toLowerCase().includes(documentSearch.toLowerCase());
    
    const matchesFilter = documentFilter === 'all' || doc.category === documentFilter;
    
    return matchesSearch && matchesFilter;
  });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB in bytes

    for (const file of Array.from(files)) {
      if (file.size > MAX_FILE_SIZE) {
        toast({
          variant: "destructive",
          title: "File Too Large",
          description: `File ${file.name} is too large. Maximum size is 50MB.`
        });
        continue;
      }

      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('project_id', params.id);  // Adding project_id to FormData

        const token = localStorage.getItem('token');
        if (!token) {
          toast({
            variant: "destructive",
            title: "Authentication Error",
            description: "Authentication token not found. Please log in again."
          });
          return;
        }

        const response = await fetch('http://localhost:8000/api/fusedai/upload-any-file', {
          method: 'POST',
          headers: {
            'token': token
          },
          body: formData
        });

        const data = await response.json();

        if (response.ok) {
          // Add the file to the documents list using the document_id from API response
          const newDoc: Document = {
            id: data.document_id || Date.now().toString(), // Use document_id from API response
            name: file.name,
            type: getFileType(file.name),
            size: formatFileSize(file.size),
            uploadedBy: 'You',
            uploadedAt: new Date().toISOString().split('T')[0],
            category: 'other',
            url: data.url || '' // Backend should return the S3 URL
          };
          setDocuments(prev => [newDoc, ...prev]);
          
          toast({
            title: "Success",
            description: `File ${file.name} uploaded successfully!`
          });
        } else {
          throw new Error(data.message || 'Failed to upload file');
        }
      } catch (error) {
        console.error('Error uploading file:', error);
        toast({
          variant: "destructive",
          title: "Upload Error",
          description: `Failed to upload ${file.name}. Please try again.`
        });
      }
    }
    
    // Reset the file input
    event.target.value = '';
    setIsUploadModalOpen(false);
  };

  const getFileType = (fileName: string): Document['type'] => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return 'pdf';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return 'image';
      case 'xlsx':
      case 'xls':
      case 'csv':
        return 'spreadsheet';
      case 'doc':
      case 'docx':
      case 'txt':
        return 'document';
      default:
        return 'other';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const [deletingDocId, setDeletingDocId] = useState<string | null>(null);

  const { toast } = useToast();

  const handleDeleteDocument = async (docId: string) => {
    try {
      setDeletingDocId(docId);

      const token = localStorage.getItem('token');
      if (!token) {
        toast({
          variant: "destructive",
          title: "Authentication Error",
          description: "Authentication token not found. Please log in again."
        });
        return;
      }

      const response = await fetch('http://localhost:8000/api/fusedai/delete-document', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'token': token
        },
        body: JSON.stringify({
          document_id: docId
        })
      });

      const data = await response.json();

      if (response.ok) {
    setDocuments(prev => prev.filter(doc => doc.id !== docId));
        toast({
          title: "Success",
          description: "Document deleted successfully",
        });
      } else {
        throw new Error(data.message || 'Failed to delete document');
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete document. Please try again."
      });
    } finally {
      setDeletingDocId(null);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: messages.length + 1,
      role: 'user',
      content: input,
      timestamp: new Date().toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      })
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setIsLoading(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast({
          variant: "destructive",
          title: "Authentication Error",
          description: "Authentication token not found. Please log in again."
        });
        return;
      }

      const response = await fetch('http://localhost:8000/api/fusedai/chat-with-document', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'token': token
        },
        body: JSON.stringify({
          project_id: params.id,
          message: currentInput
        })
      });

      const data = await response.json();

      if (response.ok) {
        const aiMessage: Message = {
          id: messages.length + 2,
          role: 'assistant',
          content: data.ai_response,
          timestamp: new Date().toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
          })
        };
        setMessages(prev => [...prev, aiMessage]);
      } else {
        throw new Error(data.message || 'Failed to get AI response');
      }
    } catch (error) {
      console.error('Error getting AI response:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to get AI response'
      });
      
      // Add error message to chat
      const errorMessage: Message = {
        id: messages.length + 2,
        role: 'assistant',
        content: 'Sorry, I encountered an error while processing your request. Please try again.',
        timestamp: new Date().toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true 
        })
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex">
      {/* Sidebar */}
      <div 
        className={`${isSidebarMinimized ? 'w-16' : 'w-64'} bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 flex-shrink-0 group`}
        onMouseEnter={() => setIsSidebarMinimized(false)}
        onMouseLeave={() => setIsSidebarMinimized(true)}
      >
                          {/* Project Header */}
         <div className="border-b border-gray-200 dark:border-gray-700">
           <div className="px-2 pt-2">
             <Link 
               href="/projects"
               className="inline-flex p-1.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
               title="Back to Projects"
             >
               <ArrowLeft className="w-4 h-4" />
             </Link>
           </div>
          
           {!isSidebarMinimized && (
             <div className="px-3 pb-3 pt-2">
               <div className="flex items-center justify-between mb-2">
                 <h1 className="text-sm font-medium text-gray-900 dark:text-white">
                   {project.title}
                 </h1>
                 <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                   {project.status}
                 </span>
               </div>
               
               <Link 
                 href={`/projects/${params.id}/edit`}
                 className="w-full flex items-center justify-center space-x-1 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
               >
                 <Edit3 className="w-3 h-3" />
                 <span>Edit Project</span>
               </Link>
             </div>
           )}
        </div>

                 {/* Project Sections */}
         <div className="pt-1">
           {!isSidebarMinimized && (
             <h2 className="text-[11px] uppercase tracking-wider font-medium text-gray-500 dark:text-gray-400 mb-1 px-2">
               Project Sections
             </h2>
           )}
          
          <div className="space-y-1">
            {sidebarSections.map((section) => {
              const Icon = section.icon;
              const isActive = section.name === activeSection;
              
              return (
                <button
                  key={section.name}
                  onClick={() => setActiveSection(section.name)}
                                     className={`w-full flex items-center space-x-3 px-2 py-2 rounded-lg text-sm font-medium transition-colors ${
                     isActive
                       ? 'bg-black dark:bg-white text-white dark:text-black'
                       : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                   }`}
                  title={isSidebarMinimized ? section.name : undefined}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {!isSidebarMinimized && <span>{section.name}</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                {activeSection}
              </h1>
              {activeSection === 'Project Chat' && (
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Ask anything about {project.title}
                </span>
              )}
            </div>
            <ThemeToggle />
          </div>
        </header>

        {/* Chat Content */}
        {activeSection === 'Project Chat' ? (
          <div className="flex-1 flex flex-col">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className="flex items-start space-x-3 max-w-[70%]">
                    {message.role === 'assistant' && (
                      <div className="w-8 h-8 bg-black dark:bg-white rounded-full flex items-center justify-center flex-shrink-0">
                        <Bot className="w-4 h-4 text-white dark:text-black" />
                      </div>
                    )}
                    
                    <div className={`px-4 py-2 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-black dark:bg-white text-white dark:text-black'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                    }`}>
                      <p className="whitespace-pre-wrap">{message.content}</p>
                      <p className="text-xs opacity-60 mt-1">{message.timestamp}</p>
                    </div>
                    
                    {message.role === 'user' && (
                      <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex items-start space-x-3 max-w-[70%]">
                    <div className="w-8 h-8 bg-black dark:bg-white rounded-full flex items-center justify-center flex-shrink-0">
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
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-6 bg-gray-50 dark:bg-gray-800">
              <div className="max-w-xl mx-auto">
                <div className="flex space-x-3">
                  <div className="flex-1 relative">
                    <textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Ask about this project..."
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-black focus:border-black dark:focus:ring-white dark:focus:border-white resize-none"
                      rows={1}
                      style={{ minHeight: '44px', maxHeight: '120px' }}
                    />
                  </div>
                  <button
                    onClick={handleSendMessage}
                    disabled={!input.trim() || isLoading}
                    className="px-4 py-3 bg-black dark:bg-white text-white dark:text-black rounded-full hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
                 ) : activeSection === 'Quotes' ? (
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="max-w-6xl mx-auto space-y-6">
              {/* Tabs */}
              <div className="flex space-x-4 overflow-x-auto pb-4">
                {['Customer Setup', 'BOM Items', 'Labor Types', 'Custom Items', 'Preview & Generate'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveQuoteTab(tab)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                      tab === activeQuoteTab
                        ? 'bg-black dark:bg-white text-white dark:text-black'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <span>{tab}</span>
                  </button>
                ))}
              </div>

              {/* Info Alert */}
              <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Info className="w-5 h-5 text-gray-400 mt-0.5" />
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Customer and contact information is automatically populated from the project's linked customer and contact records. You can edit these fields as needed for this specific quote.
                  </p>
                </div>
              </div>

              {/* Customer Information */}
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <div className="p-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Customer Information</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Company Name</label>
                      <input
                        type="text"
                        defaultValue={project.company}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Project Name</label>
                      <input
                        type="text"
                        defaultValue={project.title}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Contact Name</label>
                      <input
                        type="text"
                        defaultValue={project.contact.name}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
                      <input
                        type="email"
                        defaultValue={project.contact.email}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Phone</label>
                      <input
                        type="tel"
                        defaultValue={project.contact.phone}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">City</label>
                        <input
                          type="text"
                          defaultValue="Memphis"
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">State</label>
                        <input
                          type="text"
                          defaultValue="MS"
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">ZIP</label>
                        <input
                          type="text"
                          defaultValue="38632"
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quote Appearance */}
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <div className="p-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Quote Appearance</h2>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Company Logo Size</label>
                      <Select defaultValue="xl">
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select size" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sm">Small (144×96px) - Subtle branding</SelectItem>
                          <SelectItem value="md">Medium (216×144px) - Balanced look</SelectItem>
                          <SelectItem value="lg">Large (252×168px) - Strong presence</SelectItem>
                          <SelectItem value="xl">Extra Large (288×192px) - Maximum impact</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Preview</label>
                      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-white dark:bg-gray-900">
                        <img 
                          src="/path/to/company-logo.png" 
                          alt="Company Logo Preview"
                          className="max-w-full h-auto"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Professional Quote Sections */}
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <div className="p-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Professional Quote Sections</h2>
                  
                  <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-6">
                    <p className="text-sm text-blue-600 dark:text-blue-400">
                      AI-generated assumptions, exclusions, scope of work, and notes based on your project data and BOM items.
                    </p>
                  </div>

                  <div className="flex space-x-3 mb-6">
                    <button className="flex items-center space-x-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors text-sm font-medium">
                      <Settings className="w-4 h-4" />
                      <span>Generate AI Sections</span>
                    </button>
                    <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium">
                      <Edit3 className="w-4 h-4" />
                      <span>Edit Sections</span>
                    </button>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <h3 className="text-base font-medium text-gray-900 dark:text-white mb-3">Scope of Work</h3>
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <p className="text-gray-600 dark:text-gray-300">
                          This project covers the complete upgrade of the Semmes Murphy access control head-end system at 6325 Humphreys Blvd, migrating 34 existing doors to a new Gallagher Command Centre platform.
                        </p>
                        <ul className="list-disc pl-4 mt-2 space-y-1 text-gray-600 dark:text-gray-300">
                          <li>Decommissioning: Systematically decommission and remove the existing access control panels located in closets 6325-FL1 and 6325-FL2.</li>
                          <li>Head-End Installation: Install four (4) Gallagher Controller 7000 standard controllers, four (4) 8 HBUS modules, and associated I/O modules into new enclosures. Install three (3) 8-door supervised power supplies with six (6) 12V 8AH backup batteries.</li>
                          <li>Field Wiring Termination: Re-terminate all existing door wiring for 34 doors onto the new Gallagher controller and power supply modules. This includes connections for readers, locks, door contacts, and request-to-exit devices.</li>
                          <li>Reader Replacement: Replace thirty-four (34) existing card readers with thirty-three (33) new Gallagher C300430 T11 Multi-Tech readers and one (1) Gallagher C300460 T20 Multi-Tech Terminal.</li>
                          <li>Software Installation & Licensing: Install and configure Gallagher Command Centre server software on a customer-provided server. Apply all purchased licenses, including 34 door licenses, workstation and Photo ID licenses, and Exacq Integration licenses, along with the corresponding Software Maintenance Agreements (SMA).</li>
                          <li>System Configuration & Commissioning: Configure all system parameters, including access schedules, door groups, alarm responses, and cardholder permissions. Test and verify all hardware and software functionality.</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : activeSection === 'Overview' ? (
          /* Overview Section */
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Project Information */}
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Project Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Project Name</label>
                    <p className="text-gray-900 dark:text-white">{project.title}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                      {project.status}
                    </span>
                  </div>
                  {project.date && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Due Date</label>
                    <p className="text-gray-900 dark:text-white">{project.date}</p>
                  </div>
                  )}
                  {project.company && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Company</label>
                    <p className="text-gray-900 dark:text-white">{project.company}</p>
                  </div>
                  )}
                </div>
              </div>

              {/* Description */}
              {project.description && (
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Description</h2>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {project.description}
                </p>
              </div>
              )}

              {/* Primary Contact */}
              {project.contact && (project.contact.name || project.contact.email || project.contact.phone) && (
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Primary Contact</h2>
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div className="flex-1">
                      {project.contact.name && (
                    <h3 className="text-base font-medium text-gray-900 dark:text-white mb-2">{project.contact.name}</h3>
                      )}
                    <div className="space-y-1">
                        {project.contact.email && (
                      <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                        <Mail className="w-4 h-4" />
                            <a href={`mailto:${project.contact.email}?subject=Regarding Project: ${project.title}&body=Hello ${project.contact.name},%0D%0A%0D%0AI am writing regarding the project: ${project.title}.%0D%0A%0D%0ABest regards`} 
                               className="hover:text-gray-900 dark:hover:text-white transition-colors">
                          {project.contact.email}
                        </a>
                      </div>
                        )}
                        {project.contact.phone && (
                      <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                        <Phone className="w-4 h-4" />
                        <a href={`tel:${project.contact.phone}`} className="hover:text-gray-900 dark:hover:text-white transition-colors">
                          {project.contact.phone}
                        </a>
                      </div>
                        )}
                    </div>
                  </div>
                </div>
              </div>
              )}

              {/* Quick Actions */}
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
                <div className="flex flex-wrap gap-3">
                  {project.contact.email && (
                    <a 
                      href={`mailto:${project.contact.email}?subject=Regarding Project: ${project.title}&body=Hello ${project.contact.name},%0D%0A%0D%0AI am writing regarding the project: ${project.title}.%0D%0A%0D%0ABest regards`}
                      className="flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm"
                    >
                    <Mail className="w-4 h-4" />
                    <span>Contact Client</span>
                    </a>
                  )}
                  <button 
                    onClick={() => {
                      // Generate PDF content
                      const content = `
                        Project Report
                        
                        Project Name: ${project.title}
                        Status: ${project.status}
                        ${project.date ? `Due Date: ${project.date}` : ''}
                        ${project.company ? `Company: ${project.company}` : ''}
                        ${project.description ? `\nDescription: ${project.description}` : ''}
                        
                        ${project.contact.name ? `\nContact Information:\nName: ${project.contact.name}` : ''}
                        ${project.contact.email ? `Email: ${project.contact.email}` : ''}
                        ${project.contact.phone ? `Phone: ${project.contact.phone}` : ''}
                      `;
                      
                      // Create Blob and download
                      const blob = new Blob([content], { type: 'application/pdf' });
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `${project.title} Report.pdf`;
                      document.body.appendChild(a);
                      a.click();
                      window.URL.revokeObjectURL(url);
                      document.body.removeChild(a);
                    }}
                    className="flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Generate Report</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : activeSection === 'Documents' ? (
          /* Documents Section */
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="max-w-6xl mx-auto">
              {/* Header with Search and Upload */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search documents..."
                    value={documentSearch}
                    onChange={(e) => setDocumentSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-black focus:border-black dark:focus:ring-white dark:focus:border-white"
                  />
                </div>
                
                <div className="flex items-center space-x-3">
                  <Select value={documentFilter} onValueChange={(value) => setDocumentFilter(value)}>
                    <SelectTrigger className="w-[160px]">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="contract">Contracts</SelectItem>
                      <SelectItem value="blueprint">Blueprints</SelectItem>
                      <SelectItem value="invoice">Invoices</SelectItem>
                      <SelectItem value="report">Reports</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <div className="flex flex-col items-end gap-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center space-x-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors font-medium"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Upload Files</span>
                  </button>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Maximum file size: 50MB</p>
                  </div>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                    accept="*/*"
                    title="Select files (max 50MB each)"
                  />
                </div>
              </div>

              {/* Documents Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-5 h-5 text-blue-500" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Total Documents</p>
                      <p className="text-xl font-semibold text-gray-900 dark:text-white">
                        {isDocumentsLoading ? '-' : documents.length}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-5 h-5 text-red-500" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Documents</p>
                      <p className="text-xl font-semibold text-gray-900 dark:text-white">
                        {isDocumentsLoading ? '-' : documents.filter(doc => doc.type === 'document' || doc.type === 'pdf').length}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <Image className="w-5 h-5 text-blue-500" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Images</p>
                      <p className="text-xl font-semibold text-gray-900 dark:text-white">
                        {isDocumentsLoading ? '-' : documents.filter(doc => doc.type === 'image').length}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <FileSpreadsheet className="w-5 h-5 text-green-500" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Other Files</p>
                      <p className="text-xl font-semibold text-gray-900 dark:text-white">
                        {isDocumentsLoading ? '-' : documents.filter(doc => doc.type === 'other' || doc.type === 'spreadsheet').length}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Documents List */}
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Project Documents ({filteredDocuments.length})
                  </h2>
                </div>
                
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredDocuments.length > 0 ? (
                    filteredDocuments.map((document) => {
                      const FileIcon = getFileIcon(document.type);
                      return (
                        <div key={document.id} className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4 flex-1 min-w-0">
                              <div className="flex-shrink-0">
                                <FileIcon className="w-8 h-8 text-gray-400" />
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2 mb-1">
                                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                    {document.name}
                                  </p>
                                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(document.category)}`}>
                                    {document.category}
                                  </span>
                                </div>
                                
                                <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                                  <span>{document.size}</span>
                                  <span>•</span>
                                  <span>Uploaded by {document.uploadedBy}</span>
                                  <span>•</span>
                                  <span>{new Date(document.uploadedAt).toLocaleDateString()}</span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2 ml-4">
                              <a
                                href={document.url}
                                download={document.name}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                title="Download"
                              >
                                <Download className="w-4 h-4" />
                              </a>
                              
                              <button
                                onClick={() => handleDeleteDocument(document.id)}
                                disabled={deletingDocId === document.id}
                                className={`p-2 text-gray-400 transition-colors ${
                                  deletingDocId === document.id 
                                    ? 'cursor-not-allowed opacity-50' 
                                    : 'hover:text-red-600 dark:hover:text-red-400'
                                }`}
                                title={deletingDocId === document.id ? "Deleting..." : "Delete"}
                              >
                                {deletingDocId === document.id ? (
                                  <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                                ) : (
                                <Trash2 className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="px-6 py-12 text-center">
                      <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        No documents found
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400 mb-4">
                        {documentSearch || documentFilter !== 'all' 
                          ? 'Try adjusting your search or filter criteria.'
                          : 'Upload your first document to get started.'
                        }
                      </p>
                      {!documentSearch && documentFilter === 'all' && (
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="inline-flex items-center space-x-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors font-medium"
                        >
                          <Upload className="w-4 h-4" />
                          <span>Upload Files</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Other Sections Placeholder */
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                {sidebarSections.find(s => s.name === activeSection)?.icon && (
                  <div className="w-8 h-8 text-gray-400">
                    {React.createElement(sidebarSections.find(s => s.name === activeSection)!.icon, { className: "w-8 h-8" })}
                  </div>
                )}
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {activeSection}
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                This section is coming soon. Stay tuned for updates!
              </p>
            </div>
          </div>
        )}
      </div>
      <Toaster />
    </div>
  );
}
