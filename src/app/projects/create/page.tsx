'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, X } from 'lucide-react';
import Link from 'next/link';
import { ThemeToggle } from '@/components/theme-provider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ProjectForm {
  name: string;
  status: string;
  address: string;
  description: string;
  customer: string;
  primaryContact: string;
}

interface CustomerForm {
  companyName: string;
  industry: string;
  website: string;
  address: string;
}

interface ContactForm {
  firstName: string;
  lastName: string;
  customer: string;
  title: string;
  email: string;
  phone: string;
}



export default function CreateProjectPage() {
  const [formData, setFormData] = useState<ProjectForm>({
    name: '',
    status: 'Active',
    address: '',
    description: '',
    customer: '',
    primaryContact: ''
  });

  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [customerForm, setCustomerForm] = useState<CustomerForm>({
    companyName: '',
    industry: '',
    website: '',
    address: ''
  });
  const [contactForm, setContactForm] = useState<ContactForm>({
    firstName: '',
    lastName: '',
    customer: '',
    title: '',
    email: '',
    phone: ''
  });

  const handleInputChange = (field: keyof ProjectForm, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCustomerInputChange = (field: keyof CustomerForm, value: string) => {
    setCustomerForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleContactInputChange = (field: keyof ContactForm, value: string) => {
    setContactForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Creating project:', formData);
    // Add your project creation logic here
  };

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Creating customer:', customerForm);
    // Add customer creation logic here
    setShowCustomerModal(false);
    setCustomerForm({
      companyName: '',
      industry: '',
      website: '',
      address: ''
    });
    // Show success toast
    alert('Customer created successfully!');
  };

  const handleCreateContact = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Creating contact:', contactForm);
    // Add contact creation logic here
    setShowContactModal(false);
    setContactForm({
      firstName: '',
      lastName: '',
      customer: '',
      title: '',
      email: '',
      phone: ''
    });
    // Show success toast
    alert('Contact created successfully!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="border-b border-gray-200/50 dark:border-gray-700/50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link 
                href="/chat" 
                className="flex items-center space-x-3 px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 group"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors" />
                <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">Create Project</h1>
              </Link>
            </div>
            <div className="flex items-center space-x-3">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-5"
        >
          <div className="mb-5 text-center">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Create New Project
            </h2>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              Start a new project to organize documents, quotes, and AI conversations.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Project Name and Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="space-y-2"
              >
                                 <label htmlFor="name" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                   Project Name *
                 </label>
                 <div className="relative">
                   <input
                     type="text"
                     id="name"
                     value={formData.name}
                     onChange={(e) => handleInputChange('name', e.target.value)}
                     className="w-full px-3 py-2.5 border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200 placeholder-gray-400 dark:placeholder-gray-500"
                     placeholder="Enter project name"
                     required
                   />

                 </div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-2"
              >
                                 <label htmlFor="status" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                   Status
                 </label>
                 <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                   <SelectTrigger className="w-full">
                     <SelectValue placeholder="Select status" />
                   </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="Active">Active</SelectItem>
                     <SelectItem value="Inactive">Inactive</SelectItem>
                     <SelectItem value="Completed">Completed</SelectItem>
                     <SelectItem value="On Hold">On Hold</SelectItem>
                   </SelectContent>
                 </Select>
              </motion.div>
            </div>

            {/* Project Address */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-2"
            >
                             <label htmlFor="address" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                 Project Address
               </label>
               <div className="relative">
                 <input
                   type="text"
                   id="address"
                   value={formData.address}
                   onChange={(e) => handleInputChange('address', e.target.value)}
                   className="w-full px-3 py-2.5 border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200 placeholder-gray-400 dark:placeholder-gray-500"
                   placeholder="Enter project address (optional)"
                 />
                 
               </div>
            </motion.div>

            {/* Project Description */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-2"
            >
                             <label htmlFor="description" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                 Description
               </label>
               <textarea
                 id="description"
                 value={formData.description}
                 onChange={(e) => handleInputChange('description', e.target.value)}
                 rows={2}
                 className="w-full px-3 py-2.5 border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200 placeholder-gray-400 dark:placeholder-gray-500 resize-none"
                 placeholder="Describe the project scope and objectives"
               />
            </motion.div>

            {/* Customer */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="space-y-2"
            >
                             <label htmlFor="customer" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                 Customer
               </label>
               <div className="flex space-x-2">
                 <div className="flex-1">
                   <Select value={formData.customer} onValueChange={(value) => handleInputChange('customer', value)}>
                     <SelectTrigger className="w-full">
                       <SelectValue placeholder="Select customer" />
                     </SelectTrigger>
                     <SelectContent>
                       <SelectItem value="Test Company Customer">Test Company Customer</SelectItem>
                       <SelectItem value="Acme Corporation">Acme Corporation</SelectItem>
                       <SelectItem value="Global Industries">Global Industries</SelectItem>
                     </SelectContent>
                   </Select>
                 </div>
                 <button
                   type="button"
                   onClick={() => setShowCustomerModal(true)}
                   className="px-2.5 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm"
                 >
                   + Create New
                 </button>
               </div>
            </motion.div>

            {/* Primary Contact */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="space-y-2"
            >
                             <label htmlFor="primaryContact" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                 Primary Contact
               </label>
               <div className="flex space-x-2">
                 <div className="flex-1">
                   <Select value={formData.primaryContact} onValueChange={(value) => handleInputChange('primaryContact', value)}>
                     <SelectTrigger className="w-full">
                       <SelectValue placeholder="Select contact" />
                     </SelectTrigger>
                     <SelectContent>
                       <SelectItem value="John Doe">John Doe</SelectItem>
                       <SelectItem value="Jane Smith">Jane Smith</SelectItem>
                       <SelectItem value="Mike Johnson">Mike Johnson</SelectItem>
                     </SelectContent>
                   </Select>
                 </div>
                 <button
                   type="button"
                   onClick={() => setShowContactModal(true)}
                   className="px-2.5 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm"
                 >
                   + Create New
                 </button>
               </div>
            </motion.div>



            {/* Submit Button */}
                         <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.7 }}
               className="flex justify-end space-x-3 pt-6"
             >
               <Link
                 href="/chat"
                 className="px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors text-sm"
               >
                 Cancel
               </Link>
               <button
                 type="submit"
                 className="px-3 py-2 bg-black hover:bg-gray-800 text-white rounded transition-colors text-sm font-medium"
               >
                 <span>Create Project</span>
               </button>
             </motion.div>
          </form>
        </motion.div>
      </div>

      {/* Customer Creation Modal */}
      <AnimatePresence>
        {showCustomerModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowCustomerModal(false)}
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
                  Create New Customer
                </h3>
                <button
                  onClick={() => setShowCustomerModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
                Add a new customer to your project.
              </p>

              <form onSubmit={handleCreateCustomer} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    value={customerForm.companyName}
                    onChange={(e) => handleCustomerInputChange('companyName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Enter company name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Industry
                  </label>
                  <input
                    type="text"
                    value={customerForm.industry}
                    onChange={(e) => handleCustomerInputChange('industry', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Enter industry"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Website
                  </label>
                  <input
                    type="url"
                    value={customerForm.website}
                    onChange={(e) => handleCustomerInputChange('website', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Enter website URL"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Address
                  </label>
                  <input
                    type="text"
                    value={customerForm.address}
                    onChange={(e) => handleCustomerInputChange('address', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Enter billing address"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCustomerModal(false)}
                    className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors text-sm font-medium"
                  >
                    Create Customer
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Contact Creation Modal */}
      <AnimatePresence>
        {showContactModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowContactModal(false)}
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
                  Create New Contact
                </h3>
                <button
                  onClick={() => setShowContactModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
                Add a new contact to your project.
              </p>

              <form onSubmit={handleCreateContact} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      First Name *
                    </label>
                    <input
                      type="text"
                      value={contactForm.firstName}
                      onChange={(e) => handleContactInputChange('firstName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="First name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      value={contactForm.lastName}
                      onChange={(e) => handleContactInputChange('lastName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Last name"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Customer *
                  </label>
                  <Select value={contactForm.customer} onValueChange={(value) => handleContactInputChange('customer', value)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Test Company Customer">Test Company Customer</SelectItem>
                      <SelectItem value="Acme Corporation">Acme Corporation</SelectItem>
                      <SelectItem value="Global Industries">Global Industries</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={contactForm.title}
                    onChange={(e) => handleContactInputChange('title', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Job title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={contactForm.email}
                    onChange={(e) => handleContactInputChange('email', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Enter email"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={contactForm.phone}
                    onChange={(e) => handleContactInputChange('phone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Enter phone number"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowContactModal(false)}
                    className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors text-sm font-medium"
                  >
                    Create Contact
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 