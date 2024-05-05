let MSGS = {
  '#main-connect#': {
    en: 'Connect',
  },
  '#main-download#': {
    en: 'Download to device',
  },
  '#main-erase#': {
    en: 'Erase device',
  },
  '#main-changeName#': {
    en: 'Change device name',
  },
  '#main-updateFirmware#': {
    en: 'Update Firmware',
  },
  '#main-disconnect#': {
    en: 'Disconnect',
  },
  '#main-get_link#': {
    en: 'Get Link',
  },
  '#widget-settings#': {
    en: 'Settings',
  },
  '#widget-label#': {
    en: 'Label',
  },
  '#widget-button#': {
    en: 'Button',
  },
  '#widget-switch#': {
    en: 'Switch',
  },
  '#widget-hSlider#': {
    en: 'Horizontal Slider',
  },
  '#widget-vSlider#': {
    en: 'Vertical Slider',
  },
  '#widget-text#': {
    en: 'Text',
  },
  '#widget-select#': {
    en: 'Select',
  },
  '#widget-display#': {
    en: 'Display',
  },
  '#widget-status#': {
    en: 'Status',
  },
  '#widget-hBar#': {
    en: 'H-Bar Gauge',
  },
  '#widget-vBar#': {
    en: 'V-Bar Gauge',
  },
  '#widget-color#': {
    en: 'Color',
  },
  '#widget-notification#': {
    en: 'Notification',
  },
  '#widget-joy#': {
    en: 'Joystick',
  },
  '#widget-video#': {
    en: 'Video',
  },
  '#widget-audio#': {
    en: 'Audio',
  },
  '#widget-image#': {
    en: 'Image',
  },
  '#widget-map#': {
    en: 'Map',
  },
  '#widget-tts#': {
    en: 'TTS',
  },
  '#widget-speech#': {
    en: 'Speech',
  },
  '#widget-chart#': {
    en: 'Chart',
  },
  '#widget-gauge#': {
    en: 'Radial Gauge',
  },
  '#widget-imageTM#': {
    en: 'Teachable Machine (Image)',
  },
  '#widget-heartbeat#': {
    en: 'Heartbeat',
  },
};
let MSGS_KEYS = Object.keys(MSGS);

let LANG = localStorage.getItem('LANG');
if (!LANG || LANG == '' || LANG == 'undefined') {
  LANG = 'en';
}

const RTL_LANGS = ['he'];
let RTL = false;
if (RTL_LANGS.indexOf(LANG) != -1) {
  RTL = true;
}

var i18n = new function() {
  var self = this;

  // Append to messages
  this.append = function(msgs) {
    MSGS = Object.assign(MSGS, msgs);
    MSGS_KEYS = Object.keys(MSGS);
  };

  // Get a single string
  this.get = function(requestedKey) {
    let messages = MSGS[requestedKey];
    if (typeof messages == 'undefined') {
      return requestedKey;
    }
    let message = messages[LANG]
    if (typeof message == 'undefined') {
      if (typeof messages['en'] == 'undefined') {
        return requestedKey;
      } else {
        return messages['en'];
      }
    }
    return message;
  };

  // Change all keys in provided string
  this.replace = function(input) {
    let regEx = '';
    for (let key of MSGS_KEYS) {
      regEx += key + '|';
    }
    regEx = regEx.slice(0, regEx.length - 1);
    regEx = new RegExp(regEx, 'g');
    return input.replace(regEx, function(key){
      return self.get(key);
    })
  }
}