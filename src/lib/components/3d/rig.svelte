<script lang="ts">
  import Device from 'svelte-device-info'
  import { useTask, useThrelte } from '@threlte/core'
  import { Vector3 } from 'three'

  let vec: Vector3 = new Vector3()
  let pointer = $state({ x: 0, y: 0 })

  const { camera } = useThrelte()

  useTask('render', () => {
    $camera.position.lerp(vec.set(pointer.x, pointer.y, $camera.position.z), 0.05)
    $camera.lookAt(0, 0, 0)
  })

  const onpointermove = (event: PointerEvent) => {
    pointer.x = -((event.clientX / window.innerWidth) * 2 - 1) * 2.5
    pointer.y = ((event.clientY / window.innerHeight) * 2 - 1) * 2.5
  }

  const ondeviceorientation = (event: DeviceOrientationEvent) => {
    const { gamma = 0, beta = 0 } = event
    if (Device.isMobile && gamma && beta) {
      pointer.x = gamma / 25
      pointer.y = beta / 25
    }
  }
</script>

<svelte:window {onpointermove} {ondeviceorientation} />
