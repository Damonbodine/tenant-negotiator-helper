import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Download, ExternalLink, ChevronLeft, Mail, ClipboardCheck, Home, 
  Shield, AlertTriangle, FileText, DollarSign 
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

const Resources = () => {
  // Get the resourceId from URL params
  const { resourceId } = useParams();
  
  const resourceCategories = [{
    title: "Negotiation Templates",
    description: "Ready-to-use email templates and scripts for rent negotiations",
    icon: <Mail className="h-5 w-5 text-blue-500" />,
    resources: [{
      title: "Rent Negotiation Email Templates",
      description: "Ready-to-use templates for rent reduction, renewals, and more",
      link: "/resources/negotiation-templates",
      type: "page",
      badge: "Popular"
    }, {
      title: "Rental Price Comparison Guide",
      description: "Learn how to research comparable rental prices in your area",
      link: "/resources/price-comparison",
      type: "page"
    }]
  }, {
    title: "Moving Guides",
    description: "Checklists and guides for moving in, inspections, and security deposits",
    icon: <ClipboardCheck className="h-5 w-5 text-green-500" />,
    resources: [{
      title: "Move-In Apartment Checklist",
      description: "Complete checklist to document your unit's condition",
      link: "/resources/move-in-checklist",
      type: "page"
    }, {
      title: "Security Deposit Recovery Guide",
      description: "Tips to maximize your security deposit return",
      link: "/resources/security-deposit",
      type: "page"
    }, {
      title: "Apartment Viewing Checklist",
      description: "What to look for when touring potential apartments",
      link: "/resources/viewing-checklist",
      type: "page"
    }]
  }, {
    title: "Legal & Protection",
    description: "Information on lease agreements, tenant rights, and rental insurance",
    icon: <Shield className="h-5 w-5 text-red-500" />,
    resources: [{
      title: "Lease Agreement Red Flags",
      description: "How to identify problematic clauses in your lease",
      link: "/resources/lease-red-flags",
      type: "page",
      badge: "Essential"
    }, {
      title: "Renters Insurance 101",
      description: "Everything you need to know about protecting your belongings",
      link: "/resources/renters-insurance",
      type: "page"
    }]
  }, {
    title: "Down Payment Assistance",
    description: "Programs to help first-time homebuyers with down payment and closing costs",
    icon: <DollarSign className="h-5 w-5 text-purple-500" />,
    resources: [{
      title: "Down Payment Assistance Programs",
      description: "State and federal programs to help you buy your first home",
      link: "/resources/down-payment-programs",
      type: "page",
      badge: "New"
    }]
  }];

  // Resource content for each individual resource
  const resourceContent = {
    "negotiation-templates": {
      title: "Rent Negotiation Email Templates",
      content: <div className="space-y-6">
          <p>
            Negotiating your rent doesn't have to be awkward. Whether you're renewing your lease or moving into a new place, a well-written email can set the tone for a positive negotiation. Here are ready-to-use templates you can customize based on your situation — plus some quick tips to boost your chances.
          </p>
          
          <div className="p-4 rounded-md bg-black text-white">
            <h3 className="font-medium mb-2">Quick Tips Before Sending:</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Do your homework: Know the average rent for similar apartments in your area.</li>
              <li>Be polite but confident: Landlords appreciate professionalism.</li>
              <li>Have a backup request: If they won't lower rent, ask for concessions.</li>
              <li>Timing matters: Lease renewals are best negotiated 60–90 days before expiration.</li>
            </ul>
          </div>
          
          <div className="resource-template">
            <div className="resource-template-header">
              <h3 className="font-medium flex items-center gap-2 text-white">
                <span className="text-blue-400">Template 1:</span> Lease Renewal — Asking for Lower Rent
              </h3>
              <div className="text-sm text-gray-300">Subject: Lease Renewal — Rent Adjustment Discussion</div>
            </div>
            <div className="resource-template-content">
            {`Hi [Landlord's Name],

I hope you're doing well! As my lease approaches renewal, I've been reviewing current rental market trends in [Neighborhood/City], and I've noticed that similar apartments are now renting for around [$MarketRate].

Given my on-time payment history, care for the property, and strong relationship with you as a tenant, I'd like to discuss adjusting the monthly rent to [$ProposedRate].

Please let me know if we can schedule a time to discuss this. I'd love to continue living here and hope we can find terms that work for both of us.

Thank you for your consideration!

Best,  
[Your Name]`}
            </div>
            <div className="resource-template-footer">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-green-900 text-green-100">
                  Pro Tip
                </Badge>
                <span className="text-sm text-gray-300">Attach 2–3 comparable listings showing the lower market price if possible.</span>
              </div>
            </div>
          </div>
          
          <div className="resource-template">
            <div className="resource-template-header">
              <h3 className="font-medium flex items-center gap-2 text-white">
                <span className="text-blue-400">Template 2:</span> New Lease — Negotiating After Receiving Initial Offer
              </h3>
              <div className="text-sm text-gray-300">Subject: Rental Application — Rent Discussion</div>
            </div>
            <div className="resource-template-content">
            {`Hi [Landlord/Agent's Name],

Thank you for considering my application for [Apartment Address]! I'm very interested in the unit and excited about the possibility of living there.

After reviewing similar listings in [Neighborhood/City], I noticed that apartments with comparable amenities are renting for slightly less. Would you be open to discussing a rental rate closer to [$ProposedRate]?

Alternatively, if rent flexibility isn't possible, I'd love to explore options like a move-in incentive or waived parking fees.

Thank you again for your time — I'm happy to discuss at your convenience.

Best,  
[Your Name]`}
            </div>
            <div className="resource-template-footer">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-green-900 text-green-100">
                  Pro Tip
                </Badge>
                <span className="text-sm text-gray-300">Always offer a friendly alternative ("or move-in incentive") — it gives landlords flexibility.</span>
              </div>
            </div>
          </div>
          
          <div className="resource-template">
            <div className="resource-template-header">
              <h3 className="font-medium flex items-center gap-2 text-white">
                <span className="text-blue-400">Template 3:</span> Renewal — Asking for Concessions (Instead of Rent Cut)
              </h3>
              <div className="text-sm text-gray-300">Subject: Lease Renewal — Request for Concession</div>
            </div>
            <div className="resource-template-content">
            {`Hi [Landlord's Name],

I hope you're well. I'm looking forward to potentially renewing my lease at [Apartment Address].

Given the current market conditions and my positive rental history, I'd like to discuss a few possible updates to the lease. Would you be open to offering [choose one: a free month's rent, a reduced security deposit, upgraded appliances, waived parking fees] as part of my renewal?

I really enjoy living here and would love to continue our good relationship. Please let me know if this is something we can explore together.

Thanks so much!

Best,  
[Your Name]`}
            </div>
            <div className="resource-template-footer">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-green-900 text-green-100">
                  Pro Tip
                </Badge>
                <span className="text-sm text-gray-300">Focus on what's easy for them to give you — small incentives often cost landlords less than reducing rent.</span>
              </div>
            </div>
          </div>
          
          <div className="bg-black p-4 rounded-md">
            <h3 className="font-medium mb-2 text-white">Bonus: Best Times to Negotiate</h3>
            <ul className="list-disc pl-5 space-y-1 text-gray-300">
              <li>60–90 days before your lease ends</li>
              <li>Winter months (lower tenant demand = more landlord flexibility)</li>
              <li>When units in your building are sitting vacant</li>
              <li>Black swan events</li>
            </ul>
          </div>
          
          <div className="flex justify-end">
            <Button variant="outline" asChild className="gap-1">
              <Link to="/resources">
                <ChevronLeft className="h-4 w-4" /> Back to Resources
              </Link>
            </Button>
          </div>
        </div>
    },
    "price-comparison": {
      title: "Rental Price Comparison Tool Guide",
      content: <div className="space-y-6">
          <p>
            Before you negotiate or sign any lease, it's crucial to understand the rental market around you. 
            Knowing what similar apartments are renting for gives you powerful leverage — and helps you avoid overpaying.
            Here's a quick guide (and free tools) to help you compare rental prices like a pro.
          </p>
          
          <div className="space-y-4">
            <div className="resource-template">
              <div className="resource-template-header">
                <h3 className="font-medium text-white">Step-by-Step: How to Compare Rental Prices</h3>
              </div>
              <div className="resource-template-content">
                <div>
                  <h4 className="font-medium text-blue-400">1. Pick 3–5 Comparable Apartments</h4>
                  <ul className="list-disc pl-5 mt-2 space-y-1">
                    <li>Look for units with a similar number of bedrooms, bathrooms, and amenities</li>
                    <li>Stay within the same neighborhood or ZIP code if possible</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium text-blue-400">2. Use These Tools for Research</h4>
                  <ul className="list-disc pl-5 mt-2 space-y-1">
                    <li>Zillow Rentals → Great for broad overviews and filtering by neighborhood</li>
                    <li>Apartments.com → Good for apartment complexes and updated availability</li>
                    <li>Zumper → Can occasionally find deals that aren't on the other sites</li>
                    <li>Facebook Marketplace → Useful for private landlords and deals that aren't on big sites</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium text-blue-400">3. What to Look For</h4>
                  <ul className="list-disc pl-5 mt-2 space-y-1">
                    <li>Monthly Rent ($)</li>
                    <li>Square Footage</li>
                    <li>Building Amenities (gym, pool, parking)</li>
                    <li>Lease Terms (6 months vs 12 months — shorter leases often cost more)</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium text-blue-400">4. Document Your Findings</h4>
                  <div className="mt-2">
                    <p className="mb-2">Make a simple table or spreadsheet:</p>
                    <div className="overflow-x-auto">
                      <table className="min-w-full border border-gray-700">
                        <thead>
                          <tr className="bg-gray-900">
                            <th className="p-2 text-left">Address</th>
                            <th className="p-2 text-left">Rent</th>
                            <th className="p-2 text-left">Bedrooms</th>
                            <th className="p-2 text-left">Square Feet</th>
                            <th className="p-2 text-left">Notable Amenities</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="p-2 border-t border-gray-700">123 Main St</td>
                            <td className="p-2 border-t border-gray-700">$1,950</td>
                            <td className="p-2 border-t border-gray-700">2bd/2ba</td>
                            <td className="p-2 border-t border-gray-700">1,100 sq ft</td>
                            <td className="p-2 border-t border-gray-700">Gym, Covered Parking</td>
                          </tr>
                          <tr>
                            <td className="p-2 border-t border-gray-700">555 Elm St</td>
                            <td className="p-2 border-t border-gray-700">$1,875</td>
                            <td className="p-2 border-t border-gray-700">2bd/2ba</td>
                            <td className="p-2 border-t border-gray-700">1,050 sq ft</td>
                            <td className="p-2 border-t border-gray-700">Pool, Pet Friendly</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-blue-400">5. Calculate Your Offer</h4>
                  <ul className="list-disc pl-5 mt-2 space-y-1">
                    <li>If your current offer is above market by more than 5%, you have strong grounds to negotiate</li>
                    <li>If it's at or slightly below market, focus on negotiating concessions (free parking, upgraded appliances, waived fees)</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="bg-black p-4 rounded-md">
              <h3 className="font-medium mb-2 text-white">Pro Tips for Better Results</h3>
              <ul className="list-disc pl-5 space-y-1 text-white">
                <li>Screenshot listings — if a landlord removes them later, you still have proof</li>
                <li>Compare recently rented units, not just listed ones — active listings can sometimes be overpriced</li>
                <li>Use the same radius — try to stay within 1 mile unless in very spread-out suburban areas</li>
              </ul>
            </div>
          </div>
          
          <div className="flex justify-end">
            <Button variant="outline" asChild className="gap-1">
              <Link to="/resources">
                <ChevronLeft className="h-4 w-4" /> Back to Resources
              </Link>
            </Button>
          </div>
        </div>
    },
    "move-in-checklist": {
      title: "Move-In Apartment Checklist",
      content: <div className="space-y-6">
          <p>
            Moving into a new apartment is exciting — but small oversights can cost you later.
            Use this essential Move-In Checklist to document your unit's condition, protect your security deposit, and ensure nothing gets missed.
          </p>
          
          <div className="resource-template">
            <div className="resource-template-header">
              <h3 className="font-medium text-white">Complete Move-In Inspection Checklist</h3>
            </div>
            <div className="resource-template-content grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-blue-400 mb-2">General Condition</h4>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <div className="mt-1 h-5 w-5 rounded border border-gray-700 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    </div>
                    <span>Check walls, ceilings, and floors for cracks, stains, dents, or damage</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="mt-1 h-5 w-5 rounded border border-gray-700 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    </div>
                    <span>Test all lights, outlets, and light switches</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="mt-1 h-5 w-5 rounded border border-gray-700 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    </div>
                    <span>Ensure smoke detectors and carbon monoxide detectors are working</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="mt-1 h-5 w-5 rounded border border-gray-700 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    </div>
                    <span>Inspect windows (locks, screens, ease of opening)</span>
                  </li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium text-blue-400 mb-2">Doors and Locks</h4>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <div className="mt-1 h-5 w-5 rounded border border-gray-700 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    </div>
                    <span>Test all door locks and keys</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="mt-1 h-5 w-5 rounded border border-gray-700 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    </div>
                    <span>Check peephole (if provided)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="mt-1 h-5 w-5 rounded border border-gray-700 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    </div>
                    <span>Confirm any security system details (if applicable)</span>
                  </li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium text-blue-400 mb-2">Kitchen</h4>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <div className="mt-1 h-5 w-5 rounded border border-gray-700 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    </div>
                    <span>Check stove/oven functionality</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="mt-1 h-5 w-5 rounded border border-gray-700 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    </div>
                    <span>Inspect refrigerator and freezer for cleanliness and cooling</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="mt-1 h-5 w-5 rounded border border-gray-700 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    </div>
                    <span>Test dishwasher, garbage disposal, and microwave</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="mt-1 h-5 w-5 rounded border border-gray-700 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    </div>
                    <span>Check for signs of pests under sinks and behind appliances</span>
                  </li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium text-blue-400 mb-2">Bathroom</h4>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <div className="mt-1 h-5 w-5 rounded border border-gray-700 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    </div>
                    <span>Run water in sinks, showers, tubs — check for leaks or clogs</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="mt-1 h-5 w-5 rounded border border-gray-700 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    </div>
                    <span>Flush toilets to ensure proper operation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="mt-1 h-5 w-5 rounded border border-gray-700 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    </div>
                    <span>Inspect caulking and grout for mold or water damage</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="mt-1 h-5 w-5 rounded border border-gray-700 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    </div>
                    <span>Confirm proper ventilation (fan or window)</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="pro-tip">
            <h3 className="pro-tip-header">Pro Tips for Move-In</h3>
            <ul className="space-y-2 pro-tip-content">
              <li className="flex items-center gap-3">
                <div className="text-blue-400">📸</div>
                <span>Take photos of any imperfections and email them to yourself and your landlord the day you move in</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="text-blue-400">📜</div>
                <span>Request a signed copy of your move-in condition checklist</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="text-blue-400">🔑</div>
                <span>Confirm mailbox keys, building fobs, and access cards are provided</span>
              </li>
            </ul>
          </div>
          
          <div className="flex justify-end">
            <Button variant="outline" asChild className="gap-1">
              <Link to="/resources">
                <ChevronLeft className="h-4 w-4" /> Back to Resources
              </Link>
            </Button>
          </div>
        </div>
    },
    "security-deposit": {
      title: "Security Deposit Recovery Guide",
      content: <div className="space-y-6">
          <p>
            Want your full security deposit back? Landlords often withhold deposits for avoidable reasons — but a little preparation can make sure you walk away with 100% of what's yours. Here's your complete guide to securing a full return when you move out.
          </p>
          
          <div className="resource-template">
            <div className="resource-template-header">
              <h3 className="font-medium text-white">Steps to Maximize Your Security Deposit Return</h3>
            </div>
            <div className="resource-template-content space-y-4">
              <div>
                <h4 className="font-medium text-blue-400">1. Document the Apartment at Move-In</h4>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>Complete a move-in checklist when you arrive</li>
                  <li>Photograph every room, focusing on existing damage</li>
                  <li>Email a copy to yourself and your landlord to create a timestamped record</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium text-blue-400">2. Give Proper Notice</h4>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>Review your lease for exact move-out notice requirements (30/60 days? Written/email?)</li>
                  <li>Always document giving your notice — email or certified mail are best</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium text-blue-400">3. Deep Clean Thoroughly</h4>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>Scrub floors, appliances, baseboards, and walls</li>
                  <li>Fill nail holes carefully (some landlords require it; others prefer to patch professionally — check first!)</li>
                  <li>Clean inside ovens, fridges, microwaves, bathtubs — places landlords often inspect</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium text-blue-400">4. Complete Minor Repairs</h4>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>Replace burnt-out light bulbs</li>
                  <li>Patch small holes and repaint only if required by lease</li>
                  <li>Fix anything you broke that's reasonable to repair</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium text-blue-400">5. Schedule a Walkthrough</h4>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>Request a pre-move-out inspection if local laws allow</li>
                  <li>Walk through with the landlord and take notes on anything they flag</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium text-blue-400">6. Leave the Unit Empty and Ready</h4>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>Remove all trash, furniture, and belongings</li>
                  <li>Return all keys, garage remotes, and fobs</li>
                  <li>Leave a forwarding address for your deposit refund</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium text-blue-400">7. Demand an Itemized Deduction List (if needed)</h4>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>If your deposit is withheld, you have a legal right in most states to request a detailed list of deductions</li>
                  <li>Some states impose penalties if the landlord fails to send this within a legal timeframe (often 30 days)</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="pro-tip">
            <h3 className="pro-tip-header">Pro Tips</h3>
            <ul className="space-y-2 pro-tip-content">
              <li className="flex items-center gap-3">
                <div className="text-blue-400">📸</div>
                <span>Take photos of the cleaned, empty apartment right before you leave</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="text-blue-400">📑</div>
                <span>Keep receipts for any cleaning services or repairs you paid for</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="text-blue-400">⚖️</div>
                <span>Know your local tenant rights — security deposit laws vary by state</span>
              </li>
            </ul>
          </div>
          
          <div className="flex justify-end">
            <Button variant="outline" asChild className="gap-1">
              <Link to="/resources">
                <ChevronLeft className="h-4 w-4" /> Back to Resources
              </Link>
            </Button>
          </div>
        </div>
    },
    "viewing-checklist": {
      title: "Apartment Viewing Checklist",
      content: <div className="space-y-6">
          <p>
            Touring a new apartment can be overwhelming — but it's your best chance to spot hidden issues before signing. Use this Apartment Viewing Checklist to stay sharp, ask the right questions, and avoid costly surprises.
          </p>
          
          <div className="resource-template">
            <div className="resource-template-header">
              <h3 className="font-medium text-white">Essential Apartment Viewing Checklist</h3>
            </div>
            <div className="resource-template-content grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-blue-400 mb-2">General Condition</h4>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <div className="mt-1 h-5 w-5 rounded border border-gray-700 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    </div>
                    <span>Check walls, ceilings, and floors for cracks, stains, dents, or damage</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="pro-tip">
            <h3 className="pro-tip-header">Pro Tips for Viewing</h3>
            <ul className="space-y-2 pro-tip-content">
              <li className="flex items-center gap-3">
                <div className="text-blue-400">🕒</div>
                <span>Visit at different times of day to check noise levels and natural lighting</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="text-blue-400">📱</div>
                <span>Check cell reception in all rooms — especially if you work from home</span>
              </li>
            </ul>
          </div>
          
          <div className="flex justify-end">
            <Button variant="outline" asChild className="gap-1">
              <Link to="/resources">
                <ChevronLeft className="h-4 w-4" /> Back to Resources
              </Link>
            </Button>
          </div>
        </div>
    },
    "down-payment-assistance": {
      title: "Down Payment Assistance Programs",
      content: <div className="space-y-6">
          <p>
            Finding it hard to save for a down payment? You're not alone. Fortunately, there are numerous programs 
            designed to help homebuyers—especially first-timers—get into a home with less money upfront.
            Browse available programs by state or explore nationwide options below.
          </p>
          
          <div className="flex flex-col space-y-4">
            <Link to="/resources/down-payment-programs" className="w-full">
              <Button className="w-full bg-purple-600 hover:bg-purple-700">
                <DollarSign className="mr-2 h-4 w-4" />
                View All Down Payment Programs
              </Button>
            </Link>
          </div>
          
          <div className="space-y-4">
            <h3 className="font-medium text-lg">What to Know About Down Payment Assistance</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Types of Programs</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Grants (non-repayable gifts)</li>
                    <li>Forgivable loans (forgiven over time)</li>
                    <li>Deferred-payment loans (due when you sell)</li>
                    <li>Low-interest loans (second mortgages)</li>
                    <li>Matched savings programs</li>
                  </ul>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Common Requirements</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>First-time homebuyer status</li>
                    <li>Income limits</li>
                    <li>Home price limits</li>
                    <li>Credit score minimums</li>
                    <li>Homebuyer education courses</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
          
          <div className="flex justify-end">
            <Button variant="outline" asChild className="gap-1">
              <Link to="/resources">
                <ChevronLeft className="h-4 w-4" /> Back to Resources
              </Link>
            </Button>
          </div>
        </div>
    }
  };

  // If a resourceId is specified, show that specific resource
  if (resourceId && resourceContent[resourceId]) {
    return (
      <div className="container py-8 bg-background">
        <div className="flex items-center gap-2 mb-8">
          <Button variant="outline" asChild>
            <Link to="/">
              <Home className="h-4 w-4 mr-2" />
              Home
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">{resourceContent[resourceId].title}</h1>
        </div>
        
        {resourceContent[resourceId].content}
      </div>
    );
  }

  // Otherwise show the resource listing page (default view)
  return (
    <div className="container py-8 bg-background">
      <div className="flex items-center gap-2 mb-8">
        <Button variant="outline" asChild>
          <Link to="/">
            <Home className="h-4 w-4 mr-2" />
            Home
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Resources</h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {resourceCategories.map((category, index) => (
          <Card key={index} className="bg-card text-card-foreground">
            <CardHeader>
              <div className="flex items-center gap-2">
                {category.icon}
                <CardTitle>{category.title}</CardTitle>
              </div>
              <CardDescription>{category.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                {category.resources.map((resource, idx) => (
                  <li key={idx} className="flex flex-col">
                    <div className="flex items-start gap-2">
                      <div className="flex-shrink-0 mt-1">
                        <FileText className="h-4 w-4 text-blue-500" />
                      </div>
                      <div className="flex-1">
                        <Link 
                          to={resource.link} 
                          className="font-medium hover:text-blue-500 transition-colors"
                        >
                          {resource.title}
                          {resource.badge && (
                            <Badge variant="secondary" className="ml-2 bg-blue-900 text-blue-100">
                              {resource.badge}
                            </Badge>
                          )}
                        </Link>
                        <p className="text-sm text-muted-foreground">{resource.description}</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Resources;
