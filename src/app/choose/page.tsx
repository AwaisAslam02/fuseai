'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Folder, MessageSquare, ArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ThemeToggle } from '@/components/theme-provider';
import Navbar from '@/components/navbar';

export default function ChoosePage() {
  const router = useRouter();
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const options = [
    {
      id: 'chat',
      title: 'Start Chatting Instantly',
      description: 'Jump right into conversation with our AI assistants. Perfect for quick questions, brainstorming, or getting immediate help.',
      icon: MessageSquare,
      color: 'from-blue-500 to-purple-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      borderColor: 'border-blue-200 dark:border-blue-700',
      hoverColor: 'hover:border-blue-300 dark:hover:border-blue-600',
      action: () => router.push('/chat')
    },
    {
      id: 'project',
      title: 'Create a Project',
      description: 'Set up a new project to organize your work, collaborate with your team, and manage your AI-powered workflows.',
      icon: Folder,
      color: 'from-green-500 to-emerald-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      borderColor: 'border-green-200 dark:border-green-700',
      hoverColor: 'hover:border-green-300 dark:hover:border-green-600',
      action: () => router.push('/projects/create')
    }
  ];

  const handleOptionSelect = (optionId: string) => {
    setSelectedOption(optionId);
  };

  const handleContinue = async () => {
    if (!selectedOption) return;
    
    setIsLoading(true);
    const option = options.find(o => o.id === selectedOption);
    
    if (option) {
      // Simulate processing
      setTimeout(() => {
        setIsLoading(false);
        option.action();
      }, 800);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Navbar />
      


      {/* Theme Toggle */}
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>

      {/* Main Content */}
      <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        
        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl w-full space-y-8 relative z-10"
        >
          {/* Header */}
          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
              className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-6"
            >
              <Sparkles className="w-8 h-8 text-white" />
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4"
            >
              What would you like to do?
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto"
            >
              Choose how you'd like to get started with FusedAI
            </motion.p>
          </div>

          {/* Options Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 max-w-4xl mx-auto"
          >
            {options.map((option, index) => {
              const IconComponent = option.icon;
              return (
                <motion.div
                  key={option.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.6 + index * 0.1 }}
                  className={`relative p-8 bg-white dark:bg-gray-800 rounded-2xl border-2 transition-all duration-300 cursor-pointer ${
                    selectedOption === option.id
                      ? `${option.borderColor} shadow-lg scale-105`
                      : `${option.borderColor} ${option.hoverColor}`
                  }`}
                  onClick={() => handleOptionSelect(option.id)}
                >
                  {/* Selection Indicator */}
                  {selectedOption === option.id && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg"
                    >
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </motion.div>
                  )}

                  {/* Option Icon */}
                  <div className={`w-16 h-16 bg-gradient-to-r ${option.color} rounded-2xl flex items-center justify-center mb-6`}>
                    <IconComponent className="w-8 h-8 text-white" />
                  </div>

                  {/* Option Title */}
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    {option.title}
                  </h3>

                  {/* Option Description */}
                  <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                    {option.description}
                  </p>

                  {/* Arrow Indicator */}
                  <div className="flex items-center text-gray-500 dark:text-gray-400">
                    <span className="text-sm font-medium">Click to select</span>
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Continue Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="text-center"
          >
            <button
              onClick={handleContinue}
              disabled={!selectedOption || isLoading}
              className="bg-gradient-to-r from-gray-900 to-gray-800 dark:from-white dark:to-gray-100 text-white dark:text-gray-900 px-8 py-4 rounded-xl font-semibold text-lg hover:from-gray-800 hover:to-gray-700 dark:hover:from-gray-100 dark:hover:to-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2 mx-auto"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white dark:border-gray-900 border-t-transparent rounded-full animate-spin"></div>
                  <span>Loading...</span>
                </>
              ) : (
                <>
                  <span>Continue</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
            
            <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
              You can always switch between these options later from your dashboard.
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
} 