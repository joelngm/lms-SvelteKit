<script lang="ts">
	import Navbar from '$lib/components/Navbar.svelte';
	import Sidebar from '$lib/components/Sidebar.svelte';
</script>

<div class="relative min-h-screen bg-gradient-to-br from-background via-secondary/80 to-accent/70">
	<div class="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.18),_transparent_55%)]" aria-hidden />
	<div class="relative h-full">
		<div class="h-[80px] md:pl-56 fixed inset-y-0 w-full z-50 shadow-lg">
			<Navbar />
		</div>
		<div class="hidden md:flex h-full w-56 flex-col fixed inset-y-0 z-40">
			<Sidebar />
		</div>
		<main class="relative md:pl-56 pt-[90px] pb-10 px-4 md:px-8">
			<div class="mx-auto max-w-6xl space-y-6">
				<div class="rounded-3xl border border-white/40 bg-white/75 p-6 shadow-xl backdrop-blur-lg">
					<slot />
				</div>
			</div>
		</main>
	</div>
</div>
