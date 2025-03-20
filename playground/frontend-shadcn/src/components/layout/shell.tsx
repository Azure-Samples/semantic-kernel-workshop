'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Link from 'next/link';

// Import icons individually to avoid barrel import issues
import { Home } from "lucide-react";
import { MemoryStick } from "lucide-react";
import { FunctionSquare } from "lucide-react";
import { SunMedium } from "lucide-react";
import { GraduationCap } from "lucide-react";
import { Shield } from "lucide-react";
import { Bot } from "lucide-react";
import { Languages } from "lucide-react";
import { Users } from "lucide-react";
import { Menu } from "lucide-react";

// Define navigation groups
const menuGroups = [
  {
    title: 'Main Features',
    items: [
      { text: 'Home', icon: <Home className="h-5 w-5" />, path: '/' },
      { text: 'Semantic Memory', icon: <MemoryStick className="h-5 w-5" />, path: '/memory' },
      { text: 'Functions & Plugins', icon: <FunctionSquare className="h-5 w-5" />, path: '/functions' },
      { text: 'Agent Demo', icon: <Bot className="h-5 w-5" />, path: '/agent' },
      { text: 'Multi-Agent Chat', icon: <Users className="h-5 w-5" />, path: '/multi-agent' },
      { text: 'Filters & Security', icon: <Shield className="h-5 w-5" />, path: '/filters' },
    ]
  },
  {
    title: 'AI Capabilities',
    items: [
      { text: 'Translation', icon: <Languages className="h-5 w-5" />, path: '/translate' },
      { text: 'Weather', icon: <SunMedium className="h-5 w-5" />, path: '/weather' },
      { text: 'Summarization', icon: <GraduationCap className="h-5 w-5" />, path: '/summarize' },
    ]
  }
];

export default function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // Close sidebar on mobile when navigating
  useEffect(() => {
    if (isMobile) {
      setIsOpen(false);
    }
  }, [pathname, isMobile]);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar - Fixed on desktop, slide-over on mobile */}
      <aside 
        className={`bg-white border-r border-gray-200 fixed inset-y-0 z-50 flex w-72 flex-col transition-transform duration-300 lg:relative lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo and title */}
        <div className="flex h-16 items-center px-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-blue-600 text-white">
              <FunctionSquare className="h-5 w-5" />
            </div>
            <span className="font-semibold text-lg text-blue-600">SK Playground</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-auto py-6 px-3">
          {menuGroups.map((group) => (
            <div key={group.title} className="mb-6">
              <h3 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                {group.title}
              </h3>
              <ul className="space-y-1">
                {group.items.map((item) => {
                  const isActive = pathname === item.path;
                  
                  return (
                    <li key={item.text}>
                      <Link 
                        href={item.path}
                        className={`flex items-center gap-3 rounded-md px-3 py-2 relative ${
                          isActive 
                            ? 'bg-blue-50 text-blue-600 font-medium' 
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {isActive && (
                          <span className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 bg-blue-600 rounded-r-full" />
                        )}
                        <span className={isActive ? 'text-blue-600' : 'text-gray-500'}>
                          {item.icon}
                        </span>
                        {item.text}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Footer card */}
        <div className="p-4">
          <Card className="bg-blue-50 border-blue-100 p-4">
            <h4 className="font-semibold text-blue-600 mb-1">Semantic Kernel Workshop</h4>
            <p className="text-sm text-gray-600">
              Explore AI integration patterns with Microsoft's Semantic Kernel
            </p>
          </Card>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-col w-full overflow-hidden">
        {/* Top bar */}
        <header className="flex h-16 items-center gap-4 border-b border-gray-200 bg-white px-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden"
          >
            <Menu className="h-6 w-6" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
          
          <h1 className="font-semibold text-lg flex-1">Semantic Kernel Playground</h1>
          
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-blue-50 text-blue-600 text-sm font-medium">
            <span className="h-2 w-2 rounded-full bg-green-500"></span>
            <span>Backend Connected</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto bg-gray-50 p-6">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile overlay */}
      {isOpen && isMobile && (
        <div 
          className="fixed inset-0 z-40 bg-black/20 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
} 