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
}
