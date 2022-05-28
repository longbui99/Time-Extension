# Chrome's Time Management Extension.

In this project, I am proposing a feature for end-user lazying like me. Because that takes to long for me to open our time management system and log what I have just done. 

I am also provide a system for you to doing a time management tracking with so many impressive features. Contact me for futher information.

## Main Features
- Sign in to server (no matter that's cloud or not, but you probably need to use https:// domain for the server)
- Search tickets/issues that we would want to working on.
- View the total duration of all people, view your total duration and your active duration so far.
- View assignee, status of the ticket/issue
- Add comment for issue
- Manually log time if you don't want to track or you didn't start tracking time.
- Start, Pause, Stop tracking time.
- View all related active tickets and quick change to continue working if something interrupted your normal progress.

## For Developer.

| Name | Description | Endpoint | Request Type | Request Payload | Response Type | Response Payload
--- | --- | --- | --- | --- |--- |--- 
| Login | This API is used for detect user in your system. <br> You have to response the unique set of character then use can use it later for erase access from extension to your system. | /web/login/jwt | GET (text/html) | login=(type string)&password=(type string)| json/application | {"data": string}
| Search ticket | We will send and unique character to your system via GET method to fetch all issues. <br> Default is limit 11 result, but if your system have another config, you can ignore our limit. | /management/ticket/search/{string: keyword} | GET (text/html) | jwt=string | json/application | [{<br>id: string<br>name:string<br>key:string<br>point:integer<br>project:string<br>projectKey:string<br>assignee:string<br>assigneeEmail:string<br>status:string<br>total_duration:integer<br>my_total_duration:integer<br>active_duration:integer<br>last_start: Date()<br>url:string <br>}, ...] 

Continue updating ...
