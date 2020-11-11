// BOILER PLATE
const canvasWidth = 800
const canvasHeight = 800
window.onload = () => {
    resizeCanvas( canvasWidth, canvasHeight, 1 )
    loop()
}

function resizeCanvas( height, width, pixelDensity ) {
    canvas.style.width = width + "px"
    canvas.style.height = height + "px"
    canvas.width = width * pixelDensity
    canvas.height = height * pixelDensity
    canvas.getContext( "2d" ).scale( pixelDensity, pixelDensity )
}

function loop() {
    let time = performance.now()
    for ( let i = 0; i < 2000; i++ )
        update()
    render()
    lastFrameTime = time
    requestAnimationFrame( loop )
}
// END BOILER PLATE

let freq = 1 / 10
let amplitude = 100
let sigma = 50
let resolution = 200
let hBarOver2m = 0.5
let dx = canvasWidth / ( resolution - 1 )
let dt = 0.01
let wave = []
{ // Setup wavelet.
    for ( let i = 0; i < resolution; i++ ) {
        let x = i * dx
        let x2 = x - canvasWidth / 8
        let modulation = Math.exp( -( ( x2 / sigma ) ** 2 ) )
        wave.push( {
            re: Math.cos( x2 * freq ) * amplitude * modulation,
            im: Math.sin( x2 * freq ) * amplitude * modulation
        } )
    }
    normalizeWave( 1e6 )
}
let dWave = []
{ // Setup initial derivatives of wave.
    for ( let i = 0; i < resolution; i++ )
        dWave = { re: 0, im: 0 }
}

function render() {
    const ctx = canvas.getContext( "2d" )

    ctx.save()
    {
        ctx.beginPath()
        ctx.fillStyle = "white"
        ctx.rect( 0, 0, canvasWidth, canvasHeight )
        ctx.fill()

        ctx.translate( 0, canvasHeight / 2 )
        wavePath( ctx, wave, "re" )
        ctx.strokeStyle = "blue"
        ctx.stroke()
        wavePath( ctx, wave, "im" )
        ctx.strokeStyle = "red"
        ctx.stroke()

    }
    ctx.restore()
}

function wavePath( ctx, wave, component ) {
    ctx.beginPath()
    ctx.moveTo( 0, 0 )
    for ( let i = 0; i < resolution; i++ ) {
        let x = i * dx
        y = wave[ i ][ component ]
        ctx.lineTo( x, y )
    }
}

function clamp( low, high, x ) {
    return Math.max( low, Math.min( high, x ) )
}

function get( wave, i ) {
    // i = clamp( 0, wave.length - 1, i )
    if ( i >= wave.length ) i = 0
    if ( i < 0 ) i = wave.length - 1
    return wave[ i ]
}

function laplacian( wave, i ) {
    let v0 = get( wave, i - 1 )
    let v1 = get( wave, i )
    let v2 = get( wave, i + 1 )
    let re = ( v0.re - 2 * v1.re + v2.re ) / ( dx ** 2 )
    let im = ( v0.im - 2 * v1.im + v2.im ) / ( dx ** 2 )
    return { re, im }
}

function update() {
    for ( let i = 0; i < resolution; i++ ) {
        let L = laplacian( wave, i )
        dWave[ i ] = { re: -L.im * hBarOver2m, im: L.re * hBarOver2m }
    }
    for ( let i = 0; i < resolution; i++ ) {
        let v = wave[ i ]
        let dv = dWave[ i ]
        v.re += dv.re * dt
        v.im += dv.im * dt
        wave[ i ] = v
    }
}

function normalizeWave( scale ) {
    let netAmplitude = 0
    for ( let v of wave )
        netAmplitude += ( v.re ** 2 + v.im ** 2 ) * dx
    let coef = Math.sqrt( scale / netAmplitude )
    for ( let v of wave ) {
        v.re *= coef
        v.im *= coef
    }
}