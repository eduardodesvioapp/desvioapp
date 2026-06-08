import React from 'react';
import { GlassCard, Badge, MatchedButton, LikedButton } from '../ui';

/**
 * UserCard - The standard card for displaying user profiles in grids.
 * Composes GlassCard, Badge and MatchedButton primitives.
 */
export const UserCard = ({ 
  user: profile, 
  initialStatus,
  onClick 
}) => {
  return (
    <GlassCard 
      onClick={onClick}
      padding="p-0"
      className="relative aspect-[3/4] group rounded"
      hover
    >
      {/* Background Image */}
      <img 
        src={profile.profile_image_url || 'https://i.pravatar.cc/600'} 
        alt={profile.name} 
        className="w-full h-full object-cover grayscale-[40%] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700" 
      />
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#000000] via-[#000000]/10 to-transparent opacity-90"></div>
      
      {/* Interaction Buttons */}
      <div className="absolute top-4 left-4 z-10">
        <MatchedButton targetUserId={profile.id} size="md" isAi={profile.is_human === false} />
      </div>

      <div className="absolute top-4 right-4 z-10">
        <LikedButton targetUserId={profile.id} size="md" initialStatus={initialStatus} />
      </div>

      {/* User Info & Sinc Badge */}
      <div className="absolute bottom-0 left-0 right-0 px-4 pb-6 pt-4 md:pb-8 text-[#ffffff]">
        <h3 className="font-headline font-black text-2xl md:text-3xl tracking-tighter mb-1 italic flex items-center gap-2 text-[#ffffff]">
          {profile.name}, {profile.age}
          {profile.is_human === false && (
            <div className="flex items-center gap-1.5 bg-primary/20 text-primary text-[10px] px-2 py-0.5 rounded border border-primary/30 not-italic tracking-normal">
              <span className="material-symbols-outlined text-[14px]">smart_toy</span>
              <span>IA</span>
            </div>
          )}
        </h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[#ffffff]/50 text-[10px] font-black uppercase tracking-widest">
            <span className="material-symbols-outlined text-sm text-primary">location_on</span>
            <span>
              {(profile.km_away || 0).toFixed(1)}km
            </span>
          </div>
          
          <Badge variant="glass" className="scale-90 origin-right">
            <span className="text-primary italic font-black">{profile.compatibility}%</span>
          </Badge>
        </div>
      </div>
      
      {/* Online Status */}
      {profile.online && (
        <div className="absolute top-[4.5rem] right-5 w-2 h-2 bg-primary rounded shadow-[0_0_10px_rgba(186,158,255,1)]"></div>
      )}
    </GlassCard>
  );
};
