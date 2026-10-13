SetMenuTray() {
    ; v1.1 cannot delete or rename standard items (Menu.htm), so the menu is
    ; rebuilt to match the v2 layout: no Help, no Edit Script, "&Exit".
    Menu, Tray, NoStandard
    Menu, Tray, Add, &Open, TrayOpen
    Menu, Tray, Add, &Window Spy, TrayWindowSpy
    Menu, Tray, Add, Reload This &Script, TrayReload
    Menu, Tray, Add, &Suspend Hotkeys, TraySuspend
    Menu, Tray, Add, &Pause Script, TrayPause
    Menu, Tray, Add, E&xit, TrayExit
    Menu, Tray, Icon, %A_ScriptDir%\Assets\AHK.ico
}

TrayOpen:
    ListLines ; Shows the script's main window.
return

TrayWindowSpy:
    SplitPath, A_AhkPath, , ahkDir
    Run, "%ahkDir%\WindowSpy.ahk"
return

TrayReload:
    Reload
return

TraySuspend:
    Suspend ; Toggle Mode
    if (A_IsSuspended = 1) {
        Menu, Tray, Check, &Suspend Hotkeys
    } else {
        Menu, Tray, Uncheck, &Suspend Hotkeys
    }
return

TrayPause:
    Pause ; Toggle Mode
    if (A_IsPaused = 1) {
        Menu, Tray, Check, &Pause Script
    } else {
        Menu, Tray, Uncheck, &Pause Script
    }
return

TrayExit:
    ExitApp
return
