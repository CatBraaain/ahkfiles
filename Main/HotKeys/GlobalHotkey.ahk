#Include "../Modules/Utils.ahk"
#Include "../../Env.ahk"

; https://learn.microsoft.com/en-us/windows/win32/inputdev/virtual-key-codes
#HotIf !IsGameWindow()
    [:: Send("{-}")
    ]:: Send("{BS}")
    `;:: return
    ':: Send("{`;}")
    +1:: Send("{!}")
    +2:: Send("{@}")
    +3:: Send("{#}")
    +4:: Send("{$}")
    +5:: Send("{`%}")
    +6:: Send("{^}")
    +7:: Send("{&}")
    +8:: Send("{*}")
    +9:: Send("{(}")
    +0:: Send("{)}")
    +q:: Send("{Esc}")
    +w:: Send("{Home}")
    +e:: Send("{Up}")
    +r:: Send("{End}")
    +t:: Send("{{}")
    +y:: Send("{}}")
    +u:: Send("{[}")
    +i:: Send("{]}")
    +o:: Send("{`"}")
    +p:: Send("{'}")
    +[:: Send("{_}")
    +]:: Send("{BS}")
    +a:: Send("^{Left}")
    +s:: Send("{Left}")
    +d:: Send("{Down}")
    +f:: Send("{Right}")
    +g:: Send("^{Right}")
    +h:: Send("{+}")
    +j:: Send("{(}")
    +k:: Send("{)}")
    +l:: Send("{=}")
    +':: Send("{:}")
    +z:: Send("{Click}")
    +x:: Send("{BS}")
    +c:: Send("{Enter}")
    +v:: Send("{`%}")
    +b:: Send("{^}")
    +n:: Send("{&}")
    +m:: Send("{*}")

    <+Up:: Send("{PgUp}")
    <+Left:: Send("{Home}")
    <+Down:: Send("{PgDn}")
    <+Right:: Send("{End}")

    +!w:: Send("+{Home}")
    +!e:: Send("+{Up}")
    +!r:: Send("+{End}")
    +!a:: Send("+{Left 2}")
    +!s:: Send("+{Left}")
    +!d:: Send("+{Down}")
    +!f:: Send("+{Right}")
    +!g:: Send("+{Right 2}")
    +!Up:: Send("+{PgUp}")
    +!Left:: Send("+{Home}")
    +!Down:: Send("+{PgDn}")
    +!Right:: Send("+{End}")

    `; & q:: Send("{Q}")
    `; & w:: Send("{W}")
    `; & e:: Send("{E}")
    `; & r:: Send("{R}")
    `; & t:: Send("{T}")
    `; & y:: Send("{Y}")
    `; & u:: Send("{U}")
    `; & i:: Send("{I}")
    `; & o:: Send("{O}")
    `; & p:: Send("{P}")
    `; & a:: Send("{A}")
    `; & s:: Send("{S}")
    `; & d:: Send("{D}")
    `; & f:: Send("{F}")
    `; & g:: Send("{G}")
    `; & h:: Send("{H}")
    `; & j:: Send("{J}")
    `; & k:: Send("{K}")
    `; & l:: Send("{L}")
    `; & z:: Send("{Z}")
    `; & x:: Send("{X}")
    `; & c:: Send("{C}")
    `; & v:: Send("{V}")
    `; & b:: Send("{B}")
    `; & n:: Send("{N}")
    `; & m:: Send("{M}")

    1:: Send("{Numpad1}")
    2:: Send("{Numpad2}")
    3:: Send("{Numpad3}")
    4:: Send("{Numpad4}")
    5:: Send("{Numpad5}")
    6:: Send("{Numpad6}")
    7:: Send("{Numpad7}")
    8:: Send("{Numpad8}")
    9:: Send("{Numpad9}")
    0:: Send("{Numpad0}")

#HotIf IsTenkeyMode
    a:: Send("{Numpad1}")
    s:: Send("{Numpad2}")
    d:: Send("{Numpad3}")
    f:: Send("{Numpad4}")
    g:: Send("{Numpad5}")
    h:: Send("{Numpad6}")
    j:: Send("{Numpad7}")
    k:: Send("{Numpad8}")
    l:: Send("{Numpad9}")
    `;:: Send("{Numpad0}")

#HotIf
F1::Backspace
F2::Enter
F3::Delete

global IsTenkeyMode := false
!vk14:: global IsTenkeyMode := !IsTenkeyMode
vk14:: Send("{vkF3}") ; vk14 is CapsLock, vkF3 is ime-toggle

LAlt:: {
    Send("{vk1C}")
    Send("{LAlt Down}")
    KeyWait("LAlt")
    Send("{LAlt Up}")
    Send("{vk99}") ; Send an unassigned key to avoid changing focus
}
~RAlt:: Send("{vk99}") ; Send an unassigned key to avoid changing focus

; !e:: ShowApp("explorer.exe", "ahk_class CabinetWClass")
!p:: Pause()
!k:: KeyHistory
; !c:: ShowApp("C:\Program Files (x86)\Google\Chrome\Application\chrome.exe", "Google Chrome")
!Esc:: MsgWinTitle()
!Delete:: Suspend()

~^w:: CloseSaveDialog()
^+w:: Send("!{F4}")
^+a:: Send("^{Left}+^{Right}")
^+d:: DeleteRow()
^d:: DuplicateRow()
^+z:: Send("^y")
^Space:: Send("{Enter}")
^+Delete:: ExitApp()

#InputLevel 1
:ox:nme:: SendInput("{vk1A}{Text}" . EMAIL)
:ox?:/ndash:: Send("–")
:ox?:/mdash:: Send("—")
#InputLevel 0
