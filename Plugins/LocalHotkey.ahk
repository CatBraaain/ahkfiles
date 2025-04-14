;Auto_Reload
#If WinActive(" - AutoHotkey - Visual Studio Code")
    ~^s::
        keywait s
        keywait Ctrl
        reload
    return

;VSCode
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

;Explorer
#If WinActive("ahk_class CabinetWClass")
; WheelLeft:: Send !{Up}
; WheelRight:: Send !{Left}

;Excel
; #If WinActive("- Excel ahk_exe EXCEL.EXE")
#If WinActive("- Excel")
    ~LAlt::
        if GetKeyState("LAlt","P"){
            Send {vk1D} ;無変換
        }
    ; Send {LAlt Down}
    return
    LAlt Up::Send {LAlt Up}
    +WheelUp::
        SetScrollLockState, On
        SendInput {Left}
        SetScrollLockState, Off
    return
    +WheelDown::
        SetScrollLockState, On
        SendInput {Right}
        SetScrollLockState, Off
    return
    ^a::Send {End}+{Home}

    ~F2::return
    ~!1::return
    ~!2::return
    ~^d::return
    ~^+d::return
    ~^q::return
    ~^q UP::return
    ~^+q::return
    ~^+q UP::return
    ~^e::return
    ~^y::return
    ~^;::return

;VBA
#If WinActive("ahk_class wndclass_desked_gsk")
    ^+z::return

;OS
#If WinActive("ahk_class Shell_TrayWnd") OR WinActive("ahk_exe GoogleDriveFS.exe") OR WinActive("新しい通知 ahk_class Windows.UI.Core.CoreWindow")
    ^t::
    ^l::
        ; WinActivate ahk_exe chrome.exe
        ; WinWaitActive ahk_exe chrome.exe
        Send {Alt Down}{Tab}{Alt Up}
        Sleep 1
        Send %A_ThisHotkey%
        Send {F13}
    return
    ^g::
        ; WinActivate ahk_exe chrome.exe
        ; WinWaitActive ahk_exe chrome.exe
        Send {Alt Down}{Tab}{Alt Up}
        Sleep 1
        Send ^l
        Send {F13}
    return

; #If WinActive("新しい通知 ahk_class Windows.UI.Core.CoreWindow")
; 	~LButton:: return
; 	~LButton Up::
; 		Sleep 200
; 		Send {Alt Down}{Tab}{Alt Up}
; 		return

;Chrome
#If WinActive("(Google スプレッドシート|Apps Script) - Google Chrome")
    ~^s::return
    ^q::^/
    !Tab::
        Send {Esc}
        Send !{Tab}
        IsAltTabMenu := true
    return
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

    ^+w::return

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

; WheelLeft
; WheelLeft:: +^Tab
; WheelRight:: ^Tab
#If WinActive("ヨドバシ・ドット・コム - Google Chrome")
    !1::Send %GeneralPW%{Enter}
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

#If WinActive("YouTube - Google Chrome")
    <!1::
        ; Send {LAlt up}{LWin Up}
        SendJs("document.querySelector('#movie_player').setVolume(1)")
    return
    ^Right::Send +n
    ^Left::Send +p
#If WinActive("diep.io - Google Chrome")
    ^s::return
    q::e

    LAlt & q::!q
    LAlt & w::!w
    LAlt & e::!e
    LAlt & a::!a
    LAlt & s::!s
    LAlt & d::!d

    F11::
        ; SendJs("document.body.setAttribute('style','cursor: crosshair;');document.getElementById('canvas').setAttribute('style','cursor: crosshair;')")
        SendEvent !+{Down}
        Sleep 100
        SendEvent {F11}
    return
    Esc::
        SendEvent {F11}
        SendEvent #{Up}
    return

    ; ~LAlt::
    ; 	SendEvent {m Down}{l Down}
    ; 	if GetKeyState("LAlt",P){
    ; 		ToolTip `F1::12277707 overload`,hybrid`nF2::12207777 rocketeer`,tritrapper`nF3::00067767 triplet`nF4::11157765 sprayer`,spread`nF5::00077757 sniper
    ; 	}
    ; 	While GetKeyState("LAlt",P){
    ; 		Sleep 10
    ; 	}
    ; 	SendEvent {m Up}{l Up}
    ; 	ToolTip
    ; 	return

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

    diepmemo(){
        ; level:status
        ; ~28:27:27/27
        ; ~30:28:1/2
        ; ~45:33:5/15

        ; dead level:new level
        ; ~11:-1
        ; ~13:11
        ; ~15:12
        ; ~18:13
        ; ~20:14
        ; ~23:15
        ; ~26:16
        ; ~30:17
        ; ~33:18
        ; ~37:19
        ; ~41:20
        ; ~44:21
        ; ~45:22
    }

#If WinActive("arras.io - Google Chrome")
    ^s::return
    q::e

    LAlt & q::!q
    LAlt & w::!w
    LAlt & e::!e
    LAlt & a::!a
    LAlt & s::!s
    LAlt & d::!d

    F11::
        ; SendJs("document.body.setAttribute('style','cursor: crosshair;');document.getElementById('canvas').setAttribute('style','cursor: crosshair;')")
        SendEvent !+{Down}
        Sleep 100
        SendEvent {F11}
    return
    Esc::
        SendEvent {F11}
        SendEvent #{Up}
    return

    ~LAlt::
        SendEvent {m Up}
        ToolTip("F1::3309999000`nF2::0069999000`nF3::0099996000`nF4::0009999600")
        Keywait LAlt
        ToolTip
    return

    SetKeyDelay 20
    <!F1::SendEvent {1 3}{2 3}{4 9}{5 9}{6 9}{7 9} 	;3309999000
    <!F2::SendEvent {3 6}{4 9}{5 9}{6 9}{7 9} 		;0069999000
    <!F3::SendEvent {3 9}{4 9}{5 9}{6 9}{7 6} 		;0099996000
    <!F4::SendEvent {4 9}{5 9}{6 9}{7 9}{8 6} 		;0009999600
    <!F5::SendEvent {3 4}{4 8}{5 8}{6 8}{7 9}{8 5} 	;0048889500

;total 42 upgrade point

#If WinActive("sudoku puzzles.* - Google Chrome")
    RButton::ClickImage("*0 Materials\SudokuPencil.bmp")
    RButton Up::ClickImage("*0 Materials\SudokuPencil.bmp")
#If WinActive("JigsawPuzzles.io - Google Chrome")
    a::Left
    w::Up
    s::Down
    d::Right

#If WinActive("Manga.* - Google Chrome")
    Down::WheelDown
    Up::WheelUp
    +d::WheelDown
    +e::WheelUp
#If WinActive("8ブロッククラッシュ|フリーゲーム投稿サイト unityroom")
    !a::MouseMove,-1,0,0,R
    !s::MouseMove,0,1,0,R
    !d::MouseMove,1,0,0,R
    !w::MouseMove,0,-1,0,R
    ; !1::SetTimer ,LoopBattle,1500
    ; !2::SetTimer ,LoopBattle,Off
    ; LoopBattle:
    ; 	MouseClick,LEFT,1535,816,1,0
    ; 	MouseClick,LEFT,1249,329,1,0
    ; 	MouseClick,LEFT,1249,381,1,0
    ; 	MouseClick,LEFT,1249,419,1,0
    ; 	MouseClick,LEFT,1249,465,1,0
    ; 	MouseClick,LEFT,1249,507,1,0
    ; 	return
    q::
        MouseGetPos, xpos, ypos
        MsgBox, The cursor is at X%xpos% Y%ypos%.
    return

#If WinActive("^Netflix - Google Chrome")
    q::Left
    w::Right
; #If WinActive("タスクの切り替え")
; 	LAlt Up:: Send {LAlt Up}
;Other Apps
#If WinActive(" – GIMP")
    ^Tab::Send {.}
    ^+Tab::Send {,}
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
    ; LAlt & w::Send {w Down}{LButton Down}
    return

; #If WinActive("Minecraft")
; 	~Tab Up::Send {Esc}
#If WinActive("Robocraft")
    !WheelDown::
        flag:=1
        Loop{
            if (flag==1){
                Send {WheelDown}
                Sleep 50
                Send {WheelDown}
                Sleep 50
                Send {WheelDown}
                Sleep 50
                Send {WheelDown}
                Sleep 50
                Send {LButton}
                Sleep 100
            }
            else{
                break
            }
        }
    return
    !WheelUp::flag:=0
#If WinActive("Unrailed!")
    ~F1::return
    ~F2::return
    ~F3::return
    F4::return
    ~^Space::return
#If WinActive("Hexanaut.io")
	Space::Click(1300,700)
#If WinActive("Tanks Arena io: Craft & Combat.* - Google Chrome")
    n::
        ImageSearch, FoundX, FoundY, 0, 0, A_ScreenWidth, A_ScreenHeight, *10 Materials\tanks arena io\Quick Fight.bmp
        MouseMove FoundX, FoundY, 0
        Click, %FoundX% %FoundY%
    return
#If

