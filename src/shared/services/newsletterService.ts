
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/shared/hooks/use-toast";

export async function subscribeToNewsletter(email: string, source?: string) {
  try {
    const { error } = await supabase
      .from('newsletter_subscriptions')
      .insert([{ email, source }]);

    if (error) throw error;
    
    return { success: true };
  } catch (error: any) {
    console.error('Newsletter subscription error:', error);
    
    // Handle duplicate emails gracefully
    if (error.code === '23505') {
      toast({
        title: "Already subscribed",
        description: "This email is already subscribed to our newsletter.",
      });
      return { success: false, error: "already_subscribed" };
    }
    
    throw error;
  }
}
