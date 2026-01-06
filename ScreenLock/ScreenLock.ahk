#Requires AutoHotkey >=2.0 <3.0

#SingleInstance Force
#NoTrayIcon

EscapableMonitorOff()
SetTimer(EscapableMonitorOff, 1000)

>!l:: {
    EscapableMonitorOff()
    SetTimer(EscapableMonitorOff, 1000)
}

EscapableMonitorOff() {
    ; At startup, the hotkey/keyhook registration can be delayed due to system load.
    ; Only modifier keys without using InstallKeybdHook() can be detected immediately.
    IsEscaping := GetKeyState("RAlt") and GetKeyState("RShift")
    if (!IsEscaping) {
        MonitorOff()
    } else {
        SetTimer(EscapableMonitorOff, 0)
    }
}

MonitorOff() {
    SendMessage(0x112, 0xF170, 2, , "Program Manager")
}

MonitorOn() {
    SendMessage(0x112, 0xF170, -1, , "Program Manager")
}

^+Delete:: ExitApp()
