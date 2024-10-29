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
    this.bytesSubscriptions = [];

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

  destroy() {
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
          ['Left / Right', 'leftRight'],
          ['Polar', 'polar']
        ],
        value: 'xy',
        help: 'X/Y sends the position of the joystick. Left/Right sends speed values a differential drive robot. Polar sends angle in deg and distance (0 to max).',
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
    let center = (max + min) / 2;

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
      v1 = v1 * range / 2 + center;
      v2 = v2 * range / 2 + center;
    } else if (this.getSetting('valueType') == 'polar') {
      let x = (this.x - 0.5) * 2;
      let y = (this.y - 0.5) * -2;
      let angle = Math.atan2(y, x);
      let magnitude = Math.sqrt(x**2 + y**2);

      v1 = angle / Math.PI * 180;
      v2 = magnitude * max;
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

class IotyDirection extends IotyWidget {
  constructor() {
    super();
    this.content =
      '<div class="direction">' +
        '<div class="wrapper">' +
          '<img class="indicator" src="images/directionIndicator.svg" draggable="false">' +
        '</div>' +
        '<div class="text">' +
          '<div class="value">0</div>' +
          '<div class="label">Dir</div>' +
        '</div>' +
      '</div>';
    this.options.type = 'direction';
    this.widgetName = '#widget-direction#';
    this.theta = 0;
    this.thetaConverted = 0;

    this.lastPayload = null;

    let settings = [
      {
        name: 'description',
        title: 'Description',
        type: 'label',
        value: 'The direction widget will publish its direction to the specified topic when changed.',
        save: false
      },
      {
        name: 'valueType',
        title: 'Value Type',
        type: 'select',
        options: [
          ['Heading (Degrees, North is 0, Clockwise Positive)', 'heading'],
          ['Math Degrees (East is 0, Counterclockwise Positive)', 'mathDeg'],
          ['Math Radians (East is 0, Counterclockwise Positive)', 'mathRad']
        ],
        value: 'heading',
        help: 'The format to publish the result in.',
        save: true
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
        value: 'Dir',
        help: 'Label for widget.',
        save: true
      },
    ];
    this.settings.push(...settings);

    this.timer = setInterval(this.timerPublish.bind(this), 100);
  }

  attach(ele) {
    super.attach(ele);

    let img = ele.querySelector('.wrapper');
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
      let x = 2 * (evt.offsetX / evt.target.offsetWidth - 0.5);
      let y = 2 * (evt.offsetY / evt.target.offsetHeight - 0.5);

      this.theta = Math.atan2(y, x);

      let indicator = this.element.querySelector('.indicator');
      let currentAngle = Number(getComputedStyle(indicator).rotate.slice(0, -3));
      if (isNaN(currentAngle)) {
        currentAngle = 0;
      }
      this.theta = (currentAngle / 180 * Math.PI + this.theta);

      this.convertAngle();
      this.turnIndicator();
    }
  }

  pointermove(evt) {
    if (evt.buttons != 0) {
      this.pointerdown(evt);
    }
  }

  pointerup(evt) {
    if (main.mode == main.MODE_RUN) {
      if (this.getSetting('onChange') != 'true') {
        this.publish()
      }
    }
  }

  convertAngle() {
    if (this.getSetting('valueType') == 'heading') {
      this.thetaConverted = this.theta / Math.PI * 180 + 90;
      this.thetaConverted %= 360;
      if (this.thetaConverted < 0) {
        this.thetaConverted += 360;
      }
    } else if (this.getSetting('valueType') == 'mathDeg') {
      this.thetaConverted = -this.theta / Math.PI * 180;
      this.thetaConverted %= 360;
      if (this.thetaConverted < -180) {
        this.thetaConverted += 360;
      }
      if (this.thetaConverted > 180) {
        this.thetaConverted -= 360;
      }
    } else if (this.getSetting('valueType') == 'mathRad') {
      this.thetaConverted = -this.theta;
      this.thetaConverted %= Math.PI * 2;
      if (this.thetaConverted < -Math.PI) {
        this.thetaConverted += Math.PI * 2;
      }
      if (this.thetaConverted > Math.PI) {
        this.thetaConverted -= Math.PI * 2;
      }
    }
  }

  turnIndicator() {
    let indicator = this.element.querySelector('.indicator');
    let angle = this.theta + Math.PI / 2;
    angle %= Math.PI * 2;
    indicator.style.rotate = angle + 'rad';
    let value = this.element.querySelector('.value');
    if (this.getSetting('valueType') == 'mathRad') {
      value.innerText = Math.round(this.thetaConverted * 100) / 100;
    } else {
      value.innerText = Math.round(this.thetaConverted);
    }
  }

  timerPublish() {
    if (main.mode != main.MODE_RUN) {
      return;
    }
    if (this.getSetting('onChange') == 'false') {
      return;
    }
    if (this.thetaConverted != this.lastPayload) {
      this.publish();
      this.lastPayload = this.thetaConverted;
    }
  }

  publish() {
    if (main.mode != main.MODE_RUN) {
      return;
    }
    main.publish(this.getSetting('topic'), String(this.thetaConverted));
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
        value: 'The image widget will display an image. You can hide, show, or change the image file via MQTT.',
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
      {
        name: 'scale',
        title: 'Scale image to fit',
        type: 'check',
        value: 'false',
        help: 'If true, the image will be scaled up to fill the entire widget without changing aspect ratio.',
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
      image.src = 'images/image_placeholder.png';
    }

    if (this.getSetting('scale') == 'true') {
      image.classList.add('scale');
    } else {
      image.classList.remove('scale');
    }

    this.topics = {};
    for (let topic of ['urlTopic', 'controlTopic']) {
      this.topics[topic] = this.getSetting(topic);
      if (this.getSetting(topic).trim() != '') {
        this.subscriptions.push(this.getSetting(topic));
      }
    }
    for (let topic of ['dataTopic']) {
      this.topics[topic] = this.getSetting(topic);
      if (this.getSetting(topic).trim() != '') {
        this.bytesSubscriptions.push(this.getSetting(topic));
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

class IotyRawImage extends IotyWidget {
  constructor() {
    super();
    this.content =
      '<div class="rawImage">' +
        '<canvas width="100" height="100"></canvas>' +
        '<img class="placeholder" src="images/rawImage_placeholder.png">' +
      '</div>';
    this.options.type = 'rawImage';
    this.widgetName = '#widget-rawImage#';

    let settings = [
      {
        name: 'description',
        title: 'Description',
        type: 'label',
        value: 'The raw image widget will display raw pixel data as an image.',
        save: false
      },
      {
        name: 'dataTopic',
        title: 'Data Topic',
        type: 'text',
        value: '',
        help: 'Publish raw pixel data (bytes) to this topic for display.',
        save: true
      },
      {
        name: 'controlTopic',
        title: 'Control Topic',
        type: 'text',
        value: '',
        help: 'Publish to this topic to control the image display. Use keywords: "show", "hide", or "toggle". Additional keywords are available for the below options.',
        save: true
      },
      {
        name: 'width',
        title: 'Width of the Image',
        type: 'text',
        value: '8',
        help: 'This can also be set via the control topic using keyword "width X" where X is the width.',
        save: true
      },
      {
        name: 'height',
        title: 'Height of the Image',
        type: 'text',
        value: '8',
        help: 'This can also be set via the control topic using keyword "height X" where X is the height.',
        save: true
      },
      {
        name: 'depth',
        title: 'Bit Depth of the Image',
        type: 'select',
        options: [
          ['Unsigned 8 bits', 'uint8'],
          ['Signed 8 bits', 'int8'],
          ['Unsigned 16 bits Big Endian', 'uint16_BE'],
          ['Unsigned 16 bits Little Endian', 'uint16_LE'],
          ['Signed 16 bits Big Endian', 'int16_BE'],
          ['Signed 16 bits Little Endian', 'int16_LE'],
          ['RGB (16 bits, Big Endian)', 'rgb16BE'],
          ['RGB (16 bits, Little Endian)', 'rgb16LE'],
          ['RGB (24 bits)', 'rgb24'],
        ],
        value: 'uint8',
        help: 'This can also be set via the control topic using keyword "depth X". Valid X are "gray8", "rgb16BE", "rgb16LE", "rgb24", "falseColorIron8".',
        save: true
      },
      {
        name: 'grayDisplay',
        title: 'Display mode of grayscale images',
        type: 'select',
        options: [
          ['Grayscale', 'gray'],
          ['Grayscale Inverse', 'grayInverse'],
          ['False Color (Iron Palette)', 'falseColorIron'],
          ['False Color (Rainbow Palette)', 'falseColorRain'],
          ['False Color (Metro Palette)', 'falseColorMetro'],
        ],
        value: 'gray',
        help: 'Only used for grayscale images. This can also be set via the control topic using keyword "grayDisplay X". Valid X are "gray", "falseColor".',
        save: true
      },
      {
        name: 'rangeMode',
        title: 'Ranging Mode',
        type: 'select',
        options: [
          ['Auto', 'auto'],
          ['Manual', 'manual']
        ],
        value: 'auto',
        help: 'In auto mode, the pixel minimum and maximum will be set based on image data.',
        save: true
      },
      {
        name: 'pixelMin',
        title: 'Pixel Minimum',
        type: 'text',
        value: '',
        help: 'Pixel values will be scaled to the minimum and maximum range. Leave blank to disable scaling. This can also be set via the control topic using keyword "pixelMin X".',
        save: true
      },
      {
        name: 'pixelMax',
        title: 'Pixel Maximum',
        type: 'text',
        value: '',
        help: 'Pixel values will be scaled to the minimum and maximum range. Leave blank to disable scaling. This can also be set via the control topic using keyword "pixelMax X".',
        save: true
      },
      {
        name: 'scaling',
        title: 'Scaling Method',
        type: 'select',
        options: [
          ['Nearest Neighbour', 'nearestNeighbour'],
          ['Bilinear', 'bilinear'],
        ],
        value: 'bilinear',
        help: 'This can also be set via the control topic using keyword "scaling X". Valid X are "nearestNeighbour", "bilinear".',
        save: true
      },
    ];
    this.settings.push(...settings);
  }

  attach(ele) {
    super.attach(ele);

    let canvas = this.element.querySelector('canvas');
    let resizeObserver = new ResizeObserver(this.canvasResize.bind(this));
    resizeObserver.observe(canvas);
  }

  processSettings() {
    super.processSettings();

    this.width = Number(this.getSetting('width'));
    this.height = Number(this.getSetting('height'));
    this.depth = this.getSetting('depth');
    this.grayDisplay = this.getSetting('grayDisplay');
    this.scaling = this.getSetting('scaling');
    this.rangeMode = this.getSetting('rangeMode');

    const uint8 = ['uint8', 'rgb16BE', 'rgb16LE', 'rgb24'];
    const int8 = ['int8'];
    const uint16 = ['uint16_BE', 'uint16_LE'];
    const int16 = ['int16_BE', 'int16_LE'];
    if (uint8.includes(this.depth)) {
      this.pixelMin = 0;
      this.pixelMax = 255;
    } else if (int8.includes(this.depth)) {
      this.pixelMin = -128;
      this.pixelMax = 127;
    } else if (uint16.includes(this.depth)) {
      this.pixelMin = 0;
      this.pixelMax = 65535;
    } else if (int16.includes(this.depth)) {
      this.pixelMin = -32768;
      this.pixelMax = 32767;
    }

    let pixelMin = this.getSetting('pixelMin');
    if (pixelMin.trim() != '') {
      this.pixelMin = Number(pixelMin);
    }
    let pixelMax = this.getSetting('pixelMax');
    if (pixelMax.trim() != '') {
      this.pixelMax = Number(pixelMax);
    }

    this.subscriptions.push(this.getSetting('controlTopic'));
    this.bytesSubscriptions.push(this.getSetting('dataTopic'));
  }

  canvasResize(entries) {
    for (let entry of entries) {
      let canvas = entry.target;
      let imageWidth = this.width;
      let imageHeight = this.height;
      let clientWidth = canvas.clientWidth;
      let clientHeight = canvas.clientHeight;

      if (clientWidth / clientHeight > imageWidth / imageHeight) {
        canvas.width = clientHeight * imageWidth / imageHeight;
        canvas.height = clientHeight;
      } else {
        canvas.width = clientWidth;
        canvas.height = clientWidth * imageHeight / imageWidth
      }
    }
  }

  onMessageArrived(payload, topic) {
    if (topic == this.getSetting('controlTopic')) {
      this.onMessageArrivedControl(payload);
    } else if (topic == this.getSetting('dataTopic')) {
      this.onMessageArrivedData(payload);
    }
  }

  onMessageArrivedControl(payload) {
    let canvas = this.element.querySelector('canvas');
    if (payload == 'show') {
      canvas.classList.remove('hide');
    } else if (payload == 'hide') {
      canvas.classList.add('hide');
    } else if (payload == 'toggle') {
      canvas.classList.toggle('hide');
    } else {
      let command = payload.split(' ');
      if (command[0] == 'width' && command.length == 2) {
        this.width = Number(command[1]);
      } else if (command[0] == 'height' && command.length == 2) {
        this.height = Number(command[1]);
      } else if (command[0] == 'depth' && command.length == 2) {
        this.depth = command[1];
      } else if (command[0] == 'grayDisplay' && command.length == 2) {
        this.grayDisplay = command[1];
      } else if (command[0] == 'scaling' && command.length == 2) {
        this.scaling = command[1];
      } else if (command[0] == 'pixelMin' && command.length == 2) {
        this.pixelMin = Number(command[1]);
      } else if (command[0] == 'pixelMax' && command.length == 2) {
        this.pixelMax = Number(command[1]);
      }
    }
  }

  falseColor8ToPixel(palette, value) {
    let out = new Uint8Array(4);

    var x = value / 255;
    let i;
    for (i=0; i<palette.length; i++) {
      if (x <= palette[i][0]) {
        break;
      }
    }

    let xFloor = Math.max(i-1, 0);
    let xCeil = Math.min(i, palette.length);

    if (xFloor == xCeil) {
      for (let i=0; i<3; i++) {
        out[i] = palette[xFloor][1][i];
      }
    } else {
      for (let i=0; i<3; i++) {
        let prev = palette[xFloor];
        let next = palette[xCeil];
        let range = next[0] - prev[0];
        out[i] = (prev[1][i] * (next[0] - x) + next[1][i] * (x - prev[0])) / range;
      }
    }
    out[3] = 255;
    return out;
  }

  falseColorIron8ToPixel(value) {
    let palette = [
      [0.0, [0x00, 0x00, 0x0A]],
      [0.25, [0x91, 0x00, 0x9C]],
      [0.5, [0xE6, 0x46, 0x16]],
      [0.75, [0xFE, 0xB4, 0x00]],
      [1.0, [0xFF, 0xFF, 0xF6]]
    ];

    return this.falseColor8ToPixel(palette, value);
  }

  falseColorRain8ToPixel(value) {
    let palette = [
      [0.138, [0xfc, 0x00, 0xfe]],
      [0.276, [0x00, 0x09, 0xb7]],
      [0.409, [0x00, 0xfa, 0xf6]],
      [0.538, [0x00, 0x6f, 0x02]],
      [0.678, [0xf9, 0xfc, 0x00]],
      [0.832, [0xca, 0x0b, 0x0b]],
      [1.0, [0xfb, 0xf0, 0xf0]],
    ];

    return this.falseColor8ToPixel(palette, value);
  }

  falseColorMetro8ToPixel(value) {
    let palette = [
      [0.0, [0x00, 0x00, 0xff]],
      [0.333, [0x00, 0xff, 0x00]],
      [0.666, [0xff, 0x00, 0x00]],
      [1.0, [0xff, 0xff, 0xff]],
    ];

    return this.falseColor8ToPixel(palette, value);
  }

  getValue(image, index) {
    if (this.depth == 'uint8') {
      let v = image[index]
      return [v];
    } else if (this.depth == 'int8') {
      let v = image[index]
      if (v > 127) {
        v -= 256;
      }
      return [v];
    } else if (this.depth == 'uint16_BE') {
      let v = image[index*2] << 8 | image[index*2+1];
      return [v];
    } else if (this.depth == 'uint16_LE') {
      let v = image[index*2+1] << 8 | image[index*2];
      return [v];
    } else if (this.depth == 'int16_BE') {
      let v = image[index*2] << 8 | image[index*2+1];
      if (v > 32767) {
        v -= 65536
      }
      return [v];
    } else if (this.depth == 'int16_LE') {
      let v = image[index*2+1] << 8 | image[index*2];
      if (v > 32767) {
        v -= 65536
      }
      return [v];
    } else if (this.depth == 'rgb16BE') {
      let r = image[index*2] & 0b11111000;
      let g = (image[index*2] & 0b00000111) << 5 | (image[index*2+1] & 0b11100000) >> 5;
      let b = (image[index*2+1] & 0b00011111) << 3;
      return [r, g, b];
    } else if (this.depth == 'rgb16LE') {
      let r = image[index*2+1] & 0b11111000;
      let g = (image[index*2+1] & 0b00000111) << 5 | (image[index*2] & 0b11100000) >> 5;
      let b = (image[index*2] & 0b00011111) << 3;
      return [r, g, b];
    } else if (this.depth == 'rgb24') {
      let r = image[index*3];
      let g = image[index*3+1]
      let b = image[index*3+2];
      return [r, g, b];
    }

    return [r, g, b];
  }

  scaleValue(value, min, max) {
    let out = [];
    let range = max - min;
    for (let v of value) {
      v = Math.round((v - min) / range * 255);
      v = Math.max(Math.min(v, 255), 0);
      out.push(v);
    }
    return out;
  }

  getPixel(value) {
    let out = new Uint8Array(4);
    if (value.length == 3) {
      out[0] = value[0];
      out[1] = value[1];
      out[2] = value[2];
    } else if (this.grayDisplay == 'gray') {
      out[0] = value[0];
      out[1] = value[0];
      out[2] = value[0];
    } else if (this.grayDisplay == 'grayInverse') {
      out[0] = 255 - value[0];
      out[1] = 255 - value[0];
      out[2] = 255 - value[0];
    } else if (this.grayDisplay == 'falseColorIron') {
      out = this.falseColorIron8ToPixel(value[0]);
    } else if (this.grayDisplay == 'falseColorRain') {
      out = this.falseColorRain8ToPixel(value[0]);
    } else if (this.grayDisplay == 'falseColorMetro') {
      out = this.falseColorMetro8ToPixel(value[0]);
    }

    out[3] = 255;
    return out;
  }

  getPixels(image) {
    let data = [];
    let size = this.width*this.height;
    for (let i=0; i<size; i++) {
      data.push(this.getValue(image, i));
    }

    let min = 2**32;
    let max = -(2**32);
    if (this.rangeMode == 'auto') {
      for (let i=0; i<size; i++) {
        for (let j of data[i]) {
          max = Math.max(max, j);
          min = Math.min(min, j);
        }
      }
    } else {
      min = this.pixelMin;
      max = this.pixelMax;
    }

    for (let i=0; i<size; i++) {
      let v = this.scaleValue(data[i], min, max);
      data[i] = this.getPixel(v);
    }

    return data;
  }

  nearestNeighbourScale(image) {
    let canvas = this.element.querySelector('canvas');

    const iw = this.width;
    const ih = this.height;
    const ow = canvas.width;
    const oh = canvas.height;

    let ctx = canvas.getContext("2d");
    let imageData = ctx.createImageData(ow, oh);

    let data = this.getPixels(image);
    for (let y=0; y<oh; y++) {
      for (let x=0; x<ow; x++) {
        let oi = y * ow + x;
        let ii = Math.floor(y * ih / oh) * iw + Math.floor(x * iw / ow);

        for (let i=0; i<4; i++) {
          imageData.data[4 * oi + i] = data[ii][i];
        }
      }
    }

    return imageData;
  }

  bilinearScale(image) {
    let canvas = this.element.querySelector('canvas');

    const iw = this.width;
    const ih = this.height;
    const ow = canvas.width;
    const oh = canvas.height;

    let ctx = canvas.getContext("2d");
    let imageData = ctx.createImageData(ow, oh);

    let data = this.getPixels(image);
    for (let y=0; y<oh; y++) {
      for (let x=0; x<ow; x++) {
        let oi = y * ow + x;
        let ix = x * (iw-1) / (ow-1);
        let iy = y * (ih-1) / (oh-1);
        let xFloor = Math.floor(ix);
        let xCeil = Math.min(Math.ceil(ix), iw - 1);
        let yFloor = Math.floor(iy);
        let yCeil = Math.min(Math.ceil(iy), ih - 1);

        let p0 = data[yFloor * iw + xFloor];
        let p1 = data[yFloor * iw + xCeil];
        let p2 = data[yCeil * iw + xFloor];
        let p3 = data[yCeil * iw + xCeil];

        let pixel = new Uint8Array(4);
        for (let i=0; i<4; i++) {
          let q1 = p0[i] * (xCeil - ix) + p1[i] * (ix - xFloor)
          let q2 = p2[i] * (xCeil - ix) + p3[i] * (ix - xFloor)
          pixel[i] = Math.round(q1 * (yCeil - iy) + q2 * (iy - yFloor))
        }

        for (let i=0; i<4; i++) {
          imageData.data[4 * oi + i] = pixel[i];
        }
      }
    }

    return imageData;
  }

  onMessageArrivedData(payload) {
    let scaledImage;
    if (this.scaling == 'nearestNeighbour') {
      scaledImage = this.nearestNeighbourScale(payload);
    } else if (this.scaling == 'bilinear') {
      scaledImage = this.bilinearScale(payload);
    }

    let canvas = this.element.querySelector('canvas');
    let ctx = canvas.getContext("2d");
    ctx.putImageData(scaledImage, 0, 0);
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
      let percent = markerStrings[6];
      if (percent > 100) {
        percent = 100;
      } else if (percent < 0) {
        percent = 0;
      }
      percentBar.style.height = percent + '%';
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

    let settings = [
      {
        name: 'description',
        title: 'Description',
        type: 'label',
        value: 'The chart widget retrieve data from the specified topic and display it in a chart. It should be used with the "MQTT Logger" extension in IoTy.',
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

class IotyImageTM extends IotyWidget {
  constructor() {
    super();
    this.content =
      '<div class="imageTM">' +
      '<div class="wrapper"></div><div class="results"></div>' +
      '<img class="placeholder" src="images/imageTM_placeholder.png">' +
      '</div>';
    this.options.type = 'imageTM';
    this.widgetName = '#widget-imageTM#';

    let settings = [
      {
        name: 'description',
        title: 'Description',
        type: 'label',
        value: 'The Teachable Machine (Image) widget will classify objects seen by the camera, and publish the result to the specified topic.',
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
        name: 'url',
        title: 'Model URL',
        type: 'text',
        value: '',
        help: 'Link to your model provided by Teachable Machine export panel',
        save: true
      },
      {
        name: 'threshold',
        title: 'Confidence Threshold (0 to 1.0)',
        type: 'text',
        value: '0.8',
        help: 'The result will only be sent if the confidence is above the threshold. If blank or invalid, the default of 0.8 will be used.',
        save: true
      },
      {
        name: 'cameraIndex',
        title: 'Camera Selection',
        type: 'text',
        value: '0',
        help: 'Determines which camera is used. 0 will be the first camera, 1 will be second camera, etc.',
        save: true
      },
      {
        name: 'flip',
        title: 'Flip Camera Image',
        type: 'check',
        value: 'true',
        help: 'If true, the camera image will be flipped left to right.',
        save: true
      },
      {
        name: 'resultGuide',
        title: 'Result Type',
        type: 'html',
        value:
        '<p>Class name only</p>' +
        '<ul>' +
          '<li>Sends the name of the class with the highest probability, but only if it is above the confidence threshold</li>' +
          '<li>Only send result if changed</li>' +
          '<li>If none of the results are above the confidence threshold, an empty string will be sent</li>' +
        '</ul>' +
        '<p>Class and Confidence</p>' +
        '<ul>' +
          '<li>Sends classname and probability as an array in json format every 0.5 seconds</li>' +
          '<li>Example: ["class1", 0.89]</li>' +
          '<li>Only send the result with the highest confidence</li>' +
          '<li>Ignores confidence threshold</li>' +
        '</ul>' +
        '<p>All Results</p>' +
        '<ul>' +
          '<li>Sends all results as an array of arrays in json format every 0.5 seconds</li>' +
          '<li>Example: [["class1", 0.89], ["class2", 0.11]]</li>' +
          '<li>Ignores confidence threshold</li>' +
        '</ul>',
        save: false
      },
      {
        name: 'resultType',
        title: 'Result Type',
        type: 'select',
        options: [
          ['Class Name only', 'class'],
          ['Class and Confidence (json)', 'classAndConfidence'],
          ['All Results (json)', 'all'],
        ],
        value: 'class',
        save: true
      },
      {
        name: 'displayResults',
        title: 'Display Results',
        type: 'check',
        value: 'true',
        help: 'If true, results will be displayed on screen.',
        save: true
      },
    ];
    this.settings.push(...settings);
  }

  async attach(ele) {
    super.attach(ele);
    this.webcam = new tmImage.Webcam(200, 200, true);
    await this.webcam.setup();
    await this.webcam.play();
    this.loopStop = false;
    window.requestAnimationFrame(this.updateWebcam.bind(this));

    let wrapper = this.element.querySelector('.wrapper');
    wrapper.innerHTML = '';
    wrapper.appendChild(this.webcam.canvas);

    this.intervalID = setInterval(this.predict.bind(this), 500);

    this.prevResult = '';
  }

  async processSettings() {
    super.processSettings();

    let flip = false;
    if (this.getSetting('flip') == 'true') {
      flip = true
    }

    if (this.webcam) {
      this.webcam.stop();
    }

    this.webcam = new tmImage.Webcam(200, 200, flip);

    let devices = await navigator.mediaDevices.enumerateDevices();
    devices = devices.filter(e => e.kind == 'videoinput' );

    let cameraIndex = parseInt(this.getSetting('cameraIndex'));
    if (cameraIndex == NaN) {
      cameraIndex = 0;
    }
    if (cameraIndex >= devices.length) {
      cameraIndex = 0;
    }

    await this.webcam.setup({
      deviceId: devices[cameraIndex].deviceId,
      facingMode: 'any'
    });
    await this.webcam.play();

    let wrapper = this.element.querySelector('.wrapper');
    wrapper.innerHTML = '';
    wrapper.appendChild(this.webcam.canvas);

    this.model = null;
    let url = this.getSetting('url').trim();
    if (url != '') {
      if (url[url.length-1] != '/') {
        url += '/';
      }
      const modelURL = url + "model.json";
      const metadataURL = url + "metadata.json";
      try {
        this.model = await tmImage.load(modelURL, metadataURL);
      } catch (e) {
        toastMsg('Unable to load Teachable Machine model');
      }
    }
  }

  async updateWebcam() {
    if (this.loopStop) {
      return;
    }

    this.webcam.update();
    window.requestAnimationFrame(this.updateWebcam.bind(this));
  }

  displayResults(results) {
    if (this.getSetting('displayResults') == 'true') {
      let html = '';
      for (let result of results) {
        html += result.className + ': ' + result.probability.toFixed(2) + '<br>';
      }
      this.element.querySelector('.results').innerHTML = html;
      this.element.querySelector('.results').style.display = 'block';
    } else {
      this.element.querySelector('.results').style.display = 'none';
    }
  }

  findHighest(results) {
    let highestIndex = 0;
    let highestProbability = 0;
    for (let i in results) {
      if (results[i].probability > highestProbability) {
        highestIndex = i;
        highestProbability = results[i].probability;
      }
    }
    return results[highestIndex];
  }

  async predict() {
    if (this.model && this.webcam.canvas) {
      const results = await this.model.predict(this.webcam.canvas);

      this.displayResults(results);
      let highest = this.findHighest(results);

      let threshold = parseFloat(this.getSetting('threshold'));
      if (threshold == NaN) {
        threshold = 0.8;
      }

      if (main.mode == main.MODE_RUN) {
        if (this.getSetting('resultType') == 'class') {
          let result = '';
          if (highest.probability > threshold) {
            result = highest.className;
          }

          if (result != this.prevResult) {
            this.prevResult = result;
            main.publish(this.getSetting('topic'), result);
          }

        } else if (this.getSetting('resultType') == 'classAndConfidence') {
          let result = [];
          result.push(highest.className);
          result.push(highest.probability);
          main.publish(this.getSetting('topic'), JSON.stringify(result));

        } else if (this.getSetting('resultType') == 'all') {
          let all = [];
          for (let result of results) {
            all.push([result.className, result.probability]);
          }
          main.publish(this.getSetting('topic'), JSON.stringify(all));
        }
      }
    }
  }

  destroy() {
    this.loopStop = true;
    clearInterval(this.intervalID);
  }
}

class IotyRemoteImageTM extends IotyWidget {
  constructor() {
    super();
    this.content =
      '<div class="remoteImageTM">' +
      '<img class="hide" src="">' +
      '<img src="images/imageTM_placeholder.png">' +
      '<div class="results"></div>' +
      '</div>';
    this.options.type = 'remoteImageTM';
    this.widgetName = '#widget-remoteImageTM#';

    let settings = [
      {
        name: 'description',
        title: 'Description',
        type: 'label',
        value: 'The Teachable Machine (Remote Image) widget will classify objects published to the data topic, and publish the result to the results topic.',
        save: false
      },
      {
        name: 'dataTopic',
        title: 'Data Topic',
        type: 'text',
        value: '',
        help: 'Publish image data to this topic. Images can be in any format supported by the browser.',
        save: true
      },
      {
        name: 'resultsTopic',
        title: 'Results Topic',
        type: 'text',
        value: '',
        help: 'Results of image classification will be published to this topic.',
        save: true
      },
      {
        name: 'url',
        title: 'Model URL',
        type: 'text',
        value: '',
        help: 'Link to your model provided by Teachable Machine export panel',
        save: true
      },
      {
        name: 'threshold',
        title: 'Confidence Threshold (0 to 1.0)',
        type: 'text',
        value: '0.8',
        help: 'The result will only be sent if the confidence is above the threshold. If blank or invalid, the default of 0.8 will be used.',
        save: true
      },
      {
        name: 'resultGuide',
        title: 'Result Type',
        type: 'html',
        value:
        '<p>Class name only</p>' +
        '<ul>' +
          '<li>Sends the name of the class with the highest probability, but only if it is above the confidence threshold</li>' +
          '<li>If none of the results are above the confidence threshold, an empty string will be sent</li>' +
        '</ul>' +
        '<p>Class and Confidence</p>' +
        '<ul>' +
          '<li>Sends classname and probability as an array in json format</li>' +
          '<li>Example: ["class1", 0.89]</li>' +
          '<li>Only send the result with the highest confidence</li>' +
          '<li>Ignores confidence threshold</li>' +
        '</ul>' +
        '<p>All Results</p>' +
        '<ul>' +
          '<li>Sends all results as an array of arrays in json format</li>' +
          '<li>Example: [["class1", 0.89], ["class2", 0.11]]</li>' +
          '<li>Ignores confidence threshold</li>' +
        '</ul>',
        save: false
      },
      {
        name: 'resultType',
        title: 'Result Type',
        type: 'select',
        options: [
          ['Class Name only', 'class'],
          ['Class and Confidence (json)', 'classAndConfidence'],
          ['All Results (json)', 'all'],
        ],
        value: 'class',
        save: true
      },
      {
        name: 'displayResults',
        title: 'Display Results',
        type: 'check',
        value: 'true',
        help: 'If true, results will be displayed on screen.',
        save: true
      },
    ];
    this.settings.push(...settings);
  }

  async attach(ele) {
    super.attach(ele);
  }

  async processSettings() {
    super.processSettings();

    try {
      let url = this.getSetting('url').trim();
      if (url[url.length-1] != '/') {
        url += '/';
      }
      const modelURL = url + "model.json";
      const metadataURL = url + "metadata.json";
      this.model = await tmImage.load(modelURL, metadataURL);
    } catch (e) {
      this.model = null;
      toastMsg('Unable to load Teachable Machine model');
    }

    this.bytesSubscriptions.push(this.getSetting('dataTopic'));
  }

  onMessageArrived(payload, topic) {
    let image = this.element.querySelector('img.hide');
    image.onload = this.predict.bind(this);
    image.src = URL.createObjectURL(
      new Blob([payload])
    );
    this.flashIndicator()
  }

  displayResults(results) {
    if (this.getSetting('displayResults') == 'true') {
      let html = '';
      for (let result of results) {
        html += result.className + ': ' + result.probability.toFixed(2) + '<br>';
      }
      this.element.querySelector('.results').innerHTML = html;
      this.element.querySelector('.results').style.display = 'block';
    } else {
      this.element.querySelector('.results').style.display = 'none';
    }
  }

  findHighest(results) {
    let highestIndex = 0;
    let highestProbability = 0;
    for (let i in results) {
      if (results[i].probability > highestProbability) {
        highestIndex = i;
        highestProbability = results[i].probability;
      }
    }
    return results[highestIndex];
  }

  async predict() {
    if (this.model) {
      let image = this.element.querySelector('img.hide');
      const results = await this.model.predict(image);

      this.displayResults(results);
      let highest = this.findHighest(results);

      let threshold = parseFloat(this.getSetting('threshold'));
      if (threshold == NaN) {
        threshold = 0.8;
      }

      if (main.mode == main.MODE_RUN) {
        if (this.getSetting('resultType') == 'class') {
          let result = '';
          if (highest.probability > threshold) {
            result = highest.className;
          }

          main.publish(this.getSetting('resultsTopic'), result);
        } else if (this.getSetting('resultType') == 'classAndConfidence') {
          let result = [];
          result.push(highest.className);
          result.push(highest.probability);
          main.publish(this.getSetting('resultsTopic'), JSON.stringify(result));

        } else if (this.getSetting('resultType') == 'all') {
          let all = [];
          for (let result of results) {
            all.push([result.className, result.probability]);
          }
          main.publish(this.getSetting('resultsTopic'), JSON.stringify(all));
        }
      }
    }
  }

  flashIndicator() {
    let indicator = this.element.querySelector('img:not(.hide)');
    indicator.classList.add('flash');
    setTimeout(function(){
      indicator.classList.remove('flash');
    }, 200);
  }
}

class IotyHeartbeat extends IotyWidget {
  constructor() {
    super();
    this.content = '<div class="heartbeat"><div class="indicator"><img class="gray" src="images/heart_gray.svg"><img class="red" src="images/heart_red.svg"><div class="label">Heartbeat</div></div></div>'
    this.options.type = 'heartbeat';
    this.widgetName = '#widget-heartbeat#';

    let settings = [
      {
        name: 'description',
        title: 'Description',
        type: 'label',
        value: 'The heartbeat widget will publish a message to the specified topic regularly. You can use this to let any subscribers know that the app is running.',
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
        name: 'message',
        title: 'Message to publish',
        type: 'text',
        value: '<time>',
        help: 'Message to publish. If the special string "<time>" is used, the current UNIX time will be sent.',
        save: true
      },
      {
        name: 'interval',
        title: 'Interval between publish',
        type: 'text',
        value: '5',
        help: 'Interval between each publish in seconds.',
        save: true
      },
      {
        name: 'sendWhenHidden',
        title: 'Send heartbeat even when hidden',
        type: 'check',
        value: 'false',
        help: 'If true, heartbeat messages will be sent even when the browser tab is hidden (...but not closed or suspended by the browser).',
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

    if (this.timer) {
      clearInterval(this.timer);
    }
    let interval = parseFloat(this.getSetting('interval')) * 1000;
    if (interval) {
      this.timer = setInterval(this.publish.bind(this), interval);
    }
  }

  publish() {
    if (main.mode != main.MODE_RUN) {
      return;
    }
    if (document.hidden) {
      if (this.getSetting('sendWhenHidden') == 'false') {
        return;
      }
    }

    let message = this.getSetting('message');
    if (message == '<time>') {
      message = String(Math.floor((new Date()).getTime() / 1000));
    }
    main.publish(this.getSetting('topic'), message);
    this.flashIndicator();
  }

  flashIndicator() {
    let indicator = this.element.querySelector('.indicator');
    indicator.classList.add('flash');
    setTimeout(function(){
      indicator.classList.remove('flash');
    }, 200);
  }
}

class IotyECG extends IotyWidget {
  constructor() {
    super();
    this.content = '<div class="ecg"><div class="indicator"><img class="dead" src="images/ecg_dead.svg"><img class="live hide" src="images/ecg_live.svg"><div class="label">ECG</div></div></div>'
    this.options.type = 'ecg';
    this.widgetName = '#widget-ecg#';

    let settings = [
      {
        name: 'description',
        title: 'Description',
        type: 'label',
        value: 'The ECG widget will gradually fade to gray over time, but will return to red when it receives any message.',
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
        name: 'fadeTime',
        title: 'Fade time',
        type: 'text',
        value: '6',
        help: 'Time in seconds for the indicator to fade to gray.',
        save: true
      },
      {
        name: 'label',
        title: 'Label',
        type: 'text',
        value: 'ECG',
        help: 'Label for widget.',
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

    this.lastMsgTime = 0;

    if (this.timer) {
      clearInterval(this.timer);
    }
    this.timer = setInterval(this.updateIndicator.bind(this), 200);

    let label = this.element.querySelector('.label');
    label.innerText = this.getSetting('label');
  }

  onMessageArrived(payload) {
    this.lastMsgTime = new Date().getTime();
    this.updateIndicator();
  }

  updateIndicator() {
    let liveIndicator = this.element.querySelector('.indicator .live');
    let deadIndicator = this.element.querySelector('.indicator .dead');
    let elapsedTime = new Date().getTime() - this.lastMsgTime;
    let ratio = elapsedTime / 1000 / Number(this.getSetting('fadeTime'));
    if (ratio > 1) {
      ratio = 1;
    }

    if (ratio == 1) {
      liveIndicator.classList.add('hide');
      deadIndicator.classList.remove('hide');
    } else {
      liveIndicator.classList.remove('hide');
      deadIndicator.classList.add('hide');
    }

    liveIndicator.style.filter = 'contrast(' + (1 - ratio) + ')';
  }
}

class IotyGraphXY extends IotyWidget {
  constructor() {
    super();
    this.content =
      '<div class="graphXY">' +
        '<canvas width="100" height="100"></canvas>' +
        '<img class="placeholder" src="images/graphXY.png">' +
      '</div>';
    this.options.type = 'graphXY';
    this.widgetName = '#widget-graphXY#';

    let settings = [
      {
        name: 'description',
        title: 'Description',
        type: 'label',
        value: 'The Graph XY widget will draw an XY graph from received data. Data should be in JSON and of the following format.',
        save: false
      },
      {
        name: 'formatExample1',
        title: 'Data Format Example (Points only, using default coordinate system)',
        type: 'label',
        value: '[[x1, y1], [x2, y2], [x3, y3]]',
        save: false
      },
      {
        name: 'formatExample2',
        title: 'Data Format Example (Points only, mix of cartesian and polar coordinates)',
        type: 'label',
        value: '[[x1, y1], [\"point\", [x2, y2]], [\"pointDegree\", [θ1, r1]]]',
        save: false
      },
      {
        name: 'formatExample3',
        title: 'Data Format Example (Points and Lines)',
        type: 'label',
        value: '[[x1, y1], [\"line\", [x1, y1, x2, y2]], [\"lineDegree\", [θ1, r1, θ2, r2]]]',
        save: false
      },
      {
        name: 'dataTopic',
        title: 'Data Topic',
        type: 'text',
        value: '',
        help: 'Publish JSON to this topic for display.',
        save: true
      },
      {
        name: 'minX',
        title: 'Minimum X',
        type: 'text',
        value: '0',
        help: 'Only used for cartesian graphs. Sets the minimum X.',
        save: true
      },
      {
        name: 'width',
        title: 'Width of the Graph',
        type: 'text',
        value: '1000',
        help: 'Used for both cartesian and polar graphs.',
        save: true
      },
      {
        name: 'minY',
        title: 'Minimum Y',
        type: 'text',
        value: '0',
        help: 'Only used for cartesian graphs. Sets the minimum Y.',
        save: true
      },
      {
        name: 'height',
        title: 'Height of the Image',
        type: 'text',
        value: '1000',
        help: 'Used for both cartesian and polar graphs.',
        save: true
      },
      {
        name: 'pointSize',
        title: 'Point Size',
        type: 'text',
        value: '5',
        help: 'Sets the size each drawn point.',
        save: true
      },
      {
        name: 'type',
        title: 'Graph Type',
        type: 'select',
        options: [
          ['Cartesian', 'cartesian'],
          ['Polar (Degree)', 'polarDegree'],
          ['Polar (Radian)', 'polarRadian'],
        ],
        value: 'cartesian',
        help: 'Sets the type of graph',
        save: true
      },
      {
        name: 'axisType',
        title: 'Draw Axis',
        type: 'select',
        options: [
          ['Don\'t Draw', 'none'],
          ['Draw XY (no Grid)', 'drawXY'],
          ['Draw XY (with Grid)', 'drawXYGrid'],
        ],
        value: 'none',
        help: 'Draw axis lines and/or grid.',
        save: true
      },
      {
        name: 'gridSize',
        title: 'Grid Size',
        type: 'text',
        value: '200',
        help: 'Only used when axis type is set to draw grid.',
        save: true
      },
    ];
    this.settings.push(...settings);
  }

  attach(ele) {
    super.attach(ele);

    let canvas = this.element.querySelector('canvas');
    let resizeObserver = new ResizeObserver(this.canvasResizeObserver.bind(this));
    resizeObserver.observe(canvas);
  }

  processSettings() {
    super.processSettings();

    this.minX = Number(this.getSetting('minX'));
    this.minY = Number(this.getSetting('minY'));
    this.width = Number(this.getSetting('width'));
    this.height = Number(this.getSetting('height'));
    this.pointSize = Number(this.getSetting('pointSize'));
    this.type = this.getSetting('type');
    this.axisType = this.getSetting('axisType');
    this.gridSize = Number(this.getSetting('gridSize'));

    this.topics = {};
    for (let topic of ['dataTopic']) {
      this.topics[topic] = this.getSetting(topic);
      if (this.getSetting(topic).trim() != '') {
        this.subscriptions.push(this.getSetting(topic));
      }
    }

    this.canvasResize(this.element.querySelector('canvas'));
  }

  canvasResizeObserver(entries) {
    for (let entry of entries) {
      let canvas = entry.target;
      this.canvasResize(canvas);
    }
  }

  canvasResize(canvas) {
    let imageWidth = this.width;
    let imageHeight = this.height;
    let clientWidth = canvas.clientWidth;
    let clientHeight = canvas.clientHeight;

    if (clientWidth / clientHeight > imageWidth / imageHeight) {
      canvas.width = clientHeight * imageWidth / imageHeight;
      canvas.height = clientHeight;
    } else {
      canvas.width = clientWidth;
      canvas.height = clientWidth * imageHeight / imageWidth
    }
  }

  onMessageArrived(payload, topic) {
    this.onMessageArrivedData(payload);
  }

  canvasX(ctx, x) {
    if (this.type == 'cartesian') {
      x = (x - this.minX) / this.width * ctx.canvas.width;
    } else if (this.type == 'polarDegree' || this.type == 'polarRadian') {
      x = x / this.width * ctx.canvas.width + ctx.canvas.width / 2;
    }

    return x;
  }

  canvasY(ctx, y) {
    if (this.type == 'cartesian') {
      y = (y - this.minY) / this.height * ctx.canvas.height;
    } else if (this.type == 'polarDegree' || this.type == 'polarRadian') {
      y = y / this.height * ctx.canvas.height + ctx.canvas.height / 2;
    }
    y = ctx.canvas.height - y; // flip Y

    return y;
  }

  drawGrid(ctx) {
    const canvas = ctx.canvas;
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgb(200 200 255)";

    if (this.axisType == 'drawXYGrid') {
      if (this.type == 'cartesian') {
        ctx.beginPath();

        let startX = Math.ceil(this.minX / this.gridSize) * this.gridSize
        let endX = this.minX + this.width;
        for (let x = startX; x < endX; x += this.gridSize) {
          let canvasX = this.canvasX(ctx, x);
          ctx.moveTo(canvasX, 0);
          ctx.lineTo(canvasX, canvas.height);
        }
        let startY = Math.ceil(this.minY / this.gridSize) * this.gridSize
        let endY = this.minY + this.height;
        for (let y = startY; y < endY; y += this.gridSize) {
          let canvasY = this.canvasY(ctx, y);
          ctx.moveTo(0, canvasY);
          ctx.lineTo(canvas.width, canvasY);
        }

        ctx.stroke();
      } else if (this.type == 'polarDegree' || this.type == 'polarRadian') {
        ctx.beginPath();

        let maxR = Math.max(this.width, this.height);
        let x = canvas.width / 2;
        let y = canvas.height / 2;
        for (let r = this.gridSize; r < maxR; r += this.gridSize) {
          let canvasR = r / this.width * canvas.width;
          ctx.arc(x, y, canvasR, 0, 2 * Math.PI);
        }

        ctx.stroke();
      }
    }
  }

  drawAxis(ctx) {
    const canvas = ctx.canvas;
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgb(100 100 255)";

    if (this.axisType == 'drawXY' || this.axisType == 'drawXYGrid') {
      let x,y;

      if (this.type == 'cartesian') {
        x = this.canvasX(ctx, 0);
        y = this.canvasY(ctx, 0);
      } else if (this.type == 'polarDegree' || this.type == 'polarRadian') {
        x = canvas.width / 2;
        y = canvas.height / 2;
      }

      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
  }

  drawPoint(ctx, point) {
    ctx.lineWidth = 1;
    ctx.fillStyle = "rgb(255 0 0)";
    const rectSize = this.pointSize;

    let x = this.canvasX(ctx, point[0]) - rectSize / 2;
    let y = this.canvasY(ctx, point[1]) - rectSize / 2;

    ctx.fillRect(x, y, rectSize, rectSize);
  }

  drawPointPolarDegree(ctx, point) {
    this.drawPointPolarRadian(ctx, [point[0] / 180 * Math.PI, point[1]]);
  }

  drawPointPolarRadian(ctx, point) {
    const rectSize = this.pointSize;

    let x = Math.cos(point[0]) * point[1];
    let y = Math.sin(point[0]) * point[1];

    this.drawPoint(ctx, [x, y]);
  }

  drawPointAuto(ctx, xy) {
    if (this.type == 'cartesian') {
      this.drawPoint(ctx, xy);
    } else if (this.type == 'polarDegree') {
      this.drawPointPolarDegree(ctx, xy);
    } else if (this.type == 'polarRadian') {
      this.drawPointPolarRadian(ctx, xy);
    }
  }

  drawLinePolarDegree(ctx, pos) {
    this.drawLinePolarRadian(ctx, [pos[0] / 180 * Math.PI, pos[1], pos[2] / 180 * Math.PI, pos[3]])
  }

  drawLinePolarRadian(ctx, pos) {
    let x1 =  Math.cos(pos[0]) * pos[1];
    let y1 =  Math.sin(pos[0]) * pos[1];
    let x2 =  Math.cos(pos[2]) * pos[3];
    let y2 =  Math.sin(pos[2]) * pos[3];

    this.drawLine(ctx, [x1, y1, x2, y2])
  }

  drawLine(ctx, pos) {
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgb(0 255 0)";

    ctx.beginPath();
    ctx.moveTo(this.canvasX(ctx, pos[0]), this.canvasY(ctx, pos[1]));
    ctx.lineTo(this.canvasX(ctx, pos[2]), this.canvasY(ctx, pos[3]));
    ctx.stroke();
  }

  drawCommand(ctx, command) {
    if (command[0] == 'line') {
      this.drawLine(ctx, command[1]);
    } else if (command[0] == 'lineDegree') {
      this.drawLinePolarDegree(ctx, command[1]);
    } else if (command[0] == 'lineRadian') {
      this.drawLinePolarRadian(ctx, command[1]);
    } else if (command[0] == 'point') {
      this.drawPoint(ctx, command[1]);
    } else if (command[0] == 'pointDegree') {
      this.drawPointPolarDegree(ctx, command[1]);
    } else if (command[0] == 'pointRadian') {
      this.drawPointPolarRadian(ctx, command[1]);
    } else {
      this.drawPointAuto(ctx, command);
    }
  }

  onMessageArrivedData(payload) {
    let canvas = this.element.querySelector('canvas');
    let ctx = canvas.getContext("2d");

    let commands = JSON.parse(payload);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    this.drawGrid(ctx);
    this.drawAxis(ctx);

    for (let command of commands) {
      this.drawCommand(ctx, command);
    }
  }
}

class IotyObjectDetector extends IotyWidget {
  constructor() {
    super();
    this.content =
      '<div class="objectDetector">' +
        '<div class="wrapper"></div><div class="results"></div>' +
        '<img class="placeholder" src="images/objectDetector.jpg">' +
        '<video autoplay playsinline></video>' +
      '</div>';
    this.options.type = 'objectDetector';
    this.widgetName = '#widget-objectDetector#';

    let settings = [
      {
        name: 'description',
        title: 'Description',
        type: 'label',
        value: 'The object detector widget will perform object detection on the camera images every 0.5s, then publish the results.',
        save: false
      },
      {
        name: 'objectList',
        title: 'Trained Classes',
        type: 'html',
        value:
        '<p>Object detector can detect 80 different objects. See <a href="https://github.com/amikelive/coco-labels/blob/master/coco-labels-2014_2017.txt" target="_blank">list of available classes</a>.</p>',
        save: false
      },
      {
        name: 'cameraIndex',
        title: 'Camera Selection',
        type: 'text',
        value: '0',
        help: 'Determines which camera is used. 0 will be the first camera, 1 will be second camera, etc.',
        save: true
      },
      {
        name: 'topic',
        title: 'MQTT Topic',
        type: 'text',
        value: '',
        help: 'Results of image detection will be published to this topic.',
        save: true
      },
      {
        name: 'resultsGuide',
        title: 'Results Format',
        type: 'html',
        value:
        '<p>Results is a list in JSON format. Each item in the list contains:</p>' +
        '<ul>' +
          '<li>name: (string) Name of the class</li>' +
          '<li>score: (float) Confidence level of the detection</li>' +
          '<li>x, y, w, h: (int) Bounding box</li>' +
        '</ul>',
        save: false
      },
    ];
    this.settings.push(...settings);
  }

  async getVideoDevice() {
    let index = 0;
    try {
      index = Number(this.getSetting('cameraIndex'))
    } finally {
    }

    let devices = await navigator.mediaDevices.enumerateDevices();
    let videoDevices = [];
    for (let device of devices) {
      if (device.kind == 'videoinput') {
        videoDevices.push(device.deviceId);
      }
    }

    if (index < videoDevices.length) {
      return { deviceId: videoDevices[index] };
    } else {
      return true;
    }
  }

  async setupCamera() {
    let video = this.element.querySelector('video');

    if (video.srcObject) {
      for (let track of video.srcObject.getTracks()) {
        track.stop();
      }
    }

    const constraints = {
      video: await this.getVideoDevice()
    };
    navigator.mediaDevices
      .getUserMedia(constraints)
      .then(function (stream) {
        video.srcObject = stream;
      });
  }

  async attach(ele) {
    super.attach(ele);
    this.setupCamera();
    this.intervalID = setInterval(this.detectObject.bind(this), 500);
  }

  processSettings() {
    super.processSettings();
    this.setupCamera();
  }

  async detectObject() {
    if (main.mode == main.MODE_RUN) {
      let vid = this.element.querySelector('video');
      let results = await window.detectObjectVideo(vid);
      if (results) {
        main.publish(this.getSetting('topic'), JSON.stringify(results));
        this.highlightResults(results);
      }
    }
  }

  highlightResults(results) {
    let vid = this.element.querySelector('video');
    let div = this.element.querySelector('.objectDetector');
    div.querySelectorAll('.highlight').forEach(element => element.remove());

    for (let result of results) {
      let p = document.createElement('p');
      p.innerText = result.name;
      p.style.left = vid.offsetLeft + (result.x / vid.videoWidth * vid.offsetWidth) + 'px';
      p.style.top = vid.offsetTop + (result.y / vid.videoHeight * vid.offsetHeight) + 'px';
      p.style.width = (result.w / vid.videoWidth * vid.offsetWidth) + 'px';
      p.style.height = (result.h / vid.videoHeight * vid.offsetHeight) + 'px';
      p.classList.add('highlight');
      div.append(p);
    }
  }
}

class IotyRemoteObjectDetector extends IotyWidget {
  constructor() {
    super();
    this.content =
      '<div class="remoteObjectDetector">' +
        '<img src="images/objectDetector.jpg">' +
        '<img class="hide" src="">' +
      '</div>';
    this.options.type = 'remoteObjectDetector';
    this.widgetName = '#widget-remoteObjectDetector#';

    let settings = [
      {
        name: 'description',
        title: 'Description',
        type: 'label',
        value: 'The object detector widget will receive image data, perform object detection on it, then publish the results.',
        save: false
      },
      {
        name: 'objectList',
        title: 'Trained Classes',
        type: 'html',
        value:
        '<p>Object detector can detect 80 different objects. See <a href="https://github.com/amikelive/coco-labels/blob/master/coco-labels-2014_2017.txt" target="_blank">list of available classes</a>.</p>',
        save: false
      },
      {
        name: 'dataTopic',
        title: 'Data Topic',
        type: 'text',
        value: '',
        help: 'Publish image data to this topic. Images can be in any format supported by the browser.',
        save: true
      },
      {
        name: 'resultsTopic',
        title: 'Results Topic',
        type: 'text',
        value: '',
        help: 'Results of image detection will be published to this topic.',
        save: true
      },
      {
        name: 'resultsGuide',
        title: 'Results Format',
        type: 'html',
        value:
        '<p>Results is a list in JSON format. Each item in the list contains:</p>' +
        '<ul>' +
          '<li>name: (string) Name of the class</li>' +
          '<li>score: (float) Confidence level of the detection</li>' +
          '<li>x, y, w, h: (int) Bounding box</li>' +
        '</ul>',
        save: false
      },
    ];
    this.settings.push(...settings);
  }

  attach(ele) {
    super.attach(ele);
  }

  processSettings() {
    super.processSettings();

    this.bytesSubscriptions.push(this.getSetting('dataTopic'));
  }

  onMessageArrived(payload, topic) {
    let image = this.element.querySelector('img.hide');
    image.onload = this.detectObject.bind(this);
    image.src = URL.createObjectURL(
      new Blob([payload])
    );
    this.flashIndicator()
  }

  async detectObject() {
    let image = this.element.querySelector('img.hide');
    let result = await window.detectObjectImage(image);
    if (result) {
      main.publish(this.getSetting('resultsTopic'), JSON.stringify(result));
    }
  }

  flashIndicator() {
    let indicator = this.element.querySelector('img:not(.hide)');
    indicator.classList.add('flash');
    setTimeout(function(){
      indicator.classList.remove('flash');
    }, 200);
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
  { type: 'direction', widgetClass: IotyDirection},
  { type: 'heartbeat', widgetClass: IotyHeartbeat},
  { type: 'ecg', widgetClass: IotyECG},
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
  { type: 'rawImage', widgetClass: IotyRawImage},
  { type: 'map', widgetClass: IotyMap},
  { type: 'tts', widgetClass: IotyTTS},
  { type: 'speech', widgetClass: IotySpeech},
  { type: 'chart', widgetClass: IotyChart},
  { type: 'imageTM', widgetClass: IotyImageTM},
  { type: 'remoteImageTM', widgetClass: IotyRemoteImageTM},
  { type: 'objectDetector', widgetClass: IotyObjectDetector},
  { type: 'remoteObjectDetector', widgetClass: IotyRemoteObjectDetector},
  { type: 'graphXY', widgetClass: IotyGraphXY},
];

// Helper function to attach widget to element
async function attachIotyWidget(ele) {
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

  if (widget.attach.constructor.name == 'AsyncFunction') {
    await widget.attach(ele);
  } else {
    widget.attach(ele);
  }
  ele.widget = widget;
  widget.removePlaceholder();
}