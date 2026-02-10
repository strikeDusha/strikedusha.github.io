let ctx
const eps = 1e-5 // квадрат радиуса схождения

const roots = [
  { re:  1,    im:  0 },
  { re: -0.5,  im:  0.866025403784 },
  { re: -0.5,  im: -0.866025403784 }
]

self.onmessage = (e) => {
  const { canvas, width, height, startY, sliceHeight, xMin, xMax, yMin, yMax } = e.data

  if (!ctx) ctx = canvas.getContext('2d')

  const imageData = ctx.createImageData(width, sliceHeight)
  const pixels = imageData.data

  let offset = 0

  for (let y = 0; y < sliceHeight; y++) {
    const globalY = startY + y

    for (let x = 0; x < width; x++) {
      const c = {
        re: xMin + (x / width) * (xMax - xMin),
        im: yMin + (globalY / height) * (yMax - yMin)
      }

      const color = computeColor(c)

      pixels[offset++] = color.r
      pixels[offset++] = color.g
      pixels[offset++] = color.b
      pixels[offset++] = color.a
    }
  }

  ctx.putImageData(imageData, 0, 0)

  const bitmap = canvas.transferToImageBitmap()
  self.postMessage(bitmap, [bitmap])
}

// ================= Комплексная математика =================
function computeColor(c) {
  let z = { re: c.re, im: c.im }

  const maxIter = 1000

  for (let i = 0; i < maxIter; i++) {
    // f(z) = z^3 - 1
    const z2 = product(z, z)
    const z3 = product(z2, z)
    const fz = { re: z3.re - 1, im: z3.im }

    // f'(z) = 3 z^2
    const dfz = scale(z2, 3)

    // z = z - f(z)/f'(z)
    const delta = division(fz, dfz)
    z = { re: z.re - delta.re, im: z.im - delta.im }

    // проверяем, к какому корню сошлось
    for (let r = 0; r < roots.length; r++) {
      if (dist(z, roots[r]) < eps) {
        return colorForRoot(r, i)
      }
    }
  }

  // не сошлось
  return { r: 0, g: 0, b: 0, a: 255 }
}

function colorForRoot(rootIndex, iter) {
  const baseColors = [
    { r: 255, g: 60,  b: 60  },
    { r: 60,  g: 255, b: 60  },
    { r: 60,  g: 60,  b: 255 }
  ]

  const k = Math.exp(-0.01 * iter)
  const c = baseColors[rootIndex]

  return {
    r: Math.floor(c.r * k),
    g: Math.floor(c.g * k),
    b: Math.floor(c.b * k),
    a: 255
  }
}

// ------------------ Вспомогательные функции ------------------
function dist(c1, c2){
  const dre = c1.re - c2.re
  const dim = c1.im - c2.im
  return dre**2 + dim**2
}

function product(c1, c2){
  return {
    re: c1.re*c2.re - c1.im*c2.im,
    im: c1.im*c2.re + c2.im*c1.re
  }
}

function scale(c, k){
  return { re: c.re * k, im: c.im * k }
}

function division(c1, c2){
  const d2 = dist(c2, {re:0, im:0})
  if (d2 === 0) return {re:0, im:0}

  const conj = {re: c2.re, im: -c2.im}
  const numerator = product(c1, conj)
  return { re: numerator.re / d2, im: numerator.im / d2 }
}
