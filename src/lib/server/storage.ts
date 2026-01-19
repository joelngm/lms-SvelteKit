import { randomUUID } from 'node:crypto';
import { Buffer } from 'node:buffer';
import { supabaseAdmin } from './supabase';
import {
	SUPABASE_BUCKET_ATTACHMENTS,
	SUPABASE_BUCKET_CHAPTER_VIDEOS,
	SUPABASE_BUCKET_COURSE_IMAGES
} from '$env/static/private';

const fileToBuffer = async (file: File) => Buffer.from(await file.arrayBuffer());

export const uploadCourseImage = async (file: File, courseId: string) => {
	const filePath = `${courseId}/${randomUUID()}-${file.name}`;
	const { error } = await supabaseAdmin.storage
		.from(SUPABASE_BUCKET_COURSE_IMAGES)
		.upload(filePath, await fileToBuffer(file), {
			contentType: file.type,
			upsert: true
		});

	if (error) {
		throw new Error(error.message);
	}

	return filePath;
};

export const removeCourseImage = async (filePath: string) => {
	const { error } = await supabaseAdmin.storage
		.from(SUPABASE_BUCKET_COURSE_IMAGES)
		.remove([filePath]);
	if (error) {
		throw new Error(error.message);
	}
};

export const uploadAttachment = async (file: File, courseId: string) => {
	const filePath = `${courseId}/${randomUUID()}-${file.name}`;
	const { error } = await supabaseAdmin.storage
		.from(SUPABASE_BUCKET_ATTACHMENTS)
		.upload(filePath, await fileToBuffer(file), {
			contentType: file.type,
			upsert: true
		});

	if (error) {
		throw new Error(error.message);
	}

	return filePath;
};

export const removeAttachment = async (filePath: string) => {
	const { error } = await supabaseAdmin.storage
		.from(SUPABASE_BUCKET_ATTACHMENTS)
		.remove([filePath]);
	if (error) {
		throw new Error(error.message);
	}
};

export const uploadChapterVideo = async (file: File, courseId: string, chapterId: string) => {
	const filePath = `${courseId}/${chapterId}/${randomUUID()}-${file.name}`;
	const { error } = await supabaseAdmin.storage
		.from(SUPABASE_BUCKET_CHAPTER_VIDEOS)
		.upload(filePath, await fileToBuffer(file), {
			contentType: file.type,
			upsert: true
		});

	if (error) {
		throw new Error(error.message);
	}

	return filePath;
};

export const getPublicUrl = (bucket: string, filePath: string) => {
	const {
		data: { publicUrl }
	} = supabaseAdmin.storage.from(bucket).getPublicUrl(filePath);
	return publicUrl;
};

export const removeChapterVideo = async (filePath: string) => {
	const { error } = await supabaseAdmin.storage
		.from(SUPABASE_BUCKET_CHAPTER_VIDEOS)
		.remove([filePath]);
	if (error) {
		throw new Error(error.message);
	}
};
