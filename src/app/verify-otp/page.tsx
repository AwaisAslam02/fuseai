'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Mail, CheckCircle, Shield, Clock, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";

import { ThemeToggle } from '@/components/theme-provider';
import Navbar from '@/components/navbar';

export default function VerifyOTPPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Add useEffect for cooldown timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown(prev => prev - 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [resendCooldown]);

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return; // Only allow single digit
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    if (otp.join('').length !== 6) return;
    
    setIsLoading(true);
    
    try {
      // Get token from session storage
      const token = localStorage.getItem('token');
      if (!token) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Authentication token not found. Please login again."
        });
        router.push('/login');
        return;
      }

      // Make API call
      const response = await fetch('http://localhost:8000/api/fusedai/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'token': `${token}`
        },
        body: JSON.stringify({
          otp: parseInt(otp.join(''), 10)
        })
      });

      const data = await response.json();

      // Check for both direct 401 status and error message containing 401
      if (response.status === 401 || (data.detail && data.detail.includes('401'))) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Invalid token"
        });
        // Clear the token from session storage
        localStorage.removeItem('token');
        // Force redirect to login
        window.location.href = '/login';
        return;
      }

      if (!response.ok) {
        throw new Error(data.detail || data.message || 'Failed to verify OTP');
      }

      // Show success message
      toast({
        title: "Success",
        description: "OTP verified successfully"
      });

      setIsVerified(true);
    } catch (error) {
      console.error('OTP verification error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to verify OTP'
      });
      setIsVerified(false);
    } finally {
      setIsLoading(false);
    }
  };

  const resendOTP = async () => {
    if (resendCooldown > 0) return;

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

      // Make API call
      const response = await fetch('http://localhost:8000/api/fusedai/resend-otp', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'token': `${token}`
        }
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
        throw new Error(data.detail || data.message || 'Failed to resend OTP');
      }

      // Show success message
      toast({
        title: "Success",
        description: "OTP sent successfully"
      });

      // Reset OTP input fields
      setOtp(['', '', '', '', '', '']);
      
      // Start cooldown timer
      setResendCooldown(30);

    } catch (error) {
      console.error('Resend OTP error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to resend OTP'
      });
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Toaster />
      <Navbar />
      


             {/* Main Content */}
       <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
         
         {/* Content */}
         <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           className="max-w-md w-full space-y-8 relative z-10"
         >
          {!isVerified ? (
            <>
              {/* Verification Header */}
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6"
                >
                  <Mail className="w-8 h-8 text-gray-600 dark:text-gray-300" />
                </motion.div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  Verify your email
                </h2>
                <p className="text-gray-600 dark:text-gray-300">
                  We've sent a 6-digit code to your email address
                </p>
              </div>

              {/* OTP Input */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-6"
              >
                                 <div>
                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                     Enter verification code
                   </label>
                   <div className="flex justify-center space-x-3">
                     {otp.map((digit, index) => (
                       <motion.div
                         key={index}
                         initial={{ scale: 0.8, opacity: 0 }}
                         animate={{ scale: 1, opacity: 1 }}
                         transition={{ delay: index * 0.1 }}
                         className="relative"
                       >
                         <input
                           ref={(el) => {
                             if (el) {
                               inputRefs.current[index] = el;
                             }
                           }}
                           type="text"
                           maxLength={1}
                           value={digit}
                           onChange={(e) => handleOtpChange(index, e.target.value)}
                           onKeyDown={(e) => handleKeyDown(index, e)}
                           className="w-14 h-14 text-center text-xl font-bold border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-all duration-200 hover:border-gray-300 dark:hover:border-gray-600"
                         />
                         {digit && (
                           <motion.div
                             initial={{ scale: 0 }}
                             animate={{ scale: 1 }}
                             className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full"
                           />
                         )}
                       </motion.div>
                     ))}
                   </div>
                 </div>

                                 {/* Verify Button */}
                 <motion.button
                   onClick={handleVerify}
                   disabled={otp.join('').length !== 6 || isLoading}
                   whileHover={{ scale: 1.02 }}
                   whileTap={{ scale: 0.98 }}
                   className="w-full bg-gradient-to-r from-gray-900 to-gray-800 dark:from-white dark:to-gray-100 text-white dark:text-gray-900 py-4 px-6 rounded-xl hover:from-gray-800 hover:to-gray-700 dark:hover:from-gray-100 dark:hover:to-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold shadow-lg hover:shadow-xl"
                 >
                   <AnimatePresence mode="wait">
                     {isLoading ? (
                       <motion.div
                         key="loading"
                         initial={{ opacity: 0 }}
                         animate={{ opacity: 1 }}
                         exit={{ opacity: 0 }}
                         className="flex items-center justify-center space-x-2"
                       >
                         <RefreshCw className="w-5 h-5 animate-spin" />
                         <span>Verifying...</span>
                       </motion.div>
                     ) : (
                       <motion.div
                         key="verify"
                         initial={{ opacity: 0 }}
                         animate={{ opacity: 1 }}
                         exit={{ opacity: 0 }}
                         className="flex items-center justify-center space-x-2"
                       >
                         <Shield className="w-5 h-5" />
                         <span>Verify Email</span>
                       </motion.div>
                     )}
                   </AnimatePresence>
                 </motion.button>

                                 {/* Resend OTP */}
                 <motion.div 
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ delay: 0.4 }}
                   className="text-center"
                 >
                   <div className="flex items-center justify-center space-x-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
                     <Clock className="w-4 h-4" />
                     <span>Code expires in 5 minutes</span>
                   </div>
                   <p className="text-sm text-gray-600 dark:text-gray-400">
                     Didn't receive the code?{' '}
                     <motion.button
                       onClick={resendOTP}
                       disabled={resendCooldown > 0}
                       whileHover={resendCooldown > 0 ? {} : { scale: 1.05 }}
                       whileTap={resendCooldown > 0 ? {} : { scale: 0.95 }}
                       className={`text-gray-900 dark:text-white font-semibold hover:underline transition-colors ${
                         resendCooldown > 0 ? 'opacity-50 cursor-not-allowed' : ''
                       }`}
                     >
                       {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend'}
                     </motion.button>
                   </p>
                 </motion.div>
              </motion.div>
            </>
          ) : (
                         /* Success State */
             <motion.div
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               className="text-center space-y-8"
             >
               <motion.div
                 initial={{ scale: 0, rotate: -180 }}
                 animate={{ scale: 1, rotate: 0 }}
                 transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                 className="mx-auto w-20 h-20 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900 dark:to-green-800 rounded-full flex items-center justify-center shadow-lg"
               >
                 <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
               </motion.div>
               
               <motion.div
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: 0.4 }}
               >
                 <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
                   Email verified!
                 </h2>
                 <p className="text-gray-600 dark:text-gray-300 mb-8 text-lg">
                   Your email has been successfully verified. You can now access your account.
                 </p>
                 
                 <motion.div
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ delay: 0.6 }}
                 >
                                       <Link
                      href="/plans"
                      className="inline-block bg-gradient-to-r from-gray-900 to-gray-800 dark:from-white dark:to-gray-100 text-white dark:text-gray-900 py-4 px-8 rounded-xl hover:from-gray-800 hover:to-gray-700 dark:hover:from-gray-100 dark:hover:to-gray-200 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl"
                    >
                      Choose Your Plan
                    </Link>
                 </motion.div>
               </motion.div>
             </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
} 