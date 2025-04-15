
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";

export function NewsletterSignup() {
  const [email, setEmail] = useState("");

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address",
        variant: "destructive"
      });
      return;
    }
    
    toast({
      title: "Success!",
      description: "Thank you for subscribing to our newsletter!",
    });
    setEmail("");
  };

  return (
    <div className="mx-auto max-w-md w-full mt-12">
      <div className="text-center mb-4">
        <h3 className="text-xl font-semibold text-cyan-400">Join our email list and get a free book</h3>
      </div>
      <form onSubmit={handleEmailSubmit} className="flex gap-2">
        <Input
          type="email"
          placeholder="Enter your email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1 bg-cyan-950/30 border-cyan-400/20 placeholder:text-cyan-400/50"
        />
        <Button type="submit" className="bg-cyan-400 hover:bg-cyan-500 text-cyan-950">
          Subscribe
        </Button>
      </form>
    </div>
  );
}
