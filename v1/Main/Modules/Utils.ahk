ToolTipEx(str, delay := 0) {
    CoordMode, ToolTip, Screen
    ToolTip, %str%, % A_ScreenWidth // 2, % A_ScreenHeight // 2
    SetTimer, ToolTipExClear, %delay%
}

ToolTipExClear() {
    ToolTip
    SetTimer, ToolTipExClear, Off
}

QuickClick(ClickX, ClickY) {
    MouseGetPos, MouseX, MouseY
    Click, %ClickX%, %ClickY%
    MouseMove, %MouseX%, %MouseY%, 0
}

ClickImage(ImagePath) {
    ImageSearch, FoundX, FoundY, 0, 0, %A_ScreenWidth%, %A_ScreenHeight%, %ImagePath%
    Click, %FoundX%, %FoundY%
}

CloseSaveDialog() {
    if (A_PriorHotkey == A_ThisHotkey) {
        WinGetClass, ClassStr, A
        WinGetTitle, TitleStr, A
        ControlGetText, ControlStr, Button1, A
        if (ErrorLevel) {
            ControlStr := ""
        }

        if (ClassStr == "#32770") {
            if (ControlStr == "&Terminate") {
                Send, {Enter}
            } else if (ControlStr == "&Save") {
                Send, n
            }
        }
        if (InStr(TitleStr, "このサイトを") || InStr(TitleStr, "場所が利用できません")) {
            Send, {Enter}
        }
    }
}

GetSelectionStr() {
    clipboardBk := ClipboardAll
    Clipboard := ""
    Send, ^c
    ClipWait
    selectionStr := Clipboard
    Clipboard := clipboardBk
    return selectionStr
}

DeleteRow() {
    SendEvent, {End}+{Home}+{Home}+{Left}{BS}{Right}
}

DuplicateRow() {
    SendEvent, {End}+{Home}
    selectionStr := GetSelectionStr()
    Send, {Right}+{Enter}
    Send, % "{Text}" . selectionStr
}

IsGameWindow() {
    Games := "(Ultimate Chicken Horse|PAYDAY 2|Warlander|Battlefield|Robocraft|Minecraft|HalfDead2|Counter-Strike|CrowFPS|MilkChoco|PortalWars|Monster Hunter|Unrailed!)"
    ChromeGames := "(CrazyGames|Skillfite.io|Sword Masters|arras.io|diep.io|STUG - MultiPlayer Tank Battle|Krunker|Ships 3D)"
    return (WinActive(Games) && !WinActive(" - Google Chrome")) || WinActive(ChromeGames . " - Google Chrome")
}

MsgWinTitle() {
    WinGetTitle, Title, A
    WinGet, ExStyle, ExStyle, A
    WinGetText, Body, A
    MsgBox, % Title . "`n" . ExStyle . "`n" . Body
}
