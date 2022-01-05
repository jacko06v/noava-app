/** @type {import('@sveltejs/kit').Config} */
import vercel from '@sveltejs/adapter-vercel';

const config = {
	
	kit: {
		// hydrate the <div id="svelte"> element in src/app.html
		adapter: vercel(),
		target: '#svelte'
		
	}
};

export default config;
