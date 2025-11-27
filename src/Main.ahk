#Requires AutoHotkey v1.1

#NoEnv
SetBatchLines, -1
ListLines, Off
#Persistent
#SingleInstance, Force

#InstallKeybdHook
#InstallMouseHook
#UseHook
#HotkeyInterval, 2000
#MaxHotkeysPerInterval, 200

#Include, ../Env.ahk

Process, Priority,, Realtime
DetectHiddenWindows, On
SetWorkingDir %A_ScriptDir%
SetTitleMatchMode, RegEx
SetNumLockState AlwaysOn
SetCapsLockState AlwaysOff
SetDefaultMouseSpeed 0
SetBatchLines 10ms

SetMenuTray()
; PrepareForClickCoordHotkey()
StartClipboardHistory()
ShellHookMsgId := StartClipCursor()
ShouldClipCursor := true

IsTenkeyMode:= false
Games := "PAYDAY 2|Warlander|Battlefield|Robocraft|Minecraft|HalfDead2|Counter-Strike|CrowFPS|MilkChoco|PortalWars|Monster Hunter|Unrailed!"
ChromeGames := "CrazyGames|Skillfite.io|Sword Masters|arras.io|diep.io|STUG - MultiPlayer Tank Battle|Krunker|Ships 3D"

Exit ;Exit Auto-Execute

#Include %A_ScriptDir%

#Include KeyboardHotkey.ahk
#Include MouseHotkey.ahk
#Include LocalHotkey.ahk

#Include ClickCoord.ahk
#Include ClipboardHistory.ahk
#Include ClipCursor.ahk
#Include MenuTraySetting.ahk
#Include Utils.ahk

