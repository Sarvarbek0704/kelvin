import { type FormEvent, type ReactNode, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';

import { ApiError, login } from '@/lib/api';
import { useAuth } from '@/lib/auth-store';
import { Button, Card, Input, Label } from '@/components/ui';

export function LoginPage(): ReactNode {
  const token = useAuth((s) => s.accessToken);
  const setSession = useAuth((s) => s.setSession);
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('owner@kelvin.uz');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (token !== null) {
    return <Navigate to="/" replace />;
  }

  const onSubmit = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await login(identifier, password);
      setSession(res.accessToken, res.user);
      navigate('/');
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 401
          ? "Login yoki parol noto'g'ri"
          : 'Kirishda xatolik',
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <Card className="w-full max-w-sm p-8">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold">Kelvin admin</h1>
          <p className="mt-1 text-sm text-slate-500">Boshqaruv paneliga kirish</p>
        </div>
        <form onSubmit={(e) => void onSubmit(e)} className="space-y-4">
          <div>
            <Label>Email yoki telefon</Label>
            <Input value={identifier} onChange={(e) => setIdentifier(e.target.value)} autoFocus />
          </div>
          <div>
            <Label>Parol</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          {error !== null && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? 'Kirilmoqda…' : 'Kirish'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
