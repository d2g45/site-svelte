<script lang="ts">
  import { Canvas, T } from '@threlte/core'
  import { Suspense } from '@threlte/extras'
  import Daniel from './daniel.svelte'
  import Rig from './rig.svelte'
</script>

<Canvas>
  <T.PointLight decay={0} intensity={Math.PI / 2} position={[0, 0, 10]} />
  <T.PerspectiveCamera position={[0, 0, 6]} />
  <Suspense>
    <Daniel />
    <Rig />
  </Suspense>
</Canvas>
