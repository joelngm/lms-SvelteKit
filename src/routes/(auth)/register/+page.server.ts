import { message, superValidate } from 'sveltekit-superforms';
import { registerSchema } from '$lib/schema';
import { fail, redirect } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/server/supabase';
import { zod } from 'sveltekit-superforms/adapters';
export const load = async () => {
	const form = await superValidate(zod(registerSchema));

	return {
		form
	};
};

export const actions = {
	default: async (event) => {
		// Simulate loading state for 5 seconds
		// await new Promise((resolve) => setTimeout(resolve, 5000));
		const {
			locals: { supabase }
		} = event;

		const form = await superValidate(event, zod(registerSchema));

		if (!form.valid) {
			return fail(400, {
				form
			});
		}

		const { data, error } = await supabase.auth.signUp({
			email: form.data.email,
			password: form.data.password,
			options: {
				data: {
					first_name: form.data.firstName,
					last_name: form.data.lastName
				}
			}
		});

		if (error) {
			return message(form, error.message, {
				status: 400
			});
		}

		const userId = data.user?.id;
		if (userId) {
			const { error: profileError } = await supabaseAdmin.from('profiles').insert({
				id: userId,
				email: form.data.email,
				firstName: form.data.firstName,
				lastName: form.data.lastName
			});
			if (profileError) {
				return message(form, profileError.message, {
					status: 400
				});
			}
		}

		redirect(303, '/login');
	}
};
