SetMenuTray() {
    A_TrayMenu.Delete("&Help")
    A_TrayMenu.Delete("&Edit Script")
    A_TrayMenu.Rename("E&xit", "&Exit")
    TraySetIcon("./Assets/AHK.ico")
}
