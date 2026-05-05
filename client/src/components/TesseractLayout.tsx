import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Menu, X, LogOut, Zap, Network, Brain, Sparkles } from "lucide-react";
import { getLoginUrl } from "@/const";

interface TesseractLayoutProps {
  children: React.ReactNode;
  activeSection: "mirror" | "graph" | "ontology" | "inference";
  onSectionChange: (section: "mirror" | "graph" | "ontology" | "inference") => void;
}

export default function TesseractLayout({
  children,
  activeSection,
  onSectionChange,
}: TesseractLayoutProps) {
  const { user, logout, isAuthenticated } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Tesseract</h1>
          <p className="text-slate-300 mb-8">The Sovereign Truth Engine</p>
          <Button
            onClick={() => (window.location.href = getLoginUrl())}
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  const navItems = [
    { id: "mirror" as const, label: "Mirror", icon: Zap, description: "Reflection & Truth" },
    { id: "graph" as const, label: "Graph", icon: Network, description: "Knowledge Base" },
    { id: "ontology" as const, label: "Ontology", icon: Brain, description: "Classes & Properties" },
    { id: "inference" as const, label: "Inference", icon: Sparkles, description: "Logic & Reasoning" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? "w-64" : "w-20"
        } bg-slate-800 border-r border-slate-700 transition-all duration-300 flex flex-col`}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-700 flex items-center justify-between">
          {sidebarOpen && <h2 className="text-white font-bold text-lg">Tesseract</h2>}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-slate-400 hover:text-white transition-colors"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onSectionChange(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded transition-colors ${
                  isActive
                    ? "bg-amber-600 text-white"
                    : "text-slate-400 hover:bg-slate-700 hover:text-white"
                }`}
              >
                <Icon size={20} />
                {sidebarOpen && (
                  <div className="text-left">
                    <div className="font-semibold text-sm">{item.label}</div>
                    <div className="text-xs opacity-75">{item.description}</div>
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-slate-700 space-y-2">
          {sidebarOpen && (
            <div className="text-xs text-slate-400 truncate">
              <div className="font-semibold text-slate-200">{user?.name}</div>
              <div className="truncate">{user?.email}</div>
            </div>
          )}
          <button
            onClick={() => logout()}
            className="w-full flex items-center gap-2 px-3 py-2 rounded text-slate-400 hover:bg-slate-700 hover:text-white transition-colors text-sm"
          >
            <LogOut size={16} />
            {sidebarOpen && "Logout"}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  );
}
