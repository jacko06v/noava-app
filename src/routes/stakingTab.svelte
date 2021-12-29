<script>
    
    export let name
    export let id
    export let image
    export let scritta

function openClose(){
    if ( name.classList.contains('ant-collapse-item-active') ){
        name.classList.remove("ant-collapse-item-active");
        id.classList.remove("ant-collapse-content-active");
        id.classList.add("ant-collapse-content-inactive");
        id.classList.add("ant-collapse-content-hidden");
    }else{
        name.classList.add("ant-collapse-item-active");
        id.classList.add("ant-collapse-content-active");
        id.classList.remove("ant-collapse-content-inactive");
        id.classList.remove("ant-collapse-content-hidden");
    }
}
    </script>

<div bind:this={name} class="ant-collapse-item earn-collapse">
    <div on:click={openClose} class="ant-collapse-header" role="button" tabindex="0" aria-expanded="true">
       <span class="ant-collapse-arrow"><i class="icon-arrow_down"></i></span>
       <div class="EarnPage_EarnPage__table__header__2Nxkx">
          <img src="{image}" alt="sYSL">
          <div class="EarnPage_EarnPage__table__header__info__23JmF">
             <p class="s_text__2O9ZL s_body2__d8EpH s_weight-semibold__2lhBJ s_primary-color__1S4LI EarnPage_EarnPage__table__title__2rgo3">{scritta}</p>
             
          </div>
          <div class="EarnPage_EarnPage__table__info__TH6NY">
             <div class="EarnPage_EarnPage__table__balance__qMB8w">
                <div class="s_text__2O9ZL s_small__2mNdX s_secondary-color__3RLrb">Wallet</div>
                <span class="s_text__2O9ZL s_body3__3wlSS s_weight-semibold__2lhBJ s_secondary-color__3RLrb s_text-center__Zi9EM s_text_numbers__2nPsT EarnPage_hoverColor__14dYo">$0.00</span>
                <div class="EarnPage_EarnPage__table__sub__DRxXM">
                   <div class="s_text__2O9ZL s_body3__3wlSS s_secondary-color__3RLrb s_text_numbers__2nPsT">$0.00</div>
                </div>
             </div>
             <div class="EarnPage_EarnPage__table__deposit__3MzjZ">
                <div class="s_text__2O9ZL s_small__2mNdX s_secondary-color__3RLrb">Balance</div>
                <span class="s_text__2O9ZL s_body2__d8EpH s_weight-semibold__2lhBJ s_secondary-color__3RLrb s_text-center__Zi9EM s_text_numbers__2nPsT EarnPage_hoverColor__14dYo">$0.00</span>
                <div class="EarnPage_EarnPage__table__sub__DRxXM">
                   <div class="s_text__2O9ZL s_body3__3wlSS s_secondary-color__3RLrb s_text-center__Zi9EM s_text_numbers__2nPsT">$0.00</div>
                </div>
             </div>
             <div class="EarnPage_EarnPage__table__daily__3YLXd">
                <div class="s_text__2O9ZL s_small__2mNdX s_secondary-color__3RLrb">Daily</div>
                <span class="s_text__2O9ZL s_body3__3wlSS s_weight-semibold__2lhBJ s_secondary-color__3RLrb s_text_numbers__2nPsT EarnPage_hoverColor__14dYo">0.099 %</span>
             </div>
             <div>
                <div class="s_text__2O9ZL s_small__2mNdX s_secondary-color__3RLrb">APR</div>
                <span class="s_text__2O9ZL s_body3__3wlSS s_weight-semibold__2lhBJ s_primary-color__1S4LI s_text_numbers__2nPsT">30.784 %</span>
             </div>
             <div class="EarnPage_EarnPage__table__earned__3ARHv">
                <div class="s_text__2O9ZL s_small__2mNdX s_secondary-color__3RLrb">Earned</div>
                <span class="s_text__2O9ZL s_body2__d8EpH s_weight-semibold__2lhBJ s_secondary-color__3RLrb s_text-center__Zi9EM s_text_numbers__2nPsT EarnPage_hoverColor__14dYo">$0.00</span>
             </div>
             <div class="EarnPage_EarnPage__table__liquidity__1x_c2">
                <div class="s_text__2O9ZL s_small__2mNdX s_secondary-color__3RLrb">Liquidity</div>
                <span class="s_text__2O9ZL s_body3__3wlSS s_weight-semibold__2lhBJ s_secondary-color__3RLrb s_text_numbers__2nPsT EarnPage_hoverColor__14dYo">$955,655</span>
             </div>
          </div>
       </div>
    </div>
    <div bind:this={id} class="ant-collapse-content ant-collapse-content-inactive ant-collapse-content-hidden" style="">
       <div class="ant-collapse-content-box">
          <div class="EarnPage_EarnPage__table__content__1JJ6f">
             <div class="EarnPage_EarnPage__table__content__nav__3Z8vO">
                <div class="EarnPage_EarnPage__table__content__links__1sViI">
                   <div class="s_text__2O9ZL s_body2__d8EpH s_weight-bold__7n-86"><a href="https://app.apeswap.finance/swap?inputCurrency=0x64d3638a7d8747eee7bd5d402cc5f5bd00dc27dc&amp;outputCurrency=0xe9e7cea3dedca5984780bafc599bd69add087d56" target="_blank" rel="noreferrer">Purchase {scritta} <i class="icon icon-arrow-angle-right"></i></a></div>
                   <div class="s_text__2O9ZL s_body2__d8EpH s_weight-bold__7n-86"><a href="https://bscscan.com/address/0x7BcC195Ee4F1f8D739f0e234E0fcA886B62f67D5" target="_blank" rel="noreferrer">Vault Contract <i class="icon icon-arrow-angle-right"></i></a></div>
                   <div class="s_text__2O9ZL s_body2__d8EpH s_weight-bold__7n-86"><a href="https://bscscan.com/address/0xEE7Bc7727436D839634845766f567fa354ba8C56" target="_blank" rel="noreferrer">Farm Contract <i class="icon icon-arrow-angle-right"></i></a></div>
                </div>
               
             </div>
             <div class="EarnPage_EarnPage__table__content__forms__61FA5">
                <div class="swiper-container swiper-container-initialized swiper-container-horizontal swiper-container-pointer-events vaults-slider">
                  
                  
                     
                    <div class="container text-left">
                        <div class="d-flex flex-sm-row flex-column">
                           <div class="mr-auto p-2  font-bold text-xl" style="margin-right: 5px;">
                              

                              <form id="deposit" class="ant-form ant-form-horizontal earn__form">
                                 <div class="earn__form__item">
                                    <div class="ant-row ant-form-item" style="row-gap: 0px;">
                                       <div class="ant-col ant-form-item-label" style="margin-bottom: 10px;"><label for="deposit_depositAmount" class="ant-form-item-required ant-form-item-no-colon" title=""><span title="Deposit Fee: 0%">Deposit: <span class="earn__form__item_amount">0.00000</span> {scritta}</span></label></div>
                                  
                                       <div class="ant-col ant-form-item-control">
                                          <div class="ant-form-item-control-input">
                                             <div class="ant-form-item-control-input-content">
                                                <div class="ant-input-number inputButton">
                                                   <div class="ant-input-number-handler-wrap">
                                                      <span unselectable="on" role="button" aria-label="Increase Value" aria-disabled="false" class="ant-input-number-handler ant-input-number-handler-up">
                                                         <span role="img" aria-label="up" class="anticon anticon-up ant-input-number-handler-up-inner">
                                                            <svg viewBox="64 64 896 896" focusable="false" data-icon="up" width="1em" height="1em" fill="currentColor" aria-hidden="true">
                                                               <path d="M890.5 755.3L537.9 269.2c-12.8-17.6-39-17.6-51.7 0L133.5 755.3A8 8 0 00140 768h75c5.1 0 9.9-2.5 12.9-6.6L512 369.8l284.1 391.6c3 4.1 7.8 6.6 12.9 6.6h75c6.5 0 10.3-7.4 6.5-12.7z"></path>
                                                            </svg>
                                                         </span>
                                                      </span>
                                                      <span unselectable="on" role="button" aria-label="Decrease Value" aria-disabled="false" class="ant-input-number-handler ant-input-number-handler-down">
                                                         <span role="img" aria-label="down" class="anticon anticon-down ant-input-number-handler-down-inner">
                                                            <svg viewBox="64 64 896 896" focusable="false" data-icon="down" width="1em" height="1em" fill="currentColor" aria-hidden="true">
                                                               <path d="M884 256h-75c-5.1 0-9.9 2.5-12.9 6.6L512 654.2 227.9 262.6c-3-4.1-7.8-6.6-12.9-6.6h-75c-6.5 0-10.3 7.4-6.5 12.7l352.6 486.1c12.8 17.6 39 17.6 51.7 0l352.6-486.1c3.9-5.3.1-12.7-6.4-12.7z"></path>
                                                            </svg>
                                                         </span>
                                                      </span>
                                                   </div>
                                                   <div class="ant-input-number-input-wrap"><input autocomplete="off" role="spinbutton" aria-valuemin="0" aria-valuemax="0" step="1" placeholder="0" id="deposit_depositAmount" class="ant-input-number-input" value=""></div>
                                                </div>
                                             </div>
                                          </div>
                                       </div>
                                    </div>
                                    
                                 </div>
                                 <div class="ant-row ant-form-item" style="row-gap: 0px;">
                                    <div class="ant-col ant-form-item-control">
                                       <div class="ant-form-item-control-input">
                                          <div class="ant-form-item-control-input-content"><button disabled="" type="submit" class="ant-btn ant-btn-primary button-1"><span>Deposit</span></button></div>
                                       </div>
                                    </div>
                                 </div>
                                 <div class="EarnPage_EarnPage__table__content__fee__3ttDn">
                                    <div class="s_text__2O9ZL s_small__2mNdX s_primary-color__1S4LI s_text-center__Zi9EM s_text_numbers__2nPsT">Deposit Fee: 0%</div>
                                 </div>
                              </form>


                           </div>

                           <br>
                           <div class="p-2  font-bold text-xl" style="margin-right: 5px;">


                              <form id="withdraw" class="ant-form ant-form-horizontal earn__form">
                                 <div class="earn__form__item">
                                    <div class="ant-row ant-form-item" style="row-gap: 0px;">
                                       
                                       <div class="ant-col ant-form-item-label" style="margin-bottom: 10px;"><label for="withdraw_withdrawAmount" class="ant-form-item-required ant-form-item-no-colon" title=""><span title="Withdrawal Fee: 0%">Withdraw: <span class="earn__form__item_amount">0.00000</span> {scritta}</span></label></div>
                                       
                                       <div class="ant-col ant-form-item-control">
                                          <div class="ant-form-item-control-input">
                                             <div class="ant-form-item-control-input-content">
                                                <div class="ant-input-number inputButton">
                                                   <div class="ant-input-number-handler-wrap">
                                                      <span unselectable="on" role="button" aria-label="Increase Value" aria-disabled="false" class="ant-input-number-handler ant-input-number-handler-up">
                                                         <span role="img" aria-label="up" class="anticon anticon-up ant-input-number-handler-up-inner">
                                                            <svg viewBox="64 64 896 896" focusable="false" data-icon="up" width="1em" height="1em" fill="currentColor" aria-hidden="true">
                                                               <path d="M890.5 755.3L537.9 269.2c-12.8-17.6-39-17.6-51.7 0L133.5 755.3A8 8 0 00140 768h75c5.1 0 9.9-2.5 12.9-6.6L512 369.8l284.1 391.6c3 4.1 7.8 6.6 12.9 6.6h75c6.5 0 10.3-7.4 6.5-12.7z"></path>
                                                            </svg>
                                                         </span>
                                                      </span>
                                                      <span unselectable="on" role="button" aria-label="Decrease Value" aria-disabled="false" class="ant-input-number-handler ant-input-number-handler-down">
                                                         <span role="img" aria-label="down" class="anticon anticon-down ant-input-number-handler-down-inner">
                                                            <svg viewBox="64 64 896 896" focusable="false" data-icon="down" width="1em" height="1em" fill="currentColor" aria-hidden="true">
                                                               <path d="M884 256h-75c-5.1 0-9.9 2.5-12.9 6.6L512 654.2 227.9 262.6c-3-4.1-7.8-6.6-12.9-6.6h-75c-6.5 0-10.3 7.4-6.5 12.7l352.6 486.1c12.8 17.6 39 17.6 51.7 0l352.6-486.1c3.9-5.3.1-12.7-6.4-12.7z"></path>
                                                            </svg>
                                                         </span>
                                                      </span>
                                                   </div>
                                                   <div class="ant-input-number-input-wrap"><input autocomplete="off" role="spinbutton" aria-valuemin="0" aria-valuemax="0" step="1" placeholder="0" id="withdraw_withdrawAmount" class="ant-input-number-input" value=""></div>
                                                </div>
                                             </div>
                                          </div>
                                       </div>
                                    </div>
                                   
                                 </div>
                                 <div class="ant-row ant-form-item" style="row-gap: 0px;">
                                    <div class="ant-col ant-form-item-control">
                                       <div class="ant-form-item-control-input">
                                          <div class="ant-form-item-control-input-content"><button disabled="" type="submit" class="ant-btn ant-btn-primary button-1"><span>Withdraw</span></button></div>
                                       </div>
                                    </div>
                                 </div>
                                 <div class="EarnPage_EarnPage__table__content__fee__3ttDn">
                                    <div class="s_text__2O9ZL s_small__2mNdX s_primary-color__1S4LI s_text-center__Zi9EM s_text_numbers__2nPsT">Withdrawal Fee: 0%</div>
                                 </div>
                              </form>


                           </div>

                           <br>
                           <div class="p-2 text-xl" >

                              <div class="EarnPage_EarnPage__table__content__controls__N7v8S">
                                 <span class="s_text__2O9ZL s_body1__1kjhf s_primary-color__1S4LI EarnPage_EarnPage__table__content__tooltip__2JsUz" style="margin-bottom: 10px;">sYSL Rewards</span>
                                 <br>
                                 
                                 <div class="EarnPage_EarnPage__table__content__rewards__uy9jP">
                                    <span class="s_text__2O9ZL s_h6__TYu-o s_weight-semibold__2lhBJ s_text-center__Zi9EM s_text_numbers__2nPsT">$0.00</span>
                                    <div class="s_text__2O9ZL s_small__2mNdX s_secondary-color__3RLrb s_text-center__Zi9EM s_text_numbers__2nPsT">0.00000</div>
                                 </div>
                                 <button disabled="" type="button" class="ant-btn button-1"><span>HARVEST</span></button>
                                 <div class="s_text__2O9ZL s_small__2mNdX s_primary-color__1S4LI s_text-center__Zi9EM s_text_numbers__2nPsT">Performance Fee: 0%</div>
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