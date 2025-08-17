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
  Users,
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
  X,
  Save,
  TrendingUp,
  Target,
  Copy,
  LogOut
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ThemeToggle } from '@/components/theme-provider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { ShimmerButton } from "@/components/magicui/shimmer-button";

// Type declaration for html2pdf library
declare global {
  interface Window {
    html2pdf: any;
  }
}

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

interface EstimationResults {
  bestCasePrice: number;
  worstCasePrice: number;
  materialsMin: number;
  materialsMax: number;
  marginApplied: number;
  confidence: number;
  laborBreakdown: {
    technician: {
      rate: number;
      hours: { min: number; max: number };
      cost: { min: number; max: number };
    };
    programmingEngineer: {
      rate: number;
      hours: { min: number; max: number };
      cost: { min: number; max: number };
    };
  };
  materialsBreakdown: {
    totalCost: { min: number; max: number };
    categories: Array<{
      name: string;
      description: string;
      cost: number;
      customer: number;
    }>;
  };
  aiReasoning: string;
}

interface BackendLabor {
  labor_id: string;
  project_id: string;
  user_id: string;
  labor_name: string;
  hourly_rate: number;
  labor_hours_adjustment: string;
  created_at: string;
}

interface LaborType {
  id: string;
  name: string;
  rate: number;
  hoursAdjustment: string;
}

interface CustomItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  category: 'materials' | 'labor' | 'shipping';
  totalPrice: number;
}

const getCategoryFromType = (fileType: string): Document['category'] => {
  const type = fileType.toLowerCase();
  if (type.includes('contract')) return 'contract';
  if (type.includes('blueprint') || type.includes('drawing')) return 'blueprint';
  if (type.includes('invoice')) return 'invoice';
  if (type.includes('report')) return 'report';
  return 'other';
};

export default function ProjectChatPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState('Project Chat');
  const [activeQuoteTab, setActiveQuoteTab] = useState('Customer Setup');
  const [isSidebarMinimized, setIsSidebarMinimized] = useState(true);
  const [documentSearch, setDocumentSearch] = useState('');
  const [projectId, setProjectId] = useState<string>('');
  const [documentFilter, setDocumentFilter] = useState('all');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isClearingChat, setIsClearingChat] = useState(false);

  // Handle async params
  useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params;
      setProjectId(resolvedParams.id);
    };
    getParams();
  }, [params]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // BOM States
  const [bomItems, setBomItems] = useState<BOMItem[]>([]);
  const [bomCategories, setBomCategories] = useState<BOMCategory[]>([]);
  const [categories, setCategories] = useState<Array<{category_id: string, category_name: string}>>([]);
  const [activeBOMTab, setActiveBOMTab] = useState('BOM Items');
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newItem, setNewItem] = useState<Partial<BOMItem>>({
    description: '',
    category: '',
    quantity: 1,
    unit: 'pcs',
    unitPrice: 0,
    vendor: '',
    partNumber: '',
    manufacturer: '',
    modelNumber: '',
    notes: ''
  });

  // Pagination states for BOM
  const [currentBOMPage, setCurrentBOMPage] = useState(1);
  const [bomItemsPerPage, setBomItemsPerPage] = useState(10);

  // AI Estimation States
  const [activeEstimationTab, setActiveEstimationTab] = useState('Overview');
  const [activeEstimationSubTab, setActiveEstimationSubTab] = useState<'Analysis' | 'Materials' | 'AISuggestions' | 'Context' | 'Discussion' | 'ValueEngineering' | 'Labor'>('Analysis');
  const [laborTypes, setLaborTypes] = useState<LaborType[]>([]);
  const [isLoadingLabors, setIsLoadingLabors] = useState(true);
  const [laborError, setLaborError] = useState<string | null>(null);
  const [isCreatingLabor, setIsCreatingLabor] = useState(false);
  const [deletingLaborId, setDeletingLaborId] = useState<string | null>(null);
  const [addedToQuoteLabors, setAddedToQuoteLabors] = useState<Set<string>>(new Set());
  const [pricingConfig, setPricingConfig] = useState({
    type: 'Margin',
    percentage: 35,
    applyTo: 'Materials Only',
    customAdjustment: 0,
    adjustmentDescription: ''
  });
  const [additionalContext, setAdditionalContext] = useState('');
  const [estimationResults, setEstimationResults] = useState<EstimationResults | null>(null);
  const [isGeneratingEstimation, setIsGeneratingEstimation] = useState(false);
  const [newLaborType, setNewLaborType] = useState({
    name: '',
    rate: 0,
    hoursAdjustment: ''
  });
  const [customItems, setCustomItems] = useState<CustomItem[]>([]);
  const [newCustomItem, setNewCustomItem] = useState<Partial<CustomItem>>({
    description: '',
    quantity: 1,
    unitPrice: 0,
    category: 'materials'
  });
  const [isGeneratingQuote, setIsGeneratingQuote] = useState(false);
  const [showMagicAnimation, setShowMagicAnimation] = useState(false);
  const [quoteContent, setQuoteContent] = useState<string>('');
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [showPdfPreview, setShowPdfPreview] = useState(false);

  // Load project data from session storage or use default values
  const [project, setProject] = useState<Project>(() => {
    if (typeof window !== 'undefined') {
      const storedProject = sessionStorage.getItem('currentProject');
      if (storedProject) {
        return JSON.parse(storedProject);
      }
    }
    return {
      id: '',
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
      // Don't fetch if projectId is empty
      if (!projectId) {
        return;
      }

      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setDocumentsError('Authentication token not found');
          setIsDocumentsLoading(false);
          return;
        }

        const response = await fetch('https://chikaai.net/api/fusedai/get-all-documents', {
          method: 'POST',  // Changed to POST to send body
          headers: {
            'Content-Type': 'application/json',
            'token': token
          },
                  body: JSON.stringify({
          project_id: projectId
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
  }, [projectId]); // Added projectId as dependency

  // Fetch project messages from backend
  useEffect(() => {
    const fetchProjectMessages = async () => {
      // Don't fetch if projectId is empty
      if (!projectId) {
        return;
      }

      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Authentication token not found');
          setIsLoadingMessages(false);
          return;
        }

        const response = await fetch('https://chikaai.net/api/fusedai/get-project-messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'token': token
          },
                  body: JSON.stringify({
          project_id: parseInt(projectId)
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
  }, [projectId]);

  // Fetch bill of materials from backend
  useEffect(() => {
    const fetchBillOfMaterials = async () => {
      // Don't fetch if projectId is empty
      if (!projectId) {
        return;
      }

      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.error('Authentication token not found');
          return;
        }

        const response = await fetch('https://chikaai.net/api/fusedai/get-all-bill-of-materials', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'token': token
          },
          body: JSON.stringify({
            project_id: parseInt(projectId)
          })
        });

        const data = await response.json();
        
        if (response.ok) {
          if (data.bill_of_materials && data.bill_of_materials.length > 0) {
            // Transform backend BOM items to our BOMItem interface
            const transformedItems: BOMItem[] = data.bill_of_materials.map((item: any) => ({
              id: item.bill_of_material_id.toString(),
              description: item.description,
              category: item.category_name,
              quantity: item.quantity,
              unit: item.unit,
              unitPrice: item.unit_price,
              vendor: item.vendor,
              partNumber: item.part_number,
              manufacturer: item.manufacturer,
              modelNumber: item.model_number,
              notes: item.notes,
              totalCost: item.total_price,
              totalSell: item.total_price * 1.35, // Apply 35% margin
              margin: 35
            }));
            
            setBomItems(transformedItems);
            
            // Group items by category and create BOMCategory objects
            const categoryMap = new Map<string, BOMCategory>();
            
            transformedItems.forEach(item => {
              if (!categoryMap.has(item.category)) {
                categoryMap.set(item.category, {
                  id: item.category,
                  name: item.category,
                  itemCount: 0,
                  totalCost: 0,
                  totalSell: 0,
                  percentageOfTotal: 0
                });
              }
              
              const category = categoryMap.get(item.category)!;
              category.itemCount += item.quantity;
              category.totalCost += item.totalCost;
              category.totalSell += item.totalSell;
            });
            
            // Calculate percentages
            const totalCost = Array.from(categoryMap.values()).reduce((sum, cat) => sum + cat.totalCost, 0);
            categoryMap.forEach(category => {
              category.percentageOfTotal = totalCost > 0 ? (category.totalCost / totalCost) * 100 : 0;
            });
            
            setBomCategories(Array.from(categoryMap.values()));
          } else {
            // No BOM data found, set empty arrays
            setBomItems([]);
            setBomCategories([]);
          }
        } else {
          console.error('Failed to fetch bill of materials:', data.message);
        }
      } catch (err) {
        console.error('Error fetching bill of materials:', err);
      }
    };

    fetchBillOfMaterials();
  }, [projectId]);

  // Fetch categories from backend
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.error('Authentication token not found');
          return;
        }

        const response = await fetch('https://chikaai.net/api/fusedai/get-all-categories', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'token': token
          }
        });

        const data = await response.json();
        
        if (response.ok) {
          setCategories(data.categories || []);
        } else {
          console.error('Failed to fetch categories:', data.message);
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };

    fetchCategories();
  }, []);

  // Fetch labor types from backend
  useEffect(() => {
    const fetchLabors = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.error('Authentication token not found');
          return;
        }

        const response = await fetch('https://chikaai.net/api/fusedai/get-all-labors', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'token': token
          }
        });

        const data = await response.json();
        
        if (response.ok) {
          if (data.labors && data.labors.length > 0) {
            // Transform backend labor data to our LaborType interface
            const transformedLabors: LaborType[] = data.labors.map((labor: BackendLabor) => ({
              id: labor.labor_id,
              name: labor.labor_name,
              rate: labor.hourly_rate,
              hoursAdjustment: labor.labor_hours_adjustment
            }));
            setLaborTypes(transformedLabors);
          } else {
            setLaborTypes([]);
          }
          setLaborError(null);
        } else {
          console.error('Failed to fetch labors:', data.message);
          setLaborError(data.message || 'Failed to fetch labors');
        }
      } catch (err) {
        console.error('Error fetching labors:', err);
        setLaborError('Failed to fetch labors. Please try again later.');
      } finally {
        setIsLoadingLabors(false);
      }
    };

    fetchLabors();
  }, []);

  // Load existing quote labor types from session storage
  useEffect(() => {
    try {
      const existingQuoteLabors = sessionStorage.getItem('quoteLaborTypes');
      if (existingQuoteLabors) {
        const quoteLabors: LaborType[] = JSON.parse(existingQuoteLabors);
        const addedLaborIds = new Set(quoteLabors.map(lt => lt.id));
        setAddedToQuoteLabors(addedLaborIds);
      }
    } catch (error) {
      console.error('Error loading quote labor types from session storage:', error);
    }
  }, []);

  // Load existing custom items from session storage
  useEffect(() => {
    try {
      const existingCustomItems = sessionStorage.getItem('quoteCustomItems');
      if (existingCustomItems) {
        const items: CustomItem[] = JSON.parse(existingCustomItems);
        setCustomItems(items);
      }
    } catch (error) {
      console.error('Error loading custom items from session storage:', error);
    }
  }, []);

  // Load html2pdf library for PDF generation
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
    script.async = true;
    document.head.appendChild(script);
    
    return () => {
      document.head.removeChild(script);
    };
  }, []);

  const sidebarSections = [
    { name: 'Project Chat', icon: MessageCircle, active: true },
    { name: 'Overview', icon: Eye },
    { name: 'Documents', icon: FileText },
    { name: 'Quotes', icon: Quote },
    { name: 'AI Estimation', icon: Brain }
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
        formData.append('project_id', projectId);  // Adding project_id to FormData

        const token = localStorage.getItem('token');
        if (!token) {
          toast({
            variant: "destructive",
            title: "Authentication Error",
            description: "Authentication token not found. Please log in again."
          });
          return;
        }

        const response = await fetch('https://chikaai.net/api/fusedai/upload-any-file', {
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

  // Project related data for quotes
  const [projectRelatedData, setProjectRelatedData] = useState<{
    project_name: string;
    contact_name: string;
    company_name: string;
    email: string;
    phone: string;
    image_url: string | null;
  } | null>(null);
  const [isLoadingProjectData, setIsLoadingProjectData] = useState(false);
  const [projectDataError, setProjectDataError] = useState<string | null>(null);

  // Project image state
  const [projectImage, setProjectImage] = useState<string | null>(null);
  const [isLoadingImage, setIsLoadingImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

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

  // Pagination functions for BOM
  const getPaginatedBOMItems = (items: BOMItem[], categoryName: string) => {
    const categoryItems = items.filter(item => item.category === categoryName);
    const startIndex = (currentBOMPage - 1) * bomItemsPerPage;
    const endIndex = startIndex + bomItemsPerPage;
    return categoryItems.slice(startIndex, endIndex);
  };

  const getTotalBOMPages = (items: BOMItem[], categoryName: string) => {
    const categoryItems = items.filter(item => item.category === categoryName);
    return Math.ceil(categoryItems.length / bomItemsPerPage);
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

  const handleAddBOMItem = async () => {
    if (!newItem.description || !newItem.category) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please fill in the description and category fields."
      });
      return;
    }

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

      const response = await fetch('https://chikaai.net/api/fusedai/create-bill-of-materials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'token': token
        },
        body: JSON.stringify({
          project_id: parseInt(projectId),
          category_name: newItem.category,
          description: newItem.description,
          quantity: newItem.quantity || 1,
          unit: newItem.unit || 'Each',
          unit_price: newItem.unitPrice || 0,
          vendor: newItem.vendor || '',
          part_number: newItem.partNumber || '',
          manufacturer: newItem.manufacturer || '',
          model_number: newItem.modelNumber || '',
          notes: newItem.notes || ''
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Transform the response to match our BOMItem interface
        const createdItem: BOMItem = {
          id: data.bill_of_material.bill_of_material_id.toString(),
          description: data.bill_of_material.description,
          category: data.bill_of_material.category_name,
          quantity: data.bill_of_material.quantity,
          unit: data.bill_of_material.unit,
          unitPrice: data.bill_of_material.unit_price,
          vendor: data.bill_of_material.vendor,
          partNumber: data.bill_of_material.part_number,
          manufacturer: data.bill_of_material.manufacturer,
          modelNumber: data.bill_of_material.model_number,
          notes: data.bill_of_material.notes,
          totalCost: data.bill_of_material.total_price,
          totalSell: data.bill_of_material.total_price * 1.35, // Apply 35% margin
          margin: 35
        };

        setBomItems(prev => [...prev, createdItem]);
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

        // Refresh BOM data from backend
        const fetchBillOfMaterials = async () => {
          try {
            const bomResponse = await fetch('https://chikaai.net/api/fusedai/get-all-bill-of-materials', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'token': token
              },
              body: JSON.stringify({
                project_id: parseInt(projectId)
              })
            });

            const bomData = await bomResponse.json();
            
            if (bomResponse.ok && bomData.bill_of_materials && bomData.bill_of_materials.length > 0) {
              const transformedItems: BOMItem[] = bomData.bill_of_materials.map((item: any) => ({
                id: item.bill_of_material_id.toString(),
                description: item.description,
                category: item.category_name,
                quantity: item.quantity,
                unit: item.unit,
                unitPrice: item.unit_price,
                vendor: item.vendor,
                partNumber: item.part_number,
                manufacturer: item.manufacturer,
                modelNumber: item.model_number,
                notes: item.notes,
                totalCost: item.total_price,
                totalSell: item.total_price * 1.35,
                margin: 35
              }));
              
              setBomItems(transformedItems);
              
              // Update categories
              const categoryMap = new Map<string, BOMCategory>();
              
              transformedItems.forEach(item => {
                if (!categoryMap.has(item.category)) {
                  categoryMap.set(item.category, {
                    id: item.category,
                    name: item.category,
                    itemCount: 0,
                    totalCost: 0,
                    totalSell: 0,
                    percentageOfTotal: 0
                  });
                }
                
                const category = categoryMap.get(item.category)!;
                category.itemCount += item.quantity;
                category.totalCost += item.totalCost;
                category.totalSell += item.totalSell;
              });
              
              const totalCost = Array.from(categoryMap.values()).reduce((sum, cat) => sum + cat.totalCost, 0);
              categoryMap.forEach(category => {
                category.percentageOfTotal = totalCost > 0 ? (category.totalCost / totalCost) * 100 : 0;
              });
              
              setBomCategories(Array.from(categoryMap.values()));
            }
          } catch (err) {
            console.error('Error refreshing BOM data:', err);
          }
        };

        fetchBillOfMaterials();
      } else {
        throw new Error(data.message || 'Failed to create BOM item');
      }
    } catch (error) {
      console.error('Error creating BOM item:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to create BOM item'
      });
    }
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

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please enter a category name."
      });
      return;
    }

    // Check if category already exists
    if (categories.some(cat => cat.category_name.toLowerCase() === newCategoryName.trim().toLowerCase())) {
      toast({
        variant: "destructive",
        title: "Category Exists",
        description: "A category with this name already exists."
      });
      return;
    }

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

      const response = await fetch('https://chikaai.net/api/fusedai/create-category', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'token': token
        },
        body: JSON.stringify({
          category_name: newCategoryName.trim(),
          project_id: parseInt(projectId)
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Add the new category to the local state
        const newCategory = {
          category_id: data.category?.category_id || Date.now().toString(),
          category_name: newCategoryName.trim()
        };
        
        setCategories(prev => [...prev, newCategory]);
        setNewCategoryName('');
        setIsAddCategoryModalOpen(false);
        
        toast({
          title: "Success",
          description: "Category added successfully"
        });

        // Refresh categories from backend
        const fetchCategories = async () => {
          try {
            const catResponse = await fetch('https://chikaai.net/api/fusedai/get-all-categories', {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                'token': token
              }
            });

            const catData = await catResponse.json();
            
            if (catResponse.ok) {
              setCategories(catData.categories || []);
            }
          } catch (err) {
            console.error('Error refreshing categories:', err);
          }
        };

        fetchCategories();
      } else {
        throw new Error(data.message || 'Failed to create category');
      }
    } catch (error) {
      console.error('Error creating category:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to create category'
      });
    }
  };

  const handleDeleteCategory = (categoryId: string) => {
    const category = categories.find(cat => cat.category_id === categoryId);
    if (!category) return;

    // Check if category has items
    const itemsInCategory = bomItems.filter(item => item.category === category.category_name);
    if (itemsInCategory.length > 0) {
      toast({
        variant: "destructive",
        title: "Cannot Delete",
        description: `Cannot delete category "${category.category_name}" because it contains ${itemsInCategory.length} item(s). Please remove or reassign the items first.`
      });
      return;
    }

    setCategories(prev => prev.filter(cat => cat.category_id !== categoryId));
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

      const response = await fetch('https://chikaai.net/api/fusedai/delete-document', {
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

  // Fetch project related data when quotes section is active
  useEffect(() => {
    if (activeSection === 'Quotes' && projectId && !projectRelatedData) {
      const fetchProjectRelatedData = async () => {
        try {
          setIsLoadingProjectData(true);
          setProjectDataError(null);

          const token = localStorage.getItem('token');
          if (!token) {
            setProjectDataError('Authentication token not found');
            setIsLoadingProjectData(false);
            return;
          }

          const response = await fetch('https://chikaai.net/api/fusedai/get-project-related-data', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'token': token
            },
            body: JSON.stringify({
              project_id: parseInt(projectId)
            })
          });

          const data = await response.json();
          
          if (response.ok) {
            setProjectRelatedData(data.project);
          } else {
            throw new Error(data.message || 'Failed to fetch project data');
          }
        } catch (error) {
          console.error('Error fetching project related data:', error);
          setProjectDataError(error instanceof Error ? error.message : 'Failed to fetch project data');
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to fetch project data for quotes"
          });
        } finally {
          setIsLoadingProjectData(false);
        }
      };

      fetchProjectRelatedData();
    }
  }, [activeSection, projectId, projectRelatedData, toast]);

  // Set project image from project related data
  useEffect(() => {
    if (projectRelatedData && projectRelatedData.image_url) {
      setProjectImage(projectRelatedData.image_url);
    }
  }, [projectRelatedData]);

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

      const response = await fetch('https://chikaai.net/api/fusedai/chat-with-document', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'token': token
        },
        body: JSON.stringify({
          project_id: projectId,
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

  // Image handling functions
  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB for images

    if (file.size > MAX_FILE_SIZE) {
      toast({
        variant: "destructive",
        title: "File Too Large",
        description: "Image file is too large. Maximum size is 10MB."
      });
      return;
    }

    // Check if file is an image
    if (!file.type.startsWith('image/')) {
      toast({
        variant: "destructive",
        title: "Invalid File Type",
        description: "Please select an image file (JPG, PNG, GIF, etc.)"
      });
      return;
    }

    setSelectedImageFile(file);
    toast({
      title: "Image Selected",
      description: `${file.name} selected. Click 'Save Image' to save it to the project.`
    });
  };

  const handleUploadImage = async () => {
    if (!selectedImageFile) return;

    try {
      setIsUploadingImage(true);

      const token = localStorage.getItem('token');
      if (!token) {
        toast({
          variant: "destructive",
          title: "Authentication Error",
          description: "Authentication token not found. Please log in again."
        });
        return;
      }

      const formData = new FormData();
      formData.append('file', selectedImageFile);
      formData.append('project_id', projectId.toString());

      const response = await fetch('https://chikaai.net/api/fusedai/project-image', {
        method: 'POST',
        headers: {
          'token': token
        },
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        // Update the project image with the returned URL from the API
        if (data.image_url) {
          setProjectImage(data.image_url);
        }
        setSelectedImageFile(null);
        
        toast({
          title: "Success",
          description: "Project image saved successfully!"
        });
      } else {
        throw new Error(data.message || 'Failed to save project image');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        variant: "destructive",
        title: "Upload Error",
        description: "Failed to upload image. Please try again."
      });
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSaveImage = async () => {
    if (!selectedImageFile) {
      toast({
        variant: "destructive",
        title: "No Image Selected",
        description: "Please select an image file first."
      });
      return;
    }

    try {
      setIsUploadingImage(true);

      const token = localStorage.getItem('token');
      if (!token) {
        toast({
          variant: "destructive",
          title: "Authentication Error",
          description: "Authentication token not found. Please log in again."
        });
        return;
      }

      const formData = new FormData();
      formData.append('file', selectedImageFile);
      formData.append('project_id', projectId.toString());

      const response = await fetch('https://chikaai.net/api/fusedai/project-image', {
        method: 'POST',
        headers: {
          'token': token
        },
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        // Update the project image with the returned URL from the API
        if (data.image_url) {
          setProjectImage(data.image_url);
        }
        setSelectedImageFile(null);
        
        toast({
          title: "Success",
          description: "Project image saved successfully!"
        });
      } else {
        throw new Error(data.message || 'Failed to save project image');
      }
    } catch (error) {
      console.error('Error saving image:', error);
      toast({
        variant: "destructive",
        title: "Save Error",
        description: "Failed to save project image. Please try again."
      });
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleRemoveImage = () => {
    setProjectImage(null);
    setSelectedImageFile(null);
    toast({
      title: "Image Removed",
      description: "Project image has been removed."
    });
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

  const handleClearChat = async () => {
    if (!projectId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Project ID not found"
      });
      return;
    }

    try {
      setIsClearingChat(true);

      const token = localStorage.getItem('token');
      if (!token) {
        toast({
          variant: "destructive",
          title: "Authentication Error",
          description: "Authentication token not found. Please log in again."
        });
        return;
      }

      const response = await fetch('https://chikaai.net/api/fusedai/delete-project-chat-history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'token': token
        },
        body: JSON.stringify({
          project_id: parseInt(projectId)
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Clear local messages and add default welcome message
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
        
        toast({
          title: "Success",
          description: "Chat history cleared successfully"
        });
      } else {
        throw new Error(data.message || 'Failed to clear chat history');
      }
    } catch (error) {
      console.error('Error clearing chat history:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to clear chat history'
      });
    } finally {
      setIsClearingChat(false);
    }
  };

  // AI Estimation Functions
  const handleAddLaborType = async () => {
    if (!newLaborType.name || newLaborType.rate <= 0) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please fill in the labor type name and hourly rate."
      });
      return;
    }

    try {
      setIsCreatingLabor(true);
      
      const token = localStorage.getItem('token');
      if (!token) {
        toast({
          variant: "destructive",
          title: "Authentication Error",
          description: "Authentication token not found. Please log in again."
        });
        return;
      }

      const response = await fetch('https://chikaai.net/api/fusedai/create-labor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'token': token
        },
        body: JSON.stringify({
          labor_name: newLaborType.name,
          project_id: parseInt(projectId),
          user_id: 1, // You might want to get this from user context or session
          hourly_rate: newLaborType.rate,
          labor_hours_adjustment: newLaborType.hoursAdjustment || ''
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Transform the response to match our LaborType interface
        const createdLabor: LaborType = {
          id: data.labor.labor_id,
          name: data.labor.labor_name,
          rate: data.labor.hourly_rate,
          hoursAdjustment: data.labor.labor_hours_adjustment
        };

        setLaborTypes(prev => [...prev, createdLabor]);
        setNewLaborType({ name: '', rate: 0, hoursAdjustment: '' });
        
        toast({
          title: "Success",
          description: "Labor type added successfully"
        });

        // Refresh labor data from backend
        const fetchLabors = async () => {
          try {
            const laborResponse = await fetch('https://chikaai.net/api/fusedai/get-all-labors', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'token': token
              }
            });

            const laborData = await laborResponse.json();
            
            if (laborResponse.ok) {
              if (laborData.labors && laborData.labors.length > 0) {
                const transformedLabors: LaborType[] = laborData.labors.map((labor: BackendLabor) => ({
                  id: labor.labor_id,
                  name: labor.labor_name,
                  rate: labor.hourly_rate,
                  hoursAdjustment: labor.labor_hours_adjustment
                }));
                setLaborTypes(transformedLabors);
              } else {
                setLaborTypes([]);
              }
            }
          } catch (err) {
            console.error('Error refreshing labor data:', err);
          }
        };

        fetchLabors();
      } else {
        throw new Error(data.message || 'Failed to create labor type');
      }
    } catch (error) {
      console.error('Error creating labor type:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to create labor type'
      });
    } finally {
      setIsCreatingLabor(false);
    }
  };

  const handleDeleteLaborType = async (id: string) => {
    try {
      setDeletingLaborId(id);

      const token = localStorage.getItem('token');
      if (!token) {
        toast({
          variant: "destructive",
          title: "Authentication Error",
          description: "Authentication token not found. Please log in again."
        });
        return;
      }

      const response = await fetch('https://chikaai.net/api/fusedai/delete-labor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'token': token
        },
        body: JSON.stringify({
          labor_id: id
        })
      });

      const data = await response.json();

      if (response.ok) {
        setLaborTypes(prev => prev.filter(lt => lt.id !== id));
        toast({
          title: "Success",
          description: "Labor type removed successfully"
        });
      } else {
        throw new Error(data.message || 'Failed to delete labor type');
      }
    } catch (error) {
      console.error('Error deleting labor type:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to delete labor type'
      });
    } finally {
      setDeletingLaborId(null);
    }
  };

  const handleSavePricingConfig = () => {
    toast({
      title: "Success",
      description: "Pricing configuration saved successfully"
    });
  };

  const generateAIEstimation = async () => {
    setIsGeneratingEstimation(true);
    
    try {
      // Simulate AI estimation generation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const results: EstimationResults = {
        bestCasePrice: 87401.94,
        worstCasePrice: 103948.09,
        materialsMin: 35686.60,
        materialsMax: 41039.59,
        marginApplied: 35,
        confidence: 85,
        laborBreakdown: {
          technician: {
            rate: 95,
            hours: { min: 56, max: 87 },
            cost: { min: 5560, max: 8515 }
          },
          programmingEngineer: {
            rate: 130,
            hours: { min: 120, max: 180 },
            cost: { min: 15600, max: 23400 }
          }
        },
        materialsBreakdown: {
          totalCost: { min: 35686.60, max: 41039.59 },
          categories: [
            {
              name: 'Test',
              description: 'Test components from BOM',
              cost: 1.00,
              customer: 1.00
            },
            {
              name: 'Hardware',
              description: 'Hardware components from BOM',
              cost: 200.00,
              customer: 307.69
            }
          ]
        },
        aiReasoning: "BOM-first estimation using actual BOM data with confidence-based contingency. Materials: $35686.60-$41039.59 (from 22 BOM items + 15% contingency based on 85% confidence). Labor: Labor analysis for installing the 22 BOM items listed above considers the complexity of a multi-door access control system, the need for specialized programming and installation skills, and coordination with other trades."
      };
      
      setEstimationResults(results);
      toast({
        title: "Success",
        description: "AI estimation generated successfully"
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate AI estimation. Please try again."
      });
    } finally {
      setIsGeneratingEstimation(false);
    }
  };

  const handleAddToQuote = (laborType: LaborType) => {
    try {
      // Get existing quote labor types from session storage
      const existingQuoteLabors = sessionStorage.getItem('quoteLaborTypes');
      let quoteLabors: LaborType[] = [];
      
      if (existingQuoteLabors) {
        quoteLabors = JSON.parse(existingQuoteLabors);
      }
      
      // Check if labor type is already in quote
      const isAlreadyInQuote = quoteLabors.some(lt => lt.id === laborType.id);
      
      if (isAlreadyInQuote) {
        toast({
          variant: "destructive",
          title: "Already Added",
          description: "This labor type is already added to the quote"
        });
        return;
      }
      
      // Add labor type to quote
      quoteLabors.push(laborType);
      sessionStorage.setItem('quoteLaborTypes', JSON.stringify(quoteLabors));
      
      // Update the state to reflect the addition
      setAddedToQuoteLabors(prev => new Set([...prev, laborType.id]));
      
      toast({
        title: "Success",
        description: `${laborType.name} added to quote`
      });
    } catch (error) {
      console.error('Error adding labor type to quote:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add labor type to quote"
      });
    }
  };

  const handleAddCustomItem = () => {
    try {
      // Validate required fields
      if (!newCustomItem.description || (newCustomItem.quantity || 0) <= 0 || (newCustomItem.unitPrice || 0) <= 0) {
        toast({
          variant: "destructive",
          title: "Missing Information",
          description: "Please fill in all required fields with valid values."
        });
        return;
      }

      // Create new custom item with calculated total price
      const customItem: CustomItem = {
        id: Date.now().toString(),
        description: newCustomItem.description,
        quantity: newCustomItem.quantity || 1,
        unitPrice: newCustomItem.unitPrice || 0,
        category: newCustomItem.category || 'materials',
        totalPrice: (newCustomItem.quantity || 1) * (newCustomItem.unitPrice || 0)
      };

      // Add to local state
      setCustomItems(prev => [...prev, customItem]);

      // Store in session storage
      const existingCustomItems = sessionStorage.getItem('quoteCustomItems');
      let allCustomItems: CustomItem[] = [];
      
      if (existingCustomItems) {
        allCustomItems = JSON.parse(existingCustomItems);
      }
      
      allCustomItems.push(customItem);
      sessionStorage.setItem('quoteCustomItems', JSON.stringify(allCustomItems));

      // Reset form
      setNewCustomItem({
        description: '',
        quantity: 1,
        unitPrice: 0,
        category: 'materials'
      });

      toast({
        title: "Success",
        description: "Custom item added to quote"
      });
    } catch (error) {
      console.error('Error adding custom item:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add custom item"
      });
    }
  };

  const handlePreviewAndGenerate = async () => {
    try {
      setIsGeneratingQuote(true);
      setShowMagicAnimation(true);
      setQuoteContent('');

      const token = localStorage.getItem('token');
      if (!token) {
        toast({
          variant: "destructive",
          title: "Authentication Error",
          description: "Authentication token not found. Please log in again."
        });
        return;
      }

      // Get labor data from session storage
      const laborData = sessionStorage.getItem('quoteLaborTypes');
      const laborTypes = laborData ? JSON.parse(laborData) : [];

      // Get custom items data from session storage
      const customItemsData = sessionStorage.getItem('quoteCustomItems');
      const customItems = customItemsData ? JSON.parse(customItemsData) : [];

      // Prepare customer data from project
      const customerData = {
        project_name: project.title,
        project_description: project.description,
        customer_name: project.company,
        contact_name: project.contact?.name || '',
        contact_email: project.contact?.email || '',
        contact_phone: project.contact?.phone || '',
        project_address: project.date || '' // Using date as placeholder since address isn't in the interface
      };

      const response = await fetch('https://chikaai.net/api/fusedai/preview-and-generate-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'token': token
        },
        body: JSON.stringify({
          project_id: projectId,
          labor_data: JSON.stringify(laborTypes),
          custom_data: JSON.stringify(customItems)
        })
      });

      const data = await response.json();

      if (response.ok) {
        setQuoteContent(data.quote_content);
        toast({
          title: "Success",
          description: "Quote generated successfully"
        });
      } else {
        throw new Error(data.message || 'Failed to generate quote');
      }
    } catch (error) {
      console.error('Error generating quote:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate quote. Please try again."
      });
    } finally {
      setIsGeneratingQuote(false);
      setShowMagicAnimation(false);
    }
  };

  const generatePDF = () => {
    try {
      // Get data from session storage
      const laborData = sessionStorage.getItem('quoteLaborTypes');
      const laborTypes = laborData ? JSON.parse(laborData) : [];
      
      const customItemsData = sessionStorage.getItem('quoteCustomItems');
      const customItems = customItemsData ? JSON.parse(customItemsData) : [];

      // Calculate totals
      const laborTotal = laborTypes.reduce((sum: number, labor: any) => sum + (labor.rate * 8), 0); // Assuming 8 hours per labor type
      const customItemsTotal = customItems.reduce((sum: number, item: any) => sum + item.totalPrice, 0);
      const grandTotal = laborTotal + customItemsTotal;

      // Create HTML content for PDF
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Quote - ${project.title}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 20px;
              color: #333;
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #333;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .company-name {
              font-size: 28px;
              font-weight: bold;
              color: #2563eb;
              margin-bottom: 5px;
            }
            .quote-title {
              font-size: 20px;
              color: #666;
              margin-bottom: 10px;
            }
            .project-info {
              display: flex;
              justify-content: space-between;
              margin-bottom: 30px;
            }
            .project-details, .customer-details {
              flex: 1;
            }
            .section-title {
              font-size: 18px;
              font-weight: bold;
              color: #2563eb;
              margin: 20px 0 10px 0;
              border-bottom: 1px solid #ddd;
              padding-bottom: 5px;
            }
            .item-row {
              display: flex;
              justify-content: space-between;
              padding: 8px 0;
              border-bottom: 1px solid #eee;
            }
            .item-description {
              flex: 2;
            }
            .item-details {
              flex: 1;
              text-align: right;
            }
            .total-section {
              margin-top: 30px;
              border-top: 2px solid #333;
              padding-top: 20px;
            }
            .total-row {
              display: flex;
              justify-content: space-between;
              font-weight: bold;
              padding: 5px 0;
            }
            .grand-total {
              font-size: 18px;
              color: #2563eb;
              border-top: 1px solid #333;
              padding-top: 10px;
            }
            .footer {
              margin-top: 50px;
              text-align: center;
              color: #666;
              font-size: 12px;
            }
            .date {
              color: #666;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company-name">FusedAI</div>
            <div class="quote-title">Professional Quote</div>
            <div class="date">Generated on: ${new Date().toLocaleDateString()}</div>
          </div>

          <div class="project-info">
            <div class="project-details">
              <h3>Project Details</h3>
              <p><strong>Project:</strong> ${project.title}</p>
              <p><strong>Description:</strong> ${project.description || 'N/A'}</p>
              <p><strong>Status:</strong> ${project.status}</p>
            </div>
            <div class="customer-details">
              <h3>Customer Information</h3>
              <p><strong>Company:</strong> ${project.company || 'N/A'}</p>
              <p><strong>Contact:</strong> ${project.contact?.name || 'N/A'}</p>
              <p><strong>Email:</strong> ${project.contact?.email || 'N/A'}</p>
              <p><strong>Phone:</strong> ${project.contact?.phone || 'N/A'}</p>
            </div>
          </div>

          ${laborTypes.length > 0 ? `
            <div class="section-title">Labor Services</div>
            ${laborTypes.map((labor: any) => `
              <div class="item-row">
                <div class="item-description">
                  <strong>${labor.name}</strong><br>
                  <small>Rate: $${labor.rate}/hour</small>
                  ${labor.hoursAdjustment ? `<br><small>Hours Adjustment: ${labor.hoursAdjustment}%</small>` : ''}
                </div>
                <div class="item-details">
                  $${(labor.rate * 8).toFixed(2)}
                </div>
              </div>
            `).join('')}
          ` : ''}

          ${customItems.length > 0 ? `
            <div class="section-title">Custom Items</div>
            ${customItems.map((item: any) => `
              <div class="item-row">
                <div class="item-description">
                  <strong>${item.description}</strong><br>
                  <small>Category: ${item.category.charAt(0).toUpperCase() + item.category.slice(1)}</small><br>
                  <small>Quantity: ${item.quantity} × $${item.unitPrice.toFixed(2)}</small>
                </div>
                <div class="item-details">
                  $${item.totalPrice.toFixed(2)}
                </div>
              </div>
            `).join('')}
          ` : ''}

          <div class="total-section">
            ${laborTypes.length > 0 ? `
              <div class="total-row">
                <span>Labor Total:</span>
                <span>$${laborTotal.toFixed(2)}</span>
              </div>
            ` : ''}
            ${customItems.length > 0 ? `
              <div class="total-row">
                <span>Custom Items Total:</span>
                <span>$${customItemsTotal.toFixed(2)}</span>
              </div>
            ` : ''}
            <div class="total-row grand-total">
              <span>Grand Total:</span>
              <span>$${grandTotal.toFixed(2)}</span>
            </div>
          </div>

          <div class="footer">
            <p>Thank you for choosing FusedAI for your project needs.</p>
            <p>This quote is valid for 30 days from the date of generation.</p>
          </div>
        </body>
        </html>
      `;

      // Create blob and download
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      
      // Use html2pdf library if available, otherwise fallback to print
      if (typeof window.html2pdf !== 'undefined') {
        window.html2pdf().from(htmlContent).save(`quote-${project.title}-${new Date().toISOString().split('T')[0]}.pdf`);
      } else {
        // Fallback: open in new window for printing
        const printWindow = window.open(url, '_blank');
        if (printWindow) {
          printWindow.document.write(htmlContent);
          printWindow.document.close();
          printWindow.print();
        }
      }
      
      URL.revokeObjectURL(url);
      toast({
        title: "Success",
        description: "PDF generated successfully"
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate PDF. Please try again."
      });
    }
  };

  const generatePdfFromApiContent = () => {
    try {
      if (!quoteContent) {
        toast({
          variant: "destructive",
          title: "No Content",
          description: "Please generate a quote first"
        });
        return;
      }

      // Get data from session storage for additional context
      const laborData = sessionStorage.getItem('quoteLaborTypes');
      const laborTypes = laborData ? JSON.parse(laborData) : [];
      
      const customItemsData = sessionStorage.getItem('quoteCustomItems');
      const customItems = customItemsData ? JSON.parse(customItemsData) : [];

      // Create HTML content that includes API content
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Quote - ${project.title}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 20px;
              color: #333;
              line-height: 1.6;
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #333;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .company-name {
              font-size: 28px;
              font-weight: bold;
              color: #2563eb;
              margin-bottom: 5px;
            }
            .quote-title {
              font-size: 20px;
              color: #666;
              margin-bottom: 10px;
            }
            .project-info {
              display: flex;
              justify-content: space-between;
              margin-bottom: 30px;
            }
            .project-details, .customer-details {
              flex: 1;
            }
            .api-content {
              background-color: #f8f9fa;
              border: 1px solid #dee2e6;
              border-radius: 8px;
              padding: 20px;
              margin: 20px 0;
              white-space: pre-wrap;
              font-family: 'Courier New', monospace;
              font-size: 12px;
              line-height: 1.4;
              max-height: 400px;
              overflow-y: auto;
            }
            .summary-section {
              margin-top: 30px;
              border-top: 2px solid #333;
              padding-top: 20px;
            }
            .summary-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
              gap: 20px;
              margin-top: 20px;
            }
            .summary-card {
              background-color: #f8f9fa;
              border: 1px solid #dee2e6;
              border-radius: 8px;
              padding: 15px;
              text-align: center;
            }
            .summary-number {
              font-size: 24px;
              font-weight: bold;
              color: #2563eb;
              margin-bottom: 5px;
            }
            .summary-label {
              font-size: 14px;
              color: #666;
            }
            .footer {
              margin-top: 50px;
              text-align: center;
              color: #666;
              font-size: 12px;
            }
            .date {
              color: #666;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company-name">FusedAI</div>
            <div class="quote-title">Generated Quote Report</div>
            <div class="date">Generated on: ${new Date().toLocaleDateString()}</div>
          </div>

          <div class="project-info">
            <div class="project-details">
              <h3>Project Details</h3>
              <p><strong>Project:</strong> ${project.title}</p>
              <p><strong>Description:</strong> ${project.description || 'N/A'}</p>
              <p><strong>Status:</strong> ${project.status}</p>
            </div>
            <div class="customer-details">
              <h3>Customer Information</h3>
              <p><strong>Company:</strong> ${project.company || 'N/A'}</p>
              <p><strong>Contact:</strong> ${project.contact?.name || 'N/A'}</p>
              <p><strong>Email:</strong> ${project.contact?.email || 'N/A'}</p>
              <p><strong>Phone:</strong> ${project.contact?.phone || 'N/A'}</p>
            </div>
          </div>

          <h3>Generated Quote Content</h3>
          <div class="api-content">${quoteContent}</div>

          <div class="summary-section">
            <h3>Quote Summary</h3>
            <div class="summary-grid">
              <div class="summary-card">
                <div class="summary-number">${laborTypes.length}</div>
                <div class="summary-label">Labor Types</div>
              </div>
              <div class="summary-card">
                <div class="summary-number">${customItems.length}</div>
                <div class="summary-label">Custom Items</div>
              </div>
              <div class="summary-card">
                <div class="summary-number">${project.title.length > 20 ? project.title.substring(0, 20) + '...' : project.title}</div>
                <div class="summary-label">Project</div>
              </div>
            </div>
          </div>

          <div class="footer">
            <p>Thank you for choosing FusedAI for your project needs.</p>
            <p>This quote is valid for 30 days from the date of generation.</p>
          </div>
        </body>
        </html>
      `;

      // Generate PDF using html2pdf
      if (typeof window.html2pdf !== 'undefined') {
        const opt = {
          margin: 1,
          filename: `quote-${project.title}-${new Date().toISOString().split('T')[0]}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2 },
          jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
        };

        window.html2pdf().set(opt).from(htmlContent).save().then(() => {
          toast({
            title: "Success",
            description: "PDF generated successfully"
          });
        });
      } else {
        // Fallback: create blob and download
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `quote-${project.title}-${new Date().toISOString().split('T')[0]}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        toast({
          title: "Success",
          description: "HTML file downloaded (PDF generation not available)"
        });
      }
    } catch (error) {
      console.error('Error generating PDF from API content:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate PDF. Please try again."
      });
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex">
      {/* Sidebar - Static (Fixed Position) */}
      <div 
        className="w-48 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 border-r border-gray-700 dark:border-gray-600 flex-shrink-0 fixed left-0 top-0 h-screen z-40 shadow-2xl"
      >
        {/* Project Header */}
        <div className="border-b border-gray-700 dark:border-gray-600">
          <div className="px-2 pt-3">
            <Link 
              href="/projects"
              className="inline-flex p-1.5 text-gray-400 hover:text-white transition-colors rounded-md hover:bg-gray-700/50"
              title="Back to Projects"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="px-2 pb-3 pt-2">
            <div className="flex items-center justify-between mb-3">
              <h1 className="text-xs font-bold text-white">
                {project.title}
              </h1>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                {project.status}
              </span>
            </div>
            
            <Link 
              href={`/projects/${projectId}/edit`}
              className="w-full flex items-center justify-center space-x-1 text-xs text-gray-400 hover:text-white transition-colors py-1.5 rounded-lg hover:bg-gray-700/50"
            >
              <Edit3 className="w-3 h-3" />
              <span>Edit Project</span>
            </Link>
          </div>
        </div>

        {/* Project Sections */}
        <div className="pt-2">
          <div className="px-2 mb-3">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <div className="w-3 h-3 bg-white rounded-sm"></div>
              </div>
              <h2 className="text-xs uppercase tracking-wider font-bold text-gray-300">
                Sections
              </h2>
            </div>
          </div>
          
          <div className="px-2 space-y-1">
            {sidebarSections.map((section) => {
              const Icon = section.icon;
              const isActive = section.name === activeSection;
              
              return (
                <button
                  key={section.name}
                  onClick={() => setActiveSection(section.name)}
                  className={`w-full flex items-center space-x-2 px-2 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 shadow-md text-white'
                      : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{section.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-gray-700 dark:border-gray-600">
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 bg-gradient-to-r from-green-500 to-blue-500 rounded-full"></div>
            <span className="text-xs text-gray-400">FusedAI</span>
          </div>
        </div>
      </div>

      {/* Magic Animation Overlay */}
      {showMagicAnimation && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center">
          <div className="bg-gradient-to-br from-white via-gray-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 rounded-3xl p-12 shadow-2xl border border-gray-200 dark:border-gray-700 max-w-md w-full mx-4">
            <div className="flex flex-col items-center space-y-8">
              {/* Animated Logo */}
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-r from-blue-500 via-purple-600 to-indigo-600 rounded-3xl flex items-center justify-center shadow-2xl">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl"></div>
                  </div>
                </div>
                {/* Pulsing ring effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-600 to-indigo-600 rounded-3xl animate-ping opacity-20"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-600 to-indigo-600 rounded-3xl animate-pulse opacity-10"></div>
              </div>
              
              {/* Magic Text */}
              <div className="text-center space-y-4">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  FusedAI is doing its magic
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Crafting your perfect quote report...
                </p>
              </div>
              
              {/* Animated Progress */}
              <div className="w-full space-y-3">
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                  <span>Analyzing project data...</span>
                  <span className="animate-pulse">✓</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                  <span>Processing BOM items...</span>
                  <span className="animate-pulse">✓</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                  <span>Calculating costs...</span>
                  <span className="animate-pulse">✓</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                  <span>Generating report...</span>
                  <span className="animate-spin">⟳</span>
                </div>
              </div>
              
              {/* Loading Animation */}
              <div className="flex space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"></div>
                <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce [animation-delay:150ms]"></div>
                <div className="w-3 h-3 bg-indigo-500 rounded-full animate-bounce [animation-delay:300ms]"></div>
              </div>
              
              {/* Progress Bar */}
              <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-500 via-purple-600 to-indigo-600 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content - With Left Margin for Fixed Sidebar */}
      <div className="flex-1 flex flex-col ml-48">
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
            <div className="flex items-center space-x-3">
              {activeSection === 'Project Chat' && (
                <button
                  onClick={handleClearChat}
                  disabled={isClearingChat}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg transition-colors text-sm font-medium"
                >
                  {isClearingChat ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Clearing...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>Clear Chat</span>
                    </>
                  )}
                </button>
              )}
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
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="max-w-4xl mx-auto">
                <div className="relative flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-2">
                  {/* Message Input */}
                  <div className="flex-1 mx-2">
                    <textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={handleKeyPress}
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
                    onClick={handleSendMessage}
                    disabled={!input.trim() || isLoading}
                    className="p-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-300 dark:hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : activeSection === 'Quotes' ? (
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="max-w-6xl mx-auto space-y-6 w-full">
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
                    Customer and contact information is automatically populated from the project's linked customer and contact records. These fields are locked and cannot be edited. If you want to edit them, you can do so by clicking the "Edit Project" button above.
                  </p>
                </div>
              </div>

              {/* Tab Content */}
              {activeQuoteTab === 'Customer Setup' && (
                <>
                  {/* Customer Information */}
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                    <div className="p-6">
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Customer Information</h2>
                      
                      {isLoadingProjectData ? (
                        <div className="flex justify-center items-center py-8">
                          <div className="flex flex-col items-center space-y-4">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black dark:border-white"></div>
                            <p className="text-gray-500 dark:text-gray-400">Loading project data...</p>
                          </div>
                        </div>
                      ) : projectDataError ? (
                        <div className="text-center py-8">
                          <p className="text-red-500 dark:text-red-400">{projectDataError}</p>
                          <button
                            onClick={() => setProjectRelatedData(null)}
                            className="mt-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors text-sm"
                          >
                            Retry
                          </button>
                        </div>
                      ) : projectRelatedData ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Company Name</label>
                          <input
                            type="text"
                            defaultValue={projectRelatedData.company_name}
                            readOnly
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 cursor-not-allowed"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Project Name</label>
                          <input
                            type="text"
                            defaultValue={projectRelatedData.project_name}
                            readOnly
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 cursor-not-allowed"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Contact Name</label>
                          <input
                            type="text"
                            defaultValue={projectRelatedData.contact_name}
                            readOnly
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 cursor-not-allowed"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
                          <input
                            type="email"
                            defaultValue={projectRelatedData.email}
                            readOnly
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 cursor-not-allowed"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Phone</label>
                          <input
                            type="tel"
                            defaultValue={projectRelatedData.phone}
                            readOnly
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 cursor-not-allowed"
                          />
                        </div>
                          </div>
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-gray-500 dark:text-gray-400">No project data available</p>
                          </div>
                      )}
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
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Project Image</label>
                          
                          {isLoadingProjectData ? (
                            <div className="flex justify-center items-center py-8">
                              <div className="flex flex-col items-center space-y-4">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black dark:border-white"></div>
                                <p className="text-gray-500 dark:text-gray-400">Loading project data...</p>
                              </div>
                            </div>
                          ) : imageError ? (
                            <div className="text-center py-8">
                              <p className="text-red-500 dark:text-red-400">{imageError}</p>
                            </div>
                          ) : projectImage ? (
                            <div className="space-y-4">
                              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-900">
                                <img 
                                  src={projectImage} 
                                  alt="Project Image"
                                  className="max-w-full h-auto max-h-64 mx-auto"
                                  onError={() => {
                                    setImageError('Failed to load image');
                                    setProjectImage(null);
                                  }}
                            />
                          </div>
                                               <div className="flex space-x-3">
                             <button
                               onClick={() => imageInputRef.current?.click()}
                               className="flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm"
                             >
                               <Image className="w-4 h-4" />
                               <span>Replace Image</span>
                             </button>
                           </div>
                                </div>
                          ) : selectedImageFile ? (
                            <div className="space-y-4">
                              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-900">
                                <img 
                                  src={URL.createObjectURL(selectedImageFile)} 
                                  alt="Selected Image Preview"
                                  className="max-w-full h-auto max-h-64 mx-auto"
                                />
                    </div>
                                               <div className="flex space-x-3">
                             <button
                               onClick={handleUploadImage}
                               disabled={isUploadingImage}
                               className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                 isUploadingImage
                                   ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                                   : 'bg-green-600 hover:bg-green-700 text-white'
                               }`}
                             >
                               {isUploadingImage ? (
                                 <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                               ) : (
                                 <Save className="w-4 h-4" />
                               )}
                               <span>{isUploadingImage ? 'Saving...' : 'Save Image'}</span>
                             </button>
                             <button
                               onClick={() => {
                                 setSelectedImageFile(null);
                                 imageInputRef.current!.value = '';
                               }}
                               className="flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm"
                             >
                               <X className="w-4 h-4" />
                               <span>Cancel</span>
                             </button>
                           </div>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 bg-gray-50 dark:bg-gray-900 text-center">
                                <Image className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-500 dark:text-gray-400 mb-2">No project image uploaded</p>
                                <p className="text-sm text-gray-400 dark:text-gray-500">Upload an image to display in your quotes</p>
                              </div>
                              <button
                                onClick={() => imageInputRef.current?.click()}
                                className="flex items-center space-x-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors text-sm font-medium"
                              >
                                <Image className="w-4 h-4" />
                                <span>Attach Image</span>
                              </button>
                            </div>
                          )}
                          
                          <input
                            ref={imageInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleImageSelect}
                            className="hidden"
                            title="Select image file (max 10MB)"
                          />
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
                </>
              )}

              {activeQuoteTab === 'BOM Items' && (
                <div className="space-y-6">
                  {/* Header */}
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div>
                      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                        Bill of Materials for Quote
                      </h1>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Manage project materials and costs for this quote
                      </p>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2">

                      <button 
                        onClick={() => setIsAddItemModalOpen(true)}
                        className="flex items-center space-x-2 px-3 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors text-sm font-medium"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add Item</span>
                      </button>
                      <button 
                        onClick={handleDeleteAllBOMItems}
                        className="flex items-center space-x-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Delete All</span>
                      </button>
                    </div>
                  </div>

                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
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
                    
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
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
                    
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
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
                    
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                      <div className="flex items-center space-x-2">
                        <Package className="w-5 h-5 text-purple-500" />
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Categories</p>
                          <p className="text-xl font-semibold text-gray-900 dark:text-white">
                            {categories.length}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Tabs */}
                  <div className="flex space-x-3 border-b border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => setActiveBOMTab('BOM Items')}
                      className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                        activeBOMTab === 'BOM Items'
                          ? 'border-black dark:border-white text-black dark:text-white'
                          : 'border-transparent text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                      }`}
                    >
                      BOM Items
                    </button>
                    <button
                      onClick={() => setActiveBOMTab('Categories')}
                      className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
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
                    <div className="space-y-4">
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
                          <div className="overflow-x-auto max-w-full">
                            <table className="w-full min-w-[1200px]">
                              <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[200px]">
                                    Description
                                  </th>
                                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[150px]">
                                    Manufacturer / Category
                                  </th>
                                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[80px]">
                                    Qty
                                  </th>
                                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[80px]">
                                    Unit
                                  </th>
                                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[100px]">
                                    Cost Price
                                  </th>
                                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[100px]">
                                    Pricing
                                  </th>
                                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[100px]">
                                    Sell Price
                                  </th>
                                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[100px]">
                                    Total Cost
                                  </th>
                                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[100px]">
                                    Total Sell
                                  </th>
                                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[80px]">
                                    Actions
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {bomItems
                                  .filter(item => item.category === category.name)
                                  .map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                      <td className="px-3 py-4 text-sm text-gray-900 dark:text-white">
                                        <div className="max-w-[200px] truncate" title={item.description}>
                                          {item.description}
                                        </div>
                                      </td>
                                      <td className="px-3 py-4">
                                        <div className="max-w-[150px]">
                                          <div className="text-sm text-gray-900 dark:text-white truncate" title={item.manufacturer || 'N/A'}>
                                            {item.manufacturer || 'N/A'}
                                          </div>
                                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate" title={item.category}>
                                            {item.category}
                                          </div>
                                        </div>
                                      </td>
                                      <td className="px-3 py-4 text-sm text-gray-900 dark:text-white">
                                        {item.quantity.toFixed(3)}
                                      </td>
                                      <td className="px-3 py-4 text-sm text-gray-900 dark:text-white">
                                        {item.unit}
                                      </td>
                                      <td className="px-3 py-4 text-sm text-gray-900 dark:text-white">
                                        {formatCurrency(item.unitPrice)}
                                      </td>
                                      <td className="px-3 py-4 text-sm text-gray-900 dark:text-white">
                                        Margin {item.margin}%
                                      </td>
                                      <td className="px-3 py-4 text-sm text-gray-900 dark:text-white">
                                        {formatCurrency(item.totalSell / item.quantity)}
                                      </td>
                                      <td className="px-3 py-4 text-sm text-gray-900 dark:text-white">
                                        {formatCurrency(item.totalCost)}
                                      </td>
                                      <td className="px-3 py-4 text-sm text-gray-900 dark:text-white">
                                        {formatCurrency(item.totalSell)}
                                      </td>
                                      <td className="px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
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
                        
                        <div className="overflow-x-auto max-w-full">
                          <table className="w-full min-w-[600px]">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                              <tr>
                                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[200px]">
                                  Category
                                </th>
                                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[100px]">
                                  Items
                                </th>
                                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[120px]">
                                  Total Cost
                                </th>
                                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[100px]">
                                  % of Total
                                </th>
                                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[80px]">
                                  Actions
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                              {categories.map((category) => {
                                // Calculate stats for this category
                                const itemsInCategory = bomItems.filter(item => item.category === category.category_name);
                                const totalCost = itemsInCategory.reduce((sum, item) => sum + item.totalCost, 0);
                                const totalBOMCost = bomItems.reduce((sum, item) => sum + item.totalCost, 0);
                                const percentageOfTotal = totalBOMCost > 0 ? (totalCost / totalBOMCost) * 100 : 0;
                                
                                return (
                                  <tr key={category.category_id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                    <td className="px-3 py-4 text-sm font-medium text-gray-900 dark:text-white">
                                      <div className="max-w-[200px] truncate" title={category.category_name}>
                                        {category.category_name}
                                      </div>
                                    </td>
                                    <td className="px-3 py-4 text-sm text-gray-900 dark:text-white">
                                      {itemsInCategory.length} item{itemsInCategory.length !== 1 ? 's' : ''}
                                    </td>
                                    <td className="px-3 py-4 text-sm text-gray-900 dark:text-white">
                                      {formatCurrency(totalCost)}
                                    </td>
                                    <td className="px-3 py-4 text-sm text-gray-900 dark:text-white">
                                      {percentageOfTotal.toFixed(1)}%
                                    </td>
                                    <td className="px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                                      <button
                                        onClick={() => handleDeleteCategory(category.category_id)}
                                        className="text-red-600 hover:text-red-900 dark:hover:text-red-400"
                                        title="Delete category"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {categories.length === 0 && (
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
              )}

              {activeQuoteTab === 'Labor Types' && (
                <div className="space-y-6">
                  {/* Add Labor Type */}
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Add Labor Type
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Labor Type Name
                        </label>
                        <input
                          type="text"
                          value={newLaborType.name}
                          onChange={(e) => setNewLaborType(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="e.g., Senior Technician"
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-black focus:border-black dark:focus:ring-white dark:focus:border-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Hourly Rate ($)
                        </label>
                        <input
                          type="number"
                          value={newLaborType.rate}
                          onChange={(e) => setNewLaborType(prev => ({ ...prev, rate: parseFloat(e.target.value) || 0 }))}
                          min="0"
                          step="0.01"
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-black focus:border-black dark:focus:ring-white dark:focus:border-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Labor Hours Adjustment (%)
                        </label>
                        <input
                          type="text"
                          value={newLaborType.hoursAdjustment}
                          onChange={(e) => setNewLaborType(prev => ({ ...prev, hoursAdjustment: e.target.value }))}
                          placeholder="Enter % increase (e.g., 50 for 50% increase)"
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-black focus:border-black dark:focus:ring-white dark:focus:border-white"
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Leave blank for standard AI estimation
                        </p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <button
                        onClick={handleAddLaborType}
                        disabled={isCreatingLabor}
                        className={`px-4 py-2 rounded-lg transition-colors font-medium flex items-center space-x-2 ${
                          isCreatingLabor
                            ? 'bg-gray-400 dark:bg-gray-600 text-gray-200 dark:text-gray-400 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700 text-white dark:text-white'
                        }`}
                      >
                        {isCreatingLabor ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Creating...</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4" />
                            <span>+ Add Labor Type</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Configured Labor Types */}
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Configured Labor Types
                    </h3>
                    
                    {isLoadingLabors ? (
                      <div className="flex justify-center items-center py-8">
                        <div className="flex flex-col items-center space-y-4">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black dark:border-white"></div>
                          <p className="text-gray-500 dark:text-gray-400">Loading labor types...</p>
                        </div>
                      </div>
                    ) : laborError ? (
                      <div className="text-center py-8">
                        <p className="text-red-500 dark:text-red-400 mb-4">{laborError}</p>
                        <button
                          onClick={() => {
                            setIsLoadingLabors(true);
                            setLaborError(null);
                            // Re-fetch labors
                            const fetchLabors = async () => {
                              try {
                                const token = localStorage.getItem('token');
                                if (!token) {
                                  setLaborError('Authentication token not found');
                                  setIsLoadingLabors(false);
                                  return;
                                }

                                const response = await fetch('https://chikaai.net/api/fusedai/get-all-labors', {
                                  method: 'POST',
                                  headers: {
                                    'Content-Type': 'application/json',
                                    'token': token
                                  }
                                });

                                const data = await response.json();
                                
                                if (response.ok) {
                                  if (data.labors && data.labors.length > 0) {
                                    const transformedLabors: LaborType[] = data.labors.map((labor: BackendLabor) => ({
                                      id: labor.labor_id,
                                      name: labor.labor_name,
                                      rate: labor.hourly_rate,
                                      hoursAdjustment: labor.labor_hours_adjustment
                                    }));
                                    setLaborTypes(transformedLabors);
                                  } else {
                                    setLaborTypes([]);
                                  }
                                  setLaborError(null);
                                } else {
                                  setLaborError(data.message || 'Failed to fetch labors');
                                }
                              } catch (err) {
                                setLaborError('Failed to fetch labors. Please try again later.');
                              } finally {
                                setIsLoadingLabors(false);
                              }
                            };
                            fetchLabors();
                          }}
                          className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors text-sm"
                        >
                          Retry
                        </button>
                      </div>
                    ) : laborTypes.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Users className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                          No labor types configured
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-4">
                          Add your first labor type to get started with quote generation.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {laborTypes.map((laborType) => (
                          <div key={laborType.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                            <div>
                              <h4 className="font-medium text-gray-900 dark:text-white">{laborType.name}</h4>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {formatCurrency(laborType.rate)}/hour
                              </p>
                              {laborType.hoursAdjustment && laborType.hoursAdjustment !== '' && (
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  Labor hours: {laborType.hoursAdjustment}% increase
                                </p>
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              <button 
                                onClick={() => handleAddToQuote(laborType)}
                                disabled={addedToQuoteLabors.has(laborType.id)}
                                className={`px-3 py-1.5 rounded-md transition-colors text-xs font-medium ${
                                  addedToQuoteLabors.has(laborType.id)
                                    ? 'bg-gray-400 text-white cursor-not-allowed'
                                    : 'bg-green-600 hover:bg-green-700 text-white'
                                }`}
                              >
                                {addedToQuoteLabors.has(laborType.id) ? 'Added' : 'Add to Quote'}
                              </button>
                              <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleDeleteLaborType(laborType.id)}
                                disabled={deletingLaborId === laborType.id}
                                className={`p-2 transition-colors ${
                                  deletingLaborId === laborType.id
                                    ? 'text-gray-400 cursor-not-allowed'
                                    : 'text-gray-400 hover:text-red-600 dark:hover:text-red-400'
                                }`}
                              >
                                {deletingLaborId === laborType.id ? (
                                  <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <Trash2 className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeQuoteTab === 'Custom Items' && (
                <div className="space-y-6">
                  {/* Add Custom Item Form */}
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Add Custom Item
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="lg:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Description
                        </label>
                        <input
                          type="text"
                          value={newCustomItem.description}
                          onChange={(e) => setNewCustomItem(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Enter item description"
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-black focus:border-black dark:focus:ring-white dark:focus:border-white"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Quantity
                        </label>
                        <input
                          type="number"
                          value={newCustomItem.quantity}
                          onChange={(e) => setNewCustomItem(prev => ({ ...prev, quantity: parseFloat(e.target.value) || 1 }))}
                          min="0.01"
                          step="0.01"
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-black focus:border-black dark:focus:ring-white dark:focus:border-white"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Unit Price ($)
                        </label>
                        <input
                          type="number"
                          value={newCustomItem.unitPrice}
                          onChange={(e) => setNewCustomItem(prev => ({ ...prev, unitPrice: parseFloat(e.target.value) || 0 }))}
                          min="0"
                          step="0.01"
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-black focus:border-black dark:focus:ring-white dark:focus:border-white"
                        />
                      </div>
                      
                      <div className="lg:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Category
                        </label>
                        <Select 
                          value={newCustomItem.category} 
                          onValueChange={(value: 'materials' | 'labor' | 'shipping') => setNewCustomItem(prev => ({ ...prev, category: value }))}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="materials">Materials</SelectItem>
                            <SelectItem value="labor">Labor</SelectItem>
                            <SelectItem value="shipping">Shipping</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <button
                        onClick={handleAddCustomItem}
                        className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors font-medium"
                      >
                        Add Custom Item
                      </button>
                    </div>
                  </div>

                  {/* Custom Items List */}
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Custom Items ({customItems.length})
                    </h3>
                    
                    {customItems.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Plus className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                          No custom items added
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400">
                          Add your first custom item to get started with quote generation.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {customItems.map((item) => (
                          <div key={item.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900 dark:text-white">{item.description}</h4>
                              <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400 mt-1">
                                <span>Qty: {item.quantity}</span>
                                <span>Price: {formatCurrency(item.unitPrice)}</span>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  item.category === 'materials' 
                                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                                    : item.category === 'labor'
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                                    : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
                                }`}>
                                  {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center space-x-4">
                              <span className="font-semibold text-gray-900 dark:text-white">
                                {formatCurrency(item.totalPrice)}
                              </span>
                              <button 
                                onClick={() => {
                                  const updatedItems = customItems.filter(i => i.id !== item.id);
                                  setCustomItems(updatedItems);
                                  sessionStorage.setItem('quoteCustomItems', JSON.stringify(updatedItems));
                                  toast({
                                    title: "Success",
                                    description: "Custom item removed"
                                  });
                                }}
                                className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeQuoteTab === 'Preview & Generate' && (
                <div className="space-y-6">
                  {/* Generate Quote Button */}
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Generate Quote Report
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                      Generate a comprehensive quote report including all selected labor types, custom items, and project details.
                    </p>
                    
                    <button
                      onClick={handlePreviewAndGenerate}
                      disabled={isGeneratingQuote}
                      className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
                        isGeneratingQuote
                          ? 'bg-gray-400 text-white cursor-not-allowed'
                          : 'bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200'
                      }`}
                    >
                      {isGeneratingQuote ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Generating Quote...</span>
                        </>
                      ) : (
                        <>
                          <FileText className="w-5 h-5" />
                          <span>Preview & Generate</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Quote Content Display */}
                  {quoteContent && (
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Generated Quote Report
                      </h3>
                      
                      {/* PDF Preview - Shown by default */}
                      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 max-h-96 overflow-y-auto">
                        <div className="bg-white p-6 rounded-lg shadow-sm">
                          <div className="text-center border-b-2 border-gray-300 pb-4 mb-6">
                            <div className="text-2xl font-bold text-blue-600 mb-1">FusedAI</div>
                            <div className="text-lg text-gray-600 mb-2">Generated Quote Report</div>
                            <div className="text-sm text-gray-500">Generated on: {new Date().toLocaleDateString()}</div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div>
                              <h4 className="font-semibold text-gray-900 mb-2">Project Details</h4>
                              <p className="text-sm text-gray-600"><strong>Project:</strong> {project.title}</p>
                              <p className="text-sm text-gray-600"><strong>Description:</strong> {project.description || 'N/A'}</p>
                              <p className="text-sm text-gray-600"><strong>Status:</strong> {project.status}</p>
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900 mb-2">Customer Information</h4>
                              <p className="text-sm text-gray-600"><strong>Company:</strong> {project.company || 'N/A'}</p>
                              <p className="text-sm text-gray-600"><strong>Contact:</strong> {project.contact?.name || 'N/A'}</p>
                              <p className="text-sm text-gray-600"><strong>Email:</strong> {project.contact?.email || 'N/A'}</p>
                              <p className="text-sm text-gray-600"><strong>Phone:</strong> {project.contact?.phone || 'N/A'}</p>
                            </div>
                          </div>

                          <div className="mb-6">
                            <h4 className="font-semibold text-gray-900 mb-3">Generated Quote Content</h4>
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                              <pre className="whitespace-pre-wrap text-xs text-gray-800 font-mono leading-relaxed">
                                {quoteContent}
                              </pre>
                            </div>
                          </div>

                          <div className="border-t-2 border-gray-300 pt-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="text-center">
                                <div className="text-xl font-bold text-blue-600">
                                  {(() => {
                                    try {
                                      const laborData = sessionStorage.getItem('quoteLaborTypes');
                                      return laborData ? JSON.parse(laborData).length : 0;
                                    } catch {
                                      return 0;
                                    }
                                  })()}
                                </div>
                                <div className="text-sm text-gray-600">Labor Types</div>
                              </div>
                              <div className="text-center">
                                <div className="text-xl font-bold text-green-600">
                                  {(() => {
                                    try {
                                      const customData = sessionStorage.getItem('quoteCustomItems');
                                      return customData ? JSON.parse(customData).length : 0;
                                    } catch {
                                      return 0;
                                    }
                                  })()}
                                </div>
                                <div className="text-sm text-gray-600">Custom Items</div>
                              </div>
                              <div className="text-center">
                                <div className="text-lg font-semibold text-gray-900">
                                  {project.title.length > 15 ? project.title.substring(0, 15) + '...' : project.title}
                                </div>
                                <div className="text-sm text-gray-600">Project</div>
                              </div>
                            </div>
                          </div>

                          <div className="text-center mt-6 text-sm text-gray-500">
                            <p>Thank you for choosing FusedAI for your project needs.</p>
                            <p>This quote is valid for 30 days from the date of generation.</p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-3">
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(quoteContent);
                            toast({
                              title: "Success",
                              description: "Quote content copied to clipboard"
                            });
                          }}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium flex items-center space-x-2"
                        >
                          <Copy className="w-4 h-4" />
                          <span>Copy to Clipboard</span>
                        </button>
                        <button
                          onClick={generatePDF}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium flex items-center space-x-2"
                        >
                          <Download className="w-4 h-4" />
                          <span>Download PDF</span>
                        </button>
                        <button
                          onClick={generatePdfFromApiContent}
                          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium flex items-center space-x-2"
                        >
                          <FileText className="w-4 h-4" />
                          <span>Download PDF with API Content</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
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
                    <p className="text-xs text-gray-500 dark:text-gray-400">Maximum file size: 5MB</p>
                  </div>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                    accept="*/*"
                    title="Select files (max 5MB each)"
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
             <div className="max-w-full mx-auto space-y-6">
               {/* Header */}
               <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                 <div>
                   <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                     Bill of Materials
                   </h1>
                   <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                     Manage project materials and costs
                   </p>
                 </div>
                 
                 {/* Action Buttons */}
                 <div className="flex flex-wrap items-center gap-3">
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
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                         {categories.length}
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
                 <div className="space-y-6 max-w-full">
                   {bomCategories.map((category) => (
                     <div key={category.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden max-w-full">
                       {/* Category Header */}
                       <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
                         <div className="flex items-center justify-between">
                           <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                             {category.name}
                           </h3>
                           <div className="flex items-center space-x-3 text-sm">
                             <span className="text-gray-600 dark:text-gray-400">
                               {category.itemCount} items
                             </span>
                             <div className="flex space-x-1">
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
                       <div className="overflow-x-auto w-full max-w-full">
                         <table className="w-full min-w-[700px] lg:min-w-[800px] xl:min-w-[900px]">
                           <thead className="bg-gray-50 dark:bg-gray-700">
                             <tr>
                               <th className="px-2 lg:px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[120px] lg:min-w-[140px]">
                                 Description
                               </th>
                               <th className="px-2 lg:px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[100px] lg:min-w-[120px]">
                                 Manufacturer / Category
                               </th>
                               <th className="px-2 lg:px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[50px]">
                                 Qty
                               </th>
                               <th className="px-2 lg:px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[50px]">
                                 Unit
                               </th>
                               <th className="px-2 lg:px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[70px] lg:min-w-[80px]">
                                 Cost Price
                               </th>
                               <th className="px-2 lg:px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[60px] lg:min-w-[70px]">
                                 Pricing
                               </th>
                               <th className="px-2 lg:px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[70px] lg:min-w-[80px]">
                                 Sell Price
                               </th>
                               <th className="px-2 lg:px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[70px] lg:min-w-[80px]">
                                 Total Cost
                               </th>
                               <th className="px-2 lg:px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[70px] lg:min-w-[80px]">
                                 Total Sell
                               </th>
                               <th className="px-2 lg:px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[50px]">
                                 Actions
                               </th>
                             </tr>
                           </thead>
                           <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                             {getPaginatedBOMItems(bomItems, category.name).map((item) => (
                               <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                 <td className="px-2 lg:px-3 py-3 lg:py-4 text-sm text-gray-900 dark:text-white">
                                   <div className="max-w-[100px] lg:max-w-[120px] truncate" title={item.description}>
                                     {item.description}
                                   </div>
                                 </td>
                                 <td className="px-2 lg:px-3 py-3 lg:py-4">
                                   <div className="max-w-[80px] lg:max-w-[100px]">
                                     <div className="text-sm text-gray-900 dark:text-white truncate" title={item.manufacturer || 'N/A'}>
                                       {item.manufacturer || 'N/A'}
                                     </div>
                                     <div className="text-xs text-gray-500 dark:text-gray-400 truncate" title={item.category}>
                                       {item.category}
                                     </div>
                                   </div>
                                 </td>
                                 <td className="px-2 lg:px-3 py-3 lg:py-4 text-sm text-gray-900 dark:text-white">
                                   {item.quantity.toFixed(3)}
                                 </td>
                                 <td className="px-2 lg:px-3 py-3 lg:py-4 text-sm text-gray-900 dark:text-white">
                                   {item.unit}
                                 </td>
                                 <td className="px-2 lg:px-3 py-3 lg:py-4 text-sm text-gray-900 dark:text-white">
                                   {formatCurrency(item.unitPrice)}
                                 </td>
                                 <td className="px-2 lg:px-3 py-3 lg:py-4 text-sm text-gray-900 dark:text-white">
                                   <span className="hidden lg:inline">Margin </span>{item.margin}%
                                 </td>
                                 <td className="px-2 lg:px-3 py-3 lg:py-4 text-sm text-gray-900 dark:text-white">
                                   {formatCurrency(item.totalSell / item.quantity)}
                                 </td>
                                 <td className="px-2 lg:px-3 py-3 lg:py-4 text-sm text-gray-900 dark:text-white">
                                   {formatCurrency(item.totalCost)}
                                 </td>
                                 <td className="px-2 lg:px-3 py-3 lg:py-4 text-sm text-gray-900 dark:text-white">
                                   {formatCurrency(item.totalSell)}
                                 </td>
                                 <td className="px-2 lg:px-3 py-3 lg:py-4 text-sm text-gray-500 dark:text-gray-400">
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
                       
                       {/* Pagination Controls */}
                       {getTotalBOMPages(bomItems, category.name) > 1 && (
                         <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
                           <div className="flex items-center justify-between">
                             <div className="flex items-center space-x-2">
                               <span className="text-sm text-gray-700 dark:text-gray-300">
                                 Items per page:
                               </span>
                               <select
                                 value={bomItemsPerPage}
                                 onChange={(e) => {
                                   setBomItemsPerPage(Number(e.target.value));
                                   setCurrentBOMPage(1);
                                 }}
                                 className="text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                               >
                                 <option value={5}>5</option>
                                 <option value={10}>10</option>
                                 <option value={20}>20</option>
                                 <option value={50}>50</option>
                               </select>
                             </div>
                             <div className="flex items-center space-x-2">
                               <button
                                 onClick={() => setCurrentBOMPage(Math.max(1, currentBOMPage - 1))}
                                 disabled={currentBOMPage === 1}
                                 className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                               >
                                 Previous
                               </button>
                               <span className="text-sm text-gray-700 dark:text-gray-300">
                                 Page {currentBOMPage} of {getTotalBOMPages(bomItems, category.name)}
                               </span>
                               <button
                                 onClick={() => setCurrentBOMPage(Math.min(getTotalBOMPages(bomItems, category.name), currentBOMPage + 1))}
                                 disabled={currentBOMPage === getTotalBOMPages(bomItems, category.name)}
                                 className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                               >
                                 Next
                               </button>
                             </div>
                           </div>
                         </div>
                       )}
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
                      
                      <div className="overflow-x-auto max-w-full">
                        <table className="w-full min-w-[600px]">
                          <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[200px]">
                                Category
                              </th>
                              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[100px]">
                                Items
                              </th>
                              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[120px]">
                                Total Cost
                              </th>
                              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[100px]">
                                % of Total
                              </th>
                              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[80px]">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {categories.map((category) => {
                              // Calculate stats for this category
                              const itemsInCategory = bomItems.filter(item => item.category === category.category_name);
                              const totalCost = itemsInCategory.reduce((sum, item) => sum + item.totalCost, 0);
                              const totalBOMCost = bomItems.reduce((sum, item) => sum + item.totalCost, 0);
                              const percentageOfTotal = totalBOMCost > 0 ? (totalCost / totalBOMCost) * 100 : 0;
                              
                              return (
                                <tr key={category.category_id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                  <td className="px-3 py-4 text-sm font-medium text-gray-900 dark:text-white">
                                    <div className="max-w-[200px] truncate" title={category.category_name}>
                                      {category.category_name}
                                    </div>
                                  </td>
                                  <td className="px-3 py-4 text-sm text-gray-900 dark:text-white">
                                    {itemsInCategory.length} item{itemsInCategory.length !== 1 ? 's' : ''}
                                  </td>
                                  <td className="px-3 py-4 text-sm text-gray-900 dark:text-white">
                                    {formatCurrency(totalCost)}
                                  </td>
                                  <td className="px-3 py-4 text-sm text-gray-900 dark:text-white">
                                    {percentageOfTotal.toFixed(1)}%
                                  </td>
                                  <td className="px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                                    <button
                                      onClick={() => handleDeleteCategory(category.category_id)}
                                      className="text-red-600 hover:text-red-900 dark:hover:text-red-400"
                                      title="Delete category"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {categories.length === 0 && (
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
         ) : activeSection === 'AI Estimation' ? (
           /* AI Estimation Section */
           <div className="flex-1 p-6 overflow-y-auto">
             <div className="max-w-7xl mx-auto space-y-6">
               {/* Header */}
               <div className="flex items-center justify-between">
                 <div>
                   <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                     AI-powered cost estimation and labor management
                   </h1>
                   <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                     Comprehensive project estimation analysis
                   </p>
                 </div>
                 
                 {estimationResults && (
                   <div className="flex items-center space-x-2">
                     <span className="text-sm text-gray-500 dark:text-gray-400">Confidence:</span>
                     <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 rounded text-sm font-medium">
                       {estimationResults.confidence}%
                     </span>
                   </div>
                 )}
               </div>

               {/* Main Tabs */}
               <div className="flex space-x-4 border-b border-gray-200 dark:border-gray-700">
                 {['Overview', 'AI Analysis', 'Pricing', 'Generate'].map((tab) => (
                   <button
                     key={tab}
                     onClick={() => setActiveEstimationTab(tab)}
                     className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                       activeEstimationTab === tab
                         ? 'border-black dark:border-white text-black dark:text-white'
                         : 'border-transparent text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                     }`}
                   >
                     {tab}
                   </button>
                 ))}
               </div>

               {/* Overview Tab */}
               {activeEstimationTab === 'Overview' && estimationResults && (
                 <div className="space-y-6">
                   {/* Summary Cards */}
                   <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                     <div className="bg-green-100 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded-lg p-4">
                       <div className="flex items-center space-x-2">
                         <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                           <span className="text-white text-sm font-bold">↑</span>
                         </div>
                         <div>
                           <p className="text-sm text-green-700 dark:text-green-300">Best Case Price</p>
                           <p className="text-xl font-semibold text-green-800 dark:text-green-200">
                             {formatCurrency(estimationResults.bestCasePrice)}
                           </p>
                         </div>
                       </div>
                     </div>
                     
                     <div className="bg-orange-100 dark:bg-orange-900 border border-orange-200 dark:border-orange-700 rounded-lg p-4">
                       <div className="flex items-center space-x-2">
                         <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                           <span className="text-white text-sm font-bold">↑</span>
                         </div>
                         <div>
                           <p className="text-sm text-orange-700 dark:text-orange-300">Worst Case Price</p>
                           <p className="text-xl font-semibold text-orange-800 dark:text-orange-200">
                             {formatCurrency(estimationResults.worstCasePrice)}
                           </p>
                         </div>
                       </div>
                     </div>
                     
                     <div className="bg-blue-100 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                       <div className="flex items-center space-x-2">
                         <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                           <span className="text-white text-sm font-bold">📊</span>
                         </div>
                         <div>
                           <p className="text-sm text-blue-700 dark:text-blue-300">Materials (Min)</p>
                           <p className="text-xl font-semibold text-blue-800 dark:text-blue-200">
                             {formatCurrency(estimationResults.materialsMin)}
                           </p>
                         </div>
                       </div>
                     </div>
                     
                     <div className="bg-purple-100 dark:bg-purple-900 border border-purple-200 dark:border-purple-700 rounded-lg p-4">
                       <div className="flex items-center space-x-2">
                         <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                           <span className="text-white text-sm font-bold">$</span>
                         </div>
                         <div>
                           <p className="text-sm text-purple-700 dark:text-purple-300">Margin Applied</p>
                           <p className="text-xl font-semibold text-purple-800 dark:text-purple-200">
                             {estimationResults.marginApplied}%
                           </p>
                         </div>
                       </div>
                     </div>
                   </div>

                   {/* Sub Tabs */}
                   <div className="flex space-x-4 border-b border-gray-200 dark:border-gray-700">
                     {['Analysis', 'Materials', 'AISuggestions', 'Context', 'Discussion', 'ValueEngineering', 'Labor'].map((tab) => (
                       <button
                         key={tab}
                         onClick={() => setActiveEstimationSubTab(tab as 'Analysis' | 'Materials' | 'AISuggestions' | 'Context' | 'Discussion' | 'ValueEngineering' | 'Labor')}
                         className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                           activeEstimationSubTab === tab
                             ? 'border-black dark:border-white text-black dark:text-white'
                             : 'border-transparent text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                         }`}
                       >
                         {tab === 'AISuggestions' ? 'AI Suggestions' : tab === 'ValueEngineering' ? 'Value Engineering' : tab}
                       </button>
                     ))}
                   </div>

                   {/* Analysis Content */}
                   {activeEstimationSubTab === 'Analysis' && (
                     <div className="space-y-6">
                       <div className="flex items-center justify-between">
                         <h4 className="text-lg font-semibold text-gray-900 dark:text-white">AI Reasoning & Analysis</h4>
                       </div>
                       
                       <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                         <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                           BOM-first estimation using actual BOM data with confidence-based contingency. Materials: ${estimationResults.materialsMin.toLocaleString()}-${estimationResults.materialsMax.toLocaleString()} (from {estimationResults.materialsBreakdown.categories.length} BOM items + 15% contingency based on {estimationResults.confidence}% confidence). Labor: Labor analysis for installing the {estimationResults.materialsBreakdown.categories.length} BOM items listed above considers the complexity of a multi-door access control system, the technical requirements for integration, and industry-standard installation times. The estimation includes programming time, testing, and commissioning activities. Margin applied reflects market conditions and project complexity while maintaining competitive positioning.
                         </p>
                       </div>
                     </div>
                   )}

                   {activeEstimationSubTab === 'Materials' && (
                     <div className="space-y-6">
                       <div className="flex items-center justify-between">
                         <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Materials Breakdown & Analysis</h4>
                       </div>
                       
                       <div className="space-y-4">
                         {estimationResults.materialsBreakdown.categories.map((category, index) => (
                           <div key={index} className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                             <div className="flex justify-between items-start">
                               <div>
                                 <h5 className="font-medium text-gray-900 dark:text-white">{category.name}</h5>
                                 <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{category.description}</p>
                               </div>
                               <div className="text-right">
                                 <p className="text-sm text-gray-500 dark:text-gray-400">Cost: {formatCurrency(category.cost)}</p>
                                 <p className="text-sm text-gray-500 dark:text-gray-400">Customer Price: {formatCurrency(category.customer)}</p>
                               </div>
                             </div>
                           </div>
                         ))}
                       </div>
                     </div>
                   )}

                   {activeEstimationSubTab === 'AISuggestions' && (
                     <div className="space-y-6">
                       <div className="flex items-center justify-between">
                         <h4 className="text-lg font-semibold text-gray-900 dark:text-white">+ AI Material Suggestions</h4>
                         <ShimmerButton
                           onClick={() => {}}
                           className="bg-blue-600 hover:bg-blue-700 text-white"
                         >
                           Generate Suggestions
                         </ShimmerButton>
                       </div>
                       
                       <p className="text-sm text-gray-600 dark:text-gray-400">
                         AI analyzes vendor quotes to suggest materials that may be missing from your BOM. Accept or dismiss suggestions as needed.
                       </p>
                       
                       <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                         <div className="flex justify-between items-start">
                           <div>
                             <h5 className="font-medium text-gray-900 dark:text-white">Access Control Cards</h5>
                             <div className="flex items-center space-x-2 mt-2">
                               <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-xs rounded">Materials</span>
                               <span className="text-sm text-gray-500 dark:text-gray-400">Qty: 100.000 EA</span>
                               <span className="text-sm text-green-600 dark:text-green-400 font-medium">$15.00 each</span>
                               <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 text-xs rounded">95% confidence</span>
                             </div>
                           </div>
                           <div className="flex space-x-2">
                             <button className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded">✓ Accept</button>
                             <button className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded">X Dismiss</button>
                           </div>
                         </div>
                       </div>
                     </div>
                   )}

                   {activeEstimationSubTab === 'Context' && (
                     <div className="space-y-6">
                       <div className="flex items-center justify-between">
                         <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Project Context</h4>
                         <ShimmerButton
                           onClick={() => {}}
                           className="bg-blue-600 hover:bg-blue-700 text-white"
                         >
                           + Add Context
                         </ShimmerButton>
                       </div>
                       
                       <p className="text-sm text-gray-600 dark:text-gray-400">
                         Provide additional project understanding to improve AI estimation accuracy.
                       </p>
                       
                       <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                         <div className="flex justify-between items-start">
                           <div className="flex-1">
                             <div className="flex items-center space-x-2 mb-2">
                               <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 text-xs rounded">medium</span>
                             </div>
                             <h5 className="font-medium text-gray-900 dark:text-white">Testing Context Suggestions</h5>
                             <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                               Need dedicated wireless access points and network monitoring equipment for reliable system connectivity and troubleshooting capabilities.
                             </p>
                           </div>
                           <div className="flex space-x-2 ml-4">
                             <button className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                               <Edit3 className="w-4 h-4" />
                             </button>
                             <button className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400">
                               <Trash2 className="w-4 h-4" />
                             </button>
                           </div>
                         </div>
                       </div>
                     </div>
                   )}

                   {activeEstimationSubTab === 'Discussion' && (
                     <div className="space-y-6">
                       <div className="flex items-center justify-between">
                         <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Customer Discussion Points</h4>
                       </div>
                       
                       <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                         <div className="flex justify-between items-start">
                           <div className="flex-1">
                             <div className="flex items-center space-x-2 mb-2">
                               <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs rounded">Installation</span>
                               <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 text-xs rounded">high priority</span>
                             </div>
                             <h5 className="font-medium text-gray-900 dark:text-white">
                               How will the installation be coordinated with other ongoing construction activities at the site?
                             </h5>
                             <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                               <strong>Impact:</strong> Coordination is crucial to avoid delays and ensure smooth installation without interference from other trades.
                             </p>
                           </div>
                         </div>
                       </div>
                     </div>
                   )}

                   {activeEstimationSubTab === 'ValueEngineering' && (
                     <div className="space-y-6">
                       <div className="flex items-center justify-between">
                         <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Value Engineering Opportunities</h4>
                       </div>
                       
                       
                       <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                         <div className="flex justify-between items-start">
                           <div className="flex-1">
                             <div className="flex items-center space-x-2 mb-2">
                               <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 text-xs rounded">Cost Savings</span>
                               <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 text-xs rounded">medium impact</span>
                             </div>
                             <h5 className="font-medium text-gray-900 dark:text-white">
                               Consider using remote programming and diagnostics to reduce on-site labor time.
                             </h5>
                           </div>
                         </div>
                       </div>
                     </div>
                   )}

                   {activeEstimationSubTab === 'Labor' && (
                     <div className="space-y-6">
                       <div className="flex items-center justify-between">
                         <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Labor Analysis</h4>
                       </div>
                       
                       <div className="space-y-4">
                         {Object.entries(estimationResults.laborBreakdown).map(([key, labor]) => (
                           <div key={key} className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                             <div className="flex justify-between items-start">
                               <div>
                                 <h5 className="font-medium text-gray-900 dark:text-white capitalize">
                                   {key.replace(/([A-Z])/g, ' $1')}
                                 </h5>
                                 <div className="grid grid-cols-3 gap-4 text-sm mt-2">
                                   <div>
                                     <p className="text-gray-500 dark:text-gray-400">Rate</p>
                                     <p className="font-medium text-gray-900 dark:text-white">
                                       {formatCurrency(labor.rate)}/hr
                                     </p>
                                   </div>
                                   <div>
                                     <p className="text-gray-500 dark:text-gray-400">Hours</p>
                                     <p className="font-medium text-gray-900 dark:text-white">
                                       {labor.hours.min} - {labor.hours.max}
                                     </p>
                                   </div>
                                   <div>
                                     <p className="text-gray-500 dark:text-gray-400">Cost</p>
                                     <p className="font-medium text-gray-900 dark:text-white">
                                       {formatCurrency(labor.cost.min)} - {formatCurrency(labor.cost.max)}
                                     </p>
                                   </div>
                                 </div>
                               </div>
                             </div>
                           </div>
                         ))}
                       </div>
                     </div>
                   )}
                 </div>
               )}

               {/* AI Analysis Tab */}
               {activeEstimationTab === 'AI Analysis' && (
                 <div className="space-y-6">
                   {/* AI Analysis Header */}
                   <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                     <div className="flex items-center justify-between mb-4">
                       <div className="flex items-center space-x-3">
                         <Brain className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                         <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                           AI Analysis
                         </h3>
                       </div>
                       <div className="flex items-center space-x-2">
                         <span className="text-sm text-gray-500 dark:text-gray-400">Last updated:</span>
                         <span className="text-sm font-medium text-gray-900 dark:text-white">
                           {estimationResults ? new Date().toLocaleDateString() : 'Not available'}
                         </span>
                       </div>
                     </div>
                     
                     <div className="space-y-6">
                       {/* Analysis Sub-sections */}
                       <div className="flex space-x-1 border-b border-gray-200 dark:border-gray-700">
                         <button
                           onClick={() => setActiveEstimationSubTab('Analysis')}
                           className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-all ${
                             activeEstimationSubTab === 'Analysis'
                               ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                               : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                           }`}
                         >
                           Analysis
                         </button>
                         <button
                           onClick={() => setActiveEstimationSubTab('Materials')}
                           className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-all ${
                             activeEstimationSubTab === 'Materials'
                               ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                               : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                           }`}
                         >
                           $ Materials
                         </button>
                         <button
                           onClick={() => setActiveEstimationSubTab('AISuggestions')}
                           className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-all ${
                             activeEstimationSubTab === 'AISuggestions'
                               ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                               : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                           }`}
                         >
                           AI Suggestions
                         </button>
                         <button
                           onClick={() => setActiveEstimationSubTab('Context')}
                           className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-all ${
                             activeEstimationSubTab === 'Context'
                               ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                               : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                           }`}
                         >
                           Context
                         </button>
                         <button
                           onClick={() => setActiveEstimationSubTab('Discussion')}
                           className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-all ${
                             activeEstimationSubTab === 'Discussion'
                               ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                               : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                           }`}
                         >
                           Discussion
                         </button>
                         <button
                           onClick={() => setActiveEstimationSubTab('ValueEngineering')}
                           className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-all ${
                             activeEstimationSubTab === 'ValueEngineering'
                               ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                               : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                           }`}
                         >
                           Value Engineering
                         </button>
                         <button
                           onClick={() => setActiveEstimationSubTab('Labor')}
                           className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-all ${
                             activeEstimationSubTab === 'Labor'
                               ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                               : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                           }`}
                         >
                           Labor
                         </button>
                       </div>

                       {/* Sub-section Content */}
                       <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
                         {activeEstimationSubTab === 'Analysis' && (
                           <div className="space-y-6">
                             <div className="flex items-center justify-between">
                               <h4 className="text-lg font-semibold text-gray-900 dark:text-white">AI Reasoning & Analysis</h4>
                             </div>
                             
                             {!estimationResults ? (
                               <div className="text-center py-8">
                                 <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                 <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                                   No Analysis Available
                                 </h4>
                                 <p className="text-gray-500 dark:text-gray-400 mb-4">
                                   Generate an AI estimation first to view detailed analysis.
                                 </p>
                                 <div className="flex justify-center">
                                   <ShimmerButton
                                     onClick={() => setActiveEstimationTab('Generate')}
                                     className="bg-blue-600 hover:bg-blue-700 text-white"
                                   >
                                     Generate Estimation
                                   </ShimmerButton>
                                 </div>
                               </div>
                             ) : (
                               <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                                 <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                                   BOM-first estimation using actual BOM data with confidence-based contingency. Materials: ${estimationResults.materialsMin.toLocaleString()}-${estimationResults.materialsMax.toLocaleString()} (from {estimationResults.materialsBreakdown.categories.length} BOM items + 15% contingency based on {estimationResults.confidence}% confidence). Labor: Labor analysis for installing the {estimationResults.materialsBreakdown.categories.length} BOM items listed above considers the complexity of a multi-door access control system, the technical requirements for integration, and industry-standard installation times. The estimation includes programming time, testing, and commissioning activities. Margin applied reflects market conditions and project complexity while maintaining competitive positioning.
                                 </p>
                               </div>
                             )}
                           </div>
                         )}

                         {activeEstimationSubTab === 'Materials' && (
                           <div className="space-y-6">
                             <div className="flex items-center justify-between">
                               <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Materials Breakdown & Analysis</h4>
                             </div>
                             
                             {!estimationResults ? (
                               <div className="text-center py-8">
                                 <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                 <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                                   No Materials Data Available
                                 </h4>
                                 <p className="text-gray-500 dark:text-gray-400 mb-4">
                                   Generate an AI estimation first to view materials breakdown.
                                 </p>
                                 <div className="flex justify-center">
                                   <ShimmerButton
                                     onClick={() => setActiveEstimationTab('Generate')}
                                     className="bg-blue-600 hover:bg-blue-700 text-white"
                                   >
                                     Generate Estimation
                                   </ShimmerButton>
                                 </div>
                               </div>
                             ) : (
                               <div className="space-y-4">
                                 {estimationResults.materialsBreakdown.categories.map((category, index) => (
                                   <div key={index} className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                                     <div className="flex justify-between items-start">
                                       <div>
                                         <h5 className="font-medium text-gray-900 dark:text-white">{category.name}</h5>
                                         <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{category.description}</p>
                                       </div>
                                       <div className="text-right">
                                         <p className="text-sm text-gray-500 dark:text-gray-400">Cost: {formatCurrency(category.cost)}</p>
                                         <p className="text-sm text-gray-500 dark:text-gray-400">Customer Price: {formatCurrency(category.customer)}</p>
                                       </div>
                                     </div>
                                   </div>
                                 ))}
                               </div>
                             )}
                           </div>
                         )}

                         {activeEstimationSubTab === 'AISuggestions' && (
                           <div className="space-y-6">
                             <div className="flex items-center justify-between">
                               <h4 className="text-lg font-semibold text-gray-900 dark:text-white">+ AI Material Suggestions</h4>
                               <ShimmerButton
                                 onClick={() => {}}
                                 className="bg-blue-600 hover:bg-blue-700 text-white"
                               >
                                 Generate Suggestions
                               </ShimmerButton>
                             </div>
                             
                             <p className="text-sm text-gray-600 dark:text-gray-400">
                               AI analyzes vendor quotes to suggest materials that may be missing from your BOM. Accept or dismiss suggestions as needed.
                             </p>
                             
                             <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                               <div className="flex justify-between items-start">
                                 <div>
                                   <h5 className="font-medium text-gray-900 dark:text-white">Access Control Cards</h5>
                                   <div className="flex items-center space-x-2 mt-2">
                                     <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-xs rounded">Materials</span>
                                     <span className="text-sm text-gray-500 dark:text-gray-400">Qty: 100.000 EA</span>
                                     <span className="text-sm text-green-600 dark:text-green-400 font-medium">$15.00 each</span>
                                     <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 text-xs rounded">95% confidence</span>
                                   </div>
                                 </div>
                                 <div className="flex space-x-2">
                                   <button className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded">✓ Accept</button>
                                   <button className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded">X Dismiss</button>
                                 </div>
                               </div>
                             </div>
                           </div>
                         )}

                         {activeEstimationSubTab === 'Context' && (
                           <div className="space-y-6">
                             <div className="flex items-center justify-between">
                               <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Project Context</h4>
                               <ShimmerButton
                                 onClick={() => {}}
                                 className="bg-blue-600 hover:bg-blue-700 text-white"
                               >
                                 + Add Context
                               </ShimmerButton>
                             </div>
                             
                             <p className="text-sm text-gray-600 dark:text-gray-400">
                               Provide additional project understanding to improve AI estimation accuracy.
                             </p>
                             
                             <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                               <div className="flex justify-between items-start">
                                 <div className="flex-1">
                                   <div className="flex items-center space-x-2 mb-2">
                                     <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 text-xs rounded">medium</span>
                                   </div>
                                   <h5 className="font-medium text-gray-900 dark:text-white">Testing Context Suggestions</h5>
                                   <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                     Need dedicated wireless access points and network monitoring equipment for reliable system connectivity and troubleshooting capabilities.
                                   </p>
                                 </div>
                                 <div className="flex space-x-2 ml-4">
                                   <button className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                                     <Edit3 className="w-4 h-4" />
                                   </button>
                                   <button className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400">
                                     <Trash2 className="w-4 h-4" />
                                   </button>
                                 </div>
                               </div>
                             </div>
                           </div>
                         )}

                         {activeEstimationSubTab === 'Discussion' && (
                           <div className="space-y-6">
                             <div className="flex items-center justify-between">
                               <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Customer Discussion Points</h4>
                             </div>
                             
                             <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                               <div className="flex justify-between items-start">
                                 <div className="flex-1">
                                   <div className="flex items-center space-x-2 mb-2">
                                     <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs rounded">Installation</span>
                                     <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 text-xs rounded">high priority</span>
                                   </div>
                                   <h5 className="font-medium text-gray-900 dark:text-white">
                                     How will the installation be coordinated with other ongoing construction activities at the site?
                                   </h5>
                                   <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                                     <strong>Impact:</strong> Coordination is crucial to avoid delays and ensure smooth installation without interference from other trades.
                                   </p>
                                 </div>
                               </div>
                             </div>
                           </div>
                         )}

                         {activeEstimationSubTab === 'ValueEngineering' && (
                           <div className="space-y-6">
                             <div className="flex items-center justify-between">
                               <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Value Engineering Opportunities</h4>
                             </div>
                             
                             <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                               <div className="flex justify-between items-start">
                                 <div className="flex-1">
                                   <div className="flex items-center space-x-2 mb-2">
                                     <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 text-xs rounded">Cost Savings</span>
                                     <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 text-xs rounded">medium impact</span>
                                   </div>
                                   <h5 className="font-medium text-gray-900 dark:text-white">
                                     Consider using remote programming and diagnostics to reduce on-site labor time.
                                   </h5>
                                 </div>
                               </div>
                             </div>
                           </div>
                         )}

                         {activeEstimationSubTab === 'Labor' && (
                           <div className="space-y-6">
                             <div className="flex items-center justify-between">
                               <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Labor Analysis</h4>
                             </div>
                             
                             {!estimationResults ? (
                               <div className="text-center py-8">
                                 <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                 <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                                   No Labor Data Available
                                 </h4>
                                 <p className="text-gray-500 dark:text-gray-400 mb-4">
                                   Generate an AI estimation first to view labor analysis.
                                 </p>
                                 <div className="flex justify-center">
                                   <ShimmerButton
                                     onClick={() => setActiveEstimationTab('Generate')}
                                     className="bg-blue-600 hover:bg-blue-700 text-white"
                                   >
                                     Generate Estimation
                                   </ShimmerButton>
                                 </div>
                               </div>
                             ) : (
                               <div className="space-y-4">
                                 {Object.entries(estimationResults.laborBreakdown).map(([key, labor]) => (
                                   <div key={key} className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                                     <div className="flex justify-between items-start">
                                       <div>
                                         <h5 className="font-medium text-gray-900 dark:text-white capitalize">
                                           {key.replace(/([A-Z])/g, ' $1')}
                                         </h5>
                                         <div className="grid grid-cols-3 gap-4 text-sm mt-2">
                                           <div>
                                             <p className="text-gray-500 dark:text-gray-400">Rate</p>
                                             <p className="font-medium text-gray-900 dark:text-white">
                                               {formatCurrency(labor.rate)}/hr
                                             </p>
                                           </div>
                                           <div>
                                             <p className="text-gray-500 dark:text-gray-400">Hours</p>
                                             <p className="font-medium text-gray-900 dark:text-white">
                                               {labor.hours.min} - {labor.hours.max}
                                             </p>
                                           </div>
                                           <div>
                                             <p className="text-gray-500 dark:text-gray-400">Cost</p>
                                             <p className="font-medium text-gray-900 dark:text-white">
                                               {formatCurrency(labor.cost.min)} - {formatCurrency(labor.cost.max)}
                                             </p>
                                           </div>
                                         </div>
                                       </div>
                                     </div>
                                   </div>
                                 ))}
                               </div>
                             )}
                           </div>
                         )}
                       </div>
                     </div>
                   </div>
                 </div>
               )}

               {/* Labor Types Tab */}
               {activeEstimationTab === 'Labor Types' && (
                 <div className="space-y-6">
                   {/* Add Labor Type */}
                   <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                     <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                       Add Labor Type
                     </h3>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                       <div>
                         <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                           Labor Type Name
                         </label>
                         <input
                           type="text"
                           value={newLaborType.name}
                           onChange={(e) => setNewLaborType(prev => ({ ...prev, name: e.target.value }))}
                           placeholder="e.g., Senior Technician"
                           className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-black focus:border-black dark:focus:ring-white dark:focus:border-white"
                         />
                       </div>
                       <div>
                         <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                           Hourly Rate ($)
                         </label>
                         <input
                           type="number"
                           value={newLaborType.rate}
                           onChange={(e) => setNewLaborType(prev => ({ ...prev, rate: parseFloat(e.target.value) || 0 }))}
                           min="0"
                           step="0.01"
                           className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-black focus:border-black dark:focus:ring-white dark:focus:border-white"
                         />
                       </div>
                       <div>
                         <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                           Labor Hours Adjustment (%)
                         </label>
                         <input
                           type="text"
                           value={newLaborType.hoursAdjustment}
                           onChange={(e) => setNewLaborType(prev => ({ ...prev, hoursAdjustment: e.target.value }))}
                           placeholder="Enter % increase (e.g., 50 for 50% increase)"
                           className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-black focus:border-black dark:focus:ring-white dark:focus:border-white"
                         />
                         <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                           Leave blank for standard AI estimation
                         </p>
                       </div>
                     </div>
                     <div className="mt-4">
                       <button
                         onClick={handleAddLaborType}
                         disabled={isCreatingLabor}
                         className={`px-4 py-2 rounded-lg transition-colors font-medium flex items-center space-x-2 ${
                           isCreatingLabor
                             ? 'bg-gray-400 dark:bg-gray-600 text-gray-200 dark:text-gray-400 cursor-not-allowed'
                             : 'bg-blue-600 hover:bg-blue-700 text-white dark:text-white'
                         }`}
                       >
                         {isCreatingLabor ? (
                           <>
                             <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                             <span>Creating...</span>
                           </>
                         ) : (
                           <>
                             <Plus className="w-4 h-4" />
                             <span>+ Add Labor Type</span>
                           </>
                         )}
                       </button>
                     </div>
                   </div>

                   {/* Configured Labor Types */}
                   <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                     <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                       Configured Labor Types
                     </h3>
                     
                     {isLoadingLabors ? (
                       <div className="flex justify-center items-center py-8">
                         <div className="flex flex-col items-center space-y-4">
                           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black dark:border-white"></div>
                           <p className="text-gray-500 dark:text-gray-400">Loading labor types...</p>
                         </div>
                       </div>
                     ) : laborError ? (
                       <div className="text-center py-8">
                         <p className="text-red-500 dark:text-red-400 mb-4">{laborError}</p>
                         <button
                           onClick={() => {
                             setIsLoadingLabors(true);
                             setLaborError(null);
                             // Re-fetch labors
                             const fetchLabors = async () => {
                               try {
                                 const token = localStorage.getItem('token');
                                 if (!token) {
                                   setLaborError('Authentication token not found');
                                   setIsLoadingLabors(false);
                                   return;
                                 }

                                 const response = await fetch('https://chikaai.net/api/fusedai/get-all-labors', {
                                   method: 'POST',
                                   headers: {
                                     'Content-Type': 'application/json',
                                     'token': token
                                   }
                                 });

                                 const data = await response.json();
                                 
                                 if (response.ok) {
                                   if (data.labors && data.labors.length > 0) {
                                     const transformedLabors: LaborType[] = data.labors.map((labor: BackendLabor) => ({
                                       id: labor.labor_id,
                                       name: labor.labor_name,
                                       rate: labor.hourly_rate,
                                       hoursAdjustment: labor.labor_hours_adjustment
                                     }));
                                     setLaborTypes(transformedLabors);
                                   } else {
                                     setLaborTypes([]);
                                   }
                                   setLaborError(null);
                                 } else {
                                   setLaborError(data.message || 'Failed to fetch labors');
                                 }
                               } catch (err) {
                                 setLaborError('Failed to fetch labors. Please try again later.');
                               } finally {
                                 setIsLoadingLabors(false);
                               }
                             };
                             fetchLabors();
                           }}
                           className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors text-sm"
                         >
                           Retry
                         </button>
                       </div>
                     ) : laborTypes.length === 0 ? (
                       <div className="text-center py-8">
                         <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                           <Users className="w-8 h-8 text-gray-400" />
                         </div>
                         <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                           No labor types configured
                         </h3>
                         <p className="text-gray-500 dark:text-gray-400 mb-4">
                           Add your first labor type to get started with quote generation.
                         </p>
                       </div>
                     ) : (
                       <div className="space-y-4">
                         {laborTypes.map((laborType) => (
                           <div key={laborType.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                             <div>
                               <h4 className="font-medium text-gray-900 dark:text-white">{laborType.name}</h4>
                               <p className="text-sm text-gray-500 dark:text-gray-400">
                                 {formatCurrency(laborType.rate)}/hour
                               </p>
                               {laborType.hoursAdjustment && laborType.hoursAdjustment !== '' && (
                                 <p className="text-sm text-gray-500 dark:text-gray-400">
                                   Labor hours: {laborType.hoursAdjustment}% increase
                                 </p>
                               )}
                             </div>
                             <div className="flex items-center space-x-2">
                               <button 
                                 onClick={() => handleAddToQuote(laborType)}
                                 disabled={addedToQuoteLabors.has(laborType.id)}
                                 className={`px-3 py-1.5 rounded-md transition-colors text-xs font-medium ${
                                   addedToQuoteLabors.has(laborType.id)
                                     ? 'bg-gray-400 text-white cursor-not-allowed'
                                     : 'bg-green-600 hover:bg-green-700 text-white'
                                 }`}
                               >
                                 {addedToQuoteLabors.has(laborType.id) ? 'Added' : 'Add to Quote'}
                               </button>
                               <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                                 <Edit3 className="w-4 h-4" />
                               </button>
                               <button 
                                 onClick={() => handleDeleteLaborType(laborType.id)}
                                 disabled={deletingLaborId === laborType.id}
                                 className={`p-2 transition-colors ${
                                   deletingLaborId === laborType.id
                                     ? 'text-gray-400 cursor-not-allowed'
                                     : 'text-gray-400 hover:text-red-600 dark:hover:text-red-400'
                                 }`}
                               >
                                 {deletingLaborId === laborType.id ? (
                                   <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                                 ) : (
                                   <Trash2 className="w-4 h-4" />
                                 )}
                               </button>
                             </div>
                           </div>
                         ))}
                       </div>
                     )}
                   </div>
                 </div>
               )}

               {/* Pricing Tab */}
               {activeEstimationTab === 'Pricing' && (
                 <div className="space-y-6">
                   <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                     <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                       Pricing Configuration
                     </h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div>
                         <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                           Pricing Type
                         </label>
                         <Select 
                           value={pricingConfig.type} 
                           onValueChange={(value) => setPricingConfig(prev => ({ ...prev, type: value }))}
                         >
                           <SelectTrigger className="w-full">
                             <SelectValue />
                           </SelectTrigger>
                           <SelectContent>
                             <SelectItem value="Margin">Margin</SelectItem>
                             <SelectItem value="Markup">Markup</SelectItem>
                           </SelectContent>
                         </Select>
                       </div>
                       <div>
                         <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                           Percentage (%)
                         </label>
                         <input
                           type="number"
                           value={pricingConfig.percentage}
                           onChange={(e) => setPricingConfig(prev => ({ ...prev, percentage: parseFloat(e.target.value) || 0 }))}
                           min="0"
                           step="0.01"
                           className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-black focus:border-black dark:focus:ring-white dark:focus:border-white"
                         />
                       </div>
                       <div>
                         <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                           Apply To
                         </label>
                         <Select 
                           value={pricingConfig.applyTo} 
                           onValueChange={(value) => setPricingConfig(prev => ({ ...prev, applyTo: value }))}
                         >
                           <SelectTrigger className="w-full">
                             <SelectValue />
                           </SelectTrigger>
                           <SelectContent>
                             <SelectItem value="Materials Only">Materials Only</SelectItem>
                             <SelectItem value="Labor Only">Labor Only</SelectItem>
                             <SelectItem value="Materials and Labor">Materials and Labor</SelectItem>
                           </SelectContent>
                         </Select>
                       </div>
                       <div>
                         <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                           Custom Adjustment ($)
                         </label>
                         <input
                           type="number"
                           value={pricingConfig.customAdjustment}
                           onChange={(e) => setPricingConfig(prev => ({ ...prev, customAdjustment: parseFloat(e.target.value) || 0 }))}
                           min="0"
                           step="0.01"
                           className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-black focus:border-black dark:focus:ring-white dark:focus:border-white"
                         />
                       </div>
                       <div className="md:col-span-2">
                         <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                           Adjustment Description
                         </label>
                         <input
                           type="text"
                           value={pricingConfig.adjustmentDescription}
                           onChange={(e) => setPricingConfig(prev => ({ ...prev, adjustmentDescription: e.target.value }))}
                           placeholder="e.g., Project complexity bonus"
                           className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-black focus:border-black dark:focus:ring-white dark:focus:border-white"
                         />
                       </div>
                     </div>
                     <div className="mt-6">
                       <ShimmerButton
                         onClick={handleSavePricingConfig}
                         className="bg-green-600 hover:bg-green-700 text-white"
                       >
                         $ Save Pricing Configuration
                       </ShimmerButton>
                     </div>
                   </div>
                 </div>
               )}

               {/* Generate Tab */}
               {activeEstimationTab === 'Generate' && (
                 <div className="space-y-6">
                   <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                     <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                       Generate AI Estimation
                     </h3>
                     <div className="space-y-4">
                       <div>
                         <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                           Additional Context (Optional)
                         </label>
                         <textarea
                           value={additionalContext}
                           onChange={(e) => setAdditionalContext(e.target.value)}
                           placeholder="Provide any additional context for the estimation (e.g., special requirements, timeline constraints, complexity factors)"
                           rows={4}
                           className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-black focus:border-black dark:focus:ring-white dark:focus:border-white resize-none"
                         />
                       </div>
                       <div className="flex justify-center">
                         <ShimmerButton
                           onClick={generateAIEstimation}
                           disabled={isGeneratingEstimation}
                           className="bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                         >
                           {isGeneratingEstimation ? (
                             <>
                               <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                               Generating...
                             </>
                           ) : (
                             <>
                               <Brain className="w-4 h-4 mr-2" />
                               Generate Estimation
                             </>
                           )}
                         </ShimmerButton>
                       </div>
                     </div>
                   </div>

                   {/* How AI Estimation Works */}
                   <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                     <div className="flex items-start space-x-3">
                       <Info className="w-5 h-5 text-blue-500 mt-0.5" />
                       <div>
                         <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                           How AI Estimation Works
                         </h3>
                         <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                           <li className="flex items-start space-x-2">
                             <span className="text-blue-500 mt-1">•</span>
                             <span>Analyzes project description and uploaded documents</span>
                           </li>
                           <li className="flex items-start space-x-2">
                             <span className="text-blue-500 mt-1">•</span>
                             <span>Uses configured labor types and hourly rates</span>
                           </li>
                           <li className="flex items-start space-x-2">
                             <span className="text-blue-500 mt-1">•</span>
                             <span>Applies your pricing configuration (markup/margin)</span>
                           </li>
                         </ul>
                       </div>
                     </div>
                   </div>
                 </div>
               )}

               {!estimationResults && activeEstimationTab === 'Overview' && (
                 <div className="text-center py-12">
                   <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                   <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                     No AI Estimation Generated
                   </h3>
                   <p className="text-gray-500 dark:text-gray-400 mb-4">
                     Generate an AI estimation to view comprehensive analysis and breakdowns.
                   </p>
                   <div className="flex justify-center">
                     <ShimmerButton
                       onClick={() => setActiveEstimationTab('Generate')}
                       className="bg-purple-600 hover:bg-purple-700 text-white"
                     >
                       <Brain className="w-4 h-4 mr-2" />
                       Generate AI Estimation
                     </ShimmerButton>
                   </div>
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
                         {categories.map((category) => (
                           <SelectItem key={category.category_id} value={category.category_name}>
                             {category.category_name}
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
