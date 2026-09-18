function ShinyText({ children, className = '' }) {
  return (
    <span
      className={`bg-clip-text text-transparent ${className}`}
      style={{
        backgroundImage: 'linear-gradient(90deg, #0d1a14 0%, #16a34a 100%)',
      }}
    >
      {children}
    </span>
  );
}

export default ShinyText;
