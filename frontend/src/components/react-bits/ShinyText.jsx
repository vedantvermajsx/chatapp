function ShinyText({ children, className = '' }) {
  return (
    <span
      className={`bg-clip-text text-transparent ${className}`}
      style={{
        backgroundImage: 'linear-gradient(90deg, #0f172a 0%, #008080 100%)',
      }}
    >
      {children}
    </span>
  );
}

export default ShinyText;
