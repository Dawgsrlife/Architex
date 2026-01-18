"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import {
  ArrowLeft,
  User,
  Bell,
  Shield,
  CreditCard,
  Github,
  LogOut,
  Check,
  ChevronRight,
  Moon,
  Sun,
  Globe,
  Key,
  Trash2,
  ExternalLink
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function SettingsPage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("account");
  const [darkMode, setDarkMode] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current) {
      gsap.fromTo(contentRef.current,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }
      );
    }
  }, [activeTab]);

  const tabs = [
    { id: "account", label: "Account", icon: User },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "integrations", label: "Integrations", icon: Github },
    { id: "billing", label: "Billing", icon: CreditCard },
    { id: "security", label: "Security", icon: Shield },
  ];

  return (
    <div className="min-h-screen bg-white">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-stone-100">
        <div className="max-w-4xl mx-auto px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link 
                href="/dashboard" 
                className="p-2 -ml-2 text-stone-400 hover:text-stone-900 hover:bg-stone-50 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <span className="text-sm font-display font-bold tracking-tight text-stone-900">
                Settings
              </span>
            </div>
          </div>
        </div>
      </nav>

      <main className="pt-24 pb-16 px-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-12">
            <aside className="w-48 flex-shrink-0">
              <nav className="space-y-1 sticky top-24">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-all ${
                      activeTab === tab.id
                        ? "bg-stone-900 text-white"
                        : "text-stone-500 hover:text-stone-900 hover:bg-stone-50"
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                ))}
                <div className="pt-4 mt-4 border-t border-stone-100">
                  <button
                    onClick={logout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-red-500 hover:bg-red-50 transition-all"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </nav>
            </aside>

            <div ref={contentRef} className="flex-1">
              {activeTab === "account" && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-xl font-display font-medium text-stone-900 mb-1">Account</h2>
                    <p className="text-sm text-stone-400">Manage your profile and preferences</p>
                  </div>

                  <div className="p-6 bg-stone-50 rounded-2xl">
                    <div className="flex items-center gap-4">
                      {user?.avatar_url ? (
                        <img src={user.avatar_url} alt="" className="w-16 h-16 rounded-full" />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-stone-900 flex items-center justify-center text-white text-xl font-medium">
                          {user?.username?.[0]?.toUpperCase() || "U"}
                        </div>
                      )}
                      <div>
                        <h3 className="text-lg font-medium text-stone-900">{user?.name || user?.username || "User"}</h3>
                        <p className="text-sm text-stone-400">@{user?.username || "user"}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border border-stone-100 rounded-xl">
                      <div className="flex items-center gap-3">
                        {darkMode ? <Moon className="w-5 h-5 text-stone-400" /> : <Sun className="w-5 h-5 text-stone-400" />}
                        <div>
                          <p className="text-sm font-medium text-stone-900">Dark Mode</p>
                          <p className="text-xs text-stone-400">Switch between light and dark themes</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setDarkMode(!darkMode)}
                        className={`w-10 h-5 rounded-full relative transition-colors ${darkMode ? "bg-stone-900" : "bg-stone-200"}`}
                      >
                        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${darkMode ? "right-0.5" : "left-0.5"}`} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-4 border border-stone-100 rounded-xl">
                      <div className="flex items-center gap-3">
                        <Globe className="w-5 h-5 text-stone-400" />
                        <div>
                          <p className="text-sm font-medium text-stone-900">Language</p>
                          <p className="text-xs text-stone-400">Choose your preferred language</p>
                        </div>
                      </div>
                      <select className="bg-stone-50 border-0 rounded-lg px-3 py-2 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-200">
                        <option>English</option>
                        <option>Spanish</option>
                        <option>French</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-stone-100">
                    <button className="flex items-center gap-2 text-sm text-red-500 hover:text-red-600 transition-colors">
                      <Trash2 className="w-4 h-4" />
                      Delete Account
                    </button>
                  </div>
                </div>
              )}

              {activeTab === "notifications" && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-xl font-display font-medium text-stone-900 mb-1">Notifications</h2>
                    <p className="text-sm text-stone-400">Configure how you receive updates</p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border border-stone-100 rounded-xl">
                      <div>
                        <p className="text-sm font-medium text-stone-900">Email Notifications</p>
                        <p className="text-xs text-stone-400">Receive project updates via email</p>
                      </div>
                      <button
                        onClick={() => setEmailNotifications(!emailNotifications)}
                        className={`w-10 h-5 rounded-full relative transition-colors ${emailNotifications ? "bg-emerald-500" : "bg-stone-200"}`}
                      >
                        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${emailNotifications ? "right-0.5" : "left-0.5"}`} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-4 border border-stone-100 rounded-xl">
                      <div>
                        <p className="text-sm font-medium text-stone-900">Push Notifications</p>
                        <p className="text-xs text-stone-400">Get browser notifications for important events</p>
                      </div>
                      <button
                        onClick={() => setPushNotifications(!pushNotifications)}
                        className={`w-10 h-5 rounded-full relative transition-colors ${pushNotifications ? "bg-emerald-500" : "bg-stone-200"}`}
                      >
                        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${pushNotifications ? "right-0.5" : "left-0.5"}`} />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "integrations" && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-xl font-display font-medium text-stone-900 mb-1">Integrations</h2>
                    <p className="text-sm text-stone-400">Connect external services</p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border border-stone-100 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-stone-900 rounded-lg flex items-center justify-center">
                          <Github className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-stone-900">GitHub</p>
                          <p className="text-xs text-stone-400">Connected as @{user?.username || "user"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                          <Check className="w-3 h-3" />
                          Connected
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 border border-stone-100 rounded-xl opacity-50">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-stone-100 rounded-lg flex items-center justify-center">
                          <ExternalLink className="w-5 h-5 text-stone-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-stone-900">Vercel</p>
                          <p className="text-xs text-stone-400">Deploy projects automatically</p>
                        </div>
                      </div>
                      <button className="px-3 py-1.5 bg-stone-900 text-white rounded-full text-xs font-medium">
                        Connect
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "billing" && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-xl font-display font-medium text-stone-900 mb-1">Billing</h2>
                    <p className="text-sm text-stone-400">Manage your subscription and payment methods</p>
                  </div>

                  <div className="p-6 bg-stone-50 rounded-2xl">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-[10px] text-stone-400 tracking-widest uppercase font-medium mb-1">Current Plan</p>
                        <p className="text-2xl font-display font-medium text-stone-900">Free</p>
                      </div>
                      <button className="px-4 py-2 bg-stone-900 text-white rounded-full text-xs font-medium hover:bg-stone-800 transition-colors">
                        Upgrade
                      </button>
                    </div>
                    <p className="text-sm text-stone-400">
                      3 projects · Unlimited components · Community support
                    </p>
                  </div>
                </div>
              )}

              {activeTab === "security" && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-xl font-display font-medium text-stone-900 mb-1">Security</h2>
                    <p className="text-sm text-stone-400">Protect your account</p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border border-stone-100 rounded-xl">
                      <div className="flex items-center gap-3">
                        <Key className="w-5 h-5 text-stone-400" />
                        <div>
                          <p className="text-sm font-medium text-stone-900">Two-Factor Authentication</p>
                          <p className="text-xs text-stone-400">Add an extra layer of security</p>
                        </div>
                      </div>
                      <button className="px-3 py-1.5 border border-stone-200 text-stone-600 rounded-full text-xs font-medium hover:bg-stone-50 transition-colors">
                        Enable
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-4 border border-stone-100 rounded-xl">
                      <div className="flex items-center gap-3">
                        <Shield className="w-5 h-5 text-stone-400" />
                        <div>
                          <p className="text-sm font-medium text-stone-900">Active Sessions</p>
                          <p className="text-xs text-stone-400">Manage devices logged into your account</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-stone-400" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
