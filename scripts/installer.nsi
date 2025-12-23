; Schemock Installer Script
; Written for NSIS 3.0+

!define PRODUCT_NAME "Schemock"
!define PRODUCT_VERSION "1.0.0"
!define PRODUCT_PUBLISHER "Schemock Team"
!define PRODUCT_WEB_SITE "https://github.com/yourusername/schemock"
!define PRODUCT_UNINST_KEY "Software\Microsoft\Windows\CurrentVersion\Uninstall\${PRODUCT_NAME}"
!define PRODUCT_UNINST_ROOT_KEY "HKLM"
!define PRODUCT_DIR_REGKEY "Software\${PRODUCT_PUBLISHER}\${PRODUCT_NAME}"

;--------------------------------
;Include Modern UI

!include "MUI2.nsh"

;--------------------------------
;General

Name "${PRODUCT_NAME} ${PRODUCT_VERSION}"
OutFile "Schemock-${PRODUCT_VERSION}-Setup.exe"
InstallDir "$PROGRAMFILES64\${PRODUCT_NAME}"
InstallDirRegKey "${PRODUCT_UNINST_ROOT_KEY}" "${PRODUCT_UNINST_KEY}"
ShowInstDetails show
ShowUnInstDetails show

; Request application privileges for Windows Vista and higher
RequestExecutionLevel admin

;--------------------------------
;Interface Settings

!define MUI_ABORTWARNING
!define MUI_ICON "icon.ico"
!define MUI_UNICON "icon.ico"

;--------------------------------
;Pages

!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_LICENSE "LICENSE.txt"
!insertmacro MUI_PAGE_COMPONENTS
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_UNPAGE_WELCOME
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_UNPAGE_FINISH

;--------------------------------
;Languages

!insertmacro MUI_LANGUAGE "English"

;--------------------------------
;Installer Sections

Section "Core Files" SecCore
  SectionIn RO
  
  SetOutPath "$INSTDIR"
  
  ; Main executable
  File "releases\schemock-${PRODUCT_VERSION}\schemock.exe"
  
  ; Documentation
  SetOutPath "$INSTDIR\docs"
  File /r "releases\schemock-${PRODUCT_VERSION}\docs\*.*"
  
  ; Examples
  SetOutPath "$INSTDIR\examples"
  File /r "releases\schemock-${PRODUCT_VERSION}\examples\*.*"
  
  ; Batch files
  File "releases\schemock-${PRODUCT_VERSION}\start.bat"
  File "releases\schemock-${PRODUCT_VERSION}\help.bat"
  
  ; Readme and version info
  File "releases\schemock-${PRODUCT_VERSION}\README.md"
  File "releases\schemock-${PRODUCT_VERSION}\version.json"
  
  ; Store installation folder
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_DIR_REGKEY}" ""
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_DIR_REGKEY}" $INSTDIR
  
  ; Create uninstaller
  WriteUninstaller "$INSTDIR\Uninstall.exe"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "UninstallString" "$INSTDIR\Uninstall.exe"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "DisplayName" "${PRODUCT_NAME}"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "DisplayVersion" "${PRODUCT_VERSION}"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "Publisher" "${PRODUCT_PUBLISHER}"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "URLInfoAbout" "${PRODUCT_WEB_SITE}"
SectionEnd

Section "Start Menu Shortcuts" SecStartMenu
  CreateDirectory "$SMPROGRAMS\${PRODUCT_NAME}"
  CreateShortCut "$SMPROGRAMS\${PRODUCT_NAME}\Schemock.lnk" "$INSTDIR\schemock.exe" "" "$INSTDIR\schemock.exe" 0
  CreateShortCut "$SMPROGRAMS\${PRODUCT_NAME}\Documentation.lnk" "$INSTDIR\docs\user-guide.md" "" "$INSTDIR\docs\user-guide.md" 0
  CreateShortCut "$SMPROGRAMS\${PRODUCT_NAME}\Uninstall.lnk" "$INSTDIR\Uninstall.exe" "" "$INSTDIR\Uninstall.exe" 0
SectionEnd

Section "Desktop Shortcut" SecDesktop
  CreateShortCut "$DESKTOP\${PRODUCT_NAME}.lnk" "$INSTDIR\schemock.exe" "" "$INSTDIR\schemock.exe" 0
SectionEnd

Section "Windows Path Integration" SecPath
  ; Add to system PATH for easy command line access
  Push $INSTDIR
  Call AddToPath
SectionEnd

;--------------------------------
;Descriptions

LangString DESC_SecCore ${LANG_ENGLISH} "Core application files and documentation"
LangString DESC_SecStartMenu ${LANG_ENGLISH} "Create Start Menu shortcuts"
LangString DESC_SecDesktop ${LANG_ENGLISH} "Create Desktop shortcut"
LangString DESC_SecPath ${LANG_ENGLISH} "Add Schemock to Windows PATH"

!insertmacro MUI_FUNCTION_DESCRIPTION_BEGIN
!insertmacro MUI_DESCRIPTION_TEXT ${SecCore} $(DESC_SecCore)
!insertmacro MUI_DESCRIPTION_TEXT ${SecStartMenu} $(DESC_SecStartMenu)
!insertmacro MUI_DESCRIPTION_TEXT ${SecDesktop} $(DESC_SecDesktop)
!insertmacro MUI_DESCRIPTION_TEXT ${SecPath} $(DESC_SecPath)
!insertmacro MUI_FUNCTION_DESCRIPTION_END

;--------------------------------
;Uninstaller Section

Section "Uninstall"
  
  ; Remove files and folders
  RMDir /r "$INSTDIR\docs"
  RMDir /r "$INSTDIR\examples"
  Delete "$INSTDIR\schemock.exe"
  Delete "$INSTDIR\start.bat"
  Delete "$INSTDIR\help.bat"
  Delete "$INSTDIR\README.md"
  Delete "$INSTDIR\version.json"
  Delete "$INSTDIR\Uninstall.exe"
  RMDir "$INSTDIR"
  
  ; Remove shortcuts
  Delete "$DESKTOP\${PRODUCT_NAME}.lnk"
  RMDir /r "$SMPROGRAMS\${PRODUCT_NAME}"
  
  ; Remove from PATH
  Push $INSTDIR
  Call un.RemoveFromPath
  
  ; Remove registry keys
  DeleteRegKey ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}"
  DeleteRegKey ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_DIR_REGKEY}"
  
  MessageBox MB_OK "Schemock has been successfully uninstalled."
SectionEnd

;--------------------------------
;Functions for PATH manipulation

Function AddToPath
  Exch $R0
  Push $R1
  Push $R2
  Push $R3
  Push $R4
  Push $R5
  
  ReadRegStr $R1 HKCU "Environment" "PATH"
  StrCpy $R5 $R1 1 -1
  StrCmp $R5 ";" +2 +2
  StrCpy $R1 "$R1;$R0"
  Goto done
  StrCpy $R1 "$R0;$R1"
  
done:
  WriteRegExpandStr HKCU "Environment" "PATH" $R1
  SendMessage ${HWND_BROADCAST} ${WM_WININICHANGE} 0 "STR:environment" /TIMEOUT=5000
  
  Pop $R5
  Pop $R4
  Pop $R3
  Pop $R2
  Pop $R1
FunctionEnd

Function un.RemoveFromPath
  Exch $R0
  Push $R1
  Push $R2
  Push $R3
  Push $R4
  Push $R5
  
  ReadRegStr $R1 HKCU "Environment" "PATH"
  
remove_loop:
  StrLen $R2 $R0
  StrCpy $R3 0
  
find:
  StrCpy $R4 $R1 $R2 $R3
  StrCmp $R4 $R0 found
  StrCmp $R4 "" done
  IntOp $R3 $R3 + 1
  StrCpy $R5 $R1 1 $R3
  StrCmp $R5 ";" +2 +2
  StrCmp $R3 "" done
  Goto find
  
found:
  StrLen $R4 $R1
  IntOp $R4 $R4 - $R2
  IntOp $R4 $R4 - $R3
  StrCpy $R5 $R1 $R3
  IntOp $R3 $R3 + $R2
  StrCpy $R1 $R1 $R4 $R3
  StrCmp $R5 "" +2 +2
  StrCpy $R1 "$R1;$R5"
  Goto remove_loop
  
done:
  WriteRegExpandStr HKCU "Environment" "PATH" $R1
  SendMessage ${HWND_BROADCAST} ${WM_WININICHANGE} 0 "STR:environment" /TIMEOUT=5000
  
  Pop $R5
  Pop $R4
  Pop $R3
  Pop $R2
  Pop $R1
FunctionEnd