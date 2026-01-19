<script lang="ts">
	import * as Form from '$lib/components/ui/form';
	import Input from '$lib/components/ui/input/input.svelte';
	import { loginSchema } from '$lib/schema';
	import Loader2 from 'lucide-svelte/icons/loader-2';
	import { superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';

	export let data;

	const form = superForm(data.form, {
		validators: zodClient(loginSchema)
	});

	const { form: formData, enhance, delayed } = form;
</script>

<div class="min-h-screen bg-gradient-to-br from-secondary via-white to-accent relative flex items-center justify-center px-4 py-12">
	<div class="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
		<div class="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
		<div class="absolute top-1/2 right-0 h-64 w-64 rounded-full bg-accent/30 blur-3xl" />
	</div>

	<div class="relative z-10 grid w-full max-w-5xl gap-12 rounded-3xl bg-card/90 shadow-2xl ring-1 ring-primary/10 backdrop-blur-md p-8 md:grid-cols-[1.15fr,1fr]">
		<section class="flex flex-col justify-center space-y-6">
			<p class="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">Welcome back</p>
			<h1 class="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
				Your learning journey continues here
			</h1>
			<p class="text-base text-muted-foreground md:text-lg">
				Sign in to access your personalised dashboard, pick up where you left off, and keep your momentum going.
			</p>
			<div class="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
				<div class="rounded-2xl border border-primary/10 bg-secondary/40 p-4">
					<p class="font-semibold text-primary">Tailored courses</p>
					<p class="mt-1 leading-relaxed">Curated modules unlock as you progress so you always know the next step.</p>
				</div>
				<div class="rounded-2xl border border-primary/10 bg-secondary/40 p-4">
					<p class="font-semibold text-primary">Track results</p>
					<p class="mt-1 leading-relaxed">Real-time insights show streaks, scores, and your future milestones.</p>
				</div>
			</div>
		</section>

		<section class="rounded-2xl border border-primary/10 bg-white/90 p-6 shadow-xl backdrop-blur-xl">
			<h2 class="text-center text-2xl font-semibold text-foreground">Sign in</h2>
			<p class="mt-2 text-center text-sm text-muted-foreground">We&apos;re glad to see you again.</p>

			<form method="POST" class="mt-6 space-y-5" use:enhance>
				<Form.Field {form} name="email">
					<Form.Control let:attrs>
						<Form.Label class="text-sm font-medium text-muted-foreground">Email</Form.Label>
						<Input
							{...attrs}
							bind:value={$formData.email}
							class="h-11 rounded-xl border-border/60 bg-secondary/50 focus:border-primary focus:ring-primary"
						/>
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>

				<Form.Field {form} name="password">
					<Form.Control let:attrs>
						<Form.Label class="text-sm font-medium text-muted-foreground">Password</Form.Label>
						<Input
							{...attrs}
							type="password"
							bind:value={$formData.password}
							class="h-11 rounded-xl border-border/60 bg-secondary/50 focus:border-primary focus:ring-primary"
						/>
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>

				<Form.Button class="w-full rounded-xl bg-primary py-3 text-base font-semibold tracking-wide text-primary-foreground transition hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-white">
					{#if $delayed}
						<Loader2 class="mr-2 size-5 animate-spin" />
						<span>Signing in</span>
					{:else}
						<span>Continue</span>
					{/if}
				</Form.Button>
			</form>

			<p class="mt-6 text-center text-xs text-muted-foreground">
				By continuing you agree to our
				<a class="font-semibold text-primary hover:underline">Terms</a>
				and
				<a class="font-semibold text-primary hover:underline">Privacy policy</a>.
			</p>
		</section>
	</div>
</div>
