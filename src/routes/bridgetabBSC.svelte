<script>
	let number = 0;

	let pop = false;

	let chain =
		'https://app.sushi.com/_next/image?url=https%3A%2F%2Fraw.githubusercontent.com%2Fsushiswap%2Ficons%2Fmaster%2Fnetwork%2Fpolygon.jpg&w=48&q=75';
</script>

<svelte:head />
{#if pop == true}
	<div class="s-WUfmGYTMrIn5">
		<div
			class="Modal__StyledDialogOverlay-sc-170vgfd-0 hcFEix s-WUfmGYTMrIn5"
			data-reach-dialog-overlay=""
			style="opacity: 1;"
		>
			<div
				aria-modal="true"
				role="dialog"
				tabindex="-1"
				aria-label="dialog"
				class="Modal__StyledDialogContent-sc-170vgfd-1 bMrRke s-WUfmGYTMrIn5"
				data-reach-dialog-content=""
			>
				<div class="w-full p-px rounded bg-gradient-to-r from-blue to-pink s-WUfmGYTMrIn5">
					<div
						class="flex flex-col h-full w-full bg-dark-900 rounded p-6 overflow-y-auto s-WUfmGYTMrIn5"
					>
						<div
							class="flex flex-col justify-center CurrencySearch__ContentWrapper-sc-jxrk23-0 kvIdLZ s-WUfmGYTMrIn5"
						>
							<div class="flex items-center justify-between mb-4  s-WUfmGYTMrIn5">
								<h2 class="text-2xl font-medium font-bold s-WUfmGYTMrIn5">Select a chain</h2>
								<div
									class="flex items-center justify-center w-6 h-6 cursor-pointer text-primary hover:text-high-emphesis s-WUfmGYTMrIn5"
									style="color: white !important;"
									on:click={() => (pop = !pop)}
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
										aria-hidden="true"
										width="24"
										height="24"
										class="s-WUfmGYTMrIn5"
										><path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M6 18L18 6M6 6l12 12"
											class="s-WUfmGYTMrIn5"
										/></svg
									>
								</div>
							</div>
							<div class="mt-0 mb-3 sm:mt-3 sm:mb-8 s-WUfmGYTMrIn5" />

							<div class="flex-1 h-full s-WUfmGYTMrIn5" style="position: relative;">
								<div class="s-WUfmGYTMrIn5" style="overflow: visible; height: 0px;">
									<div
										class="s-WUfmGYTMrIn5"
										style="position: relative; height: 224px; width: 100%; overflow: auto; will-change: transform; direction: ltr;"
									>
										<div class="s-WUfmGYTMrIn5" style="height: 300px; width: 100%;">
											<div
												class="w-full flex p-0 Row__RowBetween-sc-18omu2-0 styleds__MenuItem-sc-spkdn1-7 gbRVNx dEysAX hover:bg-dark-800 rounded s-WUfmGYTMrIn5"
												id="token-item-ETHER"
												disabled=""
												style="position: absolute; left: 0px; top: 50px; height: 56px; width: 100%; justify-content: space-between;"
												on:click={() => (
													(chain =
														'https://app.sushi.com/_next/image?url=https%3A%2F%2Fraw.githubusercontent.com%2Fsushiswap%2Ficons%2Fmaster%2Fnetwork%2Fpolygon.jpg&w=48&q=75'),
													(pop = false)
												)}
											>
												<div class="flex items-center s-WUfmGYTMrIn5">
													<div class="rounded s-WUfmGYTMrIn5" style="width: 32px; height: 32px;">
														<div
															class="overflow-hidden rounded s-WUfmGYTMrIn5"
															style="width: 32px; height: 32px;"
														>
															<span
																class="s-WUfmGYTMrIn5"
																style="box-sizing: border-box; display: inline-block; overflow: hidden; width: 32px; height: 32px; background: none; opacity: 1; border: 0px; margin: 0px; padding: 0px; position: relative;"
																><img
																	alt="POLYGON"
																	src="https://app.sushi.com/_next/image?url=https%3A%2F%2Fraw.githubusercontent.com%2Fsushiswap%2Ficons%2Fmaster%2Fnetwork%2Fpolygon.jpg&w=48&q=75"
																	decoding="async"
																	data-nimg="fixed"
																	class="rounded s-WUfmGYTMrIn5"
																	style="position: absolute; inset: 0px; box-sizing: border-box; padding: 0px; border: none; margin: auto; display: block; width: 0px; height: 0px; min-width: 100%; max-width: 100%; min-height: 100%; max-height: 100%;"
																/></span
															>
														</div>
													</div>
												</div>
												<div class="flex flex-col justify-center s-WUfmGYTMrIn5">
													<div class="text-sm font-medium s-WUfmGYTMrIn5">POLYGON</div>
												</div>
												<span class="s-WUfmGYTMrIn5" />
												<div class="flex items-center justify-end s-WUfmGYTMrIn5" />
											</div>
											<div
												class="w-full flex p-0 Row__RowBetween-sc-18omu2-0 styleds__MenuItem-sc-spkdn1-7 gbRVNx dEysAX hover:bg-dark-800 rounded s-WUfmGYTMrIn5"
												id="token-item-ETHER"
												disabled=""
												style="position: absolute; left: 0px; top: 0px; height: 56px; width: 100%; justify-content: space-between;"
												on:click={() => (
													(chain =
														'https://pbs.twimg.com/profile_images/1417359604623679488/CGzQIEVX_400x400.png'),
													(pop = false)
												)}
											>
												<div class="flex items-center s-WUfmGYTMrIn5">
													<div class="rounded s-WUfmGYTMrIn5" style="width: 32px; height: 32px;">
														<div
															class="overflow-hidden rounded s-WUfmGYTMrIn5"
															style="width: 32px; height: 32px;"
														>
															<span
																class="s-WUfmGYTMrIn5"
																style="box-sizing: border-box; display: inline-block; overflow: hidden; width: 32px; height: 32px; background: none; opacity: 1; border: 0px; margin: 0px; padding: 0px; position: relative;"
																><img
																	alt="ETH"
																	src="https://pbs.twimg.com/profile_images/1417359604623679488/CGzQIEVX_400x400.png"
																	decoding="async"
																	data-nimg="fixed"
																	class="rounded s-WUfmGYTMrIn5"
																	style="position: absolute; inset: 0px; box-sizing: border-box; padding: 0px; border: none; margin: auto; display: block; width: 0px; height: 0px; min-width: 100%; max-width: 100%; min-height: 100%; max-height: 100%;"
																/></span
															>
														</div>
													</div>
												</div>
												<div class="flex flex-col justify-center s-WUfmGYTMrIn5">
													<div title="Ether" class="text-sm font-medium s-WUfmGYTMrIn5">CRONOS</div>
												</div>
												<span class="s-WUfmGYTMrIn5" />
												<div class="flex items-center justify-end s-WUfmGYTMrIn5" />
											</div>
										</div>
									</div>
								</div>
								<div class="resize-triggers s-WUfmGYTMrIn5">
									<div class="expand-trigger s-WUfmGYTMrIn5">
										<div class="s-WUfmGYTMrIn5" style=" height: 225px;" />
									</div>
									<div class="contract-trigger s-WUfmGYTMrIn5" />
								</div>
							</div>
							<div class="styleds__BottomGrouping-sc-zj8gmh-4 fpacZx s-WUfmGYTMrIn5">
								<button
									class="w-full text-high-emphesis bg-gradient-to-r from-blue to-pink opacity-80 hover:opacity-100 disabled:bg-opacity-80 px-6 py-4 text-base rounded disabled:cursor-not-allowed focus:outline-none s-WUfmGYTMrIn5"
									>select</button
								>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}
<div class="py-4 md:py-8 lg:py-12 max-w-2xl w-full" id="swap-page">
	<div class="relative w-full max-w-2xl">
		<div class="led top-1/4 -left-10 bg-blue bottom-4 w-3/5 rounded-full z-0 filter blur-[400px]" />
		<div
			class="led bottom-1/4 -right-10 bg-pink top-4 w-3/5 rounded-full z-0  filter blur-[400px]"
		/>
		<div class="relative filter drop-shadow">
			<div class="p-4 space-y-4 rounded bg-dark-900 z-1">
				<div class="flex justify-between mb-4 space-x-3 items-center">
					<div class="flex items-center" />
				</div>
				<div>
					<div id="swap-currency-input" class="p-5 rounded bg-dark-800">
						<div class="flex flex-col justify-between space-y-3 sm:space-y-0 sm:flex-row">
							<div class="w-full ">
								<div class="text-primary1  h-full outline-none select-none text-xl font-medium ">
									<div class="flex">
										<div class="flex items-center">
											<div class="rounded" style="width: 54px; height: 54px;">
												<div class="overflow-hidden rounded" style="width: 54px; height: 54px;">
													<div
														style="overflow: hidden; box-sizing: border-box; display: inline-block; position: relative; width: 54px; height: 54px;"
													>
														<img
															alt="ETH"
															src="./favicon.png"
															decoding="async"
															data-nimg="fixed"
															class="rounded"
															style="position: absolute; inset: 0px; box-sizing: border-box; padding: 0px; border: none; margin: auto; display: block; width: 0px; height: 0px; min-width: 100%; max-width: 100%; min-height: 100%; max-height: 100%; filter: none; background-size: cover; background-image: none; background-position: 0% 0%;"
														/>
														<noscript />
													</div>
												</div>
											</div>
										</div>
										<div class="flex flex-1 flex-col items-start justify-center mx-3.5">
											<div class="flex items-center">
												<div class="text-4xl font-bold token-symbol-container ">Noava Bridge</div>
											</div>
										</div>
									</div>
									<div class="grid py-3">
										<div
											class="w-full flex p-0 Row__AutoRow-sc-18omu2-2 jQYXTF"
											style="padding: 0px 1rem;"
										/>
									</div>

									<div class="flex flex-col justify-between space-y-3 sm:space-y-0 sm:flex-row">
										<div class="w-full ">
											<div
												class="text-primary1  h-full outline-none select-none text-xl font-medium "
											>
												<br />

												<div class="container">
													<div class="ant-row ">
														<div class="ant-col-4">
															<img
																value="bsc"
																width="40px"
																src="https://img.api.cryptorank.io/exchanges/binance%20futures1605113349439.png"
																style=" float: right; margin-right: 30px; margin-top: 5px;"
															/>
														</div>

														<div class="ant-col-19 ">
															<div
																class="flex items-center w-full space-x-3 rounded bg-dark-900 focus:bg-dark-700 p-3 "
															>
																<input
																	oninput="tokens()"
																	id="token-amount-input"
																	inputmode="decimal"
																	title="Token Amount"
																	autocomplete="off"
																	autocorrect="off"
																	type="text"
																	pattern="^[0-9]*[.,]?[0-9]*$"
																	placeholder="0.0"
																	min="0"
																	minlength="1"
																	maxlength="79"
																	spellcheck="false"
																	class="relative font-bold outline-none border-none flex-auto overflow-hidden overflow-ellipsis placeholder-low-emphesis focus:placeholder-primary w-0 p-0 text-2xl bg-transparent"
																	bind:value={number}
																/>
															</div>
														</div>
													</div>
												</div>

												<div style="margin-bottom: 5px; margin-top: 5px;">
													<div>
														<div class="p-3 rounded-full bg-dark-800 ">
															<div style="width: 32px; height: 32px;">
																<svg
																	xmlns="http://www.w3.org/2000/svg"
																	viewBox="0 0 500 500"
																	width="500"
																	height="500"
																	preserveAspectRatio="xMidYMid meet"
																	style="width: 100%; height: 100%; transform: translate3d(0px, 0px, 0px); margin-left:10px;"
																>
																	<defs>
																		<clipPath id="__lottie_element_248">
																			<rect width="500" height="500" x="0" y="0" />
																		</clipPath>
																		<clipPath id="__lottie_element_250">
																			<path d="M0,0 L500,0 L500,500 L0,500z" />
																		</clipPath>
																	</defs>
																	<g clip-path="url(#__lottie_element_248)">
																		<g
																			transform="matrix(4.5,0,0,4.5,207.25,194.875)"
																			opacity="1"
																			style="display: block;"
																		>
																			<g opacity="1" transform="matrix(1,0,0,1,0,0)">
																				<path
																					stroke-linecap="round"
																					stroke-linejoin="round"
																					fill-opacity="0"
																					stroke="rgb(226,226,226)"
																					stroke-opacity="1"
																					stroke-width="5.6000000000000005"
																					d=" M28.945999145507812,-27.937000274658203 C28.966999053955078,-9.605999946594238 29.014999389648438,33.75299835205078 29.034000396728516,50.236000061035156"
																				/>
																			</g>
																		</g>
																		<g
																			transform="matrix(3.1819803714752197,-3.1819803714752197,3.1819803714752197,3.1819803714752197,363.2012939453125,326.5682373046875)"
																			opacity="1"
																			style="display: block;"
																		>
																			<g opacity="1" transform="matrix(1,0,0,1,0,0)">
																				<path
																					stroke-linecap="round"
																					stroke-linejoin="round"
																					fill-opacity="0"
																					stroke="rgb(226,226,226)"
																					stroke-opacity="1"
																					stroke-width="5.6000000000000005"
																					d=" M-20.548999786376953,-4.929999828338623 C-20.548999786376953,-4.929999828338623 -20.548999786376953,12.746999740600586 -20.548999786376953,12.746999740600586 C-20.548999786376953,12.746999740600586 -2.927000045776367,12.746999740600586 -2.927000045776367,12.746999740600586"
																				/>
																			</g>
																		</g>

																		<g
																			clip-path="url(#__lottie_element_250)"
																			transform="matrix(1,0,0,1,0,0)"
																			opacity="1"
																			style="display: block;"
																		/>
																	</g>
																</svg>
															</div>
														</div>
													</div>
												</div>

												<div class="container">
													<div class="ant-row ">
														<div class="ant-col-4 ">
															<button
																class="z-10 -mt-6 -mb-6 "
																style="margin-bottom: 5px; margin-top: -2px;"
																on:click={() => (pop = !pop)}
															>
																<div class=" bg-dark-900 p-3px" style="border-radius:10%">
																	<div
																		class="p-3  bg-dark-800 hover:bg-dark-700"
																		style="border-radius:10%"
																	>
																		<div style="width: 32px; height: 32px;">
																			<img
																				src={chain}
																				width="45px"
																				style="float: right; margin-right: 0px; margin-top: 0px; cursor: pointer; border-radius:50%"
																			/>
																		</div>
																	</div>
																</div>
															</button>
														</div>

														<div class="ant-col-19 ">
															<div
																class="flex items-center w-full space-x-3 rounded bg-dark-900 focus:bg-dark-700 p-3 "
															>
																<input
																	id="token-amount-output"
																	inputmode="decimal"
																	title="Token Amount"
																	autocomplete="off"
																	autocorrect="off"
																	type="text"
																	pattern="^[0-9]*[.,]?[0-9]*$"
																	placeholder="0.0"
																	min="0"
																	minlength="1"
																	maxlength="79"
																	spellcheck="false"
																	class="relative font-bold outline-none border-none flex-auto overflow-hidden overflow-ellipsis placeholder-low-emphesis focus:placeholder-primary w-0 p-0 text-2xl bg-transparent"
																	value={number}
																/>
															</div>
														</div>
													</div>
												</div>
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>

					<div class="grid py-3">
						<div
							class="w-full flex p-0 Row__AutoRow-sc-18omu2-2 jQYXTF"
							style="padding: 0px 1rem;"
						/>
					</div>

					<div class="styleds__BottomGrouping-sc-zj8gmh-4 fpacZx">
						<button
							class="w-full text-high-emphesis bg-gradient-to-r from-blue to-pink opacity-80 hover:opacity-100 disabled:bg-opacity-80 px-6 py-4 text-base rounded disabled:cursor-not-allowed focus:outline-none"
						>
							Bridge
						</button>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	.led {
		position: absolute;
	}

	@media screen and (max-width: 640px) {
		.led {
			position: relative;
		}
	}
	.anticon {
		display: inline-block;
		color: inherit;
		font-style: normal;
		line-height: 0;
		text-align: center;
		text-transform: none;
		vertical-align: -0.125em;
		text-rendering: optimizeLegibility;
		-webkit-font-smoothing: antialiased;
		-moz-osx-font-smoothing: grayscale;
	}
	.anticon > * {
		line-height: 1;
	}
	.anticon svg {
		display: inline-block;
	}

	body,
	html {
		background-color: black;
	}

	.anticon::before {
		display: none;
	}
	.anticon .anticon-icon {
		display: block;
	}
	.progress1 {
		margin: 50px auto;
		padding: 2px;
		width: 100%;
		max-width: 500px;
		border-style: solid;
		border-width: 1px;
		border-image: linear-gradient(165deg, #05e8fc, #8883fa 50%, #fe0291) 1;
		height: 30px;
	}

	.progress1 .progress__bar1 {
		height: 100%;
		width: 0%;
		background: linear-gradient(165deg, #05e8fc, #8883fa 50%, #fe0291);
	}

	.anticon[tabindex] {
		cursor: pointer;
	}
	.anticon-spin::before,
	.anticon-spin {
		display: inline-block;
		-webkit-animation: loadingCircle 1s infinite linear;
		animation: loadingCircle 1s infinite linear;
	}
	@-webkit-keyframes loadingCircle {
		100% {
			-webkit-transform: rotate(360deg);
			transform: rotate(360deg);
		}
	}
	@keyframes loadingCircle {
		100% {
			-webkit-transform: rotate(360deg);
			transform: rotate(360deg);
		}
	}
</style>
