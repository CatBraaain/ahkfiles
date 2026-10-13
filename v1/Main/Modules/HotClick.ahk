#Include %A_ScriptDir%\Utils.ahk

SetupHotClick() {
    global Coords
    Coords := {}
    loop 26 {
        Hotkey, % "^!" . Chr(A_Index + 96), SetHotClickOnCurrentPlace
        Hotkey, % "^+!" . Chr(A_Index + 96), UnsetHotClick
    }
}

SetHotClickOnCurrentPlace() {
    global Coords
    theKey := SubStr(A_ThisHotkey, 3)
    Hotkey, %theKey%, ClickCoord, On
    MouseGetPos, MouseX, MouseY
    Coords[A_ThisHotkey] := {"x": MouseX, "y": MouseY}
}

UnsetHotClick() {
    theKey := SubStr(A_ThisHotkey, 4)
    try {
        Hotkey, %theKey%,, Off
    }
}

ClickCoord() {
    global Coords
    QuickClick(Coords[A_ThisHotkey]["x"], Coords[A_ThisHotkey]["y"])
}
