<script context="module">
  import { defaultChainStore, web3, selectedAccount, connected, chainId, chainData } from 'svelte-web3'


    export const optionsPolygon = [
	{ name: "polygon",   image: "https://app.sushi.com/_next/image?url=https%3A%2F%2Fraw.githubusercontent.com%2Fsushiswap%2Ficons%2Fmaster%2Fnetwork%2Fpolygon.jpg&w=48&q=75", id:"cake1", scritta:"polygon"},
    { name: "banana",  image: "https://app.sushi.com/_next/image?url=https%3A%2F%2Fraw.githubusercontent.com%2Fsushiswap%2Ficons%2Fmaster%2Fnetwork%2Fpolygon.jpg&w=48&q=75", id:"banana1", scritta:"polygon"},
   
	
		// other navigation pages can go here
];


export const optionsBsc = [
 { name: "cake",   image: "CAKE.svg", id:"cake1", scritta:"cake"},
   { name: "banana",  image: "BANANA.svg", id:"banana1", scritta:"banana"},
   { name: "sYSL",  image: "sYSL.svg", id:"sysl1", scritta:"sYSL"},
   {name: "BUSD-USDT", image:"BUSD-USDT.svg", id:"busd1", scritta:"BUSD-USDT"},
   {name: "CAKE-BUSD", image:"CAKE-BUSD.svg", id:"cakeb1", scritta:"CAKE-BUSD"}
 
   // other navigation pages can go here
];

</script>