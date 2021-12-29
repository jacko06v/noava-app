<script>
	import { Swiper, SwiperSlide } from 'swiper/svelte';

	// Import Swiper styles
	import 'swiper/css';

	import 'swiper/css/pagination';
	import 'swiper/css/navigation';

	// import Swiper core and required modules
	import SwiperCore, { Autoplay, Pagination, Navigation } from 'swiper';

	// install Swiper modules
	SwiperCore.use([Autoplay, Pagination, Navigation]);
</script>

<!-- <div class="EarnPage_EarnPage__userPools__1Qtyl">
	<div class="EarnPage_EarnPage__infoBox__31Ldi"> -->
		<Swiper
            loop="{true}"
			spaceBetween={0}
			centeredSlides={true}
			autoplay={{
				delay: 2500,
				disableOnInteraction: false
			}}
			pagination={{
				clickable: true
			}}
			navigation={false}
			class="mySwiper"
		>
			<SwiperSlide><img src="https://miro.medium.com/max/1200/1*JsKuUx3-H1egm8XON18haw.png" style="border-radius:20px"></SwiperSlide>
           
            <SwiperSlide><img src="https://miro.medium.com/max/1200/1*GTfVNy2wXY9Y5Woty1Bm2A.jpeg" style="border-radius:20px"></SwiperSlide>
            <SwiperSlide><img src="https://ip.bitcointalk.org/?u=https%3A%2F%2Fi.imgur.com%2FEmEksZ8.png&t=631&c=veS83BLZf9gsug" style="border-radius:20px"></SwiperSlide>
		</Swiper>
<!-- 	</div>
</div> -->
