RemoveToolTip:
    SetTimer, RemoveToolTip, Off
    ToolTip
return

ToolTip(str,delay=0) {
    ToolTip, %str%, A_ScreenWidth//2, A_ScreenHeight//2
    if delay
        SetTimer, RemoveToolTip, %delay%
}

Click(ClickX,ClickY){
    MouseGetPos MouseX, MouseY
    BlockInput, MouseMove
    MouseMove ClickX, ClickY, 0
    Click
    MouseMove MouseX, MouseY, 0
    BlockInput, MouseMoveOff
}

ClickImage(ImagePath){
    ImageSearch, FoundX, FoundY, 0, 0, A_ScreenWidth, A_ScreenHeight, %ImagePath%
    Click(FoundX, FoundY)
}

CloseSaveDialog(){
    if(A_PriorHotkey==A_ThisHotkey){
        WinGetClass, ClassStr, A
        WinGetTitle, TitleStr, A

        If(ClassStr == "#32770"){
            Send {n}
        }
        If(Instr(TitleStr,"このサイトを") OR Instr(TitleStr,"場所が利用できません")){
            Send {Enter}
        }
    }
    return
}

CopySelection(){
    OnClipboardChange("UpdateClipArray",0)
    OldClipboard := Clipboard
    Clipboard := ""
    SendEvent ^c
    ClipWait
    return %OldClipboard%
}

DeleteRow(){
    SendEvent {End}+{Home}+{Home}+{Left}{BS}{Right}
}

DuplicateRow(){
    SendEvent {End}+{Home} ;+{Home}{Left}
    OldClipboard := CopySelection()
    Send {Right}{Enter}^v
    PasteWait(OldClipboard)
    return
}

IsGameWindow(){
    global Games, ChromeGames
    return (WinActive(Games) AND !WinActive(" - Google Chrome")) OR WinActive(ChromeGames . " - Google Chrome")
}

MsgWinTitle(){
    WinGetTitle, Title, A
    WinGet, ExStyle, ExStyle, A
    WinGetText, Body, A
    MsgBox % Title . "`n" . ExStyle . "`n" . Body
    return
}

PasteWait(OldClipboard){
    while DllCall("user32\GetOpenClipboardWindow", "Ptr")
        Sleep 20
    tooltip waiting
    Sleep 20
    tooltip
    Clipboard := ""
    Clipboard := OldClipboard
    OnClipboardChange("UpdateClipArray",1)
    return
}

PasteStr(Str){
    OnClipboardChange("UpdateClipArray",0)
    OldClipboard := ClipboardAll
    Clipboard := ""
    Clipboard := Str
    ClipWait
    SendEvent ^v
    PasteWait(OldClipboard)
    return
}

SendTo(keystroke,target){
    WinActivate, %target%
    WinWaitActive, %target%
    Send %keystroke%
    return
}

ShowApp(exe_path, selector){
    If WinExist(selector)
        WinActivate %selector%
    Else
        Run %Script_Dir%\%exe_path%
    return
}

ShowImg(ImgPath){
    Gui, +LastFound -Caption +E0x20
    Gui,Color,888888
    WinSet,Transcolor, 888888 126
    Gui,Margin,0,0
    Gui, Add, Picture, w1200 h800 BackGroundTrans, %ImgPath%
    Gui, Show,, Window

    KeyWait % SubStr(A_ThisHotkey,StrLen(A_ThisHotkey))

    Gui, Show, Hide, Window
    return
}
