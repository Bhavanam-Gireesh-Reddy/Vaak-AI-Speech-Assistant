const CARD: React.CSSProperties = {
  background: "rgba(255,255,255,0.03)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: "1px solid rgba(255,255,255,0.07)",
  boxShadow: "0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)",
};

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
      <section className="rounded-2xl p-5 sm:p-6 md:p-8" style={CARD}>
        <p
          className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em]"
          style={{ color: "#00d4ff" }}
        >
          {eyebrow}
        </p>
        <h3
          className="mt-2 text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-white"
        >
          {title}
        </h3>
        <p
          className="mt-3 max-w-4xl text-sm leading-relaxed"
          style={{ color: "rgba(255,255,255,0.45)" }}
        >
          {description}
        </p>
      </section>

      <section
        className="overflow-hidden rounded-2xl"
        style={{
          ...CARD,
          border: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        <iframe
          className="w-full border-0 aspect-video md:h-[calc(100vh-20rem)] md:min-h-[800px]"
          src={src}
          title={title}
        />
      </section>
    </div>
  );
}
