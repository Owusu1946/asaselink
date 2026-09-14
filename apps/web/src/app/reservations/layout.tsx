import ApiProvider from "@/components/api-provider";

export default function ReservationFlowLayout({ children }: { children: React.ReactNode }) {
  return <ApiProvider clerkEnabled>{children}</ApiProvider>;
}
