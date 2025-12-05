#Requires AutoHotkey >=2.0 <3.0

#SingleInstance Force
#UseHook

#Include "../Env.ahk"

InstallKeybdHook()
InstallMouseHook()
A_HotkeyInterval := 2000
A_MaxHotkeysPerInterval := 200
ProcessSetPriority("Realtime")
DetectHiddenWindows(true)
SetWorkingDir(A_ScriptDir)
SetTitleMatchMode("RegEx")
SetNumLockState("AlwaysOn")
SetCapsLockState("AlwaysOff")
SetScrollLockState("AlwaysOff")
SetDefaultMouseSpeed(0)

#Include "HotKeys/GlobalHotkey.ahk"
#Include "HotKeys/MouseHotkey.ahk"
#Include "HotKeys/LocalHotkey.ahk"

#Include "Modules/ClipboardHistory.ahk"
#Include "Modules/AutoHankaku.ahk"
#Include "Modules/HotClick.ahk"
#Include "Modules/MenuTray.ahk"
#Include "Modules/MonitorCursorGuard.ahk"

SetMenuTray()
; SetupHotClick()
StartClipboardHistory()
AutoMonitorCursorGuard()
AutoHankaku()
