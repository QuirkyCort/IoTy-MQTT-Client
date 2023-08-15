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
        } else if (setting.type == 'html') {
          obj = genDialog.html(setting);
        } else if (setting.type == 'check') {
          obj = genDialog.check(setting);
          values.push(...obj.values);
        } else if (setting.type == 'textarea') {
          obj = genDialog.textarea(setting);
          values.push(...obj.values);
        } else if (setting.type == 'select') {
          obj = genDialog.select(setting);
          values.push(...obj.values);
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
        main.saveAndPublishJSON();
      }).bind(this));
    }
  }

  processSettings() {
    this.subscriptions = [];
  }

  onMessageArrived(payload) {
  }

  disableEvent(evt) {
    evt.preventDefault();
    evt.stopImmediatePropagation();
    return false;
  }

  removePlaceholder() {
    for (let e of this.element.getElementsByClassName('placeholder')) {
      e.remove();
    }
  }
}

class IotyLabel extends IotyWidget {
  constructor() {
    super();
    this.content = '<div class="label"><div>Label</div></div>';
    this.options.type = 'label';
    this.widgetName = '#widget-label#';

    let settings = [
      {
        name: 'description',
        title: 'Description',
        type: 'label',
        value: 'The label widget is only used for displaying text. It does not send or receives any messages.',
        save: false
      },
      {
        name: 'alignH',
        title: 'Horizontal Alignment',
        type: 'select',
        options: [
          ['Left', 'left'],
          ['Center', 'center'],
          ['Right', 'right']
        ],
        value: 'left',
        help: 'Controls the horizontal alignment of the label text.',
        save: true
      },
      {
        name: 'alignV',
        title: 'Vertical Alignment',
        type: 'select',
        options: [
          ['Top', 'start'],
          ['Center', 'center'],
          ['Bottom', 'end']
        ],
        value: 'start',
        help: 'Controls the vertical alignment of the label text.',
        save: true
      },
      {
        name: 'label',
        title: 'Label',
        type: 'text',
        value: 'Label',
        help: 'Text on the label.',
        save: true
      },
    ];
    this.settings.push(...settings);
  }

  attach(ele) {
    super.attach(ele);
  }

  processSettings() {
    super.processSettings();

    let labelDiv = this.element.querySelector('.label > div');
    labelDiv.innerText = this.getSetting('label');

    let label = this.element.querySelector('.label');

    let alignH = this.getSetting('alignH');
    if (alignH) {
      label.style.justifyContent = alignH;
    }

    let alignV = this.getSetting('alignV');
    if (alignV) {
      label.style.alignItems = alignV;
    }
  }
}

class IotyButton extends IotyWidget {
  constructor() {
    super();
    this.content = '<div class="button"><div>Button</div></div>'
    this.options.type = 'button';
    this.widgetName = '#widget-button#';
    this.state = 0;

    let settings = [
      {
        name: 'description',
        title: 'Description',
        type: 'label',
        value: 'The button widget will publish a message to the specified topic when the button is pressed, and another message when released.',
        save: false
      },
      {
        name: 'topic',
        title: 'MQTT Topic',
        type: 'text',
        value: '',
        help: 'Topic to publish to.',
        save: true
      },
      {
        name: 'pressOnly',
        title: 'Send on press only',
        type: 'check',
        value: 'false',
        help: 'Only publish when the button is pressed, and not when it is released.',
        save: true
      },
      {
        name: 'press',
        title: 'Send on Press',
        type: 'text',
        value: 'press',
        help: 'This value will be published when the button is pressed.',
        save: true
      },
      {
        name: 'release',
        title: 'Send on Release',
        type: 'text',
        value: 'release',
        help: 'This value will be published when the button is released.',
        save: true
      },
      {
        name: 'label',
        title: 'Label',
        type: 'text',
        value: 'Button',
        help: 'Text on the button.',
        save: true
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
    super.processSettings();

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
      if (this.getSetting('pressOnly') == 'false') {
        main.publish(this.getSetting('topic'), this.getSetting('release'));
      }
    }
  }
}

class IotySwitch extends IotyWidget {
  constructor() {
    super();
    this.content =
      '<div class="switch">' +
        '<div class="label">Switch</div>' +
        '<div class="track"><div class="thumb"></div></div>' +
      '</div>';
    this.options.type = 'switch';
    this.widgetName = '#widget-switch#';
    this.state = 0;

    let settings = [
      {
        name: 'description',
        title: 'Description',
        type: 'label',
        value: 'The switch widget will publish a message to the specified topic when switched on, and another message when off.',
        save: false
      },
      {
        name: 'topic',
        title: 'MQTT Topic',
        type: 'text',
        value: '',
        help: 'Topic to publish to.',
        save: true
      },
      {
        name: 'on',
        title: 'Send on On',
        type: 'text',
        value: 'on',
        help: 'This value will be published when the switch is on.',
        save: true
      },
      {
        name: 'off',
        title: 'Send on Off',
        type: 'text',
        value: 'off',
        help: 'This value will be published when the switch is off.',
        save: true
      },
      {
        name: 'label',
        title: 'Label',
        type: 'text',
        value: 'Switch',
        help: 'Text above the switch.',
        save: true
      },
    ];
    this.settings.push(...settings);
  }

  attach(ele) {
    super.attach(ele);
    let toggleSwitch = ele.querySelector('.switch');
    toggleSwitch.addEventListener('click', this.toggle.bind(this));
  }

  processSettings() {
    super.processSettings();

    let label = this.element.querySelector('.label');
    label.innerText = this.getSetting('label');
  }

  toggle() {
    if (main.mode == main.MODE_RUN) {
      this.state ^= 1; // toggle state
      let track = this.element.querySelector('.track');

      if (this.state == 1) {
        main.publish(this.getSetting('topic'), this.getSetting('on'));
        track.classList.add('on');
      } else {
        main.publish(this.getSetting('topic'), this.getSetting('off'));
        track.classList.remove('on');
      }
    }
  }
}

class IotyHSlider extends IotyWidget {
  constructor() {
    super();
    this.content =
      '<div class="hSlider">' +
        '<div class="row1">' +
          '<div class="label">Slider</div>' +
          '<div class="value">0</div>' +
        '</div>' +
        '<input type="range" value="0">' +
      '</div>';
    this.options.type = 'hSlider';
    this.widgetName = '#widget-hSlider#';
    this.state = 0;

    this.lastPayload = null;
    this.payload = null;

    let settings = [
      {
        name: 'description',
        title: 'Description',
        type: 'label',
        value: 'The slider widget will publish its value to the specified topic when changed.',
        save: false
      },
      {
        name: 'topic',
        title: 'MQTT Topic',
        type: 'text',
        value: '',
        help: 'Topic to publish to.',
        save: true
      },
      {
        name: 'min',
        title: 'Minimum value',
        type: 'text',
        value: '0',
        help: 'Minimum value for the slider.',
        save: true
      },
      {
        name: 'max',
        title: 'Maximum value',
        type: 'text',
        value: '255',
        help: 'Maximum value for the slider.',
        save: true
      },
      {
        name: 'onChange',
        title: 'Send value on change',
        type: 'check',
        value: 'false',
        help: 'Immediately send the value when changed. If false, the value will only be sent on release.',
        save: true
      },
      {
        name: 'label',
        title: 'Label',
        type: 'text',
        value: 'Slider',
        help: 'Text above the slider.',
        save: true
      },
    ];
    this.settings.push(...settings);

    this.timer = setInterval(this.publish.bind(this), 100);
  }

  attach(ele) {
    super.attach(ele);
    let input = ele.querySelector('input');
    input.addEventListener('input', this.input.bind(this));
    input.addEventListener('change', this.change.bind(this));
  }

  processSettings() {
    super.processSettings();

    let label = this.element.querySelector('.label');
    label.innerText = this.getSetting('label');

    let input = this.element.querySelector('input');
    let min = Number(this.getSetting('min'));
    let max = Number(this.getSetting('max'));

    if (isNaN(min)) {
      min = 0;
    }
    if (isNaN(max)) {
      max = 255;
    }

    let val = input.value;
    val = Math.max(min, Math.min(max, val));

    input.min = min;
    input.max = max;
    input.value = val;

    let value = this.element.querySelector('.value');
    value.innerText = val;
  }

  queuePublish() {
    if (main.mode != main.MODE_RUN) {
      return;
    }
    let value = this.element.querySelector('.value');
    let input = this.element.querySelector('input');

    value.innerText = input.value;
    this.payload = input.value;
  }

  input(evt) {
    if (this.getSetting('onChange') == 'true') {
      this.queuePublish();
    }
  }

  change(evt) {
    if (this.getSetting('onChange') == 'false') {
      this.queuePublish();
    }
  }

  publish() {
    if (main.mode != main.MODE_RUN) {
      return;
    }
    if (this.payload != this.lastPayload) {
      main.publish(this.getSetting('topic'), this.payload);
      this.lastPayload = this.payload;
    }
  }
}

class IotyVSlider extends IotyWidget {
  constructor() {
    super();
    this.content =
      '<div class="vSlider">' +
        '<div class="row1">' +
          '<div class="label">Slider</div>' +
          '<div class="value">0</div>' +
        '</div>' +
        '<input type="range" value="0" orient="vertical">' +
      '</div>';
    this.options.type = 'vSlider';
    this.widgetName = '#widget-vSlider#';
    this.state = 0;

    this.lastPayload = null;
    this.payload = null;

    let settings = [
      {
        name: 'description',
        title: 'Description',
        type: 'label',
        value: 'The slider widget will publish its value to the specified topic when changed.',
        save: false
      },
      {
        name: 'topic',
        title: 'MQTT Topic',
        type: 'text',
        value: '',
        help: 'Topic to publish to.',
        save: true
      },
      {
        name: 'min',
        title: 'Minimum value',
        type: 'text',
        value: '0',
        help: 'Minimum value for the slider.',
        save: true
      },
      {
        name: 'max',
        title: 'Maximum value',
        type: 'text',
        value: '255',
        help: 'Maximum value for the slider.',
        save: true
      },
      {
        name: 'onChange',
        title: 'Send value on change',
        type: 'check',
        value: 'false',
        help: 'Immediately send the value when changed. If false, the value will only be sent on release.',
        save: true
      },
      {
        name: 'label',
        title: 'Label',
        type: 'text',
        value: 'Slider',
        help: 'Text above the slider.',
        save: true
      },
    ];
    this.settings.push(...settings);

    this.timer = setInterval(this.publish.bind(this), 100);
  }

  attach(ele) {
    super.attach(ele);
    let input = ele.querySelector('input');
    input.addEventListener('input', this.input.bind(this));
    input.addEventListener('change', this.change.bind(this));
  }

  processSettings() {
    super.processSettings();

    let label = this.element.querySelector('.label');
    label.innerText = this.getSetting('label');

    let input = this.element.querySelector('input');
    let min = Number(this.getSetting('min'));
    let max = Number(this.getSetting('max'));

    if (isNaN(min)) {
      min = 0;
    }
    if (isNaN(max)) {
      max = 255;
    }

    let val = input.value;
    val = Math.max(min, Math.min(max, val));

    input.min = min;
    input.max = max;
    input.value = val;

    let value = this.element.querySelector('.value');
    value.innerText = val;
  }

  queuePublish() {
    if (main.mode != main.MODE_RUN) {
      return;
    }
    let value = this.element.querySelector('.value');
    let input = this.element.querySelector('input');

    value.innerText = input.value;
    this.payload = input.value;
  }

  input(evt) {
    if (this.getSetting('onChange') == 'true') {
      this.queuePublish();
    }
  }

  change(evt) {
    if (this.getSetting('onChange') == 'false') {
      this.queuePublish();
    }
  }

  publish() {
    if (main.mode != main.MODE_RUN) {
      return;
    }
    if (this.payload != this.lastPayload) {
      main.publish(this.getSetting('topic'), this.payload);
      this.lastPayload = this.payload;
    }
  }
}

class IotyText extends IotyWidget {
  constructor() {
    super();
    this.content =
      '<div class="text">' +
        '<div class="label">Text</div>' +
        '<input type="text">' +
        '<div class="send">Send</div>' +
      '</div>';
    this.options.type = 'text';
    this.widgetName = '#widget-text#';
    this.state = 0;

    let settings = [
      {
        name: 'description',
        title: 'Description',
        type: 'label',
        value: 'The text widget will publish its value to the specified topic when send or enter is pressed.',
        save: false
      },
      {
        name: 'topic',
        title: 'MQTT Topic',
        type: 'text',
        value: '',
        help: 'Topic to publish to.',
        save: true
      },
      {
        name: 'label',
        title: 'Label',
        type: 'text',
        value: 'Text',
        help: 'Text above the slider.',
        save: true
      },
    ];
    this.settings.push(...settings);
  }

  attach(ele) {
    super.attach(ele);
    let input = ele.querySelector('input');
    let send = ele.querySelector('.send');
    input.addEventListener('keyup', this.keyup.bind(this));
    send.addEventListener('pointerdown', this.buttonDown.bind(this));
    send.addEventListener('pointerup', this.buttonUp.bind(this));
    send.addEventListener('pointerleave', this.buttonUp.bind(this));
  }

  processSettings() {
    super.processSettings();

    let label = this.element.querySelector('.label');
    label.innerText = this.getSetting('label');
  }

  keyup(evt) {
    if (main.mode == main.MODE_RUN) {
      if (evt.key == 'Enter') {
        this.send();
      }
    }
  }

  buttonDown() {
    if (main.mode == main.MODE_RUN) {
      this.state = 1;
    }
  }

  buttonUp() {
    if (main.mode == main.MODE_RUN && this.state) {
      this.state = 0;
      this.send();
    }
  }

  send() {
    let input = this.element.querySelector('input');

    main.publish(this.getSetting('topic'), input.value);
  }
}

class IotySelect extends IotyWidget {
  constructor() {
    super();
    this.content =
      '<div class="select">' +
        '<div class="label">Select</div>' +
        '<select><option selected value> -- </option><option value="1">Option A</option><option value="2">Option B</option></select>' +
      '</div>';
    this.options.type = 'select';
    this.widgetName = '#widget-select#';
    this.state = 0;

    let settings = [
      {
        name: 'description',
        title: 'Description',
        type: 'label',
        value: 'The select widget will publish its selected value to the specified topic when changed.',
        save: false
      },
      {
        name: 'topic',
        title: 'MQTT Topic',
        type: 'text',
        value: '',
        help: 'Topic to publish to.',
        save: true
      },
      {
        name: 'options',
        title: 'Options',
        type: 'textarea',
        value: 'Option A, A\nOption B, B',
        help: 'One option per line. Comma separated with description followed by value.',
        save: true
      },
      {
        name: 'label',
        title: 'Label',
        type: 'text',
        value: 'Select',
        help: 'Text above the selector.',
        save: true
      },
    ];
    this.settings.push(...settings);
  }

  attach(ele) {
    super.attach(ele);
    let select = ele.querySelector('select');
    select.addEventListener('change', this.send.bind(this));
  }

  processSettings() {
    super.processSettings();

    let label = this.element.querySelector('.label');
    label.innerText = this.getSetting('label');

    let select = this.element.querySelector('select');
    let innerHTML = '<option selected value> -- </option>';

    for (let option of this.getSetting('options').split('\n')) {
      option = option.split(',');
      let description = option[0];
      let value = '0';
      if (option.length > 1) {
        value = option[1];
      }
      innerHTML += '<option value="' + value.trim() + '">' + description + '</option>';
    }

    select.innerHTML = innerHTML;
  }

  send() {
    if (main.mode == main.MODE_RUN) {
      let select = this.element.querySelector('select');
      if (select.value == '') {
        return;
      }

      main.publish(this.getSetting('topic'), select.value);
    }
  }
}

class IotyDisplay extends IotyWidget {
  constructor() {
    super();
    this.content = '<div class="display"></div>'
    this.options.type = 'display';
    this.widgetName = '#widget-display#';
    this.state = 0;

    let settings = [
      {
        name: 'description',
        title: 'Description',
        type: 'label',
        value: 'The display widget will display whatever messages it receives.',
        save: false
      },
      {
        name: 'topic',
        title: 'MQTT Topic',
        type: 'text',
        value: '',
        help: 'Topic to subscribe to.',
        save: true
      },
    ];
    this.settings.push(...settings);
  }

  attach(ele) {
    super.attach(ele);
  }

  processSettings() {
    super.processSettings();

    this.subscriptions.push(this.getSetting('topic'));
  }

  onMessageArrived(payload) {
    let display = this.element.querySelector('.display');
    display.innerText = payload;
  }
}

class IotyStatus extends IotyWidget {
  constructor() {
    super();
    this.content = '<div class="status"><div class="indicator"><div class="label">Status</div></div></div>'
    this.options.type = 'status';
    this.widgetName = '#widget-status#';
    this.state = 0;

    let settings = [
      {
        name: 'description',
        title: 'Description',
        type: 'label',
        value: 'The status widget will display a different color depending on the message it receives. You can send a color code, a RGB hex code, or a comma separated RGB value.',
        save: false
      },
      {
        name: 'colorCode',
        title: 'Color Code',
        type: 'label',
        value: '0: Transparent, 1: Green, 2: Yellow, 3: Red, 4: Blue, 5: Gray, 6: Black',
        save: false
      },
      {
        name: 'rgbHex',
        title: 'RGB Hex Code',
        type: 'label',
        value: 'Eg. "#FF000" (Red), "#00FF00" (Green), "#FFFFFF" (White)',
        save: false
      },
      {
        name: 'rgbValue',
        title: 'RGB Value',
        type: 'label',
        value: 'Eg. "255,0,0" (Red), "0,255,0" (Green), "255,255,255" (White)',
        save: false
      },
      {
        name: 'topic',
        title: 'MQTT Topic',
        type: 'text',
        value: '',
        help: 'Topic to subscribe to.',
        save: true
      },
      {
        name: 'label',
        title: 'Label',
        type: 'text',
        value: 'Status',
        help: 'Text on the status widget.',
        save: true
      },
    ];
    this.settings.push(...settings);
  }

  attach(ele) {
    super.attach(ele);
  }

  processSettings() {
    super.processSettings();

    let label = this.element.querySelector('.label');
    label.innerText = this.getSetting('label');

    this.subscriptions.push(this.getSetting('topic'));
  }

  onMessageArrived(payload) {
    let indicator = this.element.querySelector('.indicator');
    for (let i=0; i<7; i++) {
      indicator.classList.remove('color' + i);
    }

    if (payload.includes('#')) {
      indicator.style.backgroundColor = payload;
    } else if (payload.includes(',')) {
      indicator.style.backgroundColor = 'rgb(' + payload + ')';
    } else {
      indicator.style.backgroundColor = '';
      indicator.classList.add('color' + payload);
    }
  }
}

class IotyHBar extends IotyWidget {
  constructor() {
    super();
    this.content =
      '<div class="hBar">' +
        '<div class="row1">' +
          '<div class="label">Gauge</div>' +
          '<div class="value">0</div>' +
        '</div>' +
        '<div class="progress"><div></div></div>' +
      '</div>';
    this.options.type = 'hBar';
    this.widgetName = '#widget-hBar#';
    this.state = 0;

    let settings = [
      {
        name: 'description',
        title: 'Description',
        type: 'label',
        value: 'The bar gauge widget will display whatever values it receives.',
        save: false
      },
      {
        name: 'topic',
        title: 'MQTT Topic',
        type: 'text',
        value: '',
        help: 'Topic to subscribe to.',
        save: true
      },
      {
        name: 'min',
        title: 'Minimum value',
        type: 'text',
        value: '0',
        help: 'Minimum value for the gauge.',
        save: true
      },
      {
        name: 'max',
        title: 'Maximum value',
        type: 'text',
        value: '255',
        help: 'Maximum value for the gauge.',
        save: true
      },
      {
        name: 'label',
        title: 'Label',
        type: 'text',
        value: 'Gauge',
        help: 'Text above the gauge.',
        save: true
      },
    ];
    this.settings.push(...settings);
  }

  attach(ele) {
    super.attach(ele);
  }

  processSettings() {
    super.processSettings();

    this.subscriptions.push(this.getSetting('topic'));

    let label = this.element.querySelector('.label');
    label.innerText = this.getSetting('label');
  }

  onMessageArrived(payload) {
    let value = this.element.querySelector('.value');
    value.innerText = payload;

    let minValue = Number(this.getSetting('min'));
    let maxValue = Number(this.getSetting('max'));
    let range = maxValue - minValue

    let pos = (Number(payload) - minValue) / range;

    let progress = this.element.querySelector('.progress > div');
    progress.style.width = (pos * 100) + '%';
  }
}

class IotyVBar extends IotyWidget {
  constructor() {
    super();
    this.content =
      '<div class="vBar">' +
        '<div class="row1">' +
          '<div class="label">Gauge</div>' +
          '<div class="value">0</div>' +
        '</div>' +
        '<div class="progress"><div></div></div>' +
      '</div>';
    this.options.type = 'vBar';
    this.widgetName = '#widget-vBar#';
    this.state = 0;

    let settings = [
      {
        name: 'description',
        title: 'Description',
        type: 'label',
        value: 'The bar gauge widget will display whatever values it receives.',
        save: false
      },
      {
        name: 'topic',
        title: 'MQTT Topic',
        type: 'text',
        value: '',
        help: 'Topic to subscribe to.',
        save: true
      },
      {
        name: 'min',
        title: 'Minimum value',
        type: 'text',
        value: '0',
        help: 'Minimum value for the gauge.',
        save: true
      },
      {
        name: 'max',
        title: 'Maximum value',
        type: 'text',
        value: '255',
        help: 'Maximum value for the gauge.',
        save: true
      },
      {
        name: 'label',
        title: 'Label',
        type: 'text',
        value: 'Gauge',
        help: 'Text above the gauge.',
        save: true
      },
    ];
    this.settings.push(...settings);
  }

  attach(ele) {
    super.attach(ele);
  }

  processSettings() {
    super.processSettings();

    this.subscriptions.push(this.getSetting('topic'));

    let label = this.element.querySelector('.label');
    label.innerText = this.getSetting('label');
  }

  onMessageArrived(payload) {
    let value = this.element.querySelector('.value');
    value.innerText = payload;

    let minValue = Number(this.getSetting('min'));
    let maxValue = Number(this.getSetting('max'));
    let range = maxValue - minValue

    let pos = (Number(payload) - minValue) / range;

    let progress = this.element.querySelector('.progress > div');
    progress.style.height = (pos * 100) + '%';
  }
}

class IotyColor extends IotyWidget {
  constructor() {
    super();
    this.content =
      '<div class="color">' +
        '<div class="wrapper">' +
          '<img src="images/hsv.jpg" draggable="false">' +
          '<div class="selector"></div>' +
        '</div>' +
        '<div class="label">Color</div>' +
        '<input type="range" value="255" max="255">' +
      '</div>';
    this.options.type = 'color';
    this.widgetName = '#widget-color#';
    this.hsv = [0,0,255];

    this.payload1 = null;
    this.lastPayload1 = null;
    this.payload2 = null;
    this.lastPayload2 = null;
    this.payload3 = null;
    this.lastPayload3 = null;

    let settings = [
      {
        name: 'description',
        title: 'Description',
        type: 'label',
        value: 'The color widget will publish its RGB values to the specified topic(s) when changed.',
        save: false
      },
      {
        name: 'combine',
        title: 'Send combined value',
        type: 'check',
        value: 'false',
        help: 'Publish all the RGB values (comma separated float) to the first topic.',
        save: true
      },
      {
        name: 'topic1',
        title: 'MQTT Topic (Red or All)',
        type: 'text',
        value: '',
        help: 'In combined mode, this will contain the RGB values (comma separated). Else, it will contain the red value.',
        save: true
      },
      {
        name: 'topic2',
        title: 'MQTT Topic (Green)',
        type: 'text',
        value: '',
        help: 'If not in combined mode, this will contain the green value.',
        save: true
      },
      {
        name: 'topic3',
        title: 'MQTT Topic (Blue)',
        type: 'text',
        value: '',
        help: 'If not in combined mode, this will contain the blue value.',
        save: true
      },
      {
        name: 'min',
        title: 'Minimum value',
        type: 'text',
        value: '0',
        help: 'Minimum RGB value.',
        save: true
      },
      {
        name: 'max',
        title: 'Maximum value',
        type: 'text',
        value: '255',
        help: 'Maximum RGB value.',
        save: true
      },
      {
        name: 'onChange',
        title: 'Send value on change',
        type: 'check',
        value: 'false',
        help: 'Immediately send the value when changed. If false, the value will only be sent on release.',
        save: true
      },
      {
        name: 'label',
        title: 'Label',
        type: 'text',
        value: 'Color',
        help: 'Text above the widget.',
        save: true
      },
    ];
    this.settings.push(...settings);

    this.timer = setInterval(this.publish.bind(this), 100);
  }

  attach(ele) {
    super.attach(ele);
    let input = ele.querySelector('input');
    input.addEventListener('input', this.input.bind(this));
    input.addEventListener('change', this.change.bind(this));

    let img = ele.querySelector('img');
    img.addEventListener('dragstart', function() { return false; })
    img.addEventListener('pointerdown', this.pointerdown.bind(this));
    img.addEventListener('pointermove', this.pointermove.bind(this));
    img.addEventListener('pointerup', this.pointerup.bind(this));
    img.addEventListener('contextmenu', this.disableEvent);
  }

  processSettings() {
    super.processSettings();

    let label = this.element.querySelector('.label');
    label.innerText = this.getSetting('label');

    let input = this.element.querySelector('input');
    let min = Number(this.getSetting('min'));
    let max = Number(this.getSetting('max'));

    if (isNaN(min)) {
      min = 0;
    }
    if (isNaN(max)) {
      max = 255;
    }

    let val = input.value;
    val = Math.max(min, Math.min(max, val));

    input.min = min;
    input.max = max;
    input.value = val;
  }

  pointerdown(evt) {
    if (main.mode == main.MODE_RUN) {
      let selector = this.element.querySelector('.selector');

      let x = 2 * (evt.offsetX / evt.target.offsetWidth - 0.5);
      let y = 2 * (evt.offsetY / evt.target.offsetHeight - 0.5);

      let r = Math.sqrt(x**2 + y**2);
      r = Math.min(r, 1);
      let theta = Math.atan2(y, x);
      if (theta < 0) {
        theta += 2 * Math.PI;
      }

      x = (r * Math.cos(theta) + 1) / 2;
      y = (r * Math.sin(theta) + 1) / 2;
      let imgLeft = evt.target.offsetLeft;
      let imgTop = evt.target.offsetTop;
      let imgWidth = evt.target.offsetWidth;
      let imgHeight = evt.target.offsetHeight;

      selector.style.left = (imgLeft + x * imgWidth - (selector.offsetWidth / 2)) + 'px';
      selector.style.top = (imgTop + y * imgHeight - (selector.offsetHeight / 2)) + 'px';

      this.hsv[0] = ((theta / Math.PI * 180) + 90) % 360;
      this.hsv[1] = r;

      let rgb = this.hsv2rgb(this.hsv);
      if (this.getSetting('onChange') == 'true') {
        this.queuePublish(rgb);
      }
    }
  }

  hsv2rgb(hsv) {
    let M = hsv[2];
    let m = M * (1 - hsv[1]);
    let z = (M - m) * (1 - Math.abs(((hsv[0] / 60) % 2) - 1));

    let rgb = [];
    if (hsv[0] < 60) {
      rgb[0] = M;
      rgb[1] = z + m;
      rgb[2] = m;
    } else if (hsv[0] < 120) {
      rgb[0] = z + m;
      rgb[1] = M;
      rgb[2] = m;
    } else if (hsv[0] < 180) {
      rgb[0] = m;
      rgb[1] = M;
      rgb[2] = z + m;
    } else if (hsv[0] < 240) {
      rgb[0] = m;
      rgb[1] = z + m;
      rgb[2] = M;
    } else if (hsv[0] < 300) {
      rgb[0] = z + m;
      rgb[1] = m;
      rgb[2] = M;
    } else {
      rgb[0] = M;
      rgb[1] = m;
      rgb[2] = z + m;
    }

    rgb[0] = Math.round(rgb[0]);
    rgb[1] = Math.round(rgb[1]);
    rgb[2] = Math.round(rgb[2]);
    return rgb;
  }

  pointermove(evt) {
    if (evt.buttons != 0) {
      this.pointerdown(evt);
    }
  }

  pointerup(evt) {
    if (this.getSetting('onChange') == 'false') {
      let rgb = this.hsv2rgb(this.hsv);
      this.queuePublish(rgb);
    }
  }

  sendValue() {
    let input = this.element.querySelector('input');
    this.hsv[2] = Number(input.value);
    let rgb = this.hsv2rgb(this.hsv);
    this.queuePublish(rgb);
  }

  input(evt) {
    if (this.getSetting('onChange') == 'true') {
      this.sendValue();
    }
  }

  change(evt) {
    if (this.getSetting('onChange') == 'false') {
      this.sendValue();
    }
  }

  queuePublish(rgb) {
    if (main.mode != main.MODE_RUN) {
      return;
    }
    if (this.getSetting('combine') == 'true') {
      this.payload1 = rgb[0] + ',' + rgb[1] + ',' + rgb[2];
    } else {
      this.payload1 = String(rgb[0]);
      this.payload2 = String(rgb[1]);
      this.payload3 = String(rgb[2]);
    }
  }

  publish() {
    if (main.mode != main.MODE_RUN) {
      return;
    }
    if (this.payload1 != this.lastPayload1) {
      main.publish(this.getSetting('topic1'), this.payload1);
      this.lastPayload1 = this.payload1;
    }
    if (this.payload2 != this.lastPayload2) {
      main.publish(this.getSetting('topic2'), this.payload2);
      this.lastPayload2 = this.payload2;
    }
    if (this.payload3 != this.lastPayload3) {
      main.publish(this.getSetting('topic3'), this.payload3);
      this.lastPayload3 = this.payload3;
    }
  }
}

class IotyNotification extends IotyWidget {
  constructor() {
    super();
    this.content = '<div class="notification"><div class="indicator"><img src="images/notification_icon.png"><div class="label">Notif</div></div></div>'
    this.options.type = 'notification';
    this.widgetName = '#widget-notification#';
    this.state = 0;

    let settings = [
      {
        name: 'description',
        title: 'Description',
        type: 'label',
        value: 'The notificaiton widget will display a notification or play a sound when it receives a message.',
        save: false
      },
      {
        name: 'topic',
        title: 'MQTT Topic',
        type: 'text',
        value: '',
        help: 'Topic to subscribe to.',
        save: true
      },
      {
        name: 'sound',
        title: 'Play Sound',
        type: 'check',
        value: 'true',
        help: 'Play a sound when message is received.',
        save: true
      },
      {
        name: 'notification',
        title: 'Display notification',
        type: 'check',
        value: 'true',
        help: 'Display a system notification when message is received.',
        save: true
      },
      {
        name: 'flash',
        title: 'Flash widget',
        type: 'check',
        value: 'true',
        help: 'Flash a color when a message is received.',
        save: true
      },
      {
        name: 'label',
        title: 'Label',
        type: 'text',
        value: 'Notif',
        help: 'Text on the notification widget.',
        save: true
      },
    ];
    this.settings.push(...settings);
  }

  attach(ele) {
    super.attach(ele);
  }

  processSettings() {
    super.processSettings();

    let label = this.element.querySelector('.label');
    label.innerText = this.getSetting('label');

    this.subscriptions.push(this.getSetting('topic'));
  }

  onMessageArrived(payload) {
    if (this.getSetting('notification') == 'true') {
      toastMsg(payload);
    }
    if (this.getSetting('sound') == 'true') {
      main.$bell[0].play();
    }
    if (this.getSetting('flash') == 'true') {
      let indicator = this.element.querySelector('.indicator');
      indicator.addEventListener('animationend', function(){
        indicator.classList.remove('flash');
      }, { once: true })
      indicator.classList.add('flash');
    }
  }
}

class IotyJoy extends IotyWidget {
  constructor() {
    super();
    this.content =
      '<div class="joy">' +
        '<div class="wrapper">' +
          '<img src="images/virtualJoystick.svg" draggable="false">' +
          '<div class="selector"></div>' +
        '</div>' +
        '<div class="label">Joystick</div>' +
      '</div>';
    this.options.type = 'joy';
    this.widgetName = '#widget-joy#';
    this.x = 0;
    this.y = 0;

    this.lastPayload1 = null;
    this.payload1 = null;
    this.lastPayload2 = null;
    this.payload2 = null;

    let settings = [
      {
        name: 'description',
        title: 'Description',
        type: 'label',
        value: 'The joystick widget will publish its position to the specified topic(s) when changed.',
        save: false
      },
      {
        name: 'valueType',
        title: 'Value Type',
        type: 'select',
        options: [
          ['X / Y', 'xy'],
          ['Left / Right', 'leftRight']
        ],
        value: 'xy',
        help: 'X/Y sends the position of the joystick. Left/Right sends speed values that are suitable for driving a differential drive robot.',
        save: true
      },
      {
        name: 'combine',
        title: 'Send combined value',
        type: 'check',
        value: 'false',
        help: 'Publish both the x and y position (comma separated float) to the first topic.',
        save: true
      },
      {
        name: 'topic1',
        title: 'MQTT Topic (x or both)',
        type: 'text',
        value: '',
        help: 'In combined mode, this will contain both x and y position (comma separated). Else, it will contain the x value.',
        save: true
      },
      {
        name: 'topic2',
        title: 'MQTT Topic (y)',
        type: 'text',
        value: '',
        help: 'The y value will be published to this topic.',
        save: true
      },
      {
        name: 'min',
        title: 'Minimum value',
        type: 'text',
        value: '-100',
        help: 'Minimum value.',
        save: true
      },
      {
        name: 'max',
        title: 'Maximum value',
        type: 'text',
        value: '100',
        help: 'Maximum value.',
        save: true
      },
      {
        name: 'return',
        title: 'Return to center',
        type: 'check',
        value: 'true',
        help: 'Return the joystick to the center position when released.',
        save: true
      },
      {
        name: 'label',
        title: 'Label',
        type: 'text',
        value: 'Joystick',
        help: 'Text above the widget.',
        save: true
      },
    ];
    this.settings.push(...settings);

    this.timer = setInterval(this.publish.bind(this), 100);
  }

  attach(ele) {
    super.attach(ele);

    let img = ele.querySelector('img');
    img.addEventListener('dragstart', function() { return false; })
    img.addEventListener('pointerdown', this.pointerdown.bind(this));
    img.addEventListener('pointermove', this.pointermove.bind(this));
    img.addEventListener('pointerup', this.pointerup.bind(this));
    img.addEventListener('contextmenu', this.disableEvent);
  }

  processSettings() {
    super.processSettings();

    let label = this.element.querySelector('.label');
    label.innerText = this.getSetting('label');
  }

  pointerdown(evt) {
    if (main.mode == main.MODE_RUN) {
      let selector = this.element.querySelector('.selector');

      let x = 2 * (evt.offsetX / evt.target.offsetWidth - 0.5);
      let y = 2 * (evt.offsetY / evt.target.offsetHeight - 0.5);

      let r = Math.sqrt(x**2 + y**2);
      r = Math.min(r, 1);
      let theta = Math.atan2(y, x);
      if (theta < 0) {
        theta += 2 * Math.PI;
      }

      this.x = (r * Math.cos(theta) + 1) / 2;
      this.y = (r * Math.sin(theta) + 1) / 2;
      let imgLeft = evt.target.offsetLeft;
      let imgTop = evt.target.offsetTop;
      let imgWidth = evt.target.offsetWidth;
      let imgHeight = evt.target.offsetHeight;

      selector.style.left = (imgLeft + this.x * imgWidth - (selector.offsetWidth / 2)) + 'px';
      selector.style.top = (imgTop + this.y * imgHeight - (selector.offsetHeight / 2)) + 'px';

      this.queuePublish();
    }
  }

  pointermove(evt) {
    if (evt.buttons != 0) {
      this.pointerdown(evt);
    }
  }

  pointerup(evt) {
    if (this.getSetting('return') == 'true') {
      let selector = this.element.querySelector('.selector');

      this.x = 0.5;
      this.y = 0.5;

      let imgLeft = evt.target.offsetLeft;
      let imgTop = evt.target.offsetTop;
      let imgWidth = evt.target.offsetWidth;
      let imgHeight = evt.target.offsetHeight;

      selector.style.left = (imgLeft + this.x * imgWidth - (selector.offsetWidth / 2)) + 'px';
      selector.style.top = (imgTop + this.y * imgHeight - (selector.offsetHeight / 2)) + 'px';

      this.queuePublish();
    }
  }

  queuePublish() {
    if (main.mode != main.MODE_RUN) {
      return;
    }

    let min = Number(this.getSetting('min'));
    let max = Number(this.getSetting('max'));

    if (isNaN(min)) {
      min = 0;
    }
    if (isNaN(max)) {
      max = 100;
    }
    let range = max - min;

    let v1, v2;
    if (this.getSetting('valueType') == 'leftRight') {
      let x = (this.x - 0.5) * 2;
      let y = (this.y - 0.5) * -2;
      let angle = Math.atan2(y, x);
      let magnitude = Math.sqrt(x**2 + y**2);

      if (angle > Math.PI / 2) {
        v1 = (angle - Math.PI / 2) / (Math.PI / 2) * -2 + 1;
        v2 = 1;
      } else if (angle > 0) {
        v1 = 1;
        v2 = angle / (Math.PI / 2) * 2 - 1;
      } else if (angle > -Math.PI / 2) {
        v1 = angle / -(Math.PI / 2) * -2 + 1;
        v2 = -1;
      } else {
        v1 = -1;
        v2 = (angle + Math.PI / 2) / -(Math.PI / 2) * 2 - 1;
      }

      v1 *= magnitude;
      v2 *= magnitude;
    } else {
      v1 = this.x * range + min;
      v2 = (1 - this.y) * range + min;
    }

    if (this.getSetting('combine') == 'true') {
      this.payload1 = v1 + ',' + v2;
    } else {
      this.payload1 = String(v1);
      this.payload2 = String(v2);
    }
  }

  publish() {
    if (main.mode != main.MODE_RUN) {
      return;
    }
    if (this.payload1 != this.lastPayload1) {
      main.publish(this.getSetting('topic1'), this.payload1);
      this.lastPayload1 = this.payload1;
    }
    if (this.payload2 != this.lastPayload2) {
      main.publish(this.getSetting('topic2'), this.payload2);
      this.lastPayload2 = this.payload2;
    }
  }
}

class IotyVideo extends IotyWidget {
  constructor() {
    super();
    this.content =
      '<div class="video">' +
        '<video src="videos/video_placeholder.mp4" loop autoplay muted></video>' +
      '</div>';
    this.options.type = 'video';
    this.widgetName = '#widget-video#';

    let settings = [
      {
        name: 'description',
        title: 'Description',
        type: 'label',
        value: 'The video widget will display a video. You can start, stop, or change the video via MQTT.',
        save: false
      },
      {
        name: 'url',
        title: 'Video URL',
        type: 'text',
        value: '',
        help: 'Pre-set the video URL. If blank, you will need to set the URL through MQTT.',
        save: true
      },
      {
        name: 'loop',
        title: 'Loop',
        type: 'check',
        value: 'false',
        help: 'Restart the video when it finish playing.',
        save: true
      },
      {
        name: 'autoplay',
        title: 'Autoplay',
        type: 'check',
        value: 'false',
        help: 'Play the video as soon as it is loaded. The video must be muted for this to work.',
        save: true
      },
      {
        name: 'mute',
        title: 'Mute',
        type: 'check',
        value: 'false',
        help: 'Turn off the audio output.',
        save: true
      },
      {
        name: 'urlTopic',
        title: 'URL Topic',
        type: 'text',
        value: '',
        help: 'Publish to this topic to change the video URL.',
        save: true
      },
      {
        name: 'controlTopic',
        title: 'Control Topic',
        type: 'text',
        value: '',
        help: 'Publish to this topic to control playback. Use keywords: "play", "pause", "toggle", or "restart".',
        save: true
      },
      {
        name: 'seekTopic',
        title: 'Seek Topic',
        type: 'text',
        value: '',
        help: 'Publish to this topic to set the playback position in seconds.',
        save: true
      },
    ];
    this.settings.push(...settings);
  }

  attach(ele) {
    super.attach(ele);
  }

  processSettings() {
    super.processSettings();

    let video = this.element.querySelector('video');

    if (this.getSetting('url').trim() != '') {
      video.src = this.getSetting('url');
    } else {
      video.src = '';
    }

    if (this.getSetting('loop') == 'true') {
      video.loop = true;
    } else {
      video.loop = false;
    }

    if (this.getSetting('autoplay') == 'true') {
      video.autoplay = true;
    } else {
      video.autoplay = false;
    }

    if (this.getSetting('mute') == 'true') {
      video.muted = true;
    } else {
      video.muted = false;
    }

    this.topics = {};
    for (let topic of ['urlTopic', 'controlTopic', 'seekTopic']) {
      this.topics[topic] = this.getSetting(topic);
      if (this.getSetting(topic).trim() != '') {
        this.subscriptions.push(this.getSetting(topic));
      }
    }
  }

  onMessageArrived(payload, topic) {
    if (topic == this.topics['urlTopic']) {
      this.onMessageArrivedUrl(payload);
    } else if (topic == this.topics['controlTopic']) {
      this.onMessageArrivedControl(payload);
    } else if (topic == this.topics['seekTopic']) {
      this.onMessageArrivedSeek(payload);
    }
  }

  onMessageArrivedUrl(payload) {
    let video = this.element.querySelector('video');
    video.src = payload;
  }

  onMessageArrivedControl(payload) {
    let video = this.element.querySelector('video');
    if (payload == 'play') {
      video.play();
    } else if (payload == 'pause') {
      video.pause();
    } else if (payload == 'toggle') {
      if (video.paused) {
        video.play();
      } else {
        video.pause();
      }
    } else if (payload == 'restart') {
      video.currentTime = 0;
      video.play();
    }
  }

  onMessageArrivedSeek(payload) {
    let video = this.element.querySelector('video');
    video.currentTime = parseFloat(payload);
  }
}

class IotyAudio extends IotyWidget {
  constructor() {
    super();
    this.content =
      '<div class="audio">' +
        '<audio></audio>' +
        '<div class="musicAnimation paused">' +
          '<span></span><span></span><span></span>' +
        '</div>'+
      '</div>';
    this.options.type = 'audio';
    this.widgetName = '#widget-audio#';

    let settings = [
      {
        name: 'description',
        title: 'Description',
        type: 'label',
        value: 'The audio widget will play an audio track. You can start, stop, or change the audio file via MQTT.',
        save: false
      },
      {
        name: 'url',
        title: 'Audio URL',
        type: 'text',
        value: '',
        help: 'Pre-set the audio URL. If blank, you will need to set the URL through MQTT.',
        save: true
      },
      {
        name: 'loop',
        title: 'Loop',
        type: 'check',
        value: 'false',
        help: 'Restart the audio when it finish playing.',
        save: true
      },
      {
        name: 'urlTopic',
        title: 'URL Topic',
        type: 'text',
        value: '',
        help: 'Publish to this topic to change the audio URL.',
        save: true
      },
      {
        name: 'controlTopic',
        title: 'Control Topic',
        type: 'text',
        value: '',
        help: 'Publish to this topic to control playback. Use keywords: "play", "pause", "toggle", or "restart".',
        save: true
      },
      {
        name: 'seekTopic',
        title: 'Seek Topic',
        type: 'text',
        value: '',
        help: 'Publish to this topic to set the playback position in seconds.',
        save: true
      },
    ];
    this.settings.push(...settings);
  }

  attach(ele) {
    super.attach(ele);
  }

  processSettings() {
    super.processSettings();

    let audio = this.element.querySelector('audio');
    let musicAnimation = this.element.querySelector('.musicAnimation');

    function stopAnimation() {
      musicAnimation.classList.add('paused');
    }
    function playAnimation() {
      musicAnimation.classList.remove('paused');
    }

    audio.addEventListener('play', playAnimation);
    audio.addEventListener('pause', stopAnimation);

    if (this.getSetting('url').trim() != '') {
      audio.src = this.getSetting('url');
    } else {
      audio.src = '';
    }

    if (this.getSetting('loop') == 'true') {
      audio.loop = true;
    } else {
      audio.loop = false;
    }

    this.topics = {};
    for (let topic of ['urlTopic', 'controlTopic', 'seekTopic']) {
      this.topics[topic] = this.getSetting(topic);
      if (this.getSetting(topic).trim() != '') {
        this.subscriptions.push(this.getSetting(topic));
      }
    }
  }

  onMessageArrived(payload, topic) {
    if (topic == this.topics['urlTopic']) {
      this.onMessageArrivedUrl(payload);
    } else if (topic == this.topics['controlTopic']) {
      this.onMessageArrivedControl(payload);
    } else if (topic == this.topics['seekTopic']) {
      this.onMessageArrivedSeek(payload);
    }
  }

  onMessageArrivedUrl(payload) {
    let audio = this.element.querySelector('audio');
    audio.src = payload;
  }

  onMessageArrivedControl(payload) {
    let audio = this.element.querySelector('audio');
    if (payload == 'play') {
      audio.play();
    } else if (payload == 'pause') {
      audio.pause();
    } else if (payload == 'toggle') {
      if (audio.paused) {
        audio.play();
      } else {
        audio.pause();
      }
    } else if (payload == 'restart') {
      audio.currentTime = 0;
      audio.play();
    }
  }

  onMessageArrivedSeek(payload) {
    let audio = this.element.querySelector('audio');
    audio.currentTime = parseFloat(payload);
  }
}

class IotyImage extends IotyWidget {
  constructor() {
    super();
    this.content =
      '<div class="image">' +
        '<img src="images/image_placeholder.png">' +
      '</div>';
    this.options.type = 'image';
    this.widgetName = '#widget-image#';

    let settings = [
      {
        name: 'description',
        title: 'Description',
        type: 'label',
        value: 'The image widget will play an image. You can hide, show, or change the image file via MQTT.',
        save: false
      },
      {
        name: 'url',
        title: 'Image URL',
        type: 'text',
        value: '',
        help: 'Pre-set the image URL. If blank, you will need to set the URL through MQTT.',
        save: true
      },
      {
        name: 'urlTopic',
        title: 'URL Topic',
        type: 'text',
        value: '',
        help: 'Publish to this topic to change the image URL.',
        save: true
      },
      {
        name: 'controlTopic',
        title: 'Control Topic',
        type: 'text',
        value: '',
        help: 'Publish to this topic to control the image display. Use keywords: "show", "hide", or "toggle".',
        save: true
      },
      {
        name: 'dataTopic',
        title: 'Data Topic',
        type: 'text',
        value: '',
        help: 'Publish image data to this topic for display. This will override the image URL.',
        save: true
      },
    ];
    this.settings.push(...settings);
  }

  attach(ele) {
    super.attach(ele);
  }

  processSettings() {
    super.processSettings();

    let image = this.element.querySelector('img');

    if (this.getSetting('url').trim() != '') {
      image.src = this.getSetting('url');
    } else {
      image.src = '';
    }

    this.topics = {};
    for (let topic of ['urlTopic', 'controlTopic', 'dataTopic']) {
      this.topics[topic] = this.getSetting(topic);
      if (this.getSetting(topic).trim() != '') {
        this.subscriptions.push(this.getSetting(topic));
      }
    }
  }

  onMessageArrived(payload, topic) {
    if (topic == this.topics['urlTopic']) {
      this.onMessageArrivedUrl(payload);
    } else if (topic == this.topics['controlTopic']) {
      this.onMessageArrivedControl(payload);
    } else if (topic == this.topics['dataTopic']) {
      this.onMessageArrivedData(payload);
    }
  }

  onMessageArrivedUrl(payload) {
    let image = this.element.querySelector('img');
    image.src = payload;
  }

  onMessageArrivedControl(payload) {
    let image = this.element.querySelector('img');
    if (payload == 'show') {
      image.classList.remove('hide');
    } else if (payload == 'hide') {
      image.classList.add('hide');
    } else if (payload == 'toggle') {
      image.classList.toggle('hide');
    }
  }

  onMessageArrivedData(payload) {
    let image = this.element.querySelector('img');
    image.src = URL.createObjectURL(
      new Blob([payload])
    );
  }
}

class IotyMap extends IotyWidget {
  constructor() {
    super();
    this.content =
      '<div class="map">' +
        '<div class="mapEmbed"></div>' +
        '<img class="placeholder" src="images/map_placeholder.png">' +
      '</div>';
    this.options.type = 'map';
    this.widgetName = '#widget-map#';

    let settings = [
      {
        name: 'description',
        title: 'Description',
        type: 'label',
        value: 'The map widget will display a map. You can place markers or control your map display via MQTT.',
        save: false
      },
      {
        name: 'markerFormat',
        title: 'Marker Topic Format',
        type: 'html',
        value:
          '<p>' +
            'To place markers, publish to the marker topic in this format.' +
          '</p>' +
          '<ul>' +
            '<li>id, lat, long, label, info (HTML), color (Hex), percentage (0-100), percent bar color (Hex)</li>' +
            '<li>Only the first 3 (id, lat, long) are mandatory; the other fields are optional</li>' +
          '</ul>' +
          '<p>' +
            'Any value can be used as "id". If a marker with the id already exists, it will be modified instead, else a new marker will be created. ' +
            '"info" will only be displayed when the marker is clicked.' +
          '</p>',
        save: false
      },
      {
        name: 'controlFormat',
        title: 'Control Topic Format',
        type: 'html',
        value:
          '<p>' +
            'To control map, publish to the control topic in one of the following formats.' +
          '</p>' +
          '<ul>' +
            '<li>"panTo", lat, long</li>' +
            '<li>"zoom", zoomLevel</li>' +
            '<li>"fitMarkers"</li>' +
            '<li>"clearMarkers"</li>' +
          '</ul>',
        save: false
      },
      {
        name: 'markerTopic',
        title: 'Map Marker Topic',
        type: 'text',
        value: '',
        help: 'Publish to this topic to set or change markers.',
        save: true
      },
      {
        name: 'centerOnMarker',
        title: 'Center marker on add / change',
        type: 'check',
        value: 'false',
        help: 'If true, the map will center on the marker that was added or change.',
        save: true
      },
      {
        name: 'fitMarkers',
        title: 'Fit all markers on add / change',
        type: 'check',
        value: 'false',
        help: 'If true, the map will fit all markers on screen. This over-rides the center marker setting.',
        save: true
      },
      {
        name: 'controlTopic',
        title: 'Control Topic',
        type: 'text',
        value: '',
        help: 'Publish to this topic to control the map display.',
        save: true
      },
    ];
    this.settings.push(...settings);
  }

  attach(ele) {
    super.attach(ele);

    this.markers = {};

    let mapEmbed = this.element.querySelector('.mapEmbed');
    async function initMap() {
      const { Map } = await google.maps.importLibrary("maps");
      const { AdvancedMarkerElement, PinElement } = await google.maps.importLibrary("marker");
      this.AdvancedMarkerElement = AdvancedMarkerElement;
      this.PinElement = PinElement;

      this.map = new Map(mapEmbed, {
        center: { lat: 1.4378324, lng: 103.8071664 },
        zoom: 14,
        streetViewControl: false,
        mapId: 'e8dbaec8731e8c86'
      });
    }

    (initMap.bind(this))();
  }

  processSettings() {
    super.processSettings();

    this.topics = {};
    for (let topic of ['markerTopic', 'controlTopic']) {
      this.topics[topic] = this.getSetting(topic);
      if (this.getSetting(topic).trim() != '') {
        this.subscriptions.push(this.getSetting(topic));
      }
    }
  }

  onMessageArrived(payload, topic) {
    if (topic == this.topics['markerTopic']) {
      this.onMessageArrivedMarker(payload);
    } else if (topic == this.topics['controlTopic']) {
      this.onMessageArrivedControl(payload);
    }
  }

  modifyMarker(markerStrings) {
    let position = {
      lat: parseFloat(markerStrings[1]),
      lng: parseFloat(markerStrings[2])
    };
    let marker = this.markers[markerStrings[0]];
    marker.position = position;

    let pinConfig = {};
    if (markerStrings.length > 3) {
      pinConfig.glyph = markerStrings[3];
    }
    if (markerStrings.length > 5) {
      pinConfig.background = markerStrings[5];
    }

    let pin = new this.PinElement(pinConfig);
    if (markerStrings.length > 6) {
      let percentBox = document.createElement('div');
      let percentBar = document.createElement('div');
      percentBox.classList.add('percentBox');
      percentBar.classList.add('percentBar');
      percentBar.style.height = markerStrings[6] + '%';
      if (markerStrings[5].trim()) {
        percentBar.style.background = markerStrings[5];
      }
      if (markerStrings.length > 7) {
        percentBar.style.background = markerStrings[7];
      }

      percentBox.append(percentBar);
      pin.element.append(percentBox);
    }

    if (markerStrings.length > 3) {
      marker.content = pin.element;
    }

    if (markerStrings.length > 4) {
      google.maps.event.clearListeners(marker, 'click');
      if (markerStrings[4].trim()) {
        let infoWindow = new google.maps.InfoWindow({
          content: markerStrings[4]
        });
        marker.addListener('click', function() {
          infoWindow.open({
            anchor: marker,
            map: this.map
          })
        });
      }
    }

    if (this.getSetting('fitMarkers') == 'true') {
      this.fitMarkers();
    } else if (this.getSetting('centerOnMarker') == 'true') {
      this.map.panTo(position);
    }
  }

  newMarker(markerStrings) {
    let position = {
      lat: parseFloat(markerStrings[1]),
      lng: parseFloat(markerStrings[2])
    };
    let markerConfig = {
      position: position,
      map: this.map,
    };

    let pinConfig = {};
    if (markerStrings.length > 3) {
      pinConfig.glyph = markerStrings[3];
    }
    if (markerStrings.length > 5 && markerStrings[5].trim()) {
      pinConfig.background = markerStrings[5];
    }
    let pin = new this.PinElement(pinConfig);

    if (markerStrings.length > 6) {
      let percentBox = document.createElement('div');
      let percentBar = document.createElement('div');
      percentBox.classList.add('percentBox');
      percentBar.classList.add('percentBar');
      percentBar.style.height = markerStrings[6] + '%';
      if (markerStrings[5].trim()) {
        percentBar.style.background = markerStrings[5];
      }
      if (markerStrings.length > 7) {
        percentBar.style.background = markerStrings[7];
      }

      percentBox.append(percentBar);
      pin.element.append(percentBox);
    }
    markerConfig.content = pin.element;

    let marker = new this.AdvancedMarkerElement(markerConfig);

    if (markerStrings.length > 4) {
      if (markerStrings[4].trim()) {
        let infoWindow = new google.maps.InfoWindow({
          content: markerStrings[4]
        });
        marker.addListener('click', function() {
          infoWindow.open({
            anchor: marker,
            map: this.map
          })
        });
      }
    }

    this.markers[markerStrings[0]] = marker;

    if (this.getSetting('fitMarkers') == 'true') {
      this.fitMarkers();
    } else if (this.getSetting('centerOnMarker') == 'true') {
      this.map.panTo(position);
    }
  }

  onMessageArrivedMarker(payload) {
    let markerStrings = payload.split(',');

    if (markerStrings[0] in this.markers) {
      this.modifyMarker(markerStrings);
    } else {
      this.newMarker(markerStrings);
    }
  }

  fitMarkers() {
    let bounds = new google.maps.LatLngBounds();
    for (let id in this.markers) {
      bounds.extend(this.markers[id].position);
    }
    this.map.fitBounds(bounds);
  }

  clearMarkers() {
    for (let id in this.markers) {
      this.markers[id].setMap(null);
    }
    this.markers = {};
  }

  onMessageArrivedControl(payload) {
    let controlStrings = payload.split(',');

    if (controlStrings[0] == 'panTo') {
      this.map.panTo({
        lat: parseFloat(controlStrings[1]),
        lng: parseFloat(controlStrings[2])
      });
    } else if (controlStrings[0] == 'zoom') {
      this.map.setZoom(parseFloat(controlStrings[1]));
    } else if (controlStrings[0] == 'fitMarkers') {
      this.fitMarkers();
    } else if (controlStrings[0] == 'clearMarkers') {
      this.clearMarkers();
    }
  }
}

class IotyTTS extends IotyWidget {
  constructor() {
    super();
    this.content =
      '<div class="tts">' +
        '<div class="musicAnimation paused">' +
          '<span></span><span></span><span></span>' +
        '</div>'+
      '</div>';
    this.options.type = 'tts';
    this.widgetName = '#widget-tts#';

    let settings = [
      {
        name: 'description',
        title: 'Description',
        type: 'label',
        value: 'The Text-To-Speech (TTS) widget will read out the message that it receives.',
        save: false
      },
      {
        name: 'topic',
        title: 'Topic',
        type: 'text',
        value: '',
        help: 'Text published to this topic will be read out.',
        save: true
      },
    ];
    this.settings.push(...settings);
  }

  attach(ele) {
    super.attach(ele);
  }

  processSettings() {
    super.processSettings();

    this.subscriptions.push(this.getSetting('topic'));
  }

  onMessageArrived(payload) {
    let musicAnimation = this.element.querySelector('.musicAnimation');

    function stopAnimation() {
      musicAnimation.classList.add('paused');
    }
    function playAnimation() {
      musicAnimation.classList.remove('paused');
    }

    const synth = window.speechSynthesis;
    const utterThis = new SpeechSynthesisUtterance(payload);

    utterThis.addEventListener('start', playAnimation);
    utterThis.addEventListener('end', stopAnimation);

    synth.speak(utterThis);
  }
}

class IotySpeech extends IotyWidget {
  constructor() {
    super();
    this.content = '<div class="speech"><div class="wrapper"><div class="glow"></div><img src="images/mic.png"><img class="top" src="images/mic.png"></div></div>'
    this.options.type = 'speech';
    this.widgetName = '#widget-speech#';
    this.state = 0;

    let settings = [
      {
        name: 'description',
        title: 'Description',
        type: 'label',
        value: 'The speech widget will listen for your spoken commands, and publish it to the specified topic.',
        save: false
      },
      {
        name: 'topic',
        title: 'MQTT Topic',
        type: 'text',
        value: '',
        help: 'Topic to publish to.',
        save: true
      },
      {
        name: 'useGrammar',
        title: 'Use Word List',
        type: 'check',
        value: 'false',
        help: 'If true, only the words in the below list will be accepted. If false, all words will be accepted.',
        save: true
      },
      {
        name: 'grammar',
        title: 'Word List',
        type: 'text',
        value: 'on, off',
        help: 'Only the words in this list will be accepted. Separate each word with a comma.',
        save: true
      },
    ];
    this.settings.push(...settings);
  }

  attach(ele) {
    super.attach(ele);
    let button = ele.querySelector('.wrapper');
    button.addEventListener('pointerdown', this.buttonDown.bind(this));
  }

  processSettings() {
    super.processSettings();

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const SpeechGrammarList = window.SpeechGrammarList || window.webkitSpeechGrammarList;
    const glow = this.element.querySelector('.glow');

    if (typeof SpeechRecognition == 'undefined') {
      toastMsg('Speech recognition not supported on this browser');
      return;
    }

    this.recognition = new SpeechRecognition();

    this.words = this.getSetting('grammar').split(',').map(word => word.trim());

    if (SpeechGrammarList && this.getSetting('useGrammar') == 'true') {
      let speechRecognitionList = new SpeechGrammarList();
      let grammar = '#JSGF V1.0; grammar colors; public <color> = ' + this.words.join('|') + ' ;'
      speechRecognitionList.addFromString(grammar, 1);
      this.recognition.grammars = speechRecognitionList;
    }
    this.recognition.continuous = false;
    this.recognition.lang = 'en-US';
    this.recognition.interimResults = false;
    this.recognition.maxAlternatives = 1;

    this.recognition.onresult = this.recognitionOnResult.bind(this);
    this.recognition.onstart = function() {
      this.running = true;
    }.bind(this);
    this.recognition.onspeechend = function() {
      this.running = false;
      glow.classList.remove('animate');
      this.recognition.stop();
    }.bind(this);
    this.recognition.onnomatch = function(event) {
      this.running = false;
      glow.classList.remove('animate');
      console.log('No match');
    }.bind(this);
    this.recognition.onerror = function(event) {
      this.running = false;
      glow.classList.remove('animate');
      console.log('Error occurred in recognition: ' + event.error);
    }.bind(this);
  }

  recognitionOnResult(event) {
    let result = event.results[0][0].transcript;
    let img = this.element.querySelector('img.top');

    if (this.getSetting('useGrammar') == 'true') {
      if (this.words.includes(result)) {
        main.publish(this.getSetting('topic'), result);
        img.src = 'images/success.png';
      } else {
        img.src = 'images/failure.png';
      }
    } else {
      if (result) {
        main.publish(this.getSetting('topic'), result);
        img.src = 'images/success.png';
      } else {
        img.src = 'images/failure.png';
      }
    }
    (this.timeoutRevertToMic.bind(this))();
  }

  timeoutRevertToMic() {
    let img = this.element.querySelector('img.top');

    setTimeout(function(){
      img.src = 'images/mic.png';
    }, 1000);
  }

  buttonDown() {
    if (main.mode == main.MODE_RUN) {
      if (this.recognition) {
        if (this.running) {
          this.recognition.abort();
        } else {
          let glow = this.element.querySelector('.glow');
          glow.classList.add('animate');
          this.recognition.start();
        }
      }
    }
  }
}

class IotyChart extends IotyWidget {
  constructor() {
    super();
    this.content =
      '<div class="chart">' +
        '<canvas width="1" height="1"></canvas>' +
        '<img class="placeholder" src="images/chart_placeholder.png">' +
      '</div>'
    this.options.type = 'chart';
    this.widgetName = '#widget-chart#';
    this.state = 0;

    let settings = [
      {
        name: 'description',
        title: 'Description',
        type: 'label',
        value: 'The chart widget retrieve data from the specified topic and display it in a chart.',
        save: false
      },
      {
        name: 'xAxisType',
        title: 'X-axis type',
        type: 'select',
        options: [
          ['Number', 'number'],
          ['Time', 'time'],
        ],
        value: 'time',
        help: 'If set to time, the x value will be interpreted as a time (seconds after Unix epoch).',
        save: true
      },
      {
        name: 'topic1',
        title: 'MQTT Topic 1',
        type: 'text',
        value: '',
        help: 'Topic name with "_dev" append will be used for publishing commands to the device, and topic name with "_app" appended will be subscribed to and used for receiving data.',
        save: true
      },
      {
        name: 'label1',
        title: 'Label 1',
        type: 'text',
        value: '',
        help: 'Chart label for data.',
        save: true
      },
      {
        name: 'topic2',
        title: 'MQTT Topic 2',
        type: 'text',
        value: '',
        help: 'Topic name with "_dev" append will be used for publishing commands to the device, and topic name with "_app" appended will be subscribed to and used for receiving data.',
        save: true
      },
      {
        name: 'label2',
        title: 'Label 2',
        type: 'text',
        value: '',
        help: 'Chart label for data.',
        save: true
      },
      {
        name: 'topic3',
        title: 'MQTT Topic 3',
        type: 'text',
        value: '',
        help: 'Topic name with "_dev" append will be used for publishing commands to the device, and topic name with "_app" appended will be subscribed to and used for receiving data.',
        save: true
      },
      {
        name: 'label3',
        title: 'Label 3',
        type: 'text',
        value: '',
        help: 'Chart label for data.',
        save: true
      },
      {
        name: 'topic4',
        title: 'MQTT Topic 4',
        type: 'text',
        value: '',
        help: 'Topic name with "_dev" append will be used for publishing commands to the device, and topic name with "_app" appended will be subscribed to and used for receiving data.',
        save: true
      },
      {
        name: 'label4',
        title: 'Label 4',
        type: 'text',
        value: '',
        help: 'Chart label for data.',
        save: true
      },
      {
        name: 'topic5',
        title: 'MQTT Topic 5',
        type: 'text',
        value: '',
        help: 'Topic name with "_dev" append will be used for publishing commands to the device, and topic name with "_app" appended will be subscribed to and used for receiving data.',
        save: true
      },
      {
        name: 'label5',
        title: 'Label 5',
        type: 'text',
        value: '',
        help: 'Chart label for data.',
        save: true
      },
    ];
    this.settings.push(...settings);
  }

  attach(ele) {
    super.attach(ele);
  }

  processSettings() {
    super.processSettings();

    let chartDiv = this.element.querySelector('.chart');
    chartDiv.replaceChildren();
    chartDiv.innerHTML = '<canvas></canvas>';
    let canvas = this.element.querySelector('canvas');

    let options = {
      responsive: true,
      maintainAspectRatio: false,
      showLine: true,
      scales: {
        x: {}
      },
      plugins: {
        zoom: {
          pan: {
            enabled: true,
            mode: 'x'
          },
          zoom: {
            wheel: {
              enabled: true,
            },
            pinch: {
              enabled: true
            },
            mode: 'x',
          }
        }
      }
    };

    if (this.getSetting('xAxisType') == 'time') {
      options.scales.x.type = 'time';
    }

    this.chart = new Chart(canvas, {
      type: 'scatter',
      data: {
        datasets: [],
      },
      options: options
    });

    this.datasets = [];
    for (let i=1; i<6; i++) {
      let topic = this.getSetting('topic' + i);
      topic = topic.trim();
      if (topic != '') {
        this.initTopic(topic, i);
      }
    }

    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null;
    }
    this.timer = setInterval(this.requestAll.bind(this), 3000);
  }

  onMessageArrived(payload, topic) {
    topic = topic.slice(0,-4)
    let topicIndex = this.getTopicIndex(topic);

    if (topicIndex != -1) {
      let data = JSON.parse(payload);
      if (typeof data == 'number') {
        this.addSome(topicIndex, [[Date.now() / 1000, data]]);
      } else if (data.type == 'data_all') {
        this.replaceAll(topicIndex, data.data);
      } else if (data.type == 'data_some') {
        this.addSome(topicIndex, data.data);
      }
    }
  }

  replaceAll(topicIndex, data) {
    let dataset = this.datasets[topicIndex];
    if (dataset.sendInitialRequest) {
      dataset.sendInitialRequest = false;
    }

    dataset.data.length = 0;
    this.addSome(topicIndex, data);
  }

  addSome(topicIndex, data) {
    let dataset = this.datasets[topicIndex];

    for (let d of data) {
      let x = d[0];
      if (this.getSetting('xAxisType') == 'time') {
        x *= 1000;
      }
      dataset.data.push({
        x: x,
        y: d[1]
      });
    }

    this.chart.update();
  }

  getTopicIndex(topic) {
    for (let i=0; i<this.datasets.length; i++) {
      if (this.datasets[i].topic == topic) {
        return i
      }
    }
    return -1;
  }

  initTopic(topic, i) {
    let label = this.getSetting('label' + i);

    let data = []
    this.chart.data.datasets.push({
      label: label,
      data: data
    });

    this.datasets.push({
      topic: topic,
      sendInitialRequest: true,
      data: data
    });

    this.subscriptions.push(topic + '_app');
  }

  requestAll(topic) {
    if (main.mode != main.MODE_RUN) {
      return;
    }

    let req = {
      type: 'request_all'
    };
    req = JSON.stringify(req);
    for (let dataset of this.datasets) {
      if (dataset.sendInitialRequest) {
        main.publish(dataset.topic + '_dev', req);
      }
    }
  }
}

class IotyGauge extends IotyWidget {
  constructor() {
    super();
    this.content =
      '<div class="gauge">' +
        '<canvas width="100" height="100"></canvas>' +
        '<div class="text">' +
          '<div class="value">0</div>' +
          '<div class="label">Gauge</div>' +
        '</div>' +
        '<img class="placeholder" src="images/gauge_placeholder.png">' +
      '</div>';
    this.options.type = 'gauge';
    this.widgetName = '#widget-gauge#';
    this.state = 0;

    let settings = [
      {
        name: 'description',
        title: 'Description',
        type: 'label',
        value: 'The gauge widget will display whatever values it receives.',
        save: false
      },
      {
        name: 'topic',
        title: 'MQTT Topic',
        type: 'text',
        value: '',
        help: 'Topic to subscribe to.',
        save: true
      },
      {
        name: 'min',
        title: 'Minimum value',
        type: 'text',
        value: '0',
        help: 'Minimum value for the gauge.',
        save: true
      },
      {
        name: 'max',
        title: 'Maximum value',
        type: 'text',
        value: '255',
        help: 'Maximum value for the gauge.',
        save: true
      },
      {
        name: 'label',
        title: 'Label',
        type: 'text',
        value: 'Gauge',
        help: 'Text inside the gauge.',
        save: true
      },
    ];
    this.settings.push(...settings);
  }

  attach(ele) {
    super.attach(ele);

    this.targetValue = 0;
    this.currentValue = 0;
    this.prevValue = 0;
    this.prevTime = null;

    let canvas = this.element.querySelector('canvas');
    let resizeObserver = new ResizeObserver(this.canvasResize);
    resizeObserver.observe(canvas);

    requestAnimationFrame(this.drawGauge.bind(this));
  }

  processSettings() {
    super.processSettings();

    this.subscriptions.push(this.getSetting('topic'));

    let label = this.element.querySelector('.label');
    label.innerText = this.getSetting('label');
  }

  canvasResize(entries) {
    for (let entry of entries) {
      let canvas = entry.target;
      let size = Math.min(canvas.clientWidth, canvas.clientHeight)
      canvas.width = size;
      canvas.height = size;
    }
  }

  drawGauge(time) {
    function toRad(deg) {
      return deg / 180 * Math.PI;
    }

    if (this.prevTime == null) {
      this.prevTime = time - 16;
    }

    let delta = time - this.prevTime;
    this.prevTime = time;

    if (this.targetValue < 0) {
      this.targetValue = 0;
    } else if (this.targetValue > 1) {
      this.targetValue = 1;
    }

    let speed = (this.targetValue - this.prevValue) / 500;
    let diff = this.targetValue - this.currentValue;

    if (diff * speed > 0) {
      this.currentValue += speed * delta;
    } else {
      this.currentValue = this.targetValue;
    }

    let canvas = this.element.querySelector('canvas');
    let s = Math.min(canvas.width, canvas.height);
    let ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, s, s);

    ctx.beginPath();
    ctx.arc(0.5*s, 0.5*s, 0.45*s, toRad(-220), toRad(40));
    ctx.arc(0.5*s, 0.5*s, 0.38*s, toRad(40), toRad(-220), true);
    ctx.arc(0.5*s, 0.5*s, 0.45*s, toRad(-220), toRad(-220));
    ctx.fillStyle = 'lightgray';
    ctx.closePath();
    ctx.fill();

    let targetAngle = this.currentValue * 260 + -220;
    ctx.beginPath();
    ctx.arc(0.5*s, 0.5*s, 0.45*s, toRad(-220), toRad(targetAngle));
    ctx.arc(0.5*s, 0.5*s, 0.38*s, toRad(targetAngle), toRad(-220), true);
    ctx.arc(0.5*s, 0.5*s, 0.45*s, toRad(-220), toRad(-220));
    ctx.fillStyle = '#007bff';
    ctx.closePath();
    ctx.fill();

    requestAnimationFrame(this.drawGauge.bind(this));
  }

  onMessageArrived(payload) {
    let value = this.element.querySelector('.value');
    value.innerText = payload;

    let minValue = Number(this.getSetting('min'));
    let maxValue = Number(this.getSetting('max'));
    let range = maxValue - minValue

    this.prevValue = this.currentValue;
    this.targetValue = (Number(payload) - minValue) / range;
  }
}


IOTY_WIDGETS = [
  { type: 'button', widgetClass: IotyButton},
  { type: 'switch', widgetClass: IotySwitch},
  { type: 'hSlider', widgetClass: IotyHSlider},
  { type: 'vSlider', widgetClass: IotyVSlider},
  { type: 'text', widgetClass: IotyText},
  { type: 'select', widgetClass: IotySelect},
  { type: 'color', widgetClass: IotyColor},
  { type: 'joy', widgetClass: IotyJoy},
  { type: 'label', widgetClass: IotyLabel},
  { type: 'display', widgetClass: IotyDisplay},
  { type: 'status', widgetClass: IotyStatus},
  { type: 'hBar', widgetClass: IotyHBar},
  { type: 'vBar', widgetClass: IotyVBar},
  { type: 'gauge', widgetClass: IotyGauge},
  { type: 'notification', widgetClass: IotyNotification},
  { type: 'video', widgetClass: IotyVideo},
  { type: 'audio', widgetClass: IotyAudio},
  { type: 'image', widgetClass: IotyImage},
  { type: 'map', widgetClass: IotyMap},
  { type: 'tts', widgetClass: IotyTTS},
  { type: 'speech', widgetClass: IotySpeech},
  { type: 'chart', widgetClass: IotyChart},
];

// Helper function to attach widget to element
function attachIotyWidget(ele) {
  if (typeof ele.widget != 'undefined') {
    return;
  }

  let widget;
  for (let iotyWidget of IOTY_WIDGETS) {
    if (ele.getAttribute('ioty-type') == iotyWidget.type) {
      widget = new iotyWidget.widgetClass();
      break;
    }
  }

  widget.attach(ele);
  ele.widget = widget;
  widget.removePlaceholder();
}