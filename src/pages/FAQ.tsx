
import { Header } from "@/shared/components/layout/Header";
import { Footer } from "@/shared/components/layout/Footer";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "@/components/ui/accordion";

export default function FAQ() {
  const faqItems = [
    {
      question: "What exactly does Renters Mentor AI do?",
      answer: "Our AI assistant analyzes current market rents, compares your lease terms to similar listings, and walks you through negotiation tactics step‑by‑step. It can role‑play practice calls, suggest email scripts, and flag common lease‑renewal pitfalls—all in plain language you can act on immediately."
    },
    {
      question: "Is this a replacement for a lawyer or licensed real‑estate professional?",
      answer: "No. We're a data‑driven coaching tool, NOT a law firm or brokerage. We provide educational guidance and market comparisons; for legal interpretation or representation you should consult a qualified attorney or licensed broker."
    },
    {
      question: "Where does your rent data come from, and how current is it?",
      answer: "We pull live pricing data from publicly available listings. The AI refreshes comps each time you ask, so figures are typically updated within the past 24 hours."
    },
    {
      question: "How do I get started?",
      answer: "Click \"Sign Up\" and either paste your rental address or drop a link to the listing. The AI will confirm the unit details, analyze local comps, and prompt you for your negotiation goal (rent reduction, renewal concessions, etc.)."
    },
    {
      question: "Is there a cost to use the service?",
      answer: "The core negotiation toolkit is free for renters. Premium tiers (coming soon) will add personalized coaching calls, and deeper analytics."
    },
    {
      question: "Can the AI contact my landlord for me?",
      answer: "Not directly. The platform generates custom email templates, text messages, and talking points that you can send yourself. This keeps you in control of timing and tone."
    },
    {
      question: "Does the platform work outside the United States?",
      answer: "The current database is U.S.‑centric. International expansion is on our roadmap; join the waitlist and we'll notify you when we launch coverage for your region."
    },
    {
      question: "What if I'm renewing, not moving?",
      answer: "Select \"Lease Renewal\" at the first prompt. The AI compares your proposed renewal rate to fresh comps, then suggests leverage points—like maintenance credits or term adjustments—in addition to pure rent reductions."
    },
    {
      question: "How do I contact support?",
      answer: "E‑mail support at ditchmyrent@gmail.com."
    }
  ];

  return (
      <main className="flex-1 container py-12">
        <h1 className="text-3xl font-bold mb-8">Frequently Asked Questions</h1>

        <Accordion type="single" collapsible className="w-full max-w-3xl mx-auto">
          {faqItems.map((item, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger className="text-lg font-medium">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="text-base">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </main>
  );
}
