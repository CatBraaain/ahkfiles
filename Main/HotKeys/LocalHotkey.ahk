#Include "../Modules/Utils.ahk"

#HotIf WinActive(" - ahkfiles - Visual Studio Code")
    ~^s:: {
        KeyWait("s")
        Reload()
        KeyWait("Ctrl")
    }

#HotIf WinActive(" - Visual Studio Code")
    ^WheelLeft:: Send("!{Left}")
    ^WheelRight:: Send("!{Right}")
    ~^g:: Send("{vk1A}")
    ~^e:: return
    ~^d:: return
    ~^+d:: return
    ~^!f:: return
    ~^!+f:: return
    ~!a:: return
    ~!+a:: return

#HotIf WinActive(" – GIMP")
    ^Tab:: Send("{.}")
    ^+Tab:: Send("{,}")

#HotIf WinActive("MAP.*HELLO CYCLING")
    WheelUp:: Send("{+}")
    WheelDown:: Send("{-}")

#HotIf WinActive("note - Google Chrome")
    !F1:: { ; Paste template
        Send("^a{BS}")
        Send("目的^!2{End}{Enter 2}")
        Send("スクリプト^!2{End}{Enter}^!\{Enter 2}")
        Send("スクリプト解説^!2{End}{Enter}^!\{Enter 2}")
        Send("参考^!2{End}{Enter 2}")
        Send("あとがき^!2{End}{Enter}")
    }

    ^vkF4::
    !vk19:: Send("^!0") ; Normal
    ^1::
    <!1:: Send("^!2") ; Heading1
    ^2::
    <!2:: Send("^!3") ; Heading2
    ^3::
    <!3:: Send("^!\") ; CodeBlock
    ^4::
    <!4:: Send("^+>") ; BlockQuote
    ^5::
    <!5:: Send("^b") ; Bold
    ~^b:: return

#HotIf WinActive("diep.io - Google Chrome") or WinActive("arras.io - Google Chrome")
    ^s:: return
    q::e

    LAlt & q::!q
    LAlt & w::!w
    LAlt & e::!e
    LAlt & a::!a
    LAlt & s::!s
    LAlt & d::!d

#HotIf WinActive("diep.io - Google Chrome")
    ~LAlt:: {
        SendEvent("{m Up}")
        ToolTip(
            "F1::12277707 overload,hybrid`nF2::12207777 rocketeer,tritrapper`nF3::00067767 triplet`nF4::01157775 sprayer,spread`nF5::00077757 sniper"
        )
        KeyWait("LAlt")
        ToolTip()
        return
    }

    SetKeyDelay(20)
    DiepStatus(inputstr) {
        Sleep(50)
        str := "{Blind}{U Down}"
        loop parse, inputstr {
            str .= A_LoopField . "0"
        }
        str .= "{U Up}"
        SendEvent(str)
        SendEvent("{m Down}{l Down}")
    }
    <!F1:: DiepStatus("565688888885656565656444444432132") ; 12277707 overload,hybrid
    <!F2:: DiepStatus("565688888885675675675675677713232") ; 12207777 rocketeer,tritrapper
    <!F3:: DiepStatus("565688888885656565656444444777777") ; 00067767 triplet
    <!F4:: DiepStatus("565688888565656565677777774444432") ; 01157775 sprayer,spread
    <!F5:: DiepStatus("565688888885656565656444444477777") ; 00077757 sniper

#HotIf WinActive("arras.io - Google Chrome")
    ~LAlt:: {
        SendEvent("{m Up}")
        ToolTip("F1::3309999000`nF2::0069999000`nF3::0099996000`nF4::0009999600`nF5:0048889500`nF6:0039999300")
        KeyWait("LAlt")
        ToolTip()
    }
    ;total 42 upgrade point
    SetKeyDelay(20)
    <!F1:: SendEvent("{1 3}{2 3}{4 9}{5 9}{6 9}{7 9}") 	; 3309999000
    <!F2:: SendEvent("{3 6}{4 9}{5 9}{6 9}{7 9}") 		; 0069999000
    <!F3:: SendEvent("{3 9}{4 9}{5 9}{6 9}{7 6}") 		; 0099996000
    <!F4:: SendEvent("{4 9}{5 9}{6 9}{7 9}{8 6}") 		; 0009999600
    <!F5:: SendEvent("{3 4}{4 8}{5 8}{6 8}{7 9}{8 5}") 	; 0048889500
    <!F6:: SendEvent("{3 3}{4 9}{5 9}{6 9}{7 9}{8 3}") 	; 0039999300

#HotIf WinActive("JigsawPuzzles.io - Google Chrome")
    a::Left
    w::Up
    s::Down
    d::Right

#HotIf WinActive("^Netflix - Google Chrome") or WinActive("^Netflix .* ahk_exe firefox.exe")
    q::Left
    w::Right

#HotIf WinActive("ahk_exe chrome.exe")
    ^t::
    ^l::
    ^n::
    ^+n:: {
        Send(A_ThisHotkey)
        Send("{vk1A}")
    }
    ^g:: {
        Send("^l")
        Send("{vk1A}")
    }
    ^+g:: return
    ^f:: Send("^f^g") ; find
    ^+f:: Send("+^g") ; find
    ^b:: Send("^d") ; add bookmark
    ^+b:: Send("^+o") ; bookmark manager
    ~^r:: CloseSaveDialog()

    ^s:: {
        A_Clipboard := ""
        Send("^c")
        Send("^t")
        ClipWait()
        Send("^v{Enter}")
    }

    ^+s:: {
        Send("^t")
        Send("{vk1A}")
        Send("chrome://settings/searchEngines")
        Send("{Enter}")
    }

    F7:: return ; Disables cursor browsing

    !LButton:: {
        global ClickLoopFlag := 1
        loop {
            if (!ClickLoopFlag) {
                break
            }
            Send("{LButton}")
        }
        return
    }

    !RButton:: {
        global ClickLoopFlag := 0
        ToolTip("!RButton")
        KeyWait("Alt")
        ToolTip()
    }

#HotIf IsGameWindow()
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
    ~F1:: return
    ~F2:: return
    ~F3:: return
    ~F4:: return
    ~F5:: return
    ~F6:: return
    ~LAlt:: return
    ~^Space:: return

#HotIf WinActive("Windows Sandbox")
    ~LAlt:: return

#HotIf
