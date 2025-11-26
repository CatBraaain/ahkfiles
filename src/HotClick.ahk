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
    theKey := SubStr(HotkeyName, 3)
    Hotkey(theKey, ClickCoord, "On")
    MouseGetPos(&MouseX, &MouseY)
    Coords[HotkeyName] := Map("X", MouseX, "Y", MouseY)
}

UnsetHotClick(HotkeyName) {
    theKey := SubStr(HotkeyName, 4)
    try {
        Hotkey(theKey, "Off")
    }
}

ClickCoord(HotkeyName) {
    global Coords
    ClickEx(Coords[HotkeyName]["X"], Coords[HotkeyName]["Y"])
}
