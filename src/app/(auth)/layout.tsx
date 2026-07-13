export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-brand">Novus Pulse</h1>
          <p className="mt-2 text-sm text-neutral-400">Manage your digital presence</p>
        </div>
        {children}
      </div>
    </div>
  );
}
