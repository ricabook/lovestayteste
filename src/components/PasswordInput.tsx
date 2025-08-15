import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface PasswordValidation {
  minLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
}

interface PasswordInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  showStrength?: boolean;
}

export function PasswordInput({ 
  value, 
  onChange, 
  label = "Senha", 
  placeholder = "Sua senha",
  required = false,
  showStrength = false 
}: PasswordInputProps) {
  const [validation, setValidation] = useState<PasswordValidation>({
    minLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
    hasSpecialChar: false,
  });

  useEffect(() => {
    setValidation({
      minLength: value.length >= 8,
      hasUppercase: /[A-Z]/.test(value),
      hasLowercase: /[a-z]/.test(value),
      hasNumber: /[0-9]/.test(value),
      hasSpecialChar: /[^a-zA-Z0-9]/.test(value),
    });
  }, [value]);

  const getStrength = () => {
    const validCount = Object.values(validation).filter(Boolean).length;
    if (validCount === 0) return { level: 'none', text: '', color: '' };
    if (validCount <= 2) return { level: 'weak', text: 'Fraca', color: 'text-red-500' };
    if (validCount <= 3) return { level: 'medium', text: 'Média', color: 'text-yellow-500' };
    if (validCount <= 4) return { level: 'good', text: 'Boa', color: 'text-blue-500' };
    return { level: 'strong', text: 'Forte', color: 'text-green-500' };
  };

  const strength = getStrength();
  const isValid = Object.values(validation).every(Boolean);

  return (
    <div className="space-y-2">
      <Label htmlFor="password">{label}</Label>
      <Input
        id="password"
        type="password"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className={!isValid && value.length > 0 ? 'border-red-300' : ''}
      />
      
      {showStrength && value.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Força da senha:</span>
            <span className={`text-sm font-medium ${strength.color}`}>
              {strength.text}
            </span>
          </div>
          
          <div className="space-y-1 text-xs">
            <div className={`flex items-center space-x-2 ${validation.minLength ? 'text-green-600' : 'text-red-600'}`}>
              <span>{validation.minLength ? '✓' : '✗'}</span>
              <span>Pelo menos 8 caracteres</span>
            </div>
            <div className={`flex items-center space-x-2 ${validation.hasUppercase ? 'text-green-600' : 'text-red-600'}`}>
              <span>{validation.hasUppercase ? '✓' : '✗'}</span>
              <span>Uma letra maiúscula</span>
            </div>
            <div className={`flex items-center space-x-2 ${validation.hasLowercase ? 'text-green-600' : 'text-red-600'}`}>
              <span>{validation.hasLowercase ? '✓' : '✗'}</span>
              <span>Uma letra minúscula</span>
            </div>
            <div className={`flex items-center space-x-2 ${validation.hasNumber ? 'text-green-600' : 'text-red-600'}`}>
              <span>{validation.hasNumber ? '✓' : '✗'}</span>
              <span>Um número</span>
            </div>
            <div className={`flex items-center space-x-2 ${validation.hasSpecialChar ? 'text-green-600' : 'text-red-600'}`}>
              <span>{validation.hasSpecialChar ? '✓' : '✗'}</span>
              <span>Um caractere especial</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function validatePassword(password: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('A senha deve ter pelo menos 8 caracteres');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('A senha deve conter pelo menos uma letra maiúscula');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('A senha deve conter pelo menos uma letra minúscula');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('A senha deve conter pelo menos um número');
  }
  
  if (!/[^a-zA-Z0-9]/.test(password)) {
    errors.push('A senha deve conter pelo menos um caractere especial');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}