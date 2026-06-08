import { supabase } from '../lib/supabase';

/**
 * Captura IP e Localização do usuário e registra na tabela user_activities
 * @param {string} userId - ID do usuário
 * @param {string} activityType - Tipo de atividade ('LOGIN', 'SESSION_REFRESH', etc)
 */
export const logUserActivity = async (userId, activityType) => {
  if (!userId) return;

  try {
    // Tenta obter o IP via ipify (mais confiável)
    const response = await fetch('https://api.ipify.org?format=json');
    const { ip } = await response.json();
    console.log('IP capturado:', ip);

    const { error } = await supabase.from('login_activity').insert({
      user_id: userId,
      activity_type: activityType,
      ip_address: ip,
      user_agent: navigator.userAgent,
      location: { info: 'GeoIP inacessível (ipapi)' }
    });

    if (error) {
      console.error('ERRO SUPABASE (Insert Principal):', error);
      // Se falhou por falta de coluna, tentamos um insert mínimo como última chance
      await fallbackMinimalLog(userId, activityType, ip);
    } else {
      console.log('Log de auditoria inserido com sucesso');
    }
  } catch (err) {
    console.warn('Falha na captura completa, tentando log mínimo:', err.message);
    await fallbackMinimalLog(userId, activityType);
  }
};

/**
 * Fallback para quando o GeoIP falha ou o insert principal dá erro
 */
const fallbackMinimalLog = async (userId, activityType, ip = 'Unknown') => {
  const { error } = await supabase.from('login_activity').insert({
    user_id: userId,
    activity_type: activityType,
    user_agent: navigator.userAgent,
    ip_address: ip
  });

  if (error) {
    console.error('ERRO CRÍTICO (Log de Auditoria falhou totalmente):', error);
  } else {
    console.log('Log mínimo inserido com sucesso');
  }
};
