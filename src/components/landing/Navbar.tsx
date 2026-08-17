import { PsLogo } from "@/components/PsLogo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router";

const LINKS = [
  { href: "#alur", label: "Alur" },
  { href: "#fitur", label: "Fitur" },
  { href: "#suara", label: "Suara" },
  { href: "#preset", label: "Preset" },
];

export function Navbar() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const studioHref = isAuthenticated ? "/studio" : "/auth?returnTo=/studio";

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border/60 bg-background/75 backdrop-blur-xl">
      <nav className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <PsLogo onClick={() => navigate("/")} />

        <div className="hidden items-center gap-1 md:flex">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {!isAuthenticated && (
            <Button
              type="button"
              variant="ghost"
              className="hidden sm:inline-flex"
              onClick={() => navigate("/auth?returnTo=/studio")}
            >
              Masuk
            </Button>
          )}
          <Button
            type="button"
            className="cursor-pointer gap-1.5"
            onClick={() => navigate(studioHref)}
          >
            Buka Studio
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </nav>
    </header>
  );
}
