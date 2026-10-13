#Requires AutoHotkey v1.1.33+
#NoEnv
#SingleInstance Force
#UseHook
#Warn All
#Persistent
SetBatchLines, -1
ListLines, Off

if not A_IsAdmin {
    ToolTipEx("WARNING: Not running as administrator.", 5000)
}

#Include %A_ScriptDir%\..\Env.ahk

#InstallKeybdHook
#InstallMouseHook
#HotkeyInterval 2000
#MaxHotkeysPerInterval 200
#KeyHistory 100
Process, Priority,, Realtime
DetectHiddenWindows, On
SetWorkingDir, %A_ScriptDir%
SetTitleMatchMode, RegEx
SetNumLockState, AlwaysOn
SetCapsLockState, AlwaysOff
SetScrollLockState, AlwaysOff
SetDefaultMouseSpeed, 0

; Each file is included exactly once from here instead of including
; dependencies from each file. Function-only files are included before the
; auto-execute statements; files starting with a hotkey are included after
; the final Exit so that they end the auto-execute section instead of
; cutting the initialization short.
#Include %A_ScriptDir%\Modules\WinHook.ahk
#Include %A_ScriptDir%\Modules\Utils.ahk
#Include %A_ScriptDir%\Modules\ClipboardHistory.ahk
#Include %A_ScriptDir%\Modules\AutoHankaku.ahk
#Include %A_ScriptDir%\Modules\HotClick.ahk
#Include %A_ScriptDir%\Modules\MenuTray.ahk
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
; Moved from inside the HotKeys files because in v1.1 top-level statements
; between hotkey definitions do not run either.
SetKeyDelay, 20

; v1-era pattern: end the auto-execute section explicitly, then include the
; files that start with a hotkey definition.
Exit

#Include %A_ScriptDir%\Modules\MonitorCursorGuard.ahk
#Include %A_ScriptDir%\HotKeys\LocalHotkey.ahk
#Include %A_ScriptDir%\HotKeys\GlobalHotkey.ahk
#Include %A_ScriptDir%\HotKeys\MouseHotkey.ahk

#Include %A_ScriptDir%\HotKeys\LocalHotkey.ahk
#Include %A_ScriptDir%\HotKeys\GlobalHotkey.ahk
#Include %A_ScriptDir%\HotKeys\MouseHotkey.ahk
