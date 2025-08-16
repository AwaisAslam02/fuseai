'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Building2, 
  Phone, 
  Mail, 
  MapPin,
  User,
  Upload,
  Info,
  Settings,
  FileText,
  ChevronDown
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CustomerInfo {
  companyName: string;
  phone: string;
  projectName: string;
  address: string;
  contactName: string;
  email: string;
}

export default function QuotesPage() {
  const [activeTab, setActiveTab] = useState('Customer Setup');
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>(() => {
    if (typeof window !== 'undefined') {
      const storedProject = sessionStorage.getItem('currentProject');
      if (storedProject) {
        const projectData = JSON.parse(storedProject);
        return {
          companyName: projectData.company || '',
          phone: projectData.contact?.phone || '',
          projectName: projectData.title || '',
          address: projectData.address || '',
          contactName: projectData.contact?.name || '',
          email: projectData.contact?.email || ''
        };
      }
    }
    return {
      companyName: '',
      phone: '',
      projectName: '',
      address: '',
      contactName: '',
      email: ''
    };
  });

  const tabs = [
    { id: 'Customer Setup', icon: User },
    { id: 'BOM Items', icon: FileText },
    { id: 'Labor Types', icon: Settings },
    { id: 'Custom Items', icon: FileText },
    { id: 'Preview & Generate', icon: FileText }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-4 overflow-x-auto py-3">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    isActive
                      ? 'bg-black dark:bg-white text-white dark:text-black'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.id}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'Customer Setup' && (
          <div className="space-y-6">
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
                      value={customerInfo.companyName}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, companyName: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Phone</label>
                    <input
                      type="tel"
                      value={customerInfo.phone}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Project Name</label>
                    <input
                      type="text"
                      value={customerInfo.projectName}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, projectName: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Address</label>
                    <input
                      type="text"
                      value={customerInfo.address}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, address: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Contact Name</label>
                    <input
                      type="text"
                      value={customerInfo.contactName}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, contactName: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
                    <input
                      type="email"
                      value={customerInfo.email}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent"
                    />
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
          </div>
        )}
      </div>
    </div>
  );
}
