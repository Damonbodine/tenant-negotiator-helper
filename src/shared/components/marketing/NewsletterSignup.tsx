
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const NewsletterSignup = () => {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle newsletter signup
    console.log("Subscribing email:", email);
    setIsSubmitted(true);
    setEmail("");
    
    // Reset after 3 seconds
    setTimeout(() => {
      setIsSubmitted(false);
    }, 3000);
  };
  
  return (
    <div className="border rounded-xl p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30">
      <h3 className="text-xl font-semibold mb-2 text-center">Get Rental Market Updates</h3>
      <p className="text-gray-600 dark:text-gray-300 mb-4 text-center">
        Stay informed about rental market trends and negotiation tips
      </p>
      
      {isSubmitted ? (
        <div className="text-center p-4 text-green-600 font-medium">
          Thanks for subscribing! We'll be in touch.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
          <Input
            type="email"
            placeholder="Your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1"
            required
            aria-label="Email address"
          />
          <Button type="submit">Subscribe</Button>
        </form>
      )}
    </div>
  );
};
