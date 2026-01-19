import { superValidate } from 'sveltekit-superforms/server';
import { fail, redirect } from '@sveltejs/kit';
import { loginSchema } from '$lib/schema';

const VALID_EMAIL = 'lyumugabejoel@gmail.com';
const VALID_PASSWORD = '20023030';

export const load = async () => {
	return {
		form: await superValidate(loginSchema)
	};
};

export const actions = {
	default: async ({ request }) => {
		const form = await superValidate(request, loginSchema);

		if (!form.valid) {
			return fail(400, { form });
		}

		const { email, password } = form.data;

		// ✅ ONLY these credentials are allowed
		if (email !== VALID_EMAIL || password !== VALID_PASSWORD) {
			return fail(401, {
				form,
				message: 'Invalid email or password'
			});
		}

		// ✅ Successful login
		throw redirect(303, '/dashboard');
	}
};
