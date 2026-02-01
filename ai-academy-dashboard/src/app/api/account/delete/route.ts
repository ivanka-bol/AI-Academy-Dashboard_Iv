import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { createServiceSupabaseClient } from '@/lib/supabase';
import { logger } from '@/lib/logger';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function DELETE(_request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const serviceSupabase = createServiceSupabaseClient();

    // Find participant record
    const { data: participant } = await serviceSupabase
      .from('participants')
      .select('id')
      .or(`auth_user_id.eq.${user.id},email.eq.${user.email}`)
      .single();

    if (participant) {
      // Delete related records first (due to foreign key constraints)
      await serviceSupabase
        .from('submissions')
        .delete()
        .eq('participant_id', participant.id);

      await serviceSupabase
        .from('peer_reviews')
        .delete()
        .eq('reviewer_id', participant.id);

      await serviceSupabase
        .from('participant_achievements')
        .delete()
        .eq('participant_id', participant.id);

      await serviceSupabase
        .from('leaderboard')
        .delete()
        .eq('participant_id', participant.id);

      await serviceSupabase
        .from('participant_mastery')
        .delete()
        .eq('participant_id', participant.id);

      await serviceSupabase
        .from('task_force_members')
        .delete()
        .eq('participant_id', participant.id);

      await serviceSupabase
        .from('participant_recognitions')
        .delete()
        .eq('participant_id', participant.id);

      await serviceSupabase
        .from('activity_log')
        .delete()
        .eq('participant_id', participant.id);

      await serviceSupabase
        .from('comments')
        .delete()
        .eq('author_id', participant.id);

      // Delete participant record
      await serviceSupabase
        .from('participants')
        .delete()
        .eq('id', participant.id);
    }

    // Delete auth user using admin API
    const { error: deleteError } = await serviceSupabase.auth.admin.deleteUser(user.id);

    if (deleteError) {
      logger.error('Failed to delete auth user', { userId: user.id }, deleteError);
      return NextResponse.json(
        { error: 'Failed to delete account' },
        { status: 500 }
      );
    }

    logger.info('User account deleted', { userId: user.id, email: user.email });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Account deletion error', {}, error as Error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
