"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, User, Bell, Shield, CreditCard, Github, Key, Trash2, Check, ChevronRight, ExternalLink } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function SettingsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");
  const [saved, setSaved] = useState(false);
  const [formData, setFormData] = useState({ name: user?.name || "", email: user?.email || "", notifications: { email: true, push: false, updates: true } });

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-stone-50"><div className="w-5 h-5 border-2 border-stone-300 border-t-stone-900 rounded-full animate-spin" /></div>;
  if (!isAuthenticated) { router.replace("/login"); return null; }

  const handleSave = async () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "security", label: "Security", icon: Shield },
    { id: "billing", label: "Billing", icon: CreditCard },
    { id: "integrations", label: "Integrations", icon: Github },
  ];

  return (
    <div className="min-h-screen bg-stone-50">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-stone-200/60">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex items-center h-16 gap-4">
            <Link href="/dashboard" className="flex items-center gap-2 text-stone-500 hover:text-stone-900 transition-colors"><ArrowLeft className="w-4 h-4" /></Link>
            <Link href="/dashboard" className="text-lg font-display font-bold tracking-tight text-stone-900">Architex</Link>
            <div className="h-5 w-px bg-stone-200" />
            <span className="text-sm text-stone-500">Settings</span>
          </div>
        </div>
      </nav>

      <main className="pt-24 pb-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-8">
            <aside className="lg:w-48 flex-shrink-0">
              <nav className="space-y-1">
                {tabs.map((tab) => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id ? "bg-stone-900 text-white" : "text-stone-600 hover:bg-stone-100"}`}>
                    <tab.icon className="w-4 h-4" />{tab.label}
                  </button>
                ))}
              </nav>
            </aside>

            <div className="flex-1">
              {activeTab === "profile" && (
                <div className="bg-white border border-stone-200 rounded-xl p-6">
                  <h2 className="text-lg font-medium text-stone-900 mb-6">Profile Settings</h2>
                  <div className="flex items-center gap-4 mb-6 pb-6 border-b border-stone-100">
                    <div className="w-16 h-16 rounded-full bg-stone-200 flex items-center justify-center text-stone-600 text-xl font-medium overflow-hidden">
                      {user?.avatarUrl ? <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" /> : (user?.name?.charAt(0) || "U")}
                    </div>
                    <div>
                      <p className="text-stone-900 font-medium">{user?.name || "User"}</p>
                      <p className="text-sm text-stone-500">{user?.email}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div><label className="block text-sm font-medium text-stone-700 mb-1">Display Name</label><input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/5 focus:border-stone-300" /></div>
                    <div><label className="block text-sm font-medium text-stone-700 mb-1">Email Address</label><input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/5 focus:border-stone-300" /></div>
                  </div>
                  <div className="mt-6 flex justify-end"><button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 bg-stone-900 text-white rounded-lg text-sm font-medium hover:bg-stone-800 transition-all">{saved ? <><Check className="w-4 h-4" />Saved</> : "Save Changes"}</button></div>
                </div>
              )}

              {activeTab === "notifications" && (
                <div className="bg-white border border-stone-200 rounded-xl p-6">
                  <h2 className="text-lg font-medium text-stone-900 mb-6">Notification Preferences</h2>
                  <div className="space-y-4">
                    {[{ key: "email", label: "Email Notifications", desc: "Receive project updates via email" }, { key: "push", label: "Push Notifications", desc: "Browser notifications for important events" }, { key: "updates", label: "Product Updates", desc: "News about new features and improvements" }].map((item) => (
                      <label key={item.key} className="flex items-center justify-between p-4 bg-stone-50 border border-stone-200 rounded-xl cursor-pointer hover:bg-stone-100 transition-colors">
                        <div><p className="text-sm font-medium text-stone-900">{item.label}</p><p className="text-xs text-stone-500">{item.desc}</p></div>
                        <button onClick={() => setFormData({...formData, notifications: {...formData.notifications, [item.key]: !formData.notifications[item.key as keyof typeof formData.notifications]}})} className={`relative w-12 h-6 rounded-full transition-colors ${formData.notifications[item.key as keyof typeof formData.notifications] ? "bg-stone-900" : "bg-stone-200"}`}><span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${formData.notifications[item.key as keyof typeof formData.notifications] ? "left-7" : "left-1"}`} /></button>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "security" && (
                <div className="bg-white border border-stone-200 rounded-xl p-6">
                  <h2 className="text-lg font-medium text-stone-900 mb-6">Security</h2>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-stone-50 border border-stone-200 rounded-xl">
                      <div className="flex items-center gap-3"><Key className="w-5 h-5 text-stone-500" /><div><p className="text-sm font-medium text-stone-900">Two-Factor Authentication</p><p className="text-xs text-stone-500">Add an extra layer of security</p></div></div>
                      <button className="px-3 py-1.5 text-sm font-medium text-stone-600 border border-stone-200 rounded-lg hover:bg-stone-100 transition-colors">Enable</button>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-stone-50 border border-stone-200 rounded-xl">
                      <div className="flex items-center gap-3"><Github className="w-5 h-5 text-stone-500" /><div><p className="text-sm font-medium text-stone-900">Connected via GitHub</p><p className="text-xs text-stone-500">Signed in with GitHub OAuth</p></div></div>
                      <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium"><Check className="w-3 h-3" />Connected</span>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "billing" && (
                <div className="bg-white border border-stone-200 rounded-xl p-6">
                  <h2 className="text-lg font-medium text-stone-900 mb-6">Billing & Plan</h2>
                  <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl mb-6">
                    <div className="flex items-center justify-between mb-4"><span className="text-sm font-medium text-stone-900">Current Plan</span><span className="px-2 py-1 bg-stone-900 text-white text-xs font-medium rounded-full">Free</span></div>
                    <p className="text-sm text-stone-500 mb-4">You&apos;re on the free tier. Upgrade to unlock unlimited projects and advanced features.</p>
                    <button className="w-full px-4 py-2 bg-stone-900 text-white rounded-lg text-sm font-medium hover:bg-stone-800 transition-all">Upgrade to Pro</button>
                  </div>
                  <div className="text-sm text-stone-500">Payment methods and invoices will appear here once you upgrade.</div>
                </div>
              )}

              {activeTab === "integrations" && (
                <div className="bg-white border border-stone-200 rounded-xl p-6">
                  <h2 className="text-lg font-medium text-stone-900 mb-6">Integrations</h2>
                  <div className="space-y-4">
                    {[{ name: "GitHub", desc: "Connect repositories for code generation", connected: true }, { name: "Vercel", desc: "Auto-deploy your generated projects", connected: false }, { name: "AWS", desc: "Deploy infrastructure to AWS", connected: false }].map((int) => (
                      <div key={int.name} className="flex items-center justify-between p-4 bg-stone-50 border border-stone-200 rounded-xl">
                        <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-stone-200 flex items-center justify-center"><Github className="w-5 h-5 text-stone-600" /></div><div><p className="text-sm font-medium text-stone-900">{int.name}</p><p className="text-xs text-stone-500">{int.desc}</p></div></div>
                        {int.connected ? <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium"><Check className="w-3 h-3" />Connected</span> : <button className="px-3 py-1.5 text-sm font-medium text-stone-600 border border-stone-200 rounded-lg hover:bg-stone-100 transition-colors">Connect</button>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-8 p-4 bg-red-50 border border-red-200 rounded-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3"><Trash2 className="w-5 h-5 text-red-500" /><div><p className="text-sm font-medium text-red-900">Delete Account</p><p className="text-xs text-red-600">Permanently delete your account and all data</p></div></div>
                  <button className="px-3 py-1.5 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-colors">Delete</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}