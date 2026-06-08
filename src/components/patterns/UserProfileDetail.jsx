import React from 'react';
import { GlassCard } from '../ui/GlassCard';

/**
 * UserProfileDetail Component
 * Renders the detailed dossier of a user profile with brutalist aesthetics.
 * 
 * @param {Object} profile - The user profile data
 * @param {Array} interests - List of user interest names
 */
export function UserProfileDetail({ profile, interests = [] }) {
  const InfoRow = ({ label, value }) => (
    <div className="flex justify-between items-center border-b border-white/5 pb-3 last:border-0">
      <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">{label}</span>
      <span className="text-[11px] font-black text-white uppercase tracking-wider truncate max-w-[180px] text-right">
        {value || 'N/A'}
      </span>
    </div>
  );

  const SectionHeader = ({ title }) => (
    <div className="flex items-center gap-4 mb-6">
      <span className="text-[10px] font-black text-primary uppercase tracking-[0.4em]">{title}</span>
      <div className="flex-1 h-[1px] bg-primary/10"></div>
    </div>
  );

  return (
    <GlassCard padding="p-8 md:p-10" className="!bg-white/[0.02]">
      <div className="space-y-12">
        {/* Seção 1: Identidade */}
        <section>
          <SectionHeader title="Identidade Digital" />
          <div className="space-y-4">
            <InfoRow label="Gênero" value={profile?.gender} />
            <InfoRow label="Relacionamento" value={profile?.search_for?.join(', ')} />
            <InfoRow 
              label="Localização" 
              value={profile?.city + (profile?.kmAway !== null ? ` (${profile.kmAway}km)` : '')} 
            />
          </div>
        </section>

        {/* Seção 2: Interesses */}
        {interests.length > 0 && (
          <section>
            <SectionHeader title="Meus Interesses" />
            <div className="flex flex-wrap gap-2 pt-2">
              {interests.map((interest, i) => (
                <span 
                  key={i} 
                  className="px-3 py-1 bg-white/5 border border-white/10 text-[9px] font-black text-primary uppercase tracking-widest"
                >
                  {interest}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Seção 3: Atributos Físicos */}
        <section>
          <SectionHeader title="Traços Físicos" />
          <div className="space-y-4">
            <InfoRow label="Estatura" value={profile?.height ? `${profile.height}cm` : 'N/A'} />
            <InfoRow label="Peso" value={profile?.weight} />
            <InfoRow label="Olhos" value={profile?.eyes_color} />
            <InfoRow label="Cabelo" value={profile?.hair_color} />
            <InfoRow label="Pele" value={profile?.skin_color} />
          </div>
        </section>

        {/* Seção 4: Profissional */}
        <section>
          <SectionHeader title="Vida & Carreira" />
          <div className="space-y-4">
            <InfoRow label="Educação" value={profile?.education} />
          </div>
        </section>
      </div>
    </GlassCard>
  );
}
