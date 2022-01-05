<script>
	import BridgetabBSC from './bridgetabBSC.svelte';
	import { chainId, chainData } from 'svelte-web3';
	import BridgetabPoly from './bridgetabPOLY.svelte';
	import BridgetabCro from './bridgetabCRO.svelte';
</script>

<svelte:head>
	<link rel="stylesheet" href="css.css" />
</svelte:head>

<div
	class=" flex-col items-center justify-start flex-grow w-full h-full "
	style="height: max-content;"
>
	<div id="__next">
		<div class="z-0 flex flex-col items-center w-full  pb-16 lg:pb-0">
			{#if $chainId == 56}
				<BridgetabBSC />
			{:else if $chainId == 25}
				<BridgetabCro />
			{:else if $chainId == 137}
				<BridgetabPoly />
			{/if}
		</div>
	</div>
</div>
