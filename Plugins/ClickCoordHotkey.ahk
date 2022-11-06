PrepareForClickCoordHotkey(){
	Global Coords
	Coords := Object()
	Loop, 26 {
	Hotkey, % "^!" Chr(A_Index+96), EnableClickCoordHotkey
	Hotkey, % "^+!" Chr(A_Index+96), DisableClickCoordHotkey
	}
}

DisableClickCoordHotkey:
    TheKey := SubStr(A_ThisHotkey,4)
    Try {
        Hotkey, % TheKey, Off
    }
return

EnableClickCoordHotkey:
    TheKey := SubStr(A_ThisHotkey,3)
    Hotkey, % TheKey, ClickCoord, On
    MouseGetPos MouseX, MouseY
    Coords[TheKey] := Object("X",MouseX,"Y",MouseY)
return

ClickCoord:
    Click(Coords[A_ThisHotkey]["X"],Coords[A_ThisHotkey]["Y"])
return
