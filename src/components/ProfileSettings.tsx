import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useProfile } from '@/hooks/useProfile';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { User } from 'lucide-react';

export function ProfileSettings() {
  const { profile, updateProfile } = useProfile();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [persona, setPersona] = useState<'student' | 'farmer' | 'shopkeeper' | 'salaried'>('salaried');
  const [income, setIncome] = useState('');

  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setPersona((profile.persona as 'student' | 'farmer' | 'shopkeeper' | 'salaried') || 'salaried');
      setIncome(String(profile.monthly_income || ''));
    }
  }, [profile]);

  const handleSave = () => {
    updateProfile.mutate(
      { name, persona, monthly_income: parseFloat(income) || 0 },
      { onSuccess: () => toast({ title: 'Profile updated' }) }
    );
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="font-display text-lg flex items-center gap-2">
          <User className="h-5 w-5 text-primary" />
          Profile Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="text-xs">Name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={100} />
        </div>
        <div>
          <Label className="text-xs">Monthly Income (₹)</Label>
          <Input type="number" value={income} onChange={(e) => setIncome(e.target.value)} placeholder="50000" />
        </div>
        <div>
          <Label className="text-xs">Persona</Label>
          <Select value={persona} onValueChange={(v) => setPersona(v as typeof persona)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="student">🎓 Student</SelectItem>
              <SelectItem value="farmer">🌾 Farmer</SelectItem>
              <SelectItem value="shopkeeper">🏪 Shopkeeper</SelectItem>
              <SelectItem value="salaried">💼 Salaried Worker</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handleSave} className="w-full" disabled={updateProfile.isPending}>
          Save Profile
        </Button>
      </CardContent>
    </Card>
  );
}
