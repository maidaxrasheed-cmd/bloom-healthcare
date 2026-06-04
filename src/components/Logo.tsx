export function Logo({ size = 'md', dark = false }: { size?: 'sm' | 'md' | 'lg'; dark?: boolean }) {
  const dim = size === 'sm' ? 22 : size === 'lg' ? 36 : 28;
  return (
    <div className="flex items-center gap-2.5">
      <svg width={dim} height={dim} viewBox="0 0 32 32" fill="none">
        <path
          d="M16 4C12 6 9 9 8 13c-1 4 0 8 3 11l5 5 5-5c3-3 4-7 3-11-1-4-4-7-8-9z"
          fill={dark ? '#faf7f2' : '#384f37'}
        />
        <path
          d="M16 10v18M11 16h10M13 12h6M11 20h10"
          stroke={dark ? '#384f37' : '#faf7f2'}
          strokeWidth="1.2"
          strokeLinecap="round"
        />
      </svg>
      <span className={`font-display text-${size === 'sm' ? 'lg' : size === 'lg' ? '2xl' : 'xl'} font-medium ${dark ? 'text-cream' : 'text-ink'}`} style={{ letterSpacing: '-0.03em' }}>
        Bloom
      </span>
    </div>
  );
}
