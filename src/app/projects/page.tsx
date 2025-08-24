'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Filter, 
  Eye, 
  Calendar, 
  Building2, 
  User, 
  Mail, 
  Phone,
  Plus,
  Send,
  MessageCircle,
  X,
  Minimize2,
  Maximize2,
  Trash2,
  MapPin,
  LogOut
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ThemeToggle } from '@/components/theme-provider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";

interface Project {
  project_id: string;
  project_name: string;
  project_description: string;
  project_status: 'active' | 'completed' | 'pending' | 'on-hold';
  project_address: string;
  project_customer_name: string;
  project_contact: string;
}

export default function ProjectsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [chatMessage, setChatMessage] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isChatMinimized, setIsChatMinimized] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [dateFilter, setDateFilter] = useState('All Dates');
  const [companyFilter, setCompanyFilter] = useState('All Companies');
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [isChatLoading, setIsChatLoading] = useState(false);

  const { toast } = useToast();
  const router = useRouter();

  // Extract unique dates and companies from projects data
  const uniqueDates = [...new Set(projects.map(project => {
    // You might want to add a date field to your Project interface
    // For now, using current date as placeholder
    return new Date().toLocaleDateString();
  }))].sort();

  const uniqueCompanies = [...new Set(projects.map(project => project.project_customer_name))].sort();

  const handleDeleteProject = async (projectId: string) => {
    try {
      setDeletingProjectId(projectId);

      const token = localStorage.getItem('token');
      if (!token) {
        toast({
          variant: "destructive",
          title: "Authentication Error",
          description: "Authentication token not found. Please log in again."
        });
        return;
      }

      const response = await fetch('https://chikaai.net/api/fusedai/delete-project', {
        method: 'POST',
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
        setProjects(prev => prev.filter(p => p.project_id !== projectId));
        toast({
          title: "Success",
          description: "Project deleted successfully"
        });
        // Close the modal
        setShowDeleteModal(false);
        setProjectToDelete(null);
      } else {
        throw new Error(data.message || 'Failed to delete project');
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete project. Please try again."
      });
    } finally {
      setDeletingProjectId(null);
    }
  };

  const openDeleteModal = (project: Project) => {
    setProjectToDelete(project);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setProjectToDelete(null);
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

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Authentication token not found');
          setIsLoading(false);
          return;
        }

        const response = await fetch('https://chikaai.net/api/fusedai/get-all-projects', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'token': token
          }
        });

        const data = await response.json();
        
        if (response.ok) {
          setProjects(data.projects);
          setError(null);
        } else {
          setError(data.message || 'Failed to fetch projects');
        }
      } catch (err) {
        setError('Failed to fetch projects. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();
  }, []);
  const [chatMessages, setChatMessages] = useState([
    {
      id: 1,
      type: 'ai',
      message: 'Hello! I can help you with any questions about your projects. What would you like to know?',
      timestamp: new Date().toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      })
    }
  ]);



  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'completed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'on-hold':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  // Filter projects based on search term, status filter, date filter, and company filter
  const filteredProjects = projects.filter((project) => {
    const matchesSearch = searchTerm === '' || 
      project.project_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.project_description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.project_customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.project_contact.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'All Status' || 
      project.project_status.toLowerCase() === statusFilter.toLowerCase();
    
    const matchesDate = dateFilter === 'All Dates' || 
      new Date().toLocaleDateString() === dateFilter; // You might want to add a date field to your Project interface
    
    const matchesCompany = companyFilter === 'All Companies' || 
      project.project_customer_name === companyFilter;
    
    return matchesSearch && matchesStatus && matchesDate && matchesCompany;
  });

  const handleSendMessage = async () => {
    if (chatMessage.trim()) {
      const userMessage = {
        id: chatMessages.length + 1,
        type: 'user' as const,
        message: chatMessage,
        timestamp: new Date().toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true 
        })
      };
      setChatMessages(prev => [...prev, userMessage]);
      const currentMessage = chatMessage;
      setChatMessage('');
      setIsChatLoading(true);
      
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

        const response = await fetch('https://chikaai.net/api/fusedai/chat-with-all-projects', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'token': token
          },
          body: JSON.stringify({
            message: currentMessage
          })
        });

        const data = await response.json();

        if (response.ok) {
          const aiResponse = {
            id: chatMessages.length + 2,
            type: 'ai' as const,
            message: data.ai_response,
            timestamp: new Date().toLocaleTimeString('en-US', { 
              hour: 'numeric', 
              minute: '2-digit',
              hour12: true 
            })
          };
          setChatMessages(prev => [...prev, aiResponse]);
        } else {
          throw new Error(data.message || 'Failed to get AI response');
        }
      } catch (error) {
        console.error('Error getting AI response:', error);
        
        // Add error message to chat
        const errorResponse = {
          id: chatMessages.length + 2,
          type: 'ai' as const,
          message: 'Sorry, I encountered an error while processing your request. Please try again.',
          timestamp: new Date().toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
          })
        };
        setChatMessages(prev => [...prev, errorResponse]);
        
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to get AI response. Please try again."
        });
      } finally {
        setIsChatLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
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
              <Link href="/chat" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
                Chat
              </Link>
              <Link href="/projects" className="text-black dark:text-white font-medium">
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
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                 {/* Header */}
         <div className="mb-6">
           <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-1">
             My Projects
           </h1>
           <p className="text-sm text-gray-500 dark:text-gray-400">
             Manage and track your professional projects
           </p>
         </div>

                 {/* Search and Filters */}
         <div className="flex flex-col sm:flex-row gap-3 mb-6">
           <div className="relative flex-1">
             <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
             <input
               type="text"
               placeholder="Search projects..."
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="w-full pl-9 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-black focus:border-black dark:focus:ring-white dark:focus:border-white text-sm"
             />
           </div>
          
                     <div className="flex items-center space-x-2">
             <div className="relative">
               <button 
                 onClick={() => setIsFilterOpen(!isFilterOpen)}
                 className="p-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
               >
                 <Filter className="w-4 h-4 text-gray-600 dark:text-gray-400" />
               </button>
               
               {/* Filter Dropdown */}
               {isFilterOpen && (
                 <div className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 p-4">
                   <div className="space-y-4">
                     <div>
                       <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                         Date
                       </label>
                       <Select value={dateFilter} onValueChange={(value) => setDateFilter(value)}>
                         <SelectTrigger className="w-full">
                           <SelectValue placeholder="All Dates" />
                         </SelectTrigger>
                         <SelectContent>
                           <SelectItem value="All Dates">All Dates</SelectItem>
                           {uniqueDates.map((date) => (
                             <SelectItem key={date} value={date}>
                               {date}
                             </SelectItem>
                           ))}
                         </SelectContent>
                       </Select>
                     </div>
                     
                     <div>
                       <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                         Company
                       </label>
                       <Select value={companyFilter} onValueChange={(value) => setCompanyFilter(value)}>
                         <SelectTrigger className="w-full">
                           <SelectValue placeholder="All Companies" />
                         </SelectTrigger>
                         <SelectContent>
                           <SelectItem value="All Companies">All Companies</SelectItem>
                           {uniqueCompanies.map((company) => (
                             <SelectItem key={company} value={company}>
                               {company}
                             </SelectItem>
                           ))}
                         </SelectContent>
                       </Select>
                     </div>
                     
                     <div className="flex space-x-2 pt-2">
                       <button
                         onClick={() => {
                           setDateFilter('All Dates');
                           setCompanyFilter('All Companies');
                           setIsFilterOpen(false);
                         }}
                         className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                       >
                         Clear All
                       </button>
                       <button
                         onClick={() => setIsFilterOpen(false)}
                         className="flex-1 px-3 py-2 text-sm bg-black dark:bg-white text-white dark:text-black rounded-md hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
                       >
                         Apply
                       </button>
                     </div>
                   </div>
                 </div>
               )}
             </div>
             
                            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value)}>
                 <SelectTrigger className="w-[140px] h-9">
                   <SelectValue placeholder="All Status" />
                 </SelectTrigger>
               <SelectContent>
                 <SelectItem value="All Status">All Status</SelectItem>
                 <SelectItem value="Active">Active</SelectItem>
                 <SelectItem value="Completed">Completed</SelectItem>
                 <SelectItem value="Pending">Pending</SelectItem>
                 <SelectItem value="On Hold">On Hold</SelectItem>
               </SelectContent>
             </Select>

                         <Link href="/projects/create">
               <button className="flex items-center space-x-2 bg-black dark:bg-white text-white dark:text-black px-3 py-2 rounded-md hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors text-sm font-medium">
                 <Plus className="w-4 h-4" />
                 <span>New Project</span>
               </button>
             </Link>
          </div>
        </div>

                          {/* Projects Grid */}
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
           {isLoading ? (
             <div className="col-span-3 flex justify-center items-center py-8">
               <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black dark:border-white"></div>
             </div>
           ) : error ? (
             <div className="col-span-3 text-center py-8">
               <p className="text-red-500 dark:text-red-400">{error}</p>
             </div>
           ) : filteredProjects.length === 0 ? (
             <div className="col-span-3 text-center py-8">
               <p className="text-gray-500 dark:text-gray-400">No projects found</p>
             </div>
           ) : (
             filteredProjects.map((project) => (
               <motion.div
                 key={project.project_id}
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-all duration-200"
               >
                 <div className="flex items-start justify-between mb-3">
                   <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                     {project.project_name}
                   </h3>
                   <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(project.project_status)}`}>
                     {project.project_status}
                   </span>
                 </div>
                 
                 <p className="text-gray-600 dark:text-gray-400 mb-3 text-sm">
                   {project.project_description}
                 </p>

                 <div className="space-y-2 mb-3">
                   <div className="flex items-center space-x-2 text-xs text-gray-600 dark:text-gray-400">
                     <MapPin className="w-3 h-3" />
                     <span>{project.project_address}</span>
                   </div>
                   <div className="flex items-center space-x-2 text-xs text-gray-600 dark:text-gray-400">
                     <Building2 className="w-3 h-3" />
                     <span>{project.project_customer_name}</span>
                   </div>
                   <div className="flex items-center space-x-2 text-xs text-gray-600 dark:text-gray-400">
                     <User className="w-3 h-3" />
                     <span>{project.project_contact}</span>
                   </div>
                 </div>

                                 <div className="flex items-center space-x-2">
                  <Link 
                    href={`/projects/${project.project_id}`}
                    onClick={() => {
                      // Store project data in session storage
                      sessionStorage.setItem('currentProject', JSON.stringify({
                        id: project.project_id,
                        title: project.project_name,
                        status: project.project_status,
                        description: project.project_description,
                        company: project.project_customer_name,
                        contact: {
                          name: project.project_customer_name,
                          email: project.project_contact,
                          phone: project.project_contact
                        },
                        address: project.project_address,
                        date: new Date().toLocaleDateString() // You may want to add a date field to your Project interface
                      }));
                    }}
                    className="flex-1"
                  >
                    <button className="w-full flex items-center justify-center space-x-2 bg-black dark:bg-white text-white dark:text-black px-3 py-1.5 rounded-md hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors text-xs font-medium">
                      <Eye className="w-3 h-3" />
                      <span>View Details</span>
                    </button>
                  </Link>
                  <button
                    onClick={() => openDeleteModal(project)}
                    disabled={deletingProjectId === project.project_id}
                    className={`p-1.5 rounded-md transition-colors ${
                      deletingProjectId === project.project_id
                        ? 'cursor-not-allowed bg-gray-100 dark:bg-gray-800'
                        : 'hover:bg-red-50 dark:hover:bg-red-900/20'
                    }`}
                    title={deletingProjectId === project.project_id ? "Deleting..." : "Delete Project"}
                  >
                    {deletingProjectId === project.project_id ? (
                      <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4 text-red-500 dark:text-red-400" />
                    )}
                  </button>
                </div>
               </motion.div>
             ))
           )}
         </div>

        {/* Chat Toggle Button */}
                 <button
           onClick={() => setIsChatOpen(!isChatOpen)}
           className="fixed bottom-6 right-6 bg-black dark:bg-white text-white dark:text-black p-3 rounded-full shadow-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors z-50"
         >
           <MessageCircle className="w-5 h-5" />
         </button>
      </div>

                           {/* Chat Popup */}
        <AnimatePresence>
          {isChatOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                            className={`fixed bottom-12 right-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl z-50 ${
                  isChatMinimized ? 'w-73 h-10' : 'w-82 h-98'
                }`}
            >
              {/* Chat Header */}
              <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-t-2xl">
                                 <div className="flex items-center space-x-2">
                   <div className="w-6 h-6 bg-black dark:bg-white rounded-full flex items-center justify-center">
                     <MessageCircle className="w-3 h-3 text-white dark:text-black" />
                   </div>
                  <div>
                    <span className="font-semibold text-gray-900 dark:text-white text-sm">Project Telescope</span>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Ask anything about any project</p>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => setIsChatMinimized(!isChatMinimized)}
                    className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
                    title={isChatMinimized ? "Maximize" : "Minimize"}
                  >
                    {isChatMinimized ? (
                      <Maximize2 className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" />
                    ) : (
                      <Minimize2 className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" />
                    )}
                  </button>
                  <button
                    onClick={() => setIsChatOpen(false)}
                    className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
                    title="Close"
                  >
                    <X className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" />
                  </button>
                </div>
              </div>

              {!isChatMinimized && (
                <>
                  {/* Chat Messages */}
                  <div className="flex-1 p-3 overflow-y-auto space-y-3 h-72">
                    {chatMessages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className="flex items-end space-x-2 max-w-[280px]">
                                                     {message.type === 'ai' && (
                             <div className="w-5 h-5 bg-black dark:bg-white rounded-full flex items-center justify-center flex-shrink-0">
                               <MessageCircle className="w-2.5 h-2.5 text-white dark:text-black" />
                             </div>
                           )}
                          <div
                            className={`px-3 py-2 rounded-2xl text-xs ${
                              message.type === 'user'
                                ? 'bg-black dark:bg-white text-white dark:text-black rounded-br-md'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-md'
                            }`}
                          >
                            <p className="leading-relaxed">
                              {message.type === 'ai' ? (
                                message.message.split(/(\*\*.*?\*\*)/).map((part, index) => {
                                  if (part.startsWith('**') && part.endsWith('**')) {
                                    return <strong key={index}>{part.slice(2, -2)}</strong>;
                                  }
                                  return part;
                                })
                              ) : (
                                message.message
                              )}
                            </p>
                            <p className="text-xs opacity-60 mt-1">{message.timestamp}</p>
                          </div>
                          {message.type === 'user' && (
                            <div className="w-5 h-5 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                              <User className="w-2.5 h-2.5 text-gray-600 dark:text-gray-400" />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    {/* Loading indicator */}
                    {isChatLoading && (
                      <div className="flex justify-start">
                        <div className="flex items-end space-x-2 max-w-[280px]">
                          <div className="w-5 h-5 bg-black dark:bg-white rounded-full flex items-center justify-center flex-shrink-0">
                            <MessageCircle className="w-2.5 h-2.5 text-white dark:text-black" />
                          </div>
                          <div className="px-3 py-2 rounded-2xl text-xs bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-md">
                            <div className="flex items-center space-x-1">
                              <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce"></div>
                              <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                              <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Chat Input */}
                  <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-b-2xl">
                    <div className="flex space-x-2">
                      <div className="flex-1 relative">
                        <input
                          type="text"
                          placeholder="Ask about your projects..."
                          value={chatMessage}
                          onChange={(e) => setChatMessage(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 text-xs"
                        />
                      </div>
                      <button
                        onClick={handleSendMessage}
                        disabled={!chatMessage.trim() || isChatLoading}
                        className="px-3 py-2 bg-black dark:bg-white text-white dark:text-black rounded-full hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                        title={isChatLoading ? "Processing..." : "Send message"}
                      >
                        {isChatLoading ? (
                          <div className="w-3.5 h-3.5 border-2 border-white dark:border-black border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Send className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {showDeleteModal && projectToDelete && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={closeDeleteModal}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Delete Project
                  </h3>
                  <button
                    onClick={closeDeleteModal}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="mb-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                      <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        Are you sure you want to delete this project?
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        This action cannot be undone.
                      </p>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                      Project: {projectToDelete.project_name}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Customer: {projectToDelete.project_customer_name}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Status: {projectToDelete.project_status}
                    </p>
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={closeDeleteModal}
                    disabled={deletingProjectId === projectToDelete.project_id}
                    className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors text-sm disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDeleteProject(projectToDelete.project_id)}
                    disabled={deletingProjectId === projectToDelete.project_id}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {deletingProjectId === projectToDelete.project_id ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Deleting...</span>
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4" />
                        <span>Delete Project</span>
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      <Toaster />
    </div>
  );
} 