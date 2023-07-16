F1::Backspace
F2::Enter
F3::Delete

XButton1::
	Send ^w
    CloseSaveDialog()
    return

XButton2::
    Send {LCtrl Down}{LButton Down}
    ClipCursor(False, 0, 0, 0, 0)
    return
XButton2 Up::
    Send {LButton Up}{LCtrl Up}
    CoordMode,Mouse,Screen
    MouseGetPos, MouseX, MouseY
    if(0<=MouseX AND MouseX<=A_ScreenWidth AND 0<=MouseY AND MouseY<=A_ScreenHeight){
        ClipCursor(True, 0, 0, A_ScreenWidth, A_ScreenHeight)
    }else{
        ClipCursor(False, 0, 0, 0, 0)
    }
    return

WheelRight::Send ^{Tab}
WheelLeft::Send ^+{Tab}

#InputLevel 1
^WheelRight::
    Send {LButton Up}
    Send {LCtrl Up}
    Send #+{Right}
    Send {LCtrl Down}
    return
^WheelLeft::
    Send {LCtrl Up}
    Send #+{Left}
    Send {LCtrl Down}
    return
#InputLevel 0

; !sc03a::tenkeytoggle:=!tenkeytoggle
!CapsLock::tenkeytoggle:=!tenkeytoggle
; sc03a::Send {vkF3} ;CapsLock全角半角
CapsLock::Send {vkF3} ;CapsLock全角半角
LAlt::
    if GetKeyState("LAlt","P"){
        Send {vk1D} ;無変換
    }
    Send {LAlt Down}
    return
LAlt Up::Send {LAlt Up}
~RAlt::Send {vkE8} ;無意味

; Backspace::
;     Send {Backspace}
;     KeyWait, Backspace, T0.2
;     while ErrorLevel {
;         Send +^{Left}{Backspace}
;         KeyWait, Backspace, T0.1
;     }
;     KeyWait, Backspace
;     return

!e::ShowApp("explorer.exe", "ahk_class CabinetWClass")
!r::Send #r ;run command
!t::ShowApp("Scripts\Timer.ahk","Scripts\Timer.ahk")
!p::Pause
!a::BthDvc("AirPods Pro",1)
!+a::BthDvc("AirPods Pro",0)
; !s::SendTo("#s","ahk_class Shell_TrayWnd")
; !+s::Run ms-settings:
!d::Send #d ;desktop
!g::ShowApp("Materials\GIMP.lnk", "GIMP (GNU Image Manipulation Program)")
!k::KeyHistory
!i::ShowImg("Materials\ANSISO BackSlash Mod.png")
!z::ExtractZip()
!c::ShowApp("calc.exe","電卓")
; !c::ShowApp("C:\Program Files (x86)\Google\Chrome\Application\chrome.exe","Google Chrome")
; !v::ShowApp("C:\Users\PRO\AppData\Local\Programs\Microsoft VS Code\Code.exe","Visual Studio Code")
!n::ShowApp("notepad.exe","無題 - メモ帳")
!Esc::MsgWinTitle()
!Delete::Suspend

; ^q::^/
~^w::CloseSaveDialog()
^+w::Send !{F4} ;Ctrl+Shift+W→Alt+F4
; ^e::DuplicateRow()
^+a::Send ^{Left}+^{Right}
^+d::DeleteRow()
^d::DuplicateRow()
^y::return
^+z::Send ^y ;Ctrl Shift Z => Ctrl Y
^Space::Send {Enter} ;Ctrl+Space→Enter
^+Delete::ExitApp

>>!Up:: Send {↑}
>>!Down:: Send {↓}
>>!Left:: Send {←}
>>!Right:: Send {→}

;HotString
#InputLevel 1
:ox:nme:: SendInput {F13}{Text}%EMAIL%
:co:Ahk::{F13}AutoHotkey
:co:Lg::{F13}Logger.log(
#InputLevel 0
