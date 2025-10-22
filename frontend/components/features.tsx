import { Card } from "@/components/ui/card"
import { Lock, Zap, Users, TrendingUp } from "lucide-react"

export function Features() {
  const features = [
    {
      icon: Lock,
      title: "Secure & Transparent",
      description: "Smart contracts ensure every transaction is secure, transparent, and immutable on the blockchain.",
    },
    {
      icon: Zap,
      title: "Instant Payouts",
      description: "Funds are transferred instantly to project creators upon successful funding milestones.",
    },
    {
      icon: Users,
      title: "Community Driven",
      description: "Governance tokens give backers a voice in platform decisions and project selection.",
    },
    {
      icon: TrendingUp,
      title: "Growth Potential",
      description: "Earn rewards and participate in the success of funded projects through token incentives.",
    },
  ]

  return (
    <section id="features" className="py-20 sm:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold">Why Choose HackFund?</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Built for the future of innovation with cutting-edge web3 technology
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <Card key={feature.title} className="p-8 border border-border hover:border-primary/50 transition-colors">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-6">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}
