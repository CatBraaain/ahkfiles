#include "ArrayExtension.ahk"
#Include "Utils.ahk"

HSHELL_WINDOWCREATED := 1
HSHELL_WINDOWDESTROYED := 2
HSHELL_ACTIVATESHELLWINDOW := 3
HSHELL_WINDOWACTIVATED := 4
HSHELL_GETMINRECT := 5
HSHELL_REDRAW := 6
HSHELL_TASKMAN := 7
HSHELL_LANGUAGE := 8
HSHELL_SYSMENU := 9
HSHELL_ENDTASK := 10
HSHELL_ACCESSIBILITYSTATE := 11
HSHELL_APPCOMMAND := 12
HSHELL_WINDOWREPLACED := 13
HSHELL_WINDOWREPLACING := 14
HSHELL_MONITORCHANGED := 16
HSHELL_HIGHBIT := 0x8000
HSHELL_FLASH := (HSHELL_REDRAW | HSHELL_HIGHBIT)
HSHELL_RUDEAPPACTIVATED := (HSHELL_WINDOWACTIVATED | HSHELL_HIGHBIT)

class ShellHook {
    static ShellHookMsgId := DllCall("RegisterWindowMessage", "Str", "SHELLHOOK")
    static ShellHookWindow := Gui()
    static _ := DllCall("RegisterShellHookWindow", "UInt", this.ShellHookWindow.Hwnd)

    __New(Events, Callback) {
        Events := Events is Array ? Events : [Events]
        CallbackWrapper(wParam, lParam, msg, hwnd) {
            winQuery := "ahk_id " lParam
            isAhkGui := TryInvoke(() => (WinGetTitle(winQuery) == A_ScriptName), (e) => false)
            isTargetReceiver := hwnd == ShellHook.ShellHookWindow.Hwnd
            isTargetEvent := Events.Includes(wParam)
            if (!isAhkGui && isTargetReceiver && isTargetEvent) {
                Callback()
            }
        }
        this.CallbackWrapper := CallbackWrapper

        OnExit((*) => this.Enables(false))
    }

    Enables(enable := true) {
        OnMessage(ShellHook.ShellHookMsgId, this.CallbackWrapper, enable ? 1 : 0)
    }
}

EVENT_OBJECT_ACCELERATORCHANGE := 0x8012
EVENT_OBJECT_CLOAKED := 0x8017
EVENT_OBJECT_CONTENTSCROLLED := 0x8015
EVENT_OBJECT_CREATE := 0x8000
EVENT_OBJECT_DEFACTIONCHANGE := 0x8011
EVENT_OBJECT_DESCRIPTIONCHANGE := 0x800D
EVENT_OBJECT_DESTROY := 0x8001
EVENT_OBJECT_DRAGSTART := 0x8021
EVENT_OBJECT_DRAGCANCEL := 0x8022
EVENT_OBJECT_DRAGCOMPLETE := 0x8023
EVENT_OBJECT_DRAGENTER := 0x8024
EVENT_OBJECT_DRAGLEAVE := 0x8025
EVENT_OBJECT_DRAGDROPPED := 0x8026
EVENT_OBJECT_END := 0x80FF
EVENT_OBJECT_FOCUS := 0x8005
EVENT_OBJECT_HELPCHANGE := 0x8010
EVENT_OBJECT_HIDE := 0x8003
EVENT_OBJECT_HOSTEDOBJECTSINVALIDATED := 0x8020
EVENT_OBJECT_IME_HIDE := 0x8028
EVENT_OBJECT_IME_SHOW := 0x8027
EVENT_OBJECT_IME_CHANGE := 0x8029
EVENT_OBJECT_INVOKED := 0x8013
EVENT_OBJECT_LIVEREGIONCHANGED := 0x8019
EVENT_OBJECT_LOCATIONCHANGE := 0x800B
EVENT_OBJECT_NAMECHANGE := 0x800C
EVENT_OBJECT_PARENTCHANGE := 0x800F
EVENT_OBJECT_REORDER := 0x8004
EVENT_OBJECT_SELECTION := 0x8006
EVENT_OBJECT_SELECTIONADD := 0x8007
EVENT_OBJECT_SELECTIONREMOVE := 0x8008
EVENT_OBJECT_SELECTIONWITHIN := 0x8009
EVENT_OBJECT_SHOW := 0x8002
EVENT_OBJECT_STATECHANGE := 0x800A
EVENT_OBJECT_TEXTEDIT_CONVERSIONTARGETCHANGED := 0x8030
EVENT_OBJECT_TEXTSELECTIONCHANGED := 0x8014
EVENT_OBJECT_UNCLOAKED := 0x8018
EVENT_OBJECT_VALUECHANGE := 0x800E
EVENT_SYSTEM_ALERT := 0x0002
EVENT_SYSTEM_ARRANGMENTPREVIEW := 0x8016
EVENT_SYSTEM_CAPTUREEND := 0x0009
EVENT_SYSTEM_CAPTURESTART := 0x0008
EVENT_SYSTEM_CONTEXTHELPEND := 0x000D
EVENT_SYSTEM_CONTEXTHELPSTART := 0x000C
EVENT_SYSTEM_DESKTOPSWITCH := 0x0020
EVENT_SYSTEM_DIALOGEND := 0x0011
EVENT_SYSTEM_DIALOGSTART := 0x0010
EVENT_SYSTEM_DRAGDROPEND := 0x000F
EVENT_SYSTEM_DRAGDROPSTART := 0x000E
EVENT_SYSTEM_END := 0x00FF
EVENT_SYSTEM_FOREGROUND := 0x0003
EVENT_SYSTEM_MENUPOPUPEND := 0x0007
EVENT_SYSTEM_MENUPOPUPSTART := 0x0006
EVENT_SYSTEM_MENUEND := 0x0005
EVENT_SYSTEM_MENUSTART := 0x0004
EVENT_SYSTEM_MINIMIZEEND := 0x0017
EVENT_SYSTEM_MINIMIZESTART := 0x0016
EVENT_SYSTEM_MOVESIZEEND := 0x000B
EVENT_SYSTEM_MOVESIZESTART := 0x000A
EVENT_SYSTEM_SCROLLINGEND := 0x0013
EVENT_SYSTEM_SCROLLINGSTART := 0x0012
EVENT_SYSTEM_SOUND := 0x0001
; EVENT_SYSTEM_SWITCHEND := 0x0015 ; not working on after win10
; EVENT_SYSTEM_SWITCHSTART := 0x0014 ; not working on after win10

class WinEventHook {
    Events := unset
    CallbackWrapper := unset

    hWinEventHooks := []
    hCallback := ""

    __New(Events, Callback) {
        this.Events := Events is Array ? Events : [Events]
        CallbackWrapper(
            hWinEventHook,
            event,
            hwnd,
            idObject,
            idChild,
            idEventThread,
            dwmsEventTime
        ) {
            Callback()
        }
        this.CallbackWrapper := CallbackWrapper
        OnExit((*) => this.Enables(false))
    }

    Enables(enable := true) {
        if (enable) {
            this.hCallback := CallbackCreate(this.CallbackWrapper)
            this.hWinEventHooks := this.Events.Map((event, i, arr) => (
                DllCall(
                    "SetWinEventHook",
                    "Int", event,
                    "Int", event,
                    "Ptr", 0,
                    "Ptr", this.hCallback,
                    "Int", 0,
                    "Int", 0,
                    "Int", 0,
                    "Ptr"
                )
            ))
        } else {
            if (this.hCallback) {
                this.hWinEventHooks.ForEach((hWinEventHook, i, arr) => (
                    DllCall("UnhookWinEvent", "Ptr", hWinEventHook)
                ))
                try {
                    CallbackFree(this.hCallback)
                } catch {
                    ;
                }
            }
        }
    }
}
