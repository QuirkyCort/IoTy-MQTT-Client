var genDialog = new function() {

  this.title = function(setting) {
    let $title = $('<div class="configurationTitle"></div>');
    let $toolTip = $('<span> </span><div class="tooltip right">?<div class="tooltiptext"></div></div>');
    $title.text(setting.title);

    if (setting.help) {
      $toolTip.find('.tooltiptext').text(setting.help);
      $title.append($toolTip);
    }

    let obj = {
      ele: $title,
      value: []
    }

    return obj;
  };

  this.label = function(setting) {
    let $div = $('<div class="configuration"></div>');
    let $textBox = $('<div class="label"></div>');
    $textBox.text(setting.value);

    $div.append(this.title(setting).ele);
    $div.append($textBox);

    let obj = {
      ele: $div,
      values: []
    }

    return obj;
  };

  this.html = function(setting) {
    let $div = $('<div class="configuration"></div>');
    let $textBox = $('<div class="label"></div>');
    $textBox.html(setting.value);

    $div.append(this.title(setting).ele);
    $div.append($textBox);

    let obj = {
      ele: $div,
      values: []
    }

    return obj;
  };

  this.text = function(setting) {
    let $div = $('<div class="configuration"></div>');
    let $textBox = $('<div class="text"><input type="text"></div>');
    let $input = $textBox.find('input');
    $input.val(setting.value);

    $div.append(this.title(setting).ele);
    $div.append($textBox);

    let obj = {
      ele: $div,
      values: [
        {
          name: setting.name,
          ele: $input[0]
        }
      ]
    }

    return obj;
  };

  this.textarea = function(setting) {
    let $div = $('<div class="configuration"></div>');
    let $textBox = $('<div class="textarea"><textarea rows="4"></div>');
    let $input = $textBox.find('textarea');
    $input.val(setting.value);

    $div.append(this.title(setting).ele);
    $div.append($textBox);

    let obj = {
      ele: $div,
      values: [
        {
          name: setting.name,
          ele: $input[0]
        }
      ]
    }

    return obj;
  };

  this.check = function(setting) {
    let $div = $('<div class="configuration"></div>');
    let $checkBox = $('<div class="check"><input type="checkbox"></div>');
    let $input = $checkBox.find('input');

    if (setting.value == 'true') {
      $input[0].checked = true;
    }
    $input.val(setting.value);

    $input[0].addEventListener('change', function(e) {
      e.target.value = e.target.checked;
    });

    $div.append(this.title(setting).ele);
    $div.append($checkBox);

    let obj = {
      ele: $div,
      values: [
        {
          name: setting.name,
          ele: $input[0]
        }
      ]
    }

    return obj;
  };

}