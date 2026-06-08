import React from 'react';
import { useAuthStore } from '@/store/useAuthStore';

/**
 * StorePage - Desvio Premium Store (Elite)
 * Based on Cyber-Premium Glassmorphic design.
 * Now wrapped by MainLayout for Header/Nav.
 */
export const Store = () => {
  const { user } = useAuthStore();

  return (
    <div className="px-4 max-w-full mx-auto">
      {/* Hero Section */}
      <section className="mb-12 relative overflow-hidden rounded h-64 flex flex-col justify-end p-8">
        <div className="absolute inset-0 z-0">
          <img 
            alt="Premium background" 
            className="w-full h-full object-cover" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuACVmqdiOEoJ6PcOOoRJ-97iVMwBFl1BVxwgmfJ-aMvTdVa1pnvksB62Brat4mzVNaMHIYmL-WQMu6pWDRFSbcodERHgQFToCMU5PPL_1Yhat5iwv4CsitI_t7agiYZkWpKv7WmAnjobVyehy5hHsBJWEV02_e96_kq_OfPQUt90VEPwbMQp_ccgS9uCH8d0NtUUD22IqDJini8Z9ra25p3EzAcEqH5nQuSmBdzIBcWHvjJ3g3aU6Y1ycsf_ZsHM8cPKdl7dDlUzzDr" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent"></div>
        </div>
        <div className="relative z-10">
          <h1 className="text-4xl font-headline font-extrabold tracking-tight mb-2">Desvio Elite</h1>
          <p className="text-on-surface-variant text-lg max-w-md leading-relaxed">Experience the path less traveled. Unlock exclusive tools to find your perfect deviation.</p>
        </div>
      </section>

      {/* Subscription Tiers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        {/* Yearly Plan */}
        <div className="relative group">
          <div className="absolute -inset-0.5 deviation-gradient rounded opacity-30 group-hover:opacity-100 transition duration-500 blur-sm"></div>
          <div className="relative bg-surface-container-high rounded p-8 flex flex-col h-full border border-outline-variant/20">
            <div className="flex justify-between items-start mb-6">
              <div>
                <span className="text-secondary font-headline font-bold text-xs uppercase tracking-widest px-3 py-1 bg-secondary-container/20 rounded">Best Value</span>
                <h2 className="text-2xl font-headline font-bold mt-4">Yearly Elite</h2>
              </div>
              <div className="text-right">
                <div className="text-3xl font-headline font-bold">$9.99</div>
                <div className="text-on-surface-variant text-sm">/month</div>
              </div>
            </div>
            <p className="text-on-surface-variant mb-8 leading-relaxed">Billed annually as $119.88. Save 50% compared to monthly subscriptions.</p>
            <ul className="space-y-4 mb-10 flex-grow">
              <li className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                <span className="text-sm">See Who Liked You</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                <span className="text-sm">Unlimited Likes & Rewinds</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                <span className="text-sm">Invisible Mode Browsing</span>
              </li>
            </ul>
            <button className="w-full py-4 rounded deviation-gradient text-on-primary font-semibold text-lg active:scale-[0.98] transition-transform">Choose Yearly</button>
          </div>
        </div>

        {/* Monthly Plan */}
        <div className="bg-surface-container-low rounded p-8 flex flex-col h-full border border-outline-variant/10">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-headline font-bold">Monthly Elite</h2>
            </div>
            <div className="text-right">
              <div className="text-3xl font-headline font-bold">$19.99</div>
              <div className="text-on-surface-variant text-sm">/month</div>
            </div>
          </div>
          <p className="text-on-surface-variant mb-8 leading-relaxed">Flexible membership. Cancel anytime without commitments.</p>
          <ul className="space-y-4 mb-10 flex-grow">
            <li className="flex items-center gap-3">
              <span className="material-symbols-outlined text-outline-variant">check_circle</span>
              <span className="text-sm">See Who Liked You</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="material-symbols-outlined text-outline-variant">check_circle</span>
              <span className="text-sm">Unlimited Likes & Rewinds</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="material-symbols-outlined text-outline-variant">check_circle</span>
              <span className="text-sm">Invisible Mode Browsing</span>
            </li>
          </ul>
          <button className="w-full py-4 rounded border border-outline-variant hover:bg-surface-variant text-on-surface font-semibold text-lg active:scale-[0.98] transition-all">Go Monthly</button>
        </div>
      </div>

      {/* Benefits Highlights */}
      <h3 className="text-xl font-headline font-bold mb-6 px-2">Core Benefits</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
        <div className="md:col-span-2 bg-surface-container-high rounded p-6 flex items-center gap-6 overflow-hidden relative">
          <div className="relative z-10 w-2/3">
            <div className="w-12 h-12 rounded bg-primary/10 flex items-center justify-center text-primary mb-4">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>visibility</span>
            </div>
            <h4 className="text-lg font-headline font-bold mb-2">See Who Liked You</h4>
            <p className="text-on-surface-variant text-sm">Stop guessing and start matching. Instantly view your full list of admirers.</p>
          </div>
          <div className="absolute right-0 top-0 h-full w-1/3 opacity-40">
            <img 
              alt="Benefit visual" 
              className="w-full h-full object-cover" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuD-BgMgBU2tS17CyGWyD0hkPfEzR5Yko_Dutjs9RwGDgJnmg87hQl69UTH36mGepeZTU220UN2OjPmqzC6x6pxx8Gxhl_f6QyP3Ip-jxvs0l2rOmY0Wc5QtMz8SXbWK40U0AQkOjBSvzxVMas7MrGLRkW8NE2lK6DQRiUrOGcF4QRAWXdBtE4lbNWD0NOLXgVrAPhom-ziRNhK4qGPq5UHs9sbm4mkLqiFI2shzyc9A4FmmWvFccD2jgkilidKdTaUDBSB0MyP05-UJ" 
            />
          </div>
        </div>
        <div className="bg-surface-container-high rounded p-6 flex flex-col justify-between">
          <div className="w-12 h-12 rounded bg-tertiary-container/10 flex items-center justify-center text-tertiary-dim mb-4">
            <span className="material-symbols-outlined">all_inclusive</span>
          </div>
          <div>
            <h4 className="text-lg font-headline font-bold mb-2">Unlimited Likes</h4>
            <p className="text-on-surface-variant text-sm">No limits on your connections. Browse and like as much as you want.</p>
          </div>
        </div>
        <div className="bg-surface-container-high rounded p-6 flex flex-col justify-between">
          <div className="w-12 h-12 rounded bg-secondary-container/10 flex items-center justify-center text-secondary mb-4">
            <span className="material-symbols-outlined">visibility_off</span>
          </div>
          <div>
            <h4 className="text-lg font-headline font-bold mb-2">Invisible Mode</h4>
            <p className="text-on-surface-variant text-sm">Total control over your presence. Visit profiles without being seen.</p>
          </div>
        </div>
        <div className="md:col-span-2 bg-surface-container-high rounded p-6 flex items-center gap-6">
          <div className="flex -space-x-4">
            <img alt="Face 1" className="w-12 h-12 rounded border-2 border-surface-container-high object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBh9qrusLKszabDOVa4dmIqWUbEzPr2APCACvq6LAbidc6pWN4-mbIntOeymKVHXXbdJ829IrY0N2s7A2d1HJQIM6NEoFb4TqFnvzp_hyCPps6YDzESE8AicHi8wXgs3Wu2_Luzicy4Z2lqdq37sTNGbWtAU2APDG6kYyb6IjZfwVYfNoxcdGoIOhTDKZxmev49uxG2euHKiW7hLYksj9n0UKITiDQyzV_1XmNUCuZfc0kSnO8-NSCJQwSirSWXQWG8fttobkY1t_p8" />
            <img alt="Face 2" className="w-12 h-12 rounded border-2 border-surface-container-high object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuA7Bl8DIfRLTNKux_oZGqlZt1_zq4XbkXBHwEiEAvhnkC_sa7LVB7dWqCznm0DRGnFetNKjjUD4bKk2uoBQ5Rhf483OwAuLltUSFaDcwj4cckdwX7yjsrnYyb2-ZxrTSe-v5_plsDG5tA5UiOvN-LDrC98Fl8NEtQeQdnH4woGpNlpodf6UaW0C--e30y6lssRAZiJrEMrAKiy8MbTsVYVgxBg24YwWh8nV6IvZcjwiBuhXTWRiOFuWqIbJnmBmGYYIkxs0mO6YyKzL" />
            <div className="w-12 h-12 rounded border-2 border-surface-container-high bg-primary flex items-center justify-center text-black font-bold text-sm">+24</div>
          </div>
          <div className="flex-grow">
            <h4 className="text-lg font-headline font-bold mb-1">Global Passport</h4>
            <p className="text-on-surface-variant text-sm">Match with people anywhere in the world.</p>
          </div>
        </div>
      </div>

      {/* Boost Packs Section */}
      <h3 className="text-xl font-headline font-bold mb-6 px-2">Priority Boosts</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
        <div className="bg-surface-container rounded p-5 border border-outline-variant/10 hover:border-primary/40 transition-colors cursor-pointer group">
          <div className="text-on-surface-variant text-xs font-bold uppercase tracking-widest mb-3">1 Boost</div>
          <div className="text-2xl font-headline font-bold mb-1 group-hover:text-primary transition-colors">$4.99</div>
          <div className="text-on-surface-variant text-xs mb-4">One-time use</div>
          <button className="w-full py-2 bg-surface-variant rounded-lg text-xs font-bold">Buy</button>
        </div>
        <div className="bg-surface-container-highest rounded p-5 border-2 border-primary/40 relative overflow-hidden cursor-pointer">
          <div className="absolute top-0 right-0 bg-primary text-black px-2 py-0.5 text-[8px] font-bold uppercase tracking-tighter">Popular</div>
          <div className="text-on-surface-variant text-xs font-bold uppercase tracking-widest mb-3">5 Boosts</div>
          <div className="text-2xl font-headline font-bold mb-1 text-primary">$19.99</div>
          <div className="text-on-surface-variant text-xs mb-4">$3.99 each</div>
          <button className="w-full py-2 deviation-gradient text-on-primary rounded-lg text-xs font-bold">Buy Now</button>
        </div>
        <div className="bg-surface-container rounded p-5 border border-outline-variant/10 hover:border-primary/40 transition-colors cursor-pointer group">
          <div className="text-on-surface-variant text-xs font-bold uppercase tracking-widest mb-3">10 Boosts</div>
          <div className="text-2xl font-headline font-bold mb-1 group-hover:text-primary transition-colors">$34.99</div>
          <div className="text-on-surface-variant text-xs mb-4">$3.49 each</div>
          <button className="w-full py-2 bg-surface-variant rounded-lg text-xs font-bold">Buy</button>
        </div>
        <div className="bg-surface-container rounded p-5 border border-outline-variant/10 hover:border-primary/40 transition-colors cursor-pointer group">
          <div className="text-on-surface-variant text-xs font-bold uppercase tracking-widest mb-3">25 Boosts</div>
          <div className="text-2xl font-headline font-bold mb-1 group-hover:text-primary transition-colors">$69.99</div>
          <div className="text-on-surface-variant text-xs mb-4">$2.79 each</div>
          <button className="w-full py-2 bg-surface-variant rounded-lg text-xs font-bold">Buy</button>
        </div>
      </div>
    </div>
  );
};
