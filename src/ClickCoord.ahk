PrepareForClickCoordHotkey() {
    global Coords
    Coords := Object()
    loop 26 {
        Hotkey("^!" Chr(A_Index + 96), EnableClickCoordHotkey)
        Hotkey("^+!" Chr(A_Index + 96), DisableClickCoordHotkey)
    }
}

DisableClickCoordHotkey() {
    TheKey := SubStr(A_ThisHotkey, 4)
    try {
        Hotkey(TheKey, "Off")
    }
}

EnableClickCoordHotkey() {
    global Coords
    TheKey := SubStr(A_ThisHotkey, 3)
    Hotkey(TheKey, ClickCoord, "On")
    MouseGetPos(&MouseX, &MouseY)
    Coords[TheKey] := Map("X", MouseX, "Y", MouseY)
}

ClickCoord() {
    global Coords
    Click(Coords[A_ThisHotkey]["X"], Coords[A_ThisHotkey]["Y"])
}
