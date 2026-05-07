import { Moon, Sun } from 'lucide-react'

import { useTheme } from '../contexts/ThemeContext'

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      type="button"
      className="rounded-full border border-argentina-celeste/50 bg-argentina-celeste/10 p-2 text-argentina-celeste"
      onClick={toggleTheme}
      aria-label="toggle-theme"
    >
      {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  )
}
