StartClipboardHistory() {
    global ClipboardHistory, NextPasteIndex
    ClipboardHistory := []
    NextPasteIndex := 1
    OnClipboardChange("UpdateClipboardHistory", 1)
    Hotkey, ^+v, PasteFromClipboardHistory
}

UpdateClipboardHistory(DataType) {
    global ClipboardHistory, NextPasteIndex
    if (DataType = 1) {
        NextPasteIndex := 1
        ClipboardHistory.InsertAt(1, Clipboard)
        if (ClipboardHistory.Length() > 50) {
            ClipboardHistory.Pop()
        }
    }
}

PasteFromClipboardHistory() {
    global ClipboardHistory, NextPasteIndex
    NextPasteIndex++
    if (NextPasteIndex <= ClipboardHistory.Length()) {
        Send, % "{Text}" . ClipboardHistory[NextPasteIndex]
    }
}
