import { superValidate } from 'sveltekit-superforms/server';
import { fail, redirect } from '@sveltejs/kit';
import { loginSchema } from '$lib/schema';

export const load = async () => {
	return {
		form: await superValidate(loginSchema)
	};
};

export const actions = {
	default: async ({ request, locals: { supabase } }) => {
		const form = await superValidate(request, loginSchema);

		if (!form.valid) {
			return fail(400, { form });
		}

		const { email, password } = form.data;
		const { error } = await supabase.auth.signInWithPassword({ email, password });

		if (error) {
			return fail(401, {
				form,
				message: error.message
			});
		}

		throw redirect(303, '/dashboard');
	}
};
