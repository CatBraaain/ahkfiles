!c::
    clipCursorToggle := !clipCursorToggle
    if (clipCursorToggle) {
        MsgNum := StartClipCursor()
        ClipOnActiveMonitor()
    } else {
        OnMessage( MsgNum, "" )
        ClipCursor(False)
    }
return

ClipCursor( Confine=True, x1=0 , y1=0, x2=1, y2=1 ) {
    VarSetCapacity(R,16,0), NumPut(x1,&R+0),NumPut(y1,&R+4),NumPut(x2,&R+8),NumPut(y2,&R+12)
    Return Confine ? DllCall( "ClipCursor", UInt,&R ) : DllCall( "ClipCursor", UInt, 0 )
}

StartClipCursor(){
    Gui +LastFound
    hWnd := WinExist()
    DllCall( "RegisterShellHookWindow", UInt,Hwnd )
    MsgNum := DllCall( "RegisterWindowMessage", Str,"SHELLHOOK" )
    OnMessage( MsgNum, "ShellMessage" )
    return MsgNum
}

ShellMessage(wParam,lParam){
    If (wParam=4 OR wParam=16 OR wParam=32772) {
        ClipOnActiveMonitor()
        ; SetMouseOnCenter()
    }
    ; static HSHELL_WINDOWACTIVATED := 4
    ; static HSHELL_MONITORCHANGED := 16
    ; static HSHELL_RUDEAPPACTIVATED := 32772
    ; https://www.autohotkey.com/board/topic/80644-how-to-hook-on-to-shell-to-receive-its-messages/
    ; https://www.autohotkey.com/board/topic/61753-confining-mouse-to-a-window/
    ; https://www.autohotkey.com/board/topic/66726-method-to-detect-active-window-change/
}

ClipOnActiveMonitor(){
    MonIndex := GetActiveMonitorIndex()
    SysGet, Mon, Monitor, %MonIndex%
    ClipCursor(True, MonLeft, MonTop, MonRight, MonBottom)
}

GetActiveMonitorIndex(){
    SysGet, MonCnt, MonitorCount
    Loop %MonCnt%{
        SysGet, Mon, Monitor, %A_Index%
        WinGetPos, X, Y, W, H, A
        if (MonLeft <= X+W/2 AND X+W/2 <= MonRight AND MonTop <= Y+H/2 AND Y+H/2 < MonBottom){
            ; tooltip(W "," H)
            return %A_Index%
        }
    }
}

SetMouseOnCenter(){
    MonIndex := GetActiveMonitorIndex()
    SysGet, Mon, Monitor, %MonIndex%
    CoordMode, Mouse, Screen
    MouseMove MonLeft+MonRight/2, MonTop+MonBottom/2,0
}

; GetMouseMonitorIndex(){
;     CoordMode,Mouse,Screen
;     SysGet, MonCnt, MonitorCount
;     Loop %MonCnt%{
;         SysGet, Mon, Monitor, %A_Index%
;         MouseGetPos, X, Y
;         if (MonLeft <= X AND X <= MonRight AND MonTop <= Y AND Y < MonBottom){
;             return %A_Index%
;         }
;     }
; }

; GetMousePosRate(){
;     CoordMode, Mouse, Screen
;     MouseGetPos, MouseX, MouseY
;     MonIndex := GetMouseMonitorIndex()
;     SysGet, Mon, Monitor, %MonIndex%

;     crate := {}
;     crate.x := MouseX / (MonRight - MonLeft)
;     crate.y := MouseY / (MonBottom - MonTop)
;     return crate
; }

; SetMousePosRate(crate){
;     CoordMode, Mouse, Screen
;     MouseGetPos, MouseX, MouseY
;     MonIndex := GetActiveMonitorIndex()
;     SysGet, Mon, Monitor, %MonIndex%
;     ; msgbox % (MonRight - MonLeft)
;     ; msgbox % crate.x*(MonRight - MonLeft) "," crate.y*(MonBottom - MonTop)
;     ; Tooltip(crate.x*(MonRight - MonLeft),1000)
;     Tooltip(MonLeft+crate.x*(MonRight - MonLeft),1000)
;     ; MouseMove MonLeft+crate.x*(MonRight - MonLeft), MonTop+crate.y*(MonBottom - MonTop)
; }

; ClipOnActiveMonitor(){
;     SysGet, MonCnt, MonitorCount
;     Loop %MonCnt%{
;         SysGet, Mon, Monitor, %A_Index%
;         WinGetPos, X, Y, W, H, A
;         if (MonLeft <= X+W/2 AND X+W/2 <= MonRight AND MonTop <= Y+H/2 AND Y+H/2 < MonBottom){
;             ClipCursor(True, MonLeft, MonTop, MonRight, MonBottom)
;             return
;         }
;     }
; }

; ClipOnMouseActiveMonitor(){
;     CoordMode,Mouse,Screen
;     MouseGetPos, MouseX, MouseY
;     if(0<=MouseX AND MouseX<=A_ScreenWidth AND 0<=MouseY AND MouseY<=A_ScreenHeight){
;         ClipCursor(True, 0, 0, A_ScreenWidth, A_ScreenHeight)
;     }else{
;         ClipCursor(False, 0, 0, 0, 0)
;     }
; }
