import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCcw } from "lucide-react";

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  fullHeight?: boolean;
}

export function ErrorState({ 
  title = "Something went wrong",
  message,
  onRetry,
  fullHeight = true
}: ErrorStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center text-center px-4 ${fullHeight ? "min-h-[400px]" : "py-12"}`} suppressHydrationWarning>
      <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mb-4" suppressHydrationWarning>
        <AlertTriangle className="w-8 h-8 text-red-500" />
      </div>
      <h3 className="text-2xl font-bold mb-2">{title}</h3>
      <p className="text-muted-foreground mb-6 max-w-md">{message}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline">
          <RefreshCcw className="w-4 h-4 mr-2" />
          Try Again
        </Button>
      )}
    </div>
  );
}

interface EmptyStateProps {
  title: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  icon?: string;
}

export function EmptyState({ title, message, action, icon = "📭" }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center px-4 py-16" suppressHydrationWarning>
      <div className="text-6xl mb-4" suppressHydrationWarning>{icon}</div>
      <h3 className="text-2xl font-bold mb-2">{title}</h3>
      <p className="text-muted-foreground mb-6 max-w-md">{message}</p>
      {action && (
        <Button onClick={action.onClick}>{action.label}</Button>
      )}
    </div>
  );
}

