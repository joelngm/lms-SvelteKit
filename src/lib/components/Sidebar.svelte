<script lang="ts">
	import Logo from './Logo.svelte';
	import SidebarRoutes from './SidebarRoutes.svelte';
</script>

<div class="h-full border-r border-primary/10 flex flex-col overflow-y-auto bg-gradient-to-b from-white via-secondary/60 to-accent/50 shadow-xl">
	<div class="p-6 pb-4">
		<Logo />
	</div>
	<div class="px-4 text-xs font-medium uppercase tracking-widest text-muted-foreground">Overview</div>
	<div class="flex flex-col w-full px-2 pb-6">
		<SidebarRoutes />
	</div>
</div>
