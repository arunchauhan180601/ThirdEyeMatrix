'use client'

import { useState } from 'react'

import Link from 'next/link';
import Script from 'next/script';
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, RefreshCcw } from 'lucide-react'
import Image from 'next/image'
import signinImage from "../../../../../assets/images/LoginImage.png"
import GoogleLogo from "../../../../../assets/images/google.png"
import LinkedInLogo from "../../../../../assets/images/LinkedIn_logo.png"
import FacebookLogo from "../../../../../assets/images/facebook-logo.jpg"
import ReCAPTCHA from "react-google-recaptcha"
import { toast } from 'react-toastify';
import { GoogleOAuthProvider } from '@react-oauth/google';


declare global {
  interface Window {
    FB: any;
    google: any;
  }
}

// Google Login Component
function GoogleLoginButton() {
  const router = useRouter();
  const [, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    if (!window.google || !window.google.accounts || !window.google.accounts.id) {
      toast.error('Google SDK not loaded. Please try again.');
      return;
    }

    setLoading(true);
    
    try {
      // Initialize Google Identity Services callback
      window.google.accounts.id.initialize({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "",
        callback: async (response: any) => {
          setLoading(true);
          try {
            const backendResponse = await fetch('http://localhost:5000/api/user/auth/google-login', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ credential: response.credential }),
            });

            const data = await backendResponse.json();

            if (backendResponse.ok) {
              console.log('Google Login successful:', data);
              toast.success(data.message || "Logged in successfully !", {
                style: {
                  fontSize: "16px",
                  fontWeight: "bold",
                  borderRadius: "10px",
                },
              });
              localStorage.setItem('User_token', data.token); 
              router.push('/welcome'); 
            } else {
              toast.error(data.message || 'Google login failed', {
                style: {
                  fontSize: "16px",
                  fontWeight: "bold",
                  borderRadius: "10px",
                },
              });
            }
          } catch (error) {
            console.error('Network error during Google login:', error);
            toast.error('An unexpected error occurred during Google login. Please try again.');
          } finally {
            setLoading(false);
          }
        },
      });

      // Create a hidden container for the Google button
      const container = document.createElement('div');
      container.id = 'google-signin-container';
      container.style.position = 'fixed';
      container.style.top = '-9999px';
      container.style.left = '-9999px';
      document.body.appendChild(container);

      // Render Google Sign-In button
      window.google.accounts.id.renderButton(container, {
        theme: 'outline',
        size: 'large',
        type: 'standard',
        text: 'signin_with',
      });

      // Wait for the button to be rendered and click it
      const clickButton = () => {
        const googleButton = container.querySelector('div[role="button"]') as HTMLElement;
        if (googleButton) {
          googleButton.click();
          // Clean up after clicking
          setTimeout(() => {
            if (document.body.contains(container)) {
              document.body.removeChild(container);
            }
          }, 1000);
          return true;
        }
        return false;
      };

      // Try clicking immediately, then retry if needed
      if (!clickButton()) {
        setTimeout(() => {
          if (!clickButton()) {
            // Fallback: trigger One Tap prompt
            window.google.accounts.id.prompt((notification: any) => {
              if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
                toast.error('Unable to open Google Sign-In. Please try again.');
                setLoading(false);
              }
            });
            // Clean up container
            setTimeout(() => {
              if (document.body.contains(container)) {
                document.body.removeChild(container);
              }
            }, 500);
          }
        }, 200);
      }
    } catch (error) {
      console.error('Error initializing Google login:', error);
      toast.error('An error occurred while initializing Google login. Please try again.');
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleGoogleLogin}
      className="w-full py-2 border cursor-pointer border-gray-300 rounded-lg font-custom font-medium hover:bg-gray-50 dark:hover:bg-dark-850 transition flex items-center justify-center gap-2"
    >
      <Image src={GoogleLogo} alt="Google Logo" width={16} height={16} />
      <span>Sign in with Google</span>
    </button>
  );
}

export default function SigninPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  })
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);

  const handleFacebookLogout = () => {
    if (window.FB) {
      window.FB.logout(function(response: any) {
        console.log('Facebook logout response:', response);
        toast.success('Logged out of Facebook. You can now log in with a different account.');
        localStorage.removeItem('User_token'); 
        router.push('/auth/user/signin');
      });
    } else {
      toast.error('Facebook SDK not loaded. Cannot log out.');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleRememberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { checked } = e.target
    setFormData((prev) => ({ ...prev, rememberMe: checked }))
  }

   function onRecaptchaChange(token: string | null) {
    setRecaptchaToken(token);
   
  }



  const handleFacebookLogin = () => {
    if (window.FB) {
      window.FB.getLoginStatus(function(response: any) {
        if (response.status === 'connected') {
          // User is logged into Facebook and your app
          if (window.confirm('You are already logged into Facebook. Would you like to log out of Facebook and log in with a different account?')) {
            handleFacebookLogout(); // Log out of Facebook
          } else {
            sendFacebookAccessTokenToBackend(response.authResponse.accessToken);
          }
        } else {
          // User is not logged into Facebook or your app
          window.FB.login(function(loginResponse: any) {
            if (loginResponse.authResponse) {
              console.log('Welcome! Fetching your information.... ');
              sendFacebookAccessTokenToBackend(loginResponse.authResponse.accessToken);
            } else {
              console.log('User cancelled login or did not fully authorize.');
              toast.error('Facebook login cancelled or not authorized.');
            }
          }, { scope: 'email,public_profile' });
        }
      });
    } else {
      toast.error('Facebook SDK not loaded. Please try again.');
    }
  };

  const sendFacebookAccessTokenToBackend = async (accessToken: string) => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/user/auth/facebook-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accessToken }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log('Facebook Login successful:', data);
        toast.success(data.message || "Logged in successfully!", {
          style: {
            fontSize: "16px",
            fontWeight: "bold",
            borderRadius: "10px",
          },
        });
        localStorage.setItem('User_token', data.token);
        router.push('/welcome');
      } else {
        toast.error(data.message || 'Facebook login failed', {
          style: {
            fontSize: "16px",
            fontWeight: "bold",
            borderRadius: "10px",
          },
        });
      }
    } catch (error) {
      console.error('Network error during Facebook login:', error);
      toast.error('An unexpected error occurred during Facebook login. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (!recaptchaToken) {
      toast.error('Please complete the reCAPTCHA');
      return;
    }

    setLoading(true);


    try {
      const basicAuthToken = btoa(
        `${process.env.NEXT_PUBLIC_BASIC_AUTH_USERNAME}:${process.env.NEXT_PUBLIC_BASIC_AUTH_PASSWORD}`
      );

      const response = await fetch('http://localhost:5000/api/user/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${basicAuthToken}`,
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          captcha: recaptchaToken, 
        }),
      });

      const data = await response.json();

      if (response.ok) {
    
        console.log('Login successful:', data);
        toast.success(data.message || "Logged in successfully!" , {
          style: {
          fontSize: "16px",
          fontWeight: "bold",
          borderRadius: "10px",
        },
        });
        localStorage.setItem('User_token', data.token); 
        router.push('/welcome'); 
      } else {
     
        toast.error(data.message || 'Login failed' , {
          style: {
          fontSize: "16px",
          fontWeight: "bold",
          borderRadius: "10px",
        },
        });
      }
    } catch (error) {
      console.error('Network error:', error);
      toast.error('An unexpected error occurred. Please try again.' , {
        style: {
          fontSize: "16px",
          fontWeight: "bold",
          borderRadius: "10px",
        },
      });
    } finally {
      setLoading(false);
      setFormData({
        email: '',
        password: '',
        rememberMe: false,
      });
      setRecaptchaToken(null); // Reset reCAPTCHA token after submission
    }
  }
 

  return (
    <> 
    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ""}>
      <div className="relative flex items-center justify-center min-h-screen bg-linear-to-r  from-white-100 via-sky-50 to-white-50">
        <div className="w-full h-screen grid grid-cols-1 lg:grid-cols-2">
          <div className="relative hidden lg:block">
            <Image
              src={signinImage}
              alt="Signin Page image banner"
              className="absolute inset-0 w-full h-full img-fluid "
              priority
            />
          </div>
          <div className="flex items-center justify-center px-1 py-1 md:p-12">
            <div className="w-full sm:max-w-md md:max-w-lg lg:max-w-lg bg-white shadow-2xl rounded-2xl dark:bg-dark-900 p-8">
              <div className="mb-6 text-center">
                <h1 className="text-3xl sm:text-3xl mb-3 font-bold text-black  font-custom">Sign In</h1>
                <p className="mt-2 text-gray-600 dark:text-gray-400 font-custom">
                  Don't have an account?
                  <Link href="/auth/user/signup" className="font-medium text-sky-400 ml-1">
                    Sign Up
                  </Link>
                </p>
    
              </div>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="emailInput" className="block mb-1 text-md font-semibold font-custom">
                    Email
                  </label>
                  <input
                    type="email"
                    id="emailInput"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border font-custom  border-gray-300 rounded-lg form-input focus:border-[#37b6ffe0] focus:ring-0 focus:ring-[#37b6ffb0] focus:outline-none"
                    placeholder="Enter your email"
                  />
                </div>
                <div>
                  <label htmlFor="passwordInput" className="block mb-1 text-md font-semibold font-custom">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="passwordInput"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border font-custom  border-gray-300 rounded-lg form-input focus:border-[#37b6ffe0] focus:ring-0 focus:ring-[#37b6ffb0] focus:outline-none"
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute inset-y-0 flex items-center text-gray-500 ltr:right-3 rtl:left-3"
                    >
                      {showPassword ? (
                        <Eye className="w-5 h-5" />
                      ) : (
                        <EyeOff className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* ReCAPTCHA */}
                <div className="mt-4 w-full flex justify-start items-center  p-2 rounded-lg">
                  <ReCAPTCHA
                    sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || ""}
                    onChange={onRecaptchaChange}
                  />
                </div>

                <div className="flex items-center   justify-between text-sm">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.rememberMe}
                      onChange={handleRememberChange}
                      className="w-4 h-4 text-primary-500 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <span className="text-gray-700 dark:text-gray-300 font-custom">Remember me</span>
                  </label>
                  <Link href="/auth/user/forget-password" className="text-sky-400  font-medium  font-custom">Forgot password?</Link>
                </div>
                <button
                  type="submit"
                  disabled={!recaptchaToken}
                  className="w-full py-2 mt-1 cursor-pointer font-semibold text-white font-custom transition-all duration-200 rounded-lg shadow-md bg-[#37B5FF] hover:opacity-90 disabled:opacity-50"
                >
                  Sign In
                </button>
                <div className="relative my-3 text-center text-gray-500 before:absolute before:border-gray-200 before:w-full ltr:before:left-0 rtl:before:right-0 before:top-2.5 before:border-b">
                  <span className="relative inline-block px-2 bg-white dark:bg-dark-900 text-sm">OR</span>
                </div>
                {/* Google Login Button */}
                <GoogleLoginButton />
                
                <button
                  type="button"
                  className="w-full py-2 border cursor-pointer border-gray-300 rounded-lg font-custom font-medium hover:bg-gray-50 dark:hover:bg-dark-850 transition flex items-center justify-center gap-2"
                >
                  <Image src={LinkedInLogo} alt="LinkedIn Logo" width={16} height={16} />
                  <span>Sign in with LinkedIn</span>
                </button>


                <button
                  type="button"
                  onClick={handleFacebookLogin}
                  className="w-full py-2 border cursor-pointer border-gray-300 rounded-lg font-custom font-medium hover:bg-gray-50 dark:hover:bg-dark-850 transition flex items-center justify-center gap-2"
                >
                  <Image src={FacebookLogo} alt="Facebook Logo" width={17} height={17} />
                  <span>Sign in with Facebook</span>
                </button>
              </form>
            </div>
          </div>
        </div>

      </div>
    </GoogleOAuthProvider>
    <Script
        id="facebook-sdk"
        strategy="lazyOnload"
        onLoad={() => {
          window.FB.init({
            appId: process.env.NEXT_PUBLIC_FACEBOOK_APP_ID,
            cookie: true,
            xfbml: true,
            version: 'v12.0',
          });
        }}
        src="https://connect.facebook.net/en_US/sdk.js"
      />
    <Script
        id="google-identity-services"
        strategy="lazyOnload"
        src="https://accounts.google.com/gsi/client"
      />

      </>
  )
}


