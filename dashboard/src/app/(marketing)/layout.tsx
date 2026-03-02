// This layout is a no-op pass-through.
// The ConditionalLayout in root layout.tsx handles marketing nav/footer
// based on pathname. The (marketing) group is only used for file organization.
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
