<script>
import Home from './home.svelte';
import Launchpad from './launchpad.svelte';
import Lottery from './lottery.svelte';
import Menu from './menu.svelte';
import url from './url'
</script>

<svelte:head>
    <link rel="stylesheet" href="css1.css">
    <link rel="stylesheet" href="css2.css">
   
    <link rel="stylesheet" href="css3.css">
</svelte:head>

<div id="root">
    <div class="layout">
       <Menu/>
       {#if $url.hash === '' || $url.hash === '#/'}
       <Home/>
     {:else if $url.hash === '#/launchpad'}
       <Launchpad/>
     {:else if $url.hash === '#/lottery'}
       <Lottery/>
       {:else}
       <h1>404</h1>
     {/if}

    </div>

</div>

