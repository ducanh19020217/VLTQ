import { Menu, Atom } from 'lucide-react';

interface MobileNavProps {
  onToggleSidebar: () => void;
}

export function MobileNav({ onToggleSidebar }: MobileNavProps) {
  return (
    <nav className="mobile-nav">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, color: 'var(--accent-color)' }}>
        <Atom size={24} />
        <span>Vật Lý Trực Quan</span>
      </div>
      <button 
        onClick={onToggleSidebar}
        style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer' }}
      >
        <Menu size={24} />
      </button>
    </nav>
  );
}
