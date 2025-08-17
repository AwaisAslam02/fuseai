'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";

import { FcGoogle } from 'react-icons/fc';
import { FaApple } from 'react-icons/fa';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  // Check session on component mount
  useEffect(() => {
    checkExistingSession();
  }, []);

  const checkExistingSession = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setIsCheckingSession(false);
        return;
      }

      const response = await fetch('https://chikaai.net/api/fusedai/check-session', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'token': token
        }
      });

      const data = await response.json();

      if (response.ok) {
        // Valid session - redirect based on page identifier
        switch (data.page) {
          case 'verify_otp':
            router.push('/verify-otp');
            break;
          case 'plan_selection':
            router.push('/plans');
            break;
          case 'chat_page':
            router.push('/chat');
            break;
          default:
            console.error('Unknown page identifier:', data.page);
            setIsCheckingSession(false);
        }
      } else if (response.status === 401 || data.detail?.includes('401')) {
        // Invalid session - clear storage and stay on login
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
        setIsCheckingSession(false);
      } else {
        // Other errors - just stop checking
        setIsCheckingSession(false);
      }
    } catch (error) {
      console.error('Session check error:', error);
      // Clear storage on error and stay on login
      localStorage.removeItem('token');
      setIsCheckingSession(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('https://chikaai.net/api/fusedai/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || data.message || 'Login failed');
      }

      // Store token in both storages for consistency
      localStorage.setItem('token', data.token);
      sessionStorage.setItem('token', data.token);

      // Show success message
      toast({
        title: "Success",
        description: data.message
      });

      // Handle redirection based on the page identifier
      switch (data.page) {
        case 'verify_otp':
          router.push('/verify-otp');
          break;
        case 'plan_selection':
          router.push('/plans');
          break;
        case 'chat_page':
          router.push('/chat');
          break;
        default:
          console.error('Unknown page identifier:', data.page);
          router.push('/');
      }

    } catch (error) {
      console.error('Login error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to login'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading screen while checking session
  if (isCheckingSession) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Toaster />
      {/* Back Button */}
      <div className="absolute top-6 left-6 z-20">
        <Link href="/" className="flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5 mr-2" />
          <span className="text-sm font-medium">Back</span>
        </Link>
      </div>

      {/* Login Form */}
      <div className="flex items-center justify-center min-h-screen py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        
        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="max-w-sm w-full space-y-6 relative z-10"
        >
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Welcome back
            </h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Sign in to your account to continue
            </p>
          </div>

          <form
            className="mt-6 space-y-4"
            onSubmit={handleSubmit}
          >
            {/* Social Login Buttons */}
            <div className="space-y-3">
              <button
                type="button"
                className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <FcGoogle className="w-5 h-5 mr-3" />
                Continue with Google
              </button>
              
              <button
                type="button"
                className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <FaApple className="w-5 h-5 mr-3" />
                Continue with Apple
              </button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-600" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400">Or continue with</span>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-10 py-2.5 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-gray-600 focus:ring-gray-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <Link href="/forgot-password" className="font-medium text-gray-600 dark:text-gray-400 hover:text-gray-500 dark:hover:text-gray-300">
                  Forgot your password?
                </Link>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-gray-900 dark:bg-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Don't have an account?{' '}
                <Link href="/signup" className="font-medium text-gray-900 dark:text-white hover:text-gray-700 dark:hover:text-gray-300">
                  Sign up
                </Link>
              </p>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}