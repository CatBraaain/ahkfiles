SetMenuTray(){
    Menu, Tray, NoStandard
    Menu, Tray, Add, Open
    Menu, Tray, Add, WindowSpy
    Menu, Tray, Add, Reload
    Menu, Tray, Add, Suspend
    Menu, Tray, Add, Pause
    Menu, Tray, Add, Exit

    Menu, Tray, Icon, ..\assets\AHK.ico
}

Open:
    listLines
return

WindowSpy:
    ; Run "exes\WindowSpy.ahk"
    Run "C:\Program Files\AutoHotkey\exes\WindowSpy.ahk"
return

Reload:
Reload
return

Suspend:
Suspend ; Toggle Mode
if (a_isSuspended = 1)
    menu, tray, check, Suspend
else
    menu, tray, unCheck, Suspend
return

Pause:
if (a_isPaused = 1)
{
    pause off
    menu, tray, unCheck, Pause
}
else
{
    menu, tray, check, Pause
    pause on
}
return

Exit:
ExitApp
return
