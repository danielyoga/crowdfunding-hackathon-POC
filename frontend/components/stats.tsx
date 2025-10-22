export function Stats() {
  const stats = [
    { label: "Success Rate", value: "94%" },
    { label: "Avg Funding Time", value: "14 days" },
    { label: "Total Raised", value: "$2.5M" },
    { label: "Active Builders", value: "5K+" },
  ]

  return (
    <section className="py-16 sm:py-20 border-y border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-primary mb-2">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
