import { Milestone } from "@/lib/types";
import { MilestoneStateBadge } from "@/components/campaign-state-badge";
import { MilestoneState } from "@/lib/contracts";
import { formatDate, formatCountdown } from "@/lib/web3-utils";
import { CheckCircle2, Circle, Clock, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface MilestoneTimelineProps {
  milestones: Milestone[];
  currentMilestone: number;
  onVote?: (milestoneIndex: number) => void;
  showVoteButton?: boolean;
}

export function MilestoneTimeline({ 
  milestones, 
  currentMilestone,
  onVote,
  showVoteButton = false
}: MilestoneTimelineProps) {
  const getMilestoneIcon = (index: number, state: MilestoneState) => {
    if (state === MilestoneState.Completed || state === MilestoneState.Approved) {
      return <CheckCircle2 className="w-5 h-5 text-green-500" />;
    }
    if (index === currentMilestone) {
      return <Clock className="w-5 h-5 text-primary" />;
    }
    return <Circle className="w-5 h-5 text-muted-foreground" />;
  };

  return (
    <div className="space-y-4">
      {milestones.map((milestone, index) => {
        const isActive = index === currentMilestone;
        const isPast = index < currentMilestone;
        const isFuture = index > currentMilestone;
        const isVoting = milestone.state === MilestoneState.Voting;
        
        return (
          <div key={index} className="relative">
            {/* Connector line */}
            {index < milestones.length - 1 && (
              <div 
                className={cn(
                  "absolute left-[10px] top-[30px] w-0.5 h-[calc(100%+16px)]",
                  isPast ? "bg-green-500" : "bg-muted"
                )}
              />
            )}
            
            {/* Milestone card */}
            <div 
              className={cn(
                "relative flex gap-4 p-4 rounded-lg border",
                isActive && "bg-primary/5 border-primary",
                isPast && "bg-muted/50",
                isFuture && "opacity-60"
              )}
            >
              {/* Icon */}
              <div className="flex-shrink-0 mt-1">
                {getMilestoneIcon(index, milestone.state)}
              </div>
              
              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h4 className="font-semibold flex items-center gap-2">
                      Milestone {index}
                      <MilestoneStateBadge state={milestone.state} />
                    </h4>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{milestone.releasePercentage}%</p>
                    <p className="text-xs text-muted-foreground">Release</p>
                  </div>
                </div>
                
                <p className="text-sm text-muted-foreground mb-2">
                  {milestone.description}
                </p>
                
                {/* Deadline */}
                <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                  <div>
                    <span className="font-medium">Deadline: </span>
                    {formatDate(milestone.deadline)}
                  </div>
                  {isActive && milestone.state === MilestoneState.Pending && (
                    <div className="text-orange-500">
                      {formatCountdown(milestone.deadline)} remaining
                    </div>
                  )}
                </div>
                
                {/* Voting info */}
                {isVoting && (
                  <div className="mt-3 p-3 bg-purple-500/10 border border-purple-500/20 rounded-md">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-purple-400">Voting in Progress</span>
                      <span className="text-xs text-muted-foreground">
                        Ends: {formatDate(milestone.votingDeadline)}
                      </span>
                    </div>
                    
                    {/* Vote stats */}
                    <div className="grid grid-cols-2 gap-2 text-sm mb-2">
                      <div>
                        <div className="text-xs text-muted-foreground">YES Votes</div>
                        <div className="font-medium text-green-500">
                          {((Number(milestone.yesVotes) / (Number(milestone.yesVotes) + Number(milestone.noVotes))) * 100 || 0).toFixed(1)}%
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">NO Votes</div>
                        <div className="font-medium text-red-500">
                          {((Number(milestone.noVotes) / (Number(milestone.yesVotes) + Number(milestone.noVotes))) * 100 || 0).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                    
                    {showVoteButton && onVote && (
                      <Button 
                        size="sm" 
                        className="w-full"
                        onClick={() => onVote(index)}
                      >
                        Vote on This Milestone
                      </Button>
                    )}
                  </div>
                )}
                
                {/* IPFS evidence */}
                {milestone.ipfsHash && milestone.ipfsHash !== "" && (
                  <div className="mt-2">
                    <a
                      href={`https://ipfs.io/ipfs/${milestone.ipfsHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline flex items-center gap-1"
                    >
                      View Evidence <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
                
                {/* Submitted info */}
                {milestone.submittedAt > 0 && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    Submitted: {formatDate(milestone.submittedAt)}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

