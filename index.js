// BOILER PLATE
const canvasWidth = 800
const canvasHeight = 800
window.onload = () => {
    console.log( "Hi there." )
    resizeCanvas( canvasWidth, canvasHeight, 2 )
    const ctx = canvas.getContext( "2d" )
    ctx.scale( 2, 2 )
    loop()
}

function resizeCanvas( height, width, pixelDensity ) {
    canvas.style.width = width + "px"
    canvas.style.height = height + "px"
    canvas.width = width * pixelDensity
    canvas.height = height * pixelDensity
}

const maxFrameDt = 16
let lastFrameTime = 0
let counter = 0
function loop() {
    let time = performance.now()
    let dt = Math.min( time - lastFrameTime, maxFrameDt )
    update( dt )
    render( dt )
    lastFrameTime = time
    requestAnimationFrame( loop )
}
// END BOILER PLATE

const maxVelocity = 10
const minDistance = 10
const coulombForceScale = 1000
const electrons = []
const protons = []

{
    let radius = 10
    for ( let x = -radius; x <= radius; x++ ) {
        for ( let y = -radius; y <= radius; y++ ) {
            // if ( Math.abs( y ) < 7 && x > -7 ) continue
            if ( Math.max( Math.abs( x ), Math.abs( y ) ) < 5 ) continue
            protons.push( { x: 405 + 20 * x, y: 405 + 20 * y, vx: 0, vy: 0, fx: 0, fy: 0, q: 1, mInv: 0 } )
            if ( y < 0 ) continue
            electrons.push( { x: 405 + 20 * x + 1, y: 405 + 20 * y, vx: 0, vy: 1, fx: 0, fy: 0, q: -1, mInv: 1 } )
        }
    }
}

window.addEventListener( "mousedown", e => {
    electrons.push( { x: Mouse.x, y: Mouse.y, vx: 0, vy: 0, fx: 0, fy: 0, q: -1, mInv: 51 }, )
} )

function render( dt ) {
    const ctx = canvas.getContext( "2d" )
    ctx.fillStyle = "black"//"#272822"
    ctx.rect( 0, 0, canvas.width, canvas.height )
    ctx.fill()

    for ( let charges of [ protons, electrons ] ) {
        for ( let charge of charges ) {
            ctx.fillStyle = charge.q < 0 ? "blue" : "red"
            ctx.beginPath()
            let r = Math.sqrt( Math.abs( charge.q ) ) * 4 * ( charge.q < 0 ? 0.8 : 1 )
            ctx.ellipse(
                charge.x, charge.y,
                r, r,
                0, 0,
                Math.PI * 2
            )
            ctx.closePath()
            ctx.fill()
        }
    }
}

function renderChargeDensity( histogram, bucketWidth, saturationPoint, alpha ) {
    const ctx = canvas.getContext( "2d" )

    let histWidth = canvasWidth / bucketWidth
    let histHeight = canvasHeight / bucketWidth
    let buckets = histWidth * histHeight
    for ( let i = 0; i < buckets; i++ )
        histogram[ i ] = ( histogram[ i ] ?? 0 ) * 0.7
    for ( let charge of electrons ) {
        let { x, y } = charge
        let i = Math.floor( x / bucketWidth )
        let j = Math.floor( y / bucketWidth )
        let histVal = histogram[ i + histWidth * j ] ?? 0
        histogram[ i + histWidth * j ] = histVal + charge.q
    }
    for ( let i = 0; i < histWidth; i++ ) {
        for ( let j = 0; j < histHeight; j++ ) {
            let histVal = histogram[ i + histWidth * j ]
            let channelVal = 255 * Math.abs( histVal ) / saturationPoint
            let a = alpha * channelVal / 255
            let color = histVal > 0 ? `rgba(${ channelVal }, 0, 0, ${ a })` : `rgba(0, 0, ${ channelVal }, ${ a })`
            let x = i * bucketWidth
            let y = j * bucketWidth
            ctx.beginPath()
            ctx.rect( x, y, bucketWidth, bucketWidth )
            ctx.fillStyle = color
            ctx.fill()
        }
    }
}

function applyCoulombForce( a, b ) {
    let dx = a.x - b.x
    let dy = a.y - b.y
    let rSquared = Math.max( dx * dx + dy * dy, minDistance ** 2 )
    let r = Math.sqrt( rSquared )
    let ndx = dx / r
    let ndy = dy / r
    let fMag = a.q * b.q * coulombForceScale / rSquared
    let fx = ndx * fMag
    let fy = ndy * fMag
    a.fx += fx
    a.fy += fy
    b.fx -= fx
    b.fy -= fy
}

function update( dt ) {
    dt = dt / 100

    for ( let i = 0; i < electrons.length; i++ ) {
        let a = electrons[ i ]
        for ( let j = i + 1; j < electrons.length; j++ )
            applyCoulombForce( a, electrons[ j ] )
        for ( let j = 0; j < protons.length; j++ )
            applyCoulombForce( a, protons[ j ] )
    }

    for ( let charge of electrons ) {

        // if ( charge.y < 300 && charge.x < 600 )
        //     charge.fx += 5

        let ax = charge.fx * charge.mInv
        let ay = charge.fy * charge.mInv
        charge.vx += ax * dt
        charge.vy += ay * dt

        let vSquared = charge.vx ** 2 + charge.vy ** 2
        if ( vSquared > maxVelocity ** 2 ) {
            let v = Math.sqrt( vSquared )
            charge.vx *= maxVelocity / v
            charge.vy *= maxVelocity / v
        }

        charge.x += charge.vx * dt
        charge.y += charge.vy * dt
        charge.fx = 0
        charge.fy = 0

        if ( charge.x < 0 || charge.x > canvasWidth ) {
            charge.x -= charge.vx * dt
            charge.vx *= -1
        }

        if ( charge.y < 0 || charge.y > canvasHeight ) {
            charge.y -= charge.vy * dt
            charge.vy *= -1
        }
    }
}
