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
}

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

  // Mock project data - in real app, this would come from API based on params.id
  const project: Project = {
    id: params.id,
    title: 'Acme Iron',
    status: 'active',
    description: 'Install 100 data drops for Acme Anchors',
    company: 'Acme Anchors',
    contact: {
      name: 'Carl Wright',
      email: 'a_billsfan@yahoo.com',
      phone: '9016908928'
    },
    date: '7/16/2025'
  };

  // Mock documents data
  const [documents, setDocuments] = useState<Document[]>([
    {
      id: '1',
      name: 'Project Contract - Acme Iron.pdf',
      type: 'pdf',
      size: '2.4 MB',
      uploadedBy: 'Carl Wright',
      uploadedAt: '2025-01-15',
      category: 'contract'
    },
    {
      id: '2',
      name: 'Site Blueprint - Floor Plan.dwg',
      type: 'document',
      size: '5.8 MB',
      uploadedBy: 'John Doe',
      uploadedAt: '2025-01-20',
      category: 'blueprint'
    },
    {
      id: '3',
      name: 'Material Cost Estimate.xlsx',
      type: 'spreadsheet',
      size: '1.2 MB',
      uploadedBy: 'Sarah Johnson',
      uploadedAt: '2025-02-01',
      category: 'report'
    },
    {
      id: '4',
      name: 'Installation Photos.zip',
      type: 'other',
      size: '15.6 MB',
      uploadedBy: 'Mike Wilson',
      uploadedAt: '2025-02-10',
      category: 'other'
    },
    {
      id: '5',
      name: 'Progress Report Week 1.pdf',
      type: 'pdf',
      size: '890 KB',
      uploadedBy: 'Carl Wright',
      uploadedAt: '2025-02-15',
      category: 'report'
    },
    {
      id: '6',
      name: 'Invoice INV-2025-001.pdf',
      type: 'pdf',
      size: '245 KB',
      uploadedBy: 'Finance Team',
      uploadedAt: '2025-02-20',
      category: 'invoice'
    }
  ]);

  const sidebarSections = [
    { name: 'Project Chat', icon: MessageCircle, active: true },
    { name: 'Overview', icon: Eye },
    { name: 'Documents', icon: FileText },
    { name: 'Quotes', icon: Quote },
    { name: 'AI Estimation', icon: Brain },
    { name: 'Bill of Materials', icon: Package },
    { name: 'Upload', icon: Upload }
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

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      // In real app, you would upload files to server
      Array.from(files).forEach((file) => {
        const newDoc: Document = {
          id: Date.now().toString(),
          name: file.name,
          type: getFileType(file.name),
          size: formatFileSize(file.size),
          uploadedBy: 'You',
          uploadedAt: new Date().toISOString().split('T')[0],
          category: 'other'
        };
        setDocuments(prev => [newDoc, ...prev]);
      });
    }
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

  const handleDeleteDocument = (docId: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== docId));
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
    setInput('');
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const aiMessage: Message = {
        id: messages.length + 2,
        role: 'assistant',
        content: `I understand you're asking about "${input}". Let me help you with information about the ${project.title} project. What specific details would you like to know?`,
        timestamp: new Date().toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true 
        })
      };
      setMessages(prev => [...prev, aiMessage]);
      setIsLoading(false);
    }, 1000);
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
               
               <button className="w-full flex items-center justify-center space-x-1 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
                 <Edit3 className="w-3 h-3" />
                 <span>Edit Project</span>
               </button>
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
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Due Date</label>
                    <p className="text-gray-900 dark:text-white">{project.date}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Company</label>
                    <p className="text-gray-900 dark:text-white">{project.company}</p>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Description</h2>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {project.description}
                </p>
              </div>

              {/* Primary Contact */}
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Primary Contact</h2>
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-medium text-gray-900 dark:text-white mb-2">{project.contact.name}</h3>
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                        <Mail className="w-4 h-4" />
                        <a href={`mailto:${project.contact.email}`} className="hover:text-gray-900 dark:hover:text-white transition-colors">
                          {project.contact.email}
                        </a>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                        <Phone className="w-4 h-4" />
                        <a href={`tel:${project.contact.phone}`} className="hover:text-gray-900 dark:hover:text-white transition-colors">
                          {project.contact.phone}
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Customer Information */}
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Customer Information</h2>
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-medium text-gray-900 dark:text-white mb-2">{project.company}</h3>
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                        <Eye className="w-4 h-4" />
                        <span>Technology Industry</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                        <Calendar className="w-4 h-4" />
                        <span>Client since 2023</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Project Timeline */}
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Project Timeline</h2>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Project Started</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">January 15, 2025</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Planning Phase Complete</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">February 1, 2025</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Implementation In Progress</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Current Phase</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-gray-300 dark:bg-gray-600 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Expected Completion</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{project.date}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
                <div className="flex flex-wrap gap-3">
                  <button className="flex items-center space-x-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-md hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors text-sm">
                    <Edit3 className="w-4 h-4" />
                    <span>Edit Project</span>
                  </button>
                  <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm">
                    <Mail className="w-4 h-4" />
                    <span>Contact Client</span>
                  </button>
                  <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm">
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
                  
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center space-x-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors font-medium"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Upload Files</span>
                  </button>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.zip,.dwg,.txt,.csv"
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
                      <p className="text-xl font-semibold text-gray-900 dark:text-white">{documents.length}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-5 h-5 text-red-500" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">PDF Files</p>
                      <p className="text-xl font-semibold text-gray-900 dark:text-white">
                        {documents.filter(doc => doc.type === 'pdf').length}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <FileSpreadsheet className="w-5 h-5 text-green-500" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Spreadsheets</p>
                      <p className="text-xl font-semibold text-gray-900 dark:text-white">
                        {documents.filter(doc => doc.type === 'spreadsheet').length}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <Upload className="w-5 h-5 text-purple-500" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">This Month</p>
                      <p className="text-xl font-semibold text-gray-900 dark:text-white">3</p>
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
                              <button
                                onClick={() => {/* Handle download */}}
                                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                title="Download"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                              
                              <button
                                onClick={() => handleDeleteDocument(document.id)}
                                className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
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
    </div>
  );
}
