#If WinActive(" - AutoHotkey - Visual Studio Code")
    ~^s::
        keywait s
        keywait Ctrl
        reload
    return

#If WinActive(" - Visual Studio Code")
    ^WheelLeft:: Send !{Left}
    ^WheelRight:: Send !{Right}
    ~^g::Send {F13}
    ~^e::return
    ~^d::return
    ~^+d::return
    ~!c::return
    ~^!f::return
    ~^!+f::return
    ~!a::return
    ~!+a::return

#If WinActive(" – GIMP")
    ^Tab::Send {.}
    ^+Tab::Send {,}

#If WinActive("ahk_exe chrome.exe")
    ^t::
    ^l::
    ^n::
    ^+n::
        Send %A_ThisHotkey%
        Send {F13}
    return
    ^g::
        Send ^l
        Send {F13}
    return
    ^f::Send ^f^g ;find
    ^+f::Send +^g ;find
    ^b::Send ^d ;add bookmark
    ^+b::Send ^+o ;bookmark manager
    ~^r::CloseSaveDialog()

    ^s::
        Clipboard = ;
        Send ^c
        Send ^t
        ClipWait
        Send ^v{Enter}
    return

    ^+s::
        Send ^t
        Send {F13}
        Send chrome://settings/searchEngines
        Send {Enter}
    return

    F7::return ;カーソルブラウジング無効化

    !LButton::
        ClickLoopFlag := 1
        Loop{
            If(!ClickLoopFlag){
                break
            }
            Send {LButton}
        }
    return

    !RButton::
        ClickLoopFlag := 0
        ToolTip("!RButton")
        KeyWait Alt
        ToolTip
    return

#If WinActive("MAP.*HELLO CYCLING")
    WheelUp::Send {+}
    WheelDown::Send {-}

#If WinActive("note - Google Chrome")
    !F1:: ;テンプレート貼りつけ
        SendEvent ^a{BS}
        OnClipboardChange("UpdateClipArray",0)
        Old_ClipBoard := ClipBoardAll
        ClipBoard := ""
        ClipBoard := "目的`n`nスクリプト`n`nスクリプト解説`n`n参考`n`nあとがき"
        ClipWait
        SendEvent ^v
        SendEvent {Enter}
        ClipBoard := Old_ClipBoard
        OnClipboardChange("UpdateClipArray",1)
        SendEvent {PgUp 2}
        Sleep 200
        SendEvent ^!2{End}
        Sleep 200
        SendEvent {Enter}
        SendEvent {Down}^!2{End}{Enter}^!\{Enter 2}
        SendEvent {Down}^!2{End}{Enter}^!\{Enter 2}
        SendEvent {Down}^!2{End}{Enter}
        SendEvent {Down}^!2{End}{Enter}
    return

    ^vkF4::
    !vk19:: ;解除
        Send ^!0
    return
    ^1:: ;大見出し
    <!1::
        Send ^!2
    return
    ^2:: ;小見出し
    <!2::
        Send ^!3
    return
    ^3:: ;コード
    <!3::
        Send ^!\
    return
    ^4:: ;引用
    <!4::
        Send ^+>
    return
    ^5:: ;強調
    <!5::
        Send ^b
    return

#If WinActive("diep.io - Google Chrome") or WinActive("arras.io - Google Chrome")
    ^s::return
    q::e

    LAlt & q::!q
    LAlt & w::!w
    LAlt & e::!e
    LAlt & a::!a
    LAlt & s::!s
    LAlt & d::!d

    F11::
        SendEvent !+{Down}
        Sleep 100
        SendEvent {F11}
    return
    Esc::
        SendEvent {F11}
        SendEvent #{Up}
    return

#If WinActive("diep.io - Google Chrome")
    ~LAlt::
        SendEvent {m Up}
        ToolTip("F1::12277707 overload,hybrid`nF2::12207777 rocketeer,tritrapper`nF3::00067767 triplet`nF4::01157775 sprayer,spread`nF5::00077757 sniper")
        Keywait LAlt
        ToolTip
    return

    SetKeyDelay 20
    DiepStatus(inputstr){
        Sleep 50
        str = {Blind}{U Down}
        Loop, Parse, inputstr
        {
            str .= A_LoopField . "0"
        }
        str .= "{U Up}"
        SendEvent %str%
        SendEvent {m Down}{l Down}
    }
    <!F1::DiepStatus("565688888885656565656444444432132") ;12277707 overload,hybrid
    <!F2::DiepStatus("565688888885675675675675677713232") ;12207777 rocketeer,tritrapper
    <!F3::DiepStatus("565688888885656565656444444777777") ;00067767 triplet
    <!F4::DiepStatus("565688888565656565677777774444432") ;01157775 sprayer,spread
    <!F5::DiepStatus("565688888885656565656444444477777") ;00077757 sniper

#If WinActive("arras.io - Google Chrome")
    ~LAlt::
        SendEvent {m Up}
        ToolTip("F1::3309999000`nF2::0069999000`nF3::0099996000`nF4::0009999600`nF5:0048889500`nF6:0039999300")
        Keywait LAlt
        ToolTip
    return

    ;total 42 upgrade point
    SetKeyDelay 20
    <!F1::SendEvent {1 3}{2 3}{4 9}{5 9}{6 9}{7 9} 	;3309999000
    <!F2::SendEvent {3 6}{4 9}{5 9}{6 9}{7 9} 		;0069999000
    <!F3::SendEvent {3 9}{4 9}{5 9}{6 9}{7 6} 		;0099996000
    <!F4::SendEvent {4 9}{5 9}{6 9}{7 9}{8 6} 		;0009999600
    <!F5::SendEvent {3 4}{4 8}{5 8}{6 8}{7 9}{8 5} 	;0048889500
    <!F6::SendEvent {3 3}{4 9}{5 9}{6 9}{7 9}{8 3} 	;0039999300

#If WinActive("JigsawPuzzles.io - Google Chrome")
    a::Left
    w::Up
    s::Down
    d::Right

#If WinActive("^Netflix - Google Chrome") or WinActive("^Netflix .* ahk_exe firefox.exe")
    q::Left
    w::Right

#If WinActive(games)
    ~1:: return
    ~2:: return
    ~3:: return
    ~4:: return
    ~5:: return
    ~6:: return
    ~7:: return
    ~8:: return
    ~9:: return
    ~0:: return
    ~[:: return
    ~]:: return
    ~':: return
    ~+q:: return
    ~+w:: return
    ~+e:: return
    ~+r:: return
    ~+t:: return
    ~+y:: return
    ~+u:: return
    ~+i:: return
    ~+o:: return
    ~+p:: return
    ~+[:: return
    ~+]:: return
    ~+a:: return
    ~+s:: return
    ~+d:: return
    ~+f:: return
    ~+g:: return
    ~+h:: return
    ~+j:: return
    ~+k:: return
    ~+l:: return
    ~+':: return
    ~+z:: return
    ~+x:: return
    ~+c:: return
    ~+v:: return
    ~+b:: return
    ~+n:: return
    ~+m:: return

    ~^q:: return
    ~^w:: return
    ~^e:: return
    ~^a:: return
    ~^s:: return
    ~^d:: return
    ~^y:: return
    ~^+z:: return
    ~F1::return
    ~F2::return
    ~F3::return
    ~F4::return
    ~F5::return
    ~F6::return
    ~LAlt::return
    ~^Space::return
    return

#If

