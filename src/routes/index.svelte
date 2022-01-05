<script>
	import Bridge from './bridge.svelte';

	import Home from './home.svelte';
	import Launchpad from './launchpad.svelte';
	import Lottery from './lottery.svelte';
	import Menu from './menu.svelte';
	import url from './url';
	import Notifications from 'svelte-notifications';
</script>

<svelte:head>
	<link rel="stylesheet" href="css1.css" />
	<link rel="stylesheet" href="css2.css" />

	<link rel="stylesheet" href="css3.css" />
</svelte:head>
<Notifications>
	<div id="root">
		<div class="layout">
			<Menu />
			{#if $url.hash === '' || $url.hash === '#/'}
				<Home />
			{:else if $url.hash === '#/launchpad'}
				<Launchpad />
			{:else if $url.hash === '#/bridge'}
				<Bridge />
			{:else}
				<h1>404</h1>
			{/if}
		</div>
	</div>
</Notifications>
