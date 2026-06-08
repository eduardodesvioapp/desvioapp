import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import { PageHeader } from '@/components/patterns';
import { GlassCard, Loading, PremiumButton } from '@/components/ui';
import { toast } from 'sonner';

export function ProfileVerification() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [step, setStep] = useState('intro'); // intro | camera | uploading | pending
  const [stream, setStream] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const startCamera = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      setStream(s);
      setStep('camera');
      if (videoRef.current) videoRef.current.srcObject = s;
    } catch (err) {
      console.error('Error accessing camera:', err);
      toast.error('Câmera não disponível. Verifique as permissões.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const captureAndUpload = async () => {
    if (!canvasRef.current || !videoRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);

    stopCamera();
    setStep('uploading');

    try {
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.8));
      const fileName = `${user.id}/${Date.now()}.jpg`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('verification')
        .upload(fileName, blob);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('verification').getPublicUrl(fileName);

      // Criar solicitação no banco
      const { error: dbError } = await supabase
        .from('verification_requests')
        .insert({
          user_id: user.id,
          selfie_url: publicUrl
        });

      if (dbError) throw dbError;

      // Atualizar status do usuário para pending
      await supabase.from('users').update({ verification_status: 'pending' }).eq('id', user.id);

      setStep('pending');
    } catch (err) {
      console.error('Error in verification flow:', err);
      toast.error('Falha ao processar verificação');
      setStep('intro');
    }
  };

  return (
    <div className="min-h-screen bg-background pt-24 pb-20 px-4 md:px-8">
      <PageHeader>
        <div className="flex flex-col items-center">
            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Autenticação</h2>
            <h1 className="text-xl font-headline font-bold italic">VERIFICAÇÃO_DE_IDENTIDADE</h1>
        </div>
      </PageHeader>

      <main className="max-w-lg mx-auto">
        {step === 'intro' && (
          <GlassCard className="p-8 text-center space-y-6">
            <div className="h-20 w-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                <span className="material-symbols-outlined text-primary text-4xl">verified_user</span>
            </div>
            <div>
                <h2 className="text-xl font-bold text-white mb-2">Por que verificar?</h2>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                    Perfis verificados recebem uma badge exclusiva, têm 3x mais matches e 
                    garantem à comunidade que você é uma pessoa real.
                </p>
            </div>
            <ul className="text-left space-y-3 py-4 border-y border-white/5">
                {['Tire uma selfie em tempo real', 'Nossa IA compara com seu dossiê', 'Sua foto de verificação nunca é pública'].map(item => (
                    <li key={item} className="flex items-center gap-3 text-[10px] uppercase font-bold text-white/60">
                        <span className="material-symbols-outlined text-primary text-sm">check</span>
                        {item}
                    </li>
                ))}
            </ul>
            <PremiumButton fullWidth onClick={startCamera}>Começar Agora</PremiumButton>
          </GlassCard>
        )}

        {step === 'camera' && (
          <div className="relative rounded-lg overflow-hidden bg-black aspect-[3/4]">
            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
            <canvas ref={canvasRef} className="hidden" />
            
            <div className="absolute inset-0 border-[40px] border-black/40 pointer-events-none">
                <div className="w-full h-full border-2 border-primary/30 rounded-[50%]"></div>
            </div>

            <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-4">
                <button 
                    onClick={() => { stopCamera(); setStep('intro'); }}
                    className="h-14 w-14 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white"
                >
                    <span className="material-symbols-outlined">close</span>
                </button>
                <button 
                    onClick={captureAndUpload}
                    className="h-14 w-14 rounded-full bg-primary flex items-center justify-center text-white shadow-2xl"
                >
                    <span className="material-symbols-outlined text-3xl">photo_camera</span>
                </button>
            </div>
          </div>
        )}

        {step === 'uploading' && (
          <GlassCard className="p-12 text-center space-y-6">
             <div className="h-12 w-12 mx-auto">
                <Loading />
             </div>
             <p className="text-xs font-bold text-white uppercase tracking-widest animate-pulse">Processando Dossiê Facial...</p>
          </GlassCard>
        )}

        {step === 'pending' && (
          <GlassCard className="p-12 text-center space-y-6">
            <div className="h-20 w-20 mx-auto rounded-full bg-yellow-500/10 flex items-center justify-center border border-yellow-500/20">
                <span className="material-symbols-outlined text-yellow-500 text-4xl">hourglass_empty</span>
            </div>
            <h2 className="text-xl font-bold text-white">Solicitação enviada</h2>
            <p className="text-xs text-on-surface-variant leading-relaxed">
                Nossa IA e equipe de moderação estão revisando sua foto. 
                Você receberá uma notificação assim que for aprovado.
            </p>
            <button 
                onClick={() => navigate(`/user/${user.id}`)}
                className="w-full py-3 rounded border border-white/10 text-[10px] font-black uppercase tracking-widest"
            >
                Voltar ao Perfil
            </button>
          </GlassCard>
        )}
      </main>
    </div>
  );
}
