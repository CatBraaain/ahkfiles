; https://kts.sakaiweb.com/virtualkeycodes.html
#If !IsGameWindow()
    [:: Send {-}
    ]:: Send {BS}
    `;:: Send {}
    ':: Send {`;}
    +1:: Send {!}
    +2:: Send {@}
    +3:: Send {#}
    +4:: Send {$}
    +5:: Send {`%}
    +6:: Send {^}
    +7:: Send {&}
    +8:: Send {*}
    +9:: Send {(}
    +0:: Send {)}
    +q:: Send {Esc}
    +w:: Send {Home}
    +e:: Send {Up}
    +r:: Send {End}
    +t:: Send {{}
    +y:: Send {}}
    +u:: Send {[}
    +i:: Send {]}
    +o:: Send {"} ; this is workarround comment for formatter bug"}
    +p:: Send {'}
    +[:: Send {_}
    +]:: Send {BS}
    +a:: Send ^{Left}
    +s:: Send {Left}
    +d:: Send {Down}
    +f:: Send {Right}
    +g:: Send ^{Right}
    +h:: Send {+}
    +j:: Send {(}
    +k:: Send {)}
    +l:: Send {=}
    +':: Send {:}
    +z:: Send {BS}
    +x:: Send {Enter}
    +c:: Send {Delete}
    +v:: Send {`%}
    +b:: Send {^}
    +n:: Send {&}
    +m:: Send {*}

    <+Up:: Send {PgUp}
    <+Left:: Send {Home}
    <+Down:: Send {PgDn}
    <+Right:: Send {End}

    +!w:: Send +{Home}
    +!e:: Send +{Up}
    +!r:: Send +{End}
    +!a:: Send +^{Left}
    +!s:: Send +{Left}
    +!d:: Send +{Down}
    +!f:: Send +{Right}
    +!g:: Send +^{Right}
    +!Up:: Send +{PgUp}
    +!Left:: Send +{Home}
    +!Down:: Send +{PgDn}
    +!Right:: Send +{End}

    `; & q:: Send {Q}
    `; & w:: Send {W}
    `; & e:: Send {E}
    `; & r:: Send {R}
    `; & t:: Send {T}
    `; & y:: Send {Y}
    `; & u:: Send {U}
    `; & i:: Send {I}
    `; & o:: Send {O}
    `; & p:: Send {P}
    `; & a:: Send {A}
    `; & s:: Send {S}
    `; & d:: Send {D}
    `; & f:: Send {F}
    `; & g:: Send {G}
    `; & h:: Send {H}
    `; & j:: Send {J}
    `; & k:: Send {K}
    `; & l:: Send {L}
    `; & z:: Send {Z}
    `; & x:: Send {X}
    `; & c:: Send {C}
    `; & v:: Send {V}
    `; & b:: Send {B}
    `; & n:: Send {N}
    `; & m:: Send {M}

#If IsTenkeyMode
    a:: Send {Numpad1}
    s:: Send {Numpad2}
    d:: Send {Numpad3}
    f:: Send {Numpad4}
    g:: Send {Numpad5}
    h:: Send {Numpad6}
    j:: Send {Numpad7}
    k:: Send {Numpad8}
    l:: Send {Numpad9}
    `;:: Send {Numpad0}

#If
F1::Backspace
F2::Enter
F3::Delete

!sc03a::IsTenkeyMode:=!IsTenkeyMode
sc03a::Send {vkF3} ;CapsLock全角半角
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
#InputLevel 0

