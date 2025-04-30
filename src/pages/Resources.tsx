
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, ExternalLink } from "lucide-react";

const Resources = () => {
  const resourceCategories = [
    {
      title: "Negotiation Guides",
      description: "Step-by-step guides for different negotiation scenarios",
      resources: [
        { title: "First-time Renter's Guide", link: "/renters-playbook.pdf", type: "pdf" },
        { title: "Negotiation Checklist", link: "#", type: "pdf" },
        { title: "Tenant Rights Overview", link: "#", type: "link" },
      ]
    },
    {
      title: "Templates",
      description: "Ready-to-use templates for rental negotiations",
      resources: [
        { title: "Rent Reduction Email Template", link: "#", type: "pdf" },
        { title: "Maintenance Request Template", link: "#", type: "pdf" },
        { title: "Lease Renewal Letter", link: "#", type: "pdf" },
      ]
    },
    {
      title: "Learning Materials",
      description: "Educational content to improve your negotiation skills",
      resources: [
        { title: "Understanding Market Rates", link: "#", type: "link" },
        { title: "Effective Communication Skills", link: "#", type: "link" },
        { title: "Common Negotiation Mistakes", link: "#", type: "link" },
      ]
    },
  ];

  return (
    <div className="container py-6">
      <div className="space-y-6">
        {/* Header section */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-cyan-400">Resources</h1>
          <p className="text-cyan-100/70">
            Access our collection of guides, templates, and learning materials to help you succeed in rental negotiations.
          </p>
        </div>

        {/* Resource categories */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {resourceCategories.map((category) => (
            <Card key={category.title} className="shadow-md border-blue-100">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-transparent dark:from-blue-900/20 dark:to-transparent border-b">
                <CardTitle>{category.title}</CardTitle>
                <CardDescription>
                  {category.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <ul className="space-y-3">
                  {category.resources.map((resource) => (
                    <li key={resource.title} className="flex items-center justify-between">
                      <span className="font-medium">{resource.title}</span>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        asChild
                        className="ml-2"
                      >
                        <a href={resource.link} target="_blank" rel="noopener noreferrer">
                          {resource.type === "pdf" ? (
                            <><Download className="h-4 w-4 mr-1" /> PDF</>
                          ) : (
                            <><ExternalLink className="h-4 w-4 mr-1" /> View</>
                          )}
                        </a>
                      </Button>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Resources;
