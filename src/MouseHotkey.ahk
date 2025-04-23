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

!CapsLock::tenkeytoggle:=!tenkeytoggle
CapsLock::Send {vkF3} ;CapsLock全角半角
~LAlt::
    Send {vk1D} ;無変換
    KeyWait LAlt
return
~RAlt::Send {vkE8} ;無意味

; !e::ShowApp("explorer.exe", "ahk_class CabinetWClass")
!p::Pause
!b::ConnectBT("soundcore Liberty 4",1)
!+b::ConnectBT("soundcore Liberty 4",0)
!k::KeyHistory
; !c::ShowApp("C:\Program Files (x86)\Google\Chrome\Application\chrome.exe","Google Chrome")
; !v::ShowApp("C:\Users\PRO\AppData\Local\Programs\Microsoft VS Code\Code.exe","Visual Studio Code")
!Esc::MsgWinTitle()
!Delete::Suspend

~^w::CloseSaveDialog()
^+w::Send !{F4} ;Ctrl+Shift+W→Alt+F4
; ^e::DuplicateRow()
^+a::Send ^{Left}+^{Right}
^+d::DeleteRow()
^d::DuplicateRow()
^+z::Send ^y ;Ctrl Shift Z => Ctrl Y
^Space::Send {Enter} ;Ctrl+Space→Enter
^+Delete::ExitApp

;HotString
#InputLevel 1
:ox:nme:: SendInput {F13}{Text}%EMAIL%
:co:Ahk::{F13}AutoHotkey
:co:Lg::{F13}Logger.log(
#InputLevel 0
