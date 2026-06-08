import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/services/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import { Loading } from '@/components/ui';

export function AdminGuard({ children }) {
  const { user } = useAuthStore();
  const [isAdmin, setIsAdmin] = useState(null);

  useEffect(() => {
    async function checkAdmin() {
      if (!user?.id) {
        setIsAdmin(null);
        return;
      }

      const { data, error } = await supabase
        .from('users')
        .select('is_admin')
        .eq('id', user.id)
        .maybeSingle();

      if (error || !data) {
        setIsAdmin(false);
      } else {
        setIsAdmin(data.is_admin);
      }
    }

    checkAdmin();
  }, [user]);

  if (isAdmin === null) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loading />
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/search" replace />;
  }

  return children;
}
