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
  Plus,
  X
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

interface BackendMessage {
  message_id: number;
  user_message: string;
  ai_message: string;
  user_message_time: string;
  ai_message_time: string;
  inserted_at: string;
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

interface BOMItem {
  id: string;
  description: string;
  category: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  vendor: string;
  partNumber: string;
  manufacturer: string;
  modelNumber: string;
  notes: string;
  totalCost: number;
  totalSell: number;
  margin: number;
}

interface BOMCategory {
  id: string;
  name: string;
  itemCount: number;
  totalCost: number;
  totalSell: number;
  percentageOfTotal: number;
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
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState('Project Chat');
  const [activeQuoteTab, setActiveQuoteTab] = useState('Customer Setup');
  const [isSidebarMinimized, setIsSidebarMinimized] = useState(true);
  const [documentSearch, setDocumentSearch] = useState('');
  const [documentFilter, setDocumentFilter] = useState('all');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // BOM States
  const [bomItems, setBomItems] = useState<BOMItem[]>([]);
  const [bomCategories, setBomCategories] = useState<BOMCategory[]>([]);
  const [activeBOMTab, setActiveBOMTab] = useState('BOM Items');
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newItem, setNewItem] = useState<Partial<BOMItem>>({
    description: '',
    category: '',
    quantity: 1,
    unit: 'Each',
    unitPrice: 0,
    vendor: '',
    partNumber: '',
    manufacturer: '',
    modelNumber: '',
    notes: '',
    margin: 35
  });

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

  // Fetch project messages from backend
  useEffect(() => {
    const fetchProjectMessages = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Authentication token not found');
          setIsLoadingMessages(false);
          return;
        }

        const response = await fetch('http://localhost:8000/api/fusedai/get-project-messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'token': token
          },
          body: JSON.stringify({
            project_id: parseInt(params.id)
          })
        });

        const data = await response.json();
        
        if (response.ok) {
          // Transform backend messages to our Message interface
          const transformedMessages: Message[] = [];
          
          data.messages.forEach((msg: BackendMessage) => {
            // Add user message
            if (msg.user_message) {
              transformedMessages.push({
                id: msg.message_id * 2 - 1, // Ensure unique IDs
                role: 'user',
                content: msg.user_message,
                timestamp: new Date(msg.user_message_time).toLocaleTimeString('en-US', { 
                  hour: 'numeric', 
                  minute: '2-digit',
                  hour12: true 
                })
              });
            }
            
            // Add AI message
            if (msg.ai_message) {
              transformedMessages.push({
                id: msg.message_id * 2, // Ensure unique IDs
                role: 'assistant',
                content: msg.ai_message,
                timestamp: new Date(msg.ai_message_time).toLocaleTimeString('en-US', { 
                  hour: 'numeric', 
                  minute: '2-digit',
                  hour12: true 
                })
              });
            }
          });
          
          // If no messages from backend, add default welcome message
          if (transformedMessages.length === 0) {
            transformedMessages.push({
              id: 1,
              role: 'assistant',
              content: 'Hello! I\'m here to help you with this project. What would you like to know?',
              timestamp: new Date().toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                minute: '2-digit',
                hour12: true 
              })
            });
          }
          
          setMessages(transformedMessages);
        } else {
          // If API fails, add default welcome message
          setMessages([{
            id: 1,
            role: 'assistant',
            content: 'Hello! I\'m here to help you with this project. What would you like to know?',
            timestamp: new Date().toLocaleTimeString('en-US', { 
              hour: 'numeric', 
              minute: '2-digit',
              hour12: true 
            })
          }]);
        }
      } catch (err) {
        console.error('Error fetching project messages:', err);
        // Add default welcome message on error
        setMessages([{
          id: 1,
          role: 'assistant',
          content: 'Hello! I\'m here to help you with this project. What would you like to know?',
          timestamp: new Date().toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
          })
        }]);
      } finally {
        setIsLoadingMessages(false);
      }
    };

    fetchProjectMessages();
  }, [params.id]);

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

  // BOM Helper Functions
  const calculateItemTotals = (item: Partial<BOMItem>): { totalCost: number; totalSell: number } => {
    const cost = (item.quantity || 0) * (item.unitPrice || 0);
    const margin = (item.margin || 35) / 100;
    const sell = cost / (1 - margin);
    return { totalCost: cost, totalSell: sell };
  };

  const getBOMTotals = () => {
    const totals = bomItems.reduce((acc, item) => {
      acc.totalCost += item.totalCost;
      acc.totalSell += item.totalSell;
      return acc;
    }, { totalCost: 0, totalSell: 0 });
    return totals;
  };

  const getUniqueCategories = () => {
    const categories = [...new Set(bomItems.map(item => item.category))];
    const totalCost = bomItems.reduce((sum, item) => sum + item.totalCost, 0);
    
    return categories.map(category => {
      const categoryItems = bomItems.filter(item => item.category === category);
      const categoryTotalCost = categoryItems.reduce((sum, item) => sum + item.totalCost, 0);
      const categoryTotalSell = categoryItems.reduce((sum, item) => sum + item.totalSell, 0);
      
      return {
        id: category,
        name: category,
        itemCount: categoryItems.length,
        totalCost: categoryTotalCost,
        totalSell: categoryTotalSell,
        percentageOfTotal: totalCost > 0 ? (categoryTotalCost / totalCost) * 100 : 0
      };
    });
  };

  const handleAddBOMItem = () => {
    if (!newItem.description || !newItem.category) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please fill in the description and category fields."
      });
      return;
    }

    const { totalCost, totalSell } = calculateItemTotals(newItem);
    const item: BOMItem = {
      id: Date.now().toString(),
      description: newItem.description!,
      category: newItem.category!,
      quantity: newItem.quantity || 1,
      unit: newItem.unit || 'Each',
      unitPrice: newItem.unitPrice || 0,
      vendor: newItem.vendor || '',
      partNumber: newItem.partNumber || '',
      manufacturer: newItem.manufacturer || '',
      modelNumber: newItem.modelNumber || '',
      notes: newItem.notes || '',
      totalCost,
      totalSell,
      margin: newItem.margin || 35
    };

    setBomItems(prev => [...prev, item]);
    setBomCategories(getUniqueCategories());
    
    // Reset form
    setNewItem({
      description: '',
      category: '',
      quantity: 1,
      unit: 'Each',
      unitPrice: 0,
      vendor: '',
      partNumber: '',
      manufacturer: '',
      modelNumber: '',
      notes: '',
      margin: 35
    });
    
    setIsAddItemModalOpen(false);
    toast({
      title: "Success",
      description: "Item added to Bill of Materials"
    });
  };

  const handleDeleteBOMItem = (itemId: string) => {
    setBomItems(prev => prev.filter(item => item.id !== itemId));
    setBomCategories(getUniqueCategories());
    toast({
      title: "Success",
      description: "Item removed from Bill of Materials"
    });
  };

  const handleDeleteAllBOMItems = () => {
    if (window.confirm('Are you sure you want to delete all items? This action cannot be undone.')) {
      setBomItems([]);
      setBomCategories([]);
      toast({
        title: "Success",
        description: "All items removed from Bill of Materials"
      });
    }
  };

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please enter a category name."
      });
      return;
    }

    // Check if category already exists
    if (bomCategories.some(cat => cat.name.toLowerCase() === newCategoryName.trim().toLowerCase())) {
      toast({
        variant: "destructive",
        title: "Category Exists",
        description: "A category with this name already exists."
      });
      return;
    }

    const newCategory: BOMCategory = {
      id: Date.now().toString(),
      name: newCategoryName.trim(),
      itemCount: 0,
      totalCost: 0,
      totalSell: 0,
      percentageOfTotal: 0
    };

    setBomCategories(prev => [...prev, newCategory]);
    setNewCategoryName('');
    setIsAddCategoryModalOpen(false);
    toast({
      title: "Success",
      description: "Category added successfully"
    });
  };

  const handleDeleteCategory = (categoryId: string) => {
    const category = bomCategories.find(cat => cat.id === categoryId);
    if (!category) return;

    // Check if category has items
    const itemsInCategory = bomItems.filter(item => item.category === category.name);
    if (itemsInCategory.length > 0) {
      toast({
        variant: "destructive",
        title: "Cannot Delete",
        description: `Cannot delete category "${category.name}" because it contains ${itemsInCategory.length} item(s). Please remove or reassign the items first.`
      });
      return;
    }

    setBomCategories(prev => prev.filter(cat => cat.id !== categoryId));
    toast({
      title: "Success",
      description: "Category deleted successfully"
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

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
              {isLoadingMessages ? (
                <div className="flex justify-center items-center h-64">
                  <div className="flex flex-col items-center space-y-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black dark:border-white"></div>
                    <p className="text-gray-500 dark:text-gray-400">Loading project messages...</p>
                  </div>
                </div>
              ) : (
                messages.map((message) => (
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
                ))
              )}
              
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
                 ) : activeSection === 'Bill of Materials' ? (
           /* Bill of Materials Section */
           <div className="flex-1 p-6 overflow-y-auto">
             <div className="max-w-7xl mx-auto space-y-6">
               {/* Header */}
               <div className="flex items-center justify-between">
                 <div>
                   <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                     Bill of Materials
                   </h1>
                   <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                     Manage project materials and costs
                   </p>
                 </div>
                 
                                   {/* Action Buttons */}
                  <div className="flex items-center space-x-3">
                    <button className="flex items-center space-x-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors text-sm font-medium">
                      <Brain className="w-4 h-4" />
                      <span>AI Reclassify &apos;Other&apos;</span>
                    </button>
                    <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium">
                      <Upload className="w-4 h-4" />
                      <span>Import from Documents</span>
                    </button>
                    <button 
                      onClick={() => setIsAddItemModalOpen(true)}
                      className="flex items-center space-x-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors text-sm font-medium"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Item</span>
                    </button>
                    <button 
                      onClick={handleDeleteAllBOMItems}
                      className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete All</span>
                    </button>
                  </div>
               </div>

               {/* Summary Cards */}
               <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                 <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                   <div className="flex items-center space-x-2">
                     <Package className="w-5 h-5 text-blue-500" />
                     <div>
                       <p className="text-sm text-gray-600 dark:text-gray-400">Total Items</p>
                       <p className="text-xl font-semibold text-gray-900 dark:text-white">
                         {bomItems.length}
                       </p>
                     </div>
                   </div>
                 </div>
                 
                 <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                   <div className="flex items-center space-x-2">
                     <Package className="w-5 h-5 text-green-500" />
                     <div>
                       <p className="text-sm text-gray-600 dark:text-gray-400">Material Cost</p>
                       <p className="text-xl font-semibold text-green-600 dark:text-green-400">
                         {formatCurrency(getBOMTotals().totalCost)}
                       </p>
                     </div>
                   </div>
                 </div>
                 
                 <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                   <div className="flex items-center space-x-2">
                     <Package className="w-5 h-5 text-green-500" />
                     <div>
                       <p className="text-sm text-gray-600 dark:text-gray-400">Customer Price</p>
                       <p className="text-xl font-semibold text-green-600 dark:text-green-400">
                         {formatCurrency(getBOMTotals().totalSell)}
                       </p>
                     </div>
                   </div>
                 </div>
                 
                 <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                   <div className="flex items-center space-x-2">
                     <Package className="w-5 h-5 text-purple-500" />
                     <div>
                       <p className="text-sm text-gray-600 dark:text-gray-400">Categories</p>
                       <p className="text-xl font-semibold text-gray-900 dark:text-white">
                         {bomCategories.length}
                       </p>
                     </div>
                   </div>
                 </div>
               </div>

                               {/* Tabs */}
                <div className="flex space-x-4 border-b border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => setActiveBOMTab('BOM Items')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                      activeBOMTab === 'BOM Items'
                        ? 'border-black dark:border-white text-black dark:text-white'
                        : 'border-transparent text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    BOM Items
                  </button>
                  <button
                    onClick={() => setActiveBOMTab('Categories')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                      activeBOMTab === 'Categories'
                        ? 'border-black dark:border-white text-black dark:text-white'
                        : 'border-transparent text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    Categories
                  </button>
                </div>

               {/* BOM Items Tab */}
               {activeBOMTab === 'BOM Items' && (
                 <div className="space-y-6">
                   {bomCategories.map((category) => (
                     <div key={category.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                       {/* Category Header */}
                       <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
                         <div className="flex items-center justify-between">
                           <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                             {category.name}
                           </h3>
                           <div className="flex items-center space-x-4 text-sm">
                             <span className="text-gray-600 dark:text-gray-400">
                               {category.itemCount} items
                             </span>
                             <div className="flex space-x-2">
                               <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 rounded text-xs">
                                 Cost: {formatCurrency(category.totalCost)}
                               </span>
                               <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300 rounded text-xs">
                                 Sell: {formatCurrency(category.totalSell)}
                               </span>
                             </div>
                           </div>
                         </div>
                       </div>

                       {/* Items Table */}
                       <div className="overflow-x-auto">
                         <table className="w-full">
                           <thead className="bg-gray-50 dark:bg-gray-700">
                             <tr>
                               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                 Description
                               </th>
                               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                 Manufacturer / Category
                               </th>
                               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                 Qty
                               </th>
                               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                 Unit
                               </th>
                               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                 Cost Price
                               </th>
                               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                 Pricing
                               </th>
                               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                 Sell Price
                               </th>
                               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                 Total Cost
                               </th>
                               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                 Total Sell
                               </th>
                               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                 Actions
                               </th>
                             </tr>
                           </thead>
                           <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                             {bomItems
                               .filter(item => item.category === category.name)
                               .map((item) => (
                                 <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                     {item.description}
                                   </td>
                                   <td className="px-6 py-4 whitespace-nowrap">
                                     <div>
                                       <div className="text-sm text-gray-900 dark:text-white">
                                         {item.manufacturer || 'N/A'}
                                       </div>
                                       <div className="text-xs text-gray-500 dark:text-gray-400">
                                         {item.category}
                                       </div>
                                     </div>
                                   </td>
                                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                     {item.quantity.toFixed(3)}
                                   </td>
                                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                     {item.unit}
                                   </td>
                                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                     {formatCurrency(item.unitPrice)}
                                   </td>
                                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                     Margin {item.margin}%
                                   </td>
                                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                     {formatCurrency(item.totalSell / item.quantity)}
                                   </td>
                                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                     {formatCurrency(item.totalCost)}
                                   </td>
                                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                     {formatCurrency(item.totalSell)}
                                   </td>
                                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                     <button
                                       onClick={() => handleDeleteBOMItem(item.id)}
                                       className="text-red-600 hover:text-red-900 dark:hover:text-red-400"
                                     >
                                       <Trash2 className="w-4 h-4" />
                                     </button>
                                   </td>
                                 </tr>
                               ))}
                           </tbody>
                         </table>
                       </div>
                     </div>
                   ))}

                   {bomItems.length === 0 && (
                     <div className="text-center py-12">
                       <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                       <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                         No items in Bill of Materials
                       </h3>
                       <p className="text-gray-500 dark:text-gray-400 mb-4">
                         Start by adding your first item to the bill of materials.
                       </p>
                                               <button
                          onClick={() => setIsAddItemModalOpen(true)}
                          className="inline-flex items-center space-x-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors font-medium"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Add First Item</span>
                        </button>
                     </div>
                   )}
                 </div>
               )}

                               {/* Categories Tab */}
                {activeBOMTab === 'Categories' && (
                  <div className="space-y-6">
                    {/* Categories Table */}
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Material Categories
                          </h3>
                          <button
                            onClick={() => setIsAddCategoryModalOpen(true)}
                            className="flex items-center space-x-2 px-3 py-1.5 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors text-sm font-medium"
                          >
                            <Plus className="w-4 h-4" />
                            <span>Add Category</span>
                          </button>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          Overview of material categories and costs
                        </p>
                      </div>
                      
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Category
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Items
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Total Cost
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                % of Total
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {bomCategories.map((category) => (
                              <tr key={category.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                  {category.name}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                  {category.itemCount} item{category.itemCount !== 1 ? 's' : ''}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                  {formatCurrency(category.totalCost)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                  {category.percentageOfTotal.toFixed(1)}%
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                  <button
                                    onClick={() => handleDeleteCategory(category.id)}
                                    className="text-red-600 hover:text-red-900 dark:hover:text-red-400"
                                    title="Delete category"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {bomCategories.length === 0 && (
                      <div className="text-center py-12">
                        <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                          No categories found
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-4">
                          Create your first category to get started.
                        </p>
                        <button
                          onClick={() => setIsAddCategoryModalOpen(true)}
                          className="inline-flex items-center space-x-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors font-medium"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Add First Category</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
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

                 {/* Add Category Modal */}
         {isAddCategoryModalOpen && (
           <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
             <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full">
               <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                 <div className="flex items-center justify-between">
                   <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                     Add New Category
                   </h2>
                   <button
                     onClick={() => setIsAddCategoryModalOpen(false)}
                     className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                   >
                     <X className="w-6 h-6" />
                   </button>
                 </div>
               </div>

               <div className="p-6">
                 <div className="space-y-4">
                   <div>
                     <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                       Category Name
                     </label>
                     <input
                       type="text"
                       value={newCategoryName}
                       onChange={(e) => setNewCategoryName(e.target.value)}
                       placeholder="Enter category name"
                       className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-black focus:border-black dark:focus:ring-white dark:focus:border-white"
                       onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
                     />
                   </div>
                 </div>

                 {/* Action Buttons */}
                 <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                   <button
                     onClick={() => setIsAddCategoryModalOpen(false)}
                     className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                   >
                     Cancel
                   </button>
                   <button
                     onClick={handleAddCategory}
                     className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
                   >
                     Add Category
                   </button>
                 </div>
               </div>
             </div>
           </div>
         )}

         {/* Add Item Modal */}
         {isAddItemModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Add a new item to the bill of materials.
                  </h2>
                  <button
                    onClick={() => setIsAddItemModalOpen(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Item Description */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Item Description
                    </label>
                                         <input
                       type="text"
                       value={newItem.description}
                       onChange={(e) => setNewItem(prev => ({ ...prev, description: e.target.value }))}
                       placeholder="Enter item description"
                       className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-black focus:border-black dark:focus:ring-white dark:focus:border-white"
                     />
                  </div>

                                     {/* Category */}
                   <div className="md:col-span-2">
                     <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                       Category
                     </label>
                     <Select 
                       value={newItem.category} 
                       onValueChange={(value) => {
                         if (value === 'create-new') {
                           setIsAddCategoryModalOpen(true);
                         } else {
                           setNewItem(prev => ({ ...prev, category: value }));
                         }
                       }}
                     >
                       <SelectTrigger className="w-full">
                         <SelectValue placeholder="Select existing category or create new" />
                       </SelectTrigger>
                       <SelectContent>
                         {bomCategories.map((category) => (
                           <SelectItem key={category.id} value={category.name}>
                             {category.name} ({category.itemCount} items)
                           </SelectItem>
                         ))}
                         <SelectItem value="create-new" className="text-blue-600 dark:text-blue-400">
                           + Create New Category
                         </SelectItem>
                       </SelectContent>
                     </Select>
                   </div>

                  {/* Quantity */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Quantity
                    </label>
                    <input
                      type="number"
                      value={newItem.quantity}
                      onChange={(e) => setNewItem(prev => ({ ...prev, quantity: parseFloat(e.target.value) || 0 }))}
                      min="0"
                      step="0.001"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-black focus:border-black dark:focus:ring-white dark:focus:border-white"
                    />
                  </div>

                  {/* Unit */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Unit
                    </label>
                    <Select 
                      value={newItem.unit} 
                      onValueChange={(value) => setNewItem(prev => ({ ...prev, unit: value }))}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select unit" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Each">Each</SelectItem>
                        <SelectItem value="Box">Box</SelectItem>
                        <SelectItem value="Case">Case</SelectItem>
                        <SelectItem value="Foot">Foot</SelectItem>
                        <SelectItem value="Meter">Meter</SelectItem>
                        <SelectItem value="License">License</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Unit Price */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Unit Price
                    </label>
                    <input
                      type="number"
                      value={newItem.unitPrice}
                      onChange={(e) => setNewItem(prev => ({ ...prev, unitPrice: parseFloat(e.target.value) || 0 }))}
                      min="0"
                      step="0.01"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-black focus:border-black dark:focus:ring-white dark:focus:border-white"
                    />
                  </div>

                  {/* Vendor */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Vendor
                    </label>
                    <input
                      type="text"
                      value={newItem.vendor}
                      onChange={(e) => setNewItem(prev => ({ ...prev, vendor: e.target.value }))}
                      placeholder="Vendor name"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-black focus:border-black dark:focus:ring-white dark:focus:border-white"
                    />
                  </div>

                  {/* Part Number */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Part Number
                    </label>
                    <input
                      type="text"
                      value={newItem.partNumber}
                      onChange={(e) => setNewItem(prev => ({ ...prev, partNumber: e.target.value }))}
                      placeholder="Vendor part number"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-black focus:border-black dark:focus:ring-white dark:focus:border-white"
                    />
                  </div>

                  {/* Manufacturer */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Manufacturer
                    </label>
                    <input
                      type="text"
                      value={newItem.manufacturer}
                      onChange={(e) => setNewItem(prev => ({ ...prev, manufacturer: e.target.value }))}
                      placeholder="Manufacturer"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-black focus:border-black dark:focus:ring-white dark:focus:border-white"
                    />
                  </div>

                  {/* Model Number */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Model Number
                    </label>
                    <input
                      type="text"
                      value={newItem.modelNumber}
                      onChange={(e) => setNewItem(prev => ({ ...prev, modelNumber: e.target.value }))}
                      placeholder="Model number"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-black focus:border-black dark:focus:ring-white dark:focus:border-white"
                    />
                  </div>

                  {/* Notes */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Notes
                    </label>
                    <textarea
                      value={newItem.notes}
                      onChange={(e) => setNewItem(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Additional notes"
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-black focus:border-black dark:focus:ring-white dark:focus:border-white resize-none"
                    />
                  </div>
                </div>

                                 {/* Action Buttons */}
                 <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                   <button
                     onClick={() => setIsAddItemModalOpen(false)}
                     className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                   >
                     Cancel
                   </button>
                   <button
                     onClick={handleAddBOMItem}
                     className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
                   >
                     Add Item
                   </button>
                 </div>
              </div>
            </div>
          </div>
        )}

        <Toaster />
      </div>
    );
  }
