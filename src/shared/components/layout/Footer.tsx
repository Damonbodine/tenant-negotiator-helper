
export const Footer = () => {
  return (
    <footer className="py-6 border-t">
      <div className="container flex flex-col items-center gap-2 md:flex-row md:justify-between">
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} Tenant Negotiator. All rights reserved.
        </p>
        <div className="flex items-center gap-4">
          <a 
            href="/privacy" 
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Privacy
          </a>
          <a 
            href="/terms" 
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Terms
          </a>
        </div>
      </div>
    </footer>
  );
}
