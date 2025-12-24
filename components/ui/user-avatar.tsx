"use client"

import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"

interface UserAvatarProps {
  name: string
  className?: string
  size?: "sm" | "md" | "lg"
  showTooltip?: boolean
  onClick?: () => void
}

export function UserAvatar({ 
  name, 
  className,
  size = "md",
  showTooltip = false,
  onClick
}: UserAvatarProps) {
  // Get initials from name
  const router = useRouter()

  const handleClick = () => {
    if (onClick) {
      onClick()
    } else {
      router.push('/profile')
    }
  }

  const getInitials = (name: string) => {
    if (!name) return "??"
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2)
  }

  const sizeClasses = {
    sm: "h-6 w-6 text-xs",
    md: "h-8 w-8 text-sm",
    lg: "h-10 w-10 text-base"
  }

  const avatar = (
    <div className="flex items-center gap-3">
      <div 
        className={cn(
          "h-8 w-8 rounded-full bg-primary flex items-center justify-center",
          className
        )}
        onClick={handleClick}
      >
        <span className="text-sm font-medium text-primary-foreground">
          {getInitials(name)}
        </span>
      </div>
    </div>
  )

  if (showTooltip) {
    return (
      <div className="relative group">
        {avatar}
        <div className="absolute z-10 invisible group-hover:visible opacity-0 group-hover:opacity-100 bg-gray-900 text-white text-xs rounded px-2 py-1 bottom-full left-1/2 transform -translate-x-1/2 -translate-y-1 mb-2 whitespace-nowrap">
          {name}
          <div className="absolute w-2 h-2 bg-gray-900 rotate-45 -bottom-1 left-1/2 -translate-x-1/2"></div>
        </div>
      </div>
    )
  }

  return avatar
}
