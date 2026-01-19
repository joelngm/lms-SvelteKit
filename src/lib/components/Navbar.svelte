<script lang="ts">
	import MobileSidebar from './MobileSidebar.svelte';
	import NavbarRoutes from './NavbarRoutes.svelte';
</script>

<div class="p-4 border-b border-primary/10 h-full flex items-center justify-between bg-gradient-to-r from-primary via-primary/90 to-primary/80 text-primary-foreground shadow-lg">
	<MobileSidebar />
	<NavbarRoutes />
</div>
