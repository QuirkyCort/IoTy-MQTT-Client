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

}