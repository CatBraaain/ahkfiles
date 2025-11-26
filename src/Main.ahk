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

global ShouldClipCursor := true
global IsOnAltTabWindow := false
global IsTenkeyMode := false
global Games :=
    "PAYDAY 2|Warlander|Battlefield|Robocraft|Minecraft|HalfDead2|Counter-Strike|CrowFPS|MilkChoco|PortalWars|Monster Hunter|Unrailed!"
global ChromeGames :=
    "CrazyGames|Skillfite.io|Sword Masters|arras.io|diep.io|STUG - MultiPlayer Tank Battle|Krunker|Ships 3D"

SetMenuTray()
; SetupHotClick()
StartClipboardHistory()
global ShellHookMsgId := StartClipCursor()

Exit() ; Exit Auto-Execute

#Include "GlobalHotkey.ahk"
#Include "MouseHotkey.ahk"
#Include "LocalHotkey.ahk"

#Include "ClipboardHistory.ahk"
#Include "ClipCursor.ahk"
#Include "HotClick.ahk"
#Include "MenuTraySetting.ahk"
#Include "Utils.ahk"
