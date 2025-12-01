#Include "ClipboardHistory.ahk"

ToolTipEx(str, delay := 0) {
    ToolTip(str, A_ScreenWidth // 2, A_ScreenHeight // 2)
    SetTimer(() => (ToolTip(""), SetTimer(unset, 0)), delay)
}

QuickClick(ClickX, ClickY) {
    MouseGetPos(&MouseX, &MouseY)
    Click(ClickX, ClickY)
    MouseMove(MouseX, MouseY, 0)
}

ClickImage(ImagePath) {
    ImageSearch(&FoundX, &FoundY, 0, 0, A_ScreenWidth, A_ScreenHeight, ImagePath)
    Click(FoundX, FoundY)
}

CloseSaveDialog() {
    if (A_PriorHotkey == A_ThisHotkey) {
        ClassStr := WinGetClass("A")
        TitleStr := WinGetTitle("A")

        if (ClassStr == "#32770") {
            Send("{n}")
        }
        if (InStr(TitleStr, "このサイトを") OR InStr(TitleStr, "場所が利用できません")) {
            Send("{Enter}")
        }
    }
}

GetSelectionStr() {
    OnClipboardChange(UpdateClipArray, 0)
    clipboardBk := ClipboardAll()
    A_Clipboard := ""
    Send("^c")
    ClipWait()
    selectionStr := A_Clipboard
    A_Clipboard := clipboardBk
    OnClipboardChange(UpdateClipArray, 1)
    return selectionStr
}

DeleteRow() {
    SendEvent("{End}+{Home}+{Home}+{Left}{BS}{Right}")
}

DuplicateRow() {
    SendEvent("{End}+{Home}")
    selectionStr := GetSelectionStr()
    Send("{Right}+{Enter}" . selectionStr)
}

IsGameWindow() {
    Games :=
        "PAYDAY 2|Warlander|Battlefield|Robocraft|Minecraft|HalfDead2|Counter-Strike|CrowFPS|MilkChoco|PortalWars|Monster Hunter|Unrailed!"
    ChromeGames :=
        "CrazyGames|Skillfite.io|Sword Masters|arras.io|diep.io|STUG - MultiPlayer Tank Battle|Krunker|Ships 3D"
    return (WinActive(Games) AND !WinActive(" - Google Chrome")) OR WinActive(ChromeGames . " - Google Chrome")
}

MsgWinTitle() {
    Title := WinGetTitle("A")
    ExStyle := WinGetExStyle("A")
    Body := WinGetText("A")
    MsgBox(Title . "`n" . ExStyle . "`n" . Body)
}

TryInvoke(FnTry, FnCatch := unset) {
    try {
        return FnTry()
    } catch as e {
        if IsSet(FnCatch) {
            return FnCatch(e)
        } else {
        }
    }
}
