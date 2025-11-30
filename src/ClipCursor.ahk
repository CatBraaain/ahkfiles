#Include WinHook.ahk

^!c:: {
    static shouldClipCursor := true
    shouldClipCursor := !shouldClipCursor
    AutoMonitorCursorGuard(shouldClipCursor)
}

AutoMonitorCursorGuard(enable := true) {
    static windowActivatedHook := ShellHook(
        [
            HSHELL_WINDOWACTIVATED,
            HSHELL_MONITORCHANGED,
            HSHELL_RUDEAPPACTIVATED
        ],
        SetMonitorCursorGuard
    )
    if (enable) {
        windowActivatedHook.Enables(true)
    } else {
        windowActivatedHook.Enables(false)
        ClipCursor(False)
    }
}

SetMonitorCursorGuard() {
    index := GetActiveMonitorIndex()
    if (index !== "") {
        MonitorGet(index, &left, &top, &right, &bottom)
        ClipCursor(True, left, top, right, bottom)
    }
}

GetActiveMonitorIndex() {
    count := MonitorGetCount()
    loop count {
        MonitorGet(A_Index, &left, &top, &right, &bottom)
        WinGetPos(&x, &y, &w, &h, "a")
        center := { x: x + w / 2, y: y + h / 2 }
        isWindowCenterInMonitor := (
            left <= center.x
            && center.x <= right
            && top <= center.y
            && center.y < bottom
        )
        if (isWindowCenterInMonitor) {
            return A_Index
        }
    }
    return ""
}

ClipCursor(shouldClip := True, x1 := 0, y1 := 0, x2 := 1, y2 := 1) {
    R := Buffer(16, 0), NumPut("UPtr", x1, R.Ptr + 0), NumPut("UPtr", y1, R.Ptr + 4), NumPut("UPtr", x2, R.Ptr + 8),
    NumPut("UPtr", y2, R.Ptr + 12)
    return shouldClip ? DllCall("ClipCursor", "UInt", R.Ptr) : DllCall("ClipCursor", "UInt", 0)
}
