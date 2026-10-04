#Requires AutoHotkey >=2.0 <3.0

#SingleInstance Force
#NoTrayIcon

SetDisplayIdleTimeoutSeconds(1)

>!l:: SetDisplayIdleTimeoutSeconds(1)
+>!l:: SetDisplayIdleTimeoutSeconds(0)

^+Delete:: ExitApp()

SetDisplayIdleTimeoutSeconds(seconds) {
    RunWait(A_ComSpec . " /c powercfg /setacvalueindex SCHEME_CURRENT SUB_VIDEO VIDEOIDLE " . seconds, , "Hide")
    RunWait(A_ComSpec . " /c powercfg /setdcvalueindex SCHEME_CURRENT SUB_VIDEO VIDEOIDLE " . seconds, , "Hide")
    RunWait(A_ComSpec . " /c powercfg /setactive SCHEME_CURRENT", , "Hide")
    label := seconds = 0 ? "off" : seconds . "s"
    ToolTipEx("Display timeout: " . label, 2000)
}

ToolTipEx(str, delay := 0) {
    CoordMode("ToolTip", "Screen")
    ToolTip(str, A_ScreenWidth // 2, A_ScreenHeight // 2)
    SetTimer(() => (ToolTip(""), SetTimer(unset, 0)), delay)
}
