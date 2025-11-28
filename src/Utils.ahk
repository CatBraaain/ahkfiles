#Include "Utils.ahk"
#Include "ClipboardHistory.ahk"

RemoveToolTip() {
    SetTimer(RemoveToolTip, 0)
    ToolTip("")
}

ToolTipEx(str, delay := 0) {
    ToolTip(str, A_ScreenWidth // 2, A_ScreenHeight // 2)
    if delay
        SetTimer(RemoveToolTip, delay)
}

ClickEx(ClickX, ClickY) {
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

SendTo(keystroke, target) {
    WinActivate(target)
    WinWaitActive(target)
    Send(keystroke)
}

ShowApp(exe_path, selector) {
    if WinExist(selector)
        WinActivate(selector)
    else
        Run(A_ScriptDir . "\" . exe_path)
}

ShowImg(ImgPath) {
    global ImageWindow := Gui()
    ImageWindow.Opt("+LastFound -Caption +E0x20")
    ImageWindow.BackColor := 888888
    WinSetTranscolor("888888 126")
    ImageWindow.MarginX := 0
    ImageWindow.MarginY := 0
    ImageWindow.Add("Picture", "w1200 h800 BackGroundTrans", ImgPath)
    ImageWindow.Title := "Window"
    ImageWindow.Show()

    KeyWait(SubStr(A_ThisHotkey, (StrLen(A_ThisHotkey)) < 1 ? (StrLen(A_ThisHotkey)) - 1 : (StrLen(A_ThisHotkey))))

    ImageWindow.Title := "Window"
    ImageWindow.Show("Hide")
    return
}
