import { primaryBannerItems, secondaryBannerItems } from "@/data/landing";

interface CapabilitiesBannerProps {
  reverse?: boolean;
  variant?: "primary" | "secondary";
}

export function CapabilitiesBanner({ reverse = false, variant = "primary" }: CapabilitiesBannerProps) {
  const items = variant === "primary" ? primaryBannerItems : secondaryBannerItems;

  return (
    <div className={`overflow-hidden py-8 border-y ${variant === "primary"
      ? "bg-stone-950 border-stone-800"
      : "bg-stone-900/50 border-stone-800/50"
      }`}>
      <div
        className={`flex gap-12 whitespace-nowrap ${reverse ? "animate-ticker-reverse" : "animate-ticker"}`}
        style={{ width: "max-content" }}
      >
        {[...items, ...items, ...items, ...items].map((item, i) => (
          <span key={i} className="flex items-center gap-12 text-sm font-semibold uppercase tracking-[0.2em]">
            <span className={variant === "primary" ? "text-stone-300" : "text-stone-500"}>{item}</span>
            <span className="text-[#7c3aed]">◆</span>
          </span>
        ))}
      </div>
    </div>
  );
}
