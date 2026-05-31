import React, { useState } from 'react';
import { Search, Shield, UserCheck, UserX } from 'lucide-react';

const AdminUsersTab = ({ usersList, toggleBanUser, onRoleChange, t = (k) => k }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const filteredUsers = usersList.filter(user => {
    const matchesSearch = 
      (user.fullName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.username || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.email || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = roleFilter === 'ALL' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'ALL' || user.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            {t('usersManagementTitle') || 'Quản Lý Người Dùng Hệ Thống'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {t('totalAccountsDb') || 'Tổng số tài khoản trong cơ sở dữ liệu'}: <strong className="text-blue-600 font-bold">{usersList.length}</strong>
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={t('searchUserPlaceholder') || 'Tìm kiếm người dùng...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-2xs"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-700 font-medium focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-2xs"
          >
            <option value="ALL">{t('allRoles') || 'Tất cả Vai Trò'}</option>
            <option value="ADMIN">ADMIN</option>
            <option value="USER">USER</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-700 font-medium focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-2xs"
          >
            <option value="ALL">{t('allStatuses') || 'Tất cả Trạng Thái'}</option>
            <option value="ACTIVE">{t('activeStatus') || 'ACTIVE'}</option>
            <option value="BANNED">{t('bannedStatus') || 'BANNED'}</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-bold tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">{t('userCol') || 'Người Dùng'}</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">{t('roleCol') || 'Vai Trò'}</th>
                <th className="px-6 py-4">{t('statusCol') || 'Trạng Thái'}</th>
                <th className="px-6 py-4 text-right">{t('actionsCol') || 'Hành Động'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-white text-xs shadow-xs">
                        {user.fullName?.charAt(0) || user.username?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{user.fullName}</div>
                        <div className="text-[11px] text-slate-400">@{user.username}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600 font-mono text-xs">{user.email}</td>
                  <td className="px-6 py-4">
                    <div className="relative inline-flex items-center">
                      <select
                        value={user.role || 'USER'}
                        onChange={(e) => {
                          const newRole = e.target.value;
                          if (newRole !== user.role) {
                            if (window.confirm(`Role change confirm: "${user.fullName || user.username}" -> ${newRole}?`)) {
                              onRoleChange?.(user.id, newRole);
                            }
                          }
                        }}
                        className={`text-[11px] font-bold py-1 pl-2.5 pr-6 rounded-lg border appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${
                          user.role === 'ADMIN'
                            ? 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100'
                            : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                        }`}
                        title="Change role"
                      >
                        <option value="USER">USER</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
                      <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 text-[9px]">
                        ▼
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                      user.status === 'ACTIVE'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                      {user.status === 'ACTIVE' ? (t('activeStatus') || 'ACTIVE') : (t('bannedStatus') || 'BANNED')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => toggleBanUser(user.userId || user.id)}
                      className={`inline-flex items-center space-x-1 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 shadow-2xs ${
                        user.status === 'BANNED'
                          ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {user.status === 'BANNED' ? (
                        <>
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>{t('unbanUser') || 'Mở Khóa'}</span>
                        </>
                      ) : (
                        <>
                          <UserX className="w-3.5 h-3.5" />
                          <span>{t('banUser') || 'Khóa Tài Khoản'}</span>
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-400 text-xs">
                    {t('noResults') || 'Không tìm thấy người dùng nào'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminUsersTab;
