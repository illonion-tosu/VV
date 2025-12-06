// countUp.js

class CountUp {
    constructor(target, startVal, endVal, decimals, duration, options) {
        const self = this;
        self.version = () => '1.9.3';

        // Default options
        self.options = {
            useEasing: true,
            useGrouping: true,
            separator: '',
            decimal: '.',
            easingFn: easeOutExpo,
            formattingFn: formatNumber,
            prefix: '',
            suffix: '',
            numerals: [],
        };

        if (options && typeof options === 'object') {
            for (const key in self.options) {
                if (options.hasOwnProperty(key) && options[key] !== null) {
                    self.options[key] = options[key];
                }
            }
        }

        if (self.options.separator === '') {
            self.options.useGrouping = false;
        } else {
            self.options.separator = `${self.options.separator}`;
        }

        // Polyfill for requestAnimationFrame
        let lastTime = 0;
        const vendors = ['webkit', 'moz', 'ms', 'o'];
        for (let x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
            window.requestAnimationFrame =
                window[vendors[x] + 'RequestAnimationFrame'];
            window.cancelAnimationFrame =
                window[vendors[x] + 'CancelAnimationFrame'] ||
                window[vendors[x] + 'CancelRequestAnimationFrame'];
        }

        if (!window.requestAnimationFrame) {
            window.requestAnimationFrame = function (callback) {
                const currTime = new Date().getTime();
                const timeToCall = Math.max(0, 16 - (currTime - lastTime));
                const id = window.setTimeout(
                    () => callback(currTime + timeToCall),
                    timeToCall
                );
                lastTime = currTime + timeToCall;
                return id;
            };
        }

        if (!window.cancelAnimationFrame) {
            window.cancelAnimationFrame = function (id) {
                clearTimeout(id);
            };
        }

        function formatNumber(num) {
            const neg = num < 0;
            let x, x1, x2, x3;
            num = Math.abs(num).toFixed(self.decimals);
            num += '';
            x = num.split('.');
            x1 = x[0];
            x2 = x.length > 1 ? self.options.decimal + x[1] : '';
            if (self.options.useGrouping) {
                x3 = '';
                for (let i = 0; i < x1.length; ++i) {
                    if (i !== 0 && i % 3 === 0) x3 = self.options.separator + x3;
                    x3 = x1[x1.length - i - 1] + x3;
                }
                x1 = x3;
            }
            if (self.options.numerals.length) {
                x1 = x1.replace(/[0-9]/g, (w) => self.options.numerals[+w]);
                x2 = x2.replace(/[0-9]/g, (w) => self.options.numerals[+w]);
            }
            return (
                (neg ? '-' : '') +
                self.options.prefix +
                x1 +
                x2 +
                self.options.suffix
            );
        }

        function easeOutExpo(t, b, c, d) {
            return (c * (-Math.pow(2, -10 * t / d) + 1) * 1024) / 1023 + b;
        }

        function ensureNumber(n) {
            return typeof n === 'number' && !isNaN(n);
        }

        self.initialize = function () {
            if (self.initialized) return true;

            self.error = '';
            self.d =
                typeof target === 'string'
                    ? document.getElementById(target)
                    : target;
            if (!self.d) {
                self.error = '[CountUp] target is null or undefined';
                return false;
            }
            self.startVal = Number(startVal);
            self.endVal = Number(endVal);
            if (ensureNumber(self.startVal) && ensureNumber(self.endVal)) {
                self.decimals = Math.max(0, decimals || 0);
                self.dec = Math.pow(10, self.decimals);
                self.duration = Number(duration) * 1000 || 2000;
                self.countDown = self.startVal > self.endVal;
                self.frameVal = self.startVal;
                self.initialized = true;
                return true;
            } else {
                self.error = `[CountUp] startVal (${startVal}) or endVal (${endVal}) is not a number`;
                return false;
            }
        };

        self.printValue = function (value) {
            const result = self.options.formattingFn(value);
            if (self.d.tagName === 'INPUT') self.d.value = result;
            else if (self.d.tagName === 'text' || self.d.tagName === 'tspan')
                self.d.textContent = result;
            else self.d.innerHTML = result;
        };

        self.count = function (timestamp) {
            if (!self.startTime) self.startTime = timestamp;
            const progress = timestamp - self.startTime;
            self.remaining = self.duration - progress;

            if (self.options.useEasing) {
                self.frameVal = self.countDown
                    ? self.startVal -
                      self.options.easingFn(
                          progress,
                          0,
                          self.startVal - self.endVal,
                          self.duration
                      )
                    : self.options.easingFn(
                          progress,
                          self.startVal,
                          self.endVal - self.startVal,
                          self.duration
                      );
            } else {
                self.frameVal = self.countDown
                    ? self.startVal -
                      (self.startVal - self.endVal) * (progress / self.duration)
                    : self.startVal +
                      (self.endVal - self.startVal) * (progress / self.duration);
            }

            if (self.countDown)
                self.frameVal =
                    self.frameVal < self.endVal ? self.endVal : self.frameVal;
            else
                self.frameVal =
                    self.frameVal > self.endVal ? self.endVal : self.frameVal;

            self.frameVal = Math.round(self.frameVal * self.dec) / self.dec;
            self.printValue(self.frameVal);

            if (progress < self.duration) {
                self.rAF = requestAnimationFrame(self.count);
            } else if (self.callback) {
                self.callback();
            }
        };

        self.start = function (callback) {
            if (!self.initialize()) return;
            self.callback = callback;
            self.rAF = requestAnimationFrame(self.count);
        };

        self.pauseResume = function () {
            if (!self.paused) {
                self.paused = true;
                cancelAnimationFrame(self.rAF);
            } else {
                self.paused = false;
                delete self.startTime;
                self.duration = self.remaining;
                self.startVal = self.frameVal;
                requestAnimationFrame(self.count);
            }
        };

        self.reset = function () {
            self.paused = false;
            delete self.startTime;
            self.initialized = false;
            if (self.initialize()) {
                cancelAnimationFrame(self.rAF);
                self.printValue(self.startVal);
            }
        };

        self.update = function (newEndVal) {
            if (!self.initialize()) return;
            newEndVal = Number(newEndVal);
            if (!ensureNumber(newEndVal)) {
                self.error = `[CountUp] update() - new endVal is not a number: ${newEndVal}`;
                return;
            }
            if (newEndVal === self.frameVal) return;
            cancelAnimationFrame(self.rAF);
            self.paused = false;
            delete self.startTime;
            self.startVal = self.frameVal;
            self.endVal = newEndVal;
            self.countDown = self.startVal > self.endVal;
            self.rAF = requestAnimationFrame(self.count);
        };

        if (self.initialize()) self.printValue(self.startVal);
    }
}

export default CountUp;