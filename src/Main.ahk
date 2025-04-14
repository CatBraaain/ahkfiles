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

SetMenuTray()
PrepareForClickCoordHotkey()
StartClipboardHistory()
MsgNum := StartClipCursor()
clipCursorToggle := true

tenkeytoggle:= false
games := "PAYDAY 2|Warlander|Battlefield|Robocraft|Minecraft|HalfDead2|Counter-Strike|CrowFPS|MilkChoco|PortalWars|Monster Hunter|Unrailed!"
chromeGames := "CrazyGames - Google Chrome|Skillfite.io|Sword Masters - Google Chrome|arras.io - Google Chrome|diep.io - Google Chrome|STUG - MultiPlayer Tank Battle - Google Chrome|Krunker - Google Chrome"

toggle := false
Exit ;Exit Auto-Execute

#Include %A_ScriptDir%
#Include Functions.ahk
#Include ClickCoordHotkey.ahk
#Include ClipboardHistory.ahk
#Include ClipCursor.ahk
#Include GlobalHotkey.ahk
#Include KeyboardLayout.ahk
#Include LocalHotkey.ahk
#Include MenuTraySetting.ahk
