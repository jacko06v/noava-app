let header= document.getElementById("header");
let mobile= document.getElementById("mobile");
let navM= document.getElementById("navM");
mobile.addEventListener('click',openMobile);



function openMobile(){
    if ( header.classList.contains('activeNav') ){
        header.classList.remove("activeNav");
        mobile.classList.remove("Header_nav_icon_active__w41lj");
        navM.classList.remove("Header_header__nav__active__cNmtw");
       
    }else{
        header.classList.add("activeNav");
        mobile.classList.add("Header_nav_icon_active__w41lj");
        navM.classList.add("Header_header__nav__active__cNmtw");
    }
}


let sysl = document.getElementById("sysl1");
let sysl2 = document.getElementById('sysl2');

document.getElementById("syslc").addEventListener('click',openClose);

function openClose(){
    if ( sysl.classList.contains('ant-collapse-item-active') ){
        sysl.classList.remove("ant-collapse-item-active");
    sysl2.classList.remove("ant-collapse-content-active");
    sysl2.classList.add("ant-collapse-content-inactive");
    sysl2.classList.add("ant-collapse-content-hidden");
    }else{
    sysl.classList.add("ant-collapse-item-active");
    sysl2.classList.add("ant-collapse-content-active");
    sysl2.classList.remove("ant-collapse-content-inactive");
    sysl2.classList.remove("ant-collapse-content-hidden");
    }
}

let sysl3 = document.getElementById("sysl3");
let sysl4 = document.getElementById('sysl4');

document.getElementById("sysld").addEventListener('click',openClose1);

function openClose1(){
    if ( sysl3.classList.contains('ant-collapse-item-active') ){
        sysl3.classList.remove("ant-collapse-item-active");
    sysl4.classList.remove("ant-collapse-content-active");
    sysl4.classList.add("ant-collapse-content-inactive");
    sysl4.classList.add("ant-collapse-content-hidden");
    }else{
    sysl3.classList.add("ant-collapse-item-active");
    sysl4.classList.add("ant-collapse-content-active");
    sysl4.classList.remove("ant-collapse-content-inactive");
    sysl4.classList.remove("ant-collapse-content-hidden");
    }
}