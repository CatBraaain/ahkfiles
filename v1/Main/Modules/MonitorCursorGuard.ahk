#Include %A_ScriptDir%\Modules\WinHook.ahk

^!c::
    ToggleCursorGuard() {
        static shouldClipCursor := true
        shouldClipCursor := !shouldClipCursor
        AutoMonitorCursorGuard(shouldClipCursor)
    }

AutoMonitorCursorGuard(enable := true) {
    global HSHELL_WINDOWACTIVATED, HSHELL_MONITORCHANGED, HSHELL_RUDEAPPACTIVATED
    static cursorGuardHook
    if (cursorGuardHook = "") {
        cursorGuardHook := ShellHook([HSHELL_WINDOWACTIVATED, HSHELL_MONITORCHANGED, HSHELL_RUDEAPPACTIVATED], Func("SetMonitorCursorGuard"))
    }
    if (enable) {
        cursorGuardHook.Enables(true)
    } else {
        cursorGuardHook.Enables(false)
        ClipCursor(false)
    }
}

SetMonitorCursorGuard(hwnd) {
    ; hwnd is the window announced by ShellHook, but the monitor is derived
    ; from the active window to keep the previous behavior.
    index := GetActiveMonitorIndex()
    if (index != "") {
        MonitorGetCoords(index, left, top, right, bottom)
        ClipCursor(true, left, top, right, bottom)
    }
}

GetActiveMonitorIndex() {
    SysGet, monitorCount, MonitorCount
    loop %monitorCount% {
        MonitorGetCoords(A_Index, left, top, right, bottom)
        WinGetPos, x, y, w, h, A
        if (ErrorLevel) {
            continue
        }
        center := {"x": x + w / 2, "y": y + h / 2}
        isWindowCenterInMonitor := (
            left <= center["x"]
            && center["x"] <= right
            && top <= center["y"]
            && center["y"] < bottom
        )
        if (isWindowCenterInMonitor) {
            return A_Index
        }
    }
    return ""
}

MonitorGetCoords(index, ByRef left, ByRef top, ByRef right, ByRef bottom) {
    SysGet, mon, Monitor, %index%
    left := monLeft
    top := monTop
    right := monRight
    bottom := monBottom
}

ClipCursor(shouldClip := true, x1 := 0, y1 := 0, x2 := 1, y2 := 1) {
    if (!shouldClip) {
        return DllCall("ClipCursor", "Ptr", 0)
    }
    VarSetCapacity(R, 16, 0)
    NumPut(x1, R, 0, "Int")
    NumPut(y1, R, 4, "Int")
    NumPut(x2, R, 8, "Int")
    NumPut(y2, R, 12, "Int")
    return DllCall("ClipCursor", "Ptr", &R)
}
