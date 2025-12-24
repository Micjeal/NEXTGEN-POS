"use client"

import { cn } from "@/lib/utils"
import { Bell } from "lucide-react"
import { ButtonHTMLAttributes, forwardRef } from "react"

interface NotificationButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  count?: number
  showBadge?: boolean
  className?: string
}

export const NotificationButton = forwardRef<HTMLButtonElement, NotificationButtonProps>(
  ({ className, count = 0, showBadge = true, ...props }, ref) => {
    const hasNotifications = showBadge && count > 0

    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all",
          "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
          "disabled:pointer-events-none disabled:opacity-50",
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
          "size-9 relative",
          "outline-none",
          "aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
          "shrink-0 [&>svg]:shrink-0 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4",
          className
        )}
        aria-label={props["aria-label"] || "Notifications"}
        {...props}
      >
        <Bell className="h-5 w-5" />
        {hasNotifications && (
          <span 
            className={cn(
              "absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] text-destructive-foreground",
              count > 9 && "px-1"
            )}
          >
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>
    )
  }
)

NotificationButton.displayName = "NotificationButton"

export { NotificationButton as default }
