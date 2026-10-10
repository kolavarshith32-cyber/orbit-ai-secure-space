export function PageHeader({ title, desc, children }: { title: string; desc?: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 border-b px-5 py-6 sm:flex-row sm:items-end sm:justify-between md:px-8">
      <div>
        <h1 className="text-2xl font-semibold">{title}</h1>
        {desc && <p className="mt-1 text-sm text-muted-foreground">{desc}</p>}
      </div>
      {children && <div className="flex gap-2">{children}</div>}
    </div>
  );
}
