export const load = async ({ locals: { session, user } }) => {
	return {
		session,
		user
	};
};
