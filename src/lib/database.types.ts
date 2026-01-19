export type Json =
	| string
	| number
	| boolean
	| null
	| { [key: string]: Json | undefined }
	| Json[];

export interface Database {
	public: {
		Tables: {
			attachments: {
				Row: {
					course: string;
					created_at: string;
					id: string;
					name: string;
					url: string;
				};
				Insert: {
					course: string;
					created_at?: string;
					id?: string;
					name: string;
					url: string;
				};
				Update: {
					course?: string;
					created_at?: string;
					id?: string;
					name?: string;
					url?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'attachments_course_fkey';
						columns: ['course'];
						referencedRelation: 'courses';
						referencedColumns: ['id'];
					}
				];
			};
			categories: {
				Row: {
					created_at: string;
					id: string;
					name: string;
				};
				Insert: {
					created_at?: string;
					id?: string;
					name: string;
				};
				Update: {
					created_at?: string;
					id?: string;
					name?: string;
				};
				Relationships: [];
			};
			chapters: {
				Row: {
					course: string;
					created_at: string;
					description: string | null;
					id: string;
					isFree: boolean;
					isPublished: boolean;
					position: number;
					title: string;
					updated_at: string;
					videoUrl: string | null;
				};
				Insert: {
					course: string;
					created_at?: string;
					description?: string | null;
					id?: string;
					isFree?: boolean;
					isPublished?: boolean;
					position?: number;
					title: string;
					updated_at?: string;
					videoUrl?: string | null;
				};
				Update: {
					course?: string;
					created_at?: string;
					description?: string | null;
					id?: string;
					isFree?: boolean;
					isPublished?: boolean;
					position?: number;
					title?: string;
					updated_at?: string;
					videoUrl?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: 'chapters_course_fkey';
						columns: ['course'];
						referencedRelation: 'courses';
						referencedColumns: ['id'];
					}
				];
			};
			courses: {
				Row: {
					category: string | null;
					created_at: string;
					description: string | null;
					id: string;
					imageUrl: string | null;
					isPublished: boolean;
					price: number | null;
					title: string;
					updated_at: string;
					user: string;
				};
				Insert: {
					category?: string | null;
					created_at?: string;
					description?: string | null;
					id?: string;
					imageUrl?: string | null;
					isPublished?: boolean;
					price?: number | null;
					title: string;
					updated_at?: string;
					user: string;
				};
				Update: {
					category?: string | null;
					created_at?: string;
					description?: string | null;
					id?: string;
					imageUrl?: string | null;
					isPublished?: boolean;
					price?: number | null;
					title?: string;
					updated_at?: string;
					user?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'courses_category_fkey';
						columns: ['category'];
						referencedRelation: 'categories';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'courses_user_fkey';
						columns: ['user'];
						referencedRelation: 'profiles';
						referencedColumns: ['id'];
					}
				];
			};
			muxData: {
				Row: {
					assetId: string;
					chapterId: string;
					created_at: string;
					id: string;
					playbackId: string;
				};
				Insert: {
					assetId: string;
					chapterId: string;
					created_at?: string;
					id?: string;
					playbackId: string;
				};
				Update: {
					assetId?: string;
					chapterId?: string;
					created_at?: string;
					id?: string;
					playbackId?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'muxData_chapterId_fkey';
						columns: ['chapterId'];
						referencedRelation: 'chapters';
						referencedColumns: ['id'];
					}
				];
			};
			purchase: {
				Row: {
					course: string;
					created_at: string;
					id: string;
					user: string;
				};
				Insert: {
					course: string;
					created_at?: string;
					id?: string;
					user: string;
				};
				Update: {
					course?: string;
					created_at?: string;
					id?: string;
					user?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'purchase_course_fkey';
						columns: ['course'];
						referencedRelation: 'courses';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'purchase_user_fkey';
						columns: ['user'];
						referencedRelation: 'profiles';
						referencedColumns: ['id'];
					}
				];
			};
			userProgress: {
				Row: {
					chapter: string;
					created_at: string;
					id: string;
					isCompleted: boolean;
					user: string;
				};
				Insert: {
					chapter: string;
					created_at?: string;
					id?: string;
					isCompleted?: boolean;
					user: string;
				};
				Update: {
					chapter?: string;
					created_at?: string;
					id?: string;
					isCompleted?: boolean;
					user?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'userProgress_chapter_fkey';
						columns: ['chapter'];
						referencedRelation: 'chapters';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'userProgress_user_fkey';
						columns: ['user'];
						referencedRelation: 'profiles';
						referencedColumns: ['id'];
					}
				];
			};
			profiles: {
				Row: {
					created_at: string;
					email: string;
					firstName: string;
					id: string;
					lastName: string;
				};
				Insert: {
					created_at?: string;
					email: string;
					firstName: string;
					id: string;
					lastName: string;
				};
				Update: {
					created_at?: string;
					email?: string;
					firstName?: string;
					id?: string;
					lastName?: string;
				};
				Relationships: [];
			};
		};
		Views: {};
		Functions: {};
		Enums: {};
		CompositeTypes: {};
	};
}
