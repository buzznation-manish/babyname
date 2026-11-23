'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import UiIcon from '@/components/ui-icon';
import { isUuid } from '@/lib/shortlist-api';
import AuthControls from '@/components/auth-controls';

const navigation = [
  { href: '/names', label: 'Browse names' },
  { href: '/baby-profile', label: 'Baby profiles' },
  { href: '/recommendations', label: 'Recommendations' },
  { href: '/shortlist', label: 'Shortlist' },
];

export function HeaderContent({ pathname = '/', profileId }: { pathname?: string; profileId?: string }) {
  return <header className="sticky top-0 z-40 border-b border-[#e5e8de] bg-[#fcfcf7]/95 backdrop-blur-md">
    <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-3 gap-y-3 sm:gap-x-6 px-5 py-4 sm:px-8 lg:gap-8 lg:px-10">
      <Link href="/" aria-label="Babyname home" className="flex shrink-0 items-center gap-2 sm:gap-2.5 text-[#304b3d]"><span className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-[#e8eddf]"><UiIcon name="leaf" className="h-5 w-5" /></span><span className="text-[21px] sm:text-[23px] font-semibold tracking-[-0.05em]">babyname<span className="text-[#b37d63]">.</span></span></Link>
      <nav aria-label="Main navigation" className="order-3 grid w-full grid-cols-2 gap-x-4 text-[13px] sm:flex sm:gap-6 lg:order-none lg:w-auto">
        {navigation.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const href = profileId && item.href !== '/names' ? `${item.href}?${new URLSearchParams({ profileId })}` : item.href;
          return <Link key={item.href} href={href} prefetch={item.href === '/names' ? undefined : false} aria-current={active ? 'page' : undefined} className={`shrink-0 border-b-2 py-1.5 transition-colors ${active ? 'border-[#304b3d] font-semibold text-[#304b3d]' : 'border-transparent text-stone-600 hover:border-[#a7b59a] hover:text-[#304b3d]'}`}>{item.label}</Link>;
        })}
      </nav>
      <AuthControls />
    </div>
  </header>;
}

export default function SiteHeader() {
  const pathname = usePathname();
  const params = useSearchParams();
  const profileId = params.get('profileId');
  return <HeaderContent pathname={pathname} profileId={isUuid(profileId) ? profileId : undefined} />;
}
