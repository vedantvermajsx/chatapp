import Loader from './Loader';

const SIZES = { sm: 'w-4 h-4', md: 'w-7 h-7', lg: 'w-10 h-10' };

export default function Spinner({ size = 'md', variant = 'ring' }) {
  return (
    <div className="flex items-center justify-center opacity-70">
      <Loader variant={variant} className={SIZES[size] || SIZES.md} />
    </div>
  );
}
