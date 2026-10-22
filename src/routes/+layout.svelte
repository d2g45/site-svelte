<script lang="ts">
  import { dev } from '$app/env'
  import { PUBLIC_UMAMI_ID } from '$app/env/public'
  import '../app.css'

  let { children } = $props()

  let umami: string | undefined = PUBLIC_UMAMI_ID
</script>

<svelte:head>
  {#if !dev && umami}
    <script defer src="https://cloud.umami.is/script.js" data-website-id={umami}></script>
  {/if}
</svelte:head>

<main>
  {@render children()}
</main>
