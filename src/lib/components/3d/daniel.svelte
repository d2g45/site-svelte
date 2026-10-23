<script lang="ts">
  import { T, useLoader } from '@threlte/core'
  import { Mesh } from 'three'
  import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'

  const gltf = useLoader(GLTFLoader).load('/three/daniel-whole.min.gltf')
  const node = $derived($gltf?.scene.getObjectByName('Daniel_Whole'))
</script>

{#if node instanceof Mesh}
  <T.Group scale={0.1} rotation={[Math.PI / 2, 0, 0]}>
    <T.Mesh geometry={node.geometry}>
      <T.MeshNormalMaterial wireframe />
    </T.Mesh>
  </T.Group>
{/if}
