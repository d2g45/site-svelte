<script lang="ts">
  import { JsonLd, MetaTags, type JsonLdProps, type MetaTagsProps } from 'svelte-meta-tags'
  import Icon from '@iconify/svelte'

  type Link = {
    id: string
    to: string
    target?: '_blank' | 'self'
    title: string
    icon: string
    rel?: string
  }

  const links: Link[] = [
    {
      id: 'email',
      to: 'mailto:me@danieldeguzman',
      title: 'Send me an email',
      icon: 'hugeicons:mailbox-01',
      rel: 'reply-to',
    },
    {
      id: 'github',
      to: 'https://github.com/d2g45',
      target: '_blank',
      title: 'Take a look at my repositories on GitHub',
      icon: 'hugeicons:github',
      rel: 'noopener noreferrer external',
    },
    {
      id: 'linkedin',
      to: 'https://linkedin.com/in/danieldeguzman',
      target: '_blank',
      title: 'Check out my LinkedIn profile!',
      icon: 'hugeicons:linkedin-01',
      rel: 'noopener noreferrer external',
    },
  ]

  const name: string = 'Daniel De Guzman'
  const canonical: string = 'https://danieldeguzman.com'
  const imageUrl: string = `${canonical}/sharing-02.jpg`
  const title: string = `${name} | Full Stack Web Developer`
  const description: string =
    "I'm Daniel De Guzman, a full stack web developer from Chattanooga, TN. Let's work together."
  const meta: MetaTagsProps = {
    title,
    robots: 'index, follow',
    description,
    canonical,
    keywords: [
      name,
      'full stack web developer',
      'chattanooga web developer',
      'web developer',
      'software engineer',
    ],

    twitter: {
      cardType: 'summary',
      site: '@d2g45',
      creator: '@d2g45',
      title,
      description,
      image: imageUrl,
    },
    openGraph: {
      type: 'website',
      url: canonical,
      locale: 'en_US',
      title,
      description,
      siteName: name,
      images: [
        {
          url: imageUrl,
          secureUrl: imageUrl,
          alt: "Daniel De Guzman's website",
          type: 'image/jpg',
          width: 1200,
          height: 630,
        },
      ],
    },
  }

  const schema: JsonLdProps['schema'] = {
    '@type': 'Article',
    mainEntityOfPage: {
      '@type': 'Webpage',
      '@id': canonical,
    },
    headline: title,
    image: [imageUrl],
    datePublished: new Date('2025-07-26').toISOString(),
    dateModified: new Date('2026-02-28').toISOString(),
    author: {
      '@type': 'Person',
      name,
    },
  }

  let homeScene = () => import('#lib/components/3d/home-scene.svelte')
</script>

<MetaTags {...meta} />

<JsonLd {schema} />

<div
  class="relative grid h-dvh w-full grid-cols-1 grid-rows-1 items-center justify-center bg-linear-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20">
  {#await homeScene() then m}
    <div class="absolute top-0 left-0 z-0 size-full">
      <div class="relative size-full touch-auto">
        <svelte:component this={m.default} />
      </div>
    </div>
  {/await}
  <div class="overflow-x relative z-10 mx-auto w-full max-w-6xl p-4">
    <div
      class="relative z-10 flex w-full max-w-6xl flex-col items-center justify-center gap-3 rounded-xl bg-slate-600/50 p-4 text-center tracking-wider shadow-lg backdrop-blur-lg md:p-8 lg:gap-8 xl:mx-auto">
      <h1 class="text-3xl md:text-4xl lg:text-6xl">Hi! I&apos;m <strong>Daniel.</strong></h1>
      <div class="text-lg md:text-xl lg:text-3xl">
        I&apos;m a full stack developer from Chattanooga, TN.
      </div>

      <div class="flex flex-row items-center justify-center gap-4 lg:gap-8">
        {#each links as link (link.id)}
          <a
            href={link.to}
            target={link.target}
            title={link.title}
            rel={link.rel}
            class="flex size-12 flex-col items-center justify-center gap-4 text-2xl text-current transition-colors duration-300 ease-in-out hover:text-emerald-500 md:text-3xl lg:text-5xl">
            <Icon icon={link.icon} />
            <span class="sr-only">{link.title}</span>
          </a>
        {/each}
      </div>
    </div>
  </div>
</div>
