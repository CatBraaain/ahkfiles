#SingleInstance force
#Persistent
#Noenv
#NoTrayIcon
SendMode Input

GoSub FocusAssistOn
GoSub MonitorOff
SetTimer, MonitorOff, 250

>!l::
	GoSub FocusAssistOn
	GoSub MonitorOff
	SetTimer, MonitorOff, 250
	return

>!u::
+>!l::
	SetTimer, MonitorOff, Off
	GoSub MonitorOn
	Keywait Alt
	Keywait Shift
	Keywait L
	Keywait U
	GoSub FocusAssistOff
	return

MonitorOff:
	SendMessage,0x112,0xF170,2,,Program Manager
	return

MonitorOn:
	SendMessage,0x112,0xF170,-1,,Program Manager
	return

FocusAssistOn:
	If(!WinActive("アクション センター")){
		Send #a
	}
    WinWaitActive, アクション センター,, 2
    Send +{Tab}{Left 3}{Up 3}{Right 3}{Down 2}{Space}{Esc}
	return

FocusAssistOff:
	If(!WinActive("アクション センター")){
		Send #a
	}
    WinWaitActive, アクション センター,, 2
    Send +{Tab}{Left 3}{Up 3}{Right 3}{Down 2}{Space 2}{Esc}
	return

^+Delete::ExitApp
