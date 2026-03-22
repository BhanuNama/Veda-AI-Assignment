'use client';

import Image from 'next/image';

/** Demo profile photo (replace with user avatar from auth when available). */
const AVATAR_URL =
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=128&h=128&fit=crop&crop=faces&q=80';

interface UserAvatarProps {
  size?: number;
  className?: string;
  alt?: string;
}

export function UserAvatar({ size = 36, className = '', alt = 'John Doe' }: UserAvatarProps) {
  return (
    <Image
      src={AVATAR_URL}
      alt={alt}
      width={size}
      height={size}
      className={`rounded-full object-cover flex-shrink-0 ring-[1.5px] ring-orange/30 ${className}`}
      sizes={`${size}px`}
      priority={false}
    />
  );
}
