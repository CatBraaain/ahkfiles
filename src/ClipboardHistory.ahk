StartClipboardHistory() {
    global History := []
    OnClipboardChange(UpdateClipArray, 1)
    Hotkey("^+v", HistoryPaste)
    ; loop 9 {
    ;     Hotkey("^+" . A_Index, HistoryPaste)
    ; }
}

UpdateClipArray(Type) {
    global PasteCnt, History
    PasteCnt := 1
    History.InsertAt(1, A_Clipboard)
    if (History.Length > 50) {
        History.Pop()
    }
}

HistoryPaste(HotkeyName) {
    global PasteCnt, History
    PasteCnt := HotkeyName == "^+v" ? PasteCnt + 1 : SubStr(HotkeyName, 2)
    if (PasteCnt <= History.Length) {
        Send(History[PasteCnt])
    }
}
