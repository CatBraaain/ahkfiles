ClickLoopFlag := 0
lastWeapon := 0

#If WinActive(" - Visual Studio Code") or WinActive("ahk_exe Zed.exe")
    ^WheelLeft::Send, !{Left}
    ^WheelRight::Send, !{Right}
    ~^g::Send, {vk1D}
    ~^e::return
    ~^d::return
    ~^+d::return
    ~^!f::return
    ~^!+f::return
    ~!a::return
    ~!+a::return

#If WinActive(" – GIMP")
    ^Tab::Send, {.}
    ^+Tab::Send, {`,}

#If WinActive("diep.io - Google Chrome") or WinActive("arras.io - Google Chrome")
    ^s::return
    q::e

    LAlt & q::!q
    LAlt & w::!w
    LAlt & e::!e
    LAlt & a::!a
    LAlt & s::!s
    LAlt & d::!d

#If WinActive("diep.io - Google Chrome")
    ~LAlt::
        SendEvent, {m Up}
        ToolTip, % "F1::12277707 overload,hybrid"
                 . "`nF2::12207777 rocketeer,tritrapper,firework"
                 . "`nF3::00067767 triplet,streamliner"
                 . "`nF4::01157775 sprayer,spread"
                 . "`nF5::00077757 sniper"
        KeyWait, LAlt
        ToolTip
    return

    ; SetKeyDelay is applied from the auto-execute section in v1.1 (Main.ahk),
    ; because top-level statements between hotkeys never run here.
    DiepStatus(inputstr) {
        Sleep, 50
        str := "{Blind}{U Down}"
        Loop, Parse, inputstr
        {
            str .= A_LoopField . "0"
        }
        str .= "{U Up}"
        SendEvent, %str%
        SendEvent, {m Down}{l Down}
    }
    <!F1::DiepStatus("565688888885656565656444444432132") ; 12277707 overload,hybrid
    <!F2::DiepStatus("565688888885675675675675677713232") ; 12207777 rocketeer,tritrapper
    <!F3::DiepStatus("565688888885656565656444444777777") ; 00067767 triplet
    <!F4::DiepStatus("565688888565656565677777774444432") ; 01157775 sprayer,spread
    <!F5::DiepStatus("565688888885656565656444444477777") ; 00077757 sniper

#If WinActive("arras.io - Google Chrome")
    ~LAlt::
        SendEvent, {m Up}
        ToolTip, % "F1::3309999000"
                 . "`nF2::0069999000"
                 . "`nF3::0099996000"
                 . "`nF4::0009999600"
                 . "`nF5:0048889500"
                 . "`nF6:0039999300"
        KeyWait, LAlt
        ToolTip
    return
    ;total 42 upgrade point
    <!F1::SendEvent, {1 3}{2 3}{4 9}{5 9}{6 9}{7 9} 	; 3309999000
    <!F2::SendEvent, {3 6}{4 9}{5 9}{6 9}{7 9} 		; 0069999000
    <!F3::SendEvent, {3 9}{4 9}{5 9}{6 9}{7 6} 		; 0099996000
    <!F4::SendEvent, {4 9}{5 9}{6 9}{7 9}{8 6} 		; 0009999600
    <!F5::SendEvent, {3 4}{4 8}{5 8}{6 8}{7 9}{8 5} 	; 0048889500
    <!F6::SendEvent, {3 3}{4 9}{5 9}{6 9}{7 9}{8 3} 	; 0039999300

#If WinActive("JigsawPuzzles.io - Google Chrome")
    a::Left
    w::Up
    s::Down
    d::Right

#If WinActive("Tanks 3D - Google Chrome")
    q::
        Send, m
        KeyWait, q
        Send, m
    return
    Tab::
        Send, m
        KeyWait, Tab
        Send, m
    return

#If WinActive("Redcoats.io - Google Chrome|Salty Seas - Google Chrome")
    Tab::
        Send, m
        KeyWait, Tab
        Send, m
    return
    LShift::c
    ~3::lastWeapon := 3
    *q::
        ToggleWeapon()
        KeyWait, q
    return
    *e::
        ToggleWeapon()
        KeyWait, e
    return
    ToggleWeapon() {
        global lastWeapon
        if (lastWeapon != 1) {
            Send, 1
            lastWeapon := 1
        } else {
            Send, 2
            lastWeapon := 2
        }
    }

#If WinActive("ahk_exe chrome.exe")
    ^t::
    ^l::
    ^n::
    ^+n::
        Send, %A_ThisHotkey%
        Send, {vk1D}
    return
    ^g::
        Send, ^l
        Send, {vk1D}
    return
    ^+g::return
    ^f::Send, {vk1D}^f^g ; find
    ^+f::Send, +^g ; find
    ^b::Send, ^d ; add bookmark
    ^+b::Send, ^+o ; bookmark manager
    ~^r::
        CloseSaveDialog()
    return

    ^s::
        Clipboard := ""
        Send, ^c
        Send, ^t
        ClipWait
        Send, ^v{Enter}
    return

    ^+s::
        Send, ^t
        Send, {vk1D}
        Send, chrome://settings/searchEngines
        Send, {Enter}
    return

    F7::return ; Disables cursor browsing

    !LButton::
        startHwnd := WinActive("ahk_exe chrome.exe")
        ClickLoopFlag := startHwnd != 0
        loop {
            if (!ClickLoopFlag || !WinActive("ahk_id " . startHwnd)) {
                ClickLoopFlag := 0
                break
            }
            Send, {LButton}
        }
        return

#If WinActive("ahk_exe chrome.exe") or ClickLoopFlag
    !RButton::
        ClickLoopFlag := 0
        ToolTip, !RButton
        KeyWait, Alt
        ToolTip
    return

#If IsGameWindow()
    ~1::return
    ~2::return
    ~3::return
    ~4::return
    ~5::return
    ~6::return
    ~7::return
    ~8::return
    ~9::return
    ~0::return
    ~[::return
    ~]::return
    ~'::return
    ~+q::return
    ~+w::return
    ~+e::return
    ~+r::return
    ~+t::return
    ~+y::return
    ~+u::return
    ~+i::return
    ~+o::return
    ~+p::return
    ~+[::return
    ~+]::return
    ~+a::return
    ~+s::return
    ~+d::return
    ~+f::return
    ~+g::return
    ~+h::return
    ~+j::return
    ~+k::return
    ~+l::return
    ~+'::return
    ~+z::return
    ~+x::return
    ~+c::return
    ~+v::return
    ~+b::return
    ~+n::return
    ~+m::return

    ~^q::return
    ~^w::return
    ~^e::return
    ~^a::return
    ~^s::return
    ~^d::return
    ~^y::return
    ~^+z::return
    ~F1::return
    ~F2::return
    ~F3::return
    ~F4::return
    ~F5::return
    ~F6::return
    ~LAlt::return
    ~^Space::return

#If WinActive("Windows Sandbox")
    ~LAlt::return

#If
