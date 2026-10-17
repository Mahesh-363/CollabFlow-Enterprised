import React from 'react';
import { User, UserPresence } from '../types/collab';

interface UserAvatarProps {
  user?: User;
  name?: string;
  presence?: UserPresence;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showPresence?: boolean;
  className?: string;
}

const COLOR_MAP: Record<string, string> = {
  'EV': 'bg-indigo-600 text-indigo-50 border-indigo-400',
  'SC': 'bg-indigo-600 text-indigo-50 border-indigo-400',
  'AC': 'bg-blue-600 text-blue-50 border-blue-400',
  'ER': 'bg-fuchsia-600 text-fuchsia-50 border-fuchsia-400',
  'DK': 'bg-emerald-600 text-emerald-50 border-emerald-400',
  'MP': 'bg-amber-600 text-amber-50 border-amber-400',
  'JL': 'bg-purple-600 text-purple-50 border-purple-400',
  '🤖': 'bg-slate-700 text-slate-100 border-slate-500',
};

const PRESENCE_COLORS: Record<UserPresence, { bg: string; border: string; title: string }> = {
  online: { bg: 'bg-emerald-500', border: 'border-slate-900', title: 'Online' },
  away: { bg: 'bg-amber-400', border: 'border-slate-900', title: 'Away' },
  dnd: { bg: 'bg-rose-500', border: 'border-slate-900', title: 'Do Not Disturb' },
  offline: { bg: 'bg-slate-500', border: 'border-slate-900', title: 'Offline' },
};

export const UserAvatar: React.FC<UserAvatarProps> = ({
  user,
  name,
  presence,
  size = 'md',
  showPresence = true,
  className = '',
}) => {
  const displayName = user?.name || name || 'User';
  const displayPresence = user?.presence || presence || 'offline';
  
  // Get 2-letter initials
  const initials = user?.avatar || (
    displayName
      .split(' ')
      .map((part) => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase()
  );

  const colorClasses = COLOR_MAP[initials] || 'bg-slate-700 text-slate-200 border-slate-600';

  const sizeClasses = {
    xs: 'w-5 h-5 text-[10px]',
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-sm font-semibold',
    lg: 'w-11 h-11 text-base font-bold',
    xl: 'w-16 h-16 text-xl font-bold',
  }[size];

  const dotSizeClasses = {
    xs: 'w-1.5 h-1.5 ring-1',
    sm: 'w-2 h-2 ring-1',
    md: 'w-2.5 h-2.5 ring-2',
    lg: 'w-3 h-3 ring-2',
    xl: 'w-4 h-4 ring-2',
  }[size];

  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 rounded-lg select-none ${sizeClasses} ${colorClasses} ${className}`}>
      {user?.isBot ? (
        <span>🤖</span>
      ) : (
        <span>{initials}</span>
      )}

      {showPresence && !user?.isBot && (
        <span
          title={PRESENCE_COLORS[displayPresence].title}
          className={`absolute -bottom-0.5 -right-0.5 rounded-full ring-slate-900 ${dotSizeClasses} ${PRESENCE_COLORS[displayPresence].bg}`}
        />
      )}
    </div>
  );
};
