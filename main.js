const canvas = document.getElementById('canvas')
const ctx = canvas.getContext('2d')

// делаем canvas на весь экран
function resizeCanvas() {
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
}
window.addEventListener('resize', resizeCanvas)
resizeCanvas()

const width = canvas.width
const height = canvas.height

const cores = navigator.hardwareConcurrency || 4
console.log(cores)
let finished = 0

for (let i = 0; i < cores; i++) {
  const worker = new Worker('./worker.js', { type: 'module' })

  const startY = Math.floor((i / cores) * height)
  const endY = Math.floor(((i + 1) / cores) * height)
  const sliceHeight = endY - startY

  const offscreen = new OffscreenCanvas(width, sliceHeight)

  worker.onmessage = (e) => {
    const bitmap = e.data
    ctx.drawImage(bitmap, 0, startY)
    bitmap.close()

    finished++
    if (finished === cores) {
      finished = 0
      // Здесь можно запускать анимацию или перерисовку
    }
  }

  worker.postMessage(
    {
      canvas: offscreen,
      width,
      height,
      startY,
      sliceHeight
    },
    [offscreen]
  )
}
