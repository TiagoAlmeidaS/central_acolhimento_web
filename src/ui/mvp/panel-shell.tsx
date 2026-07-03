"use client";

export function PanelShell({
  title,
  description,
  children,
}: Readonly<{
  title: string;
  description: string;
  children: React.ReactNode;
}>) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-panel">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-slate-900">{title}</h2>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
      {children}
    </section>
  );
}
