import { chapterAccessSchema, chapterDescriptionSchema, chapterTitleSchema } from '$lib/schema.js';
import { error, fail, redirect } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms/server';
import Mux from '@mux/mux-node';
import {
	MUX_TOKEN_ID,
	MUX_TOKEN_SECRET,
	SUPABASE_BUCKET_CHAPTER_VIDEOS
} from '$env/static/private';
import { zod } from 'sveltekit-superforms/adapters';
import type { Database } from '$lib/database.types';
import { supabaseAdmin } from '$lib/server/supabase';
import { getPublicUrl, uploadChapterVideo, removeChapterVideo } from '$lib/server/storage';

const mux = new Mux({ tokenId: MUX_TOKEN_ID, tokenSecret: MUX_TOKEN_SECRET });

type ChapterRow = Database['public']['Tables']['chapters']['Row'];
type CourseRow = Database['public']['Tables']['courses']['Row'];
type MuxDataRow = Database['public']['Tables']['muxData']['Row'];

type ChapterWithMeta = ChapterRow & {
	muxData: MuxDataRow | null;
	videoStoragePath: string | null;
	videoUrl: string | null;
};

const toPublicChapter = (chapter: ChapterRow, muxData: MuxDataRow | null): ChapterWithMeta => ({
	...chapter,
	muxData,
	videoStoragePath: chapter.videoUrl,
	videoUrl: chapter.videoUrl
		? getPublicUrl(SUPABASE_BUCKET_CHAPTER_VIDEOS, chapter.videoUrl)
		: null
});

const assertChapterOwner = async (
	chapterId: string,
	userId: string | undefined
): Promise<{ chapter: ChapterRow; course: CourseRow }> => {
	if (!userId) {
		throw error(401, 'Not authenticated');
	}

	const { data: chapter, error: chapterError } = await supabaseAdmin
		.from('chapters')
		.select('*')
		.eq('id', chapterId)
		.maybeSingle<ChapterRow>();

	if (chapterError) {
		throw error(500, chapterError.message);
	}

	if (!chapter) {
		throw error(404, 'Chapter not found');
	}

	const { data: course, error: courseError } = await supabaseAdmin
		.from('courses')
		.select('*')
		.eq('id', chapter.course)
		.maybeSingle<CourseRow>();

	if (courseError) {
		throw error(500, courseError.message);
	}

	if (!course) {
		throw error(404, 'Course not found');
	}

	if (course.user !== userId) {
		throw error(403, 'You are not allowed to modify this chapter');
	}

	return { chapter, course };
};

export const load = async ({ params, locals: { user } }) => {
	const { chapterId, courseId } = params;
	const { chapter, course } = await assertChapterOwner(chapterId, user?.id);

	if (course.id !== courseId) {
		throw error(404, 'Chapter does not belong to this course');
	}

	const { data: muxData, error: muxError } = await supabaseAdmin
		.from('muxData')
		.select('*')
		.eq('chapterId', chapterId)
		.maybeSingle<MuxDataRow>();

	if (muxError) {
		throw error(500, muxError.message);
	}

	const resolvedChapter = toPublicChapter(chapter, muxData ?? null);
	const chapterTitleForm = await superValidate(resolvedChapter, zod(chapterTitleSchema));
	const chapterDescriptionForm = await superValidate(
		resolvedChapter,
		zod(chapterDescriptionSchema)
	);
	const chapterAccessForm = await superValidate(resolvedChapter, zod(chapterAccessSchema));

	return {
		chapter: resolvedChapter,
		chapterTitleForm,
		chapterDescriptionForm,
		chapterAccessForm
	};
};

export const actions = {
	updateTitle: async (event) => {
		const {
			locals: { user },
			params: { chapterId }
		} = event;

		const form = await superValidate(event, zod(chapterTitleSchema));
		if (!form.valid) {
			return fail(400, { form });
		}

		await assertChapterOwner(chapterId, user?.id);

		const { error: updateError } = await supabaseAdmin
			.from('chapters')
			.update({ title: form.data.title })
			.eq('id', chapterId);

		if (updateError) {
			return message(form, updateError.message, { status: 400 });
		}

		return message(form, 'successfully updated chapter title');
	},
	updateDescription: async (event) => {
		const {
			locals: { user },
			params: { chapterId }
		} = event;

		const form = await superValidate(event, zod(chapterDescriptionSchema));
		if (!form.valid) {
			return fail(400, { form });
		}

		await assertChapterOwner(chapterId, user?.id);

		const { error: updateError } = await supabaseAdmin
			.from('chapters')
			.update({ description: form.data.description ?? '' })
			.eq('id', chapterId);

		if (updateError) {
			return message(form, updateError.message, { status: 400 });
		}

		return message(form, 'successfully updated chapter description');
	},
	updateAccess: async (event) => {
		const {
			locals: { user },
			params: { chapterId }
		} = event;

		const form = await superValidate(event, zod(chapterAccessSchema));
		if (!form.valid) {
			return fail(400, { form });
		}

		await assertChapterOwner(chapterId, user?.id);

		const { error: updateError } = await supabaseAdmin
			.from('chapters')
			.update({ isFree: form.data.isFree })
			.eq('id', chapterId);

		if (updateError) {
			return message(form, updateError.message, { status: 400 });
		}

		return message(form, 'successfully updated chapter access settings');
	},
	updateVideo: async (event) => {
		const {
			locals: { user },
			params: { chapterId, courseId },
			request
		} = event;

		const formData = await request.formData();
		const video = formData.get('video');

		if (!(video instanceof File) || video.size === 0) {
			return fail(400, { message: 'Invalid video file' });
		}

		const { chapter } = await assertChapterOwner(chapterId, user?.id);

		const { data: existingMux } = await supabaseAdmin
			.from('muxData')
			.select('*')
			.eq('chapterId', chapterId)
			.maybeSingle<MuxDataRow>();

		const newPath = await uploadChapterVideo(video, courseId, chapterId);
		const { error: updateError } = await supabaseAdmin
			.from('chapters')
			.update({ videoUrl: newPath })
			.eq('id', chapterId)
			.select('videoUrl')
			.single();

		if (updateError) {
			await removeChapterVideo(newPath).catch(() => {});
			return fail(400, { message: updateError.message });
		}

		if (chapter.videoUrl) {
			await removeChapterVideo(chapter.videoUrl).catch(() => {});
		}

		if (existingMux) {
			await mux.video.assets.delete(existingMux.assetId).catch(() => {});
			await supabaseAdmin.from('muxData').delete().eq('id', existingMux.id);
		}

		const publicUrl = getPublicUrl(SUPABASE_BUCKET_CHAPTER_VIDEOS, newPath);
		const asset = await mux.video.assets.create({
			input: [{ url: publicUrl }],
			playback_policy: ['public'],
			test: false
		});

		await supabaseAdmin
			.from('muxData')
			.insert({
				chapterId,
				assetId: asset.id,
				playbackId: asset.playback_ids?.[0]?.id ?? ''
			});

		return { message: 'successfully updated chapter video' };
	},
	deleteChapter: async (event) => {
		const {
			locals: { user },
			params: { chapterId, courseId }
		} = event;

		const { chapter, course } = await assertChapterOwner(chapterId, user?.id);

		const { data: existingMux } = await supabaseAdmin
			.from('muxData')
			.select('*')
			.eq('chapterId', chapterId)
			.maybeSingle<MuxDataRow>();

		if (existingMux) {
			await mux.video.assets.delete(existingMux.assetId).catch(() => {});
			await supabaseAdmin.from('muxData').delete().eq('id', existingMux.id);
		}

		if (chapter.videoUrl) {
			await removeChapterVideo(chapter.videoUrl).catch(() => {});
		}

		await supabaseAdmin.from('chapters').delete().eq('id', chapterId);

		const { data: publishedChapters } = await supabaseAdmin
			.from('chapters')
			.select('id')
			.eq('course', course.id)
			.eq('isPublished', true);

		if (!publishedChapters?.length) {
			await supabaseAdmin.from('courses').update({ isPublished: false }).eq('id', course.id);
		}

		throw redirect(303, `/teacher/courses/${courseId}`);
	},
	updatePublish: async (event) => {
		const {
			locals: { user },
			params: { chapterId, courseId }
		} = event;

		const { chapter, course } = await assertChapterOwner(chapterId, user?.id);

		const toggled = !chapter.isPublished;

		await supabaseAdmin.from('chapters').update({ isPublished: toggled }).eq('id', chapterId);

		if (!toggled) {
			const { data: publishedChapters } = await supabaseAdmin
				.from('chapters')
				.select('id')
				.eq('course', course.id)
				.eq('isPublished', true);

			if (!publishedChapters?.length) {
				await supabaseAdmin.from('courses').update({ isPublished: false }).eq('id', course.id);
			}
		}

		return {
			message: toggled
				? 'successfully published chapter'
				: 'successfully unpublished chapter'
		};
	}
};
