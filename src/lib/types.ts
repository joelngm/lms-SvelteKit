import type { Database } from '$lib/database.types';

export type Course = Database['public']['Tables']['courses']['Row'];
export type Category = Database['public']['Tables']['categories']['Row'];
export type Attachment = Database['public']['Tables']['attachments']['Row'];
export type Chapter = Database['public']['Tables']['chapters']['Row'];
export type MuxData = Database['public']['Tables']['muxData']['Row'];
export type UserProgress = Database['public']['Tables']['userProgress']['Row'];
export type Purchase = Database['public']['Tables']['purchase']['Row'];

export type CourseWithMeta = Course & {
	categoryDetails: Pick<Category, 'id' | 'name'> | null;
	chapterCount: number;
	hasPurchase: boolean;
	progress: number | null;
};
