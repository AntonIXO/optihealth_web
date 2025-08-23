import { Settings, User, Bell, Shield, Database, Trash2 } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Settings</h1>
        <p className="mt-2 text-white/70">
          Manage your account and application preferences
        </p>
      </div>

      {/* Settings Sections */}
      <div className="space-y-6">
        {/* Profile Settings */}
        <div className="rounded-xl border border-white/20 bg-white/10 p-6 backdrop-blur-md">
          <div className="flex items-center gap-2 mb-4">
            <User className="h-5 w-5 text-blue-400" />
            <h2 className="text-xl font-semibold text-white">Profile</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Full Name
              </label>
              <input
                type="text"
                className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white placeholder-white/50 backdrop-blur-md"
                placeholder="Enter your full name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Email
              </label>
              <input
                type="email"
                className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white placeholder-white/50 backdrop-blur-md"
                placeholder="Enter your email"
              />
            </div>
            <button className="rounded-lg bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700">
              Save Changes
            </button>
          </div>
        </div>

        {/* Notifications */}
        <div className="rounded-xl border border-white/20 bg-white/10 p-6 backdrop-blur-md">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="h-5 w-5 text-yellow-400" />
            <h2 className="text-xl font-semibold text-white">Notifications</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Daily Insights</p>
                <p className="text-sm text-white/70">Receive daily health insights via email</p>
              </div>
              <input type="checkbox" className="h-4 w-4 rounded border-white/30 bg-white/10 text-blue-600" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Goal Reminders</p>
                <p className="text-sm text-white/70">Get reminded about your health goals</p>
              </div>
              <input type="checkbox" className="h-4 w-4 rounded border-white/30 bg-white/10 text-blue-600" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Data Sync Alerts</p>
                <p className="text-sm text-white/70">Notifications when data sync fails</p>
              </div>
              <input type="checkbox" className="h-4 w-4 rounded border-white/30 bg-white/10 text-blue-600" defaultChecked />
            </div>
          </div>
        </div>

        {/* Privacy & Security */}
        <div className="rounded-xl border border-white/20 bg-white/10 p-6 backdrop-blur-md">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="h-5 w-5 text-green-400" />
            <h2 className="text-xl font-semibold text-white">Privacy & Security</h2>
          </div>
          <div className="space-y-4">
            <button className="w-full flex items-center justify-between rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-left transition hover:bg-white/10">
              <span className="text-white">Change Password</span>
              <span className="text-white/50">→</span>
            </button>
            <button className="w-full flex items-center justify-between rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-left transition hover:bg-white/10">
              <span className="text-white">Two-Factor Authentication</span>
              <span className="text-white/50">→</span>
            </button>
            <button className="w-full flex items-center justify-between rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-left transition hover:bg-white/10">
              <span className="text-white">Data Export</span>
              <span className="text-white/50">→</span>
            </button>
          </div>
        </div>

        {/* Data Management */}
        <div className="rounded-xl border border-white/20 bg-white/10 p-6 backdrop-blur-md">
          <div className="flex items-center gap-2 mb-4">
            <Database className="h-5 w-5 text-purple-400" />
            <h2 className="text-xl font-semibold text-white">Data Management</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Data Retention</p>
                <p className="text-sm text-white/70">How long to keep your health data</p>
              </div>
              <select className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white backdrop-blur-md">
                <option value="1y">1 Year</option>
                <option value="2y">2 Years</option>
                <option value="5y">5 Years</option>
                <option value="forever">Forever</option>
              </select>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Auto-sync</p>
                <p className="text-sm text-white/70">Automatically sync data from connected devices</p>
              </div>
              <input type="checkbox" className="h-4 w-4 rounded border-white/30 bg-white/10 text-blue-600" defaultChecked />
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-6 backdrop-blur-md">
          <div className="flex items-center gap-2 mb-4">
            <Trash2 className="h-5 w-5 text-red-400" />
            <h2 className="text-xl font-semibold text-white">Danger Zone</h2>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-white font-medium mb-2">Delete Account</p>
              <p className="text-sm text-white/70 mb-4">
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>
              <button className="rounded-lg bg-red-600 px-4 py-2 text-white transition hover:bg-red-700">
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
