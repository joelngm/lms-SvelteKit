import {
	categorySchema,
	chapterTitleSchema,
	descriptionSchema,
	priceSchema,
	titleSchema
} from '$lib/schema.js';
import { error, fail, redirect } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms/server';
import Mux from '@mux/mux-node';
import {
	MUX_TOKEN_ID,
	MUX_TOKEN_SECRET,
	SUPABASE_BUCKET_ATTACHMENTS,
	SUPABASE_BUCKET_CHAPTER_VIDEOS,
	SUPABASE_BUCKET_COURSE_IMAGES
} from '$env/static/private';
import { zod } from 'sveltekit-superforms/adapters';
import type { Database } from '$lib/database.types';
import { supabaseAdmin } from '$lib/server/supabase';
import {
	getPublicUrl,
	uploadAttachment,
	uploadChapterVideo,
	uploadCourseImage,
	removeAttachment,
	removeChapterVideo,
	removeCourseImage
} from '$lib/server/storage';

const mux = new Mux({ tokenId: MUX_TOKEN_ID, tokenSecret: MUX_TOKEN_SECRET });

type CourseRow = Database['public']['Tables']['courses']['Row'];
type CategoryRow = Database['public']['Tables']['categories']['Row'];
type AttachmentRow = Database['public']['Tables']['attachments']['Row'];
type ChapterRow = Database['public']['Tables']['chapters']['Row'];
type MuxDataRow = Database['public']['Tables']['muxData']['Row'];

type AttachmentWithUrl = AttachmentRow & { publicUrl: string };
type ChapterWithMeta = ChapterRow & {
	muxData: MuxDataRow | null;
	videoStoragePath: string | null;
	videoUrl: string | null;
};
type CourseWithAssets = CourseRow & { imageStoragePath: string | null; imageUrl: string | null };

const toPublicCourse = (course: CourseRow): CourseWithAssets => ({
	...course,
	imageStoragePath: course.imageUrl,
	imageUrl: course.imageUrl
		? getPublicUrl(SUPABASE_BUCKET_COURSE_IMAGES, course.imageUrl)
		: null
});

const toPublicAttachment = (attachment: AttachmentRow): AttachmentWithUrl => ({
	...attachment,
	publicUrl: getPublicUrl(SUPABASE_BUCKET_ATTACHMENTS, attachment.url)
});

const toPublicChapter = (chapter: ChapterRow, muxData: MuxDataRow | null): ChapterWithMeta => ({
	...chapter,
	muxData,
	videoStoragePath: chapter.videoUrl,
	videoUrl: chapter.videoUrl
		? getPublicUrl(SUPABASE_BUCKET_CHAPTER_VIDEOS, chapter.videoUrl)
		: null
});

const assertOwner = async (courseId: string, userId: string | undefined) => {
	if (!userId) {
		throw error(401, 'Not authenticated');
	}

	const { data, error: fetchError } = await supabaseAdmin
		.from('courses')
		.select('id, user, imageUrl')
		.eq('id', courseId)
		.maybeSingle<CourseRow>();

	if (fetchError) {
		throw error(500, fetchError.message);
	}

	if (!data) {
		throw error(404, 'Course not found');
	}

	if (data.user !== userId) {
		throw error(403, 'You are not allowed to modify this course');
	}

	return data;
};

export const load = async ({ params, locals: { user } }) => {
	const { courseId } = params;

	const { data: courseRow, error: courseError } = await supabaseAdmin
		.from('courses')
		.select('*')
		.eq('id', courseId)
		.maybeSingle<CourseRow>();

	if (courseError) {
		throw error(500, courseError.message);
	}

	if (!courseRow) {
		throw error(404, 'Course does not exist');
	}

	if (courseRow.user !== user?.id) {
		throw error(403, 'You do not have access to this course');
	}

	const [{ data: categories, error: categoriesError }, { data: attachments, error: attachmentsError }, { data: chapters, error: chaptersError }] =
		await Promise.all([
			supabaseAdmin
				.from('categories')
				.select('*')
				.order('created_at', { ascending: false }),
			supabaseAdmin
				.from('attachments')
				.select('*')
				.eq('course', courseId)
				.order('created_at', { ascending: false }),
			supabaseAdmin
				.from('chapters')
				.select('*')
				.eq('course', courseId)
				.order('position', { ascending: true })
		]);

	if (categoriesError || attachmentsError || chaptersError) {
		throw error(500, 'Failed to load course dependencies');
	}

	const muxMap = new Map<string, MuxDataRow>();

	if (chapters?.length) {
		const { data: muxRows, error: muxError } = await supabaseAdmin
			.from('muxData')
			.select('*')
			.in(
				'chapterId',
				chapters.map((chapter) => chapter.id)
			);

		if (muxError) {
			throw error(500, muxError.message);
		}

		muxRows?.forEach((row) => muxMap.set(row.chapterId, row));
	}

	const course = toPublicCourse(courseRow);
	const resolvedAttachments = (attachments ?? []).map(toPublicAttachment);
	const resolvedChapters = (chapters ?? []).map((chapter) =>
		toPublicChapter(chapter, muxMap.get(chapter.id) ?? null)
	);

	const titleForm = await superValidate(course, zod(titleSchema));
	const descriptionForm = await superValidate(course, zod(descriptionSchema));
	const categoryForm = await superValidate(course, zod(categorySchema));
	const priceForm = await superValidate(course, zod(priceSchema));
	const chapterTitleForm = await superValidate(zod(chapterTitleSchema), {
		id: 'chapterTitleForm'
	});

	return {
		course,
		categories: (categories ?? []) as CategoryRow[],
		attachments: resolvedAttachments,
		chapters: resolvedChapters,
		titleForm,
		descriptionForm,
		categoryForm,
		priceForm,
		chapterTitleForm
	};
};

export const actions = {
	updateTitle: async (event) => {
		const {
			params: { courseId },
			locals: { user }
		} = event;

		const form = await superValidate(event, zod(titleSchema));
		if (!form.valid) {
			return fail(400, { form });
		}

		await assertOwner(courseId, user?.id);

		const { error: updateError } = await supabaseAdmin
			.from('courses')
			.update({ title: form.data.title })
			.eq('id', courseId);

		if (updateError) {
			return message(form, updateError.message, { status: 400 });
		}

		return message(form, 'successfully updated course title');
	},
	updateDescription: async (event) => {
		const {
			params: { courseId },
			locals: { user }
		} = event;

		const form = await superValidate(event, zod(descriptionSchema));
		if (!form.valid) {
			return fail(400, { form });
		}

		await assertOwner(courseId, user?.id);

		const { error: updateError } = await supabaseAdmin
			.from('courses')
			.update({ description: form.data.description ?? '' })
			.eq('id', courseId);

		if (updateError) {
			return message(form, updateError.message, { status: 400 });
		}

		return message(form, 'successfully updated course description');
	},
	updateImage: async (event) => {
		const {
			params: { courseId },
			locals: { user },
			request
		} = event;

		const formData = await request.formData();
		const image = formData.get('image');

		if (!(image instanceof File) || image.size === 0) {
			return fail(400, { message: 'Invalid file' });
		}

		const course = await assertOwner(courseId, user?.id);

		const newPath = await uploadCourseImage(image, courseId);
		const { error: updateError } = await supabaseAdmin
			.from('courses')
			.update({ imageUrl: newPath })
			.eq('id', courseId)
			.select('imageUrl')
			.single();

		if (updateError) {
			await removeCourseImage(newPath).catch(() => {});
			return fail(400, { message: updateError.message });
		}

		if (course.imageUrl) {
			await removeCourseImage(course.imageUrl).catch(() => {});
		}

		return { message: 'successfully updated course image' };
	},
	updateCategory: async (event) => {
		const {
			params: { courseId },
			locals: { user }
		} = event;

		const form = await superValidate(event, zod(categorySchema));
		if (!form.valid) {
			return fail(400, { form });
		}

		await assertOwner(courseId, user?.id);

		const { error: updateError } = await supabaseAdmin
			.from('courses')
			.update({ category: form.data.category ?? null })
			.eq('id', courseId);

		if (updateError) {
			return message(form, updateError.message, { status: 400 });
		}

		return message(form, 'successfully updated course category');
	},
	updatePrice: async (event) => {
		const {
			params: { courseId },
			locals: { user }
		} = event;

		const form = await superValidate(event, zod(priceSchema));
		if (!form.valid) {
			return fail(400, { form });
		}

		await assertOwner(courseId, user?.id);

		const { error: updateError } = await supabaseAdmin
			.from('courses')
			.update({ price: form.data.price ?? null })
			.eq('id', courseId);

		if (updateError) {
			return message(form, updateError.message, { status: 400 });
		}

		return message(form, 'successfully updated course price');
	},
	createAttachment: async (event) => {
		const {
			params: { courseId },
			locals: { user },
			request
		} = event;

		await assertOwner(courseId, user?.id);

		const formData = await request.formData();
		const file = formData.get('file');

		if (!(file instanceof File) || file.size === 0) {
			return fail(400, { message: 'Invalid attachment file' });
		}

		const storagePath = await uploadAttachment(file, courseId);
		const { error: insertError } = await supabaseAdmin
			.from('attachments')
			.insert({
				course: courseId,
				name: file.name,
				url: storagePath
			});

		if (insertError) {
			await removeAttachment(storagePath).catch(() => {});
			return fail(400, { message: insertError.message });
		}

		return { message: 'successfully added course attachment' };
	},
	deleteAttachment: async (event) => {
		const {
			locals: { user },
			params: { courseId },
			request
		} = event;

		await assertOwner(courseId, user?.id);

		const formData = await request.formData();
		const id = formData.get('id');

		if (typeof id !== 'string') {
			return fail(400, { message: 'Attachment id is required' });
		}

		const { data: attachment, error: fetchError } = await supabaseAdmin
			.from('attachments')
			.select('*')
			.eq('id', id)
			.maybeSingle<AttachmentRow>();

		if (fetchError) {
			return fail(400, { message: fetchError.message });
		}

		if (!attachment) {
			return fail(404, { message: 'Attachment not found' });
		}

		const { error: deleteError } = await supabaseAdmin.from('attachments').delete().eq('id', id);

		if (deleteError) {
			return fail(400, { message: deleteError.message });
		}

		await removeAttachment(attachment.url).catch(() => {});

		return { message: 'successfully deleted course attachment' };
	},
	createChapter: async (event) => {
		const {
			locals: { user },
			params: { courseId }
		} = event;

		await assertOwner(courseId, user?.id);

		const form = await superValidate(event, zod(chapterTitleSchema));
		if (!form.valid) {
			return fail(400, { form });
		}

		const { data: lastChapter } = await supabaseAdmin
			.from('chapters')
			.select('position')
			.eq('course', courseId)
			.order('position', { ascending: false })
			.limit(1)
			.maybeSingle<{ position: number }>();

		const newPosition = (lastChapter?.position ?? 0) + 1;

		const { error: insertError } = await supabaseAdmin
			.from('chapters')
			.insert({
				course: courseId,
				position: newPosition,
				title: form.data.title
			});

		if (insertError) {
			return message(form, insertError.message, { status: 400 });
		}

		return message(form, 'successfully added course chapter');
	},
	updatePublish: async (event) => {
		const {
			locals: { user },
			params: { courseId }
		} = event;

		const course = await assertOwner(courseId, user?.id);

		const { error: updateError } = await supabaseAdmin
			.from('courses')
			.update({ isPublished: !course.isPublished })
			.eq('id', courseId);

		if (updateError) {
			return fail(400, { message: updateError.message });
		}

		return {
			message: course.isPublished
				? 'successfully unpublished course'
				: 'successfully published course',
			confetti: !course.isPublished
		};
	},
	deleteCourse: async (event) => {
		const {
			locals: { user },
			params: { courseId }
		} = event;

		const course = await assertOwner(courseId, user?.id);

		const [{ data: chapters }, { data: attachments }] = await Promise.all([
			supabaseAdmin.from('chapters').select('*').eq('course', courseId),
			supabaseAdmin.from('attachments').select('*').eq('course', courseId)
		]);

		const chapterIds = chapters?.map((chapter) => chapter.id) ?? [];

		if (chapterIds.length) {
			const { data: muxRows } = await supabaseAdmin
				.from('muxData')
				.select('*')
				.in('chapterId', chapterIds);

			await Promise.all(
				(muxRows ?? []).map(async (row) => {
					await mux.video.assets.delete(row.assetId).catch(() => {});
					await supabaseAdmin.from('muxData').delete().eq('id', row.id);
				})
			);
		}

		await Promise.all(
			(chapters ?? []).map(async (chapter) => {
				if (chapter.videoUrl) {
					await removeChapterVideo(chapter.videoUrl).catch(() => {});
				}
			})
		);

		await Promise.all(
			(attachments ?? []).map(async (attachment) => {
				await removeAttachment(attachment.url).catch(() => {});
			})
		);

		await supabaseAdmin.from('attachments').delete().eq('course', courseId);
		await supabaseAdmin.from('chapters').delete().eq('course', courseId);
		await supabaseAdmin.from('courses').delete().eq('id', courseId);

		if (course.imageUrl) {
			await removeCourseImage(course.imageUrl).catch(() => {});
		}

		throw redirect(303, '/teacher/courses');
	}
};
