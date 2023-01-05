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
  '#widget-settings#': {
    en: 'Settings',
  },
  '#widget-button#': {
    en: 'Button',
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