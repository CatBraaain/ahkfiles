#Requires AutoHotkey >=2.0 <3.0

#SingleInstance Force
#NoTrayIcon

SetScreenLock(true)

>!l:: SetScreenLock(true)
+>!l:: SetScreenLock(false)

^+Delete:: ExitApp()

SetScreenLock(enabled) {
    timeout := enabled ? 1 : 0
    RunWait(A_ComSpec . " /c powercfg /setacvalueindex SCHEME_CURRENT SUB_VIDEO VIDEOIDLE " . timeout, , "Hide")
    RunWait(A_ComSpec . " /c powercfg /setdcvalueindex SCHEME_CURRENT SUB_VIDEO VIDEOIDLE " . timeout, , "Hide")
    RunWait(A_ComSpec . " /c powercfg /setactive SCHEME_CURRENT", , "Hide")
    ; Omitting the request type removes the override.
    for processName in ["obs64.exe", "msrdc.exe"] {
        override := enabled ? "PROCESS " . processName . " DISPLAY" : "PROCESS " . processName
        RunWait(A_ComSpec . " /c powercfg /requestsoverride " . override, , "Hide")
    }
    timeoutLabel := timeout = 0 ? "off" : timeout . "s"
    overrideLabel := enabled ? "on" : "off"
    ToolTipEx("Display timeout: " . timeoutLabel . "`nRequest override: " . overrideLabel, 2000)
}

ToolTipEx(str, delay := 0) {
    CoordMode("ToolTip", "Screen")
    ToolTip(str, A_ScreenWidth // 2, A_ScreenHeight // 2)
    SetTimer(() => (ToolTip(""), SetTimer(unset, 0)), delay)
}
