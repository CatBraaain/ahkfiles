!c::
    ShouldClipCursor := !ShouldClipCursor
    if (ShouldClipCursor) {
        ShellHookMsgId := StartClipCursor()
        ClipOnActiveMonitor()
    } else {
        OnMessage( ShellHookMsgId, "" )
        ClipCursor(False)
    }
return

StartClipCursor(){
    Gui +LastFound ; create hidden window as message receiver
    msgReceiverWindowHandle := WinExist()
    DllCall( "RegisterShellHookWindow", UInt, msgReceiverWindowHandle )
    shellHookMsgId := DllCall( "RegisterWindowMessage", Str, "SHELLHOOK" )
    OnMessage( shellHookMsgId, "OnShellHook" )
    return shellHookMsgId
}

ClipCursor( shouldClip=True, x1=0 , y1=0, x2=1, y2=1 ) {
    VarSetCapacity(R,16,0), NumPut(x1,&R+0),NumPut(y1,&R+4),NumPut(x2,&R+8),NumPut(y2,&R+12)
    Return shouldClip ? DllCall( "ClipCursor", UInt,&R ) : DllCall( "ClipCursor", UInt, 0 )
}

OnShellHook(wParam,lParam){
    ; static HSHELL_WINDOWACTIVATED := 4
    ; static HSHELL_MONITORCHANGED := 16
    ; static HSHELL_RUDEAPPACTIVATED := 32772
    If (wParam=4 OR wParam=16 OR wParam=32772) {
        ClipOnActiveMonitor()
        ; SetMouseOnCenter()
    }
}

ClipOnActiveMonitor(){
    monitorIndex := GetActiveMonitorIndex()
    SysGet, monitor, Monitor, %monitorIndex%
    ClipCursor(True, monitorLeft, monitorTop, monitorRight, monitorBottom)
}

GetActiveMonitorIndex(){
    SysGet, monitorCount, MonitorCount
    Loop %monitorCount%{
        SysGet, monitor, Monitor, %A_Index%
        WinGetPos, x, y, w, h, a
        isWindowCenterInMonitor := True
            AND monitorLeft <= x+w/2
            AND x+w/2 <= monitorRight
            AND monitorTop <= y+h/2
            AND y+h/2 < monitorBottom
        if (isWindowCenterInMonitor){
            ; return %A_Index%
            return %monitor%
        }
    }
}
