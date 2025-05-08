import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Mail, LogIn, LogOut, Loader2, Activity, FileText, HelpCircle, Play, Code, Book, FileSearch } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/use-toast";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle } from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";
export const Header = () => {
  const {
    toast
  } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const {
    user,
    signOut,
    isLoading
  } = useAuth();
  const location = useLocation();
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // This would typically go to a backend service
      // For now, we'll use a mailto link as a fallback
      const subject = encodeURIComponent(`Renters Mentor Contact from ${name}`);
      const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${message}`);

      // Create a hidden anchor element to trigger the email client
      const mailtoLink = document.createElement('a');
      mailtoLink.href = `mailto:damonbodine@gmail.com?subject=${subject}&body=${body}`;
      document.body.appendChild(mailtoLink);
      mailtoLink.click();
      document.body.removeChild(mailtoLink);
      toast({
        title: "Message sent!",
        description: "We've received your message and will get back to you soon."
      });

      // Reset form
      setName("");
      setEmail("");
      setMessage("");
      setIsDialogOpen(false);
    } catch (error) {
      toast({
        title: "Something went wrong",
        description: "Please try again later or email us directly.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  const getInitials = (name: string | null) => {
    if (!name) return "RM";
    return name.split(" ").map(part => part[0]).join("").toUpperCase().substring(0, 2);
  };

  // Navigation links configuration
  const navLinks = [{
    name: "Price Analysis",
    path: "/",
    icon: <Activity className="h-5 w-5 mr-1" />,
    action: () => window.location.href = "/?journey=market"
  }, {
    name: "Compare",
    path: "/",
    icon: <FileSearch className="h-5 w-5 mr-1" />,
    action: () => window.location.href = "/?journey=comparison"
  }, {
    name: "Get Help",
    path: "/",
    icon: <HelpCircle className="h-5 w-5 mr-1" />,
    action: () => window.location.href = "/?journey=negotiation"
  }, {
    name: "Practice",
    path: "/practice/voice",
    icon: <Play className="h-5 w-5 mr-1" />
  }, {
    name: "Lease Review",
    path: "/lease-analyzer",
    icon: <FileText className="h-5 w-5 mr-1" />
  }, {
    name: "Scripts",
    path: "/script-builder",
    icon: <Code className="h-5 w-5 mr-1" />
  }, {
    name: "Resources",
    path: "/resources",
    icon: <Book className="h-5 w-5 mr-1" />
  }];
  const isActive = (path: string) => {
    if (path === "/" && location.pathname === "/") {
      // For homepage, consider the potential URL parameters
      return !location.search.includes("journey=");
    }
    return location.pathname === path;
  };
  return <header className="w-full bg-background/80 backdrop-blur-md border-b border-border py-3">
      <div className="container flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2">
            
            <h1 className="text-2xl font-bold text-cyan-400 uppercase tracking-wider">Renters Mentor</h1>
          </Link>
          
          {/* Navigation Menu */}
          <NavigationMenu className="hidden md:flex ml-6">
            <NavigationMenuList>
              {navLinks.map(item => <NavigationMenuItem key={item.name}>
                  {item.action ? <button onClick={item.action} className={cn(navigationMenuTriggerStyle(), "flex items-center", location.search.includes(`journey=${item.path.replace('/?journey=', '')}`) || item.path === '/' && !location.search && location.pathname === '/' ? "bg-cyan-400/10 text-cyan-400" : "text-cyan-400/80 hover:text-cyan-400 hover:bg-cyan-400/10")}>
                      {item.icon}
                      {item.name}
                    </button> : <Link to={item.path} className={cn(navigationMenuTriggerStyle(), "flex items-center", isActive(item.path) ? "bg-cyan-400/10 text-cyan-400" : "text-cyan-400/80 hover:text-cyan-400 hover:bg-cyan-400/10")}>
                      {item.icon}
                      {item.name}
                    </Link>}
                </NavigationMenuItem>)}
            </NavigationMenuList>
          </NavigationMenu>
        </div>
        
        {/* Mobile Navigation Menu */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 flex justify-around bg-background/95 backdrop-blur-md border-t border-border py-2 px-1 z-10">
          {navLinks.map(item => <div key={item.name}>
              {item.action ? <button onClick={item.action} className={cn("flex flex-col items-center px-1 py-1 rounded", location.search.includes(`journey=${item.path.replace('/?journey=', '')}`) || item.path === '/' && !location.search && location.pathname === '/' ? "text-cyan-400" : "text-cyan-400/70")}>
                  {item.icon}
                  <span className="text-xs mt-1">{item.name}</span>
                </button> : <Link to={item.path} className={cn("flex flex-col items-center px-1 py-1 rounded", isActive(item.path) ? "text-cyan-400" : "text-cyan-400/70")}>
                  {item.icon}
                  <span className="text-xs mt-1">{item.name}</span>
                </Link>}
            </div>)}
        </div>
        
        <div className="flex-1 flex justify-end items-center gap-4">
          {/* Contact Us Dialog */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2 border-cyan-400/30 hover:bg-cyan-400/10">
                <Mail className="h-4 w-4 text-cyan-400" />
                <span className="text-cyan-400 hidden sm:inline">Contact Us</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Contact Us</DialogTitle>
                <DialogDescription>
                  Send us a message and we'll get back to you as soon as possible.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your.email@example.com" required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea id="message" value={message} onChange={e => setMessage(e.target.value)} placeholder="How can we help you?" required />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Sending..." : "Send message"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          
          {/* Auth buttons */}
          {isLoading ? <Button variant="ghost" size="sm" disabled className="gap-1">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="hidden md:inline">Loading...</span>
            </Button> : user ? <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.user_metadata?.avatar_url || ''} />
                    <AvatarFallback>{getInitials(user.user_metadata?.name || user.email)}</AvatarFallback>
                  </Avatar>
                  <span className="hidden md:inline">{user.user_metadata?.name || user.email}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="cursor-pointer flex items-center">
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()} className="cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu> : <Link to="/auth">
              <Button variant="default" size="sm" className="gap-1 bg-cyan-400 hover:bg-cyan-500 text-cyan-950">
                <LogIn className="h-4 w-4" />
                <span>Sign in</span>
              </Button>
            </Link>}
        </div>
      </div>
    </header>;
};