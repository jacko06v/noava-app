<script>
import {optionsPolygon, optionsBsc} from "./tabs.svelte"
import StakingTab from "./stakingTab.svelte";
import Tvl from "./tvl.svelte";
import Banner from "./banner.svelte";
import { chainId } from 'svelte-web3'
</script>

<svelte:head>
<style>
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
 </style>
   
   

<!--  <link rel="stylesheet" href="css1.css">
 <link rel="stylesheet" href="css2.css"> -->
</svelte:head>
 
       <main>
         
         <div class="EarnPage_EarnPage__sqMu9">
            <div class="container">
               <div class="PriceTiles_PriceTiles__8qvTB TilesSlider">
                  <Tvl />
                  <Banner/>
                  <div class="PricesSlider">
                     <div class="swiper-container swiper-container-initialized swiper-container-horizontal swiper-container-pointer-events" style="cursor: grab;">
                        
                     </div>
                     <div class="swiper-pagination"></div>
                  </div>
                  <div class="EarnPage_EarnPage__userPools__1Qtyl">
                     
                  </div>
                  
                  <div class="EarnPage_EarnPage__allPools__7-Eob">
                     <div class="ant-tabs ant-tabs-top earn-tabs">
                        <div role="tablist" class="ant-tabs-nav">
                           <div class="ant-tabs-extra-content">
                              <div class="EarnPage_EarnPage__tabsTitle__2g4U7">
                                 <img src="all_active_vault.f48f66de.svg" alt="icon">
                                 <div class="s_text__2O9ZL s_h6__TYu-o s_weight-bold__7n-86">Active Vaults</div>
                                 <span class="s_text__2O9ZL s_body2__d8EpH s_secondary-color__3RLrb"><span class="s_text__2O9ZL s_body2__d8EpH s_secondary-color__3RLrb s_text_numbers__2nPsT">(18 </span>vaults in total)</span>
                               
                              </div>
                           </div>
                           <div class="ant-tabs-nav-wrap">
                              <div class="ant-tabs-nav-list" style="transform: translate(0px, 0px);">
                                 <div class="ant-tabs-tab ant-tabs-tab-active">
                                    <div role="tab" aria-selected="true" class="ant-tabs-tab-btn" tabindex="0" id="rc-tabs-0-tab-1" aria-controls="rc-tabs-0-panel-1">Active Vaults</div>
                                 </div>
                             
                                 <div class="ant-tabs-ink-bar ant-tabs-ink-bar-animated" style="left: 0px; width: 111px;"></div>
                              </div>
                           </div>
                           <div class="ant-tabs-nav-operations ant-tabs-nav-operations-hidden">
                              <button type="button" class="ant-tabs-nav-more" tabindex="-1" aria-hidden="true" aria-haspopup="listbox" aria-controls="rc-tabs-0-more-popup" id="rc-tabs-0-more" aria-expanded="false" style="visibility: hidden; order: 1;">
                                 <span role="img" aria-label="ellipsis" class="anticon anticon-ellipsis">
                                    <svg viewBox="64 64 896 896" focusable="false" data-icon="ellipsis" width="1em" height="1em" fill="currentColor" aria-hidden="true">
                                       <path d="M176 511a56 56 0 10112 0 56 56 0 10-112 0zm280 0a56 56 0 10112 0 56 56 0 10-112 0zm280 0a56 56 0 10112 0 56 56 0 10-112 0z"></path>
                                    </svg>
                                 </span>
                              </button>
                           </div>
                        </div>
                        <div class="ant-tabs-content-holder">
                           
                           <div class="ant-tabs-content ant-tabs-content-top">
                              <div role="tabpanel" tabindex="0" aria-hidden="false" class="ant-tabs-tabpane ant-tabs-tabpane-active" id="rc-tabs-0-panel-1" aria-labelledby="rc-tabs-0-tab-1">
                                 <div class="ant-collapse ant-collapse-icon-position-right earn-collapse">
                                    {#if $chainId == 137}
                                    {#each optionsPolygon as tabOption}
                                <StakingTab scritta = {tabOption.scritta} name={tabOption.name} id={tabOption.id} image={tabOption.image}/>    
                                {/each}
                                {:else }
            {#if $chainId == 56}
            {#each optionsBsc as tabOption}
                                <StakingTab scritta = {tabOption.scritta} name={tabOption.name} id={tabOption.id} image={tabOption.image}/>    
                                {/each}
                                {/if}
                                {/if}
                     </div>
                     </div>
                     </div>
                     </div>
                   </div>     
                  </div>
               </div>
             </div>
         </div>
         
      </main>
