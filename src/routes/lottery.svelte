<script>
import { tweened } from 'svelte/motion';
let seven= 120000

    var expected = new Date("2021-11-19 16:25:00").getTime();
    var now = new Date().getTime();
    let distance = tweened(expected-now);

    setInterval(()=> {
        if ($distance > 0){
            $distance-=1000;
        }
    },1000)
  $: days = Math.floor($distance / (1000 * 60 * 60 * 24));
  $: hours = Math.floor(($distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  $: minutes = Math.floor(($distance % (1000 * 60 * 60)) / (1000 * 60));
  $: seconds = Math.floor(($distance % (1000 * 60)) / 1000);
  
</script>

<!-- <svelte:head>
    <link rel="stylesheet" href="css1.css">
    <link rel="stylesheet" href="css2.css">
    
    <link rel="stylesheet" href="css3.css">
</svelte:head> -->


<main>
    <div class="desktop-content-wrapper flex justify-between w-full mx-auto pt-8">
       <div class="fixed" style="top: 138px; height: calc(100% - 138px);"></div>
       <div class="flex flex-col flex-1">
          <div class="grid-content p-4 sm:pt-0 sm:px-8 lg:pt-0 lg:px-10 text-inverse max-w-5xl lg:max-w-6xl w-full mx-auto lg:ml-auto">
             <div id="content-animation-wrapper" class="mx-auto w-full" style="opacity: 1;">
                <div style="opacity: 1; transform: none;">
                   <div class="flex flex-col sm:flex-row justify-between sm:items-center mb-4 sm:mb-10">
                      <div class="flex justify-between items-center sm:w-9/12 lg:w-7/12">
                         <div class="flex justify-start items-center">
                            <img src="data:image/png;base64,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" class="inline-block rounded-full w-12 h-12 sm:w-16 sm:h-16 lg:w-18 lg:h-18 mr-2" alt="token icon">
                            <div class="ml-1 sm:ml-6">
                               <div class="flex flex-col items-start justify-between leading-none w-full">
                                  <div class="inline-flex items-center text-left text-xl sm:text-3xl font-bold text-accent-2 relative">
                                     USDC Pool
                                  
                                  </div>
                                 
                               </div>
                            </div>
                         </div>
                      </div>
                   </div>
                   <div class="custom-prize-box-padding pink-purple-gradient rounded-lg px-4 xs:px-6 sm:px-16 py-8 sm:pt-12 sm:pb-10 text-white my-4 mx-auto" style="min-height: 150px;">
                      <div class="flex flex-col xs:flex-row xs:items-center justify-between">
                         <div class="w-1/2 sm:w-7/12">
                            <h6 class="font-normal text-inverse opacity-60">Premio #43</h6>
                            <h1 class="text-5xl xs:text-4xl sm:text-6xl lg:text-7xl -mt-3 xs:mt-0 sm:-mt-3 flex">$<span>50,247 </span></h1>
                         </div>
                         <div class="flex flex-col justify-center pt-4 xs:pt-2 sm:pt-0 countdown-wrapper">
                            <h6 class="relative font-normal mb-1 xs:mb-2 sm:-mt-3 opacity-60 text-inverse">Verrà aggiudicato</h6>
                            <div class="flex text-center text-sm xs:text-xs sm:text-base">
                               <div class="flex flex-col sm:mr-2" style="padding-left: 2px; padding-right: 2px;">
                                  <div class="flex"><span class="bg-tertiary text-green font-bold rounded-sm" style="padding: 2px 8px; margin: 0px 1px;">{days}</span></div>
                                  <div class="opacity-60 text-inverse text-xxxs" style="padding-top: 3px;">DAYS</div>
                               </div>
                               <div class="flex flex-col" style="padding-left: 2px; padding-right: 2px;">
                                  <div class="flex"><span class="bg-tertiary text-green font-bold rounded-sm" style="padding: 2px 8px; margin: 0px 1px;">{hours}</span></div>
                                  <div class="opacity-60 text-inverse text-xxxs" style="padding-top: 3px;">H</div>
                               </div>
                               <div class="px-0 sm:px-1 font-bold text-green">:</div>
                               <div class="flex flex-col" style="padding-left: 1px; padding-right: 2px;">
                                  <div class="flex"><span class="bg-tertiary text-green font-bold rounded-sm" style="padding: 2px 8px; margin: 0px 1px;">{minutes}</span></div>
                                  <div class="opacity-60 text-inverse text-xxxs" style="padding-top: 3px;">M</div>
                               </div>
                               <div class="px-0 sm:px-1 font-bold text-green">:</div>
                               <div class="flex flex-col" style="padding-left: 1px; padding-right: 2px;">
                                  <div class="flex"><span class="bg-tertiary text-green font-bold rounded-sm" style="padding: 2px 8px; margin: 0px 1px;">{seconds}</span></div>
                                  <div class="opacity-60 text-inverse text-xxxs" style="padding-top: 3px;">S</div>
                               </div>
                            </div>
                         </div>
                      </div>
                   </div>
                   <div class="non-interactable-card bg-card rounded-lg my-4 py-4 xs:py-6 px-4 xs:px-6 sm:px-10">
                      <h3 class="text-center">USDC Premio #43</h3>
                      <p class="mx-auto text-accent-1 text-center">Premio condiviso tra 5 vincitori.</p>
                      <div class="flex flex-row">
                         <div class="hidden sm:block sm:w-2/12">&nbsp;</div>
                         <div class="flex flex-col items-center justify-center text-center w-full h-56 xs:h-64 xs:w-5/12">
                            <img alt="token" src="https://app.pooltogether.com/_next/static/images/prize-illustration-new@2x-d8db8bf9ce4d0f63011f8fcdeb0cb78a.png" class="w-40 mx-auto">
                            <div>
                               <h4 class="text-xl xs:text-2xl sm:text-3xl lg:text-4xl">$24,002</h4>
                            </div>
                         </div>
                         <div class="w-full xs:w-2/12 text-center my-auto text-5xl font-bold leading-none"> + </div>
                         <div class="flex flex-col items-center justify-center text-center w-full xs:w-5/12 h-56 xs:h-64">
                            <img alt="bnb "src="https://app.pooltogether.com/_next/static/images/lootbox-closed-halo@2x-4b9c9d0d43b339def5ce972068dbc825.png" class="w-40 mx-auto -mt-8">
                            <div class="relative" style="top: 3px;">
                               <h4 class="text-xl xs:text-2xl sm:text-3xl lg:text-4xl">$26,244</h4>
                            </div>
                         </div>
                         <div class="hidden sm:block sm:w-2/12">&nbsp;</div>
                      </div>
                      <ul class="text-inverse rounded-lg p-0 xs:py-4 mt-4 flex flex-col text-xs xs:text-base sm:text-lg">
                         <li class="flex justify-between mb-2"><span class="text-accent-1">Primo premio</span><span class="flex flex-col xs:flex-row text-right xs:text-left"><span>$<span>10,049 </span></span></span></li>
                         <li class="flex justify-between mb-2 last:mb-0 "><span class="text-accent-1">Altri classificati</span><span>$<span>10,049 </span></span></li>
                         <li class="flex justify-between mb-2 last:mb-0 "><span class="text-accent-1">Altri classificati</span><span>$<span>10,049 </span></span></li>
                         <li class="flex justify-between mb-2 last:mb-0 "><span class="text-accent-1">Altri classificati</span><span>$<span>10,049 </span></span></li>
                         <li class="flex justify-between mb-2 last:mb-0 "><span class="text-accent-1">Altri classificati</span><span>$<span>10,049 </span></span></li>
                      </ul>
                   </div>
                   <div class="non-interactable-card bg-card rounded-lg my-4 py-4 xs:py-6 px-4 xs:px-6 sm:px-10">
                      <div class="text-accent-2 opacity-90 font-headline uppercase xs:text-sm">Loot Box</div>
                      <div class="flex flex-col sm:flex-row justify-between sm:items-center mb-4">
                         <div class="flex">
                            <h3>$<span>26,244<span class="opacity-40">.32</span><span class="opacity-40"></span> </span></h3>
                            <span data-tip="true" data-for="lootbox-extra-info-tooltip-tooltip" class="inline cursor-pointer ml-2 my-auto text-inverse hover:opacity-70" currentitem="false">
                               <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-info w-4 h-4">
                                  <g>
                                     <circle cx="12" cy="12" r="10"></circle>
                                     <line x1="12" y1="16" x2="12" y2="12"></line>
                                     <line x1="12" y1="8" x2="12" y2="8"></line>
                                  </g>
                               </svg>
                            </span>
                            <div class="__react_component_tooltip t463fe51a-56d0-4911-8644-a313fd29aae3 place-top type-dark allow_click" id="lootbox-extra-info-tooltip-tooltip" data-id="tooltip">
                               <style aria-hidden="true">
                                  .t463fe51a-56d0-4911-8644-a313fd29aae3 {
                                  color: #fff;
                                  background: #222;
                                  border: 1px solid transparent;
                                  }
                                  .t463fe51a-56d0-4911-8644-a313fd29aae3.place-top {
                                  margin-top: -10px;
                                  }
                                  .t463fe51a-56d0-4911-8644-a313fd29aae3.place-top::before {
                                  border-top: 8px solid transparent;
                                  }
                                  .t463fe51a-56d0-4911-8644-a313fd29aae3.place-top::after {
                                  border-left: 8px solid transparent;
                                  border-right: 8px solid transparent;
                                  bottom: -6px;
                                  left: 50%;
                                  margin-left: -8px;
                                  border-top-color: #222;
                                  border-top-style: solid;
                                  border-top-width: 6px;
                                  }
                                  .t463fe51a-56d0-4911-8644-a313fd29aae3.place-bottom {
                                  margin-top: 10px;
                                  }
                                  .t463fe51a-56d0-4911-8644-a313fd29aae3.place-bottom::before {
                                  border-bottom: 8px solid transparent;
                                  }
                                  .t463fe51a-56d0-4911-8644-a313fd29aae3.place-bottom::after {
                                  border-left: 8px solid transparent;
                                  border-right: 8px solid transparent;
                                  top: -6px;
                                  left: 50%;
                                  margin-left: -8px;
                                  border-bottom-color: #222;
                                  border-bottom-style: solid;
                                  border-bottom-width: 6px;
                                  }
                                  .t463fe51a-56d0-4911-8644-a313fd29aae3.place-left {
                                  margin-left: -10px;
                                  }
                                  .t463fe51a-56d0-4911-8644-a313fd29aae3.place-left::before {
                                  border-left: 8px solid transparent;
                                  }
                                  .t463fe51a-56d0-4911-8644-a313fd29aae3.place-left::after {
                                  border-top: 5px solid transparent;
                                  border-bottom: 5px solid transparent;
                                  right: -6px;
                                  top: 50%;
                                  margin-top: -4px;
                                  border-left-color: #222;
                                  border-left-style: solid;
                                  border-left-width: 6px;
                                  }
                                  .t463fe51a-56d0-4911-8644-a313fd29aae3.place-right {
                                  margin-left: 10px;
                                  }
                                  .t463fe51a-56d0-4911-8644-a313fd29aae3.place-right::before {
                                  border-right: 8px solid transparent;
                                  }
                                  .t463fe51a-56d0-4911-8644-a313fd29aae3.place-right::after {
                                  border-top: 5px solid transparent;
                                  border-bottom: 5px solid transparent;
                                  left: -6px;
                                  top: 50%;
                                  margin-top: -4px;
                                  border-right-color: #222;
                                  border-right-style: solid;
                                  border-right-width: 6px;
                                  }
                               </style>
                               <button class="ml-auto mb-2 block xs:hidden">
                                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-x w-4 h-4 text-inverse">
                                     <g>
                                        <line x1="18" y1="6" x2="6" y2="18"></line>
                                        <line x1="6" y1="6" x2="18" y2="18"></line>
                                     </g>
                                  </svg>
                               </button>
                               Il valore del loot box è stimato sul tasso d'interesse attuale della fonte d'interessi a qualsiasi token aggiunto (es. COMP)
                            </div>
                         </div>
                         <div>
                            <button aria-haspopup="true" aria-controls="menu--41" class="mt-2 xs:mt-0 text-xs inline-flex items-center justify-center trans font-bold text-accent-1 hover:undefined" id="menu-button--menu--41" type="button" data-reach-menu-button="">
                               Contribuisci al Loot Box 
                               <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="0.15rem" stroke-linecap="round" stroke-linejoin="round" class="feather feather-chevron-down relative w-4 h-4 inline-block ml-2">
                                  <g>
                                     <polyline points="6 9 12 15 18 9"></polyline>
                                  </g>
                               </svg>
                            </button>
                         </div>
                      </div>
                      <ul class="text-inverse rounded-lg p-0 xs:py-4 mt-4 flex flex-col text-xs xs:text-base sm:text-lg">
                         <h6 class="text-green mb-4">1 Tokens</h6>
                         <li class="w-full flex text-xxs sm:text-base mb-2 last:mb-0">
                            <span class="flex w-1/3 text-left">
                               <a href="https://etherscan.io/address/0xc00e94cb662c3520282e6f5717214004a7f26888" class="trans hover:text-highlight-1 truncate text-accent-1 flex items-center inline-flex" target="_blank" rel="noopener noreferrer" title="View on Block Explorer">
                                  <img src="data:image/svg+xml,%3Csvg%20width%3D%2296%22%20height%3D%2296%22%20viewBox%3D%220%200%2096%2096%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20clip-path%3D%22url%28%23clip0%29%22%3E%3Cg%20filter%3D%22url%28%23filter0_i%29%22%3E%3Cpath%20d%3D%22M48.0743%2095.2518C74.1504%2095.2518%2095.2892%2074.113%2095.2892%2048.0369C95.2892%2021.9609%2074.1504%200.822021%2048.0743%200.822021C21.9982%200.822021%200.859375%2021.9609%200.859375%2048.0369C0.859375%2074.113%2021.9982%2095.2518%2048.0743%2095.2518Z%22%20fill%3D%22%2300D395%22%2F%3E%3C%2Fg%3E%3Cpath%20d%3D%22M48.0745%2091.7325C72.2069%2091.7325%2091.7701%2072.1693%2091.7701%2048.0369C91.7701%2023.9045%2072.2069%204.34131%2048.0745%204.34131C23.9421%204.34131%204.37891%2023.9045%204.37891%2048.0369C4.37891%2072.1693%2023.9421%2091.7325%2048.0745%2091.7325Z%22%20fill%3D%22url%28%23paint0_linear%29%22%2F%3E%3Cpath%20fill-rule%3D%22evenodd%22%20clip-rule%3D%22evenodd%22%20d%3D%22M28.1549%2063.8801C26.7427%2063.0164%2025.8789%2061.4781%2025.8789%2059.8262V50.6025C25.8789%2050.2495%2025.9735%2049.909%2026.15%2049.6064C26.6985%2048.6607%2027.9153%2048.3391%2028.8611%2048.894L49.6794%2061.0304C50.8962%2061.7429%2051.6465%2063.0416%2051.6465%2064.4539V74.0117C51.6465%2074.4467%2051.5267%2074.8818%2051.2997%2075.2537C50.6125%2076.376%2049.1498%2076.729%2048.0275%2076.0418L28.1549%2063.8801ZM59.187%2046.3658C60.4038%2047.0782%2061.1541%2048.377%2061.1541%2049.7892V69.1824C61.1541%2069.7561%2060.8451%2070.2857%2060.3471%2070.5631L55.7887%2073.1291C55.732%2073.1606%2055.6689%2073.1858%2055.6059%2073.2047V62.4364C55.6059%2061.043%2054.8745%2059.7506%2053.6766%2059.0318L35.3928%2048.0933V35.9379C35.3928%2035.5848%2035.4874%2035.2444%2035.6639%2034.9417C36.2124%2033.996%2037.4292%2033.6745%2038.375%2034.2293L59.187%2046.3658ZM68.2974%2032.0416C69.5205%2032.7477%2070.2708%2034.0591%2070.2708%2035.4713V63.7982C70.2708%2064.3782%2069.9492%2064.9141%2069.4385%2065.1915L65.1198%2067.5242V47.8032C65.1198%2046.4099%2064.3884%2045.1238%2063.1968%2044.405L44.5095%2033.1953V21.6641C44.5095%2021.3111%2044.6041%2020.9706%2044.7743%2020.668C45.3228%2019.7223%2046.5396%2019.4007%2047.4853%2019.9493L68.2974%2032.0416Z%22%20fill%3D%22%23F9FAFB%22%2F%3E%3Cpath%20d%3D%22M48.0371%2096C74.5263%2096%2096%2074.5263%2096%2048.0371C96%2021.5479%2074.5263%200.0742188%2048.0371%200.0742188C21.5479%200.0742188%200.0742188%2021.5479%200.0742188%2048.0371C0.0742188%2074.5263%2021.5479%2096%2048.0371%2096Z%22%20fill%3D%22%23070A0E%22%2F%3E%3Cpath%20fill-rule%3D%22evenodd%22%20clip-rule%3D%22evenodd%22%20d%3D%22M27.8013%2064.1309C26.3667%2063.2534%2025.4893%2061.6907%2025.4893%2060.0127V50.6429C25.4893%2050.2842%2025.5853%2049.9384%2025.7647%2049.631C26.3219%2048.6703%2027.558%2048.3437%2028.5187%2048.9073L49.6668%2061.236C50.9029%2061.9597%2051.665%2063.2791%2051.665%2064.7137V74.4229C51.665%2074.8649%2051.5434%2075.3068%2051.3128%2075.6846C50.6147%2076.8246%2049.1288%2077.1833%2047.9888%2076.4852L27.8013%2064.1309ZM59.325%2046.339C60.5611%2047.0628%2061.3233%2048.3821%2061.3233%2049.8167V69.5171C61.3233%2070.0999%2061.0094%2070.6379%2060.5035%2070.9197L55.8729%2073.5263C55.8153%2073.5583%2055.7512%2073.584%2055.6872%2073.6032V62.6642C55.6872%2061.2488%2054.9442%2059.9359%2053.7273%2059.2058L35.1539%2048.0939V35.7459C35.1539%2035.3873%2035.2499%2035.0414%2035.4293%2034.734C35.9865%2033.7733%2037.2226%2033.4467%2038.1833%2034.0103L59.325%2046.339ZM68.5797%2031.7879C69.8222%2032.5052%2070.5844%2033.8374%2070.5844%2035.272V64.0476C70.5844%2064.6368%2070.2577%2065.1812%2069.739%2065.463L65.3518%2067.8327V47.7993C65.3518%2046.3839%2064.6088%2045.0774%2063.3984%2044.3472L44.415%2032.96V21.2461C44.415%2020.8874%2044.5111%2020.5416%2044.684%2020.2341C45.2412%2019.2735%2046.4773%2018.9468%2047.438%2019.504L68.5797%2031.7879Z%22%20fill%3D%22%2300D395%22%2F%3E%3C%2Fg%3E%3Cdefs%3E%3Cfilter%20id%3D%22filter0_i%22%20x%3D%220.859375%22%20y%3D%220.592313%22%20width%3D%2294.4298%22%20height%3D%2294.6595%22%20filterUnits%3D%22userSpaceOnUse%22%20color-interpolation-filters%3D%22sRGB%22%3E%3CfeFlood%20flood-opacity%3D%220%22%20result%3D%22BackgroundImageFix%22%2F%3E%3CfeBlend%20mode%3D%22normal%22%20in%3D%22SourceGraphic%22%20in2%3D%22BackgroundImageFix%22%20result%3D%22shape%22%2F%3E%3CfeColorMatrix%20in%3D%22SourceAlpha%22%20type%3D%22matrix%22%20values%3D%220%200%200%200%200%200%200%200%200%200%200%200%200%200%200%200%200%200%20127%200%22%20result%3D%22hardAlpha%22%2F%3E%3CfeOffset%20dy%3D%22-0.689125%22%2F%3E%3CfeGaussianBlur%20stdDeviation%3D%220.114854%22%2F%3E%3CfeComposite%20in2%3D%22hardAlpha%22%20operator%3D%22arithmetic%22%20k2%3D%22-1%22%20k3%3D%221%22%2F%3E%3CfeColorMatrix%20type%3D%22matrix%22%20values%3D%220%200%200%200%200.0699479%200%200%200%200%200.9875%200%200%200%200%200.717887%200%200%200%201%200%22%2F%3E%3CfeBlend%20mode%3D%22normal%22%20in2%3D%22shape%22%20result%3D%22effect1_innerShadow%22%2F%3E%3C%2Ffilter%3E%3ClinearGradient%20id%3D%22paint0_linear%22%20x1%3D%2248.0745%22%20y1%3D%224.34131%22%20x2%3D%2248.0745%22%20y2%3D%2291.7325%22%20gradientUnits%3D%22userSpaceOnUse%22%3E%3Cstop%20stop-color%3D%22%23141E27%22%2F%3E%3Cstop%20offset%3D%221%22%20stop-color%3D%22%23141E27%22%2F%3E%3C%2FlinearGradient%3E%3CclipPath%20id%3D%22clip0%22%3E%3Crect%20width%3D%2296%22%20height%3D%2296%22%20fill%3D%22white%22%2F%3E%3C%2FclipPath%3E%3C%2Fdefs%3E%3C%2Fsvg%3E" class="inline-block rounded-full mr-2 w-5 h-5" alt="token icon"> Compound 
                                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-arrow-up-right w-4 h-4 ml-1 my-auto inline-block w-4 h-4">
                                     <g>
                                        <line x1="7" y1="17" x2="17" y2="7"></line>
                                        <polyline points="7 7 17 7 17 17"></polyline>
                                     </g>
                                  </svg>
                               </a>
                            </span>
                            <span class="w-1/3 sm:pl-6 text-right text-accent-1 truncate"><span>36<span class="opacity-40">.12</span><span class="opacity-40"></span> </span> COMP</span><span class="w-1/3 text-right"><span>$<span>12,577<span class="opacity-40">.37</span><span class="opacity-40"></span> </span></span></span>
                         </li>
                      </ul>
                   </div>
                   
                   
                   
                   
                </div>
             </div>
          </div>
            </div>
    </div>
 </main>

<style data-react-tooltip="true">
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

    body, html{
       background-color: black;
    }
    .anticon svg {
    display: inline-block;
    }
    .anticon::before {
    display: none;
    }
    .anticon .anticon-icon {
    display: block;
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
.__react_component_tooltip {
border-radius: 3px;
display: inline-block;
font-size: 13px;
left: -999em;
opacity: 0;
padding: 8px 21px;
position: fixed;
pointer-events: none;
transition: opacity 0.3s ease-out;
top: -999em;
visibility: hidden;
z-index: 999;
}
.__react_component_tooltip.allow_hover, .__react_component_tooltip.allow_click {
pointer-events: auto;
}
.__react_component_tooltip::before, .__react_component_tooltip::after {
content: "";
width: 0;
height: 0;
position: absolute;
}
.__react_component_tooltip.show {
opacity: 0.9;
margin-top: 0;
margin-left: 0;
visibility: visible;
}
.__react_component_tooltip.place-top::before {
border-left: 10px solid transparent;
border-right: 10px solid transparent;
bottom: -8px;
left: 50%;
margin-left: -10px;
}
.__react_component_tooltip.place-bottom::before {
border-left: 10px solid transparent;
border-right: 10px solid transparent;
top: -8px;
left: 50%;
margin-left: -10px;
}
.__react_component_tooltip.place-left::before {
border-top: 6px solid transparent;
border-bottom: 6px solid transparent;
right: -8px;
top: 50%;
margin-top: -5px;
}
.__react_component_tooltip.place-right::before {
border-top: 6px solid transparent;
border-bottom: 6px solid transparent;
left: -8px;
top: 50%;
margin-top: -5px;
}
.__react_component_tooltip .multi-line {
display: block;
padding: 2px 0;
text-align: center;
} p.svelte-w9ftfy.svelte-w9ftfy{font-size:0.889em;margin:1.6em 0 0 0;font-family:inherit}div.svelte-w9ftfy.svelte-w9ftfy{display:flex;font-size:inherit;font-family:inherit;justify-content:space-between}div.svelte-w9ftfy span.svelte-w9ftfy{color:#4a90e2;font-size:inherit;font-family:inherit;margin-top:0.66em;cursor:pointer}.bn-onboard-modal-terms-of-service.svelte-w9ftfy.svelte-w9ftfy{display:flex;align-items:center}.bn-onboard-modal-terms-of-service-check-box.svelte-w9ftfy.svelte-w9ftfy{margin-right:7px}.bn-onboard-custom.bn-onboard-dark-mode{background:#283944;color:#ffffff}.bn-onboard-custom.bn-onboard-dark-mode-background-hover:hover, .bn-onboard-custom.bn-onboard-dark-mode-background{background:#0e212a}.bn-onboard-clickable{text-decoration:none}.bn-onboard-clickable:hover{cursor:pointer;text-decoration:underline}.bn-onboard-custom.bn-onboard-dark-mode-link{color:#91bced;border-color:#91bced}.bn-onboard-wallet-check-section select{padding:0.5rem}</style>