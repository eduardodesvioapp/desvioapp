import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { toast } from 'sonner';

const REASONS = [
  {
    value: 'fake_profile',
    label: 'Perfil falso',
    desc: 'Identidade fictícia, foto de outra pessoa ou bot.',
    icon: 'person_off',
  },
  {
    value: 'harassment',
    label: 'Assédio ou ameaças',
    desc: 'Mensagens abusivas, ameaças ou intimidação.',
    icon: 'do_not_disturb_on',
  },
  {
    value: 'underage',
    label: 'Menor de idade',
    desc: 'Suspeita de usuário com menos de 18 anos.',
    icon: '18_up_rating',
  },
  {
    value: 'spam',
    label: 'Spam ou publicidade',
    desc: 'Links suspeitos, venda de serviços ou mensagens repetitivas.',
    icon: 'report_spam',
  },
  {
    value: 'non_consensual_content',
    label: 'Conteúdo não consensual',
    desc: 'Imagens íntimas compartilhadas sem permissão.',
    icon: 'no_photography',
  },
  {
    value: 'scam',
    label: 'Golpe ou extorsão',
    desc: 'Chantagem, pedidos de dinheiro ou fraude.',
    icon: 'gpp_bad',
  },
  {
    value: 'hate_speech',
    label: 'Discurso de ódio',
    desc: 'Conteúdo discriminatório, racista ou homofóbico.',
    icon: 'sentiment_very_dissatisfied',
  },
  {
    value: 'other',
    label: 'Outro motivo',
    desc: 'Descreva o problema nos detalhes abaixo.',
    icon: 'flag',
  },
];

export function ReportModal({ targetUserId, targetName, onClose }) {
  const { user } = useAuthStore();
  const [step, setStep] = useState('reason'); // 'reason' | 'details' | 'success'
  const [selectedReason, setSelectedReason] = useState(null);
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedReason || !user?.id) return;

    setSubmitting(true);
    try {
      const { error } = await supabase.from('reports').insert({
        reporter_id: user.id,
        reported_id: targetUserId,
        reason: selectedReason,
        details: details.trim() || null,
      });

      if (error) {
        // Denúncia duplicada (unique constraint)
        if (error.code === '23505') {
          toast.error('DENÚNCIA JÁ REGISTRADA', {
            description: 'Você já denunciou este perfil com este motivo.',
          });
          onClose();
          return;
        }
        throw error;
      }

      setStep('success');
    } catch (err) {
      console.error('[ReportModal] Error submitting report:', err);
      toast.error('ERRO AO ENVIAR DENÚNCIA');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    // Overlay
    <div
      className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />

      {/* Sheet */}
      <div
        className="relative w-full sm:max-w-lg bg-[#0e0e0e] border border-white/10 sm:rounded overflow-hidden shadow-2xl animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/5 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded border border-primary/30 bg-primary/10">
              <span className="material-symbols-outlined text-primary" style={{ fontSize: '16px' }}>flag</span>
            </div>
            <div>
              <div className="text-[10px] font-label font-bold uppercase tracking-[0.2em] text-primary">
                Denunciar Perfil
              </div>
              <div className="text-[10px] text-on-surface-variant">{targetName}</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded border border-white/10 text-on-surface-variant transition-colors hover:border-white/20 hover:text-white"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>close</span>
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[70vh] overflow-y-auto subtle-scrollbar">
          {step === 'reason' && (
            <div className="p-5">
              <p className="mb-4 text-xs font-label text-on-surface-variant">
                Selecione o motivo que melhor descreve o problema:
              </p>
              <div className="space-y-2">
                {REASONS.map(({ value, label, desc, icon }) => (
                  <button
                    key={value}
                    onClick={() => setSelectedReason(value)}
                    className={`flex w-full items-start gap-3 rounded border px-4 py-3 text-left transition-all ${
                      selectedReason === value
                        ? 'border-primary bg-primary/10'
                        : 'border-white/8 bg-white/[0.02] hover:border-white/15'
                    }`}
                  >
                    <span
                      className={`material-symbols-outlined mt-0.5 shrink-0 ${selectedReason === value ? 'text-primary' : 'text-on-surface-variant'}`}
                      style={{ fontSize: '18px' }}
                    >
                      {icon}
                    </span>
                    <div>
                      <div className={`text-xs font-semibold ${selectedReason === value ? 'text-white' : 'text-white/70'}`}>
                        {label}
                      </div>
                      <div className="text-[11px] leading-relaxed text-on-surface-variant">{desc}</div>
                    </div>
                    {selectedReason === value && (
                      <span className="material-symbols-outlined ml-auto shrink-0 text-primary" style={{ fontSize: '16px' }}>
                        check_circle
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 'details' && (
            <div className="p-5">
              <div className="mb-4 flex items-center gap-3 rounded border border-white/8 bg-white/[0.02] px-3 py-2">
                <span className="material-symbols-outlined text-primary" style={{ fontSize: '16px' }}>
                  {REASONS.find((r) => r.value === selectedReason)?.icon}
                </span>
                <span className="text-xs font-semibold text-white">
                  {REASONS.find((r) => r.value === selectedReason)?.label}
                </span>
              </div>

              <label className="mb-2 block text-[10px] font-label font-semibold uppercase tracking-widest text-on-surface-variant">
                Detalhes adicionais{' '}
                <span className="normal-case font-normal text-on-surface-variant/60">(opcional)</span>
              </label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                rows={5}
                maxLength={500}
                placeholder="Descreva o ocorrido com o máximo de detalhes. Isso ajuda nossa equipe a agir mais rapidamente."
                className="w-full resize-none rounded border border-white/10 bg-white/[0.03] px-4 py-3 font-body text-sm text-white placeholder-on-surface-variant/40 focus:border-primary focus:outline-none"
              />
              <div className="mt-1 text-right text-[10px] text-on-surface-variant">{details.length}/500</div>

              <div className="mt-4 rounded border border-white/5 bg-white/[0.02] px-4 py-3">
                <p className="text-[11px] leading-relaxed text-on-surface-variant">
                  <span className="material-symbols-outlined mr-1.5 align-middle text-primary" style={{ fontSize: '13px' }}>
                    info
                  </span>
                  Sua denúncia é anônima. O usuário denunciado não saberá que você o denunciou.
                  Nossa equipe analisa todas as denúncias em até 24 horas.
                </p>
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="flex flex-col items-center gap-4 px-8 py-12 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full border border-primary/30 bg-primary/10">
                <span className="material-symbols-outlined text-primary" style={{ fontSize: '28px' }}>check_circle</span>
              </div>
              <h3 className="font-headline text-lg font-bold text-white">Denúncia enviada</h3>
              <p className="max-w-xs text-sm leading-relaxed text-on-surface-variant">
                Nossa equipe irá analisar sua denúncia em até 24 horas. Obrigado por
                ajudar a manter a comunidade segura.
              </p>
              <button
                onClick={onClose}
                className="mt-2 rounded border border-white/10 bg-white/[0.03] px-6 py-2.5 text-xs font-semibold text-white transition-all hover:border-white/20"
              >
                Fechar
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        {step !== 'success' && (
          <div className="flex items-center justify-between border-t border-white/5 px-5 py-4">
            {step === 'details' ? (
              <button
                onClick={() => setStep('reason')}
                className="flex items-center gap-1.5 text-xs text-on-surface-variant transition-colors hover:text-white"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>arrow_back</span>
                Voltar
              </button>
            ) : (
              <button
                onClick={onClose}
                className="text-xs text-on-surface-variant transition-colors hover:text-white"
              >
                Cancelar
              </button>
            )}

            {step === 'reason' ? (
              <button
                onClick={() => setStep('details')}
                disabled={!selectedReason}
                className="flex items-center gap-2 rounded border border-primary bg-primary px-5 py-2 text-xs font-semibold text-white transition-all hover:bg-primary/80 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Continuar
                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>arrow_forward</span>
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex items-center gap-2 rounded border border-primary bg-primary px-5 py-2 text-xs font-semibold text-white transition-all hover:bg-primary/80 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {submitting ? (
                  <>
                    <span className="material-symbols-outlined animate-spin" style={{ fontSize: '14px' }}>progress_activity</span>
                    Enviando...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>send</span>
                    Enviar denúncia
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
