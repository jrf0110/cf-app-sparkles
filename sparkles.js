(function(exports){
  var requestAnimationFrame = window.requestAnimationFrame
    || window.mozRequestAnimationFrame
    || window.ieRequestAnimationFrame
    || window.webkitRequestAnimationFrame

  function domready(win, callback, force) {
    const rs = win.document.readyState
    const doScroll = win.document.documentElement['doScroll']

    if (win.parent !== win) force = true

    if (force || (doScroll ? /^loaded|^c/ : /^loaded|^i|^c/).test(rs)) {
      win.setTimeout(function(){ callback() }, 0)
    } else {
      win.document.addEventListener('DOMContentLoaded', function(){ callback() })
    }
  }

  function normalize(x, MIN, MAX) {
    return (x - MIN) / (MAX - MIN)
  }

  function denormalize(x, MIN, MAX) {
    return x * (MAX - MIN) + MIN
  }

  function getRandomFloat(min, max) {
    return Math.random() * (max - min) + min
  }

  function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min)
  }

  function CursorSparkler(options) {
    options = options || {}
    options.mode = options.mode || CursorSparkler.modes.trail
    options.numSparkles = options.numSparkles || 20
    options.sparkleFactor = 1
    options.sparkleDurationRange = [50, 500]
    options.sparkleDistanceRange = [40, 100]
    options.sparkleSizeRange = [1, 5]
    this.options = options
    this.window = options.window
    this.el = this.window.document.createElement('div')
    this.el.style.position = 'absolute'
    this.el.style.top = '-1px'
    this.el.style.left = '-1px'
    this.el.style.zIndex = 10000
    this.el.style.pointerEvents = 'none'
    this.el.style.width = '1px'
    this.el.style.height = '1px'
    this.x = 0
    this.y = 0
    this.shouldAnimate = true
    this.sparkles = []
    this.onMouseMove = this.onMouseMove.bind(this)
    this.onMouseDown = this.onMouseDown.bind(this)
    this.onMouseUp = this.onMouseUp.bind(this)
    this.onAnimationFrame = this.onAnimationFrame.bind(this)
  }

  CursorSparkler.modes = { follow: 'follow', trail: 'trail' }
  CursorSparkler.TranslateZero = 'translate3d(0, 0, 0)'

  CursorSparkler.prototype.listen = function() {
    this.window.addEventListener('mousemove', this.onMouseMove)
    this.window.addEventListener('mousedown', this.onMouseDown)
    this.window.addEventListener('mouseup', this.onMouseUp)
    this.window.document.body.appendChild(this.el)
    requestAnimationFrame(this.onAnimationFrame)
  }

  CursorSparkler.prototype.destroy = function() {
    this.el.parentElement.removeChild(this.el)
    this.window.removeEventListener('mousemove', this.onMouseMove)
    this.shouldAnimate = false
  }

  CursorSparkler.prototype.render = function(time) {
    if (this.options.disabled) {
      if (this.el.style.display !== 'none') this.el.style.display = 'none'
      return
    } else {
      if (this.el.style.display !== 'block') this.el.style.display = 'block'
    }

    if (this.options.mode === CursorSparkler.modes.follow) {
      this.el.style.transform = 'translate3d(' + this.x + 'px, ' + this.y + 'px, 0)'
    } else {
      if (this.el.style.transform !== CursorSparkler.TranslateZero) {
        this.el.style.transform = CursorSparkler.TranslateZero
      }
    }

    var numSparkles = this.options.numSparkles

    if (this.sparkles.length > numSparkles) {
      this.sparkles.slice(numSparkles).forEach(function(sparkle) {
        sparkle.destroy()
      })

      this.sparkles.length = numSparkles
    }

    for (var i = 0, sparkle; i < numSparkles; i++) {
      sparkle = this.sparkles[i]

      if (!sparkle) {
        this.sparkles[i] = this.sparkle(time + getRandomInt(0, (800 / this.options.sparkleFactor)))

        this.el.appendChild(this.sparkles[i].el)

        continue
      }

      sparkle.render(time)

      if (time >= sparkle.options.startTime + sparkle.options.duration) {
        sparkle.destroy()
        this.sparkles[i] = this.sparkle(time + 100)
        this.el.appendChild(this.sparkles[i].el)
      }
    }
  }

  CursorSparkler.prototype.sparkle = function(startTime) {
    var options = this.options
    var sf = options.sparkleFactor
    var sDuration = options.sparkleDurationRange
    var sDistance = options.sparkleDistanceRange
    var sSize = options.sparkleSizeRange

    return new Sparkle({
      window: this.window,
      startTime: startTime,
      startX: options.mode === CursorSparkler.modes.trail ? this.x : 0,
      startY: options.mode === CursorSparkler.modes.trail ? this.y : 0,
      duration: getRandomInt(sDuration[0], sDuration[1] / sf),
      distance: getRandomInt(sDistance[0], sDistance[1] * (sf === 1 ? 1 : sf / 4)),
      size: getRandomInt(sSize[0], sSize[1] * (sf === 1 ? 1 : sf / 3))
    })
  }

  CursorSparkler.prototype.onMouseMove = function(e) {
    this.x = e.pageX
    this.y = e.pageY
  }

  CursorSparkler.prototype.onMouseDown = function(e) {
    if (!this.originalSparkleFactor) {
      this.originalSparkleFactor = this.options.sparkleFactor
    } else {
      this.options.sparkleFactor = this.originalSparkleFactor
    }

    this.options.sparkleFactor *= 4
  }

  CursorSparkler.prototype.onMouseUp = function(e) {
    this.options.sparkleFactor = this.originalSparkleFactor || 1
    delete this.originalSparkleFactor
  }

  CursorSparkler.prototype.onAnimationFrame = function(time) {
    if (!this.shouldAnimate) return
    if (!this.start) this.start = time
    this.render(time)
    requestAnimationFrame(this.onAnimationFrame)
  }

  function Sparkle(options) {
    options = options || {}
    options.duration = options.duration || getRandomInt(50, 500)
    options.direction = options.direction || getRandomFloat(0, Math.PI * 2)
    options.distance = options.distance || getRandomInt(40, 100)
    options.size = options.size || getRandomInt(1, 5)
    options.color = options.color || Sparkle.getFantasticColor()
    options.startTime = options.startTime || 0

    this.options = options
    this.window = options.window

    this.el = this.window.document.createElement('div')
    this.el.style.position = 'absolute'
    this.el.style.background = this.options.color
    this.el.style.width = this.options.size + 'px'
    this.el.style.height = this.options.size + 'px'
    this.el.style.borderRadius = this.options.size + 'px'
    this.el.style.transform = 'translate3d(0,0,0)'
  }

  Sparkle.fantasticColors = [
    'yellow', 'pink', 'red', 'orange', 'purple', 'cyan'
  ]

  Sparkle.getFantasticColor = function() {
    return Sparkle.fantasticColors[~~(Sparkle.fantasticColors.length * Math.random())]
  }

  Sparkle.prototype.destroy = function() {
    this.el.parentElement.removeChild(this.el)
  }

  Sparkle.prototype.render = function(time) {
    var step = normalize(time, this.options.startTime, this.options.startTime + this.options.duration)
    var x = this.options.startX + Math.sin(this.options.direction) * this.options.distance * step
    var y = this.options.startY + Math.cos(this.options.direction) * this.options.distance * step
    this.el.style.opacity = 1 - step
    this.el.style.transform = 'translate3d(' + x + 'px, ' + y + 'px, 0)'
  }

  exports.CursorSparkler = CursorSparkler  
  exports.Sparkle = Sparkle  
  exports.domready = domready

  if ('chrome' in window && window.chrome.storage) {
    return chrome.storage.sync.get(null, function(storage) {
      var options = { window: window }

      for (var key in storage) {
        options[key] = storage[key]
      }

      var sparkler = exports.sparkler = new CursorSparkler(options)

      domready(window, function() {
        sparkler.listen()
      })

      chrome.storage.onChanged.addListener(function(changes, namespace) {
        for (key in changes) {
          var storageChange = changes[key];
          console.log('setting', key, storageChange.newValue)
          sparkler.options[key] = storageChange.newValue
        }
      })
    })
  } else {
    var sparkler = exports.sparkler = new CursorSparkler({
      window: window
    })

    domready(window, function() {
      sparkler.listen()
    })
  }


})(window.cfAppSparkle = {})