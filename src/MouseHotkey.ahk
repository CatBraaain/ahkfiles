#Include "Utils.ahk"
#Include "MonitorCursorGuard.ahk"

XButton1:: {
    Send("^w")
    CloseSaveDialog()
}

XButton2:: {
    Send("{LCtrl Down}{LButton Down}")
    ClipCursor(False)
}

XButton2 Up:: {
    Send("{LButton Up}{LCtrl Up}")
    CoordMode("Mouse", "Screen")
    MouseGetPos(&MouseX, &MouseY)
    if (0 <= MouseX && MouseX <= A_ScreenWidth && 0 <= MouseY && MouseY <= A_ScreenHeight) {
        ClipCursor(True, 0, 0, A_ScreenWidth, A_ScreenHeight)
    } else {
        ClipCursor(False, 0, 0, 0, 0)
    }
}

WheelRight:: Send("^{Tab}")
WheelLeft:: Send("^+{Tab}")

#InputLevel 1
^WheelRight:: {
    Send("{LButton Up}")
    Send("{LCtrl Up}")
    Send("#+{Right}")
    Send("{LCtrl Down}")
}
^WheelLeft:: {
    Send("{LCtrl Up}")
    Send("#+{Left}")
    Send("{LCtrl Down}")
}
#InputLevel 0
