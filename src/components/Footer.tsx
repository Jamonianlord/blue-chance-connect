import { Link } from "@tanstack/react-router";
import { Send } from "lucide-react";

const socials = [
  { name: "Telegram", href: "https://t.me/onechanceweb", icon: Send },
];

export function Footer() {
  return (
    <footer className="border-t border-border py-8">
      <div className="mx-auto max-w-5xl px-4">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex flex-wrap justify-center gap-5 text-sm">
            <Link to="/terms" className="text-muted-foreground hover:text-foreground">Terms</Link>
            <Link to="/privacy" className="text-muted-foreground hover:text-foreground">Privacy</Link>
            <a href="mailto:support@1chance.online" className="text-muted-foreground hover:text-foreground">support@1chance.online</a>
          </div>
          <div className="flex items-center gap-4">
            {socials.map((social) => (
              <a key={social.name} href={social.href} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
                <social.icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>
        <div className="mt-4 text-center text-xs text-muted-foreground">
          © 2026 1Chance
        </div>
      </div>
    </footer>
  );
}
