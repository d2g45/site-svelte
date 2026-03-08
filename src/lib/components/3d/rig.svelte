<script lang="ts">
  import Device from 'svelte-device-info'
  import { T, useTask, useThrelte } from '@threlte/core'
  import { interactivity } from '@threlte/extras'
  import { Vector2, Vector3 } from 'three'

  type PointerEvent = {
    pointer: Vector2
  }

  let vec: Vector3 = new Vector3()
  let pointer = $state({ x: 0, y: 0 })

  interactivity()

  const { camera } = useThrelte()

  useTask('render', () => {
    $camera.position.lerp(vec.set(pointer.x, pointer.y, $camera.position.z), 0.05)
    $camera.lookAt(0, 0, 0)
  })

  const ondeviceorientation = (event: DeviceOrientationEvent) => {
    const { gamma = 0, beta = 0 } = event
    if (Device.isMobile && gamma && beta) {
      pointer.x = gamma / 25
      pointer.y = beta / 25
    }
  }
</script>

<svelte:window {ondeviceorientation} />

<T.Mesh
  onpointermove={(event: PointerEvent) => {
    pointer.x = -event.pointer.x * 2.5
    pointer.y = -event.pointer.y * 2.5
  }}>
  <T.PlaneGeometry args={[100, 100]} />
  <T.MeshBasicMaterial visible={false} />
</T.Mesh>
