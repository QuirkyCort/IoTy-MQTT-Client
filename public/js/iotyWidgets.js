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
    ele.addEventListener('pointerdown', this.settingsDialog.bind(this));
  }

  settingsDialog() {
    if (main.mode == 'edit') {
      function getTitle(setting) {
        let $title = $('<div class="configurationTitle"></div>');
        let $toolTip = $('<span> </span><div class="tooltip right">?<div class="tooltiptext"></div></div>');
        $title.text(setting.title);

        if (setting.help) {
          $toolTip.find('.tooltiptext').text(setting.help);
          $title.append($toolTip);
        }

        return $title;
      }

      function genText(setting) {
        let $div = $('<div class="configuration"></div>');
        let $textBox = $('<div class="text"><input type="text"></div>');
        let $input = $textBox.find('input');
        $input.val(setting.value);

        $div.append(getTitle(setting));
        $div.append($textBox);

        return $div;
      }

      let $body = $('<div class="settings"></div>');

      for (let setting of this.settings) {
        if (setting.type == 'text') {
          $body.append(genText(setting));
        }
      }

      let $buttons = $(
        '<button type="button" class="cancel btn-light">Cancel</button>' +
        '<button type="button" class="confirm btn-success">Ok</button>'
      );

      let $dialog = dialog(i18n.replace(this.widgetName + ' #widget-settings#'), $body, $buttons);

      $buttons.siblings('.cancel').click(function() { $dialog.close(); });
      $buttons.siblings('.confirm').click(function(){
        $dialog.close();
      });
    }
  }
}

class IotyButton extends IotyWidget {
  constructor() {
    super();
    this.content = '<div class="button"><div class="text">BTN</div></div>'
    this.options.type = 'button';
    this.widgetName = '#widget-button#';

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