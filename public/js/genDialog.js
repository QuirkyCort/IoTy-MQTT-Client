var genDialog = new function() {

  this.title = function(setting) {
    let $title = $('<div class="configurationTitle"></div>');
    let $toolTip = $('<span> </span><div class="tooltip right">?<div class="tooltiptext"></div></div>');
    $title.text(setting.title);

    if (setting.help) {
      $toolTip.find('.tooltiptext').text(setting.help);
      $title.append($toolTip);
    }

    return $title;
  };

  this.text = function(setting) {
    let $div = $('<div class="configuration"></div>');
    let $textBox = $('<div class="text"><input type="text"></div>');
    let $input = $textBox.find('input');
    $input.val(setting.value);

    $div.append(this.title(setting));
    $div.append($textBox);

    return $div;
  };

}