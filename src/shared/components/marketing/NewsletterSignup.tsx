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
  return;
};