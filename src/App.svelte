<script>
  import Head from "./head.svelte";
  import { Row, Col } from "svelte-materialify";
  import Menu from "./menu.svelte";
  import Grid from "svelte-grid-responsive";
</script>

<main>
  <noscript>You need to enable JavaScript to run this app.</noscript>
  <div id="root">
    <div
      class="min-h-screen relative overflow-hidden"
      style="background-color: black;"
    >
      <div
        class="relative pt-6"
        style="background-image: url(&quot;https://wallpaper.dog/large/17026373.jpg&quot;); background-position: center -5rem; background-size: cover; background-repeat: no-repeat;"
      >
        <Menu />

        <Head />
        <div class="max-w-5xl mx-auto px-4 pt-16">
          <div class="grid grid-cols-2 lg:grid-cols-2 gap-6">
            <div
              class="bg-neutral-800 flex flex-col items-center px-6 sm:px-14 py-8 rounded-md text-center"
            >
              <div class="text-4xl font-semibold text-white">$4.68b</div>
              <div class="text-sm" style="color: rgb(127, 127, 127);">
                Total Liquidity
              </div>
            </div>
            <div
              class="bg-neutral-800 flex flex-col items-center px-6 sm:px-14 py-8 rounded-md text-center"
            >
              <div class="text-4xl font-semibold text-white">$140.26b</div>
              <div class="text-sm" style="color: rgb(127, 127, 127);">
                Total Volume
              </div>
            </div>
          </div>
        </div>
        <div class="2xl:max-w-7xl mx-auto px-10 pt-8">
          <div>
            <div class="ticker" style="position: relative; overflow: hidden;">
              <div
                class="ticker__element"
                style="will-change: transform; position: absolute; left: 0px; top: 0px; transform: translate3d(0px, 0px, 0px);"
              >
                <div
                  class="flex flex-row space-x-6 mx-auto overflow-x-scroll no-scrollbar"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="max-w-3xl mx-auto px-4 pt-10 sm:pt-28 pb-4">
        <div
          class="text-2xl sm:text-4xl font-semibold text-white text-center"
          style="max-width: 902px;"
        />
      </div>

      <div class="max-w-2xl mx-auto px-4 pt-10 sm:pt-28">
        <div
          class="text-2xl sm:text-4xl font-semibold text-white text-center"
          style="max-width: 902px;"
        >
          An evolving community for an evolving DeFi landscape.
        </div>
      </div>
      <div class="2xl:max-w-screen-2xl mx-auto pt-10">
        <div
          class="flex flex-row space-x-6 items-center mx-auto px-10 py-8 overflow-x-scroll no-scrollbar"
          style="justify-content: center;"
        >
          <div class="flex flex-row space-x-6 ml-0 sm:ml-20">
            <div
              class="flow-root bg-neutral-800 rounded-lg px-8 py-8"
              style="width: 281px; height: 255px;"
            >
              <div class="mx-auto text-center">
                <img
                  class="text-center mx-auto"
                  src="https://raw.githubusercontent.com/sushiswap/sushi-content/master/icons/wallet.png"
                  alt=""
                  style="width: 111px; height: 111px;"
                />
                <h3
                  class="mt-2 text-4xl font-semibold text-white tracking-tight"
                >
                  20+
                </h3>
                <p class="mt-2 text-base text-gray-500">Wallets Supported</p>
              </div>
            </div>
          </div>
          <div class="flex flex-row space-x-6 undefined">
            <div
              class="flow-root bg-neutral-800 rounded-lg px-8 py-8"
              style="width: 281px; height: 255px;"
            >
              <div class="mx-auto text-center">
                <img
                  class="text-center mx-auto"
                  src="https://raw.githubusercontent.com/sushiswap/sushi-content/master/icons/intersection.png"
                  alt=""
                  style="width: 111px; height: 111px;"
                />
                <h3
                  class="mt-2 text-4xl font-semibold text-white tracking-tight"
                >
                  3
                </h3>
                <p class="mt-2 text-base text-gray-500">Chains Supported</p>
              </div>
            </div>
          </div>
          <div class="flex flex-row space-x-6 undefined">
            <div
              class="flow-root bg-neutral-800 rounded-lg px-8 py-8"
              style="width: 281px; height: 255px;"
            >
              <div class="mx-auto text-center">
                <img
                  class="text-center mx-auto"
                  src="https://raw.githubusercontent.com/sushiswap/sushi-content/master/icons/group.png"
                  alt=""
                  style="width: 111px; height: 111px;"
                />
                <h3
                  class="mt-2 text-4xl font-semibold text-white tracking-tight"
                >
                  0
                </h3>
                <p class="mt-2 text-base text-gray-500">Holders</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="max-w-3xl mx-auto px-4 pt-10 sm:pt-28 pb-4">
        <div
          class="text-2xl sm:text-4xl font-semibold text-white text-center"
          style="max-width: 902px;"
        />
      </div>

      <div class="sfondo" style="margin-bottom: 50px">
        <Grid container gutter={12} style="">
          <Grid class="texto" xs={12} md={6} lg={6}>
            <div class="content">
              <h2><b>Capital Efficiency Maximized at All times</b></h2>
              <p>
                A significant portion of Uniswap V3's liquidity is inactive most
                of the time and hence not productive, causing yields to suffer.
              </p>
              <p>
                Lixir ensures that your liquidity stays highly concentrated
                through a data-backed, algorithmic strategy that will improve
                over time.
              </p>
              <p>Leave your screen, leave it to Lixir.</p>
            </div>
          </Grid>
          <Grid xs={12} md={6} lg={6}>
            <div
              style="display:inline-block;max-width:100%;overflow:hidden;position:relative;box-sizing:border-box;margin:0"
            >
              <div style="box-sizing:border-box;display:block;max-width:100%">
                <img
                  style="max-width:100%;display:block;margin:0;border:none;padding:0"
                  alt=""
                  aria-hidden="true"
                  src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB2ZXJzaW9uPSIxLjEiLz4="
                />
              </div>
              <img
                alt=""
                src="https://res.cloudinary.com/lixfinance/image/upload/f_auto,c_limit,w_1200,q_auto/v1633651075/website/capital-efficiency_tunnql.svg"
                decoding="async"
                data-nimg="intrinsic"
                style="position:absolute;top:0;left:0;bottom:0;right:0;box-sizing:border-box;padding:0;border:none;margin:auto;display:block;width:0;height:0;min-width:100%;max-width:100%;min-height:100%;max-height:100%"
                srcset="https://res.cloudinary.com/lixfinance/image/upload/f_auto,c_limit,w_640,q_auto/v1633651075/website/capital-efficiency_tunnql.svg 1x, https://res.cloudinary.com/lixfinance/image/upload/f_auto,c_limit,w_1200,q_auto/v1633651075/website/capital-efficiency_tunnql.svg 2x"
              /><noscript
                ><img
                  alt=""
                  srcSet="https://res.cloudinary.com/lixfinance/image/upload/f_auto,c_limit,w_640,q_auto/v1633651075/website/capital-efficiency_tunnql.svg 1x, https://res.cloudinary.com/lixfinance/image/upload/f_auto,c_limit,w_1200,q_auto/v1633651075/website/capital-efficiency_tunnql.svg 2x"
                  src="https://res.cloudinary.com/lixfinance/image/upload/f_auto,c_limit,w_1200,q_auto/v1633651075/website/capital-efficiency_tunnql.svg"
                  decoding="async"
                  data-nimg="intrinsic"
                  style="position:absolute;top:0;left:0;bottom:0;right:0;box-sizing:border-box;padding:0;border:none;margin:auto;display:block;width:0;height:0;min-width:100%;max-width:100%;min-height:100%;max-height:100%"
                  loading="lazy"
                /></noscript
              >
            </div>
          </Grid>
        </Grid>
      </div>

      <footer class="bg-neutral-900 py-2 px-2 sm:px-8 sm:py-4">
        <div
          class="max-w-screen-lg mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8"
        >
          <h2 class="sr-only">Footer</h2>
          <div class="w-full">
            <div class="grid sm:grid-cols-2 md:grid-cols-5 gap-10">
              <div
                class="pt-2 sm:pt-4 col-span-2 sm:col-span-1 md:col-span-2 sm:pr-16"
              >
                <div class="flex items-center">
                  <a style="text-decoration: none;" aria-label="Home" href="/"
                    ><img
                      class="h-8 w-auto sm:h-10"
                      src="logo.png"
                      alt="Logo"
                    /></a
                  ><a
                    style="text-decoration: none;"
                    class="text-xl font-bold leading-6 text-white sm:truncate ml-2"
                    href="/">Noava</a
                  >
                </div>

                <div class="flex space-x-6 md:order-2 ml-2 mt-4 ">
                  <a
                    href="https://sushichef.medium.com/"
                    class="text-gray-400 hover:text-gray-300"
                    ><span class="sr-only">Medium</span><svg
                      class="h-6 w-6"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="currentColor"
                      clip-rule="evenodd"
                      ><path
                        d="M2.846 6.887c.03-.295-.083-.586-.303-.784l-2.24-2.7v-.403h6.958l5.378 11.795 4.728-11.795h6.633v.403l-1.916 1.837c-.165.126-.247.333-.213.538v13.498c-.034.204.048.411.213.537l1.871 1.837v.403h-9.412v-.403l1.939-1.882c.19-.19.19-.246.19-.537v-10.91l-5.389 13.688h-.728l-6.275-13.688v9.174c-.052.385.076.774.347 1.052l2.521 3.058v.404h-7.148v-.404l2.521-3.058c.27-.279.39-.67.325-1.052v-10.608z"
                      /></svg
                    ></a
                  ><a
                    href="https://twitter.com/sushiswap"
                    class="text-gray-400 hover:text-gray-300"
                    ><span class="sr-only">Twitter</span><svg
                      class="h-6 w-6"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                      ><path
                        d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"
                      /></svg
                    ></a
                  ><a
                    href="https://github.com/sushiswap"
                    class="text-gray-400 hover:text-gray-300"
                    ><span class="sr-only">GitHub</span><svg
                      class="h-6 w-6"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                      ><path
                        fill-rule="evenodd"
                        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                        clip-rule="evenodd"
                      /></svg
                    ></a
                  >
                  <a
                    href="https://github.com/sushiswap"
                    class="text-gray-400 hover:text-gray-300"
                    ><span class="sr-only">Telegram</span>
                    <svg
                      class="h-6 w-6"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                      ><path
                        fill-rule="evenodd"
                        d="m12 24c6.629 0 12-5.371 12-12s-5.371-12-12-12-12 5.371-12 12 5.371 12 12 12zm-6.509-12.26 11.57-4.461c.537-.194 1.006.131.832.943l.001-.001-1.97 9.281c-.146.658-.537.818-1.084.508l-3-2.211-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.121l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953z"
                        clip-rule="evenodd"
                      /></svg
                    ></a
                  >
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  </div>
</main>

<style>
  .texto {
    display: flex;
    justify-content: center;
    align-items: center;
    position: relative;
  }

  .content {
    text-align: center;
    color: white;
    position: absolute;
    top: 50%;
    transform: translate(0, -50%);
  }

  @media only screen and (max-width: 600px) {
    .content {
      text-align: center;
      color: white;
      position: static;
      top: 50%;
      transform: none;
    }
  }

  .sfondo {
    background-image: url("https://res.cloudinary.com/lixfinance/image/upload/f_auto,c_limit,w_3840,q_auto/v1633651070/website/capital-efficiency-bg_scqklg.jpg");
    background-repeat: no-repeat;
    background-size: cover;
  }
</style>
