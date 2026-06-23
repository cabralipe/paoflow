import React from 'react';

interface BigButtonProps {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  variant?: 'primary' | 'secondary' | 'success' | 'danger';
  className?: string;
  disabled?: boolean;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  type?: 'submit' | 'button' | 'reset';
}

export default function BigButton({ 
  label, 
  icon: Icon, 
  variant = 'primary', 
  className = '', 
  disabled = false,
  onClick,
  type = 'button'
}: BigButtonProps) {
  
  const baseStyle = "w-full py-4 px-6 font-black uppercase text-xs sm:text-sm tracking-widest transition-all flex items-center justify-center gap-2 border-4 border-brand-dark shadow-[4px_4px_0px_rgba(26,26,26,1)] active:translate-y-0.5 active:translate-x-0.5 active:shadow-[2px_2px_0px_rgba(26,26,26,1)] disabled:opacity-40 disabled:pointer-events-none disabled:translate-y-0 disabled:translate-x-0 disabled:shadow-[4px_4px_0px_rgba(26,26,26,1)] select-none cursor-pointer";
  
  const variants = {
    primary: "bg-brand-orange text-white hover:bg-brand-orange/90",
    secondary: "bg-white text-brand-dark hover:bg-slate-50",
    success: "bg-emerald-500 text-white hover:bg-emerald-600",
    danger: "bg-rose-500 text-white hover:bg-rose-605"
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${baseStyle} ${variants[variant]} ${className}`}
    >
      {Icon && <Icon className="w-5 h-5 shrink-0 stroke-[2.5]" />}
      <span>{label}</span>
    </button>
  );
}

