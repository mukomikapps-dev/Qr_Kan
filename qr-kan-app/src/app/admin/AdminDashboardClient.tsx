"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUsers,
  faUser,
  faCube,
  faEye,
  faMousePointer,
  faCrown,
  faShieldHalved,
  faSignOutAlt,
  faSpinner,
  faSearch,
  faEdit,
  faTrash,
  faBan,
  faCheck,
  faXmark,
  faChevronLeft,
  faChevronRight,
  faCog,
  faPlus,
} from "@fortawesome/free-solid-svg-icons";
import {
  toggleUserProStatus,
  toggleUserAdminStatus,
  deleteUser,
  getAllUsers,
  createNewUser,
} from "./actions";

type AdminUser = {
  id: string;
  email: string;
  isPro: boolean;
  isSuperAdmin: boolean;
};

type Stats = {
  totalUsers: number;
  totalProfiles: number;
  totalBlocks: number;
  totalVisits: number;
  totalClicks: number;
  proUsers: number;
  freeUsers: number;
};

type RecentUser = {
  id: string;
  email: string;
  isPro: boolean;
  isSuperAdmin: boolean;
  createdAt: string;
};

export default function AdminDashboardClient({
  adminUser,
  stats,
  recentUsers,
}: {
  adminUser: AdminUser;
  stats: Stats;
  recentUsers: RecentUser[];
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"overview" | "users" | "settings">("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<RecentUser[]>(recentUsers);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedUser, setSelectedUser] = useState<RecentUser | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  
  // Add user form state
  const [newUserForm, setNewUserForm] = useState({
    email: "",
    password: "",
    username: "",
    displayName: "",
    isPro: false,
    isSuperAdmin: false,
  });
  const [creatingUser, setCreatingUser] = useState(false);

  useEffect(() => {
    if (activeTab === "users") {
      loadUsers();
    }
  }, [activeTab, currentPage]);

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const result = await getAllUsers(currentPage, 20);
      setUsers(result.users);
      setTotalPages(result.totalPages);
    } catch (error) {
      console.error("Failed to load users:", error);
      setMessage({ type: "error", text: "Gagal memuat daftar user" });
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  };

  const handleTogglePro = async (user: RecentUser) => {
    if (actionLoading) return;
    setActionLoading(user.id);
    try {
      await toggleUserProStatus(user.id, !user.isPro);
      setMessage({ type: "success", text: `User ${!user.isPro ? "dinaikkan" : "diturunkan"} ke ${!user.isPro ? "Pro" : "Free"}` });
      await loadUsers();
      router.refresh();
    } catch (error: any) {
      setMessage({ type: "error", text: error.message || "Gagal mengubah status Pro" });
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleAdmin = async (user: RecentUser) => {
    if (actionLoading) return;
    if (user.id === adminUser.id) {
      setMessage({ type: "error", text: "Tidak dapat mengubah status admin sendiri" });
      return;
    }
    setActionLoading(user.id);
    try {
      await toggleUserAdminStatus(user.id, !user.isSuperAdmin);
      setMessage({ type: "success", text: `User ${!user.isSuperAdmin ? "dijadikan" : "dihapus dari"} admin` });
      await loadUsers();
      router.refresh();
    } catch (error: any) {
      setMessage({ type: "error", text: error.message || "Gagal mengubah status admin" });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteClick = (user: RecentUser) => {
    if (user.id === adminUser.id) {
      setMessage({ type: "error", text: "Tidak dapat menghapus akun sendiri" });
      return;
    }
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedUser) return;
    setActionLoading(selectedUser.id);
    try {
      await deleteUser(selectedUser.id);
      setMessage({ type: "success", text: "User berhasil dihapus" });
      setShowDeleteModal(false);
      setSelectedUser(null);
      await loadUsers();
      router.refresh();
    } catch (error: any) {
      setMessage({ type: "error", text: error.message || "Gagal menghapus user" });
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingUser(true);
    try {
      await createNewUser(
        newUserForm.email,
        newUserForm.password,
        newUserForm.username,
        newUserForm.displayName,
        newUserForm.isPro,
        newUserForm.isSuperAdmin
      );
      setMessage({ type: "success", text: "User berhasil dibuat" });
      setShowAddUserModal(false);
      setNewUserForm({
        email: "",
        password: "",
        username: "",
        displayName: "",
        isPro: false,
        isSuperAdmin: false,
      });
      await loadUsers();
      router.refresh();
    } catch (error: any) {
      setMessage({ type: "error", text: error.message || "Gagal membuat user" });
    } finally {
      setCreatingUser(false);
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Auto-hide message after 3 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900">
      {/* Header */}
      <header className="border-b border-zinc-700 bg-zinc-800/50 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-600/20 border border-red-500/30">
                <FontAwesomeIcon icon={faShieldHalved} className="h-5 w-5 text-red-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Admin Panel</h1>
                <p className="text-xs text-zinc-400">Platform Management</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-white">{adminUser.email}</p>
                <p className="text-xs text-zinc-400">Super Admin</p>
              </div>
              <button
                onClick={handleLogout}
                disabled={loading}
                className="flex items-center gap-2 rounded-lg border border-zinc-600 bg-zinc-700/50 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 transition disabled:opacity-50"
              >
                {loading ? (
                  <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                ) : (
                  <>
                    <FontAwesomeIcon icon={faSignOutAlt} />
                    Logout
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b border-zinc-700 bg-zinc-800/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <nav className="flex gap-1">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                activeTab === "overview"
                  ? "border-red-500 text-white"
                  : "border-transparent text-zinc-400 hover:text-zinc-300"
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab("users")}
              className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                activeTab === "users"
                  ? "border-red-500 text-white"
                  : "border-transparent text-zinc-400 hover:text-zinc-300"
              }`}
            >
              Users
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                activeTab === "settings"
                  ? "border-red-500 text-white"
                  : "border-transparent text-zinc-400 hover:text-zinc-300"
              }`}
            >
              Settings
            </button>
          </nav>
        </div>
      </div>

      {/* Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {activeTab === "overview" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Platform Statistics</h2>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                icon={faUsers}
                label="Total Users"
                value={stats.totalUsers}
                color="blue"
              />
              <StatCard
                icon={faUser}
                label="Total Profiles"
                value={stats.totalProfiles}
                color="green"
              />
              <StatCard
                icon={faCube}
                label="Total Blocks"
                value={stats.totalBlocks}
                color="purple"
              />
              <StatCard
                icon={faEye}
                label="Total Visits"
                value={stats.totalVisits}
                color="yellow"
              />
              <StatCard
                icon={faMousePointer}
                label="Total Clicks"
                value={stats.totalClicks}
                color="orange"
              />
              <StatCard
                icon={faCrown}
                label="Pro Users"
                value={stats.proUsers}
                color="amber"
              />
              <StatCard
                icon={faUser}
                label="Free Users"
                value={stats.freeUsers}
                color="zinc"
              />
              <StatCard
                icon={faShieldHalved}
                label="Admin Users"
                value={1}
                color="red"
              />
            </div>
          </div>
        )}

        {activeTab === "users" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">User Management</h2>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <FontAwesomeIcon
                    icon={faSearch}
                    className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
                  />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search users..."
                    className="w-64 rounded-lg border border-zinc-600 bg-zinc-800/50 px-4 py-2 pl-10 text-white placeholder-zinc-500 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                  />
                </div>
                <button
                  onClick={() => setShowAddUserModal(true)}
                  className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition"
                >
                  <FontAwesomeIcon icon={faPlus} />
                  Add User
                </button>
              </div>
            </div>

            {loadingUsers ? (
              <div className="flex items-center justify-center py-12">
                <FontAwesomeIcon icon={faSpinner} className="h-6 w-6 animate-spin text-zinc-400" />
              </div>
            ) : (
              <>
                <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-zinc-700/50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-300">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-300">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-300">
                          Created
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-300">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-700">
                      {filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-6 py-8 text-center text-zinc-400">
                            No users found
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map((user) => (
                          <tr key={user.id} className="hover:bg-zinc-800/50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-white">{user.email}</div>
                              <div className="text-xs text-zinc-400">{user.id.slice(0, 8)}...</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2 flex-wrap">
                                {user.isSuperAdmin && (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-red-500/20 px-2 py-1 text-xs font-medium text-red-300">
                                    <FontAwesomeIcon icon={faShieldHalved} className="h-3 w-3" />
                                    Admin
                                  </span>
                                )}
                                {user.isPro && (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2 py-1 text-xs font-medium text-amber-300">
                                    <FontAwesomeIcon icon={faCrown} className="h-3 w-3" />
                                    Pro
                                  </span>
                                )}
                                {!user.isPro && !user.isSuperAdmin && (
                                  <span className="inline-flex items-center rounded-full bg-zinc-500/20 px-2 py-1 text-xs font-medium text-zinc-300">
                                    Free
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-400">
                              {new Date(user.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleTogglePro(user)}
                                  disabled={actionLoading === user.id || user.id === adminUser.id}
                                  className="text-zinc-400 hover:text-amber-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                  title={user.isPro ? "Remove Pro" : "Make Pro"}
                                >
                                  {actionLoading === user.id ? (
                                    <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                                  ) : (
                                    <FontAwesomeIcon icon={faCrown} />
                                  )}
                                </button>
                                <button
                                  onClick={() => handleToggleAdmin(user)}
                                  disabled={actionLoading === user.id || user.id === adminUser.id}
                                  className="text-zinc-400 hover:text-red-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                  title={user.isSuperAdmin ? "Remove Admin" : "Make Admin"}
                                >
                                  {actionLoading === user.id ? (
                                    <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                                  ) : (
                                    <FontAwesomeIcon icon={faShieldHalved} />
                                  )}
                                </button>
                                <button
                                  onClick={() => handleDeleteClick(user)}
                                  disabled={actionLoading === user.id || user.id === adminUser.id}
                                  className="text-zinc-400 hover:text-red-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                  title="Delete"
                                >
                                  <FontAwesomeIcon icon={faTrash} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-zinc-400">
                      Page {currentPage} of {totalPages}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1 || loadingUsers}
                        className="flex items-center gap-2 rounded-lg border border-zinc-600 bg-zinc-800/50 px-4 py-2 text-sm text-white hover:bg-zinc-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <FontAwesomeIcon icon={faChevronLeft} />
                        Previous
                      </button>
                      <button
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages || loadingUsers}
                        className="flex items-center gap-2 rounded-lg border border-zinc-600 bg-zinc-800/50 px-4 py-2 text-sm text-white hover:bg-zinc-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                        <FontAwesomeIcon icon={faChevronRight} />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === "settings" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Admin Settings</h2>
            
            <div className="grid gap-6 md:grid-cols-2">
              {/* Platform Info */}
              <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-6">
                <h3 className="mb-4 text-lg font-semibold text-white flex items-center gap-2">
                  <FontAwesomeIcon icon={faCog} />
                  Platform Information
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-zinc-400">Total Users</p>
                    <p className="text-xl font-bold text-white">{stats.totalUsers.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-zinc-400">Total Profiles</p>
                    <p className="text-xl font-bold text-white">{stats.totalProfiles.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-zinc-400">Total Blocks</p>
                    <p className="text-xl font-bold text-white">{stats.totalBlocks.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Analytics Summary */}
              <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-6">
                <h3 className="mb-4 text-lg font-semibold text-white flex items-center gap-2">
                  <FontAwesomeIcon icon={faEye} />
                  Analytics Summary
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-zinc-400">Total Visits</p>
                    <p className="text-xl font-bold text-white">{stats.totalVisits.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-zinc-400">Total Clicks</p>
                    <p className="text-xl font-bold text-white">{stats.totalClicks.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-zinc-400">Click Rate</p>
                    <p className="text-xl font-bold text-white">
                      {stats.totalVisits > 0
                        ? ((stats.totalClicks / stats.totalVisits) * 100).toFixed(2)
                        : "0.00"}%
                    </p>
                  </div>
                </div>
              </div>

              {/* User Distribution */}
              <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-6">
                <h3 className="mb-4 text-lg font-semibold text-white flex items-center gap-2">
                  <FontAwesomeIcon icon={faUsers} />
                  User Distribution
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-zinc-400">Pro Users</p>
                    <p className="text-xl font-bold text-white">{stats.proUsers.toLocaleString()}</p>
                    <p className="text-xs text-zinc-500">
                      {stats.totalUsers > 0
                        ? ((stats.proUsers / stats.totalUsers) * 100).toFixed(1)
                        : "0"}% of total
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-zinc-400">Free Users</p>
                    <p className="text-xl font-bold text-white">{stats.freeUsers.toLocaleString()}</p>
                    <p className="text-xs text-zinc-500">
                      {stats.totalUsers > 0
                        ? ((stats.freeUsers / stats.totalUsers) * 100).toFixed(1)
                        : "0"}% of total
                    </p>
                  </div>
                </div>
              </div>

              {/* Admin Actions */}
              <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-6">
                <h3 className="mb-4 text-lg font-semibold text-white flex items-center gap-2">
                  <FontAwesomeIcon icon={faShieldHalved} />
                  Admin Actions
                </h3>
                <div className="space-y-3">
                  <p className="text-sm text-zinc-400">
                    Manage users, view analytics, and configure platform settings from the respective tabs.
                  </p>
                  <div className="pt-2">
                    <button
                      onClick={() => setActiveTab("users")}
                      className="w-full rounded-lg border border-zinc-600 bg-zinc-700/50 px-4 py-2 text-sm text-white hover:bg-zinc-700 transition"
                    >
                      Go to User Management
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Message Toast */}
      {message && (
        <div
          className={`fixed bottom-4 right-4 rounded-lg border px-4 py-3 text-sm text-white shadow-lg ${
            message.type === "success"
              ? "border-emerald-500/30 bg-emerald-600/90"
              : "border-red-500/30 bg-red-600/90"
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === "success" ? (
              <FontAwesomeIcon icon={faCheck} />
            ) : (
              <FontAwesomeIcon icon={faXmark} />
            )}
            {message.text}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-lg border border-zinc-700 bg-zinc-800 p-6">
            <h3 className="mb-4 text-lg font-semibold text-white">Konfirmasi Hapus User</h3>
            <p className="mb-6 text-sm text-zinc-400">
              Apakah Anda yakin ingin menghapus user <strong className="text-white">{selectedUser.email}</strong>?
              Tindakan ini akan menghapus semua data terkait termasuk profil, blok, dan statistik. Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedUser(null);
                }}
                className="flex-1 rounded-lg border border-zinc-600 bg-zinc-700/50 px-4 py-2 text-sm text-white hover:bg-zinc-700 transition"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={actionLoading === selectedUser.id}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading === selectedUser.id ? (
                  <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                ) : (
                  "Hapus"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-lg border border-zinc-700 bg-zinc-800 p-6 max-h-[90vh] overflow-y-auto">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Tambah User Baru</h3>
              <button
                onClick={() => {
                  setShowAddUserModal(false);
                  setNewUserForm({
                    email: "",
                    password: "",
                    username: "",
                    displayName: "",
                    isPro: false,
                    isSuperAdmin: false,
                  });
                }}
                className="text-zinc-400 hover:text-white transition"
              >
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-300">Email *</label>
                <input
                  type="email"
                  value={newUserForm.email}
                  onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                  required
                  className="w-full rounded-lg border border-zinc-600 bg-zinc-700/50 px-4 py-2 text-white placeholder-zinc-500 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                  placeholder="user@example.com"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-300">Password *</label>
                <input
                  type="password"
                  value={newUserForm.password}
                  onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                  required
                  minLength={8}
                  className="w-full rounded-lg border border-zinc-600 bg-zinc-700/50 px-4 py-2 text-white placeholder-zinc-500 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                  placeholder="Minimal 8 karakter"
                />
                <p className="mt-1 text-xs text-zinc-500">Minimal 8 karakter</p>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-300">Username *</label>
                <input
                  type="text"
                  value={newUserForm.username}
                  onChange={(e) => setNewUserForm({ ...newUserForm, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
                  required
                  pattern="[a-zA-Z0-9_]+"
                  className="w-full rounded-lg border border-zinc-600 bg-zinc-700/50 px-4 py-2 text-white placeholder-zinc-500 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                  placeholder="username"
                />
                <p className="mt-1 text-xs text-zinc-500">Hanya huruf, angka, dan underscore</p>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-300">Display Name</label>
                <input
                  type="text"
                  value={newUserForm.displayName}
                  onChange={(e) => setNewUserForm({ ...newUserForm, displayName: e.target.value })}
                  className="w-full rounded-lg border border-zinc-600 bg-zinc-700/50 px-4 py-2 text-white placeholder-zinc-500 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                  placeholder="Nama tampilan (opsional)"
                />
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newUserForm.isPro}
                    onChange={(e) => setNewUserForm({ ...newUserForm, isPro: e.target.checked })}
                    className="rounded border-zinc-600 bg-zinc-700 text-red-600 focus:ring-red-500"
                  />
                  <span className="text-sm text-zinc-300">Pro User</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newUserForm.isSuperAdmin}
                    onChange={(e) => setNewUserForm({ ...newUserForm, isSuperAdmin: e.target.checked })}
                    className="rounded border-zinc-600 bg-zinc-700 text-red-600 focus:ring-red-500"
                  />
                  <span className="text-sm text-zinc-300">Super Admin</span>
                </label>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddUserModal(false);
                    setNewUserForm({
                      email: "",
                      password: "",
                      username: "",
                      displayName: "",
                      isPro: false,
                      isSuperAdmin: false,
                    });
                  }}
                  className="flex-1 rounded-lg border border-zinc-600 bg-zinc-700/50 px-4 py-2 text-sm text-white hover:bg-zinc-700 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={creatingUser}
                  className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creatingUser ? (
                    <>
                      <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />
                      Creating...
                    </>
                  ) : (
                    "Create User"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: any;
  label: string;
  value: number;
  color: string;
}) {
  const colorClasses = {
    blue: "bg-blue-500/20 border-blue-500/30 text-blue-300",
    green: "bg-green-500/20 border-green-500/30 text-green-300",
    purple: "bg-purple-500/20 border-purple-500/30 text-purple-300",
    yellow: "bg-yellow-500/20 border-yellow-500/30 text-yellow-300",
    orange: "bg-orange-500/20 border-orange-500/30 text-orange-300",
    amber: "bg-amber-500/20 border-amber-500/30 text-amber-300",
    zinc: "bg-zinc-500/20 border-zinc-500/30 text-zinc-300",
    red: "bg-red-500/20 border-red-500/30 text-red-300",
  };

  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-zinc-400">{label}</p>
          <p className="mt-2 text-3xl font-bold text-white">{value.toLocaleString()}</p>
        </div>
        <div className={`rounded-lg p-3 ${colorClasses[color as keyof typeof colorClasses]}`}>
          <FontAwesomeIcon icon={icon} className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}

