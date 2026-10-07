#Include "WinHook.ahk"

^!c:: {
    static shouldClipCursor := true
    AutoMonitorCursorGuard(shouldClipCursor := !shouldClipCursor)
}

AutoMonitorCursorGuard(enable := true) {
    static cursorGuardHook := ShellHook(
        [
            HSHELL_WINDOWACTIVATED,
            HSHELL_MONITORCHANGED,
            HSHELL_RUDEAPPACTIVATED
        ],
        SetMonitorCursorGuard
    )
    if (enable) {
        cursorGuardHook.Enables(true)
    } else {
        cursorGuardHook.Enables(false)
        ClipCursor(False)
    }
}

SetMonitorCursorGuard(hwnd) {
    ; hwnd is the window announced by ShellHook, but the monitor is derived
    ; from the active window to keep the previous behavior.
    index := GetActiveMonitorIndex()
    if (index !== "") {
        MonitorGet(index, &left, &top, &right, &bottom)
        ClipCursor(True, left, top, right, bottom)
    }
}

GetActiveMonitorIndex() {
    count := MonitorGetCount()
    loop count {
        try {

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
        } catch {
            ;
        }
    }
    return ""
}

ClipCursor(shouldClip := True, x1 := 0, y1 := 0, x2 := 1, y2 := 1) {
    if (!shouldClip) {
        return DllCall("ClipCursor", "Ptr", 0)
    }
    R := Buffer(16, 0), NumPut("Int", x1, R, 0), NumPut("Int", y1, R, 4), NumPut("Int", x2, R, 8),
    NumPut("Int", y2, R, 12)
    return DllCall("ClipCursor", "Ptr", R)
}
