<script lang="ts">
	import type { CourseWithMeta } from '$lib/types';
	import CourseCard from './CourseCard.svelte';

	export let items: CourseWithMeta[];
</script>

<div>
	<div class="">
		{#if items.length === 0}
			<div class="text-center text-sm text-muted-foreground mt-10">No courses</div>
		{:else}
			<div class="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
				{#each items as { title, id, imageUrl, price, progress, categoryDetails, chapterCount }}
					<CourseCard
						{id}
						{title}
						imageUrl={imageUrl ?? undefined}
						{price}
						{progress}
						category={categoryDetails?.name}
						chapterLength={chapterCount}
					/>
				{/each}
			</div>
		{/if}
	</div>
</div>
