export const load = async ({ locals: { session, user } }) => {
	return {
		session,
		user
	};
};

export const actions = {
	logout: async ({ locals: { supabase } }) => {
		await supabase.auth.signOut();
	}
};
