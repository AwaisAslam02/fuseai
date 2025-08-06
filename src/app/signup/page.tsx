'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, User, ArrowLeft, Check } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { FcGoogle } from 'react-icons/fc';
import { FaApple } from 'react-icons/fa';

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Add signup logic here
    setTimeout(() => {
      setIsLoading(false);
      router.push('/verify-otp');
    }, 1000);
  };

  const passwordRequirements = [
    { text: 'At least 8 characters', met: formData.password.length >= 8 },
    { text: 'One uppercase letter', met: /[A-Z]/.test(formData.password) },
    { text: 'One lowercase letter', met: /[a-z]/.test(formData.password) },
    { text: 'One number', met: /\d/.test(formData.password) }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Back Button */}
      <div className="absolute top-6 left-6 z-20">
        <Link href="/" className="flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5 mr-2" />
          <span className="text-sm font-medium">Back</span>
        </Link>
      </div>

      {/* Signup Form */}
      <div className="flex items-center justify-center min-h-screen py-6 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
          
          {/* Content */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="max-w-sm w-full space-y-5 relative z-10"
          >
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Create your account
            </h2>
          </div>

          <form
            className="mt-5 space-y-3"
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

                          <div className="space-y-2">
                               <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    First name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                                         <input
                       id="firstName"
                       name="firstName"
                       type="text"
                       autoComplete="given-name"
                       required
                       value={formData.firstName}
                       onChange={handleChange}
                       className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
                       placeholder="First name"
                     />
                  </div>
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Last name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                                         <input
                       id="lastName"
                       name="lastName"
                       type="text"
                       autoComplete="family-name"
                       required
                       value={formData.lastName}
                       onChange={handleChange}
                       className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
                       placeholder="Last name"
                     />
                  </div>
                </div>
              </div>

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
                    value={formData.email}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
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
                    autoComplete="new-password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-10 py-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
                    placeholder="Create a password"
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
                
                {/* Password Requirements */}
                {formData.password && (
                  <div className="mt-2 space-y-1">
                    {passwordRequirements.map((req, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Check className={`w-4 h-4 ${req.met ? 'text-green-500' : 'text-gray-400'}`} />
                        <span className={`text-xs ${req.met ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                          {req.text}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Confirm password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-10 py-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
                    placeholder="Confirm your password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center">
              <input
                id="agree-terms"
                name="agree-terms"
                type="checkbox"
                required
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="h-4 w-4 text-gray-600 focus:ring-gray-500 border-gray-300 rounded"
              />
              <label htmlFor="agree-terms" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                I agree to the{' '}
                <Link href="/terms" className="font-medium text-gray-900 dark:text-white hover:text-gray-700 dark:hover:text-gray-300">
                  Terms of Service
                </Link>
                {' '}and{' '}
                <Link href="/privacy" className="font-medium text-gray-900 dark:text-white hover:text-gray-700 dark:hover:text-gray-300">
                  Privacy Policy
                </Link>
              </label>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading || !agreedToTerms}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-gray-900 dark:bg-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? 'Creating account...' : 'Create account'}
              </button>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Already have an account?{' '}
                <Link href="/login" className="font-medium text-gray-900 dark:text-white hover:text-gray-700 dark:hover:text-gray-300">
                  Sign in
                </Link>
              </p>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
} 