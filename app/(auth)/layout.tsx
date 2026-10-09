export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#FFFDF7] px-4 py-12">
      {/* Devotional background glow & pattern */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-gradient-to-b from-[#F8F1E3] to-transparent blur-3xl opacity-60" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle at 12px 12px, #3B2416 1px, transparent 0)`,
            backgroundSize: "24px 24px",
          }}
        />
      </div>
      <div className="relative z-10 w-full flex justify-center">{children}</div>
    </div>
  );
}
