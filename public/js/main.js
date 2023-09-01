var main = new function() {
  var self = this;

  this.STATUS_CONNECTED = 1;
  this.STATUS_DISCONNECTED = 0;

  this.MODE_EDIT = 'edit';
  this.MODE_RUN = 'run';

  this.PROJECT_SAVE_TOPIC = '_IoTy_Project';

  this.mode = this.MODE_EDIT;
  this.gridstackLayout = 'move';
  this.allowSettingsDialog = true;

  this.subscriptions = [];
  this.jsonSave = '';
  this.connected = false;
  this.linkMode = false;
  this.localOrRemoteDialog = null;
  this.enableSave = true;

  this.connectSettings = [
    {
      name: 'host',
      title: 'MQTT Host',
      type: 'text',
      value: 'wss://mqtt.a9i.sg:8081/mqtt'
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
    self.$bell = $('#bell');

    self.disableAddWidgetEvent = false;

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

    self.linkMode = self.loadGET();

    self.autoConnect();
    if (self.linkMode) {
      self.activateLinkMode();
    }

    // self.checkNotificationPermission();
  };

  // this.checkNotificationPermission = function() {
  //   if (!('Notification' in window)) {
  //     acknowledgeDialog({
  //       title: 'Warning',
  //       message: 'This browser does not support notifications. The notification widget will not work.'
  //     });
  //   } else if (Notification.permission == 'denied') {
  //     acknowledgeDialog({
  //       title: 'Warning',
  //       message: 'Notifications are blocked. Click on the lock pad icon in the address bar, reset notifications permissions, then reload the page.'
  //     });
  //   } else if (Notification.permission == 'default') {
  //     self.requestNotificationPermission();
  //   }
  // };

  // this.requestNotificationPermission = function() {
  //   confirmDialog({
  //     title: 'Notifications Permission',
  //     message: 'This site requires your approval for the notification widget to work.'
  //   }, function(){
  //     Notification.requestPermission()
  //   });
  // };

  this.activateLinkMode = function() {
    self.mode = self.MODE_RUN;
    self.$addNewWidget.addClass('hide');
    self.$run.addClass('hide');
    self.$trash.addClass('hide');
    self.$connectMenu.addClass('hide');
    self.$gridContainer.addClass('run');
    self.grid.disable();
  };

  this.loadGET = function() {
    let host = readGET('host');
    let username = readGET('username');
    let password = readGET('password');

    if (username && password) {
      self.setSetting(self.connectSettings, 'host', host);
      self.setSetting(self.connectSettings, 'username', username);
      self.setSetting(self.connectSettings, 'password', password);
      return true;
    }
    return false;
  };

  this.autoConnect = function() {
    if (this.getLastConnectSuccess() == 'true' || self.linkMode) {
      self.connect();
    }
  };

  this.run = function() {
    if (self.connected) {
      self.mode = self.MODE_RUN;
      self.$addNewWidget.addClass('hide');
      self.$run.addClass('hide');
      self.$trash.addClass('hide');
      self.$stop.removeClass('hide');
      self.$gridContainer.addClass('run');
      self.grid.disable();
      self.subscribeAll();
    } else {
      toastMsg('Connect to server first.');
    }
  };

  this.stop = function() {
    self.mode = self.MODE_EDIT;
    self.$addNewWidget.removeClass('hide');
    self.$run.removeClass('hide');
    self.$trash.removeClass('hide');
    self.$stop.addClass('hide');
    self.$gridContainer.removeClass('run');
    self.grid.enable();
    self.unsubscribeAll();
  }

  this.trashInfo = function() {
    toastMsg('Drag widgets here to delete');
  };

  this.initWidgetToolbox = function() {
    // Close when dragged out
    let dragging = false;
    self.$widgetToolbox[0].addEventListener('pointerdown', function(evt) {
      if (
        evt.target.classList.contains('widgetToolbox')
        || evt.target.classList.contains('row')
        || evt.target.classList.contains('toolboxLabel')
      ) {
        return;
      }
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
    function addWidget(WidgetClass) {
      let widget = new WidgetClass();
      let name = i18n.get(widget.widgetName);
      let html = widget.draw();

      self.$widgetToolbox.append(
        '<div class="row">' +
          html +
          '<div class="toolboxLabel">' + name + '</div>' +
        '</div>'
      )
    }

    for (let widget of IOTY_WIDGETS) {
      addWidget(widget.widgetClass);
    }
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
    self.grid = GridStack.init({
      float: true,
      cellHeight: 'initial',
      disableOneColumnMode: true,
      acceptWidgets: true,
      dragIn: '.newWidget',  // class that can be dragged from outside
      dragInOptions: { appendTo: 'body', helper: 'clone' }, // clone or can be your function
      removable: '#trash', // drag-out delete class
    });
    self.grid.on('added', self.gridStackAdded);
    self.grid.on('change', self.gridStackChange);
    self.grid.on('removed', self.gridStackRemoved);

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

  this.gridStackAdded = async function(e, items) {
    if (self.disableAddWidgetEvent) {
      return
    }
    for (let item of items) {
      item.el.classList.remove('newWidget');
      await attachIotyWidget(item.el);
    }
    self.gridStackChange(e, items);
  };

  this.gridStackChange = function(e, items) {
    if (! self.linkMode) {
      self.saveAndPublishJSON();
    }
  };

  this.gridStackRemoved = function(e, items) {
    for (let item of items) {
      item.el.widget.destroy();
    }
    window.setTimeout(self.gridStackChange, 0);
  }

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
        {html: i18n.get('#main-get_link#'), line: false, callback: self.getLink },
      ];

      menuDropDown(self.$connectMenu, menuItems, {className: 'connectMenuDropDown', align: 'right'});
    }
  };

  this.getLink = function() {
    let host = encodeURIComponent(self.getSetting(self.connectSettings, 'host'));
    let username = encodeURIComponent(self.getSetting(self.connectSettings, 'username'));
    let password = encodeURIComponent(self.getSetting(self.connectSettings, 'password'));
    const url = location.href + '?host=' + host + '&username=' + username + '&password=' + password;
    let $body = $(
      '<div>' +
        '<p>This link allows anyone to access your app without having to login.</p>' +
        '<div class="shareLink">' +
          '<p>' + url + '&nbsp;&nbsp;</p>' +
          '<div class="copy">Copy</div>' +
        '</div>' +
        '<div id="linkQRCode"></div>' +
      '</div>'
    );
    var $copy = $body.find('.copy');
    $copy.click(function() {
      toastMsg('Copied!');

      let $textarea = $('<textarea style="position: absolute; top: -9999px; left: -9999px;"></textarea>');
      $('body').append($textarea);
      $textarea.val(url);
      $textarea[0].select();
      $textarea[0].setSelectionRange(0, 99999); /*For mobile devices*/
      document.execCommand("copy");
      $('body').remove($textarea);
    });

    var options = {
      title: 'Share Link',
      message: $body
    };
    acknowledgeDialog(options);
    new QRCode('linkQRCode', {
      text: url,
      width: 150,
      height: 150,
      colorDark : "#000000",
      colorLight : "#ffffff",
      correctLevel : QRCode.CorrectLevel.L
  });
  }

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
      password: self.getSetting(self.connectSettings, 'password'),
      reconnect: true
    });
    self.connectTimeoutID = window.setTimeout(self.connectTimeout, 5 * 1000);
    self.setLastConnectSuccess('false');
  };

  this.setLastConnectSuccess = function(status) {
    localStorage.setItem('lastConnectSuccess', status);
  };

  this.getLastConnectSuccess = function() {
    return localStorage.getItem('lastConnectSuccess');
  };

  this.disconnect = function() {
    self.connected = false;
    if (self.client) {
      self.client.disconnect();
    }
    self.stop();
  };

  this.connectTimeout = function() {
    self.$connectWindow.$body.text('Connection timed out. Make sure your username and password are correct.');
    self.$connectWindow.$buttonsRow.removeClass('hide');
  };

  this.onConnect = function() {
    self.connected = true;
    window.clearInterval(self.connectTimeoutID);
    self.$connectWindow.close();
    self.setConnectStatus(self.STATUS_CONNECTED);
    let username = self.getSetting(self.connectSettings, 'username');
    self.client.subscribe(username + '/' + self.PROJECT_SAVE_TOPIC);
    self.setLastConnectSuccess('true');
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
    let username = self.getSetting(self.connectSettings, 'username');
    if (message.destinationName == username + '/' + self.PROJECT_SAVE_TOPIC) {
      self.loadProject(message.payloadString);

      if (self.linkMode) {
        self.subscribeAll();
      }

      return;
    }

    let elements = self.grid.getGridItems();
    for (let element of elements) {
      if (element.widget.subscriptions.includes(message.destinationName)) {
        let payload;
        try {
          payload = message.payloadString;
        } catch (err) {
          payload = message.payloadBytes;
        }
        element.widget.onMessageArrived(payload, message.destinationName);
      }
    }
  };

  this.publish = function(topic, payload) {
    if (topic.trim() != '' && self.connected) {
      let message = new Paho.MQTT.Message(payload);
      message.destinationName = topic;
      self.client.send(message);
    }
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
    if (settings instanceof Object) {
      for (let setting of this.connectSettings) {
        setting.value = settings[setting.name];
      }
    }

  };

  this.subscribeAll = function() {
    if (! self.connected) {
      return;
    }

    let elements = self.grid.getGridItems();
    let newSubscription = [];

    // Create a new subscription list without duplicates
    for (let element of elements) {
      for (let subscription of element.widget.subscriptions) {
        if (subscription.trim() != '') {
          newSubscription.push(subscription);
        }
      }
    }

    for (let subscription of newSubscription) {
      self.client.subscribe(subscription);
    }

    this.subscriptions = newSubscription;
  };

  this.updateSubscriptions = function() {
    if (! self.connected) {
      return;
    }

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

    for (let subscription of unsubscribe) {
      self.client.unsubscribe(subscription);
    }
    for (let subscription of subscribe) {
      self.client.subscribe(subscription);
    }

    this.subscriptions = newSubscription;
  };

  this.unsubscribeAll = function() {
    if (! self.connected) {
      return;
    }

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

  this.saveAndPublishJSON = function() {
    if (self.enableSave == false) {
      return;
    }
    self.saveJSON();

    if (self.connected) {
      let username = self.getSetting(self.connectSettings, 'username');
      let topic = username + '/' + self.PROJECT_SAVE_TOPIC;

      let message = new Paho.MQTT.Message(self.jsonSave);
      message.destinationName = topic;
      message.retained = true;
      message.qos = 1;
      self.client.send(message);
    }
  };

  this.saveJSON = function() {
    self.jsonSave = self.getJSON();
  }

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

  this.loadJSON = async function(json) {
    self.grid.removeAll();
    let save = JSON.parse(json);

    self.disableAddWidgetEvent = true;
    for (let widget of save.widgets) {
      let content;

      for (let iotyWidget of IOTY_WIDGETS) {
        if (widget.type == iotyWidget.type) {
          content = new iotyWidget.widgetClass().draw();
          break;
        }
      }
      let ele = self.grid.addWidget(content, {
        x: widget.x,
        y: widget.y,
        w: widget.w,
        h: widget.h
      });

      ele.classList.remove('newWidget');
      await attachIotyWidget(ele);
      for (let name in widget.settings) {
        ele.widget.setSetting(name, widget.settings[name]);
      }
      ele.widget.processSettings();
    }
    self.disableAddWidgetEvent = false;

    return save;
  };

  this.loadProject = function(json) {
    self.enableSave = false;

    if (self.jsonSave == '' || self.linkMode) {
      self.loadJSON(json);
      self.jsonSave = json;
    } else if (json == self.jsonSave) {
      if (this.localOrRemoteDialog) {
        this.localOrRemoteDialog.close();
      }
    } else {
      if (this.localOrRemoteDialog) {
        this.localOrRemoteDialog.close();
      }
      self.selectLocalOrRemoteSave(json);
    }

    self.enableSave = true;
  };

  this.selectLocalOrRemoteSave = function(json) {
    let $body = $('<div class="selectLocalOrRemoteSave"></div>');
    let $msg = $(
      '<div>' +
        'The project file on the server differs from the one on your browser. ' +
        'Which copy should I keep?' +
      '</div>'
    );
    $body.append($msg);

    let $buttons = $(
      '<button type="button" class="local btn-light">Keep local copy</button>' +
      '<button type="button" class="remote btn-light">Use remote copy</button>'
    );

    let $dialog = dialog('Local or Remote?', $body, $buttons);
    this.localOrRemoteDialog = $dialog;

    $buttons.siblings('.local').click(function() {
      self.saveAndPublishJSON();
      $dialog.close();
      this.localOrRemoteDialog = null;
    });
    $buttons.siblings('.remote').click((function(){
      self.loadJSON(json);
      self.jsonSave = json;
      $dialog.close();
      this.localOrRemoteDialog = null;
    }).bind(this));
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
