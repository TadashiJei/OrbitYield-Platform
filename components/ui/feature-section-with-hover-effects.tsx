import { cn } from "@/lib/utils";
import {
  IconAdjustmentsBolt,
  IconCloud,
  IconCurrencyDollar,
  IconEaseInOut,
  IconHeart,
  IconHelp,
  IconRouteAltLeft,
  IconTerminal2,
} from "@tabler/icons-react";

export function FeaturesSectionWithHoverEffects() {
  const features = [
    {
      title: "Cross-Chain Yield Optimization",
      description:
        "Automatically identifies and allocates funds to the best yield opportunities across blockchains.",
      icon: <IconTerminal2 className="h-6 w-6 text-polkadot-pink" />,
    },
    {
      title: "Auto-Rebalancing Strategies",
      description:
        "Dynamically moves funds based on real-time APY changes to maximize your returns.",
      icon: <IconEaseInOut className="h-6 w-6 text-polkadot-pink" />,
    },
    {
      title: "Risk Assessment Scoring",
      description:
        "AI-powered evaluation of liquidity pools to help mitigate risks and protect your assets.",
      icon: <IconCurrencyDollar className="h-6 w-6 text-polkadot-pink" />,
    },
    {
      title: "LP Token Staking & Rewards",
      description: "Earn extra yield through staking your LP tokens for additional rewards.",
      icon: <IconCloud className="h-6 w-6 text-polkadot-pink" />,
    },
    {
      title: "Multi-chain Architecture",
      description: "Deploy your assets across multiple blockchains from a single interface.",
      icon: <IconRouteAltLeft className="h-6 w-6 text-polkadot-pink" />,
    },
    {
      title: "24/7 Monitoring Dashboard",
      description:
        "Real-time monitoring of your positions with alerts and performance tracking.",
      icon: <IconHelp className="h-6 w-6 text-polkadot-pink" />,
    },
    {
      title: "Advanced Analytics",
      description:
        "Comprehensive insights into your portfolio performance with historical trend analysis.",
      icon: <IconAdjustmentsBolt className="h-6 w-6 text-polkadot-pink" />,
    },
    {
      title: "Community-Driven Strategies",
      description: "Access to community-created yield strategies vetted by security experts.",
      icon: <IconHeart className="h-6 w-6 text-polkadot-pink" />,
    },
  ];
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 relative z-10 py-10 max-w-7xl mx-auto">
      {features.map((feature, index) => (
        <Feature key={feature.title} {...feature} index={index} />
      ))}
    </div>
  );
}

const Feature = ({
  title,
  description,
  icon,
  index,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  index: number;
}) => {
  return (
    <div
      className={cn(
        "flex flex-col lg:border-r py-10 relative group/feature dark:border-neutral-800",
        (index === 0 || index === 4) && "lg:border-l dark:border-neutral-800",
        index < 4 && "lg:border-b dark:border-neutral-800"
      )}
    >
      {index < 4 && (
        <div className="opacity-0 group-hover/feature:opacity-100 transition duration-200 absolute inset-0 h-full w-full bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />
      )}
      {index >= 4 && (
        <div className="opacity-0 group-hover/feature:opacity-100 transition duration-200 absolute inset-0 h-full w-full bg-gradient-to-b from-black/30 to-transparent pointer-events-none" />
      )}
      <div className="mb-4 relative z-10 px-10 text-neutral-400">
        {icon}
      </div>
      <div className="text-lg font-bold mb-2 relative z-10 px-10">
        <div className="absolute left-0 inset-y-0 h-6 group-hover/feature:h-8 w-1 rounded-tr-full rounded-br-full bg-neutral-700 group-hover/feature:bg-polkadot-pink transition-all duration-200 origin-center" />
        <span className="group-hover/feature:translate-x-2 transition duration-200 inline-block text-white">
          {title}
        </span>
      </div>
      <p className="text-sm text-neutral-300 max-w-xs relative z-10 px-10">
        {description}
      </p>
    </div>
  );
};
