import { Link } from "@tanstack/react-router";
import { Mail, Send } from "lucide-react";
import { Logo } from "@/components/Logo";

const socials = [
  { name: "Telegram", href: "https://t.me/onechanceweb", icon: Send },
];

export function Footer() {
  return (
    <footer className="border-t border-border py-10">
      <div className="mx-auto max-w-5xl px-4">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          <div className="col-span-2 sm:col-span-1">
            <Logo />
            <p className="mt-3 text-xs text-muted-foreground">© 2026 1Chance</p>
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Legal</h4>
            <ul className="mt-3 space-y-2 text-sm">
              <li><Link to="/terms" className="text-muted-foreground hover:text-foreground">Terms</Link></li>
              <li><Link to="/privacy" className="text-muted-foreground hover:text-foreground">Privacy</Link></li>
              <li><Link to="/safety" className="text-muted-foreground hover:text-foreground">Safety</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Company</h4>
            <ul className="mt-3 space-y-2 text-sm">
              <li><Link to="/support" className="text-muted-foreground hover:text-foreground">Support</Link></li>
              <li>
                <a href="mailto:cheapbrosgang@gmail.com" className="text-muted-foreground hover:text-foreground">Contact</a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Socials</h4>
            <ul className="mt-3 space-y-2 text-sm">
              {socials.map((social) => (
                <li key={social.name}>
                  <a href={social.href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
                    <social.icon className="h-4 w-4" />
                    {social.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
