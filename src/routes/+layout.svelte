<script lang="ts">
  import { dev } from '$app/environment'
  import { env } from '$env/dynamic/public'
  import '../app.css'

  let { children } = $props()

  let umami: string | undefined = env.PUBLIC_UMAMI_ID
</script>

<svelte:head>
  {#if !dev && umami}
    <script defer src="https://cloud.umami.is/script.js" data-website-id={umami}></script>
  {/if}
</svelte:head>

<main>
  {@render children()}
</main>
