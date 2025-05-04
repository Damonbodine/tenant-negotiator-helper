
import { useState, useEffect } from "react";
import { Check, Quote as QuoteIcon } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

// Sample testimonials data
const testimonials = [
  {
    id: 1,
    name: "Alex Johnson",
    location: "New York, NY",
    quote: "I saved $200 per month on my rent by using the negotiation tips from this site. The market insights gave me the confidence to counter-offer.",
  },
  {
    id: 2,
    name: "Samantha Lee",
    location: "San Francisco, CA",
    quote: "Thanks to the script builder, I negotiated my security deposit down by 50%. The landlord was impressed by how prepared I was!",
  },
  {
    id: 3,
    name: "Marcus Rivera",
    location: "Chicago, IL",
    quote: "I avoided $1,500 in unnecessary amenity fees by using the lease analyzer tool. It pointed out fees that weren't standard for my area.",
  },
  {
    id: 4,
    name: "Priya Patel",
    location: "Austin, TX",
    quote: "The negotiation practice feature helped me rehearse my talking points. Ended up saving $1,200 over my 12-month lease!",
  },
  {
    id: 5,
    name: "Jordan Taylor",
    location: "Denver, CO",
    quote: "I was able to negotiate free parking for 6 months - a $900 value! The comparable properties section gave me perfect leverage.",
  },
];

export function TestimonialCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);

  // Auto-rotate testimonials every 6 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((current) => (current + 1) % testimonials.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="mx-auto w-full mt-12 px-4 relative">
      <h3 className="text-center text-xl font-semibold text-cyan-400 mb-6">What Our Users Are Saying</h3>
      
      <div className="max-w-4xl mx-auto">
        <Carousel className="w-full" setApi={(api) => {
          if (api) {
            api.on("select", () => {
              const selectedIndex = api.selectedScrollSnap();
              setActiveIndex(selectedIndex);
            });
            // Set initial auto-rotation
            api.scrollTo(activeIndex);
          }
        }}>
          <CarouselContent>
            {testimonials.map((testimonial) => (
              <CarouselItem key={testimonial.id}>
                <div className="bg-cyan-950/30 border border-cyan-400/20 rounded-xl p-6 h-full">
                  <div className="flex flex-col h-full">
                    <div className="text-cyan-400/40 mb-4">
                      <QuoteIcon size={36} />
                    </div>
                    <p className="text-white/90 mb-6 flex-1 text-lg italic">
                      "{testimonial.quote}"
                    </p>
                    <div className="flex items-center mt-auto">
                      <div className="h-10 w-10 rounded-full bg-cyan-400/20 flex items-center justify-center text-cyan-400 font-bold">
                        {testimonial.name.charAt(0)}
                      </div>
                      <div className="ml-3">
                        <p className="font-semibold text-cyan-400">{testimonial.name}</p>
                        <p className="text-sm text-white/60">{testimonial.location}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          
          <div className="flex justify-center mt-6">
            {testimonials.map((_, index) => (
              <button
                key={index}
                className={`h-2 w-2 mx-1 rounded-full ${
                  activeIndex === index ? "bg-cyan-400" : "bg-cyan-400/20"
                }`}
                onClick={() => {
                  setActiveIndex(index);
                }}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
          
          <CarouselPrevious className="absolute -left-4 top-1/2 -translate-y-1/2" />
          <CarouselNext className="absolute -right-4 top-1/2 -translate-y-1/2" />
        </Carousel>
      </div>
    </div>
  );
}
