'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  Upload, 
  Brain, 
  Users, 
  FileText, 
  Zap, 
  Sparkles, 
  TrendingUp, 
  BarChart3,
  Menu,
  X,
  Check,
  Calculator,
  Shield,
  Clock,
  DollarSign,
  ArrowRight,
  Star,
  ChevronDown
} from 'lucide-react';
import { 
  FaHardHat, 
  FaBolt, 
  FaSnowflake, 
  FaWrench, 
  FaNetworkWired, 
  FaShieldAlt 
} from 'react-icons/fa';
import { ThemeToggle } from '@/components/theme-provider';
import Particles from '@/components/particles';
import TextCycler from '@/components/text-cycler';
import AIChat from '@/components/aichat';
import AIChatWrapper from '@/components/ai-chat-wrapper';
import { useTheme } from '@/components/theme-provider';
import Navbar from '@/components/navbar';

export default function Home() {
  const { theme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedIndustry, setSelectedIndustry] = useState('construction');
  const [monthlyQuotes, setMonthlyQuotes] = useState(50);
  const [showROI, setShowROI] = useState(false);

  const industries = [
    { id: 'construction', name: 'Construction', icon: FaHardHat, color: 'bg-gray-100 dark:bg-gray-800' },
    { id: 'electrical', name: 'Electrical', icon: FaBolt, color: 'bg-gray-100 dark:bg-gray-800' },
    { id: 'hvac', name: 'HVAC', icon: FaSnowflake, color: 'bg-gray-100 dark:bg-gray-800' },
    { id: 'plumbing', name: 'Plumbing', icon: FaWrench, color: 'bg-gray-100 dark:bg-gray-800' },
    { id: 'networking', name: 'Networking', icon: FaNetworkWired, color: 'bg-gray-100 dark:bg-gray-800' },
    { id: 'security', name: 'Security', icon: FaShieldAlt, color: 'bg-gray-100 dark:bg-gray-800' },
  ];

  const features = [
    {
      icon: Brain,
      title: 'AI-Driven Document Analysis',
      description: 'Automatically extract and analyze project specifications, blueprints, and requirements with 99% accuracy using advanced NLP models.'
    },
    {
      icon: Calculator,
      title: 'Intelligent BOM & Labor Estimation',
      description: 'Generate detailed bills of materials and labor estimates based on industry standards and project scope using ML algorithms.'
    },
    {
      icon: FileText,
      title: 'Professional Quote Generation',
      description: 'Create polished, professional quotes in minutes with customizable templates and branding powered by GPT models.'
    },
    {
      icon: Shield,
      title: 'Multi-Model AI Architecture',
      description: 'Leverages GPT-4, Claude, and specialized industry models for optimal accuracy and comprehensive analysis.'
    },
    {
      icon: TrendingUp,
      title: 'Real-time Market Analysis',
      description: 'AI-powered price optimization using real-time market data and competitor analysis for competitive quotes.'
    },
    {
      icon: Users,
      title: 'Collaborative AI Workflow',
      description: 'Human-in-the-loop AI system that learns from your decisions and improves accuracy over time.'
    }
  ];

  const calculateROI = () => {
    const timeSaved = monthlyQuotes * 5.5; // 6 hours - 30 minutes = 5.5 hours
    const costSaved = timeSaved * 75; // Assuming $75/hour average rate
    return { timeSaved, costSaved };
  };

  const { timeSaved, costSaved } = calculateROI();

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Navbar />
      
      {/* Hero Section - Divided into 2 Cards */}
      <section className="py-16 sm:py-12 lg:py-16 bg-white dark:bg-gray-900 relative overflow-hidden">
        <Particles />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col lg:grid lg:grid-cols-2 gap-6 lg:gap-8 items-center">
            
            {/* Text Content Card */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="p-4 sm:p-6 lg:p-8 order-1"
            >
              <div className="space-y-4 sm:space-y-6">
                <div>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 mb-4"
                  >
                    <Sparkles className="w-3 h-3 mr-2" />
                    AI-Powered Platform
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                    className="mb-4"
                  >
                    <TextCycler
                      texts={[
                        "Fused with GPT-4 & Claude AI",
                        "Multi-Model AI Architecture",
                        "Real-time Market Intelligence",
                        "99% Accuracy Guaranteed",
                        "Industry-Specific AI Models",
                        "Human-in-the-Loop AI"
                      ]}
                      interval={3000}
                      duration={500}
                      letterDelay={0.03}
                      blurStrength={8}
                      autoplay={true}
                    />
                    <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-600 dark:text-gray-300 mt-2">
                      You Decide, AI Assists
                    </div>
                  </motion.div>
                </div>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                  className="text-base sm:text-lg text-gray-600 dark:text-gray-300"
                >
                  FusedAI is a modern AI-powered quote generation platform that enables you to effortlessly create professional quotes with intelligent automation, with all the analysis and calculations handled for you.
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.5 }}
                  className="flex flex-col sm:flex-row gap-3"
                >
                  <Link href="/signup" className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-6 py-3 rounded-md hover:bg-gray-800 dark:hover:bg-gray-100 font-semibold text-sm transition-colors text-center">
                    Get Started
                  </Link>
                  <button className="border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white px-6 py-3 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 font-semibold text-sm transition-colors">
                    See Live Demo
                  </button>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.6 }}
                  className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-6 pt-4"
                >
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Trusted by 500+ companies</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">99.9% uptime</span>
                  </div>
                </motion.div>
              </div>
            </motion.div>

            {/* AIChat Animation Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="p-4 sm:p-6 lg:p-8 order-2 lg:order-2"
            >
              <div className="relative h-64 sm:h-80 lg:h-96">
                <AIChat
                  name="FusedAI"
                  description="FusedAI is a modern AI-powered quote generation platform that enables you to effortlessly create professional quotes with intelligent automation, with all the analysis and calculations handled for you."
                  theme={theme}
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-12 sm:py-16 lg:py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4"
            >
              Powerful Features for Professional Services
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto"
            >
              Leverage cutting-edge AI models including GPT-4, Claude, and specialized industry algorithms to deliver exceptional results.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-gray-50 dark:bg-gray-800 p-6 sm:p-8 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Industries Section */}
      <section id="industries" className="py-12 sm:py-16 lg:py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4"
            >
              Trusted Across Industries
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto"
            >
              Our AI-powered platform is designed to meet the unique needs of professional service businesses.
            </motion.p>
          </div>

          <div className="relative overflow-hidden">
            <motion.div
              className="flex space-x-12 sm:space-x-16 lg:space-x-20"
              animate={{
                x: [0, -1200],
              }}
              transition={{
                duration: 25,
                repeat: Infinity,
                ease: "linear"
              }}
            >
              {/* First set of industries */}
              {industries.map((industry, index) => (
                <motion.button
                  key={`first-${industry.id}`}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  onClick={() => setSelectedIndustry(industry.id)}
                  className={`p-4 sm:p-6 rounded-lg border-2 transition-all duration-200 flex-shrink-0 ${
                    selectedIndustry === industry.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="text-center">
                    <div className={`w-12 h-12 ${industry.color} rounded-lg flex items-center justify-center mx-auto mb-3`}>
                      <industry.icon className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                    </div>
                    <p className="text-sm sm:text-base font-medium text-gray-900 dark:text-white">
                      {industry.name}
                    </p>
                  </div>
                </motion.button>
              ))}
              
              {/* Duplicate set for seamless loop */}
              {industries.map((industry, index) => (
                <motion.button
                  key={`second-${industry.id}`}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  onClick={() => setSelectedIndustry(industry.id)}
                  className={`p-4 sm:p-6 rounded-lg border-2 transition-all duration-200 flex-shrink-0 ${
                    selectedIndustry === industry.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="text-center">
                    <div className={`w-12 h-12 ${industry.color} rounded-lg flex items-center justify-center mx-auto mb-3`}>
                      <industry.icon className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                    </div>
                    <p className="text-sm sm:text-base font-medium text-gray-900 dark:text-white">
                      {industry.name}
                    </p>
                  </div>
                </motion.button>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Trust & Credibility Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4"
            >
              Trust & Security
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto"
            >
              Your business documents are protected with enterprise-grade security and privacy.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="bg-white dark:bg-gray-900 p-6 sm:p-8 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm text-center"
            >
              <Shield className="w-12 h-12 text-green-600 dark:text-green-400 mx-auto mb-4" />
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-3">
                Enterprise Security
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base">
                Bank-level encryption and security protocols protect your sensitive business data.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-white dark:bg-gray-900 p-6 sm:p-8 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm text-center"
            >
              <Clock className="w-12 h-12 text-blue-600 dark:text-blue-400 mx-auto mb-4" />
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-3">
                99.9% Uptime
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base">
                Reliable service with guaranteed uptime for your critical business operations.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="bg-white dark:bg-gray-900 p-6 sm:p-8 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm text-center sm:col-span-2 lg:col-span-1"
            >
              <DollarSign className="w-12 h-12 text-purple-600 dark:text-purple-400 mx-auto mb-4" />
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-3">
                Cost Effective
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base">
                Reduce operational costs while increasing efficiency and accuracy.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ROI Calculator Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-white dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4"
            >
              Calculate Your Savings
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg text-gray-600 dark:text-gray-300"
            >
              See how much time and money you can save with FusedAI.
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="bg-gray-50 dark:bg-gray-800 p-6 sm:p-8 rounded-lg border border-gray-200 dark:border-gray-700"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Number of Quotes per Month
                </label>
                <input
                  type="range"
                  min="10"
                  max="200"
                  value={monthlyQuotes}
                  onChange={(e) => setMonthlyQuotes(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <span>10</span>
                  <span className="font-medium text-gray-900 dark:text-white">{monthlyQuotes}</span>
                  <span>200</span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Time Saved</span>
                    <span className="text-lg font-semibold text-green-600 dark:text-green-400">
                      {timeSaved.toFixed(0)} hours/month
                    </span>
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Cost Saved</span>
                    <span className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                      ${costSaved.toLocaleString()}/month
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 sm:mt-8 text-center">
              <button className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-8 py-3 rounded-md hover:bg-gray-800 dark:hover:bg-gray-100 font-semibold text-sm transition-colors">
                Start Free Trial
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-12 sm:py-16 lg:py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4"
            >
              Simple, Transparent Pricing
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto"
            >
              Choose the plan that fits your business needs. All plans include our core AI-powered features.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Starter Plan */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="bg-white dark:bg-gray-900 p-6 sm:p-8 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow flex flex-col"
            >
              <div className="text-center mb-6">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2">Starter</h3>
                <div className="mb-4">
                  <span className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">Free</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Perfect for small businesses</p>
              </div>

              <ul className="space-y-3 mb-8 flex-grow">
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-600 dark:text-green-400 mr-3 flex-shrink-0" />
                  <span className="text-sm text-gray-600 dark:text-gray-300">Up to 50 quotes per month</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-600 dark:text-green-400 mr-3 flex-shrink-0" />
                  <span className="text-sm text-gray-600 dark:text-gray-300">AI document analysis</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-600 dark:text-green-400 mr-3 flex-shrink-0" />
                  <span className="text-sm text-gray-600 dark:text-gray-300">Basic quote templates</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-600 dark:text-green-400 mr-3 flex-shrink-0" />
                  <span className="text-sm text-gray-600 dark:text-gray-300">Email support</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-600 dark:text-green-400 mr-3 flex-shrink-0" />
                  <span className="text-sm text-gray-600 dark:text-gray-300">Standard integrations</span>
                </li>
              </ul>

              <button className="w-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 py-3 px-6 rounded-md hover:bg-gray-800 dark:hover:bg-gray-100 font-semibold text-sm transition-colors mt-auto">
                Get Started
              </button>
            </motion.div>

            {/* Professional Plan */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-white dark:bg-gray-900 p-6 sm:p-8 rounded-lg border-2 border-blue-500 shadow-lg relative flex flex-col"
            >
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-xs font-semibold">Most Popular</span>
              </div>
              
              <div className="text-center mb-6">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2">Professional</h3>
                <div className="mb-4">
                  <span className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">$50</span>
                  <span className="text-gray-600 dark:text-gray-400">/month</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Ideal for growing businesses</p>
              </div>

              <ul className="space-y-3 mb-8 flex-grow">
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-600 dark:text-green-400 mr-3 flex-shrink-0" />
                  <span className="text-sm text-gray-600 dark:text-gray-300">Up to 200 quotes per month</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-600 dark:text-green-400 mr-3 flex-shrink-0" />
                  <span className="text-sm text-gray-600 dark:text-gray-300">Advanced AI models (GPT-4, Claude)</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-600 dark:text-green-400 mr-3 flex-shrink-0" />
                  <span className="text-sm text-gray-600 dark:text-gray-300">Custom quote templates</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-600 dark:text-green-400 mr-3 flex-shrink-0" />
                  <span className="text-sm text-gray-600 dark:text-gray-300">Priority support</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-600 dark:text-green-400 mr-3 flex-shrink-0" />
                  <span className="text-sm text-gray-600 dark:text-gray-300">Advanced integrations</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-600 dark:text-green-400 mr-3 flex-shrink-0" />
                  <span className="text-sm text-gray-600 dark:text-gray-300">Real-time market analysis</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-600 dark:text-green-400 mr-3 flex-shrink-0" />
                  <span className="text-sm text-gray-600 dark:text-gray-300">Team collaboration</span>
                </li>
              </ul>

              <button className="w-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 py-3 px-6 rounded-md hover:bg-gray-800 dark:hover:bg-gray-100 font-semibold text-sm transition-colors mt-auto">
                Get Started
              </button>
            </motion.div>

            {/* Enterprise Plan */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="bg-white dark:bg-gray-900 p-6 sm:p-8 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow flex flex-col"
            >
              <div className="text-center mb-6">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2">Enterprise</h3>
                <div className="mb-4">
                  <span className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">Custom</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">For large organizations</p>
              </div>

              <ul className="space-y-3 mb-8 flex-grow">
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-600 dark:text-green-400 mr-3 flex-shrink-0" />
                  <span className="text-sm text-gray-600 dark:text-gray-300">Unlimited quotes</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-600 dark:text-green-400 mr-3 flex-shrink-0" />
                  <span className="text-sm text-gray-600 dark:text-gray-300">Custom AI model training</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-600 dark:text-green-400 mr-3 flex-shrink-0" />
                  <span className="text-sm text-gray-600 dark:text-gray-300">White-label solutions</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-600 dark:text-green-400 mr-3 flex-shrink-0" />
                  <span className="text-sm text-gray-600 dark:text-gray-300">Dedicated account manager</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-600 dark:text-green-400 mr-3 flex-shrink-0" />
                  <span className="text-sm text-gray-600 dark:text-gray-300">Custom integrations</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-600 dark:text-green-400 mr-3 flex-shrink-0" />
                  <span className="text-sm text-gray-600 dark:text-gray-300">Advanced analytics</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-600 dark:text-green-400 mr-3 flex-shrink-0" />
                  <span className="text-sm text-gray-600 dark:text-gray-300">SLA guarantees</span>
                </li>
              </ul>

              <button className="w-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 py-3 px-6 rounded-md hover:bg-gray-800 dark:hover:bg-gray-100 font-semibold text-sm transition-colors mt-auto">
                Contact Sales
              </button>
            </motion.div>
          </div>


        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 dark:bg-gray-950 text-white py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">FusedAI</h3>
              <p className="text-gray-400 text-sm">
                AI-powered quote generation for professional service businesses.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Cookie Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center">
            <p className="text-sm text-gray-400">
              © 2024 FusedAI. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
