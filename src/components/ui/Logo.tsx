interface LogoProps {
  iconOnly?: boolean
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  showSubtext?: boolean
  lightText?: boolean
}

export function Logo({
  iconOnly = false,
  size = 'md',
  className = '',
  showSubtext = false,
  lightText = true,
}: LogoProps) {
  const iconSizes = {
    sm: 'h-7 w-7',
    md: 'h-8 w-8',
    lg: 'h-10 w-10',
    xl: 'h-13 w-13',
  }

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-lg',
    xl: 'text-2xl',
  }

  return (
    <div className={`flex items-center gap-2.5 shrink-0 ${className}`}>
      <img
        src="/logo.svg"
        alt="WorkPilot AI"
        className={`${iconSizes[size]} object-contain drop-shadow-sm shrink-0 rounded-lg`}
      />
      {!iconOnly && (
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5 leading-none">
            <span
              className={`font-bold tracking-tight ${
                textSizes[size]
              } ${lightText ? 'text-white' : 'text-slate-900 dark:text-white'}`}
            >
              Work<span className="text-purple-500">Pilot</span>
            </span>
            <span className="text-[9px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-400 border border-purple-500/30 px-1 py-0.5 rounded-md shrink-0">
              AI
            </span>
          </div>
          {showSubtext && (
            <span className="text-[10px] text-slate-400 font-medium tracking-tight mt-1 truncate">
              Your Day. Simplified. Smarter.
            </span>
          )}
        </div>
      )}
    </div>
  )
}
