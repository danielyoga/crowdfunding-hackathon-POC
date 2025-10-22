import { Card } from "@/components/ui/card"

export function HowItWorks() {
  const steps = [
    {
      number: "01",
      title: "Create Project",
      description: "Submit your hackathon project with details, goals, and funding target.",
    },
    {
      number: "02",
      title: "Set Milestones",
      description: "Define clear milestones and deliverables for your project timeline.",
    },
    {
      number: "03",
      title: "Launch Campaign",
      description: "Go live and start receiving funding from the community.",
    },
    {
      number: "04",
      title: "Build & Deliver",
      description: "Execute your project and unlock funds as you hit milestones.",
    },
  ]

  return (
    <section id="how-it-works" className="py-20 sm:py-32 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold">How It Works</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Simple steps to launch your project and secure funding
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, index) => (
            <div key={step.number} className="relative">
              <Card className="p-8 border border-border h-full">
                <div className="text-4xl font-bold text-primary/30 mb-4">{step.number}</div>
                <h3 className="text-lg font-bold mb-3">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
              </Card>
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-3 w-6 h-0.5 bg-gradient-to-r from-primary to-transparent" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
