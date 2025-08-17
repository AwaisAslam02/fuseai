'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Save, 
  X,
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { ThemeToggle } from '@/components/theme-provider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  address: string;
  date: string;
}

interface Customer {
  customer_id: string;
  customer_name: string;
}

interface Contact {
  contact_id: string;
  contact_name: string;
}

export default function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [project, setProject] = useState<Project>({
    id: '',
    title: '',
    status: 'pending',
    description: '',
    company: '',
    contact: {
      name: '',
      email: '',
      phone: ''
    },
    address: '',
    date: ''
  });
  const [projectId, setProjectId] = useState<string>('');

  // Handle async params
  useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params;
      setProjectId(resolvedParams.id);
    };
    getParams();
  }, [params]);

  // API data states
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(true);
  const [customerError, setCustomerError] = useState<string | null>(null);

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoadingContacts, setIsLoadingContacts] = useState(true);
  const [contactError, setContactError] = useState<string | null>(null);

  // Load project data from session storage and fetch API data on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedProject = sessionStorage.getItem('currentProject');
      if (storedProject) {
        const projectData = JSON.parse(storedProject);
        setProject(projectData);
      }
    }

    // Fetch customers and contacts from API
    const fetchCustomers = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setCustomerError('Authentication token not found');
          setIsLoadingCustomers(false);
          return;
        }

        const response = await fetch('https://chikaai.net/api/fusedai/get-all-customers', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'token': token
          }
        });

        const data = await response.json();
        
        if (response.ok) {
          setCustomers(data.customers);
          setCustomerError(null);
        } else {
          setCustomerError(data.message || 'Failed to fetch customers');
        }
      } catch (err) {
        setCustomerError('Failed to fetch customers. Please try again later.');
      } finally {
        setIsLoadingCustomers(false);
      }
    };

    const fetchContacts = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setContactError('Authentication token not found');
          setIsLoadingContacts(false);
          return;
        }

        const response = await fetch('https://chikaai.net/api/fusedai/get-all-contacts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'token': token
          }
        });

        const data = await response.json();
        
        if (response.ok) {
          setContacts(data.contacts);
          setContactError(null);
        } else {
          setContactError(data.message || 'Failed to fetch contacts');
        }
      } catch (err) {
        setContactError('Failed to fetch contacts. Please try again later.');
      } finally {
        setIsLoadingContacts(false);
      }
    };

    fetchCustomers();
    fetchContacts();
  }, []);

  const handleInputChange = (field: string, value: string) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      if (parent === 'contact') {
        setProject(prev => ({
          ...prev,
          contact: {
            ...prev.contact,
            [child]: value
          }
        }));
      }
    } else {
      setProject(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleSaveChanges = async () => {
    try {
      setIsLoading(true);

      const token = localStorage.getItem('token');
      if (!token) {
        toast({
          variant: "destructive",
          title: "Authentication Error",
          description: "Authentication token not found. Please log in again."
        });
        return;
      }

      const response = await fetch('https://chikaai.net/api/fusedai/update-project', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'token': token
        },
        body: JSON.stringify({
          project_id: project.id,
          project_name: project.title,
          project_description: project.description,
          project_status: project.status,
          project_address: project.address,
          project_customer_name: project.company,
          project_contact: project.contact.email || project.contact.phone
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Update session storage with new data
        sessionStorage.setItem('currentProject', JSON.stringify(project));
        
        toast({
          title: "Success",
          description: "Project updated successfully"
        });

        // Navigate back to project details
        router.push(`/projects/${projectId}`);
      } else {
        throw new Error(data.message || 'Failed to update project');
      }
    } catch (error) {
      console.error('Error updating project:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to update project'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.push(`/projects/${projectId}`);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Toaster />
      
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link 
                href={`/projects/${projectId}`}
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Edit Project
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Make changes to your project details
                </p>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm"
        >
          <div className="p-6 space-y-6">
            {/* Project Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Project Name
              </label>
              <input
                type="text"
                value={project.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent"
                placeholder="Enter project name"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={project.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent resize-none"
                placeholder="Enter project description"
              />
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Address
              </label>
              <textarea
                value={project.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent resize-none"
                placeholder="Enter project address"
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <Select value={project.status} onValueChange={(value) => handleInputChange('status', value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="on-hold">On Hold</SelectItem>
                </SelectContent>
              </Select>
            </div>

                                       {/* Customer */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Customer
                </label>
                <Select 
                  value={project.company} 
                  onValueChange={(value) => handleInputChange('company', value)}
                  disabled={isLoadingCustomers}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={isLoadingCustomers ? "Loading..." : "Select customer"} />
                  </SelectTrigger>
                  <SelectContent>
                    {customerError ? (
                      <SelectItem value="_error" disabled>{customerError}</SelectItem>
                    ) : customers.length === 0 ? (
                      <SelectItem value="_empty" disabled>No customers found</SelectItem>
                    ) : customers.map((customer) => (
                      <SelectItem key={customer.customer_id} value={customer.customer_name}>
                        {customer.customer_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

                           {/* Primary Contact */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Primary Contact
                </label>
                <Select 
                  value={project.contact.name} 
                  onValueChange={(value) => {
                    // Find the selected contact and update the contact object
                    const selectedContact = contacts.find(contact => contact.contact_name === value);
                    if (selectedContact) {
                      setProject(prev => ({
                        ...prev,
                        contact: {
                          name: selectedContact.contact_name,
                          email: '', // API doesn't provide email/phone, so we'll keep existing or empty
                          phone: ''
                        }
                      }));
                    }
                  }}
                  disabled={isLoadingContacts}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={isLoadingContacts ? "Loading..." : "Select primary contact"} />
                  </SelectTrigger>
                  <SelectContent>
                    {contactError ? (
                      <SelectItem value="_error" disabled>{contactError}</SelectItem>
                    ) : contacts.length === 0 ? (
                      <SelectItem value="_empty" disabled>No contacts found</SelectItem>
                    ) : contacts.map((contact) => (
                      <SelectItem key={contact.contact_id} value={contact.contact_name}>
                        {contact.contact_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
          </div>

          {/* Action Buttons */}
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600 rounded-b-lg flex items-center justify-end space-x-3">
            <button
              onClick={handleCancel}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveChanges}
              disabled={isLoading}
              className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
