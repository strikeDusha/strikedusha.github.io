const canvas = document.getElementById('canvas')
const ctx = canvas.getContext('2d')
const cores = navigator.hardwareConcurrency || 4
console.log(`CPU cores: ${cores}`)
// Изначальный диапазон фрактала
let xMin = -3.0, xMax = 3.0
let yMin = -3.0, yMax = 3.0

// Функция resize
function resizeCanvas() {
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
  drawFractal() // пересчёт при изменении размера
}
window.addEventListener('resize', resizeCanvas)
resizeCanvas()



// Ловим колесо мыши для zoom
canvas.addEventListener('wheel', (e) => {
  e.preventDefault()
  const zoomFactor = 1.1
  const mouseX = e.offsetX
  const mouseY = e.offsetY

  const centerRe = xMin + (mouseX / canvas.width) * (xMax - xMin)
  const centerIm = yMin + (mouseY / canvas.height) * (yMax - yMin)

  if (e.deltaY < 0) { // zoom in
    const newWidth = (xMax - xMin) / zoomFactor
    const newHeight = (yMax - yMin) / zoomFactor
    xMin = centerRe - newWidth * (mouseX / canvas.width)
    xMax = xMin + newWidth
    yMin = centerIm - newHeight * (mouseY / canvas.height)
    yMax = yMin + newHeight
  } else { // zoom out
    const newWidth = (xMax - xMin) * zoomFactor
    const newHeight = (yMax - yMin) * zoomFactor
    xMin = centerRe - newWidth * (mouseX / canvas.width)
    xMax = xMin + newWidth
    yMin = centerIm - newHeight * (mouseY / canvas.height)
    yMax = yMin + newHeight
  }

  drawFractal()
})

// Запуск перерисовки фрактала
function drawFractal() {
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  let finished = 0

  for (let i = 0; i < cores; i++) {
    const worker = new Worker('./worker.js', { type: 'module' })

    const startY = Math.floor((i / cores) * canvas.height)
    const endY = Math.floor(((i + 1) / cores) * canvas.height)
    const sliceHeight = endY - startY

    const offscreen = new OffscreenCanvas(canvas.width, sliceHeight)

    worker.onmessage = (e) => {
      const bitmap = e.data
      ctx.drawImage(bitmap, 0, startY)
      bitmap.close()

      finished++
      if (finished === cores) {
        finished = 0
        // Тут можно запускать анимацию или другие действия
      }
    }

    worker.postMessage(
      {
        canvas: offscreen,
        width: canvas.width,
        height: canvas.height,
        startY,
        sliceHeight,
        xMin,
        xMax,
        yMin,
        yMax
      },
      [offscreen]
    )
  }
}
