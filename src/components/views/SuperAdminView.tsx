"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Profile } from "@/types/database";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Shield, Trash2, AlertTriangle, Loader2, ShieldAlert, Users, Database, Activity, UserPlus, Edit, Check, X } from "lucide-react";
import { deleteUser } from "@/app/actions/deleteUser";

interface SuperAdminViewProps {
    userEmail?: string;
}

// The ONLY email that can access this view
const SHADOW_ADMIN_EMAIL = "xshinnow@x.com";

export default function SuperAdminView({ userEmail }: SuperAdminViewProps) {
    const [users, setUsers] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Delete confirmation dialog
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<Profile | null>(null);
    const [deleting, setDeleting] = useState(false);

    // Inline Edit State
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState({
        full_name: "",
        role: "",
        department: ""
    });
    const [saving, setSaving] = useState(false);

    // Invite dialog
    const [inviteDialogOpen, setInviteDialogOpen] = useState(false);

    const handleDelete = async (userId: string, email: string) => {
        // Safety: Don't delete yourself
        if (email === 'xshinnow@x.com') {
            alert("You cannot delete the Shadow Admin.");
            return;
        }

        if (!confirm(`Are you sure you want to PERMANENTLY delete ${email}?`)) return;

        const result = await deleteUser(userId);

        if (result.success) {
            // Remove from UI immediately
            setUsers(prev => prev.filter(u => u.id !== userId));
        } else {
            alert("Failed to delete: " + result.message);
        }
    };

    // Security check - CRITICAL
    const isAuthorized = userEmail === SHADOW_ADMIN_EMAIL;

    useEffect(() => {
        if (!isAuthorized) {
            setLoading(false);
            return;
        }
        fetchUsers();
    }, [isAuthorized]);

    const fetchUsers = async () => {
        const supabase = createClient();

        const { data, error: fetchError } = await supabase
            .from("profiles")
            .select("*")
            .order("created_at", { ascending: false });

        if (fetchError) {
            console.error("CRITICAL SUPABASE ERROR:", fetchError);
            setError("Failed to load users");
            setLoading(false);
            return;
        }

        setUsers(data || []);
        setLoading(false);
    };

    const openDeleteDialog = (user: Profile) => {
        setUserToDelete(user);
        setDeleteDialogOpen(true);
    };

    const handleDeleteUser = async () => {
        if (!userToDelete) return;

        setDeleting(true);

        try {
            const supabase = createClient();

            // Delete from profiles table (soft-ban - they can't load the app without a profile)
            const { error: deleteError } = await supabase
                .from("profiles")
                .delete()
                .eq("id", userToDelete.id);

            if (deleteError) {
                console.error("Error deleting user:", deleteError);
                setError("Failed to delete user");
                setDeleting(false);
                return;
            }

            // Refresh list and close dialog
            setDeleteDialogOpen(false);
            setUserToDelete(null);
            fetchUsers();
        } catch (err) {
            console.error("Unexpected error:", err);
            setError("An unexpected error occurred");
        } finally {
            setDeleting(false);
        }
    };

    // Inline Edit Handlers
    const startEditing = (user: Profile) => {
        setEditingId(user.id);
        setEditForm({
            full_name: user.full_name || "",
            role: user.role || "",
            department: user.department || ""
        });
    };

    const cancelEditing = () => {
        setEditingId(null);
        setEditForm({ full_name: "", role: "", department: "" });
    };

    const saveEdit = async (userId: string) => {
        setSaving(true);
        try {
            const supabase = createClient();
            const { error: updateError } = await supabase
                .from("profiles")
                .update({
                    full_name: editForm.full_name,
                    role: editForm.role,
                    department: editForm.department,
                    updated_at: new Date().toISOString(),
                })
                .eq("id", userId);

            if (updateError) throw updateError;

            // Refresh local state without refetching for speed
            setUsers(prev => prev.map(u =>
                u.id === userId
                    ? {
                        ...u,
                        full_name: editForm.full_name,
                        role: editForm.role as Profile['role'],
                        department: editForm.department as Profile['department']
                    }
                    : u
            ));

            setEditingId(null);
        } catch (err) {
            console.error("Error updating user:", err);
            setError("Failed to update user");
        } finally {
            setSaving(false);
        }
    };

    // ACCESS DENIED screen for unauthorized users
    if (!isAuthorized) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <div className="w-24 h-24 mx-auto mb-6 bg-red-500/20 rounded-full flex items-center justify-center">
                        <ShieldAlert size={48} className="text-red-500" />
                    </div>
                    <h1 className="text-3xl font-bold text-red-500 mb-2">ACCESS DENIED</h1>
                    <p className="text-discord-text-muted">
                        You do not have permission to view this page.
                    </p>
                    <p className="text-xs text-discord-text-muted/50 mt-4">
                        Incident logged.
                    </p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="animate-spin text-red-500" size={32} />
            </div>
        );
    }

    return (
        <div className="max-w-6xl">
            {/* Header - Scary/Powerful Style */}
            <div className="mb-6 border-l-4 border-red-500 pl-4">
                <div className="flex items-center gap-3 mb-2">
                    <Shield className="text-red-500" size={28} />
                    <h1 className="text-2xl font-bold text-red-400">SHADOW ADMIN PANEL</h1>
                </div>
                <p className="text-discord-text-muted">
                    Full system access. Handle with extreme caution.
                </p>
                <div className="mt-4">
                    <Button
                        onClick={() => setInviteDialogOpen(true)}
                        className="bg-red-500 hover:bg-red-600 text-white flex items-center gap-2"
                    >
                        <UserPlus size={18} />
                        Add New Member
                    </Button>
                </div>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400">
                    {error}
                </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="bg-discord-sidebar rounded-lg p-4 border-l-2 border-red-500">
                    <Users size={20} className="text-red-400 mb-2" />
                    <p className="text-2xl font-bold text-discord-text">{users.length}</p>
                    <p className="text-discord-text-muted text-sm">Total Users</p>
                </div>
                <div className="bg-discord-sidebar rounded-lg p-4 border-l-2 border-orange-500">
                    <Database size={20} className="text-orange-400 mb-2" />
                    <p className="text-2xl font-bold text-discord-text">
                        {users.filter((u) => u.role === "Admin").length}
                    </p>
                    <p className="text-discord-text-muted text-sm">Admins</p>
                </div>
                <div className="bg-discord-sidebar rounded-lg p-4 border-l-2 border-yellow-500">
                    <Activity size={20} className="text-yellow-400 mb-2" />
                    <p className="text-2xl font-bold text-discord-text">
                        {new Set(users.map((u) => u.department)).size}
                    </p>
                    <p className="text-discord-text-muted text-sm">Departments</p>
                </div>
                <div className="bg-discord-sidebar rounded-lg p-4 border-l-2 border-red-600">
                    <AlertTriangle size={20} className="text-red-500 mb-2" />
                    <p className="text-2xl font-bold text-red-400">ACTIVE</p>
                    <p className="text-discord-text-muted text-sm">Shadow Mode</p>
                </div>
            </div>

            {/* User Table */}
            <div className="bg-discord-sidebar rounded-lg overflow-hidden border border-red-500/30">
                <div className="px-4 py-3 bg-red-500/10 border-b border-red-500/30">
                    <h2 className="font-semibold text-red-400 flex items-center gap-2">
                        <Users size={18} />
                        All System Users
                    </h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-black/20 bg-discord-dark/30">
                                <th className="px-4 py-3 text-left text-xs font-semibold text-discord-text-muted uppercase tracking-wide">
                                    User ID
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-discord-text-muted uppercase tracking-wide">
                                    Email
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-discord-text-muted uppercase tracking-wide">
                                    Name
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-discord-text-muted uppercase tracking-wide">
                                    Role
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-discord-text-muted uppercase tracking-wide">
                                    Department
                                </th>
                                <th className="px-4 py-3 text-center text-xs font-semibold text-red-400 uppercase tracking-wide">
                                    ⚠️ Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user, index) => {
                                const isShadowUser = user.email === SHADOW_ADMIN_EMAIL;
                                const isEditing = editingId === user.id;

                                return (
                                    <tr
                                        key={user.id}
                                        className={`border-b border-black/10 hover:bg-discord-item/30 transition-colors ${index === users.length - 1 ? "border-b-0" : ""
                                            } ${isShadowUser ? "bg-red-500/5" : ""}`}
                                    >
                                        {/* User ID */}
                                        <td className="px-4 py-3">
                                            <code className="text-xs text-discord-text-muted bg-discord-dark px-2 py-1 rounded">
                                                {user.id.slice(0, 8)}...
                                            </code>
                                        </td>

                                        {/* Email */}
                                        <td className="px-4 py-3">
                                            <span className={`text-sm ${isShadowUser ? "text-red-400 font-bold" : "text-discord-text"}`}>
                                                {user.email}
                                                {isShadowUser && " 👑"}
                                            </span>
                                        </td>

                                        {/* Name */}
                                        <td className="px-4 py-3">
                                            {isEditing ? (
                                                <input
                                                    type="text"
                                                    value={editForm.full_name}
                                                    onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                                                    className="w-full bg-discord-dark border border-discord-blurple rounded px-2 py-1 text-sm focus:outline-none"
                                                    placeholder="Full Name"
                                                />
                                            ) : (
                                                <span className="text-sm text-discord-text">
                                                    {user.full_name || "—"}
                                                </span>
                                            )}
                                        </td>

                                        {/* Role */}
                                        <td className="px-4 py-3">
                                            {isEditing ? (
                                                <select
                                                    value={editForm.role}
                                                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                                                    className="w-full bg-discord-dark border border-discord-blurple rounded px-2 py-1 text-sm focus:outline-none"
                                                >
                                                    <option value="">Select Role</option>
                                                    <option value="Designer">Designer</option>
                                                    <option value="Visual Manager">Visual Manager</option>
                                                    <option value="Social Media Manager">Social Media Manager</option>
                                                    <option value="Account Manager">Account Manager</option>
                                                    <option value="Admin">Admin</option>
                                                </select>
                                            ) : (
                                                <span
                                                    className={`px-2 py-0.5 rounded text-xs font-medium ${user.role === "Admin"
                                                        ? "bg-red-500/20 text-red-400"
                                                        : user.role === "Visual Manager"
                                                            ? "bg-discord-blurple/20 text-discord-blurple"
                                                            : "bg-discord-text-muted/20 text-discord-text-muted"
                                                        }`}
                                                >
                                                    {user.role || "Unassigned"}
                                                </span>
                                            )}
                                        </td>

                                        {/* Department */}
                                        <td className="px-4 py-3">
                                            {isEditing ? (
                                                <select
                                                    value={editForm.department}
                                                    onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                                                    className="w-full bg-discord-dark border border-discord-blurple rounded px-2 py-1 text-sm focus:outline-none"
                                                >
                                                    <option value="">Select Dept</option>
                                                    <option value="Designers">Designers</option>
                                                    <option value="Social">Social Media</option>
                                                    <option value="Account Managers">Account Managers</option>
                                                    <option value="Hr">HR Department</option>
                                                    <option value="Operations">Operations</option>
                                                    <option value="SuperAdmin">Super Admin</option>
                                                </select>
                                            ) : (
                                                <span className="text-sm text-discord-text-muted">{user.department || "—"}</span>
                                            )}
                                        </td>

                                        {/* Actions */}
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-center gap-2">
                                                {isShadowUser ? (
                                                    <span className="text-xs text-discord-text-muted">Protected</span>
                                                ) : isEditing ? (
                                                    <>
                                                        <button
                                                            onClick={() => saveEdit(user.id)}
                                                            disabled={saving}
                                                            className="flex items-center gap-1 px-2 py-1 text-xs bg-green-500/20 text-green-500 rounded hover:bg-green-500/30 transition-colors"
                                                            title="Save Changes"
                                                        >
                                                            {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                                                            <span>SAVE</span>
                                                        </button>
                                                        <button
                                                            onClick={cancelEditing}
                                                            disabled={saving}
                                                            className="flex items-center gap-1 px-2 py-1 text-xs bg-red-500/20 text-red-500 rounded hover:bg-red-500/30 transition-colors"
                                                            title="Cancel"
                                                        >
                                                            <X size={12} />
                                                            <span>CANCEL</span>
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button
                                                            onClick={() => startEditing(user)}
                                                            className="flex items-center gap-1 px-2 py-1 text-xs bg-discord-blurple/20 text-discord-blurple rounded hover:bg-discord-blurple/30 transition-colors"
                                                            title="Edit User"
                                                        >
                                                            <Edit size={12} />
                                                            <span>EDIT</span>
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(user.id, user.email)}
                                                            className="text-red-400 hover:bg-red-500/10 p-2 rounded transition-colors"
                                                            title="Delete User"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent className="bg-discord-sidebar border-red-500/50 max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="text-red-400 flex items-center gap-2">
                            <AlertTriangle size={20} />
                            Confirm Deletion
                        </DialogTitle>
                        <DialogDescription className="text-discord-text-muted">
                            This action cannot be undone. The user will be soft-banned and unable to access the system.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4">
                        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                            <p className="text-sm text-discord-text mb-2">
                                <strong>Email:</strong> {userToDelete?.email}
                            </p>
                            <p className="text-sm text-discord-text">
                                <strong>Role:</strong> {userToDelete?.role}
                            </p>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDeleteDialogOpen(false)}
                            className="bg-discord-item border-none text-discord-text hover:bg-discord-item/70"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleDeleteUser}
                            disabled={deleting}
                            className="bg-red-500 hover:bg-red-600 text-white"
                        >
                            {deleting ? (
                                <span className="flex items-center gap-2">
                                    <Loader2 className="animate-spin" size={16} />
                                    Deleting...
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    <Trash2 size={16} />
                                    Delete User
                                </span>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>


            {/* Invite Member Dialog */}
            <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
                <DialogContent className="bg-discord-sidebar border-red-500/50 max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-red-400 flex items-center gap-2">
                            <UserPlus size={20} />
                            Invite New Member
                        </DialogTitle>
                        <DialogDescription className="text-discord-text-muted">
                            How to add a new person to the system:
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 py-4">
                        <div className="bg-discord-dark/50 p-4 rounded-lg border border-red-500/20">
                            <h3 className="text-discord-text font-bold mb-2 flex items-center gap-2">
                                <span className="bg-red-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs">1</span>
                                Send the Registration Link
                            </h3>
                            <p className="text-sm text-discord-text-muted mb-3">
                                Share this link with the new team member. They need to create their account first.
                            </p>
                            <div className="flex items-center gap-2 bg-black/40 p-2 rounded border border-white/10 select-all">
                                <code className="text-xs text-red-300 flex-1 truncate">
                                    {typeof window !== "undefined" ? window.location.origin + "/register" : "/register"}
                                </code>
                            </div>
                        </div>

                        <div className="bg-discord-dark/50 p-4 rounded-lg border border-red-500/20">
                            <h3 className="text-discord-text font-bold mb-2 flex items-center gap-2">
                                <span className="bg-red-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs">2</span>
                                Assign Role & Dept
                            </h3>
                            <p className="text-sm text-discord-text-muted">
                                Once they sign up, they will appear in the table behind this dialog. Click <strong>EDIT</strong> on their row to set their permissions.
                            </p>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            onClick={() => setInviteDialogOpen(false)}
                            className="bg-red-500 hover:bg-red-600 text-white w-full uppercase font-bold tracking-wide"
                        >
                            Got it
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
