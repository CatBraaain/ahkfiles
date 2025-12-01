StartClipboardHistory() {
    global ClipboardHistory := []
    OnClipboardChange(UpdateClipboardHistory)
    Hotkey("^+v", (HotkeyName) => PasteFromClipboardHistory(1))
    ; loop 9 {
    ;     Hotkey("^+" . A_Index, (HotkeyName)=>PasteFromClipboardHistory(A_Index))
    ; }
}

UpdateClipboardHistory(DataType) {
    static DATA_TYPE_EMPTY := 0
    static DATA_TYPE_TEXT := 1
    static DATA_TYPE_BINARY := 2

    global ClipboardHistory
    if (DataType := DATA_TYPE_TEXT) {
        ClipboardHistory.InsertAt(1, A_Clipboard)
        if (ClipboardHistory.Length > 50) {
            ClipboardHistory.Pop()
        }
    }
}

PasteFromClipboardHistory(i) {
    global ClipboardHistory
    if (i <= ClipboardHistory.Length) {
        Send(ClipboardHistory[i])
    }
}
