import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '$lib/database.types';

type GetProgressParams = {
	supabase: SupabaseClient<Database>;
	userId: string;
	courseId: string;
};

export async function getProgress({ supabase, userId, courseId }: GetProgressParams) {
	const { data: publishedChapters, error: publishedError } = await supabase
		.from('chapters')
		.select('id')
		.eq('course', courseId)
		.eq('isPublished', true);

	if (publishedError || !publishedChapters?.length) {
		return 0;
	}

	const chapterIds = publishedChapters.map((chapter) => chapter.id);
	const { data: completedChapters, error: completedError } = await supabase
		.from('userProgress')
		.select('id')
		.eq('user', userId)
		.eq('isCompleted', true)
		.in('chapter', chapterIds);

	if (completedError || !completedChapters) {
		return 0;
	}

	if (chapterIds.length === 0) {
		return 0;
	}

	return (completedChapters.length / chapterIds.length) * 100;
}
