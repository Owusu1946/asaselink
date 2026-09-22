import { PublicPageShell } from "@/components/home/public-page-shell";
import { ViabilityChecker } from "@/components/viability/viability-checker";

export default function ViabilityPage() {
  return <PublicPageShell title="Check land viability" intro="Screen a location against available environmental and planning concern layers before you commit time or money."><ViabilityChecker /></PublicPageShell>;
}

