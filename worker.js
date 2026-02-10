let ctx
const eps = 0.2 //радиус схождения 
 

const roots = [
  { re:  1,    im:  0 },
  { re: -0.5,  im:  0.866025403784 },
  { re: -0.5,  im: -0.866025403784 }
]

self.onmessage = (e) => {
  const { canvas, width, height, startY, sliceHeight } = e.data

  // ⚠️ context берём ОДИН раз
  if (!ctx) {
    ctx = canvas.getContext('2d')
  }

  const imageData = ctx.createImageData(width, sliceHeight)
  const pixels = imageData.data

  let offset = 0

  for (let y = 0; y < sliceHeight; y++) {
    const globalY = startY + y

    for (let x = 0; x < width; x++) {

      const c = {
        re: (x / width) * 3.5 - 2.5,
        im: (globalY / height) * 2.0 - 1.0
      }

      const color = computeColor(c)

      pixels[offset++] = color.r
      pixels[offset++] = color.g
      pixels[offset++] = color.b
      pixels[offset++] = color.a
    }
  }

  ctx.putImageData(imageData, 0, 0)

  // ✅ ВОТ ТУТ МАГИЯ
  const bitmap = canvas.transferToImageBitmap()
  self.postMessage(bitmap, [bitmap])
}

function computeColor(c) {
  let z = { re: c.re, im: c.im }

  const maxIter = 100
  const eps2 = 1e-5

  for (let i = 0; i < maxIter; i++) {

    // f(z) = z^3 - 1
    const z2 = product(z, z)
    const z3 = product(z2, z)
    const fz = add(z3, { re: 1, im: 0 },1,-1)

    // f'(z) = 3 z^2
    const dfz = add(z2,{re:0,im:0} ,3,0)

    // z = z - f(z)/f'(z)
    const delta = division(fz, dfz)
    z = add(z, delta,1,-1)

    // проверяем, к какому корню сошлось
    for (let r = 0; r < roots.length; r++) {
      if (dist(z, roots[r]) < eps2) {
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

  const k = Math.exp(-0.15 * iter)
  const c = baseColors[rootIndex]

  return {
    r: c.r * k,
    g: c.g * k,
    b: c.b * k,
    a: 255
  }
}


function dist(c1,c2){
    //расстояние между комплексными числами 
    // это короче просто модуль их разности( это ж просто векторы лол)
    const dre = c1.re-c2.re
    const dim = c1.im-c2.im

    return dre**2+dim**2
}


function add(c1,c2,a,b){
    //а и б коэффициенты этих чисел соотвественно( что бы не тупо сложение а любую линейную комбинацию)
    return {
        re:c1.re*a+c2.re*b,
        im: c1.im*a+ c2.im*b
    }
}

function product(c1,c2){
    return {
        re:c1.re*c2.re-c1.im*c2.im,
        im:c1.im*c2.re+c2.im*c1.re
    }
}

function division(c1,c2){
    const d = dist(c2,{re:0,im:0})
    if (d === 0){
        return {re:0,im:0}
    }
    else{
        return add(product(c1,{re:c2.re,im:-c2.im})
        ,{re:0,im:0},
        1/d
        ,0)// домножаем на сопряженное и делим на модуль( умножение на скаляр через линейную комбинацию)
    }
}

//честно говоря это прям ультра неоптимизированное говно, которое писалось на скорую руку что бы поскорей посмотреть на фракталы 
//что бы по честному оптимизировать это все нужно под каждый фрактал хардкодить функцию, 
// я же старался писать обобщенно что бы было удобнее тестить разное и читать 
// да и по честному надо рендер и математику делать на wasm и никак не на js 
