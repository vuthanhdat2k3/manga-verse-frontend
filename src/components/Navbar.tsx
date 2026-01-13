'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, Search, Settings, Home, X, Shield } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
// import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'; 

// Wait, I saw components/ui earlier and Sheet was NOT there.
// I must implement a custom mobile menu without Sheet if I don't have it.
// I will use a simple state-based overlay.

export function Navbar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const routes = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/search', label: 'Search', icon: Search },
    { href: '/admin', label: 'Admin', icon: Shield },
    { href: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center px-4 md:px-6 justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-2xl bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-500">
          MangaVerse
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex gap-6 text-sm font-medium">
          {routes.map((route) => {
            const isActive = pathname === route.href;
            return (
              <Link
                key={route.href}
                href={route.href}
                className={`transition-colors flex items-center gap-2 ${
                  isActive ? 'text-primary font-bold' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <route.icon className="w-4 h-4" />
                {route.label}
              </Link>
            );
          })}
        </nav>

        {/* Mobile Menu Toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </div>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 top-16 z-[100] bg-background border-t p-4 animate-in slide-in-from-top-5 fade-in-0 h-[calc(100vh-4rem)] shadow-xl">
          <nav className="flex flex-col gap-4">
            {routes.map((route) => {
              const isActive = pathname === route.href;
              return (
                <Link
                  key={route.href}
                  href={route.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-colors ${
                    isActive 
                      ? 'bg-primary/10 text-primary' 
                      : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <route.icon className="w-5 h-5" />
                  {route.label}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
}
