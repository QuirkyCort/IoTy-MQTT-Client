var main = new function() {
  var self = this;

  this.mode = 'edit';
  this.gridstackLayout = 'move';
  this.allowSettingsDialog = true;

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

    self.updateTextLanguage();
    self.initWidgetToolbox();
    self.initGridStack();

    self.$addNewWidget.click(self.toggleWidgetToolbox);
    self.$languageMenu.click(self.toggleLanguageMenu);
    self.$connectMenu.click(self.toggleConnectMenu);
    self.$trash.click(self.trashInfo);
    self.$run.click(self.run);
    self.$stop.click(self.stop);
  };

  this.run = function() {
    self.mode = 'run';
    self.$addNewWidget.addClass('hide');
    self.$run.addClass('hide');
    self.$trash.addClass('hide');
    self.$stop.removeClass('hide');
  };

  this.stop = function() {
    self.mode = 'run';
    self.$addNewWidget.removeClass('hide');
    self.$run.removeClass('hide');
    self.$trash.removeClass('hide');
    self.$stop.addClass('hide');
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
    let widget;
    widget = new IotyButton();
    self.$widgetToolbox.append(widget.draw());
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
        {html: i18n.get('#main-connect#'), line: false, callback: ble.connect },
        {html: i18n.get('#main-disconnect#'), line: false, callback: ble.disconnect},
      ];

      menuDropDown(self.$connectMenu, menuItems, {className: 'connectMenuDropDown', align: 'right'});
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
