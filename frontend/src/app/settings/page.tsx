"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  User, 
  Bell, 
  Shield, 
  CreditCard, 
  Github, 
  Palette,
  ChevronRight,
  Check,
  ExternalLink,
  LogOut,
  Trash2
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

type SettingsTab = "profile" | "notifications" | "integrations" | "billing" | "appearance";

export default function SettingsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [profile, setProfile] = useState({
    name: "",
    email: "",
    company: "",
    website: ""
  });

  const [notifications, setNotifications] = useState({
    email: true,
    browser: false,
    deployments: true,
    updates: false
  });

  const [integrations, setIntegrations] = useState({
    github: true,
    vercel: false
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
    if (user) {
      setProfile({
        name: user.name || "",
        email: user.email || "",
        company: "",
        website: ""
      });
    }
  }, [isAuthenticated, isLoading, router, user]);

  const handleSave = async () => {
    setSaving(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  const tabs = [
    { id: "profile" as const, label: "Profile", icon: User },
    { id: "notifications" as const, label: "Notifications", icon: Bell },
    { id: "integrations" as const, label: "Integrations", icon: Github },
    { id: "billing" as const, label: "Billing", icon: CreditCard },
    { id: "appearance" as const, label: "Appearance", icon: Palette },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="w-5 h-5 border-2 border-stone-300 border-t-stone-900 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-stone-200/60">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex items-center h-16 gap-4">
            <Link 
              href="/dashboard" 
              className="flex items-center gap-2 text-stone-500 hover:text-stone-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <h1 className="text-lg font-display font-medium text-stone-900">Settings</h1>
          </div>
        </div>
      </nav>

      <main className="pt-24 pb-16 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row gap-8">
            <aside className="w-full md:w-56 flex-shrink-0">
              <nav className="space-y-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      activeTab === tab.id
                        ? "bg-stone-900 text-white"
                        : "text-stone-600 hover:bg-stone-100"
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                ))}
              </nav>

              <div className="mt-8 pt-8 border-t border-stone-200">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  Sign out
                </button>
              </div>
            </aside>

            <div className="flex-1 min-w-0">
              {activeTab === "profile" && (
                <div className="bg-white border border-stone-200 rounded-xl">
                  <div className="p-6 border-b border-stone-100">
                    <h2 className="text-lg font-medium text-stone-900">Profile</h2>
                    <p className="text-sm text-stone-500 mt-1">Manage your personal information</p>
                  </div>
                  <div className="p-6 space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-stone-200 flex items-center justify-center text-stone-600 text-xl font-medium overflow-hidden">
                        {user?.avatarUrl ? (
                          <img src={user.avatarUrl} alt={user.name || "User"} className="w-full h-full object-cover" />
                        ) : (
                          user?.name?.charAt(0) || "U"
                        )}
                      </div>
                      <div>
                        <button className="px-3 py-1.5 bg-stone-100 text-stone-700 rounded-lg text-sm font-medium hover:bg-stone-200 transition-colors">
                          Change avatar
                        </button>
                        <p className="text-xs text-stone-400 mt-1">JPG, PNG or GIF. Max 2MB.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1.5">Name</label>
                        <input
                          type="text"
                          value={profile.name}
                          onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                          className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/5 focus:border-stone-300"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1.5">Email</label>
                        <input
                          type="email"
                          value={profile.email}
                          onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                          className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/5 focus:border-stone-300"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1.5">Company</label>
                        <input
                          type="text"
                          value={profile.company}
                          onChange={(e) => setProfile({ ...profile, company: e.target.value })}
                          placeholder="Optional"
                          className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/5 focus:border-stone-300"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1.5">Website</label>
                        <input
                          type="url"
                          value={profile.website}
                          onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                          placeholder="https://"
                          className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/5 focus:border-stone-300"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="p-6 border-t border-stone-100 flex items-center justify-between">
                    <button className="text-sm text-red-600 hover:text-red-700 transition-colors flex items-center gap-2">
                      <Trash2 className="w-4 h-4" />
                      Delete account
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex items-center gap-2 px-4 py-2 bg-stone-900 text-white rounded-lg text-sm font-medium hover:bg-stone-800 transition-all disabled:opacity-50"
                    >
                      {saved ? <Check className="w-4 h-4" /> : null}
                      {saving ? "Saving..." : saved ? "Saved" : "Save changes"}
                    </button>
                  </div>
                </div>
              )}

              {activeTab === "notifications" && (
                <div className="bg-white border border-stone-200 rounded-xl">
                  <div className="p-6 border-b border-stone-100">
                    <h2 className="text-lg font-medium text-stone-900">Notifications</h2>
                    <p className="text-sm text-stone-500 mt-1">Choose how you want to be notified</p>
                  </div>
                  <div className="p-6 space-y-4">
                    {[
                      { key: "email" as const, label: "Email notifications", description: "Receive updates via email" },
                      { key: "browser" as const, label: "Browser notifications", description: "Get push notifications in your browser" },
                      { key: "deployments" as const, label: "Deployment alerts", description: "Be notified when deployments complete" },
                      { key: "updates" as const, label: "Product updates", description: "News about new features and updates" },
                    ].map((item) => (
                      <div key={item.key} className="flex items-center justify-between p-4 bg-stone-50 rounded-xl">
                        <div>
                          <p className="text-sm font-medium text-stone-900">{item.label}</p>
                          <p className="text-xs text-stone-500 mt-0.5">{item.description}</p>
                        </div>
                        <button
                          onClick={() => setNotifications({ ...notifications, [item.key]: !notifications[item.key] })}
                          className={`relative w-10 h-5 rounded-full transition-colors ${
                            notifications[item.key] ? "bg-stone-900" : "bg-stone-200"
                          }`}
                        >
                          <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                            notifications[item.key] ? "left-5" : "left-0.5"
                          }`} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "integrations" && (
                <div className="bg-white border border-stone-200 rounded-xl">
                  <div className="p-6 border-b border-stone-100">
                    <h2 className="text-lg font-medium text-stone-900">Integrations</h2>
                    <p className="text-sm text-stone-500 mt-1">Connect your accounts</p>
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between p-4 bg-stone-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-stone-900 flex items-center justify-center">
                          <Github className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-stone-900">GitHub</p>
                          <p className="text-xs text-stone-500">Deploy projects to GitHub repositories</p>
                        </div>
                      </div>
                      {integrations.github ? (
                        <span className="flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg">
                          <Check className="w-3 h-3" />
                          Connected
                        </span>
                      ) : (
                        <button className="px-3 py-1.5 bg-stone-900 text-white rounded-lg text-sm font-medium hover:bg-stone-800 transition-colors">
                          Connect
                        </button>
                      )}
                    </div>

                    <div className="flex items-center justify-between p-4 bg-stone-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-black flex items-center justify-center">
                          <svg className="w-5 h-5 text-white" viewBox="0 0 76 76" fill="currentColor">
                            <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-stone-900">Vercel</p>
                          <p className="text-xs text-stone-500">Auto-deploy to Vercel</p>
                        </div>
                      </div>
                      {integrations.vercel ? (
                        <span className="flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg">
                          <Check className="w-3 h-3" />
                          Connected
                        </span>
                      ) : (
                        <button 
                          onClick={() => setIntegrations({ ...integrations, vercel: true })}
                          className="px-3 py-1.5 bg-stone-900 text-white rounded-lg text-sm font-medium hover:bg-stone-800 transition-colors"
                        >
                          Connect
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "billing" && (
                <div className="bg-white border border-stone-200 rounded-xl">
                  <div className="p-6 border-b border-stone-100">
                    <h2 className="text-lg font-medium text-stone-900">Billing</h2>
                    <p className="text-sm text-stone-500 mt-1">Manage your subscription</p>
                  </div>
                  <div className="p-6">
                    <div className="p-4 bg-stone-50 rounded-xl mb-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <p className="text-sm font-medium text-stone-900">Free Plan</p>
                          <p className="text-xs text-stone-500">Current plan</p>
                        </div>
                        <span className="text-2xl font-medium text-stone-900">$0<span className="text-sm text-stone-400">/mo</span></span>
                      </div>
                      <ul className="space-y-2 text-sm text-stone-600">
                        <li className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-emerald-500" />
                          5 projects
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-emerald-500" />
                          Basic code generation
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-emerald-500" />
                          Community support
                        </li>
                      </ul>
                    </div>
                    <button className="w-full px-4 py-3 bg-stone-900 text-white rounded-xl text-sm font-medium hover:bg-stone-800 transition-all">
                      Upgrade to Pro
                    </button>
                  </div>
                </div>
              )}

              {activeTab === "appearance" && (
                <div className="bg-white border border-stone-200 rounded-xl">
                  <div className="p-6 border-b border-stone-100">
                    <h2 className="text-lg font-medium text-stone-900">Appearance</h2>
                    <p className="text-sm text-stone-500 mt-1">Customize the look and feel</p>
                  </div>
                  <div className="p-6">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-stone-700 mb-3">Theme</label>
                        <div className="grid grid-cols-3 gap-3">
                          {["Light", "Dark", "System"].map((theme) => (
                            <button
                              key={theme}
                              className={`p-4 rounded-xl border-2 transition-all ${
                                theme === "Light" 
                                  ? "border-stone-900 bg-stone-50" 
                                  : "border-stone-200 hover:border-stone-300"
                              }`}
                            >
                              <div className={`w-full h-12 rounded-lg mb-2 ${
                                theme === "Dark" ? "bg-stone-800" : theme === "System" ? "bg-gradient-to-r from-white to-stone-800" : "bg-white border border-stone-200"
                              }`} />
                              <p className="text-sm font-medium text-stone-900">{theme}</p>
                            </button>
                          ))}
                        </div>
                      </div>
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
