<script>
  import Enter from "./enter.svelte";
</script>

<div class="max-w-2xl mx-auto px-5 sm:px-4 pt-6">
  <div class="flex flex-col space-y-4 items-center">
    <img class="w-32 sm:w-52 mx-auto" src="logo.png" alt="" />
    <div
      class="text-4xl sm:text-5xl font-semibold text-white text-center"
      style="max-width: 698px;"
    >
      Be a DeFi master.
    </div>
    <div
      class="pt-4 text-lg font-base text-center"
      style="color: rgb(227, 227, 227);"
    >
      Earn, stake, launch and find new tokens, play and win. <br />
      Use all your potential.
    </div>
    <div
      class="w-full sm:w-auto pt-6 max-w-lg mx-auto sm:flex sm:justify-center sm:space-x-6"
    >
      <Enter />
    </div>
  </div>
</div>
