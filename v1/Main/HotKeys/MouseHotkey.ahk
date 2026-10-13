XButton1::
    Send, ^w
    CloseSaveDialog()
return

XButton2::
    Send, {LCtrl Down}{LButton Down}
    ClipCursor(false)
return

XButton2 Up::
    Send, {LButton Up}{LCtrl Up}
    CoordMode, Mouse, Screen
    MouseGetPos, MouseX, MouseY
    if (0 <= MouseX && MouseX <= A_ScreenWidth && 0 <= MouseY && MouseY <= A_ScreenHeight) {
        ClipCursor(true, 0, 0, A_ScreenWidth, A_ScreenHeight)
    } else {
        ClipCursor(false, 0, 0, 0, 0)
    }
return

WheelRight::Send, ^{Tab}
WheelLeft::Send, ^+{Tab}

#InputLevel 1
^WheelRight::
    Send, {LButton Up}
    Send, {LCtrl Up}
    Send, #+{Right}
    Send, {LCtrl Down}
return
^WheelLeft::
    Send, {LCtrl Up}
    Send, #+{Left}
    Send, {LCtrl Down}
return
#InputLevel 0
