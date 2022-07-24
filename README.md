# Chrome's Work Tracking Extension.

In this project, I am proposing a feature for end-user lazying like me. Because that takes to long for me to open our time management system and log what I have just done. 

I am also provide a system for you to doing a time management tracking with so many impressive features. Contact me for futher information.

## Main Features
### General
- Sign in to server (no matter that's cloud or not, but you probably need to use https:// domain for the server)
- Search tickets/issues that we would want to working on.
### Clock Traking
![Clock](./readme/clock1.png)
![Clock](./readme/clock2.png)
- View the total duration of all people, view your total duration and your active duration so far.
- View assignee, tester, status of the ticket/issue
- Add comment for issue
- Manually log time if you don't want to track or you didn't start tracking time.
- Log to the specific date. (default is the noon of the user's browser timezone)
- Start, Pause, Stop tracking time.
- View all related active tickets and navigate to related ticket by clicking at their ticket key.
### Checklists
![Clock](./readme/checklist.png)
- Write checklist for the particular issue.
- Reorder checklists.
- Toggle between checklist header and checkbox.
- Bold **(Ctrl + B)** and Italic **(Ctrl + I)** is acceptable. 
### Favorites
![Clock](./readme/favorite.png)
- Add/Remove from favorite/todo list.
- Navigate to favorite ticket by clicking on their ticket-key

## Keyboard Shortcuts
- **Ctrl + Shift + Digit[1,3]**: To navigate to the particular tab.

### Tab 1: Clock
- **Ctrl + Shift + Alt**: For pinning extension to main page view.
- **Ctrl + Shift + F**: For move to searching board.
- **Ctrl + Shift + E**: To export current tab to the original server.
- **Ctrl + Shift + MouseClick** at the export icon: To export current tab to the original server.
- **Ctrl + Alt + Space**: For toggling extension.
- **Ctrl + Alt + Click** at the clock icon: To cancel current logs.
- **Ctrl + Enter**: To perform done work log.
### Tab 2: Checklist
- **Ctrl + ?/**: To togger checklist between header and checked box.
- **Ctrl + Delete/Backspace** at the empty line: To delete the particular checklist.
- **Move Up/ Move Down**: To change the checklist.
- **Enter**: To create new checklist under current checklist.
- **Ctrl + Enter**: To save current checklist to the server.
## For Developer.   

| Name | Description | Endpoint | Request Type | Request Payload | Response Type | Response Payload
--- | --- | --- | --- | --- |--- |--- 
| Login | This API is used for detect user in your system.  You have to response the unique set of character then use can use it later for erase access from extension to your system. | /web/login/jwt | POST (text/html) | ```{login:string, password:string}```| json/application | `{"data": string}`
| Search ticket | We will send and unique character to your system via GET method to fetch all issues.  Default is limit 11 result, but if your system have another config, you can ignore our limit. | /management/ticket/search/{string: keyword} | GET (text/html) | jwt=string | json/application | ```[{id: string, name:string, key:string, point:integer, project:string,projectKey:string, assignee:string, assigneeEmail:string, status:string, total_duration:integer,my_total_duration:integer, active_duration:integer, last_start: Date(), url:string}, ...] ```
|

Continue updating ...
