![NodeHat](/assets/img/logo.png)

Simple Nodejs Chat Application. 
Demo available on http://chat-enver.rhcloud.com

TODO:
- Muting Chat sound option available.
- Cross browser compability.
- Smiley, image, url parsing.
- Txt validation, sanitization.
- Clean user session.

DONE: 
- Messages, users, sessions store on MongoDB.
- Auto-relogin with online user data when server freshed.
- Seperated files : Config, Handler, DB...
- User login seperated socket.io. It works with ajax post.
- Delete old messages by one hour interval. Except last 20 messages.
