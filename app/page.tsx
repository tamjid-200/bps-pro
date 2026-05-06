'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';
import '../lib/storage-helper';
import dynamic from 'next/dynamic';

// Load BPS Pro without SSR
const BPSPro = dynamic(() => import('../components/BPSProApp'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <div className="text-gray-600">Loading BPS Pro...</div>
      </div>
    </div>
  )
});

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
      } else {
        setUser(user);
        setLoading(false);
        
        // Expose user info and logout to BPS Pro component
        if (typeof window !== 'undefined') {
          (window as any).__bps_user_email = user.email;
          (window as any).__bps_logout = async () => {
            await supabase.auth.signOut();
            router.push('/login');
          };
        }
      }
    };
    checkUser();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-gray-600">Loading...</div>
        </div>
      </div>
    );
  }

  return <BPSPro />;
}