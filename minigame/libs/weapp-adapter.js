// 这是一个 weapp-adapter 模拟，用于 Phaser 3
// 尽可能覆盖 Phaser 3 所需的浏览器 API

// 尝试获取 window，如果不存在则使用 GameGlobal
var _window = (typeof window !== 'undefined') ? window : GameGlobal;

// 如果 window 不存在，尝试将 GameGlobal 赋值给 window
if (typeof window === 'undefined') {
    try {
        GameGlobal.window = GameGlobal;
    } catch (e) {
        console.warn('Unable to set GameGlobal.window', e);
    }
}

// 辅助函数：安全地设置全局属性
function setGlobalProperty(key, value) {
    // 1. 尝试直接赋值给 _window
    try {
        _window[key] = value;
    } catch (e) {
        // 2. 如果失败，尝试使用 Object.defineProperty
        try {
            Object.defineProperty(_window, key, {
                value: value,
                writable: true,
                configurable: true
            });
        } catch (e2) {
            // console.warn('Failed to defineProperty _window.' + key, e2);
        }
    }

    // 3. 确保 GameGlobal 上也有该属性
    if (_window !== GameGlobal) {
        try {
            GameGlobal[key] = value;
        } catch (e) {
            // console.warn('Failed to set GameGlobal.' + key, e);
        }
    }
}

// 辅助函数：安全地扩展对象属性
function extendProperty(obj, key, value) {
    try {
        obj[key] = value;
    } catch (e) {
        try {
            Object.defineProperty(obj, key, {
                value: value,
                writable: true,
                configurable: true
            });
        } catch (e2) {
            console.warn('Failed to extend property ' + key, e2);
        }
    }
}

// 基础属性
setGlobalProperty('innerWidth', GameGlobal.innerWidth || 0);
setGlobalProperty('innerHeight', GameGlobal.innerHeight || 0);
setGlobalProperty('devicePixelRatio', GameGlobal.devicePixelRatio || 1);
setGlobalProperty('screen', _window.screen || { availWidth: GameGlobal.innerWidth || 0, availHeight: GameGlobal.innerHeight || 0 });

// 模拟 document
var doc = _window.document || {};

// 增强 document 对象
if (!doc.createElement) {
    extendProperty(doc, 'createElement', function(tagName) {
        tagName = tagName.toLowerCase();
        if (tagName === 'canvas') {
            return GameGlobal.canvas || wx.createCanvas();
        } else if (tagName === 'img') {
            return wx.createImage();
        } else if (tagName === 'video') {
            return {
                style: {},
                play: function(){},
                pause: function(){},
                canPlayType: function(){ return ''; },
                addEventListener: function(){},
                removeEventListener: function(){}
            };
        } else if (tagName === 'audio') {
             var audio = wx.createInnerAudioContext();
             audio.style = {};
             audio.play = audio.play;
             audio.pause = audio.pause;
             audio.canPlayType = function(){ return ''; };
             audio.addEventListener = function(){}; 
             return audio;
        }
        return {
            style: {},
            getBoundingClientRect: function() { return { width: 0, height: 0, top: 0, left: 0 }; },
            addEventListener: function(){},
            removeEventListener: function(){}
        };
    });
}

if (!doc.getElementById) {
    extendProperty(doc, 'getElementById', function(id) { return null; });
}

if (!doc.getElementsByTagName) {
    extendProperty(doc, 'getElementsByTagName', function(tagName) { return []; });
}

if (!doc.body) {
    extendProperty(doc, 'body', {
        appendChild: function() {},
        removeChild: function() {},
        style: {}
    });
}

if (!doc.documentElement) {
    extendProperty(doc, 'documentElement', { 
        style: {},
        appendChild: function() {},
        removeChild: function() {}
    });
} else {
    // 如果已经存在，补充 appendChild/removeChild
    if (!doc.documentElement.appendChild) {
        extendProperty(doc.documentElement, 'appendChild', function() {});
    }
    if (!doc.documentElement.removeChild) {
        extendProperty(doc.documentElement, 'removeChild', function() {});
    }
}

if (!doc.addEventListener) {
    extendProperty(doc, 'addEventListener', function(type, listener) {
        if (type === 'touchstart') {
            wx.onTouchStart(listener);
        } else if (type === 'touchmove') {
            wx.onTouchMove(listener);
        } else if (type === 'touchend') {
            wx.onTouchEnd(listener);
        } else if (type === 'touchcancel') {
            wx.onTouchCancel(listener);
        }
    });
}

if (!doc.removeEventListener) {
    extendProperty(doc, 'removeEventListener', function() {});
}

if (!doc.elementFromPoint) {
    extendProperty(doc, 'elementFromPoint', function(x, y) { return GameGlobal.canvas; });
}

if (!doc.location) {
    extendProperty(doc, 'location', { href: '' });
}

extendProperty(doc, 'readyState', 'complete');

// 尝试将增强后的 document 重新赋值回 window
setGlobalProperty('document', doc);


// 模拟 navigator
var nav = _window.navigator || {};
extendProperty(nav, 'userAgent', nav.userAgent || 'Mozilla/5.0 (iPhone; CPU iPhone OS 10_0 like Mac OS X) AppleWebKit/602.1.38 (KHTML, like Gecko) Version/10.0 Mobile/14A300 Safari/602.1');
extendProperty(nav, 'maxTouchPoints', nav.maxTouchPoints || 10);
setGlobalProperty('navigator', nav);

// 模拟 Image
var _Image = function() {
    return wx.createImage();
};
setGlobalProperty('Image', _Image);

// 模拟 XMLHTTPRequest
var _XMLHttpRequest = function() {
    return new wx.XMLHttpRequest();
};
setGlobalProperty('XMLHttpRequest', _XMLHttpRequest);

// 模拟 rAF
setGlobalProperty('requestAnimationFrame', GameGlobal.requestAnimationFrame);
setGlobalProperty('cancelAnimationFrame', GameGlobal.cancelAnimationFrame);

// 模拟各类 Element 构造函数
setGlobalProperty('HTMLElement', function(){});
setGlobalProperty('HTMLVideoElement', function(){});
setGlobalProperty('HTMLCanvasElement', function(){});
setGlobalProperty('HTMLImageElement', function(){});

// 模拟 WebGL (如果需要)
setGlobalProperty('WebGLRenderingContext', GameGlobal.WebGLRenderingContext || function(){});

// 模拟 Performance
setGlobalProperty('performance', GameGlobal.performance || { now: Date.now });

module.exports = _window;
