#Requires AutoHotkey v1.1.33+
#NoEnv
#SingleInstance Force
#UseHook
#Warn All

if not A_IsAdmin {
    ToolTipEx("WARNING: Not running as administrator.", 5000)
}

#Include %A_ScriptDir%\..\Env.ahk

InstallKeybdHook
InstallMouseHook
A_HotkeyInterval := 2000
A_MaxHotkeysPerInterval := 200
Process, Priority,, Realtime
DetectHiddenWindows, On
SetWorkingDir, %A_ScriptDir%
SetTitleMatchMode, RegEx
SetNumLockState, AlwaysOn
SetCapsLockState, AlwaysOff
SetScrollLockState, AlwaysOff
SetDefaultMouseSpeed, 0
KeyHistory, 100

; Modules are included before hotkeys because in v1.1 the auto-execute
; section ends at the first hotkey definition.
#Include %A_ScriptDir%\Modules\ClipboardHistory.ahk
#Include %A_ScriptDir%\Modules\AutoHankaku.ahk
#Include %A_ScriptDir%\Modules\HotClick.ahk
#Include %A_ScriptDir%\Modules\MenuTray.ahk
#Include %A_ScriptDir%\Modules\MonitorCursorGuard.ahk
#Include %A_ScriptDir%\Modules\AutoReload.ahk

SetMenuTray()
; SetupHotClick()
StartClipboardHistory()
AutoMonitorCursorGuard()
AutoHankaku()
AutoReload()

; Initialized here because in v1.1 top-level assignments after the first
; hotkey definition do not run at load time.
IsTenkeyMode := false
SetKeyDelay, 20

#Include %A_ScriptDir%\HotKeys\LocalHotkey.ahk
#Include %A_ScriptDir%\HotKeys\GlobalHotkey.ahk
#Include %A_ScriptDir%\HotKeys\MouseHotkey.ahk
