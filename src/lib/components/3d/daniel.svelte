<script lang="ts">
  import { T } from '@threlte/core'
  import { useDraco, useGltf } from '@threlte/extras'

  const dracoLoader = useDraco()
  const model = useGltf('/three/daniel-whole.min.gltf', { dracoLoader })
</script>

<svelte:window {onpointermove} />

{#if $model}
  <T.Group scale={0.1} rotation={[Math.PI / 2, 0, 0]}>
    <T.Mesh geometry={$model.nodes.Daniel_Whole.geometry}>
      <T.MeshNormalMaterial material={$model.materials.Outer} wireframe />
    </T.Mesh>
  </T.Group>
{/if}
