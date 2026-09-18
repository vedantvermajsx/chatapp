function SoftBackground({ className = '' }) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 ${className}`}
      style={{
        background:
          'radial-gradient(ellipse 80% 55% at 50% -10%, rgba(22,163,74,0.08) 0%, transparent 60%)',
      }}
    />
  );
}

export default SoftBackground;
