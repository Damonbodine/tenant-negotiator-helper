
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, LogIn, Mail, Key, UserPlus, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useForm } from 'react-hook-form';

interface FormInputs {
  email: string;
  password: string;
}

const Auth = () => {
  const { user, signInWithGoogle, signInWithEmail, signUpWithEmail, resetPassword, isLoading, authError } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('login');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [googleAuthAttempted, setGoogleAuthAttempted] = useState(false);

  const loginForm = useForm<FormInputs>();
  const registerForm = useForm<FormInputs>();

  useEffect(() => {
    if (user && !isLoading) {
      navigate('/');
    }
  }, [user, isLoading, navigate]);

  useEffect(() => {
    // Check for auth error in URL (Supabase redirects with error param)
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    const errorDescription = urlParams.get('error_description');
    const reset = urlParams.get('reset');
    
    if (error) {
      const errorMsg = errorDescription || 'Authentication failed. Please try again.';
      setLoginError(errorMsg);
      toast({
        title: "Authentication Error",
        description: errorMsg,
        variant: "destructive",
      });
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    if (reset) {
      setActiveTab('login');
      toast({
        title: "Password Reset",
        description: "You can now set a new password by logging in.",
      });
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  useEffect(() => {
    // Display auth error from context if present
    if (authError) {
      setLoginError(authError);
      if (googleAuthAttempted) {
        toast({
          title: "Google Sign-In Error",
          description: "Could not connect to Google. Please try email sign-in or check your network connection.",
          variant: "destructive",
        });
        setGoogleAuthAttempted(false);
      }
    }
  }, [authError, googleAuthAttempted]);

  const handleGoogleSignIn = async () => {
    try {
      setGoogleAuthAttempted(true);
      setLoginError(null);
      await signInWithGoogle();
    } catch (error) {
      toast({
        title: "Authentication Error",
        description: error.message || "Failed to sign in with Google. Please try again or use email login.",
        variant: "destructive",
      });
    }
  };

  const handleEmailLogin = async (data: FormInputs) => {
    try {
      setLoginError(null);
      await signInWithEmail(data.email, data.password);
    } catch (error) {
      toast({
        title: "Login Error",
        description: error.message || "Failed to log in with email and password",
        variant: "destructive",
      });
    }
  };

  const handleEmailSignUp = async (data: FormInputs) => {
    try {
      setLoginError(null);
      await signUpWithEmail(data.email, data.password);
    } catch (error) {
      toast({
        title: "Registration Error",
        description: error.message || "Failed to register with email and password",
        variant: "destructive",
      });
    }
  };

  const handlePasswordReset = async () => {
    if (!resetEmail.trim()) {
      toast({
        title: "Error",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoginError(null);
      await resetPassword(resetEmail);
      setShowResetPassword(false);
    } catch (error) {
      toast({
        title: "Password Reset Error",
        description: error.message || "Failed to send password reset email",
        variant: "destructive",
      });
    }
  };

  const getGoogleButtonText = () => {
    if (isLoading && googleAuthAttempted) return "Connecting to Google...";
    return activeTab === 'login' ? "Sign in with Google" : "Sign up with Google";
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center mb-8">
          <Home className="h-8 w-8 text-blue-600 mr-2" />
          <h1 className="text-2xl font-bold text-blue-600">Renters Mentor</h1>
        </div>
        
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Welcome to Renters Mentor</CardTitle>
            <CardDescription>
              Sign in to access personalized rental negotiation assistance.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {(loginError || authError) && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Authentication Error</AlertTitle>
                <AlertDescription>
                  {loginError || authError}
                  {(loginError?.includes('google') || authError?.includes('google') || loginError?.includes('refused to connect')) && (
                    <div className="mt-2">
                      <p className="text-sm font-medium">Possible solutions:</p>
                      <ul className="text-xs list-disc list-inside mt-1">
                        <li>Check your internet connection</li>
                        <li>Try using email login instead</li>
                        <li>Clear your browser cookies and cache</li>
                        <li>Try a different browser</li>
                      </ul>
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}
            
            {showResetPassword ? (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Reset Your Password</h3>
                <div className="space-y-2">
                  <Label htmlFor="reset-email">Email</Label>
                  <Input 
                    id="reset-email" 
                    type="email" 
                    value={resetEmail} 
                    onChange={(e) => setResetEmail(e.target.value)} 
                    placeholder="Enter your email address"
                  />
                </div>
                <div className="flex space-x-2">
                  <Button onClick={handlePasswordReset} disabled={isLoading}>
                    {isLoading ? "Sending..." : "Send Reset Link"}
                  </Button>
                  <Button variant="outline" onClick={() => setShowResetPassword(false)}>
                    Back to Login
                  </Button>
                </div>
              </div>
            ) : (
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login">Login</TabsTrigger>
                  <TabsTrigger value="register">Register</TabsTrigger>
                </TabsList>

                <TabsContent value="login" className="space-y-4">
                  <form onSubmit={loginForm.handleSubmit(handleEmailLogin)} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">Email</Label>
                      <Input 
                        id="login-email" 
                        type="email" 
                        placeholder="your.email@example.com" 
                        {...loginForm.register('email', { required: true })}
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="login-password">Password</Label>
                        <Button 
                          variant="link" 
                          className="p-0 h-auto text-xs" 
                          type="button"
                          onClick={() => setShowResetPassword(true)}
                        >
                          Forgot password?
                        </Button>
                      </div>
                      <Input 
                        id="login-password" 
                        type="password" 
                        placeholder="••••••••" 
                        {...loginForm.register('password', { required: true })}
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading && !googleAuthAttempted ? "Signing in..." : "Sign in with Email"}
                    </Button>
                  </form>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <Separator className="w-full" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white dark:bg-slate-800 px-2 text-muted-foreground">
                        Or continue with
                      </span>
                    </div>
                  </div>

                  <Button 
                    onClick={handleGoogleSignIn} 
                    className="w-full flex items-center justify-center gap-2"
                    variant="outline"
                    disabled={isLoading}
                  >
                    <svg viewBox="0 0 24 24" width="16" height="16" xmlns="http://www.w3.org/2000/svg">
                      <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                        <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"/>
                        <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"/>
                        <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"/>
                        <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"/>
                      </g>
                    </svg>
                    <span>{getGoogleButtonText()}</span>
                  </Button>
                </TabsContent>

                <TabsContent value="register" className="space-y-4">
                  <form onSubmit={registerForm.handleSubmit(handleEmailSignUp)} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="register-email">Email</Label>
                      <Input 
                        id="register-email" 
                        type="email" 
                        placeholder="your.email@example.com" 
                        {...registerForm.register('email', { required: true })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-password">Password</Label>
                      <Input 
                        id="register-password" 
                        type="password" 
                        placeholder="••••••••" 
                        {...registerForm.register('password', { 
                          required: true,
                          minLength: {
                            value: 6,
                            message: "Password must be at least 6 characters"
                          }
                        })}
                      />
                      {registerForm.formState.errors.password && (
                        <p className="text-xs text-red-500 mt-1">
                          {registerForm.formState.errors.password.message}
                        </p>
                      )}
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading && !googleAuthAttempted ? "Creating account..." : "Create account"}
                    </Button>
                  </form>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <Separator className="w-full" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white dark:bg-slate-800 px-2 text-muted-foreground">
                        Or continue with
                      </span>
                    </div>
                  </div>

                  <Button 
                    onClick={handleGoogleSignIn} 
                    className="w-full flex items-center justify-center gap-2"
                    variant="outline"
                    disabled={isLoading}
                  >
                    <svg viewBox="0 0 24 24" width="16" height="16" xmlns="http://www.w3.org/2000/svg">
                      <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                        <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"/>
                        <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"/>
                        <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"/>
                        <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"/>
                      </g>
                    </svg>
                    <span>{getGoogleButtonText()}</span>
                  </Button>
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button variant="link" onClick={() => navigate('/')}>
              Back to Home
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
