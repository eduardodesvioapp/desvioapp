import { useState, useRef, useEffect } from 'react';

export function CustomSelect({ value, onChange, options, placeholder }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative w-full" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-14 rounded border border-white/10 bg-white/[0.02] px-8 flex items-center justify-between text-sm text-white hover:border-primary/50 transition-all outline-none"
      >
        <span className={!value ? 'text-white/20' : ''}>
          {value || placeholder}
        </span>
        <span className={`material-symbols-outlined text-primary transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
          expand_more
        </span>
      </button>

      {isOpen && (
        <div className="absolute top-[calc(100%+8px)] left-0 right-0 z-[200] bg-black border border-white/10 rounded p-2 shadow-2xl backdrop-blur-3xl overflow-hidden animate-in fade-in zoom-in duration-200">
          <div className="max-h-[240px] overflow-y-auto scrollbar-hide">
            {options.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => {
                  onChange(option);
                  setIsOpen(false);
                }}
                className={`w-full h-12 rounded-xl px-6 flex items-center text-xs font-black uppercase tracking-widest transition-all mb-1 last:mb-0 ${
                  value === option 
                    ? 'bg-primary text-black' 
                    : 'text-white/40 hover:bg-white/5 hover:text-white'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
