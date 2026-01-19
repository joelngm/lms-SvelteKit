import { supabaseAdmin } from '$lib/server/supabase';
import type { Database } from '$lib/database.types';

type Course = Database['public']['Tables']['courses']['Row'];

export const load = async ({ locals: { user } }) => {
	if (!user?.id) {
		return { courses: [] as Course[] };
	}

	const { data: courses, error } = await supabaseAdmin
		.from('courses')
		.select('*')
		.eq('user', user.id)
		.order('created_at', { ascending: false });

	if (error || !courses) {
		return { courses: [] as Course[] };
	}

	return {
		courses
	};
};
