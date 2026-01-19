import { titleSchema } from '$lib/schema';
import { fail, redirect } from '@sveltejs/kit';
import { zod } from 'sveltekit-superforms/adapters';
import { message, superValidate } from 'sveltekit-superforms';
import { supabaseAdmin } from '$lib/server/supabase';
import type { Database } from '$lib/database.types';

export const load = async () => {
	const form = await superValidate(zod(titleSchema));

	return {
		form
	};
};

export const actions = {
	default: async (event) => {
		const {
			locals: { user }
		} = event;
		// Simulate loading state for 5 seconds
		// await new Promise((resolve) => setTimeout(resolve, 5000));

		const form = await superValidate(event, zod(titleSchema));
		if (!form.valid) {
			return fail(400, {
				form
			});
		}

		if (!user?.id) {
			return fail(401, {
				form,
				message: 'You must be logged in to create a course.'
			});
		}

		const { data, error } = await supabaseAdmin
			.from('courses')
			.insert({
				user: user.id,
				title: form.data.title,
				description: '',
				isPublished: false
			})
			.select()
			.single<Database['public']['Tables']['courses']['Row']>();

		if (error || !data) {
			return message(form, error?.message ?? 'Failed to create course', {
				status: 400
			});
		}

		redirect(303, `/teacher/courses/${data.id}`);
	}
};
