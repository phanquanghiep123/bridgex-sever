# Event log items

| Type        | Display | Trigger                                          | Importance  | Subject                                                                    |
| ----------- | ------- | ------------------------------------------------ | ----------- | -------------------------------------------------------------------------- |
| Bridge ログ | ON      | Download タスク作成時                            | information | "Create Task ( Download : \${packageName} )"                               |
| Bridge ログ | ON      | Download タスク実行時                            | information | "Start Task ( Download : \${packageName} )"                                |
| Bridge ログ | ON      | Download タスク成功時                            | information | "Success Task ( Download : \${packageName} )"                              |
| Bridge ログ | ON      | Download タスク失敗時                            | error       | "Fail Task ( Download : ${packageName} ) Error : ${result}"                |
| Bridge ログ | ON      | Retrieve Log タスク作成時                        | information | "Create Task ( Retrieve Log : \${logType} )"                               |
| Bridge ログ | ON      | Retrieve Log タスク実行時                        | information | "Start Task ( Retrieve Log : \${logType} )"                                |
| Bridge ログ | ON      | Retrieve Log タスク成功時                        | information | "Success Task ( Retrieve Log : \${logType} )"                              |
| Bridge ログ | ON      | Retrieve Log タスク失敗時                        | error       | "Fail Task ( Retrieve Log : ${logType} ) Error : ${result}"                |
| Asset ログ  | ON      | /glory/g-connect/event/Connection 受信時         | information | "Device ${assetId} / ${typeId} : Connected ( IP Address : \${ipAddress} )" |
| Asset ログ  | ON      | /glory/g-connect/event/Connection 受信時         | information | "Device ${assetId} / ${typeId} : Disconnected"                             |
| Asset ログ  | ON      | /glory/g-connect/event/Established 受信時        | information | "Device ${assetId} / ${typeId} : Established versions：[ ${versions} ]"    |
| Asset ログ  | ON      | /glory/g-connect/event/AssetStatusUpdated 受信時 | error       | "Device ${assetId} / ${typeId} : Error : ${errorCode} ( ${errorMessage} )" |
| Asset ログ  | ON      | /glory/g-connect/event/FirmwareUpdated 受信時    | information | "Device ${assetId} / ${typeId} : Firmware updated [ ${package list} ]"     |

-   Type
    -   Bridge ログ : Bridge-X server 自身のタイミングで記録するログ
    -   Asset ログ : Asset から通知された event-message 受信時に記録するログ
-   Display
    -   ON : 画面に表示するログ
    -   OFF : 画面に表示しないログ
-   Trigger
    -   ログを記録するタイミング
-   Importance
    -   information : 正常な動作のログ
    -   error : 何らかの異常のログ
-   Subject
    -   Asset Detail 画面、Event List 画面に表示する情報

---

---
