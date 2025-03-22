'use client';

import { usePathname } from 'next/navigation';
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
import { Workflow } from "lucide-react";
import { MessageSquare } from "lucide-react";

// Import shadcn sidebar components
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarTrigger,
  SidebarFooter,
  SidebarProvider,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "@/components/ui/sidebar";
import { Card } from '@/components/ui/card';

// Define navigation groups
const menuGroups = [
  {
    title: 'Main',
    items: [
      { text: 'Home', icon: <Home className="h-5 w-5" />, path: '/' },
    ]
  },
  {
    title: 'Main Features',
    items: [
      { text: 'Semantic Memory', icon: <MemoryStick className="h-5 w-5" />, path: '/memory' },
      { text: 'Functions & Plugins', icon: <FunctionSquare className="h-5 w-5" />, path: '/functions' },
      { text: 'Filters & Security', icon: <Shield className="h-5 w-5" />, path: '/filters' },
    ]
  },
  {
    title: 'Example AI Capabilities',
    items: [
      { text: 'Translation', icon: <Languages className="h-5 w-5" />, path: '/translate' },
      { text: 'Weather', icon: <SunMedium className="h-5 w-5" />, path: '/weather' },
      { text: 'Summarization', icon: <GraduationCap className="h-5 w-5" />, path: '/summarize' },
    ]
  },
  {
    title: 'Process Framework',
    items: [
      { text: 'Chat Process', icon: <MessageSquare className="h-5 w-5" />, path: '/process' },
    ]
  },
  {
    title: 'Agents',
    items: [
      { text: 'Single Agent', icon: <Bot className="h-5 w-5" />, path: '/agent' },
      { text: 'Multi-Agent Chat', icon: <Users className="h-5 w-5" />, path: '/multi-agent' },
    ]
  }
];

export default function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <SidebarProvider 
      defaultOpen={true}
      style={{
        "--sidebar-width": "18rem",
        "--sidebar-width-icon": "4rem",
        "--spacing-4": "1rem",
      } as React.CSSProperties}
    >
      <div className="flex h-screen w-full overflow-hidden">
        {/* Sidebar */}
        <Sidebar>
          {/* Logo and title */}
          <SidebarHeader className="flex h-16 items-center px-6 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-blue-600 text-white">
                <FunctionSquare className="h-5 w-5" />
              </div>
              <span className="font-semibold text-lg text-blue-600">SK Playground</span>
            </div>
          </SidebarHeader>

          {/* Navigation Menu */}
          <SidebarContent className="py-4">
            {menuGroups.map((group) => (
              <SidebarGroup key={group.title} className="mb-4">
                <SidebarGroupLabel className="mb-2 px-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  {group.title}
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {group.items.map((item) => {
                      const isActive = pathname === item.path;
                      
                      return (
                        <SidebarMenuItem key={item.text}>
                          <SidebarMenuButton
                            asChild
                            isActive={isActive}
                            className="w-full"
                          >
                            <Link 
                              href={item.path} 
                              className={`flex items-center gap-3 px-4 py-2 rounded-md ${
                                isActive 
                                  ? 'bg-blue-50 text-blue-600 font-medium border-l-2 border-blue-600' 
                                  : 'text-gray-700 hover:bg-gray-100'
                              }`}
                            >
                              <span className={isActive ? 'text-blue-600' : 'text-gray-500'}>
                                {item.icon}
                              </span>
                              <span>{item.text}</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            ))}
          </SidebarContent>

          {/* Footer card */}
          <SidebarFooter className="p-4">
            <Card className="bg-blue-50 border-blue-100 p-4">
              <h4 className="font-semibold text-blue-600 mb-1">Semantic Kernel Workshop</h4>
              <p className="text-sm text-gray-600">
                Explore AI integration patterns with Microsoft's Semantic Kernel
              </p>
            </Card>
          </SidebarFooter>
        </Sidebar>

        {/* Main content */}
        <div className="flex flex-col w-full overflow-hidden">
          {/* Top bar */}
          <header className="flex h-16 items-center gap-4 border-b border-gray-200 bg-white px-6">
            <SidebarTrigger className="lg:hidden">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Toggle Menu</span>
            </SidebarTrigger>
            
            <h1 className="font-semibold text-lg flex-1">Semantic Kernel Playground</h1>
            
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-blue-50 text-blue-600 text-sm font-medium">
              <span className="h-2 w-2 rounded-full bg-green-500"></span>
              <span>Backend Connected</span>
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 overflow-auto bg-gray-50 p-6">
            <div className="mx-auto w-full max-w-[1400px]">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
} 