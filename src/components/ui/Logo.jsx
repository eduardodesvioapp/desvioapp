import logoDark from '../../assets/logo-dark.png';
import logoLight from '../../assets/logo-light.png';

/**
 * Logo - O componente central de branding do Radar.
 * Alterna entre logo dark e light via CSS.
 */
export const Logo = ({ className = '', size = 'md', onClick }) => {
  const heights = {
    sm: 'h-6 sm:h-8',
    md: 'h-10 md:h-12',
    lg: 'h-16 md:h-24',
    xl: 'h-24 md:h-32'
  };

  return (
    <div className={`inline-flex flex-col items-start select-none ${className}`} onClick={onClick}>
      <img 
        src={logoDark} 
        alt="Desvio" 
        className={`${heights[size]} w-auto object-contain transition-all logo-dark-img`} 
      />
      <img 
        src={logoLight} 
        alt="Desvio" 
        className={`${heights[size]} w-auto object-contain transition-all logo-light-img`} 
      />
    </div>
  );
};


