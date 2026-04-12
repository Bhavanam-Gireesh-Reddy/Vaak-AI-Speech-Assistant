type EmbeddedWorkspaceProps = {
  description: string;
  eyebrow: string;
  src: string;
  title: string;
};

export function EmbeddedWorkspace({
  description,
  eyebrow,
  src,
  title,
}: EmbeddedWorkspaceProps) {
  return (
    <div className="grid gap-3 sm:gap-4 md:gap-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 md:p-8 shadow-sm">
        <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] text-sky-600">
          {eyebrow}
        </p>
        <h3 className="mt-2 text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
          {title}
        </h3>
        <p className="mt-3 max-w-4xl text-sm leading-relaxed text-slate-500">
          {description}
        </p>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <iframe
          className="w-full border-0 aspect-video md:h-[calc(100vh-20rem)] md:min-h-[800px]"
          src={src}
          title={title}
        />
      </section>
    </div>
  );
}
