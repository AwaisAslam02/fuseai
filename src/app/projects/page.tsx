'use client';

import { useState } from 'react';
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
  Maximize2
} from 'lucide-react';
import Link from 'next/link';
import { ThemeToggle } from '@/components/theme-provider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Project {
  id: string;
  title: string;
  description: string;
  date: string;
  company: string;
  contact: {
    name: string;
    email: string;
    phone: string;
  };
  status: 'active' | 'completed' | 'pending' | 'on-hold';
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

  const projects: Project[] = [
    {
      id: '1',
      title: 'Install 100 Data',
      description: 'Install 100 data drops for Acme Anchors',
      date: '7/16/2025',
      company: 'Acme Anchors',
      contact: {
        name: 'Carl Wright',
        email: 'a_billsfan@yahoo.com',
        phone: '9016908928'
      },
      status: 'active'
    },
    {
      id: '2',
      title: 'Semmes Murphy Access Control',
      description: '6325 Humphreys Blvd ClosetID 6325-FL1 10 Doors...',
      date: '7/23/2025',
      company: 'Acme Anchors',
      contact: {
        name: 'Carl Wright',
        email: 'a_billsfan@yahoo.com',
        phone: '9016908928'
      },
      status: 'active'
    }
  ];

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

  // Filter projects based on search term and status filter
  const filteredProjects = projects.filter((project) => {
    const matchesSearch = searchTerm === '' || 
      project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.contact.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'All Status' || 
      project.status.toLowerCase() === statusFilter.toLowerCase();
    
    const matchesDate = dateFilter === 'All Dates' || 
      project.date === dateFilter;
    
    const matchesCompany = companyFilter === 'All Companies' || 
      project.company === companyFilter;
    
    return matchesSearch && matchesStatus && matchesDate && matchesCompany;
  });

  const handleSendMessage = () => {
    if (chatMessage.trim()) {
      const newMessage = {
        id: chatMessages.length + 1,
        type: 'user' as const,
        message: chatMessage,
        timestamp: new Date().toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true 
        })
      };
      setChatMessages([...chatMessages, newMessage]);
      setChatMessage('');
      
      // Simulate AI response
      setTimeout(() => {
        const aiResponse = {
          id: chatMessages.length + 2,
          type: 'ai' as const,
          message: 'I understand your question about the projects. How can I help you further?',
          timestamp: new Date().toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
          })
        };
        setChatMessages(prev => [...prev, aiResponse]);
      }, 1000);
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
              <Link href="/login" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
                Sign In
              </Link>
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
                           <SelectItem value="7/16/2025">7/16/2025</SelectItem>
                           <SelectItem value="7/23/2025">7/23/2025</SelectItem>
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
                           <SelectItem value="Acme Anchors">Acme Anchors</SelectItem>
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
           {filteredProjects.map((project) => (
             <motion.div
               key={project.id}
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-all duration-200"
             >
                             <div className="flex items-start justify-between mb-3">
                 <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                   {project.title}
                 </h3>
                 <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                   {project.status}
                 </span>
               </div>
               
               <p className="text-gray-600 dark:text-gray-400 mb-3 text-sm">
                 {project.description}
               </p>

                             <div className="space-y-2 mb-3">
                 <div className="flex items-center space-x-2 text-xs text-gray-600 dark:text-gray-400">
                   <Calendar className="w-3 h-3" />
                   <span>{project.date}</span>
                 </div>
                 <div className="flex items-center space-x-2 text-xs text-gray-600 dark:text-gray-400">
                   <Building2 className="w-3 h-3" />
                   <span>{project.company}</span>
                 </div>
                 <div className="flex items-center space-x-2 text-xs text-gray-600 dark:text-gray-400">
                   <User className="w-3 h-3" />
                   <span>{project.contact.name}</span>
                 </div>
               </div>

               <div className="space-y-1 mb-3">
                 <div className="flex items-center space-x-2 text-xs text-gray-600 dark:text-gray-400">
                   <Mail className="w-3 h-3" />
                   <span className="truncate">{project.contact.email}</span>
                 </div>
                 <div className="flex items-center space-x-2 text-xs text-gray-600 dark:text-gray-400">
                   <Phone className="w-3 h-3" />
                   <span>{project.contact.phone}</span>
                 </div>
               </div>

               <button className="w-full flex items-center justify-center space-x-2 bg-black dark:bg-white text-white dark:text-black px-3 py-1.5 rounded-md hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors text-xs font-medium">
                 <Eye className="w-3 h-3" />
                 <span>View Details</span>
               </button>
            </motion.div>
          ))}
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
                            <p className="leading-relaxed">{message.message}</p>
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
                        disabled={!chatMessage.trim()}
                        className="px-3 py-2 bg-black dark:bg-white text-white dark:text-black rounded-full hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                        title="Send message"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
    </div>
  );
} 