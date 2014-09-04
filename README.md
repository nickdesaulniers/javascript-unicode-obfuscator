#JavaScript Unicode Obfuscator
Just a quick toy to obfuscate JS into unicode characters.

##Usage
```
npm install -g javascript-unicode-obfuscator
javascript-unicode-obfuscator my.js
```

##Example
```javascript
alert('hello world!');
```
becomes
```javascript
\u0061\u006c\u0065\u0072\u0074('\x68\x65\x6c\x6c\x6f\x20\x77\x6f\x72\x6c\x64\x21');
```
which you then can run within your browser.

##Idea
Not sure exactly what the rules are for what's valid JS unicode and what's not.
From playing around, it seems like a few chars cannot be converted to `\uXXXX`
form such as open paren, close paren, single quote, semi colon, and return.
Within a string, chars can be converted to `\xXX` form.

##Disclaimer
Not tested much at all.  Probably doesn't work with numerous other characters
and code that's already been escaped.

