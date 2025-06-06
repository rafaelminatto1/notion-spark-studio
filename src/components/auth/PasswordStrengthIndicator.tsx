
import React from 'react';
import { Progress } from '@/components/ui/progress';

interface PasswordStrengthIndicatorProps {
  password: string;
}

const PasswordStrengthIndicator = ({ password }: PasswordStrengthIndicatorProps) => {
  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };

  const getPasswordStrengthInfo = (strength: number) => {
    switch (strength) {
      case 0:
      case 1: return { text: 'Muito fraca', color: 'bg-red-500', textColor: 'text-red-600' };
      case 2: return { text: 'Fraca', color: 'bg-orange-500', textColor: 'text-orange-600' };
      case 3: return { text: 'Média', color: 'bg-yellow-500', textColor: 'text-yellow-600' };
      case 4: return { text: 'Forte', color: 'bg-green-500', textColor: 'text-green-600' };
      case 5: return { text: 'Muito forte', color: 'bg-green-600', textColor: 'text-green-700' };
      default: return { text: '', color: '', textColor: '' };
    }
  };

  const getPasswordRequirements = (password: string) => {
    return [
      { text: 'Pelo menos 8 caracteres', met: password.length >= 8 },
      { text: 'Uma letra minúscula', met: /[a-z]/.test(password) },
      { text: 'Uma letra maiúscula', met: /[A-Z]/.test(password) },
      { text: 'Um número', met: /\d/.test(password) },
      { text: 'Um caractere especial', met: /[^A-Za-z0-9]/.test(password) }
    ];
  };

  if (!password) return null;

  const passwordStrength = getPasswordStrength(password);
  const strengthInfo = getPasswordStrengthInfo(passwordStrength);
  const requirements = getPasswordRequirements(password);

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center text-xs">
        <span className="text-muted-foreground">Força da senha:</span>
        <span className={`font-medium ${strengthInfo.textColor}`}>
          {strengthInfo.text}
        </span>
      </div>
      <Progress value={(passwordStrength / 5) * 100} className="h-2" />
      
      <div className="space-y-1">
        {requirements.map((req, index) => (
          <div key={index} className="flex items-center gap-2 text-xs">
            <div className={`w-1.5 h-1.5 rounded-full ${req.met ? 'bg-green-500' : 'bg-gray-300'}`} />
            <span className={req.met ? 'text-green-600' : 'text-muted-foreground'}>
              {req.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PasswordStrengthIndicator;
