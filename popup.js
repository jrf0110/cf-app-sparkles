function App(options) {
  options = options || {}
  options.props = options.props || {}
  this.options = options
  this.window = options.window
  this.props = options.props
}

App.prototype.render = function() {
  var props = this.props

  return [
    '<div class="sparkle-popup">',
    '  <div class="form-controls">',
    '    <div class="form-control">',
    '      <label>Mode</label>',
    '      <div class="form-control-input">',
    '        <select name="mode">',
    '          <option value="trail"' + (props.mode === "trail" ? ' selected' : '') + '>Trail</option>',
    '          <option value="follow"' + (props.mode === "follow" ? ' selected' : '') + '>Follow</option>',
    '        </select>',
    '      </div>',
    '    </div>',
    '    <div class="form-control">',
    '      <label>Number of Sparkles</label>',
    '      <div class="form-control-input">',
    '        <input name="numSparkles" type="range" value="' + props.numSparkles + '" min="0" max="100" />',
    '      </div>',
    '    </div>',
    '    <div class="form-control">',
    '      <label>Enabled</label>',
    '      <div class="form-control-input">',
    '        <input type="checkbox" name="disabled"' + (!props.disabled ? ' checked' : '') + '>',
    '      </div>',
    '    </div>',
    '  </div>',
    '</div>',
  ].join('\n')
}

App.prototype.addEvents = function(el) {
  el.addEventListener('change', function(e) {
    e.preventDefault()
    var data = {}
    data[e.target.name] = AppModel.fieldFormMap[e.target.name](e)
    console.log('syncing', data, e.target.checked)
    chrome.storage.sync.set(data)
  })
}

function AppModel(props) {
  this.mode = 'trail'
  this.disabled = false
  this.numSparkles = 20

  for (var key in props) {
    this[key] = props[key]
  }
}

AppModel.fieldFormMap = {
  mode: function(e) { return e.target.value },
  disabled: function(e) { return !e.target.checked },
  numSparkles: function(e) { return +e.target.value },
}

var model = new AppModel()
var app = new App({ window: window, props: model })

function render(el) {
  el.innerHTML = app.render()
  app.addEvents(el)
}

document.addEventListener('DOMContentLoaded', function() {
  var $app = document.getElementById('app')

  chrome.storage.sync.get(null, function(result) {
    app.props = new AppModel(result)
    console.log('using', result, app.props)
    render($app)
  })
})