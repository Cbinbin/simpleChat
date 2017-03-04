//引入程序包
var express = require('express')
  , cors = require('cors')
  , path = require('path')
  , logger = require('morgan')
  , favicon = require('serve-favicon')
  , bodyParser = require('body-parser')
  , errorHandler = require('errorhandler')
  , methodOverride = require('method-override')
  , app = express()
  , port = 3000;


var server = app.listen(port, ()=> {
  console.log("Express server listening on port " + port);
});
var io = require('socket.io').listen(server);
var getTime = ()=> {
  var date = new Date();
  return date.getHours()+":"+date.getMinutes()+":"+date.getSeconds();
}

var getColor = ()=> {
  var colors = ['aliceblue','antiquewhite','aqua','aquamarine','pink','red','green',
                'orange','blue','blueviolet','brown','burlywood','cadetblue'];
  return colors[Math.round(Math.random() * 10000 % colors.length)];
}



//设置日志级别
io.set('log level', 1); 

//WebSocket连接监听
io.on('connection', (socket)=> {
  socket.emit('open');//通知客户端已连接

  // 打印握手信息
  // console.log(socket.handshake);

  // 构造客户端对象
  var client = {
    socket:socket,
    name:false,
    color:getColor()
  }
  
  // 对message事件的监听
  socket.on('message', (msg)=> {
    var obj = {time:getTime(),color:client.color};

    // 判断是不是第一次连接，以第一条消息作为用户名
    if(!client.name){
        client.name = msg;
        obj['text']=client.name;
        obj['author']='System';
        obj['type']='welcome';
        console.log(client.name + ' login');

        //返回欢迎语
        socket.emit('system',obj);
        //广播新用户已登陆
        socket.broadcast.emit('system',obj);
     }else{

        //如果不是第一次的连接，正常的聊天消息
        obj['text']=msg;
        obj['author']=client.name;      
        obj['type']='message';
        console.log(client.name + ' say: ' + msg);

        // 返回消息（可以省略）
        socket.emit('message',obj);
        // 广播向其他用户发消息
        socket.broadcast.emit('message',obj);
      }
    });

    //监听出退事件
    socket.on('disconnect', ()=> {  
      var obj = {
        time:getTime(),
        color:client.color,
        author:'System',
        text:client.name,
        type:'disconnect'
      };

      // 广播用户已退出
      socket.broadcast.emit('system',obj);
      console.log(client.name + 'Disconnect');
    });
  
});

//express基本配置
app.set('views', __dirname + '/views');
app.use(cors());
app.use(logger('dev'));
app.use(methodOverride());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(express.static(path.join(__dirname, 'public')));

if('development' == app.get('env')) {
  app.use(errorHandler());
}

// 指定webscoket的客户端的html文件
app.get('/', (req, res)=> {
  res.sendfile('views/chat.html');
});
