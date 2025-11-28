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

#Include "GlobalHotkey.ahk"
#Include "MouseHotkey.ahk"
#Include "LocalHotkey.ahk"

#Include "ClipboardHistory.ahk"
#Include "ClipCursor.ahk"
#Include "HotClick.ahk"
#Include "MenuTray.ahk"
#Include "Utils.ahk"

SetMenuTray()
; SetupHotClick()
StartClipboardHistory()
ActiveMonitorClipCursor()
