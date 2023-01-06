var main = new function() {
  var self = this;

  this.STATUS_CONNECTED = 1;
  this.STATUS_DISCONNECTED = 0;

  this.MODE_EDIT = 'edit';
  this.MODE_RUN = 'run';

  this.mode = this.MODE_EDIT;
  this.gridstackLayout = 'move';
  this.allowSettingsDialog = true;

  this.subscriptions = [];

  this.connectSettings = [
    {
      name: 'host',
      title: 'MQTT Host',
      type: 'text',
      value: 'wss://a9i.sg:8081/mqtt'
    },
    {
      name: 'username',
      title: 'Username',
      type: 'text',
      value: ''
    },
    {
      name: 'password',
      title: 'Password',
      type: 'text',
      value: ''
    },
  ];

  // Run on page load
  this.init = function() {
    self.$languageMenu = $('.language');
    self.$connectStatus = $('#connectionStatus')
    self.$connectMenu = $('#connectMenu');
    self.$addNewWidget = $('#addNewWidget');
    self.$run = $('#run');
    self.$stop = $('#stop');
    self.$widgetToolbox = $('#widgetToolbox');
    self.$trash = $('#trash');
    self.$gridContainer = $('.gridContainer');

    self.updateTextLanguage();
    self.initWidgetToolbox();
    self.initGridStack();
    self.loadConnectSettings();

    self.$addNewWidget.click(self.toggleWidgetToolbox);
    self.$languageMenu.click(self.toggleLanguageMenu);
    self.$connectMenu.click(self.toggleConnectMenu);
    self.$trash.click(self.trashInfo);
    self.$run.click(self.run);
    self.$stop.click(self.stop);
  };

  this.run = function() {
    self.mode = self.MODE_RUN;
    self.$addNewWidget.addClass('hide');
    self.$run.addClass('hide');
    self.$trash.addClass('hide');
    self.$stop.removeClass('hide');
    self.$gridContainer.addClass('run');
    self.grid.disable();
    self.updateSubscriptions();
  };

  this.stop = function() {
    self.mode = self.MODE_EDIT;
    self.$addNewWidget.removeClass('hide');
    self.$run.removeClass('hide');
    self.$trash.removeClass('hide');
    self.$stop.addClass('hide');
    self.$gridContainer.removeClass('run');
    self.grid.enable();
  }

  this.trashInfo = function() {
    toastMsg('Drag widgets here to delete');
  };

  this.initWidgetToolbox = function() {
    // Close when dragged out
    let dragging = false;
    self.$widgetToolbox[0].addEventListener('pointerdown', function() {
      dragging = true;
    });
    self.$widgetToolbox[0].addEventListener('pointerup', function() {
      dragging = false;
    });
    self.$widgetToolbox[0].addEventListener('pointerleave', function() {
      if (dragging) {
        self.closeWidgetToolbox();
        dragging = false;
      }
    });

    // Draw widgets
    self.$widgetToolbox.append('<div class="toolboxLabel">Label</div>');
    self.$widgetToolbox.append(new IotyLabel().draw());
    self.$widgetToolbox.append('<div class="toolboxLabel">Button</div>');
    self.$widgetToolbox.append(new IotyButton().draw());
    self.$widgetToolbox.append('<div class="toolboxLabel">Display</div>');
    self.$widgetToolbox.append(new IotyDisplay().draw());
  };

  this.closeWidgetToolbox = function() {
    self.$widgetToolbox.addClass('hide');
  };

  this.toggleWidgetToolbox = function() {
    self.$widgetToolbox.toggleClass('hide');
  };

  this.resizeGrid = function() {
    let width = document.body.clientWidth;
    if (width < 600) {
      self.grid.column(4, self.gridstackLayout).cellHeight('25vw');
    } else if (width < 1000) {
      self.grid.column(8, self.gridstackLayout).cellHeight('12.25vw');
    } else {
      self.grid.column(12, self.gridstackLayout).cellHeight('8.3333vw');
    }
  };

  this.initGridStack = function() {
    // var items = [
    //   {content: 'my first widget'}, // will default to location (0,0) and 1x1
    //   {w: 2, content: 'another longer widget!'} // will be placed next at (1,0) and 2x1
    // ];
    self.grid = GridStack.init({
      float: true,
      cellHeight: 'initial',
      disableOneColumnMode: true,
      acceptWidgets: true,
      dragIn: '.newWidget',  // class that can be dragged from outside
      dragInOptions: { appendTo: 'body', helper: 'clone' }, // clone or can be your function
      removable: '#trash', // drag-out delete class
    });
    // self.grid.load(items);
    self.grid.on('added', self.gridStackAdded);

    // Prevent resize from triggering settings dialog
    self.grid.on('resizestart', function(e, ele) {
      self.allowSettingsDialog = false;
    });
    self.grid.on('resizestop', function(e, ele) {
      window.setTimeout(function() {
        self.allowSettingsDialog = true;
      }, 0);
    });


    self.resizeGrid();
    window.addEventListener('resize', self.resizeGrid);
  };

  this.gridStackAdded = function(e, items) {
    for (let item of items) {
      item.el.classList.remove('newWidget');
      attachIotyWidget(item.el);
    }
  };

  // Update text already in html
  this.updateTextLanguage = function() {
  };

  // Toggle language menu
  this.toggleLanguageMenu = function(e) {
    if ($('.languageMenuDropDown').length == 0) {
      $('.menuDropDown').remove();
      e.stopPropagation();

      function setLang(lang) {
        localStorage.setItem('LANG', lang);
        window.location.reload();
      }

      let menuItems = [
        {html: 'Deutsch', line: false, callback: function() { setLang('de'); }},
        {html: 'Ελληνικά', line: false, callback: function() { setLang('el'); }},
        {html: 'English', line: false, callback: function() { setLang('en'); }},
        {html: 'Español', line: false, callback: function() { setLang('es'); }},
        {html: 'Français', line: false, callback: function() { setLang('fr'); }},
        {html: 'עברית', line: false, callback: function() { setLang('he'); }},
        {html: 'Nederlands', line: false, callback: function() { setLang('nl'); }},
        {html: 'Português', line: false, callback: function() { setLang('pt'); }},
        {html: 'tlhIngan', line: false, callback: function() { setLang('tlh'); }},
        {html: 'Русский', line: false, callback: function() { setLang('ru'); }},
        {html: 'Magyar', line: false, callback: function() { setLang('hu'); }},
      ];

      menuDropDown(self.$languageMenu, menuItems, {className: 'languageMenuDropDown', align: 'right'});
    }
  };

  // Toggle connect
  this.toggleConnectMenu = function(e) {
    if ($('.connectMenuDropDown').length == 0) {
      $('.menuDropDown').remove();
      e.stopPropagation();

      let menuItems = [
        {html: i18n.get('#main-connect#'), line: false, callback: self.connectDialog },
        {html: i18n.get('#main-disconnect#'), line: false, callback: self.disconnect},
      ];

      menuDropDown(self.$connectMenu, menuItems, {className: 'connectMenuDropDown', align: 'right'});
    }
  };

  this.setSetting = function(settings, name, value) {
    for (let setting of settings) {
      if (setting.name == name) {
        setting.value = value;
      }
    }
  };

  this.getSetting = function(settings, name) {
    for (let setting of settings) {
      if (setting.name == name) {
        return setting.value;
      }
    }
  };

  this.connectDialog = function() {
    let $body = $('<div class="settings"></div>');
    let values = [];

    for (let setting of self.connectSettings) {
      if (setting.type == 'text') {
        let obj = genDialog.text(setting);
        $body.append(obj.ele);
        values.push(...obj.values);
      }
    }

    let $buttons = $(
      '<button type="button" class="cancel btn-light">Cancel</button>' +
      '<button type="button" class="confirm btn-success">Connect</button>'
    );

    let $dialog = dialog(i18n.replace('#main-connect#'), $body, $buttons);

    $buttons.siblings('.cancel').click(function() { $dialog.close(); });
    $buttons.siblings('.confirm').click((function(){
      for (let a of values) {
        self.setSetting(self.connectSettings, a.name, a.ele.value);
      }
      self.saveConnectSettings();
      self.connect();
      $dialog.close();
    }));
  };

  this.connect = function() {
    self.$connectWindow = self.hiddenButtonDialog('Connecting to Server', 'Connecting...');
    let hostname = self.getSetting(self.connectSettings, 'host');
    let clientID = self.genClientID();
    self.client = new Paho.MQTT.Client(hostname, clientID);
    self.client.onConnectionLost = self.onConnectionLost;
    self.client.onMessageArrived = self.onMessageArrived;
    self.client.connect({
      onSuccess: self.onConnect,
      userName: self.getSetting(self.connectSettings, 'username'),
      password: self.getSetting(self.connectSettings, 'password')
    });
    self.connectTimeoutID = window.setTimeout(self.connectTimeout, 5 * 1000);
  };

  this.disconnect = function() {
    self.client.disconnect();
  };

  this.connectTimeout = function() {
    self.$connectWindow.$body.text('Connection timed out. Make sure your username and password are correct.');
    self.$connectWindow.$buttonsRow.removeClass('hide');
  };

  this.onConnect = function() {
    window.clearInterval(self.connectTimeoutID);
    self.$connectWindow.close();
    self.setConnectStatus(self.STATUS_CONNECTED);
  };

  this.onConnectionLost = function(responseObject) {
    window.clearInterval(self.connectTimeoutID);
    self.setConnectStatus(self.STATUS_DISCONNECTED);
    if (responseObject.errorCode !== 0) {
      toastMsg('Connection Lost: ' + responseObject.errorMessage);
      console.log(responseObject.errorMessage);
    }
  };

  this.onMessageArrived = function(message) {
    let elements = self.grid.getGridItems();
    for (let element of elements) {
      if (element.widget.subscriptions.includes(message.destinationName)) {
        element.widget.onMessageArrived(message.payloadString);
      }
    }
  };

  this.publish = function(topic, payload) {
    let message = new Paho.MQTT.Message(payload);
    message.destinationName = topic;
    self.client.send(message);
  };

  this.hiddenButtonDialog = function(title, body) {
    let $dialog = acknowledgeDialog({
      title: title,
      message: body
    });
    $dialog.$buttonsRow.addClass('hide');

    return $dialog;
  };

  this.saveConnectSettings = function() {
    let settings = {};

    for (let setting of this.connectSettings) {
      settings[setting.name] = setting.value;
    }

    localStorage.setItem('connectSettings', JSON.stringify(settings));
  };

  this.loadConnectSettings = function() {
    let settings = JSON.parse(localStorage.getItem('connectSettings'));

    for (let setting of this.connectSettings) {
      setting.value = settings[setting.name];
    }
  };

  this.updateSubscriptions = function() {
    let elements = self.grid.getGridItems();
    let newSubscription = [];

    // Create a new subscription list without duplicates
    for (let element of elements) {
      for (let subscription of element.widget.subscriptions) {
        if (! newSubscription.includes(subscription)) {
          newSubscription.push(subscription);
        }
      }
    }

    let unsubscribe = [];
    let subscribe = [];

    for (let subscription of this.subscriptions) {
      if (! newSubscription.includes(subscription)) {
        unsubscribe.push(subscription);
      }
    }

    for (let subscription of newSubscription) {
      if (! this.subscriptions.includes(subscription)) {
        subscribe.push(subscription);
      }
    }

    console.log('subscribe');
    console.log(subscribe);
    console.log('unsubscribe');
    console.log(unsubscribe);

    for (let subscription of unsubscribe) {
      self.client.unsubscribe(subscription);
    }
    for (let subscription of subscribe) {
      self.client.subscribe(subscription);
    }

    this.subscriptions = newSubscription;
  };

  this.unsubscribeAll = function() {
    for (let subscription of this.subscriptions) {
      self.client.unsubscribe(subscription);
    }

    this.subscriptions = [];
  };

  this.genClientID = function() {
    let rand = '';
    for (let i=0; i<8; i++) {
      rand += Math.random().toString()[2];
    }
    return 'IoTy-' + rand;
  };

  this.getJSON = function() {
    let elements = self.grid.getGridItems();
    let save = { widgets: [] };

    for (let element of elements) {
      let widget = {};
      widget.x = element.getAttribute('gs-x');
      widget.y = element.getAttribute('gs-y');
      widget.w = element.getAttribute('gs-w');
      widget.h = element.getAttribute('gs-h');
      widget.type = element.getAttribute('ioty-type');
      widget.settings = {};
      for (let setting of element.widget.settings) {
        if (setting.save) {
          widget.settings[setting.name] = setting.value;
        }
      }
      save.widgets.push(widget);
    }

    return JSON.stringify(save);
  };

  this.loadJSON = function(json) {
    let save = JSON.parse(json);

    for (let widget of save.widgets) {
      let content;

      if (widget.type == 'button') {
        content = new IotyButton().draw();
      } else if (widget.type == 'label') {
        content = new IotyLabel().draw();
      } else if (widget.type == 'display') {
        content = new IotyDisplay().draw();
      }
      let ele = self.grid.addWidget(content, {
        x: widget.x,
        y: widget.y,
        w: widget.w,
        h: widget.h
      });

      attachIotyWidget(ele);
      for (let name in widget.settings) {
        ele.widget.setSetting(name, widget.settings[name]);
      }
      ele.widget.processSettings();
    }
  };

  // Set connect status
  this.setConnectStatus = function(status) {
    if (status == self.STATUS_CONNECTED) {
      self.$connectStatus.text('Connected');
      self.$connectStatus.addClass('connected');
    } else if (status == self.STATUS_DISCONNECTED) {
      self.$connectStatus.text('Disconnected');
      self.$connectStatus.removeClass('connected');
    }
  };
}

// Init class
main.init();
