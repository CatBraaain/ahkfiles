#SingleInstance force
#Persistent
#Noenv
#NoTrayIcon
SendMode Input

GoSub MonitorOff
SetTimer, MonitorOff, 10000

RAlt & l::
	GoSub MonitorOff
	SetTimer, MonitorOff, 10000
	return
RAlt & u::
	SetTimer, MonitorOff, Off
	GoSub MonitorOn
	return

MonitorOff:
	SendMessage,0x112,0xF170,2,,Program Manager
	return

MonitorOn:
	SendMessage,0x112,0xF170,-1,,Program Manager
	return

