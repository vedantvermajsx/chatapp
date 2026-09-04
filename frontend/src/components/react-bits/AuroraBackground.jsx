function SoftBackground({ className = '' }) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 ${className}`}
      style={{
        background:
          'radial-gradient(ellipse 80% 55% at 50% -10%, rgba(0,128,128,0.06) 0%, transparent 60%)',
      }}
    />
  );
}

export default SoftBackground;
