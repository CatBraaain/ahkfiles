StartClipboardHistory() {
    global ClipboardHistory := [], NextPasteIndex := 0
    OnClipboardChange(UpdateClipboardHistory)
    Hotkey("^+v", (HotkeyName) => PasteFromClipboardHistory())
    ; loop 9 {
    ;     Hotkey("^+" . A_Index, (HotkeyName)=>PasteFromClipboardHistory(A_Index))
    ; }
}

UpdateClipboardHistory(DataType) {
    static DATA_TYPE_EMPTY := 0
    static DATA_TYPE_TEXT := 1
    static DATA_TYPE_BINARY := 2

    global ClipboardHistory, NextPasteIndex
    if (DataType := DATA_TYPE_TEXT) {
        NextPasteIndex := 0
        ClipboardHistory.InsertAt(1, A_Clipboard)
        if (ClipboardHistory.Length > 50) {
            ClipboardHistory.Pop()
        }
    }
}

PasteFromClipboardHistory() {
    global ClipboardHistory, NextPasteIndex
    NextPasteIndex++
    if (NextPasteIndex <= ClipboardHistory.Length) {
        SendText(ClipboardHistory[NextPasteIndex])
    }
}
