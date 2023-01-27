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
        } else if (setting.type == 'check') {
          obj = genDialog.check(setting);
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
  }

  onMessageArrived(payload) {
  }

  disableEvent(evt) {
    evt.preventDefault();
    evt.stopImmediatePropagation();
    return false;
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
        value: 'The label widget is only used for displaying text. It does not send or receives any messages.',
        save: false
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
    let label = this.element.querySelector('.label');
    label.innerText = this.getSetting('label');
  }
}

class IotyButton extends IotyWidget {
  constructor() {
    super();
    this.content = '<div class="button"><div>Btn</div></div>'
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
        name: 'press',
        title: 'Send on Press',
        type: 'text',
        value: '1',
        help: 'This value will be published when the button is pressed.',
        save: true
      },
      {
        name: 'release',
        title: 'Send on Release',
        type: 'text',
        value: '0',
        help: 'This value will be published when the button is released.',
        save: true
      },
      {
        name: 'label',
        title: 'Label',
        type: 'text',
        value: 'Btn',
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
        value: '1',
        help: 'This value will be published when the switch is on.',
        save: true
      },
      {
        name: 'off',
        title: 'Send on Off',
        type: 'text',
        value: '0',
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
        name: 'label',
        title: 'Label',
        type: 'text',
        value: 'Switch',
        help: 'Text above the slider.',
        save: true
      },
    ];
    this.settings.push(...settings);
  }

  attach(ele) {
    super.attach(ele);
    let input = ele.querySelector('input');
    input.addEventListener('input', this.change.bind(this));
  }

  processSettings() {
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

  change(evt) {
    if (main.mode == main.MODE_RUN) {
      let value = this.element.querySelector('.value');
      let input = this.element.querySelector('input');

      value.innerText = input.value;
      main.publish(this.getSetting('topic'), input.value);
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
    this.subscriptions.push(this.getSetting('topic'));
  }

  onMessageArrived(payload) {
    let display = this.element.querySelector('.display');
    display.innerText = payload;
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
        '<progress value="0.5" max="1"></progress>' +
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
    this.subscriptions.push(this.getSetting('topic'));

    let label = this.element.querySelector('.label');
    label.innerText = this.getSetting('label');

    let progress = this.element.querySelector('progress');

  }

  onMessageArrived(payload) {
    let value = this.element.querySelector('.value');
    value.innerText = payload;

    let pos = (Number(payload) - Number(this.getSetting('min'))) / Number(this.getSetting('max'));

    let progress = this.element.querySelector('progress');
    progress.value = pos;
  }
}

class IotyColor extends IotyWidget {
  constructor() {
    super();
    this.content =
      '<div class="color">' +
        '<img src="images/hsv.jpg" draggable="false">' +
        '<div class="selector"></div>' +
        '<div class="label">Color</div>' +
        '<input type="range" value="255" max="255">' +
      '</div>';
    this.options.type = 'color';
    this.widgetName = '#widget-color#';
    this.hsv = [0,0,255];

    let settings = [
      {
        name: 'description',
        title: 'Description',
        type: 'label',
        value: 'The color widget will publish its RGB values (comma separated float) to the specified topic when changed.',
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
        name: 'label',
        title: 'Label',
        type: 'text',
        value: 'Color',
        help: 'Text above the widget.',
        save: true
      },
    ];
    this.settings.push(...settings);
  }

  attach(ele) {
    super.attach(ele);
    let input = ele.querySelector('input');
    input.addEventListener('input', this.change.bind(this));

    let img = ele.querySelector('img');
    img.addEventListener('dragstart', function() { return false; })
    img.addEventListener('pointerdown', this.pointerdown.bind(this));
    img.addEventListener('pointermove', this.pointermove.bind(this));
    img.addEventListener('contextmenu', this.disableEvent);
  }

  processSettings() {
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
      this.publish(rgb);
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

  change(evt) {
    if (main.mode == main.MODE_RUN) {
      let input = this.element.querySelector('input');
      this.hsv[2] = Number(input.value);
      let rgb = this.hsv2rgb(this.hsv);
      this.publish(rgb);
    }
  }

  publish(rgb) {
    let payload = rgb[0] + ',' + rgb[1] + ',' + rgb[2];
    main.publish(this.getSetting('topic'), payload);
  }

}

class IotyColor3 extends IotyColor {
  constructor() {
    super();
    this.options.type = 'color3';
    this.widgetName = '#widget-color3#';

    this.settings = [
      {
        name: 'description',
        title: 'Description',
        type: 'label',
        value: 'The color 3 widget will publish its RGB values to separate topics when changed.',
        save: false
      },
      {
        name: 'topicR',
        title: 'MQTT Topic for Red',
        type: 'text',
        value: '',
        help: 'Topic to publish to.',
        save: true
      },
      {
        name: 'topicG',
        title: 'MQTT Topic for Green',
        type: 'text',
        value: '',
        help: 'Topic to publish to.',
        save: true
      },
      {
        name: 'topicB',
        title: 'MQTT Topic for Blue',
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
        name: 'label',
        title: 'Label',
        type: 'text',
        value: 'Color',
        help: 'Text above the widget.',
        save: true
      },
    ];
  }

  publish(rgb) {
    main.publish(this.getSetting('topicR'), String(rgb[0]));
    main.publish(this.getSetting('topicG'), String(rgb[1]));
    main.publish(this.getSetting('topicB'), String(rgb[2]));
  }

}

class IotyNotification extends IotyWidget {
  constructor() {
    super();
    this.content = '<div class="notification"><div class="indicator"></div></div>'
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
        value: 'Notification',
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
    let indicator = this.element.querySelector('.indicator');
    indicator.innerText = this.getSetting('label');

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

IOTY_WIDGETS = [
  { type: 'button', widgetClass: IotyButton},
  { type: 'switch', widgetClass: IotySwitch},
  { type: 'hSlider', widgetClass: IotyHSlider},
  { type: 'color', widgetClass: IotyColor},
  { type: 'color3', widgetClass: IotyColor3},
  { type: 'label', widgetClass: IotyLabel},
  { type: 'display', widgetClass: IotyDisplay},
  { type: 'hBar', widgetClass: IotyHBar},
  { type: 'notification', widgetClass: IotyNotification},
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
}