import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { type User, browserLocalPersistence, setPersistence } from "firebase/auth";
import { auth, onAuthChanged } from "@/lib/firebase";

type AuthContextType = {
  user: User | null;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Garantir persistência local antes de observar o estado
    setPersistence(auth, browserLocalPersistence).then(() => {
      const unsub = onAuthChanged((firebaseUser) => {
        setUser(firebaseUser);
        setLoading(false);
      });
      return unsub;
    }).catch(() => {
      // Fallback: observar mesmo se setPersistence falhar
      const unsub = onAuthChanged((firebaseUser) => {
        setUser(firebaseUser);
        setLoading(false);
      });
      return unsub;
    });
  }, []);

  // Enquanto carrega, não renderiza nada para evitar flash de tela de login
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}