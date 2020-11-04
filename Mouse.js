class Mouse {
    static x = 0
    static y = 0
    static rightDown = false
    static leftDown = false
}

window.addEventListener( "contextmenu", e => e.preventDefault() )
window.addEventListener( "mousedown", e => { Mouse.leftDown = true } )
window.addEventListener( "mouseup", e => Mouse.leftDown = false )
window.addEventListener( "mousemove", e => {
    Mouse.x = e.clientX
    Mouse.y = e.clientY
} )
