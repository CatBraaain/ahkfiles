StartClipboardHistory() {
    global ClipArray := []
    OnClipboardChange(UpdateClipArray, 1)
}

UpdateClipArray(Type) {
    global PasteCnt, ClipArray
    PasteCnt := 1
    ClipArray.InsertAt(1, A_Clipboard)
    if (ClipArray.Length > 50) {
        ClipArray.Pop()
    }
}

^+v:: HistoryPaste()
; ^1::HistoryPaste()
; ^2::HistoryPaste()
; ^3::HistoryPaste()
; ^4::HistoryPaste()
; ^5::HistoryPaste()
; ^6::HistoryPaste()
; ^7::HistoryPaste()
; ^8::HistoryPaste()
; ^9::HistoryPaste()

HistoryPaste() {
    global PasteCnt, ClipArray
    PasteCnt := A_ThisHotkey != "^+v" ? SubStr(A_ThisHotkey, 2) : PasteCnt + 1

    ; tooltip % ClipArray.MaxIndex() . "`n" . PasteCnt . "`n" . (ClipArray.MaxIndex() >= PasteCnt)
    if (ClipArray.Length >= PasteCnt) {
        OnClipboardChange(UpdateClipArray, 0)
        A_Clipboard := ""
        A_Clipboard := ClipArray[PasteCnt]
        ClipWait()
        SendEvent("^v")
        ; while DllCall("user32\GetOpenClipboardWindow", "Ptr")
        ; 	Sleep, 50
        OnClipboardChange(UpdateClipArray, 1)
    }
}
