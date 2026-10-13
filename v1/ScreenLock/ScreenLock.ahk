#Requires AutoHotkey v1.1.33+
#NoEnv
#SingleInstance Force
#NoTrayIcon

if not A_IsAdmin {
    ToolTipEx("WARNING: Not running as administrator.", 5000)
}

SetScreenLock(true)

>!l::
    SetScreenLock(true)
return
+>!l::
    SetScreenLock(false)
return

^+Delete::ExitApp

SetScreenLock(enabled) {
    timeout := enabled ? 1 : 0
    RunWait, %ComSpec% /c powercfg /setacvalueindex SCHEME_CURRENT SUB_VIDEO VIDEOIDLE %timeout%,, Hide
    RunWait, %ComSpec% /c powercfg /setdcvalueindex SCHEME_CURRENT SUB_VIDEO VIDEOIDLE %timeout%,, Hide
    RunWait, %ComSpec% /c powercfg /setactive SCHEME_CURRENT,, Hide
    ; Omitting the request type removes the override.
    for i, processName in ["obs64.exe", "msrdc.exe"] {
        override := enabled ? "PROCESS " . processName . " DISPLAY" : "PROCESS " . processName
        RunWait, %ComSpec% /c powercfg /requestsoverride %override%,, Hide
    }
    timeoutLabel := timeout = 0 ? "off" : timeout . "s"
    overrideLabel := enabled ? "on" : "off"
    ToolTipEx("Display timeout: " . timeoutLabel . "`nRequest override: " . overrideLabel, 2000)
}

ToolTipEx(str, delay := 0) {
    CoordMode, ToolTip, Screen
    ToolTip, %str%, % A_ScreenWidth // 2, % A_ScreenHeight // 2
    SetTimer, ToolTipExClear, %delay%
}

ToolTipExClear() {
    ToolTip
    SetTimer, ToolTipExClear, Off
}
