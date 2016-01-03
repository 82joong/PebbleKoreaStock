var UI = require('ui');
var Vector2 = require('vector2');
var ws = new WebSocket('ws://hamt.kr:8222'); 

// Show splash screen while waiting for data
var splashWindow = new UI.Window();

// Text element to inform user
var text = new UI.Text({
  position: new Vector2(0, 0),
  size: new Vector2(144, 168),
  text:'Connecting Stock data...',
  font:'GOTHIC_18_BOLD',
  color:'black',
  textOverflow:'wrap',
  textAlign:'center',
  backgroundColor:'white'
});

// Add to splashWindow and show
splashWindow.add(text);
splashWindow.show();




var parseFeed = function(data) {
  var items = [];
  for(var i = 0; i < data.length; i++) {
    var item = JSON.parse(data[i]);
    var title = item[1];
    var subtitle = item[3];

    items.push({
      title:title,
      subtitle:subtitle
    });
  }
  return items;
};

var card = new UI.Card({
  title:'',
  subtitle:'',
});

ws.onmessage = function (event) { 
  console.log('onmessage ::' + event.data);
  var packet = JSON.parse(event.data);
  
  switch(packet.type) {
    case 'connect':
        var send_packet = {
          'type': 'token',
          'key': Pebble.getWatchToken(),
          'data': ''
        };
        console.log(send_packet);
        ws.send(JSON.stringify(send_packet));
      break;
      
    case 'list':
      var menuItems = parseFeed(JSON.parse(packet.data));
      var resultsMenu = new UI.Menu({
        sections: [{
          title: '',
          items: menuItems
        }]
      });
      resultsMenu.show();
      splashWindow.hide();
      
      resultsMenu.on('select', function(e) {
        console.log('select :: ' + e.itemIndex);
        card.body('Retrieving the data...');
        card.scrollable(true);
        card.style('small');
        card.show();
        
        var idx = e.itemIndex;
        var send_packet = {
          'type': 'detail',
          'data': idx.toString()
        };
        ws.send(JSON.stringify(send_packet));
      });      
      break;
      
    case 'detail':
      var detail_data = JSON.parse(packet.data);
      var contents = '';
      for(var i = 0; i < detail_data.length; i++) {
        contents += '-'+detail_data[i]+'\n';
      }
      card.body(contents);
      card.scrollable(true);
      card.style('small');
      card.show();
      break;
  }
};


card.on('click', 'back', function(e) {
  console.log('back');
  var send_packet = {
    'type': 'stop_interval'
  };
  ws.send(JSON.stringify(send_packet));
  card.hide();
});




Pebble.addEventListener('showConfiguration', function(e) {
  Pebble.openURL('http://hamt.kr:8223');
});


Pebble.addEventListener('webviewclosed', function(e) {
  var config_data = JSON.parse(decodeURIComponent(e.response));
  console.log(config_data.code);
  var send_packet = {
    'type': 'configuration',
    'key': Pebble.getWatchToken(),
    'data': config_data.code
  };
  console.log('Config window returned: ', JSON.stringify(send_packet));
  ws.send(JSON.stringify(send_packet));
});