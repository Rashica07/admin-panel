'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, ShieldCheck, UserCog } from 'lucide-react';

export default function StaffSettingsPage() {
  return (
    <div className="space-y-6 pb-10 anim-fade-in">
      
      <Card className="bg-surface border-border shadow-sm">
        <CardHeader className="pb-4 border-b border-border/50 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">Staff Accounts</CardTitle>
            <CardDescription className="text-neutral-400 mt-1">Manage who has access to your store.</CardDescription>
          </div>
          <Button className="bg-brand text-black hover:bg-brand-hover gap-2">
            <Plus className="h-4 w-4" /> Invite staff
          </Button>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-neutral-400 bg-surface-2/50 border-b border-border/50">
              <tr>
                <th className="px-6 py-3 font-medium">Name</th>
                <th className="px-6 py-3 font-medium">Role</th>
                <th className="px-6 py-3 font-medium">Last Login</th>
                <th className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {[
                { name: 'Admin User', email: 'admin@novus.com', role: 'Store Owner', login: 'Today' },
                { name: 'Marketing Mgr', email: 'marketing@novus.com', role: 'Editor', login: '3 days ago' },
              ].map((staff, i) => (
                <tr key={i} className="hover:bg-surface-2/30">
                  <td className="px-6 py-4">
                    <p className="font-semibold text-white">{staff.name}</p>
                    <p className="text-xs text-neutral-500 mt-0.5">{staff.email}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-brand/10 text-brand">
                      {staff.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-neutral-400">{staff.login}</td>
                  <td className="px-6 py-4 text-right">
                    <Button variant="ghost" size="sm" className="text-neutral-400 hover:text-white">Edit</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="bg-surface border-border shadow-sm">
        <CardHeader className="pb-4 border-b border-border/50">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-brand" />
            Roles & Permissions
          </CardTitle>
          <CardDescription className="text-neutral-400 mt-1">Control what your staff can see and do.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl border border-border-strong bg-surface-2 hover:border-neutral-600 transition-colors">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-brand/10 flex items-center justify-center text-brand">
                <UserCog className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Store Owner</h4>
                <p className="text-xs text-neutral-400 mt-0.5">Has full access to all areas of the store</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="text-neutral-400 hover:text-white" disabled>System</Button>
          </div>
          
          <div className="flex items-center justify-between p-4 rounded-xl border border-border-strong bg-surface-2 hover:border-neutral-600 transition-colors">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                <UserCog className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Editor</h4>
                <p className="text-xs text-neutral-400 mt-0.5">Can edit pages, products, and manage orders</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="text-neutral-400 hover:text-white">Edit</Button>
          </div>
          
          <Button variant="outline" className="w-full mt-2 border-dashed border-border-strong text-neutral-400 hover:text-white hover:bg-surface-2">
            <Plus className="h-4 w-4 mr-2" /> Create custom role
          </Button>
        </CardContent>
      </Card>

    </div>
  );
}
