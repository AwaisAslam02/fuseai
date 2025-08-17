'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Check, Star, Zap, Crown } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ThemeToggle } from '@/components/theme-provider';
import Navbar from '@/components/navbar';
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";

export default function PlansPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const plans = [
    {
      id: 'starter',
      name: 'Starter',
      price: 'Free',
      period: 'forever',
      description: 'Perfect for individuals and small teams getting started',
      features: [
        'Up to 50 quotes per month',
        'Basic AI models',
        'Email support',
        'Standard templates',
        'Basic analytics'
      ],
      icon: Star,
      popular: false,
      buttonText: 'Get Started',
      buttonAction: () => router.push('/chat'),
      message_limit: 50
    },
    {
      id: 'professional',
      name: 'Professional',
      price: '$50',
      period: 'per month',
      description: 'Ideal for growing businesses and professional services',
      features: [
        'Unlimited quotes',
        'Advanced AI models (GPT-4, Claude)',
        'Priority support',
        'Custom templates',
        'Advanced analytics',
        'Team collaboration',
        'API access',
        'White-label options'
      ],
      icon: Zap,
      popular: true,
      buttonText: 'Start Free Trial',
      buttonAction: () => router.push('/chat'),
      message_limit: 1000
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 'Custom',
      period: 'contact us',
      description: 'For large organizations with specific requirements',
      features: [
        'Everything in Professional',
        'Dedicated account manager',
        'Custom integrations',
        'On-premise deployment',
        'Advanced security',
        'SLA guarantees',
        'Custom training',
        '24/7 phone support'
      ],
      icon: Crown,
      popular: false,
      buttonText: 'Contact Sales',
      buttonAction: () => window.open('mailto:sales@fusedai.com', '_blank'),
      message_limit: 1000
    }
  ];

  const handlePlanSelect = (planId: string) => {
    setSelectedPlan(planId);
  };

  const handleContinue = async () => {
    if (!selectedPlan) return;
    
    setIsLoading(true);
    const plan = plans.find(p => p.id === selectedPlan);
    
    try {
      // Get token from session storage
      const token = localStorage.getItem('token');
      if (!token) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Invalid token"
        });
        window.location.href = '/login';
        return;
      }

      if (plan) {
        // Convert price to float
        const priceToFloat = (price: string): number => {
          if (price === 'Free' || price === 'Custom') return 0.0;
          // Remove '$' and convert to float
          return parseFloat(price.replace('$', ''));
        };

        // Prepare plan data
        const planData = {
          plan_name: plan.name,
          plan_type: plan.id,
          plan_price: priceToFloat(plan.price),
          message_limit: plan.message_limit
        };

        // Make API call
        const response = await fetch('https://chikaai.net/api/fusedai/plan-selection', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'token': `${token}`
          },
          body: JSON.stringify(planData)
        });

        const data = await response.json();

        // Check for 401 error
        if (response.status === 401 || (data.detail && data.detail.includes('401'))) {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Invalid token"
          });
          localStorage.removeItem('token');
          window.location.href = '/login';
          return;
        }

        if (!response.ok) {
          throw new Error(data.detail || data.message || 'Failed to select plan');
        }

        // Show success message
        toast({
          title: "Success",
          description: "Plan selected successfully"
        });

        // Redirect to appropriate page based on plan
        plan.buttonAction();
      }
    } catch (error) {
      console.error('Plan selection error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to select plan'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Toaster />
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
          className="max-w-6xl w-full space-y-8 relative z-10"
        >
          {/* Header */}
          <div className="text-center">
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4"
            >
              Choose Your Plan
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto"
            >
              Select the perfect plan for your business needs. All plans include a 14-day free trial.
            </motion.p>
          </div>

          {/* Plans Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8"
          >
            {plans.map((plan, index) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 + index * 0.1 }}
                className={`relative p-6 lg:p-8 bg-white dark:bg-gray-800 rounded-xl border-2 transition-all duration-300 cursor-pointer ${
                  selectedPlan === plan.id
                    ? 'border-gray-900 dark:border-white shadow-lg scale-105'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
                onClick={() => handlePlanSelect(plan.id)}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute -top-3 left-1/2 transform -translate-x-1/2"
                  >
                    <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                      Most Popular
                    </span>
                  </motion.div>
                )}

                {/* Plan Icon */}
                <div className="flex items-center justify-center w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg mb-4">
                  <plan.icon className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                </div>

                {/* Plan Name */}
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  {plan.name}
                </h3>

                {/* Price */}
                <div className="mb-4">
                  <span className="text-3xl font-bold text-gray-900 dark:text-white">
                    {plan.price}
                  </span>
                  <span className="text-gray-600 dark:text-gray-400 ml-1">
                    /{plan.period}
                  </span>
                </div>

                {/* Description */}
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  {plan.description}
                </p>

                {/* Features */}
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, featureIndex) => (
                    <motion.li
                      key={featureIndex}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.7 + index * 0.1 + featureIndex * 0.05 }}
                      className="flex items-center space-x-3"
                    >
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        {feature}
                      </span>
                    </motion.li>
                  ))}
                </ul>

                {/* Selection Indicator */}
                {selectedPlan === plan.id && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute top-4 right-4 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center"
                  >
                    <Check className="w-4 h-4 text-white" />
                  </motion.div>
                )}
              </motion.div>
            ))}
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
              disabled={!selectedPlan || isLoading}
              className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-gray-800 dark:hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              {isLoading ? 'Processing...' : 'Continue with Selected Plan'}
            </button>
            
            <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
              You can change your plan at any time from your account settings.
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
} 