"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"

type Theme = 'light' | 'dark'

type ThemeContextType = {
  theme: Theme
  toggleTheme: () => void
}

const ThemeContext = React.createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = React.useState<Theme>('dark')
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
    const savedTheme = localStorage.getItem('theme') as Theme
    if (savedTheme) {
      setTheme(savedTheme)
    }
  }, [])

  React.useEffect(() => {
    if (mounted) {
      const root = window.document.documentElement
      if (theme === 'dark') {
        root.classList.add('dark')
      } else {
        root.classList.remove('dark')
      }
      localStorage.setItem('theme', theme)
    }
  }, [theme, mounted])

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme: () => setTheme(theme === 'light' ? 'dark' : 'light') }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = React.useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      className="relative inline-flex items-center justify-center w-10 h-10 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 ease-in-out group"
      aria-label="Toggle theme"
    >
      <div className="relative w-5 h-5">
        <Sun 
          className={`absolute inset-0 w-5 h-5 text-amber-500 transition-all duration-300 ease-in-out ${
            theme === 'light' 
              ? 'opacity-100 rotate-0 scale-100' 
              : 'opacity-0 -rotate-90 scale-75'
          }`}
        />
        <Moon 
          className={`absolute inset-0 w-5 h-5 text-blue-500 transition-all duration-300 ease-in-out ${
            theme === 'dark' 
              ? 'opacity-100 rotate-0 scale-100' 
              : 'opacity-0 rotate-90 scale-75'
          }`}
        />
      </div>
      <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-amber-400/20 to-blue-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
    </button>
  )
} 