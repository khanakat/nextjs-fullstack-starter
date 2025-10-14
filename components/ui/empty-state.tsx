import { cn } from "@/lib/utils";

interface EmptyStateProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ 
  title, 
  subtitle, 
  icon, 
  action,
  className 
}: EmptyStateProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center py-12 px-4 text-center space-y-4",
      className
    )}>
      {icon && (
        <div className="text-muted-foreground/60">
          {icon}
        </div>
      )}
      
      <div className="space-y-2">
        <h3 className="text-lg font-medium text-foreground">
          {title}
        </h3>
        {subtitle && (
          <p className="text-sm text-muted-foreground max-w-md">
            {subtitle}
          </p>
        )}
      </div>
      
      {action && (
        <div className="pt-2">
          {action}
        </div>
      )}
    </div>
  );
}