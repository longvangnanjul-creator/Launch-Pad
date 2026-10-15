import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export async function GET() {
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Supabase server configuration is missing.' }, { status: 500 });
  }

  try {
    const [usersRes, completedRes, activeRes] = await Promise.all([
      supabaseAdmin.from('users').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('projects').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
      supabaseAdmin.from('projects').select('*', { count: 'exact', head: true }).eq('status', 'in_progress'),
    ]);

    return NextResponse.json({
      stats: {
        totalUsers: usersRes.count || 0,
        totalProjects: (completedRes.count || 0) + (activeRes.count || 0),
        completedProjects: completedRes.count || 0,
        activeProjects: activeRes.count || 0,
      },
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json({ error: 'Failed to load stats' }, { status: 500 });
  }
}
