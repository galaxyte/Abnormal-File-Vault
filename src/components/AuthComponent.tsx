
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Upload, Shield, Database, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface AuthComponentProps {
  onLogin: (user: any) => void;
}

const AuthComponent: React.FC<AuthComponentProps> = ({ onLogin }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });

  const [registerData, setRegisterData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginData.email,
        password: loginData.password,
      });

      if (error) {
        toast({
          title: "Login Failed",
          description: error.message,
          variant: "destructive",
        });
      } else if (data.user) {
        onLogin(data.user);
        toast({
          title: "Login Successful",
          description: "Welcome back!",
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Login Failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }

    setIsLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (registerData.password !== registerData.confirmPassword) {
      toast({
        title: "Registration Failed",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: registerData.email,
        password: registerData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            username: registerData.username,
          }
        }
      });

      if (error) {
        toast({
          title: "Registration Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Registration Successful",
          description: "Please check your email to verify your account before logging in.",
        });
        // Switch to login tab
        const loginTab = document.querySelector('[data-value="login"]') as HTMLElement;
        loginTab?.click();
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        title: "Registration Failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-6xl flex items-center gap-12">
        {/* Hero Section */}
        <div className="flex-1 hidden lg:block">
          <div className="text-center">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              Abnormal File Vault
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Secure, intelligent file hosting with smart deduplication and advanced search capabilities.
            </p>
            
            <div className="grid grid-cols-2 gap-6 max-w-md mx-auto">
              <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                <Upload className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
                <h3 className="font-semibold text-gray-900">Smart Upload</h3>
                <p className="text-sm text-gray-600">Automatic file deduplication</p>
              </div>
              
              <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                <Search className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
                <h3 className="font-semibold text-gray-900">Advanced Search</h3>
                <p className="text-sm text-gray-600">Find files instantly</p>
              </div>
              
              <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                <Shield className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
                <h3 className="font-semibold text-gray-900">Secure</h3>
                <p className="text-sm text-gray-600">Supabase authentication</p>
              </div>
              
              <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                <Database className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
                <h3 className="font-semibold text-gray-900">Reliable</h3>
                <p className="text-sm text-gray-600">PostgreSQL powered</p>
              </div>
            </div>
          </div>
        </div>

        {/* Auth Form */}
        <div className="flex-1 max-w-md">
          <Card className="bg-white/80 backdrop-blur-sm border-white/20">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-gray-900">Welcome</CardTitle>
              <CardDescription>
                Sign in to your account or create a new one
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login" data-value="login">Login</TabsTrigger>
                  <TabsTrigger value="register">Register</TabsTrigger>
                </TabsList>
                
                <TabsContent value="login" className="space-y-4">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        value={loginData.email}
                        onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="Enter your password"
                        value={loginData.password}
                        onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? 'Signing in...' : 'Sign In'}
                    </Button>
                  </form>
                </TabsContent>
                
                <TabsContent value="register" className="space-y-4">
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="reg-username">Username</Label>
                      <Input
                        id="reg-username"
                        type="text"
                        placeholder="Choose a username"
                        value={registerData.username}
                        onChange={(e) => setRegisterData({...registerData, username: e.target.value})}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reg-email">Email</Label>
                      <Input
                        id="reg-email"
                        type="email"
                        placeholder="Enter your email"
                        value={registerData.email}
                        onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reg-password">Password</Label>
                      <Input
                        id="reg-password"
                        type="password"
                        placeholder="Create a password"
                        value={registerData.password}
                        onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirm Password</Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        placeholder="Confirm your password"
                        value={registerData.confirmPassword}
                        onChange={(e) => setRegisterData({...registerData, confirmPassword: e.target.value})}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? 'Creating Account...' : 'Create Account'}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AuthComponent;
