<script>
	import { getNotificationsContext } from 'svelte-notifications';

	const { addNotification } = getNotificationsContext();
	import {
		defaultChainStore,
		web3,
		selectedAccount,
		connected,
		chainId,
		chainData
	} from 'svelte-web3';
	import url from './url';

	const returnNada = () => '';
	const enableBrowser = () => defaultChainStore.setBrowserProvider();
	$: checkAccount = $selectedAccount || '0x0000000000000000000000000000000000000000';

	let header;
	let mobile;
	let navM;

	function openMobile() {
		if (header.classList.contains('activeNav')) {
			header.classList.remove('activeNav');
			mobile.classList.remove('Header_nav_icon_active__w41lj');
			navM.classList.remove('Header_header__nav__active__cNmtw');
		} else {
			header.classList.add('activeNav');
			mobile.classList.add('Header_nav_icon_active__w41lj');
			navM.classList.add('Header_header__nav__active__cNmtw');
		}
	}

	function codeShort(code) {
		let a = code.slice(0, 6);
		let b = code.slice(-4);
		return `${a}...${b}`;
	}

	function wrongChain() {
		addNotification({
			text: 'Wrong chain!',
			position: 'top-right',
			type: 'danger',
			removeAfter: 4000
		});
	}
</script>

<header bind:this={header} class="Header_header__aCt89 header">
	<div class="container">
		<div class="ant-row ant-row-space-between ant-row-middle" style="row-gap: 0px;">
			<div class="Header_header__logo__3iwFp">
				<img alt="logo" src="logo2.png" width="200px" />
			</div>
			<button
				on:click={openMobile}
				bind:this={mobile}
				role="button"
				tabindex="0"
				type="button"
				class="ant-btn Header_nav_icon__1pfDU"><span /><span /><span /><span /></button
			>
			<nav bind:this={navM} class="Header_header__nav__2ub6P">
				<ul class="nav-list Header_header__nav__list__3OOx4">
					<li>
						{#if $url.hash === '' || $url.hash === '#/'}
							<a
								class="Header_header__nav__link__2WlEQ active"
								href="#/"
								style="pointer-events: all;"
								><span
									class="Header_header__nav__link__item__3WAT7"
									style="transition-delay: 0.14s;">Earn</span
								></a
							>
						{:else}
							<a class="Header_header__nav__link__2WlEQ" href="#/" style="pointer-events: all;"
								><span
									class="Header_header__nav__link__item__3WAT7"
									style="transition-delay: 0.14s;">Earn</span
								></a
							>
						{/if}
					</li>

					<li>
						{#if $url.hash === '#/launchpad'}
							<a class="Header_header__nav__link__2WlEQ active" href="#/launchpad"
								><span
									class="Header_header__nav__link__item__3WAT7"
									style="transition-delay: 0.12s;">Launchpad</span
								></a
							>
						{:else}
							<a class="Header_header__nav__link__2WlEQ" href="#/launchpad"
								><span
									class="Header_header__nav__link__item__3WAT7"
									style="transition-delay: 0.12s;">Launchpad</span
								></a
							>
						{/if}
					</li>

					<li>
						{#if $url.hash === '#/bridge'}
							<a
								class="Header_header__nav__link__2WlEQ active"
								href="#/bridge"
								style="pointer-events: all;"
								><span
									class="Header_header__nav__link__item__3WAT7"
									style="transition-delay: 0.02s;">Bridge</span
								></a
							>
						{:else}
							<a
								class="Header_header__nav__link__2WlEQ"
								href="#/bridge"
								style="pointer-events: all;"
								><span
									class="Header_header__nav__link__item__3WAT7"
									style="transition-delay: 0.02s;">Bridge</span
								></a
							>
						{/if}
					</li>
				</ul>
			</nav>
			<div class="Header_header__userBar__3NCvG">
				<div class="UserBar_userBar__11QVa" />
				<div>
					<button type="button" class="ant-btn button-1 big Wallet_wallet__btn__2Ueik"
						><span class="s_text__2O9ZL s_body1__1kjhf s_weight-bold__7n-86 s_text_numbers__2nPsT"
							><img src="sYSL.svg" style="margin-left: 0px; margin-right: 12px;" />$0.00</span
						></button
					>
				</div>

				<div>
					<button
						type="button"
						class="ant-btn button-1 big Wallet_wallet__btn__2Ueik"
						on:click={enableBrowser}
						><span class="s_text__2O9ZL s_body1__1kjhf s_weight-bold__7n-86 s_text_numbers__2nPsT">
							{#if $connected}
								{#if $chainId == 137}
									<img
										src="https://app.sushi.com/_next/image?url=https%3A%2F%2Fraw.githubusercontent.com%2Fsushiswap%2Ficons%2Fmaster%2Fnetwork%2Fpolygon.jpg&w=48&q=75"
										style="margin-left: 0px; margin-right: 12px; border-radius: 50%;"
									/>
									{codeShort($selectedAccount)}
								{:else if $chainId == 56}
									<img
										src="https://app.sushi.com/_next/image?url=https%3A%2F%2Fraw.githubusercontent.com%2Fsushiswap%2Ficons%2Fmaster%2Fnetwork%2Fbsc.jpg&w=48&q=75"
										style="margin-left: 0px; margin-right: 12px; border-radius: 50%;"
									/>
									{codeShort($selectedAccount)}
								{:else if $chainId == 25}
									<img
										src="https://pbs.twimg.com/profile_images/1417359604623679488/CGzQIEVX_400x400.png"
										style="margin-left: 0px; margin-right: 12px; border-radius: 50%;"
									/>
									{codeShort($selectedAccount)}
								{:else}
									Connect Wallet
									{returnNada(wrongChain())}
								{/if}
							{:else}
								Connect Wallet
							{/if}
							<img src="metamask.53ea9825.svg" alt="icon" /></span
						></button
					>
				</div>
			</div>
		</div>
	</div>
</header>
