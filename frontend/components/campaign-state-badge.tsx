import { Badge } from "@/components/ui/badge";
import { CampaignState, MilestoneState } from "@/lib/contracts";
import { cn } from "@/lib/utils";

interface CampaignStateBadgeProps {
  state: CampaignState;
  className?: string;
}

export function CampaignStateBadge({ state, className }: CampaignStateBadgeProps) {
  const getStateConfig = () => {
    switch (state) {
      case CampaignState.Funding:
        return {
          label: "Funding",
          className: "bg-yellow-500/20 text-yellow-500 border-yellow-500/30"
        };
      case CampaignState.Development:
        return {
          label: "Development",
          className: "bg-green-500/20 text-green-500 border-green-500/30"
        };
      case CampaignState.Completed:
        return {
          label: "Completed",
          className: "bg-blue-500/20 text-blue-500 border-blue-500/30"
        };
      case CampaignState.Failed:
        return {
          label: "Failed",
          className: "bg-red-500/20 text-red-500 border-red-500/30"
        };
      default:
        return {
          label: "Unknown",
          className: "bg-gray-500/20 text-gray-500 border-gray-500/30"
        };
    }
  };

  const config = getStateConfig();
  
  return (
    <Badge 
      variant="outline" 
      className={cn(config.className, className)}
    >
      {config.label}
    </Badge>
  );
}

interface MilestoneStateBadgeProps {
  state: MilestoneState;
  className?: string;
}

export function MilestoneStateBadge({ state, className }: MilestoneStateBadgeProps) {
  const getStateConfig = () => {
    switch (state) {
      case MilestoneState.Pending:
        return {
          label: "Pending",
          className: "bg-gray-500/20 text-gray-400 border-gray-500/30"
        };
      case MilestoneState.Submitted:
        return {
          label: "Submitted",
          className: "bg-blue-500/20 text-blue-500 border-blue-500/30"
        };
      case MilestoneState.Completed:
        return {
          label: "Completed",
          className: "bg-green-500/20 text-green-500 border-green-500/30"
        };
      default:
        return {
          label: "Unknown",
          className: "bg-gray-500/20 text-gray-500 border-gray-500/30"
        };
    }
  };

  const config = getStateConfig();
  
  return (
    <Badge 
      variant="outline" 
      className={cn(config.className, className)}
    >
      {config.label}
    </Badge>
  );
}

