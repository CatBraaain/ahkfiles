StartClipboardHistory(){
	global ClipArray := []
	OnClipboardChange("UpdateClipArray",1)
}

UpdateClipArray(Type) {
	global PasteCnt, ClipArray
	PasteCnt := 1
	ClipArray.Insert(1,Clipboard)
	ClipCount := ClipArray.MaxIndex()
	If (ClipArray.MaxIndex() > 50)
		ClipArray.Remove(51)
	return
}

^+v::HistoryPaste()
^1::HistoryPaste()
^2::HistoryPaste()
^3::HistoryPaste()
^4::HistoryPaste()
^5::HistoryPaste()
^6::HistoryPaste()
^7::HistoryPaste()
^8::HistoryPaste()
^9::HistoryPaste()

HistoryPaste(){
	global PasteCnt, ClipArray
	PasteCnt := A_ThisHotkey!="^+v" ? SubStr(A_ThisHotkey,2) : PasteCnt+1

	; tooltip % ClipArray.MaxIndex() . "`n" . PasteCnt . "`n" . (ClipArray.MaxIndex() >= PasteCnt)
	If (ClipArray.MaxIndex() >= PasteCnt){
		OnClipboardChange("UpdateClipArray",0)
		Clipboard := ""
		Clipboard := ClipArray[PasteCnt]
		ClipWait
		SendEvent ^v
		; while DllCall("user32\GetOpenClipboardWindow", "Ptr")
		; 	Sleep, 50
		OnClipboardChange("UpdateClipArray",1)
	}
}
