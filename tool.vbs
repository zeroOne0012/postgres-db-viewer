Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = "C:\Users\handa\repositories\db_tables"
WshShell.Run "npx nodemon server.js", 0, False

' WshShell.Run "cmd /c node path\to\my\server.js", 0, False