import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '$lib/database.types';
import type { CourseWithMeta } from '$lib/types';
import { getProgress } from './getProgress';

type GetCoursesParams = {
	supabase: SupabaseClient<Database>;
	userId?: string;
	title?: string;
	categoryId?: string;
};

type CourseRecord = Database['public']['Tables']['courses']['Row'] & {
	category_info: { id: string; name: string } | null;
};

export const getCourses = async ({
	supabase,
	categoryId,
	title,
	userId
}: GetCoursesParams): Promise<CourseWithMeta[]> => {
	const query = supabase
		.from('courses')
		.select(
			'*, category_info:categories!courses_category_fkey(id, name)'
		)
		.eq('isPublished', true)
		.order('created_at', { ascending: false });

	if (title) {
		query.ilike('title', `%${title}%`);
	}

	if (categoryId) {
		query.eq('category', categoryId);
	}

	const { data: courses, error } = await query;

	if (error || !courses?.length) {
		return [];
	}

	const typedCourses = courses as CourseRecord[];

	const courseIds = typedCourses.map((course) => course.id);

	const [purchasesResult, chaptersResult] = await Promise.all([
		userId
			? supabase
					.from('purchase')
					.select('course')
					.eq('user', userId)
					.in('course', courseIds)
			: { data: [], error: null },
		supabase
			.from('chapters')
			.select('course')
			.eq('isPublished', true)
			.in('course', courseIds)
	]);

	if (purchasesResult.error || chaptersResult.error) {
		return [];
	}

	const purchasedCourseIds = new Set(
		purchasesResult.data?.map((purchase) => purchase.course) ?? []
	);

	const chapterCounts = new Map<string, number>();
	chaptersResult.data?.forEach(({ course }) => {
		chapterCounts.set(course, (chapterCounts.get(course) ?? 0) + 1);
	});

	const enrichedCourses = await Promise.all(
		typedCourses.map(async ({ category_info, ...course }): Promise<CourseWithMeta> => {
			const hasPurchase = Boolean(userId && purchasedCourseIds.has(course.id));
			const progress = hasPurchase && userId
				? await getProgress({ supabase, userId, courseId: course.id })
				: null;

			return {
				...course,
				categoryDetails: category_info ?? null,
				chapterCount: chapterCounts.get(course.id) ?? 0,
				hasPurchase,
				progress
			};
		})
	);

	return enrichedCourses;
};
