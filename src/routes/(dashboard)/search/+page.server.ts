import { getCourses } from '$lib/actions/getCourses.js';
import { supabaseAdmin } from '$lib/server/supabase';
import type { Database } from '$lib/database.types';

type Category = Database['public']['Tables']['categories']['Row'];

export const load = async ({ locals: { user }, url }) => {
	const categoryId = url.searchParams.get('categoryId') || undefined;
	const title = url.searchParams.get('title') || undefined;

	const { data: categories, error: categoriesError } = await supabaseAdmin
		.from('categories')
		.select('*')
		.order('created_at', { ascending: false });

	if (categoriesError) {
		return {
			categories: [],
			courses: []
		};
	}

	const courses = await getCourses({
		supabase: supabaseAdmin,
		categoryId,
		title,
		userId: user?.id ?? undefined
	});

	return {
		categories: categories ?? ([] as Category[]),
		courses
	};
};
