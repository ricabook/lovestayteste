import { supabase } from '@/integrations/supabase/client';

export function useSecurityLogging() {
  const logSecurityEvent = async (eventType: string, eventDetails: any = {}) => {
    try {
      await supabase.rpc('log_security_event', {
        p_event_type: eventType,
        p_event_details: eventDetails
      });
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  };

  return { logSecurityEvent };
}