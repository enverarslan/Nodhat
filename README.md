![NodeHat](/assets/img/logo.png)

Simple Nodejs Chat Application. 
Demo available on http://chat.vefasizalem.org/

TODO:
- Recent messages store on Redis or MongoDB. //
- Muting Chat sound option available.
- Cross browser compability.
- Smiley, image, url parsing.
- Txt validation, sanitization.
- Clean user session.

DONE: 
- Messages, users, sessions store on MongoDB. //May be implemented Redis with common data interface.
- Auto-relogin with online user data when server freshed.
- Seperated files : Config, Handler, DB...
- User login seperated socket.io. It works with ajax post.
- Delete old messages by one hour interval. Except last 20 messages.
