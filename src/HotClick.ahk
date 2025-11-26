#Include "Utils.ahk"

SetupHotClick() {
    global Coords
    Coords := Map()
    loop 26 {
        Hotkey("^!" . Chr(A_Index + 96), SetHotClickOnCurrentPlace)
        Hotkey("^+!" . Chr(A_Index + 96), UnsetHotClick)
    }
}

SetHotClickOnCurrentPlace(HotkeyName) {
    global Coords
    TheKey := SubStr(A_ThisHotkey, 3)
    Hotkey(TheKey, ClickCoord, "On")
    MouseGetPos(&MouseX, &MouseY)
    Coords[TheKey] := Map("X", MouseX, "Y", MouseY)
}

UnsetHotClick(HotkeyName) {
    TheKey := SubStr(A_ThisHotkey, 4)
    try {
        Hotkey(TheKey, "Off")
    }
}

ClickCoord(HotkeyName) {
    global Coords
    ClickEx(Coords[A_ThisHotkey]["X"], Coords[A_ThisHotkey]["Y"])
}
