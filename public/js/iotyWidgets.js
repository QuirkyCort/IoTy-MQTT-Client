class IotyWidget {
  constructor() {
    this.topHTML =
      '<div class="newWidget grid-stack-item" #type #minW #minH #w #h>' +
        '<div class="grid-stack-item-content">';
    this.bottomHTML =
        '</div>' +
      '</div>';
    this.content = '';

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

    this.settings = [
      {
        name: 'topic',
        title: 'MQTT Topic',
        type: 'text',
        value: ''
      },
    ];
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
    let self = this;
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
        if (setting.type == 'text') {
          let obj = genDialog.text(setting);
          $body.append(obj.ele);
          values.push(...obj.values);
        }
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
        $dialog.close();
      }).bind(this));
    }
  }
}

class IotyButton extends IotyWidget {
  constructor() {
    super();
    this.content = '<div class="button"><div class="text">BTN</div></div>'
    this.options.type = 'button';
    this.widgetName = '#widget-button#';
    this.state = 0;

    this.settings.push({
      name: 'press',
      title: 'Send on Press',
      type: 'text',
      value: '1',
      help: 'This value will be published when the button is pressed.'
    });
    this.settings.push({
      name: 'release',
      title: 'Send on Release',
      type: 'text',
      value: '0',
      help: 'This value will be published when the button is released.'
    });
  }

  attach(ele) {
    super.attach(ele);
    let button = ele.querySelector('.button');
    button.addEventListener('pointerdown', this.buttonDown.bind(this));
    button.addEventListener('pointerup', this.buttonUp.bind(this));
    button.addEventListener('pointerleave', this.buttonUp.bind(this));
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

function attachIotyWidget(ele) {
  let widget;
  if (ele.getAttribute('ioty-type') == 'button') {
    widget = new IotyButton();
  }

  widget.attach(ele);
  ele.widget = widget;
}