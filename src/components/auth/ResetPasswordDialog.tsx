// components/auth/ResetPasswordDialog.tsx (new)
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { AuthService } from '@/services/AuthService';

export default function ResetPasswordDialog({ open, onOpenChange }: {open: boolean; onOpenChange: (v:boolean)=>void}) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Reset password</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Label htmlFor="rp-email">Email</Label>
          <Input id="rp-email" type="email" value={email} onChange={e=>setEmail(e.target.value)} />
          <Button disabled={loading} onClick={async ()=>{
            setLoading(true);
            const { error } = await AuthService.resetPassword(email);
            setLoading(false);
            toast({ title: error ? 'Error' : 'Email sent', description: error ?? 'Check your inbox for the reset link.' });
            if (!error) onOpenChange(false);
          }}>Send reset link</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
