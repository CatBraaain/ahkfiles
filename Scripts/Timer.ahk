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

Process, Priority,, Realtime
SetMenuTray()
Menu, Tray, Icon, %A_ScriptDir%\..\Assets\TimerIcon.ico

Gui, +ToolWindow
Gui, Add, Button, gOnabe Default vOnabe, お鍋
Gui, Add, Button, gOfuro, お風呂
Gui, Add, Button, gCustom vCustom, カスタム
Gui, Add, Edit, vCustomValue gCustomInputEvent yp+2 x+0 w30,5
Gui, Show, AutoSize, Timer

Mnt := 0
Scd := 00
Exit ;Exit Auto-Execute

CustomInputEvent:
    GuiControl, -Default, Onabe
    GuiControl, +Default, Custom
return

Onabe:
    TimerFunc := Func("CountTime").Bind("360","1500")
    SetTimer, %TimerFunc%, 1000
    Gui, Cancel
return

Ofuro:
    TimerFunc := Func("CountTime").Bind("","900")
    SetTimer, %TimerFunc%, 1000
    Gui, Cancel
return

Custom:
    GUI, Submit
    CustomValue := Floor(CustomValue*60)
    TimerFunc := Func("CountTime").Bind("",CustomValue)
    SetTimer, %TimerFunc%, 1000
    Gui, Cancel
return

CountTime(s1,s2){
    global
    ScdCnt += 1
    Mnt := ScdCnt//60
    Scd := SubStr("0" . Mod(ScdCnt,60), -1)
    If(ScdCnt==s1){
        ToolTip(Mnt . ":" . Scd)
    }
    If(ScdCnt>=s2){
        msgbox % (s2//60) . "min"
        ExitApp
    }
    return
}

~RAlt::ToolTip(Mnt . ":" . Scd)
~RAlt Up::ToolTip

ToolTip(str,delay=0){
    ToolTip, %str%, A_ScreenWidth//2, A_ScreenHeight//2
    if delay
        SetTimer, RemoveToolTip, %delay%
}
RemoveToolTip:
    SetTimer, RemoveToolTip, Off
    Tooltip
return

#Include, %A_ScriptDir%\..\Plugins\MenuTraySetting.ahk
