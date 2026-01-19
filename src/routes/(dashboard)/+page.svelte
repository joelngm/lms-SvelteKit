<script lang="ts">
	import { enhance } from '$app/forms';
	import Button from '$lib/components/ui/button/button.svelte';
	import { LogOut } from 'lucide-svelte';

	export let data;
</script>

<section class="space-y-8">
	<header class="rounded-3xl bg-gradient-to-r from-primary/90 via-primary to-primary/80 px-8 py-10 text-primary-foreground shadow-2xl">
		<p class="text-sm font-medium uppercase tracking-[0.35em] text-primary-foreground/70">Dashboard</p>
		<h1 class="mt-4 text-3xl font-semibold md:text-4xl">
			Welcome back{data.user?.email ? `, ${data.user.email}` : ''}!
		</h1>
		<p class="mt-3 max-w-2xl text-base text-primary-foreground/80">
			Pick up where you left off. Track course milestones, manage your cohort, and celebrate the wins coming your way.
		</p>
		<form class="mt-6" action="?/logout" method="POST" use:enhance>
			<Button
				variant="secondary"
				class="group flex items-center gap-2 rounded-full border border-primary/30 bg-primary-foreground/15 px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-foreground/25"
			>
				<LogOut class="size-4 transition-transform group-hover:-translate-x-0.5" />
				Sign out
			</Button>
		</form>
	</header>

	<section class="grid gap-6 md:grid-cols-3">
		<div class="rounded-2xl border border-primary/10 bg-white/90 p-6 shadow-lg backdrop-blur">
			<p class="text-sm font-semibold text-muted-foreground">Active courses</p>
			<p class="mt-3 text-3xl font-bold text-foreground">12</p>
			<p class="mt-2 text-xs text-muted-foreground">
				You&apos;re up 3 since last month. Keep the streak alive!
			</p>
		</div>
		<div class="rounded-2xl border border-primary/10 bg-white/90 p-6 shadow-lg backdrop-blur">
			<p class="text-sm font-semibold text-muted-foreground">Hours this week</p>
			<p class="mt-3 text-3xl font-bold text-foreground">8.5</p>
			<p class="mt-2 text-xs text-muted-foreground">
				A focused forty-five minutes a day keeps your skills sharp.
			</p>
		</div>
		<div class="rounded-2xl border border-primary/10 bg-white/90 p-6 shadow-lg backdrop-blur">
			<p class="text-sm font-semibold text-muted-foreground">Completion rate</p>
			<p class="mt-3 text-3xl font-bold text-foreground">68%</p>
			<p class="mt-2 text-xs text-muted-foreground">
				Reach 75% to unlock an achievement and limited edition badge.
			</p>
		</div>
	</section>
</section>
