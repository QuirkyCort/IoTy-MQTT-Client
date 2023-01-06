class IotyWidget {
  constructor() {
    this.topHTML =
      '<div class="newWidget grid-stack-item" #type #minW #minH #w #h>' +
        '<div class="grid-stack-item-content">';
    this.bottomHTML =
        '</div>' +
      '</div>';
    this.content = '';
    this.element = null;
    this.subscriptions = [];

    this.options = {
      type: '',
      minW: null,
      minH: null,
      w: 1,
      h: 1
    }

    this.nameSub = {
      type: 'ioty-type',
      minW: 'gs-min-w',
      minH: 'gs-min-h',
      w: 'gs-w',
      h: 'gs-h'
    }

    this.settings = [];
  }

  draw() {
    let topHTML = this.topHTML;
    for (let option in this.options) {
      let value = this.options[option];
      let replacement = '';
      if (value) {
        replacement = this.nameSub[option] + '="' + value + '"';
      }
      topHTML = topHTML.replace('#' + option, replacement);
    }

    return topHTML + this.content + this.bottomHTML;
  }

  attach(ele) {
    this.element = ele;
    ele.addEventListener('click', this.settingsDialog.bind(this));
  }

  setSetting(name, value) {
    for (let setting of this.settings) {
      if (setting.name == name) {
        setting.value = value;
      }
    }
  }

  getSetting(name) {
    for (let setting of this.settings) {
      if (setting.name == name) {
        return setting.value;
      }
    }
  }

  settingsDialog() {
    if (main.mode == main.MODE_EDIT && main.allowSettingsDialog) {
      let $body = $('<div class="settings"></div>');
      let values = [];

      for (let setting of this.settings) {
        let obj;
        if (setting.type == 'text') {
          obj = genDialog.text(setting);
          values.push(...obj.values);
        } else if (setting.type == 'label') {
          obj = genDialog.label(setting);
        }
        $body.append(obj.ele);
      }

      let $buttons = $(
        '<button type="button" class="cancel btn-light">Cancel</button>' +
        '<button type="button" class="confirm btn-success">Ok</button>'
      );

      let $dialog = dialog(i18n.replace(this.widgetName + ' #widget-settings#'), $body, $buttons);

      $buttons.siblings('.cancel').click(function() { $dialog.close(); });
      $buttons.siblings('.confirm').click((function(){
        for (let a of values) {
          this.setSetting(a.name, a.ele.value);
        }
        if (typeof this.processSettings == 'function') {
          this.processSettings();
        }
        $dialog.close();
      }).bind(this));
    }
  }

  onMessageArrived(payload) {
  }
}

class IotyLabel extends IotyWidget {
  constructor() {
    super();
    this.content = '<div class="label"><div>Label</div></div>'
    this.options.type = 'label';
    this.widgetName = '#widget-label#';

    let settings = [
      {
        name: 'description',
        title: 'Description',
        type: 'label',
        value: 'The label widget is only used for displaying text. It does not send or receives any messages.'
      },
      {
        name: 'label',
        title: 'Label',
        type: 'text',
        value: 'Label',
        help: 'Text on the label.'
      },
    ];
    this.settings.push(...settings);
  }

  attach(ele) {
    super.attach(ele);
  }

  processSettings() {
    let label = this.element.querySelector('.label');
    label.innerText = this.getSetting('label');
  }
}

class IotyButton extends IotyWidget {
  constructor() {
    super();
    this.content = '<div class="button"><div>BTN</div></div>'
    this.options.type = 'button';
    this.widgetName = '#widget-button#';
    this.state = 0;

    let settings = [
      {
        name: 'description',
        title: 'Description',
        type: 'label',
        value: 'The button widget will publish a message to the specified topic when the button is pressed, and another message when released.'
      },
      {
        name: 'topic',
        title: 'MQTT Topic',
        type: 'text',
        value: '',
        help: 'Topic to publish to.'
      },
      {
        name: 'press',
        title: 'Send on Press',
        type: 'text',
        value: '1',
        help: 'This value will be published when the button is pressed.'
      },
      {
        name: 'release',
        title: 'Send on Release',
        type: 'text',
        value: '0',
        help: 'This value will be published when the button is released.'
      },
      {
        name: 'label',
        title: 'Label',
        type: 'text',
        value: 'BTN',
        help: 'Text on the button.'
      },
    ];
    this.settings.push(...settings);
  }

  attach(ele) {
    super.attach(ele);
    let button = ele.querySelector('.button');
    button.addEventListener('pointerdown', this.buttonDown.bind(this));
    button.addEventListener('pointerup', this.buttonUp.bind(this));
    button.addEventListener('pointerleave', this.buttonUp.bind(this));
  }

  processSettings() {
    let button = this.element.querySelector('.button');
    button.innerText = this.getSetting('label');
  }

  buttonDown() {
    if (main.mode == main.MODE_RUN) {
      this.state = 1;
      main.publish(this.getSetting('topic'), this.getSetting('press'));
    }
  }

  buttonUp() {
    if (main.mode == main.MODE_RUN && this.state) {
      this.state = 0;
      main.publish(this.getSetting('topic'), this.getSetting('release'));
    }
  }
}

class IotyDisplay extends IotyWidget {
  constructor() {
    super();
    this.content = '<div class="display"><div></div></div>'
    this.options.type = 'display';
    this.widgetName = '#widget-display#';
    this.state = 0;

    let settings = [
      {
        name: 'description',
        title: 'Description',
        type: 'label',
        value: 'The display widget will display whatever messages it receives.'
      },
      {
        name: 'topic',
        title: 'MQTT Topic',
        type: 'text',
        value: '',
        help: 'Topic to subscribe to.'
      },
    ];
    this.settings.push(...settings);
  }

  attach(ele) {
    super.attach(ele);
  }

  processSettings() {
    this.subscriptions.push(this.getSetting('topic'));
  }

  onMessageArrived(payload) {
    let display = this.element.querySelector('.display');
    display.innerText = payload;
  }
}

// Helper function to attach widget to element
function attachIotyWidget(ele) {
  let widget;
  if (ele.getAttribute('ioty-type') == 'button') {
    widget = new IotyButton();
  } else if (ele.getAttribute('ioty-type') == 'label') {
    widget = new IotyLabel()
  } else if (ele.getAttribute('ioty-type') == 'display') {
    widget = new IotyDisplay()
  }

  widget.attach(ele);
  ele.widget = widget;
}