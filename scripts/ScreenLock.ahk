#SingleInstance Force
#NoTrayIcon

MonitorOff()
SetTimer(MonitorOff, 250)

>!l:: {
    MonitorOff()
    SetTimer(MonitorOff, 250)
}

+>!l:: {
    SetTimer(MonitorOff, 0)
    MonitorOn()
    KeyWait("Alt")
    KeyWait("Shift")
    KeyWait("L")
    KeyWait("U")
}

MonitorOff() {
    SendMessage(0x112, 0xF170, 2, , "Program Manager")
}

MonitorOn() {
    SendMessage(0x112, 0xF170, -1, , "Program Manager")
}

^+Delete:: ExitApp()
