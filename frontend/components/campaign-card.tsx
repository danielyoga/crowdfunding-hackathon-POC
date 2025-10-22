"use client"

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { CampaignCardData } from "@/lib/types"
import { CampaignState, isCampaignActive } from "@/lib/contracts"
import { Calendar, Target, TrendingUp, Users } from "lucide-react"
import Link from "next/link"

interface CampaignCardProps {
  campaign: CampaignCardData
}

export function CampaignCard({ campaign }: CampaignCardProps) {
  // Get state styling
  const getStateStyle = (state: CampaignState) => {
    switch (state) {
      case CampaignState.Funding:
        return "bg-yellow-500/20 text-yellow-300 border-yellow-500/40"
      case CampaignState.Development:
        return "bg-green-500/20 text-green-300 border-green-500/40"
      case CampaignState.Completed:
        return "bg-blue-500/20 text-blue-300 border-blue-500/40"
      case CampaignState.Failed:
        return "bg-red-500/20 text-red-300 border-red-500/40"
      default:
        return "bg-gray-500/20 text-gray-300 border-gray-500/40"
    }
  }

  // Format date
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    }).format(date)
  }

  // Truncate address
  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  return (
    <Card className="group hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/20">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-bold line-clamp-2 group-hover:text-primary transition-colors">
              {campaign.title}
            </CardTitle>
            <CardDescription className="line-clamp-2 mt-2">
              {campaign.description}
            </CardDescription>
          </div>
          <Badge 
            variant="outline" 
            className={getStateStyle(campaign.state)}
          >
            {campaign.stateLabel}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Funding Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Funding Progress</span>
            <span className="font-bold text-primary">{campaign.progress.toFixed(1)}%</span>
          </div>
          <Progress value={campaign.progress} className="h-2" />
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              {campaign.totalRaised} ETH
            </span>
            <span className="text-muted-foreground flex items-center gap-1">
              <Target className="w-3 h-3" />
              {campaign.fundingGoal} ETH
            </span>
          </div>
        </div>

        {/* Milestone Progress */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold">
              M{campaign.currentMilestone}
            </div>
            <div>
              <p className="text-xs font-medium">Current Milestone</p>
              <p className="text-xs text-muted-foreground">
                {campaign.currentMilestone}/{campaign.totalMilestones} Completed
              </p>
            </div>
          </div>
        </div>

        {/* Campaign Stats */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="flex items-center gap-2 text-xs">
            <Users className="w-4 h-4 text-primary" />
            <div>
              <p className="text-muted-foreground">Contributors</p>
              <p className="font-semibold">{campaign.contributorsCount}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <Calendar className="w-4 h-4 text-primary" />
            <div>
              <p className="text-muted-foreground">Created</p>
              <p className="font-semibold">{formatDate(campaign.createdAt)}</p>
            </div>
          </div>
        </div>

        {/* Founder Address */}
        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <span className="text-xs text-muted-foreground">Founder</span>
          <code className="text-xs font-mono bg-muted px-2 py-1 rounded">
            {truncateAddress(campaign.founder)}
          </code>
        </div>
      </CardContent>

      <CardFooter className="flex gap-2">
        <Button 
          asChild 
          className="flex-1 bg-primary hover:bg-primary/90"
          disabled={!isCampaignActive(campaign.state)}
        >
          <Link href={`/campaign/${campaign.address}`}>
            {isCampaignActive(campaign.state) ? "View & Fund" : "View Details"}
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}





