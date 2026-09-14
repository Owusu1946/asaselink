import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Location01Icon,
  ShieldCheckIcon,
} from "@hugeicons/core-free-icons";

export function LandingFooter() {
  return (
    <footer className="border-t border-border/80 bg-background text-foreground pt-14 pb-12 px-4 sm:px-6 md:px-8">
      <div className="mx-auto max-w-6xl">
        {/* 4 Column Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pb-12 border-b border-border/70 text-xs">
          {/* Col 1: Marketplace */}
          <div className="flex flex-col gap-3">
            <h4 className="font-semibold text-foreground tracking-tight text-sm">Marketplace</h4>
            <Link href="#explore-lands" className="text-muted-foreground hover:text-foreground transition-colors">
              Explore All Estates
            </Link>
            <Link href="#explore-lands" className="text-muted-foreground hover:text-foreground transition-colors">
              East Legon Hills
            </Link>
            <Link href="#explore-lands" className="text-muted-foreground hover:text-foreground transition-colors">
              Prampram Coastal
            </Link>
            <Link href="#explore-lands" className="text-muted-foreground hover:text-foreground transition-colors">
              Aburi Mountain Ridge
            </Link>
            <Link href="#explore-lands" className="text-muted-foreground hover:text-foreground transition-colors">
              Cantonments Urban
            </Link>
          </div>

          {/* Col 2: For Companies */}
          <div className="flex flex-col gap-3">
            <h4 className="font-semibold text-foreground tracking-tight text-sm">For Land Companies</h4>
            <Link href="/company/apply" className="text-muted-foreground hover:text-foreground transition-colors">
              Apply as a Company
            </Link>
            <Link href="/sign-in" className="text-muted-foreground hover:text-foreground transition-colors">
              Company Workspace Sign In
            </Link>
            <Link href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">
              Verification Standards
            </Link>
            <Link href="/company/apply" className="text-muted-foreground hover:text-foreground transition-colors">
              Inventory & Layout Tools
            </Link>
          </div>

          {/* Col 3: Platform */}
          <div className="flex flex-col gap-3">
            <h4 className="font-semibold text-foreground tracking-tight text-sm">Platform & Trust</h4>
            <Link href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">
              How AsaseLink Works
            </Link>
            <Link href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">
              Geographic & Boundary Integrity
            </Link>
            <Link href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">
              Buyer Reservation Security
            </Link>
            <Link href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">
              Transparent Plot Status
            </Link>
          </div>

          {/* Col 4: Account & Support */}
          <div className="flex flex-col gap-3">
            <h4 className="font-semibold text-foreground tracking-tight text-sm">Account & Access</h4>
            <Link href="/sign-in" className="text-muted-foreground hover:text-foreground transition-colors">
              Buyer Sign In
            </Link>
            <Link href="/sign-up?intent=buyer" className="text-muted-foreground hover:text-foreground transition-colors">
              Create Buyer Account
            </Link>
            <Link href="/company/apply" className="text-muted-foreground hover:text-foreground transition-colors">
              Company Onboarding
            </Link>
            <Link href="/support" className="text-muted-foreground hover:text-foreground transition-colors">Help centre</Link>
            <Link href="/contact" className="text-muted-foreground hover:text-foreground transition-colors">Contact us</Link>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          {/* Brand & Copyright */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 font-semibold text-foreground">
              <span className="size-2 rounded-full bg-brand-gold-500" />
              <span>AsaseLink</span>
            </div>
            <span>&copy; {new Date().getFullYear()} AsaseLink Platform. All rights reserved.</span>
          </div>

          {/* Region & Currency Tag */}
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
            <Link href="/terms" className="hover:text-foreground">Terms</Link>
            <div className="flex items-center gap-1.5 font-medium text-foreground">
              <HugeiconsIcon icon={Location01Icon} size={14} className="text-brand-green-800 dark:text-brand-green-400" />
              <span>Accra, Ghana &middot; GHS (GH&#8373;)</span>
            </div>

            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <HugeiconsIcon icon={ShieldCheckIcon} size={13} className="text-brand-gold-500" />
              <span>Spatially Verified</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
