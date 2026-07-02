"use strict";

function _callSuper(t, o, e) { return o = _getPrototypeOf(o), _possibleConstructorReturn(t, _isNativeReflectConstruct() ? Reflect.construct(o, e || [], _getPrototypeOf(t).constructor) : o.apply(t, e)); }
function _possibleConstructorReturn(t, e) { if (e && ("object" == _typeof(e) || "function" == typeof e)) return e; if (void 0 !== e) throw new TypeError("Derived constructors may only return object or undefined"); return _assertThisInitialized(t); }
function _assertThisInitialized(e) { if (void 0 === e) throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); return e; }
function _isNativeReflectConstruct() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (_isNativeReflectConstruct = function _isNativeReflectConstruct() { return !!t; })(); }
function _getPrototypeOf(t) { return _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function (t) { return t.__proto__ || Object.getPrototypeOf(t); }, _getPrototypeOf(t); }
function _inherits(t, e) { if ("function" != typeof e && null !== e) throw new TypeError("Super expression must either be null or a function"); t.prototype = Object.create(e && e.prototype, { constructor: { value: t, writable: !0, configurable: !0 } }), Object.defineProperty(t, "prototype", { writable: !1 }), e && _setPrototypeOf(t, e); }
function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _slicedToArray(r, e) { return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t.return && (u = t.return(), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _createForOfIteratorHelper(r, e) { var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (!t) { if (Array.isArray(r) || (t = _unsupportedIterableToArray(r)) || e && r && "number" == typeof r.length) { t && (r = t); var _n = 0, F = function F() {}; return { s: F, n: function n() { return _n >= r.length ? { done: !0 } : { done: !1, value: r[_n++] }; }, e: function e(r) { throw r; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var o, a = !0, u = !1; return { s: function s() { t = t.call(r); }, n: function n() { var r = t.next(); return a = r.done, r; }, e: function e(r) { u = !0, o = r; }, f: function f() { try { a || null == t.return || t.return(); } finally { if (u) throw o; } } }; }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
/**
 * Pokemon Showdown Battle Animations
 *
 * There are the specific resource files and scripts for misc animations
 *
 * Licensing note: PS's client has complicated licensing:
 * - The client as a whole is AGPLv3
 * - The battle replay/animation engine (battle-*.ts) by itself is MIT
 *
 * @author Guangcong Luo <guangcongluo@gmail.com>
 * @license MIT
 */
/*

Most of this file is: CC0 (public domain)
  <http://creativecommons.org/publicdomain/zero/1.0/>

This license DOES extend to all images in the fx/ folder, with the exception of icicle.png, lightning.png, and bone.png.

icicle.png and lightning.png by Clint Bellanger are triple-licensed GPLv2/GPLv3/CC-BY-SA-3.0.
  <http://opengameart.org/content/icicle-spell>
  <http://opengameart.org/content/lightning-shock-spell>

rocks.png, rock1.png, rock2.png by PO user "Gilad" is licensed GPLv3.

This license DOES NOT extend to any images in the sprites/ folder.

This license DOES NOT extend to any other files in this repository.

*/
var BattleScene = /*#__PURE__*/function () {
  function BattleScene(battle, $frame, $logFrame) {
    _classCallCheck(this, BattleScene);
    _defineProperty(this, "animating", true);
    _defineProperty(this, "acceleration", 1);
    /** Note: Not the actual generation of the battle, but the gen of the sprites/background */
    _defineProperty(this, "gen", 7);
    _defineProperty(this, "mod", '');
    /** 1 = singles, 2 = doubles, 3 = triples */
    _defineProperty(this, "activeCount", 1);
    _defineProperty(this, "numericId", 0);
    _defineProperty(this, "$battle", null);
    _defineProperty(this, "$options", null);
    _defineProperty(this, "$terrain", null);
    _defineProperty(this, "$weather", null);
    _defineProperty(this, "$bgEffect", null);
    _defineProperty(this, "$bg", null);
    _defineProperty(this, "$sprite", null);
    _defineProperty(this, "$sprites", [null, null]);
    _defineProperty(this, "$spritesFront", [null, null]);
    _defineProperty(this, "$stat", null);
    _defineProperty(this, "$fx", null);
    _defineProperty(this, "$leftbar", null);
    _defineProperty(this, "$rightbar", null);
    _defineProperty(this, "$turn", null);
    _defineProperty(this, "$messagebar", null);
    _defineProperty(this, "$delay", null);
    _defineProperty(this, "$hiddenMessage", null);
    _defineProperty(this, "$tooltips", null);
    _defineProperty(this, "sideConditions", [{}, {}]);
    _defineProperty(this, "preloadDone", 0);
    _defineProperty(this, "preloadNeeded", 0);
    _defineProperty(this, "bgm", null);
    _defineProperty(this, "backdropImage", '');
    _defineProperty(this, "bgmNum", 0);
    _defineProperty(this, "preloadCache", {});
    _defineProperty(this, "messagebarOpen", false);
    _defineProperty(this, "customControls", false);
    _defineProperty(this, "interruptionCount", 1);
    _defineProperty(this, "curWeather", '');
    _defineProperty(this, "curTerrain", '');
    // Animation state
    ////////////////////////////////////
    _defineProperty(this, "timeOffset", 0);
    _defineProperty(this, "pokemonTimeOffset", 0);
    _defineProperty(this, "minDelay", 0);
    /** jQuery objects that need to finish animating */
    _defineProperty(this, "activeAnimations", $());
    this.battle = battle;
    $frame.addClass('battle');
    this.$frame = $frame;
    this.log = new BattleLog($logFrame[0], this);
    this.log.battleParser.pokemonName = function (pokemonId) {
      if (!pokemonId) return '';
      if (battle.ignoreNicks || battle.ignoreOpponent) {
        var pokemon = battle.getPokemon(pokemonId);
        if (pokemon) return pokemon.speciesForme;
      }
      if (!pokemonId.startsWith('p')) return '???pokemon:' + pokemonId + '???';
      if (pokemonId.charAt(3) === ':') return BattleTextParser.escapeReplace(pokemonId.slice(4).trim());else if (pokemonId.charAt(2) === ':') return BattleTextParser.escapeReplace(pokemonId.slice(3).trim());
      return '???pokemon:' + pokemonId + '???';
    };
    var numericId = 0;
    if (battle.id) {
      numericId = parseInt(battle.id.slice(battle.id.lastIndexOf('-') + 1), 10);
      if (this.battle.id.includes('digimon')) this.mod = 'digimon';
    }
    if (!numericId) {
      numericId = Math.floor(Math.random() * 1000000);
    }
    this.numericId = numericId;
    this.tooltips = new BattleTooltips(battle);
    this.tooltips.listen($frame[0]);
    this.preloadEffects();
    // reset() is called during battle initialization, so it doesn't need to be called here
  }
  return _createClass(BattleScene, [{
    key: "reset",
    value: function reset() {
      this.updateGen();

      // Log frame
      /////////////

      if (this.$options) {
        this.log.reset();
      } else {
        this.$options = $('<div class="battle-options"></div>');
        $(this.log.elem).prepend(this.$options);
      }

      // Battle frame
      ///////////////

      this.$frame.empty();
      this.$battle = $('<div class="innerbattle"></div>');
      this.$frame.append(this.$battle);
      this.$bg = $('<div class="backdrop" style="background-image:url(' + Dex.resourcePrefix + this.backdropImage + ');display:block;opacity:0.8"></div>');
      this.$terrain = $('<div class="weather"></div>');
      this.$weather = $('<div class="weather"></div>');
      this.$bgEffect = $('<div></div>');
      this.$sprite = $('<div></div>');
      this.$sprites = [$('<div></div>'), $('<div></div>')];
      this.$spritesFront = [$('<div></div>'), $('<div></div>')];
      this.sideConditions = [{}, {}];
      this.$sprite.append(this.$sprites[1]);
      this.$sprite.append(this.$spritesFront[1]);
      this.$sprite.append(this.$spritesFront[0]);
      this.$sprite.append(this.$sprites[0]);
      this.$stat = $('<div role="complementary" aria-label="Active Pokemon"></div>');
      this.$fx = $('<div></div>');
      this.$leftbar = $('<div class="leftbar" role="complementary" aria-label="Your Team"></div>');
      this.$rightbar = $('<div class="rightbar" role="complementary" aria-label="Opponent\'s Team"></div>');
      this.$turn = $('<div></div>');
      this.$messagebar = $('<div class="messagebar message"></div>');
      this.$delay = $('<div></div>');
      this.$hiddenMessage = $('<div class="message" style="position:absolute;display:block;visibility:hidden"></div>');
      this.$tooltips = $('<div class="tooltips"></div>');
      this.$battle.append(this.$bg);
      this.$battle.append(this.$terrain);
      this.$battle.append(this.$weather);
      this.$battle.append(this.$bgEffect);
      this.$battle.append(this.$sprite);
      this.$battle.append(this.$stat);
      this.$battle.append(this.$fx);
      this.$battle.append(this.$leftbar);
      this.$battle.append(this.$rightbar);
      this.$battle.append(this.$turn);
      this.$battle.append(this.$messagebar);
      this.$battle.append(this.$delay);
      this.$battle.append(this.$hiddenMessage);
      this.$battle.append(this.$tooltips);
      if (!this.animating) {
        this.$battle.append('<div class="seeking"><strong>seeking...</strong></div>');
      }
      this.messagebarOpen = false;
      this.timeOffset = 0;
      this.pokemonTimeOffset = 0;
      this.curTerrain = '';
      this.curWeather = '';
      this.log.battleParser.perspective = this.battle.mySide.sideid;
      this.resetSides(true);
    }
  }, {
    key: "animationOff",
    value: function animationOff() {
      this.$battle.append('<div class="seeking"><strong>seeking...</strong></div>');
      this.$frame.find('div.playbutton').remove();
      this.stopAnimation();
      this.animating = false;
      this.$messagebar.empty().css({
        opacity: 0,
        height: 0
      });
    }
  }, {
    key: "stopAnimation",
    value: function stopAnimation() {
      this.interruptionCount++;
      this.$battle.find(':animated').finish();
      this.$fx.empty();
    }
  }, {
    key: "animationOn",
    value: function animationOn() {
      if (this.animating) return;
      $.fx.off = false;
      this.animating = true;
      this.$battle.find('.seeking').remove();
      this.updateSidebars();
      var _iterator = _createForOfIteratorHelper(this.battle.sides),
        _step;
      try {
        for (_iterator.s(); !(_step = _iterator.n()).done;) {
          var side = _step.value;
          var _iterator2 = _createForOfIteratorHelper(side.pokemon),
            _step2;
          try {
            for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
              var pokemon = _step2.value;
              pokemon.sprite.reset(pokemon);
            }
          } catch (err) {
            _iterator2.e(err);
          } finally {
            _iterator2.f();
          }
        }
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }
      this.updateWeather(true);
      this.resetTurn();
      this.resetSideConditions();
    }
  }, {
    key: "pause",
    value: function pause() {
      var _this = this;
      this.stopAnimation();
      this.updateBgm();
      if (!this.battle.started) {
        this.$frame.append('<div class="playbutton"><button name="play" class="button"><i class="fa fa-play" aria-hidden="true"></i> Play</button><br /><br /><button name="play-muted" class="startsoundchooser button" style="font-size:10pt">Play (sound off)</button></div>');
        this.$frame.find('div.playbutton button[name=play-muted]').click(function () {
          _this.setMute(true);
          _this.battle.play();
        });
      }
      this.$frame.find('div.playbutton button[name=play]').click(function () {
        return _this.battle.play();
      });
    }
  }, {
    key: "resume",
    value: function resume() {
      this.$frame.find('div.playbutton').remove();
      this.updateBgm();
    }
  }, {
    key: "setMute",
    value: function setMute(muted) {
      BattleSound.setMute(muted);
    }
  }, {
    key: "wait",
    value: function wait(time) {
      if (!this.animating) return;
      this.timeOffset += time;
    }

    // Sprite handling
    /////////////////////////////////////////////////////////////////////
  }, {
    key: "addSprite",
    value: function addSprite(sprite) {
      if (sprite.$el) this.$sprites[+sprite.isFrontSprite].append(sprite.$el);
    }
  }, {
    key: "showEffect",
    value: function showEffect(effect, start, end, transition, after, additionalCss) {
      if (typeof effect === 'string') effect = BattleEffects[effect];
      var $effect = $("<img src=\"".concat(effect.url, "\" style=\"display:block;position:absolute\" />"));
      this.$fx.append($effect);
      if (additionalCss) $effect.css(additionalCss);
      $effect = this.$fx.children().last();
      return this.animateEffect($effect, effect, start, end, transition, after);
    }
  }, {
    key: "animateEffect",
    value: function animateEffect($effect, effect, start, end, transition, after, additionalCss) {
      if (typeof effect === 'string') effect = BattleEffects[effect];
      if (!start.time) start.time = 0;
      if (!end.time) end.time = start.time + 500;
      start.time += this.timeOffset;
      end.time += this.timeOffset;
      if (!end.scale && end.scale !== 0 && start.scale) end.scale = start.scale;
      if (!end.xscale && end.xscale !== 0 && start.xscale) end.xscale = start.xscale;
      if (!end.yscale && end.yscale !== 0 && start.yscale) end.yscale = start.yscale;
      end = _objectSpread(_objectSpread({}, start), end);
      var startpos = this.pos(start, effect);
      var endpos = this.posT(end, effect, transition, start);
      if (start.time) {
        $effect.css(_objectSpread(_objectSpread({}, startpos), {}, {
          opacity: 0
        }));
        $effect.delay(start.time).animate({
          opacity: startpos.opacity
        }, 1);
      } else if ($effect.queue().length) {
        $effect.animate(startpos, 0);
      } else {
        $effect.css(startpos);
      }
      $effect.animate(endpos, end.time - start.time);
      if (after === 'fade') {
        $effect.animate({
          opacity: 0
        }, 100);
      }
      if (after === 'explode') {
        if (end.scale) end.scale *= 3;
        if (end.xscale) end.xscale *= 3;
        if (end.yscale) end.yscale *= 3;
        end.opacity = 0;
        var endendpos = this.pos(end, effect);
        $effect.animate(endendpos, 200);
      }
      this.waitFor($effect);
      return $effect;
    }
  }, {
    key: "backgroundEffect",
    value: function backgroundEffect(bg, duration) {
      var opacity = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 1;
      var delay = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0;
      var $effect = $('<div class="background"></div>');
      $effect.css({
        background: bg,
        display: 'block',
        opacity: 0
      });
      this.$bgEffect.append($effect);
      $effect.delay(delay).animate({
        opacity: opacity
      }, 250).delay(duration - 250);
      $effect.animate({
        opacity: 0
      }, 250);
    }

    /**
     * Converts a PS location (x, y, z, scale, xscale, yscale, opacity)
     * to a jQuery position (top, left, width, height, opacity) suitable
     * for passing into `jQuery#css` or `jQuery#animate`.
     * The display property is passed through if it exists.
     */
  }, {
    key: "pos",
    value: function pos(loc, obj) {
      loc = _objectSpread({
        x: 0,
        y: 0,
        z: 0,
        scale: 1,
        opacity: 1
      }, loc);
      if (!loc.xscale && loc.xscale !== 0) loc.xscale = loc.scale;
      if (!loc.yscale && loc.yscale !== 0) loc.yscale = loc.scale;
      var left = 210;
      var top = 245;
      var scale = obj.gen === 5 ? 2.0 - loc.z / 200 : 1.5 - 0.5 * (loc.z / 200);
      if (scale < 0.1) scale = 0.1;
      left += (410 - 190) * (loc.z / 200);
      top += (135 - 245) * (loc.z / 200);
      left += Math.floor(loc.x * scale);
      top -= Math.floor(loc.y * scale /* - loc.x * scale / 4 */);
      var width = Math.floor(obj.w * scale * loc.xscale);
      var height = Math.floor(obj.h * scale * loc.yscale);
      var hoffset = Math.floor((obj.h - (obj.y || 0) * 2) * scale * loc.yscale);
      left -= Math.floor(width / 2);
      top -= Math.floor(hoffset / 2);
      var pos = {
        left: left,
        top: top,
        width: width,
        height: height,
        opacity: loc.opacity
      };
      if (loc.display) pos.display = loc.display;
      return pos;
    }
    /**
     * Converts a PS location to a jQuery transition map (see `pos`)
     * suitable for passing into `jQuery#animate`.
     * oldLoc is required for ballistic (jumping) animations.
     */
  }, {
    key: "posT",
    value: function posT(loc, obj, transition, oldLoc) {
      var pos = this.pos(loc, obj);
      var oldPos = oldLoc ? this.pos(oldLoc, obj) : null;
      var transitionMap = {
        left: 'linear',
        top: 'linear',
        width: 'linear',
        height: 'linear',
        opacity: 'linear'
      };
      if (transition === 'ballistic') {
        transitionMap.top = pos.top < oldPos.top ? 'ballisticUp' : 'ballisticDown';
      }
      if (transition === 'ballisticUnder') {
        transitionMap.top = pos.top < oldPos.top ? 'ballisticDown' : 'ballisticUp';
      }
      if (transition === 'ballistic2') {
        transitionMap.top = pos.top < oldPos.top ? 'quadUp' : 'quadDown';
      }
      if (transition === 'ballistic2Back') {
        // This _should_ be the same as ballistic2.
        // Unfortunately, oldLoc is the original loc, rather than the
        // previous loc, so when you're "going back", loc === oldLoc, and
        // the direction has to instead be inferred from the destination.
        transitionMap.top = loc.z > 0 ? 'quadUp' : 'quadDown';
      }
      if (transition === 'ballistic2Under') {
        transitionMap.top = pos.top < oldPos.top ? 'quadDown' : 'quadUp';
      }
      if (transition === 'swing') {
        transitionMap.left = 'swing';
        transitionMap.top = 'swing';
        transitionMap.width = 'swing';
        transitionMap.height = 'swing';
      }
      if (transition === 'accel') {
        transitionMap.left = 'quadDown';
        transitionMap.top = 'quadDown';
        transitionMap.width = 'quadDown';
        transitionMap.height = 'quadDown';
      }
      if (transition === 'decel') {
        transitionMap.left = 'quadUp';
        transitionMap.top = 'quadUp';
        transitionMap.width = 'quadUp';
        transitionMap.height = 'quadUp';
      }
      return {
        left: [pos.left, transitionMap.left],
        top: [pos.top, transitionMap.top],
        width: [pos.width, transitionMap.width],
        height: [pos.height, transitionMap.height],
        opacity: [pos.opacity, transitionMap.opacity]
      };
    }
  }, {
    key: "waitFor",
    value: function waitFor(elem) {
      this.activeAnimations = this.activeAnimations.add(elem);
    }
  }, {
    key: "startAnimations",
    value: function startAnimations() {
      this.$fx.empty();
      this.activeAnimations = $();
      this.timeOffset = 0;
      this.minDelay = 0;
    }
  }, {
    key: "finishAnimations",
    value: function finishAnimations() {
      if (this.minDelay || this.timeOffset) {
        this.$delay.delay(Math.max(this.minDelay, this.timeOffset));
        this.activeAnimations = this.activeAnimations.add(this.$delay);
      }
      if (!this.activeAnimations.length) return undefined;
      return this.activeAnimations.promise();
    }

    // Messagebar and log
    /////////////////////////////////////////////////////////////////////
  }, {
    key: "preemptCatchup",
    value: function preemptCatchup() {
      this.log.preemptCatchup();
    }
  }, {
    key: "message",
    value: function message(_message) {
      var _this2 = this;
      if (!this.messagebarOpen) {
        this.log.addSpacer();
        if (this.animating) {
          this.$messagebar.empty();
          this.$messagebar.css({
            display: 'block',
            opacity: 0,
            height: 'auto'
          });
          this.$messagebar.animate({
            opacity: 1
          }, this.battle.messageFadeTime / this.acceleration);
        }
      }
      if (this.battle.hardcoreMode && _message.startsWith('<small>(')) {
        _message = '';
      }
      if (_message && this.animating) {
        this.$hiddenMessage.append('<p></p>');
        var $message = this.$hiddenMessage.children().last();
        $message.html(_message);
        $message.css({
          display: 'block',
          opacity: 0
        });
        $message.animate({
          height: 'hide'
        }, 1, function () {
          $message.appendTo(_this2.$messagebar);
          $message.animate({
            height: 'show',
            'padding-bottom': 4,
            opacity: 1
          }, _this2.battle.messageFadeTime / _this2.acceleration);
        });
        this.waitFor($message);
      }
      this.messagebarOpen = true;
    }
  }, {
    key: "maybeCloseMessagebar",
    value: function maybeCloseMessagebar(args, kwArgs) {
      if (this.log.battleParser.sectionBreak(args, kwArgs)) {
        if (!this.messagebarOpen) return false;
        this.closeMessagebar();
        return true;
      }
      return false;
    }
  }, {
    key: "closeMessagebar",
    value: function closeMessagebar() {
      if (this.messagebarOpen) {
        this.messagebarOpen = false;
        if (this.animating) {
          this.$messagebar.delay(this.battle.messageShownTime / this.acceleration).animate({
            opacity: 0
          }, this.battle.messageFadeTime / this.acceleration);
          this.waitFor(this.$messagebar);
        }
        return true;
      }
      return false;
    }

    // General updating
    /////////////////////////////////////////////////////////////////////
  }, {
    key: "runMoveAnim",
    value: function runMoveAnim(moveid, participants) {
      if (!this.animating) return;
      var animEntry = BattleMoveAnims[moveid];
      if (this.acceleration >= 3) {
        var targetsSelf = !participants[1] || participants[0] === participants[1];
        var isSpecial = !targetsSelf && this.battle.dex.moves.get(moveid).category === 'Special';
        animEntry = BattleOtherAnims[targetsSelf ? 'fastanimself' : isSpecial ? 'fastanimspecial' : 'fastanimattack'];
      } else if (!animEntry) {
        animEntry = BattleMoveAnims['tackle'];
      }
      animEntry.anim(this, participants.map(function (p) {
        return p.sprite;
      }));
    }
  }, {
    key: "runOtherAnim",
    value: function runOtherAnim(moveid, participants) {
      if (!this.animating) return;
      BattleOtherAnims[moveid].anim(this, participants.map(function (p) {
        return p.sprite;
      }));
    }
  }, {
    key: "runStatusAnim",
    value: function runStatusAnim(moveid, participants) {
      if (!this.animating) return;
      BattleStatusAnims[moveid].anim(this, participants.map(function (p) {
        return p.sprite;
      }));
    }
  }, {
    key: "runResidualAnim",
    value: function runResidualAnim(moveid, pokemon) {
      if (!this.animating) return;
      BattleMoveAnims[moveid].residualAnim(this, [pokemon.sprite]);
    }
  }, {
    key: "runPrepareAnim",
    value: function runPrepareAnim(moveid, attacker, defender) {
      if (!this.animating || this.acceleration >= 3) return;
      var moveAnim = BattleMoveAnims[moveid];
      if (!moveAnim.prepareAnim) return;
      moveAnim.prepareAnim(this, [attacker.sprite, defender.sprite]);
    }
  }, {
    key: "updateGen",
    value: function updateGen() {
      var _this$battle$nearSide;
      var gen = this.battle.gen;
      if (Dex.prefs('nopastgens')) gen = 6;
      if (Dex.prefs('bwgfx') && gen > 5) gen = 5;
      this.gen = gen;
      this.activeCount = ((_this$battle$nearSide = this.battle.nearSide) === null || _this$battle$nearSide === void 0 ? void 0 : _this$battle$nearSide.active.length) || 1;
      var rated = this.battle.rated;
      var bg;
      if (typeof rated === 'string' && rated.startsWith("Smogon Premier League")) {
        if (gen <= 1) bg = 'fx/bg-gen1-spl.png';else if (gen <= 2) bg = 'fx/bg-gen2-spl.png';else if (gen <= 3) bg = 'fx/bg-gen3-spl.png';else if (gen <= 4) bg = 'fx/bg-gen4-spl.png';else bg = 'fx/bg-spl.png';
        this.setBgm(-101);
      } else if (typeof rated === 'string' && rated.startsWith('National Pokemon Association')) {
        bg = 'fx/bg-npa.png';
        this.setBgm(-101);
      } else if (typeof rated === 'string' && rated.startsWith('World Cup of Pokemon')) {
        bg = 'fx/bg-wcop.png';
        this.setBgm(-101);
      } else if (typeof rated === 'string' && rated.startsWith('Smogon Champions League')) {
        bg = 'fx/bg-scl.png';
        this.setBgm(-101);
      } else {
        if (gen <= 1) bg = 'fx/bg-gen1.png?';else if (gen <= 2) bg = 'fx/bg-gen2.png?';else if (gen <= 3) bg = "fx/".concat(BattleBackdropsThree[this.numericId % BattleBackdropsThree.length], "?");else if (gen <= 4) bg = "fx/".concat(BattleBackdropsFour[this.numericId % BattleBackdropsFour.length]);else if (gen <= 5) bg = "fx/".concat(BattleBackdropsFive[this.numericId % BattleBackdropsFive.length]);else bg = "sprites/gen6bgs/".concat(BattleBackdrops[this.numericId % BattleBackdrops.length]);
      }
      this.backdropImage = bg;
      if (this.$bg) {
        this.$bg.css('background-image', "url(".concat(Dex.resourcePrefix).concat(this.backdropImage, ")"));
      }
    }
  }, {
    key: "getDetailsText",
    value: function getDetailsText(pokemon) {
      var _pokemon$side;
      var name = (_pokemon$side = pokemon.side) !== null && _pokemon$side !== void 0 && _pokemon$side.isFar && (this.battle.ignoreOpponent || this.battle.ignoreNicks) ? pokemon.speciesForme : pokemon.name;
      if (name !== pokemon.speciesForme) {
        name += ' (' + pokemon.speciesForme + ')';
      }
      if (pokemon === pokemon.side.active[0]) {
        name += ' (active)';
      } else if (pokemon.fainted) {
        name += ' (fainted)';
      } else {
        var statustext = '';
        if (pokemon.hp !== pokemon.maxhp) {
          statustext += pokemon.getHPText();
        }
        if (pokemon.status) {
          if (statustext) statustext += '|';
          statustext += pokemon.status;
        }
        if (statustext) {
          name += ' (' + statustext + ')';
        }
      }
      return BattleLog.escapeHTML(name);
    }
  }, {
    key: "getSidebarHTML",
    value: function getSidebarHTML(side, posStr) {
      var noShow = this.battle.hardcoreMode && this.battle.gen < 7;
      var speciesOverage = this.battle.speciesClause ? Infinity : Math.max(side.pokemon.length - side.totalPokemon, 0);
      var sidebarIcons = [];
      var speciesTable = [];
      var zoroarkRevealed = false;
      var hasIllusion = false;
      if (speciesOverage) {
        for (var i = 0; i < side.pokemon.length; i++) {
          var species = side.pokemon[i].getBaseSpecies().baseSpecies;
          if (speciesOverage && speciesTable.includes(species)) {
            var _iterator3 = _createForOfIteratorHelper(sidebarIcons),
              _step3;
            try {
              for (_iterator3.s(); !(_step3 = _iterator3.n()).done;) {
                var sidebarIcon = _step3.value;
                if (side.pokemon[sidebarIcon[1]].getBaseSpecies().baseSpecies === species) {
                  sidebarIcon[0] = 'pokemon-illusion';
                }
              }
            } catch (err) {
              _iterator3.e(err);
            } finally {
              _iterator3.f();
            }
            hasIllusion = true;
            speciesOverage--;
          } else {
            sidebarIcons.push(['pokemon', i]);
            speciesTable.push(species);
            if (['Zoroark', 'Zorua'].includes(species)) {
              zoroarkRevealed = true;
            }
          }
        }
      } else {
        for (var _i = 0; _i < side.pokemon.length; _i++) {
          sidebarIcons.push(['pokemon', _i]);
        }
      }
      if (!zoroarkRevealed && hasIllusion && sidebarIcons.length < side.totalPokemon) {
        sidebarIcons.push(['pseudo-zoroark', null]);
      }
      while (sidebarIcons.length < side.totalPokemon) {
        sidebarIcons.push(['unrevealed', null]);
      }
      while (sidebarIcons.length < 6) {
        sidebarIcons.push(['empty', null]);
      }
      var pokemonhtml = '';
      for (var _i2 = 0; _i2 < sidebarIcons.length; _i2++) {
        var _sidebarIcons$_i = _slicedToArray(sidebarIcons[_i2], 2),
          iconType = _sidebarIcons$_i[0],
          pokeIndex = _sidebarIcons$_i[1];
        var poke = pokeIndex !== null ? side.pokemon[pokeIndex] : null;
        var tooltipCode = " class=\"picon has-tooltip\" data-tooltip=\"pokemon|".concat(side.n, "|").concat(pokeIndex).concat(iconType === 'pokemon-illusion' ? '|illusion' : '', "\"");
        if (iconType === 'empty') {
          pokemonhtml += "<span class=\"picon\" style=\"".concat(Dex.getPokemonIcon('pokeball-none'), "\"></span>");
        } else if (noShow) {
          if (poke !== null && poke !== void 0 && poke.fainted) {
            pokemonhtml += "<span".concat(tooltipCode, " style=\"").concat(Dex.getPokemonIcon('pokeball-fainted'), "\" aria-label=\"Fainted\"></span>");
          } else if (poke !== null && poke !== void 0 && poke.status) {
            pokemonhtml += "<span".concat(tooltipCode, " style=\"").concat(Dex.getPokemonIcon('pokeball-statused'), "\" aria-label=\"Statused\"></span>");
          } else {
            pokemonhtml += "<span".concat(tooltipCode, " style=\"").concat(Dex.getPokemonIcon('pokeball'), "\" aria-label=\"Non-statused\"></span>");
          }
        } else if (iconType === 'pseudo-zoroark') {
          pokemonhtml += "<span class=\"picon\" style=\"".concat(Dex.getPokemonIcon('zoroark'), "\" title=\"Unrevealed Illusion user\" aria-label=\"Unrevealed Illusion user\"></span>");
        } else if (!poke) {
          pokemonhtml += "<span class=\"picon\" style=\"".concat(Dex.getPokemonIcon('pokeball'), "\" title=\"Not revealed\" aria-label=\"Not revealed\"></span>");
        } else if (!poke.ident && this.battle.teamPreviewCount && this.battle.teamPreviewCount < side.pokemon.length) {
          // in VGC (bring 6 pick 4) and other pick-less-than-you-bring formats, this is
          // a pokemon that's been brought but not necessarily picked
          var details = this.getDetailsText(poke);
          pokemonhtml += "<span".concat(tooltipCode, " style=\"").concat(Dex.getPokemonIcon(poke, !side.isFar), ";opacity:0.6\" aria-label=\"").concat(details, "\"></span>");
        } else {
          var _details = this.getDetailsText(poke);
          pokemonhtml += "<span".concat(tooltipCode, " style=\"").concat(Dex.getPokemonIcon(poke, !side.isFar), "\" aria-label=\"").concat(_details, "\"></span>");
        }
        if (_i2 % 3 === 2) pokemonhtml += "</div><div class=\"teamicons\">";
      }
      pokemonhtml = '<div class="teamicons">' + pokemonhtml + '</div>';
      var ratinghtml = side.rating ? " title=\"Rating: ".concat(BattleLog.escapeHTML(side.rating), "\"") : "";
      var faded = side.name ? "" : " style=\"opacity: 0.4\"";
      var badgehtml = '';
      if (side.badges.length) {
        badgehtml = '<span class="badges">';
        // hard limiting it to only ever 3 allowed at a time
        // that's what the server limit is anyway but there should be a client limit too
        // just in case
        var _iterator4 = _createForOfIteratorHelper(side.badges.slice(0, 3)),
          _step4;
        try {
          for (_iterator4.s(); !(_step4 = _iterator4.n()).done;) {
            var badgeData = _step4.value;
            // ${badge.type}|${badge.format}|${BADGE_THRESHOLDS[badge.type]}-${badge.season}
            var _badgeData$split = badgeData.split('|'),
              _badgeData$split2 = _slicedToArray(_badgeData$split, 3),
              type = _badgeData$split2[0],
              format = _badgeData$split2[1],
              _details2 = _badgeData$split2[2];
            // todo, maybe make this more easily configured if we ever add badges for other stuff?
            // but idk that we're planning that for now so
            var _details2$split = _details2.split('-'),
              _details2$split2 = _slicedToArray(_details2$split, 1),
              threshold = _details2$split2[0];
            var hover = "User is Top ".concat(threshold, " on the ").concat(format, " Ladder");
            // ou and randbats get diff badges from everyone else, find it
            // (regex futureproofs for double digit gens)
            var formatType = format.split(/gen\d+/)[1] || 'none';
            if (!['ou', 'randombattle'].includes(formatType)) {
              formatType = 'rotating';
            }
            badgehtml += "<img src=\"".concat(Dex.resourcePrefix, "/sprites/misc/").concat(formatType, "_").concat(type, ".png\" style=\"padding: 0px 1px 0px 1px\" width=\"16px\" height=\"16px\" title=\"").concat(hover, "\" />");
          }
        } catch (err) {
          _iterator4.e(err);
        } finally {
          _iterator4.f();
        }
        badgehtml += '</span>';
      }
      return "<div class=\"trainer trainer-".concat(posStr, "\"").concat(faded, "><strong>").concat(BattleLog.escapeHTML(side.name), "</strong>") + "<div class=\"trainersprite\"".concat(ratinghtml, " style=\"background-image:url(").concat(Dex.resolveAvatar(side.avatar), ")\">") + "</div>".concat(badgehtml).concat(pokemonhtml, "</div>");
    }
  }, {
    key: "updateSidebar",
    value: function updateSidebar(side) {
      if (this.battle.gameType === 'freeforall') {
        this.updateLeftSidebar();
        this.updateRightSidebar();
      } else if (side === this.battle.nearSide || side === this.battle.nearSide.ally) {
        this.updateLeftSidebar();
      } else {
        this.updateRightSidebar();
      }
    }
  }, {
    key: "updateLeftSidebar",
    value: function updateLeftSidebar() {
      var side = this.battle.nearSide;
      if (side.ally) {
        var side2 = side.ally;
        this.$leftbar.html(this.getSidebarHTML(side, 'near2') + this.getSidebarHTML(side2, 'near'));
      } else if (this.battle.sides.length > 2) {
        // FFA
        var _side = this.battle.sides[side.n === 0 ? 3 : 2];
        this.$leftbar.html(this.getSidebarHTML(_side, 'near2') + this.getSidebarHTML(side, 'near'));
      } else {
        this.$leftbar.html(this.getSidebarHTML(side, 'near'));
      }
    }
  }, {
    key: "updateRightSidebar",
    value: function updateRightSidebar() {
      var side = this.battle.farSide;
      if (side.ally) {
        var side2 = side.ally;
        this.$rightbar.html(this.getSidebarHTML(side, 'far2') + this.getSidebarHTML(side2, 'far'));
      } else if (this.battle.sides.length > 2) {
        // FFA
        var _side2 = this.battle.sides[side.n === 0 ? 3 : 2];
        this.$rightbar.html(this.getSidebarHTML(_side2, 'far2') + this.getSidebarHTML(side, 'far'));
      } else {
        this.$rightbar.html(this.getSidebarHTML(side, 'far'));
      }
    }
  }, {
    key: "updateSidebars",
    value: function updateSidebars() {
      this.updateLeftSidebar();
      this.updateRightSidebar();
    }
  }, {
    key: "updateStatbars",
    value: function updateStatbars() {
      var _iterator5 = _createForOfIteratorHelper(this.battle.sides),
        _step5;
      try {
        for (_iterator5.s(); !(_step5 = _iterator5.n()).done;) {
          var side = _step5.value;
          var _iterator6 = _createForOfIteratorHelper(side.active),
            _step6;
          try {
            for (_iterator6.s(); !(_step6 = _iterator6.n()).done;) {
              var active = _step6.value;
              if (active) active.sprite.updateStatbar(active);
            }
          } catch (err) {
            _iterator6.e(err);
          } finally {
            _iterator6.f();
          }
        }
      } catch (err) {
        _iterator5.e(err);
      } finally {
        _iterator5.f();
      }
    }
  }, {
    key: "resetSides",
    value: function resetSides(skipEmpty) {
      if (!skipEmpty) {
        var _iterator7 = _createForOfIteratorHelper(this.$sprites),
          _step7;
        try {
          for (_iterator7.s(); !(_step7 = _iterator7.n()).done;) {
            var $spritesContainer = _step7.value;
            $spritesContainer.empty();
          }
        } catch (err) {
          _iterator7.e(err);
        } finally {
          _iterator7.f();
        }
      }
      var _iterator8 = _createForOfIteratorHelper(this.battle.sides),
        _step8;
      try {
        for (_iterator8.s(); !(_step8 = _iterator8.n()).done;) {
          var _side$missedPokemon;
          var side = _step8.value;
          side.z = side.isFar ? 200 : 0;
          (_side$missedPokemon = side.missedPokemon) === null || _side$missedPokemon === void 0 || (_side$missedPokemon = _side$missedPokemon.sprite) === null || _side$missedPokemon === void 0 || _side$missedPokemon.destroy();
          side.missedPokemon = {
            sprite: new PokemonSprite(null, {
              x: side.leftof(this.battle.gameType === 'freeforall' ? -50 : -100),
              y: side.y,
              z: side.z,
              opacity: 0
            }, this, side.isFar)
          };
          side.missedPokemon.sprite.isMissedPokemon = true;
        }
      } catch (err) {
        _iterator8.e(err);
      } finally {
        _iterator8.f();
      }
      if (this.battle.sides.length > 2 && this.sideConditions.length === 2) {
        this.sideConditions.push({}, {});
      }
      this.rebuildTooltips();
    }
  }, {
    key: "rebuildTooltips",
    value: function rebuildTooltips() {
      var tooltipBuf = '';
      var tooltips = this.battle.gameType === 'freeforall' ? {
        // FFA battles are visually rendered as triple battle with the center slots empty
        // so we swap the 2nd and 3rd tooltips on each side
        p2b: {
          top: 70,
          left: 250,
          width: 80,
          height: 100,
          tooltip: 'activepokemon|1|1'
        },
        p2a: {
          top: 90,
          left: 390,
          width: 100,
          height: 100,
          tooltip: 'activepokemon|1|0'
        },
        p1a: {
          top: 200,
          left: 130,
          width: 120,
          height: 160,
          tooltip: 'activepokemon|0|0'
        },
        p1b: {
          top: 200,
          left: 350,
          width: 150,
          height: 160,
          tooltip: 'activepokemon|0|1'
        }
      } : {
        p2c: {
          top: 70,
          left: 250,
          width: 80,
          height: 100,
          tooltip: 'activepokemon|1|2'
        },
        p2b: {
          top: 85,
          left: 320,
          width: 90,
          height: 100,
          tooltip: 'activepokemon|1|1'
        },
        p2a: {
          top: 90,
          left: 390,
          width: 100,
          height: 100,
          tooltip: 'activepokemon|1|0'
        },
        p1a: {
          top: 200,
          left: 130,
          width: 120,
          height: 160,
          tooltip: 'activepokemon|0|0'
        },
        p1b: {
          top: 200,
          left: 250,
          width: 150,
          height: 160,
          tooltip: 'activepokemon|0|1'
        },
        p1c: {
          top: 200,
          left: 350,
          width: 150,
          height: 160,
          tooltip: 'activepokemon|0|2'
        }
      };
      for (var id in tooltips) {
        var layout = tooltips[id];
        tooltipBuf += "<div class=\"has-tooltip\" style=\"position:absolute;";
        tooltipBuf += "top:".concat(layout.top, "px;left:").concat(layout.left, "px;width:").concat(layout.width, "px;height:").concat(layout.height, "px;");
        tooltipBuf += "\" data-id=\"".concat(id, "\" data-tooltip=\"").concat(layout.tooltip, "\" data-ownheight=\"1\"></div>");
      }
      this.$tooltips.html(tooltipBuf);
    }
  }, {
    key: "teamPreview",
    value: function teamPreview() {
      var newBGNum = 0;
      for (var siden = 0; siden < 2 || this.battle.gameType === 'multi' && siden < 4; siden++) {
        var side = this.battle.sides[siden];
        var spriteIndex = +this.battle.viewpointSwitched ^ siden % 2;
        var textBuf = '';
        var buf = '';
        var buf2 = '';
        this.$sprites[spriteIndex].empty();
        var ludicoloCount = 0;
        var lombreCount = 0;
        for (var i = 0; i < side.pokemon.length; i++) {
          var pokemon = side.pokemon[i];
          if (pokemon.speciesForme === 'Xerneas-*') {
            pokemon.speciesForme = 'Xerneas-Neutral';
          }
          if (pokemon.speciesForme === 'Ludicolo') ludicoloCount++;
          if (pokemon.speciesForme === 'Lombre') lombreCount++;
          var spriteData = Dex.getSpriteData(pokemon, !!spriteIndex, {
            gen: this.gen,
            noScale: true,
            mod: this.mod
          });
          var y = 0;
          var x = 0;
          if (spriteIndex) {
            y = 48 + 50 + 3 * (i + 6 - side.pokemon.length);
            x = 48 + 180 + 50 * (i + 6 - side.pokemon.length);
          } else {
            y = 48 + 200 + 3 * i;
            x = 48 + 100 + 50 * i;
          }
          if (textBuf) textBuf += ' / ';
          textBuf += pokemon.speciesForme;
          var url = spriteData.url;
          // if (this.paused) url.replace('/xyani', '/xy').replace('.gif', '.png');
          buf += "<img src=\"".concat(url, "\" width=\"").concat(spriteData.w, "\" height=\"").concat(spriteData.h, "\" style=\"position:absolute;top:").concat(Math.floor(y - spriteData.h / 2), "px;left:").concat(Math.floor(x - spriteData.w / 2), "px\" />");
          buf2 += "<div style=\"position:absolute;top:".concat(y + 45, "px;left:").concat(x - 40, "px;width:80px;font-size:10px;text-align:center;color:#FFF;\">");
          var gender = pokemon.gender;
          if (gender === 'M' || gender === 'F') {
            buf2 += "<img src=\"".concat(Dex.fxPrefix, "gender-").concat(gender.toLowerCase(), ".png\" alt=\"").concat(gender, "\" width=\"7\" height=\"10\" class=\"pixelated\" style=\"margin-bottom:-1px\" /> ");
          }
          if (pokemon.level !== 100) {
            buf2 += "<span style=\"text-shadow:#000 1px 1px 0,#000 1px -1px 0,#000 -1px 1px 0,#000 -1px -1px 0\"><small>L</small>".concat(pokemon.level, "</span>");
          }
          if (pokemon.item === '(mail)') {
            buf2 += " <img src=\"".concat(Dex.resourcePrefix, "fx/mail.png\" width=\"8\" height=\"10\" alt=\"F\" style=\"margin-bottom:-1px\" />");
          } else if (pokemon.item) {
            buf2 += " <img src=\"".concat(Dex.resourcePrefix, "fx/item.png\" width=\"8\" height=\"10\" alt=\"F\" style=\"margin-bottom:-1px\" />");
          }
          buf2 += '</div>';
        }
        side.totalPokemon = side.pokemon.length;
        if (textBuf) {
          this.log.addDiv('chat battle-history', "<strong>".concat(BattleLog.escapeHTML(side.name), "'s team:</strong> <em style=\"color:#445566;display:block;\">").concat(BattleLog.escapeHTML(textBuf), "</em>"));
        }
        this.$sprites[spriteIndex].html(buf + buf2);
        if (!newBGNum) {
          if (ludicoloCount >= 2) {
            newBGNum = -3;
          } else if (ludicoloCount + lombreCount >= 2) {
            newBGNum = -2;
          }
        }
      }
      if (newBGNum !== 0) {
        this.setBgm(newBGNum);
      }
      this.wait(1000);
      this.updateSidebars();
    }
  }, {
    key: "showJoinButtons",
    value: function showJoinButtons() {
      if (!this.battle.joinButtons) return;
      if (this.battle.ended || this.battle.rated) return;
      if (!this.battle.p1.name) {
        this.$battle.append('<div class="playbutton1"><button name="joinBattle">Join Battle</button></div>');
      }
      if (!this.battle.p2.name) {
        this.$battle.append('<div class="playbutton2"><button name="joinBattle">Join Battle</button></div>');
      }
    }
  }, {
    key: "hideJoinButtons",
    value: function hideJoinButtons() {
      if (!this.battle.joinButtons) return;
      this.$battle.find('.playbutton1, .playbutton2').remove();
    }
  }, {
    key: "pseudoWeatherLeft",
    value: function pseudoWeatherLeft(pWeather) {
      var buf = "<br />".concat(Dex.moves.get(pWeather[0]).name);
      if (!pWeather[1] && pWeather[2]) {
        pWeather[1] = pWeather[2];
        pWeather[2] = 0;
      }
      if (this.battle.gen < 7 && this.battle.hardcoreMode) return buf;
      if (pWeather[2]) {
        return "".concat(buf, " <small>(").concat(pWeather[1], " or ").concat(pWeather[2], " turns)</small>");
      }
      if (pWeather[1]) {
        return "".concat(buf, " <small>(").concat(pWeather[1], " turn").concat(pWeather[1] === 1 ? '' : 's', ")</small>");
      }
      return buf; // weather not found
    }
  }, {
    key: "sideConditionLeft",
    value: function sideConditionLeft(cond, isFoe, all) {
      if (!cond[2] && !cond[3] && !all) return '';
      var buf = "<br />".concat(isFoe && !all ? "Foe's " : "").concat(Dex.moves.get(cond[0]).name);
      if (this.battle.gen < 7 && this.battle.hardcoreMode) return buf;
      if (!cond[2] && !cond[3]) return buf;
      if (!cond[2] && cond[3]) {
        cond[2] = cond[3];
        cond[3] = 0;
      }
      if (!cond[3]) {
        return "".concat(buf, " <small>(").concat(cond[2], " turn").concat(cond[2] === 1 ? '' : 's', ")</small>");
      }
      return "".concat(buf, " <small>(").concat(cond[2], " or ").concat(cond[3], " turns)</small>");
    }
  }, {
    key: "weatherLeft",
    value: function weatherLeft() {
      if (this.battle.gen < 7 && this.battle.hardcoreMode) return '';
      var weatherhtml = "";
      if (this.battle.weather) {
        var weatherNameTable = {
          sunnyday: 'Sun',
          desolateland: 'Intense Sun',
          raindance: 'Rain',
          primordialsea: 'Heavy Rain',
          sandstorm: 'Sandstorm',
          hail: 'Hail',
          snowscape: 'Snow',
          deltastream: 'Strong Winds'
        };
        weatherhtml = "".concat(weatherNameTable[this.battle.weather] || this.battle.weather);
        if (this.battle.weatherMinTimeLeft !== 0) {
          weatherhtml += " <small>(".concat(this.battle.weatherMinTimeLeft, " or ").concat(this.battle.weatherTimeLeft, " turns)</small>");
        } else if (this.battle.weatherTimeLeft !== 0) {
          weatherhtml += " <small>(".concat(this.battle.weatherTimeLeft, " turn").concat(this.battle.weatherTimeLeft === 1 ? '' : 's', ")</small>");
        }
        var nullifyWeather = this.battle.abilityActive(['Air Lock', 'Cloud Nine']);
        weatherhtml = "".concat(nullifyWeather ? '<s>' : '').concat(weatherhtml).concat(nullifyWeather ? '</s>' : '');
      }
      var _iterator9 = _createForOfIteratorHelper(this.battle.pseudoWeather),
        _step9;
      try {
        for (_iterator9.s(); !(_step9 = _iterator9.n()).done;) {
          var pseudoWeather = _step9.value;
          weatherhtml += this.pseudoWeatherLeft(pseudoWeather);
        }
      } catch (err) {
        _iterator9.e(err);
      } finally {
        _iterator9.f();
      }
      return weatherhtml;
    }
  }, {
    key: "sideConditionsLeft",
    value: function sideConditionsLeft(side, all) {
      var buf = "";
      for (var id in side.sideConditions) {
        buf += this.sideConditionLeft(side.sideConditions[id], side.isFar, all);
      }
      return buf;
    }
  }, {
    key: "upkeepWeather",
    value: function upkeepWeather() {
      var isIntense = ['desolateland', 'primordialsea', 'deltastream'].includes(this.curWeather);
      this.$weather.animate({
        opacity: 1.0
      }, 300).animate({
        opacity: isIntense ? 0.9 : 0.5
      }, 300);
    }
  }, {
    key: "updateWeather",
    value: function updateWeather(instant) {
      var _this3 = this;
      if (!this.animating) return;
      var isIntense = false;
      var weather = this.battle.weather;
      if (this.battle.abilityActive(['Air Lock', 'Cloud Nine'])) {
        weather = '';
      }
      var terrain = '';
      var _iterator10 = _createForOfIteratorHelper(this.battle.pseudoWeather),
        _step10;
      try {
        for (_iterator10.s(); !(_step10 = _iterator10.n()).done;) {
          var pseudoWeatherData = _step10.value;
          terrain = toID(pseudoWeatherData[0]);
        }
      } catch (err) {
        _iterator10.e(err);
      } finally {
        _iterator10.f();
      }
      if (weather === 'desolateland' || weather === 'primordialsea' || weather === 'deltastream') {
        isIntense = true;
      }
      var weatherhtml = this.weatherLeft();
      var _iterator11 = _createForOfIteratorHelper(this.battle.sides),
        _step11;
      try {
        for (_iterator11.s(); !(_step11 = _iterator11.n()).done;) {
          var side = _step11.value;
          weatherhtml += this.sideConditionsLeft(side);
        }
      } catch (err) {
        _iterator11.e(err);
      } finally {
        _iterator11.f();
      }
      if (weatherhtml) weatherhtml = "<br />" + weatherhtml;
      if (instant) {
        this.$weather.html('<em>' + weatherhtml + '</em>');
        if (this.curWeather === weather && this.curTerrain === terrain) return;
        this.$terrain.attr('class', terrain ? 'weather ' + terrain + 'weather' : 'weather');
        this.curTerrain = terrain;
        this.$weather.attr('class', weather ? 'weather ' + weather + 'weather' : 'weather');
        this.$weather.css('opacity', isIntense || !weather ? 0.9 : 0.5);
        this.curWeather = weather;
        return;
      }
      if (weather !== this.curWeather) {
        this.$weather.animate({
          opacity: 0
        }, this.curWeather ? 300 : 100, function () {
          _this3.$weather.html('<em>' + weatherhtml + '</em>');
          _this3.$weather.attr('class', weather ? 'weather ' + weather + 'weather' : 'weather');
          _this3.$weather.animate({
            opacity: isIntense || !weather ? 0.9 : 0.5
          }, 300);
        });
        this.curWeather = weather;
      } else {
        this.$weather.html('<em>' + weatherhtml + '</em>');
      }
      if (terrain !== this.curTerrain) {
        this.$terrain.animate({
          top: 360,
          opacity: 0
        }, this.curTerrain ? 400 : 1, function () {
          _this3.$terrain.attr('class', terrain ? 'weather ' + terrain + 'weather' : 'weather');
          _this3.$terrain.animate({
            top: 0,
            opacity: 1
          }, 400);
        });
        this.curTerrain = terrain;
      }
    }
  }, {
    key: "resetTurn",
    value: function resetTurn() {
      if (this.battle.turn <= 0) {
        this.$turn.html('');
        return;
      }
      this.$turn.html("<div class=\"turn has-tooltip\" data-tooltip=\"field\" data-ownheight=\"1\">Turn ".concat(this.battle.turn, "</div>"));
    }
  }, {
    key: "incrementTurn",
    value: function incrementTurn() {
      if (!this.animating) return;
      var turn = this.battle.turn;
      if (turn <= 0) return;
      var $prevTurn = this.$turn.children();
      var $newTurn = $("<div class=\"turn has-tooltip\" data-tooltip=\"field\" data-ownheight=\"1\">Turn ".concat(turn, "</div>"));
      $newTurn.css({
        opacity: 0,
        left: 160
      });
      this.$turn.append($newTurn);
      $newTurn.animate({
        opacity: 1,
        left: 110
      }, 500).animate({
        opacity: 0.4
      }, 1500);
      $prevTurn.animate({
        opacity: 0,
        left: 60
      }, 500, function () {
        $prevTurn.remove();
      });
      this.updateAcceleration();
      this.wait(500 / this.acceleration);
    }
  }, {
    key: "updateAcceleration",
    value: function updateAcceleration() {
      if (this.battle.turnsSinceMoved > 2) {
        this.acceleration = (this.battle.messageFadeTime < 150 ? 2 : 1) * Math.min(this.battle.turnsSinceMoved - 1, 3);
      } else {
        this.acceleration = this.battle.messageFadeTime < 150 ? 2 : 1;
        if (this.battle.messageFadeTime < 50) this.acceleration = 3;
      }
    }
  }, {
    key: "addPokemonSprite",
    value: function addPokemonSprite(pokemon) {
      var sprite = new PokemonSprite(Dex.getSpriteData(pokemon, pokemon.side.isFar, {
        gen: this.gen,
        mod: this.mod
      }), {
        x: pokemon.side.x,
        y: pokemon.side.y,
        z: pokemon.side.z,
        opacity: 0
      }, this, pokemon.side.isFar);
      if (sprite.$el) this.$sprites[+pokemon.side.isFar].append(sprite.$el);
      return sprite;
    }
  }, {
    key: "addSideCondition",
    value: function addSideCondition(siden, id, instant) {
      if (!this.animating) return;
      var side = this.battle.sides[siden];
      var spriteIndex = +side.isFar;
      var x = side.x;
      var y = side.y;
      if (this.battle.gameType === 'freeforall') {
        x += side.isFar ? 20 : -20;
        if (side.n > 1) {
          x += side.isFar ? -140 : 140;
          y += side.isFar ? 14 : -20;
        }
      }
      switch (id) {
        case 'auroraveil':
          var auroraveil = new Sprite(BattleEffects.auroraveil, {
            display: 'block',
            x: x,
            y: y,
            z: side.behind(-14),
            xscale: 1,
            yscale: 0,
            opacity: 0.1
          }, this);
          this.$spritesFront[spriteIndex].append(auroraveil.$el);
          this.sideConditions[siden][id] = [auroraveil];
          auroraveil.anim({
            opacity: 0.7,
            time: instant ? 0 : 400
          }).anim({
            opacity: 0.3,
            time: instant ? 0 : 300
          });
          break;
        case 'reflect':
          var reflect = new Sprite(BattleEffects.reflect, {
            display: 'block',
            x: x,
            y: y,
            z: side.behind(-17),
            xscale: 1,
            yscale: 0,
            opacity: 0.1
          }, this);
          this.$spritesFront[spriteIndex].append(reflect.$el);
          this.sideConditions[siden][id] = [reflect];
          reflect.anim({
            opacity: 0.7,
            time: instant ? 0 : 400
          }).anim({
            opacity: 0.3,
            time: instant ? 0 : 300
          });
          break;
        case 'safeguard':
          var safeguard = new Sprite(BattleEffects.safeguard, {
            display: 'block',
            x: x,
            y: y,
            z: side.behind(-20),
            xscale: 1,
            yscale: 0,
            opacity: 0.1
          }, this);
          this.$spritesFront[spriteIndex].append(safeguard.$el);
          this.sideConditions[siden][id] = [safeguard];
          safeguard.anim({
            opacity: 0.7,
            time: instant ? 0 : 400
          }).anim({
            opacity: 0.3,
            time: instant ? 0 : 300
          });
          break;
        case 'lightscreen':
          var lightscreen = new Sprite(BattleEffects.lightscreen, {
            display: 'block',
            x: x,
            y: y,
            z: side.behind(-23),
            xscale: 1,
            yscale: 0,
            opacity: 0.1
          }, this);
          this.$spritesFront[spriteIndex].append(lightscreen.$el);
          this.sideConditions[siden][id] = [lightscreen];
          lightscreen.anim({
            opacity: 0.7,
            time: instant ? 0 : 400
          }).anim({
            opacity: 0.3,
            time: instant ? 0 : 300
          });
          break;
        case 'mist':
          var mist = new Sprite(BattleEffects.mist, {
            display: 'block',
            x: x,
            y: y,
            z: side.behind(-27),
            xscale: 1,
            yscale: 0,
            opacity: 0.1
          }, this);
          this.$spritesFront[spriteIndex].append(mist.$el);
          this.sideConditions[siden][id] = [mist];
          mist.anim({
            opacity: 0.7,
            time: instant ? 0 : 400
          }).anim({
            opacity: 0.3,
            time: instant ? 0 : 300
          });
          break;
        case 'stealthrock':
          var rock1 = new Sprite(BattleEffects.rock1, {
            display: 'block',
            x: x + side.leftof(-40),
            y: y - 10,
            z: side.z,
            opacity: 0.5,
            scale: 0.2
          }, this);
          var rock2 = new Sprite(BattleEffects.rock2, {
            display: 'block',
            x: x + side.leftof(-20),
            y: y - 40,
            z: side.z,
            opacity: 0.5,
            scale: 0.2
          }, this);
          var rock3 = new Sprite(BattleEffects.rock1, {
            display: 'block',
            x: x + side.leftof(30),
            y: y - 20,
            z: side.z,
            opacity: 0.5,
            scale: 0.2
          }, this);
          var rock4 = new Sprite(BattleEffects.rock2, {
            display: 'block',
            x: x + side.leftof(10),
            y: y - 30,
            z: side.z,
            opacity: 0.5,
            scale: 0.2
          }, this);
          this.$spritesFront[spriteIndex].append(rock1.$el);
          this.$spritesFront[spriteIndex].append(rock2.$el);
          this.$spritesFront[spriteIndex].append(rock3.$el);
          this.$spritesFront[spriteIndex].append(rock4.$el);
          this.sideConditions[siden][id] = [rock1, rock2, rock3, rock4];
          break;
        case 'gmaxsteelsurge':
          var surge1 = new Sprite(BattleEffects.greenmetal1, {
            display: 'block',
            x: x + side.leftof(-30),
            y: y - 20,
            z: side.z,
            opacity: 0.5,
            scale: 0.8
          }, this);
          var surge2 = new Sprite(BattleEffects.greenmetal2, {
            display: 'block',
            x: x + side.leftof(35),
            y: y - 15,
            z: side.z,
            opacity: 0.5,
            scale: 0.8
          }, this);
          var surge3 = new Sprite(BattleEffects.greenmetal1, {
            display: 'block',
            x: x + side.leftof(50),
            y: y - 10,
            z: side.z,
            opacity: 0.5,
            scale: 0.8
          }, this);
          this.$spritesFront[spriteIndex].append(surge1.$el);
          this.$spritesFront[spriteIndex].append(surge2.$el);
          this.$spritesFront[spriteIndex].append(surge3.$el);
          this.sideConditions[siden][id] = [surge1, surge2, surge3];
          break;
        case 'spikes':
          var spikeArray = this.sideConditions[siden]['spikes'];
          if (!spikeArray) {
            spikeArray = [];
            this.sideConditions[siden]['spikes'] = spikeArray;
          }
          var levels = this.battle.sides[siden].sideConditions['spikes'][1];
          if (spikeArray.length < 1 && levels >= 1) {
            var spike1 = new Sprite(BattleEffects.caltrop, {
              display: 'block',
              x: x - 25,
              y: y - 40,
              z: side.z,
              scale: 0.3
            }, this);
            this.$spritesFront[spriteIndex].append(spike1.$el);
            spikeArray.push(spike1);
          }
          if (spikeArray.length < 2 && levels >= 2) {
            var spike2 = new Sprite(BattleEffects.caltrop, {
              display: 'block',
              x: x + 30,
              y: y - 45,
              z: side.z,
              scale: 0.3
            }, this);
            this.$spritesFront[spriteIndex].append(spike2.$el);
            spikeArray.push(spike2);
          }
          if (spikeArray.length < 3 && levels >= 3) {
            var spike3 = new Sprite(BattleEffects.caltrop, {
              display: 'block',
              x: x + 50,
              y: y - 40,
              z: side.z,
              scale: 0.3
            }, this);
            this.$spritesFront[spriteIndex].append(spike3.$el);
            spikeArray.push(spike3);
          }
          break;
        case 'toxicspikes':
          var tspikeArray = this.sideConditions[siden]['toxicspikes'];
          if (!tspikeArray) {
            tspikeArray = [];
            this.sideConditions[siden]['toxicspikes'] = tspikeArray;
          }
          var tspikeLevels = this.battle.sides[siden].sideConditions['toxicspikes'][1];
          if (tspikeArray.length < 1 && tspikeLevels >= 1) {
            var tspike1 = new Sprite(BattleEffects.poisoncaltrop, {
              display: 'block',
              x: x + 5,
              y: y - 40,
              z: side.z,
              scale: 0.3
            }, this);
            this.$spritesFront[spriteIndex].append(tspike1.$el);
            tspikeArray.push(tspike1);
          }
          if (tspikeArray.length < 2 && tspikeLevels >= 2) {
            var tspike2 = new Sprite(BattleEffects.poisoncaltrop, {
              display: 'block',
              x: x - 15,
              y: y - 35,
              z: side.z,
              scale: 0.3
            }, this);
            this.$spritesFront[spriteIndex].append(tspike2.$el);
            tspikeArray.push(tspike2);
          }
          break;
        case 'stickyweb':
          var web = new Sprite(BattleEffects.web, {
            display: 'block',
            x: x + 15,
            y: y - 35,
            z: side.z,
            opacity: 0.4,
            scale: 0.7
          }, this);
          this.$spritesFront[spriteIndex].append(web.$el);
          this.sideConditions[siden][id] = [web];
          break;
      }
    }
  }, {
    key: "removeSideCondition",
    value: function removeSideCondition(siden, id) {
      if (!this.animating) return;
      if (this.sideConditions[siden][id]) {
        var _iterator12 = _createForOfIteratorHelper(this.sideConditions[siden][id]),
          _step12;
        try {
          for (_iterator12.s(); !(_step12 = _iterator12.n()).done;) {
            var sprite = _step12.value;
            sprite.destroy();
          }
        } catch (err) {
          _iterator12.e(err);
        } finally {
          _iterator12.f();
        }
        delete this.sideConditions[siden][id];
      }
    }
  }, {
    key: "resetSideConditions",
    value: function resetSideConditions() {
      for (var siden = 0; siden < this.sideConditions.length; siden++) {
        for (var id in this.sideConditions[siden]) {
          this.removeSideCondition(siden, id);
        }
        for (var _id in this.battle.sides[siden].sideConditions) {
          this.addSideCondition(siden, _id, true);
        }
      }
    }
  }, {
    key: "typeAnim",
    value: function typeAnim(pokemon, types) {
      var result = BattleLog.escapeHTML(types).split('/').map(function (type) {
        return "<img src=\"".concat(Dex.resourcePrefix, "sprites/types/").concat(encodeURIComponent(type), ".png\" alt=\"").concat(type, "\" class=\"pixelated\" />");
      }).join(' ');
      this.resultAnim(pokemon, result, 'neutral');
    }
  }, {
    key: "resultAnim",
    value: function resultAnim(pokemon, result, type) {
      if (!this.animating) return;
      var $effect = $('<div class="result ' + type + 'result"><strong>' + result + '</strong></div>');
      this.$fx.append($effect);
      $effect.delay(this.timeOffset).css({
        display: 'block',
        opacity: 0,
        top: pokemon.sprite.top - 5,
        left: pokemon.sprite.left - 75
      }).animate({
        opacity: 1
      }, 1);
      $effect.animate({
        opacity: 0,
        top: pokemon.sprite.top - 65
      }, 1000, 'swing');
      this.wait(this.acceleration < 2 ? 350 : 250);
      pokemon.sprite.updateStatbar(pokemon);
      if (this.acceleration < 3) this.waitFor($effect);
    }
  }, {
    key: "abilityActivateAnim",
    value: function abilityActivateAnim(pokemon, result) {
      if (!this.animating) return;
      this.$fx.append("<div class=\"result abilityresult\"><strong>".concat(result, "</strong></div>"));
      var $effect = this.$fx.children().last();
      $effect.delay(this.timeOffset).css({
        display: 'block',
        opacity: 0,
        top: pokemon.sprite.top + 15,
        left: pokemon.sprite.left - 75
      }).animate({
        opacity: 1
      }, 1);
      $effect.delay(800).animate({
        opacity: 0
      }, 400, 'swing');
      this.wait(100);
      pokemon.sprite.updateStatbar(pokemon);
      if (this.acceleration < 3) this.waitFor($effect);
    }
  }, {
    key: "damageAnim",
    value: function damageAnim(pokemon, damage) {
      if (!this.animating) return;
      if (!pokemon.sprite.$statbar) return;
      pokemon.sprite.updateHPText(pokemon);
      var $hp = pokemon.sprite.$statbar.find('div.hp');
      var w = pokemon.hpWidth(150);
      var hpcolor = BattleScene.getHPColor(pokemon);
      var callback;
      if (hpcolor === 'y') {
        callback = function callback() {
          $hp.addClass('hp-yellow');
        };
      }
      if (hpcolor === 'r') {
        callback = function callback() {
          $hp.addClass('hp-yellow hp-red');
        };
      }
      if (damage === '100%' && pokemon.hp > 0) damage = '99%';
      this.resultAnim(pokemon, this.battle.hardcoreMode ? 'Damage' : "&minus;".concat(damage), 'bad');
      $hp.animate({
        width: w,
        'border-right-width': w ? 1 : 0
      }, 350, callback);
    }
  }, {
    key: "healAnim",
    value: function healAnim(pokemon, damage) {
      if (!this.animating) return;
      if (!pokemon.sprite.$statbar) return;
      pokemon.sprite.updateHPText(pokemon);
      var $hp = pokemon.sprite.$statbar.find('div.hp');
      var w = pokemon.hpWidth(150);
      var hpcolor = BattleScene.getHPColor(pokemon);
      var callback;
      if (hpcolor === 'g') {
        callback = function callback() {
          $hp.removeClass('hp-yellow hp-red');
        };
      }
      if (hpcolor === 'y') {
        callback = function callback() {
          $hp.removeClass('hp-red');
        };
      }
      this.resultAnim(pokemon, this.battle.hardcoreMode ? 'Heal' : "+".concat(damage), 'good');
      $hp.animate({
        width: w,
        'border-right-width': w ? 1 : 0
      }, 350, callback);
    }

    // Sprite methods
    /////////////////////////////////////////////////////////////////////
  }, {
    key: "removeEffect",
    value: function removeEffect(pokemon, id, instant) {
      return pokemon.sprite.removeEffect(id, instant);
    }
  }, {
    key: "addEffect",
    value: function addEffect(pokemon, id, instant) {
      return pokemon.sprite.addEffect(id, instant);
    }
  }, {
    key: "animSummon",
    value: function animSummon(pokemon, slot, instant) {
      return pokemon.sprite.animSummon(pokemon, slot, instant);
    }
  }, {
    key: "animUnsummon",
    value: function animUnsummon(pokemon, instant) {
      return pokemon.sprite.animUnsummon(pokemon, instant);
    }
  }, {
    key: "animDragIn",
    value: function animDragIn(pokemon, slot) {
      return pokemon.sprite.animDragIn(pokemon, slot);
    }
  }, {
    key: "animDragOut",
    value: function animDragOut(pokemon) {
      return pokemon.sprite.animDragOut(pokemon);
    }
  }, {
    key: "resetStatbar",
    value: function resetStatbar(pokemon, startHidden) {
      return pokemon.sprite.resetStatbar(pokemon, startHidden);
    }
  }, {
    key: "updateStatbar",
    value: function updateStatbar(pokemon, updatePrevhp, updateHp) {
      return pokemon.sprite.updateStatbar(pokemon, updatePrevhp, updateHp);
    }
  }, {
    key: "updateStatbarIfExists",
    value: function updateStatbarIfExists(pokemon, updatePrevhp, updateHp) {
      return pokemon.sprite.updateStatbarIfExists(pokemon, updatePrevhp, updateHp);
    }
  }, {
    key: "animTransform",
    value: function animTransform(pokemon, useSpeciesAnim, isPermanent) {
      return pokemon.sprite.animTransform(pokemon, useSpeciesAnim, isPermanent);
    }
  }, {
    key: "clearEffects",
    value: function clearEffects(pokemon) {
      return pokemon.sprite.clearEffects();
    }
  }, {
    key: "removeTransform",
    value: function removeTransform(pokemon) {
      return pokemon.sprite.removeTransform();
    }
  }, {
    key: "animFaint",
    value: function animFaint(pokemon) {
      return pokemon.sprite.animFaint(pokemon);
    }
  }, {
    key: "animReset",
    value: function animReset(pokemon) {
      return pokemon.sprite.animReset();
    }
  }, {
    key: "anim",
    value: function anim(pokemon, end, transition) {
      return pokemon.sprite.anim(end, transition);
    }
  }, {
    key: "beforeMove",
    value: function beforeMove(pokemon) {
      return pokemon.sprite.beforeMove();
    }
  }, {
    key: "afterMove",
    value: function afterMove(pokemon) {
      return pokemon.sprite.afterMove();
    }

    // Misc
    /////////////////////////////////////////////////////////////////////
  }, {
    key: "setFrameHTML",
    value: function setFrameHTML(html) {
      this.customControls = true;
      this.$frame.html(html);
    }
  }, {
    key: "setControlsHTML",
    value: function setControlsHTML(html) {
      this.customControls = true;
      var $controls = this.$frame.parent().children('.battle-controls');
      $controls.html(html);
    }
  }, {
    key: "preloadImage",
    value: function preloadImage(url) {
      var _this4 = this;
      var token = url.replace(/\.(gif|png)$/, '').replace(/\//g, '-');
      if (this.preloadCache[token]) {
        return;
      }
      this.preloadNeeded++;
      this.preloadCache[token] = new Image();
      this.preloadCache[token].onload = function () {
        _this4.preloadDone++;
      };
      this.preloadCache[token].src = url;
    }
  }, {
    key: "preloadEffects",
    value: function preloadEffects() {
      for (var i in BattleEffects) {
        if (i === 'alpha' || i === 'omega') continue;
        var url = BattleEffects[i].url;
        if (url) this.preloadImage(url);
      }
      this.preloadImage(Dex.resourcePrefix + 'sprites/ani/substitute.gif');
      this.preloadImage(Dex.resourcePrefix + 'sprites/ani-back/substitute.gif');
    }
  }, {
    key: "rollBgm",
    value: function rollBgm() {
      this.setBgm(1 + this.numericId % 15);
    }
  }, {
    key: "setBgm",
    value: function setBgm(bgmNum) {
      if (this.bgmNum === bgmNum) return;
      this.bgmNum = bgmNum;
      switch (bgmNum) {
        case -1:
          this.bgm = BattleSound.loadBgm('audio/bw2-homika-dogars.mp3', 1661, 68131, this.bgm);
          break;
        case -2:
          this.bgm = BattleSound.loadBgm('audio/xd-miror-b.mp3', 9000, 57815, this.bgm);
          break;
        case -3:
          this.bgm = BattleSound.loadBgm('audio/colosseum-miror-b.mp3', 896, 47462, this.bgm);
          break;
        case 1:
          this.bgm = BattleSound.loadBgm('audio/dpp-trainer.mp3', 13440, 96959, this.bgm);
          break;
        case 2:
          this.bgm = BattleSound.loadBgm('audio/dpp-rival.mp3', 13888, 66352, this.bgm);
          break;
        case 3:
          this.bgm = BattleSound.loadBgm('audio/hgss-johto-trainer.mp3', 23731, 125086, this.bgm);
          break;
        case 4:
          this.bgm = BattleSound.loadBgm('audio/hgss-kanto-trainer.mp3', 13003, 94656, this.bgm);
          break;
        case 5:
          this.bgm = BattleSound.loadBgm('audio/bw-trainer.mp3', 14629, 110109, this.bgm);
          break;
        case 6:
          this.bgm = BattleSound.loadBgm('audio/bw-rival.mp3', 19180, 57373, this.bgm);
          break;
        case 7:
          this.bgm = BattleSound.loadBgm('audio/bw-subway-trainer.mp3', 15503, 110984, this.bgm);
          break;
        case 8:
          this.bgm = BattleSound.loadBgm('audio/bw2-kanto-gym-leader.mp3', 14626, 58986, this.bgm);
          break;
        case 9:
          this.bgm = BattleSound.loadBgm('audio/bw2-rival.mp3', 7152, 68708, this.bgm);
          break;
        case 10:
          this.bgm = BattleSound.loadBgm('audio/xy-trainer.mp3', 7802, 82469, this.bgm);
          break;
        case 11:
          this.bgm = BattleSound.loadBgm('audio/xy-rival.mp3', 7802, 58634, this.bgm);
          break;
        case 12:
          this.bgm = BattleSound.loadBgm('audio/oras-trainer.mp3', 13579, 91548, this.bgm);
          break;
        case 13:
          this.bgm = BattleSound.loadBgm('audio/oras-rival.mp3', 14303, 69149, this.bgm);
          break;
        case 14:
          this.bgm = BattleSound.loadBgm('audio/sm-trainer.mp3', 8323, 89230, this.bgm);
          break;
        case -101:
          this.bgm = BattleSound.loadBgm('audio/spl-elite4.mp3', 3962, 152509, this.bgm);
          break;
        case 15:
        default:
          this.bgm = BattleSound.loadBgm('audio/sm-rival.mp3', 11389, 62158, this.bgm);
          break;
      }
      this.updateBgm();
    }
  }, {
    key: "updateBgm",
    value: function updateBgm() {
      /**
       * - not playing in non-battle RoomGames before `|start` (turn -1)
       * - not playing at team preview in replays (paused)
       * - playing at team preview in games (turn 0)
       * - playing during the game (turn 1+)
       * - not playing while paused
       * - playing while waiting for players to choose moves (atQueueEnd && !ended)
       * - not playing after the game has ended
       */
      var nowPlaying = this.battle.turn >= 0 && !this.battle.ended && !this.battle.paused;
      if (nowPlaying) {
        if (!this.bgm) this.rollBgm();
        this.bgm.resume();
      } else if (this.bgm) {
        this.bgm.pause();
      }
    }
  }, {
    key: "resetBgm",
    value: function resetBgm() {
      if (this.bgm) this.bgm.stop();
    }
  }, {
    key: "destroy",
    value: function destroy() {
      this.log.destroy();
      if (this.$frame) {
        this.$frame.empty();
        // listeners set by BattleTooltips
        this.$frame.off();
      }
      if (this.bgm) {
        this.bgm.destroy();
        this.bgm = null;
      }
      this.battle = null;
    }
  }], [{
    key: "getHPColor",
    value: function getHPColor(pokemon) {
      if (pokemon.hpcolor) return pokemon.hpcolor;
      var ratio = pokemon.hp / pokemon.maxhp;
      if (ratio > 0.5) return 'g';
      if (ratio > 0.2) return 'y';
      return 'r';
    }
  }]);
}();
var Sprite = /*#__PURE__*/function () {
  function Sprite(spriteData, pos, scene) {
    _classCallCheck(this, Sprite);
    _defineProperty(this, "$el", null);
    this.scene = scene;
    var sp = null;
    if (spriteData) {
      sp = spriteData;
      var rawHTML = sp.rawHTML || "<img src=\"".concat(sp.url, "\" style=\"display:none;position:absolute\"").concat(sp.pixelated ? ' class="pixelated"' : '', " />");
      this.$el = $(rawHTML);
    } else {
      sp = {
        w: 0,
        h: 0,
        url: ''
      };
    }
    this.sp = sp;
    this.x = pos.x;
    this.y = pos.y;
    this.z = pos.z;
    if (pos.opacity !== 0 && spriteData) this.$el.css(scene.pos(pos, sp));
    if (!spriteData) {
      this.delay = function () {
        return this;
      };
      this.anim = function () {
        return this;
      };
    }
  }
  return _createClass(Sprite, [{
    key: "destroy",
    value: function destroy() {
      if (this.$el) this.$el.remove();
      this.$el = null;
      this.scene = null;
    }
  }, {
    key: "delay",
    value: function delay(time) {
      this.$el.delay(time);
      return this;
    }
  }, {
    key: "anim",
    value: function anim(end, transition) {
      end = _objectSpread({
        x: this.x,
        y: this.y,
        z: this.z,
        scale: 1,
        opacity: 1,
        time: 500
      }, end);
      if (end.time === 0) {
        this.$el.css(this.scene.pos(end, this.sp));
        return this;
      }
      this.$el.animate(this.scene.posT(end, this.sp, transition, this), end.time);
      return this;
    }
  }]);
}();
var PokemonSprite = /*#__PURE__*/function (_Sprite2) {
  function PokemonSprite(spriteData, pos, scene, isFrontSprite) {
    var _this5;
    _classCallCheck(this, PokemonSprite);
    _this5 = _callSuper(this, PokemonSprite, [spriteData, pos, scene]);
    _defineProperty(_this5, "forme", '');
    _defineProperty(_this5, "cryurl", undefined);
    _defineProperty(_this5, "subsp", null);
    _defineProperty(_this5, "$sub", null);
    _defineProperty(_this5, "isSubActive", false);
    _defineProperty(_this5, "$statbar", null);
    _defineProperty(_this5, "isMissedPokemon", false);
    /**
     * If the pokemon is transformed, sprite.sp will be the transformed
     * SpriteData and sprite.oldsp will hold the original form's SpriteData
     */
    _defineProperty(_this5, "oldsp", null);
    _defineProperty(_this5, "statbarLeft", 0);
    _defineProperty(_this5, "statbarTop", 0);
    _defineProperty(_this5, "left", 0);
    _defineProperty(_this5, "top", 0);
    _defineProperty(_this5, "effects", {});
    _this5.cryurl = _this5.sp.cryurl;
    _this5.isFrontSprite = isFrontSprite;
    return _this5;
  }
  _inherits(PokemonSprite, _Sprite2);
  return _createClass(PokemonSprite, [{
    key: "destroy",
    value: function destroy() {
      if (this.$el) this.$el.remove();
      this.$el = null;
      if (this.$statbar) this.$statbar.remove();
      this.$statbar = null;
      if (this.$sub) this.$sub.remove();
      this.$sub = null;
      this.scene = null;
    }
  }, {
    key: "delay",
    value: function delay(time) {
      this.$el.delay(time);
      if (this.$sub) this.$sub.delay(time);
      return this;
    }
  }, {
    key: "anim",
    value: function anim(end, transition) {
      end = _objectSpread({
        x: this.x,
        y: this.y,
        z: this.z,
        scale: 1,
        opacity: 1,
        time: 500
      }, end);
      var _ref = this.isSubActive ? [this.$sub, this.subsp] : [this.$el, this.sp],
        _ref2 = _slicedToArray(_ref, 2),
        $el = _ref2[0],
        sp = _ref2[1];
      $el.animate(this.scene.posT(end, sp, transition, this), end.time);
      return this;
    }
  }, {
    key: "behindx",
    value: function behindx(offset) {
      return this.x + (this.isFrontSprite ? 1 : -1) * offset;
    }
  }, {
    key: "behindy",
    value: function behindy(offset) {
      return this.y + (this.isFrontSprite ? -1 : 1) * offset;
    }
  }, {
    key: "leftof",
    value: function leftof(offset) {
      return this.x + (this.isFrontSprite ? 1 : -1) * offset;
    }
  }, {
    key: "behind",
    value: function behind(offset) {
      return this.z + (this.isFrontSprite ? 1 : -1) * offset;
    }
  }, {
    key: "removeTransform",
    value: function removeTransform() {
      if (!this.scene.animating) return;
      if (!this.oldsp) return;
      var sp = this.oldsp;
      this.cryurl = sp.cryurl;
      this.sp = sp;
      this.oldsp = null;
      var $el = this.isSubActive ? this.$sub : this.$el;
      $el.attr('src', sp.url);
      $el.css(this.scene.pos({
        x: this.x,
        y: this.y,
        z: this.isSubActive ? this.behind(30) : this.z,
        opacity: this.$sub ? 0.3 : 1
      }, sp));
    }
  }, {
    key: "animSub",
    value: function animSub(instant, noAnim) {
      if (!this.scene.animating) return;
      if (this.$sub) return;
      var subsp = Dex.getSpriteData('substitute', this.isFrontSprite, {
        gen: this.scene.gen,
        mod: this.scene.mod
      });
      this.subsp = subsp;
      this.$sub = $('<img src="' + subsp.url + '" style="display:block;opacity:0;position:absolute"' + (subsp.pixelated ? ' class="pixelated"' : '') + ' />');
      this.scene.$spritesFront[+this.isFrontSprite].append(this.$sub);
      this.isSubActive = true;
      if (instant) {
        if (!noAnim) this.animReset();
        return;
      }
      this.$el.animate(this.scene.pos({
        x: this.x,
        y: this.y,
        z: this.behind(30),
        opacity: 0.3
      }, this.sp), 500);
      this.$sub.css(this.scene.pos({
        x: this.x,
        y: this.y + 50,
        z: this.z,
        opacity: 0
      }, subsp));
      this.$sub.animate(this.scene.pos({
        x: this.x,
        y: this.y,
        z: this.z
      }, subsp), 500);
      this.scene.waitFor(this.$sub);
    }
  }, {
    key: "animSubFade",
    value: function animSubFade(instant) {
      if (!this.$sub || !this.scene.animating) return;
      this.isSubActive = false;
      if (instant) {
        this.$sub.remove();
        this.$sub = null;
        this.animReset();
        return;
      }
      if (this.scene.timeOffset) {
        this.$el.delay(this.scene.timeOffset);
        this.$sub.delay(this.scene.timeOffset);
      }
      this.$sub.animate(this.scene.pos({
        x: this.x,
        y: this.y - 50,
        z: this.z,
        opacity: 0
      }, this.subsp), 500);
      this.$sub = null;
      this.anim({
        time: 500
      });
      if (this.scene.animating) this.scene.waitFor(this.$el);
    }
  }, {
    key: "beforeMove",
    value: function beforeMove() {
      if (!this.scene.animating) return false;
      if (!this.isSubActive) return false;
      this.isSubActive = false;
      this.anim({
        time: 300
      });
      this.$sub.animate(this.scene.pos({
        x: this.leftof(-50),
        y: this.y,
        z: this.z,
        opacity: 0.5
      }, this.subsp), 300);
      var _iterator13 = _createForOfIteratorHelper(this.scene.battle.sides),
        _step13;
      try {
        for (_iterator13.s(); !(_step13 = _iterator13.n()).done;) {
          var side = _step13.value;
          var _iterator14 = _createForOfIteratorHelper(side.active),
            _step14;
          try {
            for (_iterator14.s(); !(_step14 = _iterator14.n()).done;) {
              var active = _step14.value;
              if (active && active.sprite !== this) {
                active.sprite.delay(300);
              }
            }
          } catch (err) {
            _iterator14.e(err);
          } finally {
            _iterator14.f();
          }
        }
      } catch (err) {
        _iterator13.e(err);
      } finally {
        _iterator13.f();
      }
      this.scene.wait(300);
      this.scene.waitFor(this.$el);
      return true;
    }
  }, {
    key: "afterMove",
    value: function afterMove() {
      var _this6 = this;
      if (!this.scene.animating) return false;
      if (!this.$sub || this.isSubActive) return false;
      this.isSubActive = true;
      this.$sub.delay(300);
      this.$el.add(this.$sub).promise().done(function () {
        if (!_this6.$sub || !_this6.$el) return;
        _this6.$el.animate(_this6.scene.pos({
          x: _this6.x,
          y: _this6.y,
          z: _this6.behind(30),
          opacity: 0.3
        }, _this6.sp), 300);
        _this6.anim({
          time: 300
        });
      });
      return false;
    }
  }, {
    key: "removeSub",
    value: function removeSub() {
      if (!this.$sub) return;
      this.isSubActive = false;
      if (!this.scene.animating) {
        this.$sub.remove();
      } else {
        var $sub = this.$sub;
        $sub.animate({
          opacity: 0
        }, function () {
          $sub.remove();
        });
      }
      this.$sub = null;
    }
  }, {
    key: "reset",
    value: function reset(pokemon) {
      this.clearEffects();
      if (pokemon.volatiles.formechange || pokemon.volatiles.dynamax || pokemon.volatiles.terastallize) {
        if (!this.oldsp) this.oldsp = this.sp;
        this.sp = Dex.getSpriteData(pokemon, this.isFrontSprite, {
          gen: this.scene.gen,
          mod: this.scene.mod
        });
      } else if (this.oldsp) {
        this.sp = this.oldsp;
        this.oldsp = null;
      }

      // I can rant for ages about how jQuery sucks, necessitating this function
      // The short version is: after calling elem.finish() on an animating
      // element, there appear to be a grand total of zero ways to hide it
      // afterwards. I've tried `elem.css('display', 'none')`, `elem.hide()`,
      // `elem.hide(1)`, `elem.hide(1000)`, `elem.css('opacity', 0)`,
      // `elem.animate({opacity: 0}, 1000)`.
      // They literally all do nothing, and the element retains
      // a style attribute containing `display: inline-block` and `opacity: 1`
      // Only forcibly removing the element from the DOM actually makes it
      // disappear, so that's what we do.
      if (this.$el) {
        this.$el.stop(true, false);
        this.$el.remove();
        var $newEl = $("<img src=\"".concat(this.sp.url, "\" style=\"display:none;position:absolute\"").concat(this.sp.pixelated ? ' class="pixelated"' : '', " />"));
        this.$el = $newEl;
      }
      if (!pokemon.isActive()) {
        if (this.$statbar) {
          this.$statbar.remove();
          this.$statbar = null;
        }
        return;
      }
      if (this.$el) this.scene.$sprites[+this.isFrontSprite].append(this.$el);
      this.recalculatePos(pokemon.slot);
      this.resetStatbar(pokemon);
      this.$el.css(this.scene.pos({
        display: 'block',
        x: this.x,
        y: this.y,
        z: this.z
      }, this.sp));
      for (var id in pokemon.volatiles) this.addEffect(id, true);
      for (var _id2 in pokemon.turnstatuses) this.addEffect(_id2, true);
      for (var _id3 in pokemon.movestatuses) this.addEffect(_id3, true);
    }
  }, {
    key: "animReset",
    value: function animReset() {
      if (!this.scene.animating) return;
      if (this.$sub) {
        this.isSubActive = true;
        this.$el.stop(true, false);
        this.$sub.stop(true, false);
        this.$el.css(this.scene.pos({
          x: this.x,
          y: this.y,
          z: this.behind(30),
          opacity: 0.3
        }, this.sp));
        this.$sub.css(this.scene.pos({
          x: this.x,
          y: this.y,
          z: this.z
        }, this.subsp));
      } else {
        this.$el.stop(true, false);
        this.$el.css(this.scene.pos({
          x: this.x,
          y: this.y,
          z: this.z
        }, this.sp));
      }
    }
  }, {
    key: "recalculatePos",
    value: function recalculatePos(slot) {
      var moreActive = this.scene.activeCount - 1;
      var statbarOffset = 0;
      var isFFA = this.scene.battle.gameType === 'freeforall';
      if (isFFA) {
        // create a gap between Pokemon on the same "side" as a distinction between FFA and Multi battles
        moreActive++;
        if (slot) slot++;
      }
      if (this.scene.gen <= 4 && moreActive) {
        this.x = (slot - 0.52) * (this.isFrontSprite ? 1 : -1) * -55;
        this.y = (this.isFrontSprite ? 1 : -1) + 1;
        if (this.isFrontSprite) statbarOffset = 30 * slot;
        if (!this.isFrontSprite) statbarOffset = -28 * slot;
      } else {
        switch (moreActive) {
          case 0:
            this.x = 0;
            break;
          case 1:
            if (this.sp.pixelated) {
              this.x = (slot * -100 + 18) * (this.isFrontSprite ? 1 : -1);
            } else {
              this.x = (slot * -75 + 18) * (this.isFrontSprite ? 1 : -1);
            }
            break;
          case 2:
            this.x = (slot * -70 + 20) * (this.isFrontSprite ? 1 : -1);
            break;
        }
        this.y = this.isFrontSprite ? slot * 7 : slot * -10;
        if (this.isFrontSprite) statbarOffset = 17 * slot;
        if (this.isFrontSprite && !moreActive && this.sp.pixelated) statbarOffset = 15;
        if (!this.isFrontSprite) statbarOffset = -7 * slot;
        if (this.isFrontSprite && moreActive === 2) statbarOffset = 14 * slot - 10;
      }
      if (this.scene.gen <= 2) {
        statbarOffset += this.isFrontSprite ? 20 : 1;
      } else if (this.scene.gen <= 3) {
        statbarOffset += this.isFrontSprite ? 30 : 5;
      } else if (this.scene.gen !== 5) {
        statbarOffset += this.isFrontSprite ? 30 : 20;
      }
      var pos = this.scene.pos({
        x: this.x,
        y: this.y,
        z: this.z
      }, {
        w: 0,
        h: 96
      });
      pos.top += 40;
      this.left = pos.left;
      this.top = pos.top;
      this.statbarLeft = pos.left - 80;
      this.statbarTop = pos.top - 73 - statbarOffset;
      if (this.statbarTop < -4) this.statbarTop = -4;
      if (moreActive) {
        // make sure element is in the right z-order
        if (!!slot === this.isFrontSprite) {
          this.$el.prependTo(this.$el.parent());
        } else {
          this.$el.appendTo(this.$el.parent());
        }
      }
    }
  }, {
    key: "animSummon",
    value: function animSummon(pokemon, slot, instant) {
      if (!this.scene.animating) return;
      this.scene.$sprites[+this.isFrontSprite].append(this.$el);
      this.recalculatePos(slot);

      // 'z-index': (this.isFrontSprite ? 4-slot : 1+slot),
      if (instant) {
        this.$el.css('display', 'block');
        this.animReset();
        this.resetStatbar(pokemon);
        if (pokemon.hasVolatile('substitute')) this.animSub(true);
        return;
      }
      if (this.cryurl) {
        BattleSound.playEffect(this.cryurl);
      }
      this.$el.css(this.scene.pos({
        display: 'block',
        x: this.x,
        y: this.y - 10,
        z: this.z,
        scale: 0,
        opacity: 0
      }, this.sp));
      this.scene.showEffect('pokeball', {
        opacity: 0,
        x: this.x,
        y: this.y + 30,
        z: this.behind(50),
        scale: 0.7
      }, {
        opacity: 1,
        x: this.x,
        y: this.y - 10,
        z: this.z,
        time: 300 / this.scene.acceleration
      }, 'ballistic2', 'fade');
      if (this.scene.gen <= 4) {
        this.delay(this.scene.timeOffset + 300 / this.scene.acceleration).anim({
          x: this.x,
          y: this.y,
          z: this.z,
          time: 400 / this.scene.acceleration
        });
      } else {
        this.delay(this.scene.timeOffset + 300 / this.scene.acceleration).anim({
          x: this.x,
          y: this.y + 30,
          z: this.z,
          time: 400 / this.scene.acceleration
        }).anim({
          x: this.x,
          y: this.y,
          z: this.z,
          time: 300 / this.scene.acceleration
        }, 'accel');
      }
      if (this.sp.shiny && this.scene.acceleration < 2) BattleOtherAnims.shiny.anim(this.scene, [this]);
      this.scene.waitFor(this.$el);
      if (pokemon.hasVolatile('substitute')) {
        this.animSub(true, true);
        this.$sub.css(this.scene.pos({
          x: this.x,
          y: this.y,
          z: this.z
        }, this.subsp));
        this.$el.animate(this.scene.pos({
          x: this.x,
          y: this.y,
          z: this.behind(30),
          opacity: 0.3
        }, this.sp), 300);
      }
      this.resetStatbar(pokemon, true);
      this.scene.updateSidebar(pokemon.side);
      this.$statbar.css({
        display: 'block',
        left: this.statbarLeft,
        top: this.statbarTop + 20,
        opacity: 0
      });
      this.$statbar.delay(300 / this.scene.acceleration).animate({
        top: this.statbarTop,
        opacity: 1
      }, 400 / this.scene.acceleration);
      this.dogarsCheck(pokemon);
    }
  }, {
    key: "animDragIn",
    value: function animDragIn(pokemon, slot) {
      if (!this.scene.animating) return;
      this.scene.$sprites[+this.isFrontSprite].append(this.$el);
      this.recalculatePos(slot);

      // 'z-index': (this.isFrontSprite ? 4-slot : 1+slot),
      this.$el.css(this.scene.pos({
        display: 'block',
        x: this.leftof(-100),
        y: this.y,
        z: this.z,
        opacity: 0
      }, this.sp));
      this.delay(300).anim({
        x: this.x,
        y: this.y,
        z: this.z,
        time: 400
      }, 'decel');
      if (!!this.scene.animating && this.sp.shiny) BattleOtherAnims.shiny.anim(this.scene, [this]);
      this.scene.waitFor(this.$el);
      this.scene.timeOffset = 700;
      this.resetStatbar(pokemon, true);
      this.scene.updateSidebar(pokemon.side);
      this.$statbar.css({
        display: 'block',
        left: this.statbarLeft + (this.isFrontSprite ? -100 : 100),
        top: this.statbarTop,
        opacity: 0
      });
      this.$statbar.delay(300).animate({
        left: this.statbarLeft,
        opacity: 1
      }, 400);
      this.dogarsCheck(pokemon);
    }
  }, {
    key: "animDragOut",
    value: function animDragOut(pokemon) {
      if (!this.scene.animating) return this.animUnsummon(pokemon, true);
      if (this.$sub) {
        this.isSubActive = false;
        var $sub = this.$sub;
        $sub.animate(this.scene.pos({
          x: this.leftof(100),
          y: this.y,
          z: this.z,
          opacity: 0,
          time: 400
        }, this.subsp), function () {
          $sub.remove();
        });
        this.$sub = null;
      }
      this.anim({
        x: this.leftof(100),
        y: this.y,
        z: this.z,
        opacity: 0,
        time: 400
      }, 'accel');
      this.updateStatbar(pokemon, true);
      var $statbar = this.$statbar;
      if ($statbar) {
        this.$statbar = null;
        $statbar.animate({
          left: this.statbarLeft - (this.isFrontSprite ? -100 : 100),
          opacity: 0
        }, 300 / this.scene.acceleration, function () {
          $statbar.remove();
        });
      }
    }
  }, {
    key: "animUnsummon",
    value: function animUnsummon(pokemon, instant) {
      this.removeSub();
      if (!this.scene.animating || instant) {
        this.$el.hide();
        if (this.$statbar) {
          this.$statbar.remove();
          this.$statbar = null;
        }
        return;
      }
      if (this.scene.gen <= 4) {
        this.anim({
          x: this.x,
          y: this.y - 25,
          z: this.z,
          scale: 0,
          opacity: 0,
          time: 400 / this.scene.acceleration
        });
      } else {
        this.anim({
          x: this.x,
          y: this.y - 40,
          z: this.z,
          scale: 0,
          opacity: 0,
          time: 400 / this.scene.acceleration
        });
      }
      this.scene.showEffect('pokeball', {
        opacity: 1,
        x: this.x,
        y: this.y - 40,
        z: this.z,
        scale: 0.7,
        time: 300 / this.scene.acceleration
      }, {
        opacity: 0,
        x: this.x,
        y: this.y,
        z: this.behind(50),
        time: 700 / this.scene.acceleration
      }, 'ballistic2');
      if (this.scene.acceleration < 3) this.scene.wait(600 / this.scene.acceleration);
      this.updateStatbar(pokemon, true);
      var $statbar = this.$statbar;
      if ($statbar) {
        this.$statbar = null;
        $statbar.animate({
          left: this.statbarLeft + (this.isFrontSprite ? 50 : -50),
          opacity: 0
        }, 300 / this.scene.acceleration, function () {
          $statbar.remove();
        });
      }
    }
  }, {
    key: "animFaint",
    value: function animFaint(pokemon) {
      var _this7 = this;
      this.removeSub();
      if (!this.scene.animating) {
        this.$el.remove();
        if (this.$statbar) {
          this.$statbar.remove();
          this.$statbar = null;
        }
        return;
      }
      this.updateStatbar(pokemon, false, true);
      this.scene.updateSidebar(pokemon.side);
      if (this.cryurl) {
        BattleSound.playEffect(this.cryurl);
      }
      this.anim({
        y: this.y - 80,
        opacity: 0
      }, 'accel');
      this.scene.waitFor(this.$el);
      this.$el.promise().done(function () {
        _this7.$el.remove();
      });
      var $statbar = this.$statbar;
      if ($statbar) {
        this.$statbar = null;
        $statbar.animate({
          opacity: 0
        }, 300, function () {
          $statbar.remove();
        });
      }
    }
    /**
     * @param pokemon
     * @param useSpeciesAnim false = Transform the move or Imposter the ability
     * @param isPermanent false = reverts on switch-out
     */
  }, {
    key: "animTransform",
    value: function animTransform(pokemon, useSpeciesAnim, isPermanent) {
      var _this8 = this;
      if (!this.scene.animating && !isPermanent) return;
      var sp = Dex.getSpriteData(pokemon, this.isFrontSprite, {
        gen: this.scene.gen,
        mod: this.scene.mod
      });
      var oldsp = this.sp;
      if (isPermanent) {
        if (pokemon.volatiles.dynamax) {
          // if a permanent forme change happens while dynamaxed, we need an undynamaxed sprite to go back to
          this.oldsp = Dex.getSpriteData(pokemon, this.isFrontSprite, {
            gen: this.scene.gen,
            mod: this.scene.mod,
            dynamax: false
          });
        } else {
          this.oldsp = null;
        }
      } else if (!this.oldsp) {
        this.oldsp = oldsp;
      }
      this.sp = sp;
      this.cryurl = sp.cryurl;
      if (!this.scene.animating) return;
      var speciesid = toID(pokemon.getSpeciesForme());
      var doCry = false;
      var skipAnim = !pokemon.isActive();
      var scene = this.scene;
      if (useSpeciesAnim && !skipAnim) {
        if (speciesid === 'kyogreprimal') {
          BattleOtherAnims.primalalpha.anim(scene, [this]);
          doCry = true;
        } else if (speciesid === 'groudonprimal') {
          BattleOtherAnims.primalomega.anim(scene, [this]);
          doCry = true;
        } else if (speciesid === 'necrozmaultra') {
          BattleOtherAnims.ultraburst.anim(scene, [this]);
          doCry = true;
        } else if (speciesid === 'zygardecomplete') {
          BattleOtherAnims.powerconstruct.anim(scene, [this]);
        } else if (speciesid === 'wishiwashischool' || speciesid === 'greninjaash') {
          BattleOtherAnims.schoolingin.anim(scene, [this]);
        } else if (speciesid === 'wishiwashi') {
          BattleOtherAnims.schoolingout.anim(scene, [this]);
        } else if (speciesid === 'mimikyubusted' || speciesid === 'mimikyubustedtotem' || speciesid === 'aegislash' || speciesid === 'aegislashblade') {
          // standard animation
        } else if (speciesid === 'palafinhero') {
          skipAnim = true;
        } else {
          BattleOtherAnims.megaevo.anim(scene, [this]);
          doCry = true;
        }
      }
      // Constructing here gives us 300ms extra time to preload the new sprite
      var $newEl = $('<img src="' + sp.url + '" style="display:block;opacity:0;position:absolute"' + (sp.pixelated ? ' class="pixelated"' : '') + ' />');
      $newEl.css(this.scene.pos({
        x: this.x,
        y: this.y,
        z: this.z,
        yscale: 0,
        xscale: 0,
        opacity: 0
      }, sp));
      if (skipAnim) {
        this.$el.replaceWith($newEl);
        this.$el = $newEl;
        this.animReset();
      } else {
        this.$el.animate(this.scene.pos({
          x: this.x,
          y: this.y,
          z: this.z,
          yscale: 0,
          xscale: 0,
          opacity: 0.3
        }, oldsp), 300, function () {
          if (_this8.cryurl && doCry) {
            BattleSound.playEffect(_this8.cryurl);
          }
          _this8.$el.replaceWith($newEl);
          _this8.$el = $newEl;
          _this8.$el.animate(scene.pos({
            x: _this8.x,
            y: _this8.y,
            z: _this8.z,
            opacity: 1
          }, sp), 300);
        });
        this.scene.wait(500);
      }
      this.scene.updateSidebar(pokemon.side);
      if (isPermanent) {
        this.resetStatbar(pokemon);
      } else {
        this.updateStatbar(pokemon);
      }
    }
  }, {
    key: "pokeEffect",
    value: function pokeEffect(id) {
      if (id === 'protect' || id === 'magiccoat') {
        this.effects[id][0].anim({
          scale: 1.2,
          opacity: 1,
          time: 100
        }).anim({
          opacity: 0.4,
          time: 300
        });
      }
    }
  }, {
    key: "addEffect",
    value: function addEffect(id, instant) {
      if (id in this.effects) {
        this.pokeEffect(id);
        return;
      }
      var spriten = +this.isFrontSprite;
      if (id === 'substitute' || id === 'shedtail') {
        this.animSub(instant);
      } else if (id === 'leechseed') {
        var pos1 = {
          display: 'block',
          x: this.x - 30,
          y: this.y - 40,
          z: this.z,
          scale: 0.2,
          opacity: 0.6
        };
        var pos2 = {
          display: 'block',
          x: this.x + 40,
          y: this.y - 35,
          z: this.z,
          scale: 0.2,
          opacity: 0.6
        };
        var pos3 = {
          display: 'block',
          x: this.x + 20,
          y: this.y - 25,
          z: this.z,
          scale: 0.2,
          opacity: 0.6
        };
        var leechseed1 = new Sprite(BattleEffects.energyball, pos1, this.scene);
        var leechseed2 = new Sprite(BattleEffects.energyball, pos2, this.scene);
        var leechseed3 = new Sprite(BattleEffects.energyball, pos3, this.scene);
        this.scene.$spritesFront[spriten].append(leechseed1.$el);
        this.scene.$spritesFront[spriten].append(leechseed2.$el);
        this.scene.$spritesFront[spriten].append(leechseed3.$el);
        this.effects['leechseed'] = [leechseed1, leechseed2, leechseed3];
      } else if (id === 'protect' || id === 'magiccoat') {
        var protect = new Sprite(BattleEffects.protect, {
          display: 'block',
          x: this.x,
          y: this.y,
          z: this.behind(-15),
          xscale: 1,
          yscale: 0,
          opacity: 0.1
        }, this.scene);
        this.scene.$spritesFront[spriten].append(protect.$el);
        this.effects[id] = [protect];
        protect.anim({
          opacity: 0.9,
          time: instant ? 0 : 400
        }).anim({
          opacity: 0.4,
          time: instant ? 0 : 300
        });
      }
    }
  }, {
    key: "removeEffect",
    value: function removeEffect(id, instant) {
      if (id === 'formechange') this.removeTransform();
      if (id === 'substitute') this.animSubFade(instant);
      if (this.effects[id]) {
        var _iterator15 = _createForOfIteratorHelper(this.effects[id]),
          _step15;
        try {
          for (_iterator15.s(); !(_step15 = _iterator15.n()).done;) {
            var sprite = _step15.value;
            sprite.destroy();
          }
        } catch (err) {
          _iterator15.e(err);
        } finally {
          _iterator15.f();
        }
        delete this.effects[id];
      }
    }
  }, {
    key: "clearEffects",
    value: function clearEffects() {
      for (var id in this.effects) this.removeEffect(id, true);
      this.animSubFade(true);
      this.removeTransform();
    }
  }, {
    key: "dogarsCheck",
    value: function dogarsCheck(pokemon) {
      if (pokemon.side.isFar) return;
      if (pokemon.speciesForme === 'Koffing' && /dogars/i.exec(pokemon.name)) {
        this.scene.setBgm(-1);
      } else if (this.scene.bgmNum === -1) {
        this.scene.rollBgm();
      }
    }

    // Statbar
    /////////////////////////////////////////////////////////////////////
  }, {
    key: "getClassForPosition",
    value: function getClassForPosition(slot) {
      // DOUBLES: Slot0 -> left / Slot1 -> Right
      // TRIPLES: slot0 -> left / Slot1 -> Center / Slot2 -> Right
      var position = [' leftstatbar', this.scene.activeCount === 3 ? ' centerstatbar' : ' rightstatbar', ' rightstatbar'];
      return position[slot];
    }
  }, {
    key: "getStatbarHTML",
    value: function getStatbarHTML(pokemon) {
      var buf = '<div class="statbar' + (this.isFrontSprite ? ' lstatbar' : ' rstatbar') + this.getClassForPosition(pokemon.slot) + '" style="display: none">';
      var ignoreNick = this.isFrontSprite && (this.scene.battle.ignoreOpponent || this.scene.battle.ignoreNicks);
      buf += "<strong>".concat(BattleLog.escapeHTML(ignoreNick ? pokemon.speciesForme : pokemon.name));
      var gender = pokemon.gender;
      if (gender === 'M' || gender === 'F') {
        buf += " <img src=\"".concat(Dex.fxPrefix, "gender-").concat(gender.toLowerCase(), ".png\" alt=\"").concat(gender, "\" width=\"7\" height=\"10\" class=\"pixelated\" />");
      }
      buf += pokemon.level === 100 ? "" : " <small>L".concat(pokemon.level, "</small>");
      var symbol = '';
      if (pokemon.speciesForme.includes('-Mega')) symbol = 'mega';else if (pokemon.speciesForme === 'Kyogre-Primal') symbol = 'alpha';else if (pokemon.speciesForme === 'Groudon-Primal') symbol = 'omega';
      if (symbol) {
        buf += " <img src=\"".concat(Dex.resourcePrefix, "sprites/misc/").concat(symbol, ".png\" alt=\"").concat(symbol, "\" style=\"vertical-align:text-bottom;\" />");
      }
      if (pokemon.terastallized) {
        buf += " <img src=\"".concat(Dex.resourcePrefix, "sprites/types/Tera").concat(pokemon.terastallized, ".png\" alt=\"Tera-").concat(pokemon.terastallized, "\" style=\"vertical-align:text-bottom;\" height=\"16\" width=\"16\" />");
      }
      buf += "</strong><div class=\"hpbar\"><div class=\"hptext\"></div><div class=\"hptextborder\"></div><div class=\"prevhp\"><div class=\"hp\"></div></div><div class=\"status\"></div>";
      buf += "</div>";
      return buf;
    }
  }, {
    key: "resetStatbar",
    value: function resetStatbar(pokemon, startHidden) {
      if (this.$statbar) {
        this.$statbar.remove();
        this.$statbar = null; // workaround for TS thinking $statbar is still null after `updateStatbar`
      }
      this.updateStatbar(pokemon, true);
      if (!startHidden && this.$statbar) {
        this.$statbar.css({
          display: 'block',
          left: this.statbarLeft,
          top: this.statbarTop,
          opacity: 1
        });
      }
    }
  }, {
    key: "updateStatbarIfExists",
    value: function updateStatbarIfExists(pokemon, updatePrevhp, updateHp) {
      if (this.$statbar) {
        this.updateStatbar(pokemon, updatePrevhp, updateHp);
      }
    }
  }, {
    key: "updateStatbar",
    value: function updateStatbar(pokemon, updatePrevhp, updateHp) {
      var _pokemon$volatiles$ty;
      if (!this.scene.animating) return;
      if (!pokemon.isActive()) {
        if (this.$statbar) this.$statbar.hide();
        return;
      }
      if (!this.$statbar) {
        this.$statbar = $(this.getStatbarHTML(pokemon));
        this.scene.$stat.append(this.$statbar);
        updatePrevhp = true;
      }
      var hpcolor;
      if (updatePrevhp || updateHp) {
        hpcolor = BattleScene.getHPColor(pokemon);
        var w = pokemon.hpWidth(150);
        var $hp = this.$statbar.find('.hp');
        $hp.css({
          width: w,
          'border-right-width': w ? 1 : 0
        });
        if (hpcolor === 'g') $hp.removeClass('hp-yellow hp-red');else if (hpcolor === 'y') $hp.removeClass('hp-red').addClass('hp-yellow');else $hp.addClass('hp-yellow hp-red');
        this.updateHPText(pokemon);
      }
      if (updatePrevhp) {
        var $prevhp = this.$statbar.find('.prevhp');
        $prevhp.css('width', pokemon.hpWidth(150) + 1);
        if (hpcolor === 'g') $prevhp.removeClass('prevhp-yellow prevhp-red');else if (hpcolor === 'y') $prevhp.removeClass('prevhp-red').addClass('prevhp-yellow');else $prevhp.addClass('prevhp-yellow prevhp-red');
      }
      var status = '';
      if (pokemon.status === 'brn') {
        status += '<span class="brn">BRN</span> ';
      } else if (pokemon.status === 'psn') {
        status += '<span class="psn">PSN</span> ';
      } else if (pokemon.status === 'tox') {
        status += '<span class="psn">TOX</span> ';
      } else if (pokemon.status === 'slp') {
        status += '<span class="slp">SLP</span> ';
      } else if (pokemon.status === 'par') {
        status += '<span class="par">PAR</span> ';
      } else if (pokemon.status === 'frz') {
        status += '<span class="frz">FRZ</span> ';
      }
      if (pokemon.terastallized) {
        status += "<img src=\"".concat(Dex.resourcePrefix, "sprites/types/").concat(encodeURIComponent(pokemon.terastallized), ".png\" alt=\"").concat(pokemon.terastallized, "\" class=\"pixelated\" /> ");
      } else if ((_pokemon$volatiles$ty = pokemon.volatiles.typechange) !== null && _pokemon$volatiles$ty !== void 0 && _pokemon$volatiles$ty[1]) {
        var types = pokemon.volatiles.typechange[1].split('/');
        var _iterator16 = _createForOfIteratorHelper(types),
          _step16;
        try {
          for (_iterator16.s(); !(_step16 = _iterator16.n()).done;) {
            var type = _step16.value;
            status += '<img src="' + Dex.resourcePrefix + 'sprites/types/' + encodeURIComponent(type) + '.png" alt="' + type + '" class="pixelated" /> ';
          }
        } catch (err) {
          _iterator16.e(err);
        } finally {
          _iterator16.f();
        }
      }
      if (pokemon.volatiles.typeadd) {
        var _type = pokemon.volatiles.typeadd[1];
        status += '+<img src="' + Dex.resourcePrefix + 'sprites/types/' + _type + '.png" alt="' + _type + '" class="pixelated" /> ';
      }
      for (var stat in pokemon.boosts) {
        if (pokemon.boosts[stat]) {
          status += '<span class="' + pokemon.getBoostType(stat) + '">' + pokemon.getBoost(stat) + '</span> ';
        }
      }
      for (var i in pokemon.volatiles) {
        status += PokemonSprite.getEffectTag(i);
      }
      for (var _i3 in pokemon.turnstatuses) {
        if (_i3 === 'roost' && !pokemon.getTypeList().includes('Flying')) continue;
        status += PokemonSprite.getEffectTag(_i3);
      }
      for (var _i4 in pokemon.movestatuses) {
        status += PokemonSprite.getEffectTag(_i4);
      }
      var statusbar = this.$statbar.find('.status');
      statusbar.html(status);
    }
  }, {
    key: "updateHPText",
    value: function updateHPText(pokemon) {
      if (!this.$statbar) return;
      var $hptext = this.$statbar.find('.hptext');
      var $hptextborder = this.$statbar.find('.hptextborder');
      if (pokemon.maxhp === 48 || this.scene.battle.hardcoreMode && pokemon.maxhp === 100) {
        $hptext.hide();
        $hptextborder.hide();
      } else if (this.scene.battle.hardcoreMode || this.scene.battle.reportExactHP) {
        $hptext.html("".concat(pokemon.hp, "/"));
        $hptext.show();
        $hptextborder.show();
      } else {
        $hptext.html("".concat(pokemon.hpWidth(100), "%"));
        $hptext.show();
        $hptextborder.show();
      }
    }
  }], [{
    key: "getEffectTag",
    value: function getEffectTag(id) {
      var effect = PokemonSprite.statusTable[id];
      if (typeof effect === 'string') return effect;
      if (effect === null) return PokemonSprite.statusTable[id] = '';
      if (effect === undefined) {
        var label = "[[".concat(id, "]]");
        if (Dex.species.get(id).exists) {
          label = Dex.species.get(id).name;
        } else if (Dex.items.get(id).exists) {
          label = Dex.items.get(id).name;
        } else if (Dex.moves.get(id).exists) {
          label = Dex.moves.get(id).name;
        } else if (Dex.abilities.get(id).exists) {
          label = Dex.abilities.get(id).name;
        } else if (BattleNatures[id.substr(0, 1).toUpperCase() + id.substr(1).toLowerCase()]) {
          label = id.substr(0, 1).toUpperCase() + id.substr(1).toLowerCase();
        }
        effect = [label, 'neutral'];
      }
      return PokemonSprite.statusTable[id] = "<span class=\"".concat(effect[1], "\">").concat(effect[0].replace(/ /g, '&nbsp;'), "</span> ");
    }
  }]);
}(Sprite); // par: -webkit-filter:  sepia(100%) hue-rotate(373deg) saturate(592%);
//      -webkit-filter:  sepia(100%) hue-rotate(22deg) saturate(820%) brightness(29%);
// psn: -webkit-filter:  sepia(100%) hue-rotate(618deg) saturate(285%);
// brn: -webkit-filter:  sepia(100%) hue-rotate(311deg) saturate(469%);
// slp: -webkit-filter:  grayscale(100%);
// frz: -webkit-filter:  sepia(100%) hue-rotate(154deg) saturate(759%) brightness(23%);
// HTML strings are constructed from this table and stored back in it to cache them
_defineProperty(PokemonSprite, "statusTable", {
  formechange: null,
  typechange: null,
  typeadd: null,
  dynamax: ['Dynamaxed', 'good'],
  trapped: null,
  // linked volatiles are not implemented yet
  throatchop: ['Throat Chop', 'bad'],
  confusion: ['Confused', 'bad'],
  healblock: ['Heal Block', 'bad'],
  yawn: ['Drowsy', 'bad'],
  flashfire: ['Flash Fire', 'good'],
  imprison: ['Imprisoning foe', 'good'],
  autotomize: ['Lightened', 'neutral'],
  miracleeye: ['Miracle Eye', 'bad'],
  foresight: ['Foresight', 'bad'],
  telekinesis: ['Telekinesis', 'neutral'],
  transform: ['Transformed', 'neutral'],
  powertrick: ['Power Trick', 'neutral'],
  curse: ['Curse', 'bad'],
  nightmare: ['Nightmare', 'bad'],
  attract: ['Infatuation', 'bad'],
  torment: ['Torment', 'bad'],
  taunt: ['Taunt', 'bad'],
  disable: ['Disable', 'bad'],
  embargo: ['Embargo', 'bad'],
  ingrain: ['Ingrain', 'good'],
  aquaring: ['Aqua Ring', 'good'],
  stockpile1: ['Stockpile', 'good'],
  stockpile2: ['Stockpile&times;2', 'good'],
  stockpile3: ['Stockpile&times;3', 'good'],
  perish0: ['Perish now', 'bad'],
  perish1: ['Perish next turn', 'bad'],
  perish2: ['Perish in 2', 'bad'],
  perish3: ['Perish in 3', 'bad'],
  airballoon: ['Balloon', 'good'],
  leechseed: ['Leech Seed', 'bad'],
  encore: ['Encore', 'bad'],
  mustrecharge: ['Must recharge', 'bad'],
  bide: ['Bide', 'good'],
  magnetrise: ['Magnet Rise', 'good'],
  smackdown: ['Smack Down', 'bad'],
  focusenergy: ['Critical Hit Boost', 'good'],
  dragoncheer: ['Critical Hit Boost', 'good'],
  slowstart: ['Slow Start', 'bad'],
  protosynthesisatk: ['Protosynthesis: Atk', 'good'],
  protosynthesisdef: ['Protosynthesis: Def', 'good'],
  protosynthesisspa: ['Protosynthesis: SpA', 'good'],
  protosynthesisspd: ['Protosynthesis: SpD', 'good'],
  protosynthesisspe: ['Protosynthesis: Spe', 'good'],
  quarkdriveatk: ['Quark Drive: Atk', 'good'],
  quarkdrivedef: ['Quark Drive: Def', 'good'],
  quarkdrivespa: ['Quark Drive: SpA', 'good'],
  quarkdrivespd: ['Quark Drive: SpD', 'good'],
  quarkdrivespe: ['Quark Drive: Spe', 'good'],
  fallen1: ['Fallen: 1', 'good'],
  fallen2: ['Fallen: 2', 'good'],
  fallen3: ['Fallen: 3', 'good'],
  fallen4: ['Fallen: 4', 'good'],
  fallen5: ['Fallen: 5', 'good'],
  noretreat: ['No Retreat', 'bad'],
  octolock: ['Octolock', 'bad'],
  tarshot: ['Tar Shot', 'bad'],
  saltcure: ['Salt Cure', 'bad'],
  syrupbomb: ['Syrupy', 'bad'],
  doomdesire: null,
  futuresight: null,
  mimic: ['Mimic', 'good'],
  watersport: ['Water Sport', 'good'],
  mudsport: ['Mud Sport', 'good'],
  substitute: null,
  // sub graphics are handled elsewhere, see Battle.Sprite.animSub()
  uproar: ['Uproar', 'neutral'],
  rage: ['Rage', 'neutral'],
  roost: ['Landed', 'neutral'],
  protect: ['Protect', 'good'],
  quickguard: ['Quick Guard', 'good'],
  wideguard: ['Wide Guard', 'good'],
  craftyshield: ['Crafty Shield', 'good'],
  matblock: ['Mat Block', 'good'],
  maxguard: ['Max Guard', 'good'],
  helpinghand: ['Helping Hand', 'good'],
  magiccoat: ['Magic Coat', 'good'],
  destinybond: ['Destiny Bond', 'good'],
  snatch: ['Snatch', 'good'],
  grudge: ['Grudge', 'good'],
  charge: ['Charge', 'good'],
  endure: ['Endure', 'good'],
  focuspunch: ['Focusing', 'neutral'],
  shelltrap: ['Trap set', 'neutral'],
  powder: ['Powder', 'bad'],
  electrify: ['Electrify', 'bad'],
  glaiverush: ['Glaive Rush', 'bad'],
  ragepowder: ['Rage Powder', 'good'],
  followme: ['Follow Me', 'good'],
  instruct: ['Instruct', 'neutral'],
  beakblast: ['Beak Blast', 'neutral'],
  laserfocus: ['Laser Focus', 'good'],
  spotlight: ['Spotlight', 'neutral'],
  itemremoved: null,
  // partial trapping
  bind: ['Bind', 'bad'],
  clamp: ['Clamp', 'bad'],
  firespin: ['Fire Spin', 'bad'],
  infestation: ['Infestation', 'bad'],
  magmastorm: ['Magma Storm', 'bad'],
  sandtomb: ['Sand Tomb', 'bad'],
  snaptrap: ['Snap Trap', 'bad'],
  thundercage: ['Thunder Cage', 'bad'],
  whirlpool: ['Whirlpool', 'bad'],
  wrap: ['Wrap', 'bad'],
  // Gen 1-2
  mist: ['Mist', 'good'],
  // Gen 1
  lightscreen: ['Light Screen', 'good'],
  reflect: ['Reflect', 'good']
});
Object.assign($.easing, {
  ballisticUp: function ballisticUp(x, t, b, c, d) {
    return -3 * x * x + 4 * x;
  },
  ballisticDown: function ballisticDown(x, t, b, c, d) {
    x = 1 - x;
    return 1 - (-3 * x * x + 4 * x);
  },
  quadUp: function quadUp(x, t, b, c, d) {
    x = 1 - x;
    return 1 - x * x;
  },
  quadDown: function quadDown(x, t, b, c, d) {
    return x * x;
  }
});
var BattleEffects = {
  wisp: {
    url: 'wisp.png',
    w: 100,
    h: 100
  },
  poisonwisp: {
    url: 'poisonwisp.png',
    w: 100,
    h: 100
  },
  waterwisp: {
    url: 'waterwisp.png',
    w: 100,
    h: 100
  },
  mudwisp: {
    url: 'mudwisp.png',
    w: 100,
    h: 100
  },
  blackwisp: {
    url: 'blackwisp.png',
    w: 100,
    h: 100
  },
  fireball: {
    url: 'fireball.png',
    w: 64,
    h: 64
  },
  bluefireball: {
    url: 'bluefireball.png',
    w: 64,
    h: 64
  },
  icicle: {
    url: 'icicle.png',
    // http://opengameart.org/content/icicle-spell
    w: 80,
    h: 60
  },
  pinkicicle: {
    url: 'icicle-pink.png',
    // http://opengameart.org/content/icicle-spell, recolored by Kalalokki
    w: 80,
    h: 60
  },
  lightning: {
    url: 'lightning.png',
    // by Pokemon Showdown user SailorCosmos
    w: 41,
    h: 229
  },
  rocks: {
    url: 'rocks.png',
    // Pokemon Online - Gilad
    w: 100,
    h: 100
  },
  rock1: {
    url: 'rock1.png',
    // Pokemon Online - Gilad
    w: 64,
    h: 80
  },
  rock2: {
    url: 'rock2.png',
    // Pokemon Online - Gilad
    w: 66,
    h: 72
  },
  rock3: {
    url: 'rock3.png',
    // by Pokemon Showdown user SailorCosmos
    w: 66,
    h: 72
  },
  leaf1: {
    url: 'leaf1.png',
    w: 32,
    h: 26
  },
  leaf2: {
    url: 'leaf2.png',
    w: 40,
    h: 26
  },
  bone: {
    url: 'bone.png',
    w: 29,
    h: 29
  },
  caltrop: {
    url: 'caltrop.png',
    // by Pokemon Showdown user SailorCosmos
    w: 80,
    h: 80
  },
  greenmetal1: {
    url: 'greenmetal1.png',
    // by Pokemon Showdown user Kalalokki
    w: 45,
    h: 45
  },
  greenmetal2: {
    url: 'greenmetal2.png',
    // by Pokemon Showdown user Kalalokki
    w: 45,
    h: 45
  },
  poisoncaltrop: {
    url: 'poisoncaltrop.png',
    // by Pokemon Showdown user SailorCosmos
    w: 80,
    h: 80
  },
  shadowball: {
    url: 'shadowball.png',
    w: 100,
    h: 100
  },
  energyball: {
    url: 'energyball.png',
    w: 100,
    h: 100
  },
  electroball: {
    url: 'electroball.png',
    w: 100,
    h: 100
  },
  mistball: {
    url: 'mistball.png',
    w: 100,
    h: 100
  },
  iceball: {
    url: 'iceball.png',
    w: 100,
    h: 100
  },
  flareball: {
    url: 'flareball.png',
    w: 100,
    h: 100
  },
  moon: {
    url: 'moon.png',
    // by Kalalokki
    w: 100,
    h: 100
  },
  pokeball: {
    url: 'pokeball.png',
    w: 24,
    h: 24
  },
  fist: {
    url: 'fist.png',
    // by Pokemon Showdown user SailorCosmos
    w: 55,
    h: 49
  },
  fist1: {
    url: 'fist1.png',
    w: 49,
    h: 55
  },
  foot: {
    url: 'foot.png',
    // by Pokemon Showdown user SailorCosmos
    w: 50,
    h: 75
  },
  topbite: {
    url: 'topbite.png',
    w: 108,
    h: 64
  },
  bottombite: {
    url: 'bottombite.png',
    w: 108,
    h: 64
  },
  web: {
    url: 'web.png',
    // by Pokemon Showdown user SailorCosmos
    w: 120,
    h: 122
  },
  leftclaw: {
    url: 'leftclaw.png',
    w: 44,
    h: 60
  },
  rightclaw: {
    url: 'rightclaw.png',
    w: 44,
    h: 60
  },
  leftslash: {
    url: 'leftslash.png',
    // by Pokemon Showdown user Modeling Clay
    w: 57,
    h: 56
  },
  rightslash: {
    url: 'rightslash.png',
    // by Pokemon Showdown user Modeling Clay
    w: 57,
    h: 56
  },
  leftchop: {
    url: 'leftchop.png',
    // by Pokemon Showdown user SailorCosmos
    w: 100,
    h: 130
  },
  rightchop: {
    url: 'rightchop.png',
    // by Pokemon Showdown user SailorCosmos
    w: 100,
    h: 130
  },
  angry: {
    url: 'angry.png',
    // by Pokemon Showdown user SailorCosmos
    w: 30,
    h: 30
  },
  heart: {
    url: 'heart.png',
    // by Pokemon Showdown user SailorCosmos
    w: 30,
    h: 30
  },
  pointer: {
    url: 'pointer.png',
    // by Pokemon Showdown user SailorCosmos
    w: 100,
    h: 100
  },
  sword: {
    url: 'sword.png',
    // by Pokemon Showdown user SailorCosmos
    w: 48,
    h: 100
  },
  impact: {
    url: 'impact.png',
    // by Pokemon Showdown user SailorCosmos
    w: 127,
    h: 119
  },
  stare: {
    url: 'stare.png',
    w: 100,
    h: 35
  },
  shine: {
    url: 'shine.png',
    // by Smogon user Jajoken
    w: 127,
    h: 119
  },
  feather: {
    url: 'feather.png',
    // Ripped from http://www.clker.com/clipart-black-and-white-feather.html
    w: 100,
    h: 38
  },
  shell: {
    url: 'shell.png',
    // by Smogon user Jajoken
    w: 100,
    h: 91.5
  },
  petal: {
    url: 'petal.png',
    // by Smogon user Jajoken
    w: 60,
    h: 60
  },
  gear: {
    url: 'gear.png',
    // by Smogon user Jajoken
    w: 100,
    h: 100
  },
  alpha: {
    url: 'alpha.png',
    // Ripped from Pokemon Global Link
    w: 80,
    h: 80
  },
  omega: {
    url: 'omega.png',
    // Ripped from Pokemon Global Link
    w: 80,
    h: 80
  },
  rainbow: {
    url: 'rainbow.png',
    w: 128,
    h: 128
  },
  zsymbol: {
    url: 'z-symbol.png',
    // From http://froggybutt.deviantart.com/art/Pokemon-Z-Move-symbol-633125033
    w: 150,
    h: 100
  },
  ultra: {
    url: 'ultra.png',
    // by Pokemon Showdown user Modeling Clay
    w: 113,
    h: 165
  },
  hitmark: {
    url: 'hitmarker.png',
    // by Pokemon Showdown user Ridaz
    w: 100,
    h: 100
  },
  protect: {
    rawHTML: '<div class="turnstatus-protect" style="display:none;position:absolute" />',
    w: 100,
    h: 70
  },
  auroraveil: {
    rawHTML: '<div class="sidecondition-auroraveil" style="display:none;position:absolute" />',
    w: 100,
    h: 50
  },
  reflect: {
    rawHTML: '<div class="sidecondition-reflect" style="display:none;position:absolute" />',
    w: 100,
    h: 50
  },
  safeguard: {
    rawHTML: '<div class="sidecondition-safeguard" style="display:none;position:absolute" />',
    w: 100,
    h: 50
  },
  lightscreen: {
    rawHTML: '<div class="sidecondition-lightscreen" style="display:none;position:absolute" />',
    w: 100,
    h: 50
  },
  mist: {
    rawHTML: '<div class="sidecondition-mist" style="display:none;position:absolute" />',
    w: 100,
    h: 50
  }
};
(function () {
  if (!window.Dex || !Dex.resourcePrefix) return;
  for (var id in BattleEffects) {
    if (!BattleEffects[id].url) continue;
    BattleEffects[id].url = Dex.fxPrefix + BattleEffects[id].url;
  }
})();
var BattleBackdropsThree = ['bg-gen3.png', 'bg-gen3-cave.png', 'bg-gen3-ocean.png', 'bg-gen3-sand.png', 'bg-gen3-forest.png', 'bg-gen3-arena.png'];
var BattleBackdropsFour = ['bg-gen4.png', 'bg-gen4-cave.png', 'bg-gen4-snow.png', 'bg-gen4-indoors.png', 'bg-gen4-water.png'];
var BattleBackdropsFive = ['bg-beach.png', 'bg-beachshore.png', 'bg-desert.png', 'bg-meadow.png', 'bg-thunderplains.png', 'bg-city.png', 'bg-earthycave.png', 'bg-mountain.png', 'bg-volcanocave.png', 'bg-dampcave.png', 'bg-forest.png', 'bg-river.png', 'bg-deepsea.png', 'bg-icecave.png', 'bg-route.png'];
var BattleBackdrops = ['bg-aquacordetown.jpg', 'bg-beach.jpg', 'bg-city.jpg', 'bg-dampcave.jpg', 'bg-darkbeach.jpg', 'bg-darkcity.jpg', 'bg-darkmeadow.jpg', 'bg-deepsea.jpg', 'bg-desert.jpg', 'bg-earthycave.jpg', 'bg-elite4drake.jpg', 'bg-forest.jpg', 'bg-icecave.jpg', 'bg-leaderwallace.jpg', 'bg-library.jpg', 'bg-meadow.jpg', 'bg-orasdesert.jpg', 'bg-orassea.jpg', 'bg-skypillar.jpg'];
var BattleOtherAnims = {
  hitmark: {
    anim: function anim(scene, _ref3) {
      var _ref4 = _slicedToArray(_ref3, 1),
        attacker = _ref4[0];
      scene.showEffect('hitmark', {
        x: attacker.x,
        y: attacker.y,
        z: attacker.z,
        scale: 0.5,
        opacity: 1
      }, {
        opacity: 0.5,
        time: 250
      }, 'linear', 'fade');
    }
  },
  attack: {
    anim: function anim(scene, _ref5) {
      var _ref6 = _slicedToArray(_ref5, 2),
        attacker = _ref6[0],
        defender = _ref6[1];
      scene.showEffect('wisp', {
        x: attacker.x,
        y: attacker.y,
        z: attacker.z,
        scale: 0.1,
        opacity: 1
      }, {
        x: defender.x,
        y: defender.y,
        z: defender.behind(40),
        scale: 1,
        opacity: 0.5
      }, 'linear');
    }
  },
  contactattack: {
    anim: function anim(scene, _ref7) {
      var _ref8 = _slicedToArray(_ref7, 2),
        attacker = _ref8[0],
        defender = _ref8[1];
      attacker.anim({
        x: defender.x,
        y: defender.y + 80,
        z: defender.behind(-30),
        time: 400
      }, 'ballistic');
      attacker.anim({
        x: defender.x,
        y: defender.y + 5,
        z: defender.z,
        time: 100
      });
      attacker.anim({
        time: 500
      }, 'ballistic2Back');
      defender.delay(450);
      defender.anim({
        z: defender.behind(20),
        time: 100
      }, 'swing');
      defender.anim({
        time: 300
      }, 'swing');
      scene.wait(500);
    }
  },
  xattack: {
    anim: function anim(scene, _ref9) {
      var _ref10 = _slicedToArray(_ref9, 2),
        attacker = _ref10[0],
        defender = _ref10[1];
      scene.showEffect('wisp', {
        x: defender.x,
        y: defender.y,
        z: defender.z,
        scale: 0,
        opacity: 1,
        time: 400
      }, {
        x: defender.leftof(-20),
        y: defender.y,
        z: defender.behind(20),
        scale: 3,
        opacity: 0,
        time: 700
      }, 'linear');
      scene.showEffect('wisp', {
        x: defender.x,
        y: defender.y,
        z: defender.z,
        scale: 0,
        opacity: 1,
        time: 700
      }, {
        x: defender.leftof(-20),
        y: defender.y,
        z: defender.behind(20),
        scale: 3,
        opacity: 0,
        time: 1000
      }, 'linear');
      defender.delay(480);
      defender.anim({
        z: defender.behind(20),
        time: 100
      }, 'swing');
      defender.anim({
        time: 200
      }, 'swing');
      defender.anim({
        z: defender.behind(20),
        time: 100
      }, 'swing');
      defender.anim({
        time: 300
      }, 'swing');
      attacker.anim({
        x: defender.leftof(-30),
        y: defender.y + 80,
        z: defender.behind(-30),
        time: 400
      }, 'ballistic');
      attacker.anim({
        x: defender.leftof(30),
        y: defender.y + 5,
        z: defender.z,
        time: 100
      });
      attacker.anim({
        x: defender.leftof(30),
        y: defender.y + 80,
        z: defender.behind(-30),
        time: 200
      }, 'ballisticUp');
      attacker.anim({
        x: defender.leftof(-30),
        y: defender.y + 5,
        z: defender.z,
        time: 100
      });
      attacker.anim({
        time: 500
      }, 'ballistic2Back');
    }
  },
  slashattack: {
    anim: function anim(scene, _ref11) {
      var _ref12 = _slicedToArray(_ref11, 2),
        attacker = _ref12[0],
        defender = _ref12[1];
      attacker.anim({
        x: defender.x,
        y: defender.y + 80,
        z: defender.behind(-30),
        time: 400
      }, 'ballistic');
      attacker.anim({
        x: defender.x,
        y: defender.y + 5,
        z: defender.z,
        time: 100
      });
      attacker.anim({
        time: 500
      }, 'ballistic2Back');
      defender.delay(450);
      defender.anim({
        z: defender.behind(20),
        time: 100
      }, 'swing');
      defender.anim({
        time: 300
      }, 'swing');
      scene.showEffect('rightslash', {
        x: defender.x,
        y: defender.y,
        z: defender.z,
        scale: 1,
        opacity: 1,
        time: 500
      }, {
        scale: 3,
        opacity: 0,
        time: 800
      }, 'linear', 'fade');
    }
  },
  clawattack: {
    anim: function anim(scene, _ref13) {
      var _ref14 = _slicedToArray(_ref13, 2),
        attacker = _ref14[0],
        defender = _ref14[1];
      attacker.anim({
        x: defender.leftof(-30),
        y: defender.y + 80,
        z: defender.behind(-30),
        time: 400
      }, 'ballistic');
      attacker.anim({
        x: defender.leftof(30),
        y: defender.y + 5,
        z: defender.z,
        time: 100
      });
      attacker.anim({
        x: defender.leftof(30),
        y: defender.y + 80,
        z: defender.behind(-30),
        time: 200
      }, 'ballisticUp');
      attacker.anim({
        x: defender.leftof(-30),
        y: defender.y + 5,
        z: defender.z,
        time: 100
      });
      attacker.anim({
        time: 500
      }, 'ballistic2Back');
      defender.delay(450);
      defender.anim({
        z: defender.behind(20),
        time: 100
      }, 'swing');
      defender.anim({
        time: 200
      }, 'swing');
      defender.anim({
        z: defender.behind(20),
        time: 100
      }, 'swing');
      defender.anim({
        time: 300
      }, 'swing');
      scene.showEffect('leftclaw', {
        x: defender.x - 20,
        y: defender.y + 20,
        z: defender.z,
        scale: 0,
        opacity: 1,
        time: 400
      }, {
        x: defender.x - 20,
        y: defender.y + 20,
        z: defender.z,
        scale: 3,
        opacity: 0,
        time: 700
      }, 'linear', 'fade');
      scene.showEffect('leftclaw', {
        x: defender.x - 20,
        y: defender.y - 20,
        z: defender.z,
        scale: 0,
        opacity: 1,
        time: 400
      }, {
        x: defender.x - 20,
        y: defender.y - 20,
        z: defender.z,
        scale: 3,
        opacity: 0,
        time: 700
      }, 'linear', 'fade');
      scene.showEffect('rightclaw', {
        x: defender.x + 20,
        y: defender.y + 20,
        z: defender.z,
        scale: 0,
        opacity: 1,
        time: 700
      }, {
        x: defender.x + 20,
        y: defender.y + 20,
        z: defender.z,
        scale: 3,
        opacity: 0,
        time: 1000
      }, 'linear', 'fade');
      scene.showEffect('rightclaw', {
        x: defender.x + 20,
        y: defender.y - 20,
        z: defender.z,
        scale: 0,
        opacity: 1,
        time: 700
      }, {
        x: defender.x + 20,
        y: defender.y - 20,
        z: defender.z,
        scale: 3,
        opacity: 0,
        time: 1000
      }, 'linear', 'fade');
    }
  },
  punchattack: {
    anim: function anim(scene, _ref15) {
      var _ref16 = _slicedToArray(_ref15, 2),
        attacker = _ref16[0],
        defender = _ref16[1];
      scene.showEffect('wisp', {
        x: defender.x,
        y: defender.y,
        z: defender.z,
        scale: 0,
        opacity: 1,
        time: 400
      }, {
        x: defender.leftof(-20),
        y: defender.y,
        z: defender.behind(20),
        scale: 3,
        opacity: 0,
        time: 700
      }, 'linear');
      scene.showEffect('wisp', {
        x: defender.x,
        y: defender.y,
        z: defender.z,
        scale: 0,
        opacity: 1,
        time: 500
      }, {
        x: defender.leftof(-20),
        y: defender.y,
        z: defender.behind(20),
        scale: 3,
        opacity: 0,
        time: 800
      }, 'linear');
      scene.showEffect('fist', {
        x: defender.x,
        y: defender.y,
        z: defender.z,
        scale: 1,
        opacity: 1,
        time: 400
      }, {
        x: defender.leftof(-20),
        y: defender.y,
        z: defender.behind(20),
        scale: 2,
        opacity: 0,
        time: 800
      }, 'linear');
      attacker.anim({
        x: defender.leftof(20),
        y: defender.y,
        z: defender.behind(-20),
        time: 400
      }, 'ballistic2Under');
      attacker.anim({
        x: defender.x,
        y: defender.y,
        z: defender.z,
        time: 50
      });
      attacker.anim({
        time: 500
      }, 'ballistic2');
      defender.delay(425);
      defender.anim({
        x: defender.leftof(-15),
        y: defender.y,
        z: defender.behind(15),
        time: 50
      }, 'swing');
      defender.anim({
        time: 300
      }, 'swing');
    }
  },
  bite: {
    anim: function anim(scene, _ref17) {
      var _ref18 = _slicedToArray(_ref17, 2),
        attacker = _ref18[0],
        defender = _ref18[1];
      scene.showEffect('topbite', {
        x: defender.x,
        y: defender.y + 50,
        z: defender.z,
        scale: 0.5,
        opacity: 0,
        time: 370
      }, {
        x: defender.x,
        y: defender.y + 10,
        z: defender.z,
        scale: 0.5,
        opacity: 1,
        time: 500
      }, 'linear', 'fade');
      scene.showEffect('bottombite', {
        x: defender.x,
        y: defender.y - 50,
        z: defender.z,
        scale: 0.5,
        opacity: 0,
        time: 370
      }, {
        x: defender.x,
        y: defender.y - 10,
        z: defender.z,
        scale: 0.5,
        opacity: 1,
        time: 500
      }, 'linear', 'fade');
    }
  },
  kick: {
    anim: function anim(scene, _ref19) {
      var _ref20 = _slicedToArray(_ref19, 2),
        attacker = _ref20[0],
        defender = _ref20[1];
      scene.showEffect('foot', {
        x: defender.x,
        y: defender.y,
        z: defender.z,
        scale: 1,
        opacity: 1,
        time: 400
      }, {
        x: defender.x,
        y: defender.y - 20,
        z: defender.behind(15),
        scale: 2,
        opacity: 0,
        time: 800
      }, 'linear');
    }
  },
  fastattack: {
    anim: function anim(scene, _ref21) {
      var _ref22 = _slicedToArray(_ref21, 2),
        attacker = _ref22[0],
        defender = _ref22[1];
      scene.showEffect('wisp', {
        x: defender.x,
        y: defender.y,
        z: defender.z,
        scale: 0,
        opacity: 0.5,
        time: 260
      }, {
        scale: 2,
        opacity: 0,
        time: 560
      }, 'linear');
      scene.showEffect('wisp', {
        x: defender.x,
        y: defender.y,
        z: defender.z,
        scale: 0,
        opacity: 0.5,
        time: 310
      }, {
        scale: 2,
        opacity: 0,
        time: 610
      }, 'linear');
      scene.showEffect(attacker.sp, {
        x: attacker.x,
        y: attacker.y,
        z: attacker.z,
        opacity: 0.3,
        time: 50
      }, {
        x: defender.x,
        y: defender.y,
        z: defender.behind(70),
        time: 350
      }, 'accel', 'fade');
      scene.showEffect(attacker.sp, {
        x: attacker.x,
        y: attacker.y,
        z: attacker.z,
        opacity: 0.3,
        time: 100
      }, {
        x: defender.x,
        y: defender.y,
        z: defender.behind(70),
        time: 400
      }, 'accel', 'fade');
      attacker.anim({
        x: defender.x,
        y: defender.y,
        z: defender.behind(70),
        time: 300,
        opacity: 0.5
      }, 'accel');
      attacker.anim({
        x: defender.x,
        y: defender.x,
        z: defender.behind(100),
        opacity: 0,
        time: 100
      }, 'linear');
      attacker.anim({
        x: attacker.x,
        y: attacker.y,
        z: attacker.behind(70),
        opacity: 0,
        time: 1
      }, 'linear');
      attacker.anim({
        opacity: 1,
        time: 500
      }, 'decel');
      defender.delay(260);
      defender.anim({
        z: defender.behind(30),
        time: 100
      }, 'swing');
      defender.anim({
        time: 300
      }, 'swing');
    }
  },
  fastanimattack: {
    anim: function anim(scene, _ref23) {
      var _ref24 = _slicedToArray(_ref23, 2),
        attacker = _ref24[0],
        defender = _ref24[1];
      attacker.anim({
        z: attacker.behind(-70),
        time: 50,
        opacity: 1
      }, 'decel');
      attacker.anim({
        opacity: 1,
        time: 150
      }, 'accel');
      defender.anim({
        z: defender.behind(30),
        time: 70
      }, 'decel');
      defender.anim({
        time: 170
      }, 'accel');
    }
  },
  fastanimspecial: {
    anim: function anim(scene, _ref25) {
      var _ref26 = _slicedToArray(_ref25, 2),
        attacker = _ref26[0],
        defender = _ref26[1];
      scene.showEffect('shadowball', {
        x: attacker.x,
        y: attacker.y,
        z: attacker.z,
        scale: 0.5,
        opacity: 0.8,
        time: 0
      }, {
        x: defender.x,
        y: defender.y,
        z: defender.z,
        time: 100
      }, 'decel');
      scene.showEffect('shadowball', {
        x: attacker.x,
        y: attacker.y,
        z: attacker.z,
        scale: 0.5,
        opacity: 0.8,
        time: 70
      }, {
        x: defender.x,
        y: defender.y,
        z: defender.z,
        time: 170
      }, 'decel');
      defender.anim({
        z: defender.behind(30),
        time: 70
      }, 'decel');
      defender.anim({
        time: 170
      }, 'accel');
    }
  },
  fastanimself: {
    anim: function anim(scene, _ref27) {
      var _ref28 = _slicedToArray(_ref27, 2),
        attacker = _ref28[0],
        defender = _ref28[1];
      attacker.anim({
        scale: 1.5,
        time: 50
      }, 'decel');
      attacker.anim({
        time: 170
      }, 'accel');
    }
  },
  sneakattack: {
    anim: function anim(scene, _ref29) {
      var _ref30 = _slicedToArray(_ref29, 2),
        attacker = _ref30[0],
        defender = _ref30[1];
      attacker.anim({
        x: attacker.leftof(-20),
        y: attacker.y,
        z: attacker.behind(-20),
        opacity: 0,
        time: 200
      }, 'linear');
      attacker.anim({
        x: defender.x,
        y: defender.y,
        z: defender.behind(-120),
        opacity: 0,
        time: 1
      }, 'linear');
      attacker.anim({
        x: defender.x,
        y: defender.y,
        z: defender.behind(40),
        opacity: 1,
        time: 250
      }, 'linear');
      attacker.anim({
        x: defender.x,
        y: defender.y,
        z: defender.behind(-5),
        opacity: 0,
        time: 300
      }, 'linear');
      attacker.anim({
        opacity: 0,
        time: 1
      }, 'linear');
      attacker.anim({
        time: 300,
        opacity: 1
      }, 'linear');
      defender.delay(330);
      defender.anim({
        z: defender.behind(20),
        time: 100
      }, 'swing');
      defender.anim({
        time: 300
      }, 'swing');
    }
  },
  spinattack: {
    anim: function anim(scene, _ref31) {
      var _ref32 = _slicedToArray(_ref31, 2),
        attacker = _ref32[0],
        defender = _ref32[1];
      attacker.anim({
        x: defender.x,
        y: defender.y + 60,
        z: defender.behind(-30),
        time: 400
      }, 'ballistic2');
      attacker.anim({
        x: defender.x,
        y: defender.y + 5,
        z: defender.z,
        time: 100
      });
      attacker.anim({
        time: 500
      }, 'ballistic2');
      defender.delay(450);
      defender.anim({
        z: defender.behind(20),
        time: 100
      }, 'swing');
      defender.anim({
        time: 300
      }, 'swing');
      scene.wait(500);
    }
  },
  bound: {
    anim: function anim(scene, _ref33) {
      var _ref34 = _slicedToArray(_ref33, 1),
        attacker = _ref34[0];
      scene.showEffect('iceball', {
        x: attacker.x,
        y: attacker.y + 15,
        z: attacker.z,
        scale: 0.7,
        xscale: 2,
        opacity: 0.3,
        time: 0
      }, {
        scale: 0.4,
        xscale: 1,
        opacity: 0.1,
        time: 500
      }, 'decel', 'fade');
      scene.showEffect('iceball', {
        x: attacker.x,
        y: attacker.y - 5,
        z: attacker.z,
        scale: 0.7,
        xscale: 2,
        opacity: 0.3,
        time: 50
      }, {
        scale: 0.4,
        xscale: 1,
        opacity: 0.1,
        time: 550
      }, 'decel', 'fade');
      scene.showEffect('iceball', {
        x: attacker.x,
        y: attacker.y - 20,
        z: attacker.z,
        scale: 0.7,
        xscale: 2,
        opacity: 0.3,
        time: 100
      }, {
        scale: 0.4,
        xscale: 1,
        opacity: 0.1,
        time: 600
      }, 'decel', 'fade');
      attacker.anim({
        y: attacker.y + 15,
        z: attacker.behind(10),
        yscale: 1.3,
        time: 200
      }, 'swing');
      attacker.anim({
        time: 200
      }, 'swing');
      attacker.delay(25);
      attacker.anim({
        x: attacker.leftof(-10),
        y: attacker.y + 15,
        z: attacker.behind(5),
        yscale: 1.3,
        time: 200
      }, 'swing');
      attacker.anim({
        time: 200
      }, 'swing');
    }
  },
  selfstatus: {
    anim: function anim(scene, _ref35) {
      var _ref36 = _slicedToArray(_ref35, 1),
        attacker = _ref36[0];
      scene.showEffect('wisp', {
        x: attacker.x,
        y: attacker.y,
        z: attacker.z,
        scale: 2,
        opacity: 0.2,
        time: 0
      }, {
        scale: 0,
        opacity: 1,
        time: 300
      }, 'linear');
      scene.showEffect('wisp', {
        x: attacker.x,
        y: attacker.y,
        z: attacker.z,
        scale: 2,
        opacity: 0.2,
        time: 200
      }, {
        scale: 0,
        opacity: 1,
        time: 500
      }, 'linear');
    }
  },
  lightstatus: {
    anim: function anim(scene, _ref37) {
      var _ref38 = _slicedToArray(_ref37, 1),
        attacker = _ref38[0];
      scene.showEffect('electroball', {
        x: attacker.x,
        y: attacker.y,
        z: attacker.z,
        scale: 2,
        opacity: 0.1,
        time: 0
      }, {
        scale: 0,
        opacity: 0.5,
        time: 600
      }, 'linear');
    }
  },
  chargestatus: {
    anim: function anim(scene, _ref39) {
      var _ref40 = _slicedToArray(_ref39, 1),
        attacker = _ref40[0];
      scene.showEffect('electroball', {
        x: attacker.x - 60,
        y: attacker.y + 40,
        z: attacker.z,
        scale: 0.7,
        opacity: 0.7,
        time: 0
      }, {
        x: attacker.x,
        y: attacker.y,
        scale: 0.2,
        opacity: 0.2,
        time: 300
      }, 'linear', 'fade');
      scene.showEffect('electroball', {
        x: attacker.x + 60,
        y: attacker.y - 5,
        z: attacker.z,
        scale: 0.7,
        opacity: 0.7,
        time: 100
      }, {
        x: attacker.x,
        y: attacker.y,
        scale: 0.2,
        opacity: 0.2,
        time: 300
      }, 'linear', 'fade');
      scene.showEffect('electroball', {
        x: attacker.x - 30,
        y: attacker.y + 60,
        z: attacker.z,
        scale: 0.7,
        opacity: 0.7,
        time: 100
      }, {
        x: attacker.x,
        y: attacker.y,
        scale: 0.2,
        opacity: 0.2,
        time: 400
      }, 'linear', 'fade');
      scene.showEffect('electroball', {
        x: attacker.x + 20,
        y: attacker.y - 50,
        z: attacker.z,
        scale: 0.7,
        opacity: 0.7,
        time: 100
      }, {
        x: attacker.x,
        y: attacker.y,
        scale: 0.2,
        opacity: 0.2,
        time: 400
      }, 'linear', 'fade');
      scene.showEffect('electroball', {
        x: attacker.x - 70,
        y: attacker.y - 50,
        z: attacker.z,
        scale: 0.7,
        opacity: 0.7,
        time: 200
      }, {
        x: attacker.x,
        y: attacker.y,
        scale: 0.2,
        opacity: 0.2,
        time: 500
      }, 'linear', 'fade');
    }
  },
  heal: {
    anim: function anim(scene, _ref41) {
      var _ref42 = _slicedToArray(_ref41, 1),
        attacker = _ref42[0];
      scene.showEffect('iceball', {
        x: attacker.x + 30,
        y: attacker.y + 5,
        z: attacker.z,
        scale: 0.1,
        opacity: 0.7,
        time: 200
      }, {
        x: attacker.x + 40,
        y: attacker.y + 10,
        opacity: 0,
        time: 600
      }, 'accel');
      scene.showEffect('iceball', {
        x: attacker.x - 30,
        y: attacker.y - 10,
        z: attacker.z,
        scale: 0.1,
        opacity: 0.7,
        time: 300
      }, {
        x: attacker.x - 40,
        y: attacker.y - 20,
        opacity: 0,
        time: 700
      }, 'accel');
      scene.showEffect('iceball', {
        x: attacker.x + 15,
        y: attacker.y + 10,
        z: attacker.z,
        scale: 0.1,
        opacity: 0.7,
        time: 400
      }, {
        x: attacker.x + 25,
        y: attacker.y + 20,
        opacity: 0,
        time: 800
      }, 'accel');
      scene.showEffect('iceball', {
        x: attacker.x - 15,
        y: attacker.y - 30,
        z: attacker.z,
        scale: 0.1,
        opacity: 0.7,
        time: 500
      }, {
        x: attacker.x - 25,
        y: attacker.y - 40,
        opacity: 0,
        time: 900
      }, 'accel');
    }
  },
  shiny: {
    anim: function anim(scene, _ref43) {
      var _ref44 = _slicedToArray(_ref43, 1),
        attacker = _ref44[0];
      scene.backgroundEffect('#000000', 800, 0.3, 100);
      scene.showEffect('shine', {
        x: attacker.x + 5,
        y: attacker.y + 20,
        z: attacker.z,
        scale: 0.1,
        opacity: 0.7,
        time: 450
      }, {
        y: attacker.y + 35,
        opacity: 0,
        time: 675
      }, 'decel');
      scene.showEffect('shine', {
        x: attacker.x + 15,
        y: attacker.y + 20,
        z: attacker.z,
        scale: 0.2,
        opacity: 0.7,
        time: 475
      }, {
        x: attacker.x + 25,
        y: attacker.y + 30,
        opacity: 0,
        time: 700
      }, 'decel');
      scene.showEffect('shine', {
        x: attacker.x - 15,
        y: attacker.y + 20,
        z: attacker.z,
        scale: 0.2,
        opacity: 0.7,
        time: 500
      }, {
        x: attacker.x - 25,
        y: attacker.y + 30,
        opacity: 0,
        time: 725
      }, 'decel');
      scene.showEffect('shine', {
        x: attacker.x - 20,
        y: attacker.y + 5,
        z: attacker.z,
        scale: 0.2,
        opacity: 0.7,
        time: 550
      }, {
        x: attacker.x - 30,
        y: attacker.y - 5,
        opacity: 0,
        time: 775
      }, 'decel');
      scene.showEffect('shine', {
        x: attacker.x + 15,
        y: attacker.y + 10,
        z: attacker.z,
        scale: 0.2,
        opacity: 0.7,
        time: 650
      }, {
        x: attacker.x + 35,
        y: attacker.y - 5,
        opacity: 0,
        time: 875
      }, 'decel');
      scene.showEffect('shine', {
        x: attacker.x + 5,
        y: attacker.y - 5,
        z: attacker.z,
        scale: 0.2,
        opacity: 0.7,
        time: 675
      }, {
        y: attacker.y - 20,
        opacity: 0,
        time: 900
      }, 'decel');
    }
  },
  flight: {
    anim: function anim(scene, _ref45) {
      var _ref46 = _slicedToArray(_ref45, 2),
        attacker = _ref46[0],
        defender = _ref46[1];
      attacker.anim({
        x: attacker.leftof(-200),
        y: attacker.y + 80,
        z: attacker.z,
        opacity: 0,
        time: 350
      }, 'accel');
      attacker.anim({
        x: defender.leftof(-200),
        y: defender.y + 80,
        z: defender.z,
        time: 1
      }, 'linear');
      attacker.anim({
        x: defender.x,
        y: defender.y,
        z: defender.z,
        opacity: 1,
        time: 350
      }, 'accel');
      scene.showEffect('wisp', {
        x: defender.x,
        y: defender.y,
        z: defender.z,
        scale: 0,
        opacity: 0.5,
        time: 700
      }, {
        scale: 2,
        opacity: 0,
        time: 900
      }, 'linear');
      attacker.anim({
        x: defender.leftof(100),
        y: defender.y - 40,
        z: defender.z,
        opacity: 0,
        time: 175
      });
      attacker.anim({
        x: attacker.x,
        y: attacker.y + 40,
        z: attacker.behind(40),
        time: 1
      });
      attacker.anim({
        x: attacker.x,
        y: attacker.y,
        z: attacker.z,
        time: 250
      }, 'decel');
      defender.delay(700);
      defender.anim({
        z: defender.behind(20),
        time: 100
      }, 'swing');
      defender.anim({
        time: 300
      }, 'swing');
    }
  },
  shake: {
    anim: function anim(scene, _ref47) {
      var _ref48 = _slicedToArray(_ref47, 1),
        attacker = _ref48[0];
      attacker.anim({
        x: attacker.x - 10,
        time: 200
      });
      attacker.anim({
        x: attacker.x + 10,
        time: 300
      });
      attacker.anim({
        x: attacker.x,
        time: 200
      });
    }
  },
  dance: {
    anim: function anim(scene, _ref49) {
      var _ref50 = _slicedToArray(_ref49, 1),
        attacker = _ref50[0];
      attacker.anim({
        x: attacker.x - 10
      });
      attacker.anim({
        x: attacker.x + 10
      });
      attacker.anim({
        x: attacker.x
      });
    }
  },
  consume: {
    anim: function anim(scene, _ref51) {
      var _ref52 = _slicedToArray(_ref51, 1),
        defender = _ref52[0];
      scene.showEffect('wisp', {
        x: defender.leftof(-25),
        y: defender.y + 40,
        z: defender.behind(-20),
        scale: 0.5,
        opacity: 1
      }, {
        x: defender.leftof(-15),
        y: defender.y + 35,
        z: defender.z,
        scale: 0,
        opacity: 0.2,
        time: 500
      }, 'swing', 'fade');
      defender.delay(400);
      defender.anim({
        y: defender.y + 5,
        yscale: 1.1,
        time: 200
      }, 'swing');
      defender.anim({
        time: 200
      }, 'swing');
      defender.anim({
        y: defender.y + 5,
        yscale: 1.1,
        time: 200
      }, 'swing');
      defender.anim({
        time: 200
      }, 'swing');
    }
  },
  leech: {
    anim: function anim(scene, _ref53) {
      var _ref54 = _slicedToArray(_ref53, 2),
        attacker = _ref54[0],
        defender = _ref54[1];
      scene.showEffect('energyball', {
        x: defender.x - 30,
        y: defender.y - 40,
        z: defender.z,
        scale: 0.2,
        opacity: 0.7,
        time: 0
      }, {
        x: attacker.x,
        y: attacker.y,
        z: attacker.z,
        time: 500,
        opacity: 0.1
      }, 'ballistic2', 'fade');
      scene.showEffect('energyball', {
        x: defender.x + 40,
        y: defender.y - 35,
        z: defender.z,
        scale: 0.2,
        opacity: 0.7,
        time: 50
      }, {
        x: attacker.x,
        y: attacker.y,
        z: attacker.z,
        time: 550,
        opacity: 0.1
      }, 'linear', 'fade');
      scene.showEffect('energyball', {
        x: defender.x + 20,
        y: defender.y - 25,
        z: defender.z,
        scale: 0.2,
        opacity: 0.7,
        time: 100
      }, {
        x: attacker.x,
        y: attacker.y,
        z: attacker.z,
        time: 600,
        opacity: 0.1
      }, 'ballistic2Under', 'fade');
    }
  },
  drain: {
    anim: function anim(scene, _ref55) {
      var _ref56 = _slicedToArray(_ref55, 2),
        attacker = _ref56[0],
        defender = _ref56[1];
      scene.showEffect('energyball', {
        x: defender.x,
        y: defender.y,
        z: defender.z,
        scale: 0.6,
        opacity: 0.6,
        time: 0
      }, {
        x: attacker.x,
        y: attacker.y,
        z: attacker.z,
        time: 500,
        opacity: 0
      }, 'ballistic2');
      scene.showEffect('energyball', {
        x: defender.x,
        y: defender.y,
        z: defender.z,
        scale: 0.6,
        opacity: 0.6,
        time: 50
      }, {
        x: attacker.x,
        y: attacker.y,
        z: attacker.z,
        time: 550,
        opacity: 0
      }, 'linear');
      scene.showEffect('energyball', {
        x: defender.x,
        y: defender.y,
        z: defender.z,
        scale: 0.6,
        opacity: 0.6,
        time: 100
      }, {
        x: attacker.x,
        y: attacker.y,
        z: attacker.z,
        time: 600,
        opacity: 0
      }, 'ballistic2Under');
    }
  },
  hydroshot: {
    anim: function anim(scene, _ref57) {
      var _ref58 = _slicedToArray(_ref57, 2),
        attacker = _ref58[0],
        defender = _ref58[1];
      scene.showEffect('waterwisp', {
        x: attacker.x,
        y: attacker.y,
        z: attacker.z,
        scale: 0.4,
        opacity: 0.3
      }, {
        x: defender.x + 10,
        y: defender.y + 5,
        z: defender.behind(30),
        scale: 1,
        opacity: 0.6
      }, 'decel', 'explode');
      scene.showEffect('waterwisp', {
        x: attacker.x,
        y: attacker.y,
        z: attacker.z,
        scale: 0.4,
        opacity: 0.3,
        time: 75
      }, {
        x: defender.x - 10,
        y: defender.y - 5,
        z: defender.behind(30),
        scale: 1,
        opacity: 0.6
      }, 'decel', 'explode');
      scene.showEffect('waterwisp', {
        x: attacker.x,
        y: attacker.y,
        z: attacker.z,
        scale: 0.4,
        opacity: 0.3,
        time: 150
      }, {
        x: defender.x,
        y: defender.y + 5,
        z: defender.behind(30),
        scale: 1,
        opacity: 0.6
      }, 'decel', 'explode');
    }
  },
  sound: {
    anim: function anim(scene, _ref59) {
      var _ref60 = _slicedToArray(_ref59, 1),
        attacker = _ref60[0];
      scene.showEffect('wisp', {
        x: attacker.x,
        y: attacker.y,
        z: attacker.z,
        scale: 0,
        opacity: 0.7,
        time: 0
      }, {
        z: attacker.behind(-50),
        scale: 5,
        opacity: 0,
        time: 400
      }, 'linear');
      scene.showEffect('wisp', {
        x: attacker.x,
        y: attacker.y,
        z: attacker.z,
        scale: 0,
        opacity: 0.7,
        time: 150
      }, {
        z: attacker.behind(-50),
        scale: 5,
        opacity: 0,
        time: 600
      }, 'linear');
      scene.showEffect('wisp', {
        x: attacker.x,
        y: attacker.y,
        z: attacker.z,
        scale: 0,
        opacity: 0.7,
        time: 300
      }, {
        z: attacker.behind(-50),
        scale: 5,
        opacity: 0,
        time: 800
      }, 'linear');
    }
  },
  gravity: {
    anim: function anim(scene, _ref61) {
      var _ref62 = _slicedToArray(_ref61, 1),
        attacker = _ref62[0];
      attacker.anim({
        y: attacker.y - 20,
        yscale: 0.5,
        time: 300
      }, 'decel');
      attacker.delay(200);
      attacker.anim({
        time: 300
      });
    }
  },
  futuresighthit: {
    anim: function anim(scene, _ref63) {
      var _ref64 = _slicedToArray(_ref63, 1),
        defender = _ref64[0];
      scene.backgroundEffect('#AA44BB', 250, 0.6);
      scene.backgroundEffect('#AA44FF', 250, 0.6, 400);
      defender.anim({
        scale: 1.2,
        time: 100
      });
      defender.anim({
        scale: 1,
        time: 100
      });
      defender.anim({
        scale: 1.4,
        time: 150
      });
      defender.anim({
        scale: 1,
        time: 150
      });
      scene.wait(700);
    }
  },
  doomdesirehit: {
    anim: function anim(scene, _ref65) {
      var _ref66 = _slicedToArray(_ref65, 1),
        defender = _ref66[0];
      scene.backgroundEffect('#ffffff', 600, 0.6);
      scene.showEffect('fireball', {
        x: defender.x + 40,
        y: defender.y,
        z: defender.z,
        scale: 0,
        opacity: 0.6
      }, {
        scale: 6,
        opacity: 0
      }, 'linear');
      scene.showEffect('fireball', {
        x: defender.x - 40,
        y: defender.y - 20,
        z: defender.z,
        scale: 0,
        opacity: 0.6,
        time: 150
      }, {
        scale: 6,
        opacity: 0
      }, 'linear');
      scene.showEffect('fireball', {
        x: defender.x + 10,
        y: defender.y + 20,
        z: defender.z,
        scale: 0,
        opacity: 0.6,
        time: 300
      }, {
        scale: 6,
        opacity: 0
      }, 'linear');
      defender.delay(100);
      defender.anim({
        x: defender.x - 30,
        time: 75
      });
      defender.anim({
        x: defender.x + 30,
        time: 100
      });
      defender.anim({
        x: defender.x - 30,
        time: 100
      });
      defender.anim({
        x: defender.x + 30,
        time: 100
      });
      defender.anim({
        x: defender.x,
        time: 100
      });
    }
  },
  itemoff: {
    anim: function anim(scene, _ref67) {
      var _ref68 = _slicedToArray(_ref67, 1),
        defender = _ref68[0];
      scene.showEffect('pokeball', {
        x: defender.x,
        y: defender.y,
        z: defender.z,
        scale: 1,
        opacity: 1
      }, {
        x: defender.x,
        y: defender.y + 40,
        z: defender.behind(70),
        opacity: 0,
        time: 400
      }, 'ballistic2');
    }
  },
  anger: {
    anim: function anim(scene, _ref69) {
      var _ref70 = _slicedToArray(_ref69, 1),
        attacker = _ref70[0];
      scene.showEffect('angry', {
        x: attacker.x + 20,
        y: attacker.y + 20,
        z: attacker.z,
        scale: 0.5,
        opacity: 0.5,
        time: 0
      }, {
        scale: 1,
        opacity: 1,
        time: 300
      }, 'ballistic2Under', 'fade');
      scene.showEffect('angry', {
        x: attacker.x - 20,
        y: attacker.y + 10,
        z: attacker.z,
        scale: 0.5,
        opacity: 0.5,
        time: 100
      }, {
        scale: 1,
        opacity: 1,
        time: 400
      }, 'ballistic2Under', 'fade');
      scene.showEffect('angry', {
        x: attacker.x,
        y: attacker.y + 40,
        z: attacker.z,
        scale: 0.5,
        opacity: 0.5,
        time: 200
      }, {
        scale: 1,
        opacity: 1,
        time: 500
      }, 'ballistic2Under', 'fade');
    }
  },
  bidecharge: {
    anim: function anim(scene, _ref71) {
      var _ref72 = _slicedToArray(_ref71, 1),
        attacker = _ref72[0];
      scene.showEffect('wisp', {
        x: attacker.x + 30,
        y: attacker.y,
        z: attacker.z,
        scale: 1,
        opacity: 1,
        time: 0
      }, {
        y: attacker.y + 60,
        opacity: 0.2,
        time: 400
      }, 'linear', 'fade');
      scene.showEffect('wisp', {
        x: attacker.x - 30,
        y: attacker.y,
        z: attacker.z,
        scale: 1,
        opacity: 1,
        time: 100
      }, {
        y: attacker.y + 60,
        opacity: 0.2,
        time: 500
      }, 'linear', 'fade');
      scene.showEffect('wisp', {
        x: attacker.x + 15,
        y: attacker.y,
        z: attacker.z,
        scale: 1,
        opacity: 1,
        time: 200
      }, {
        y: attacker.y + 60,
        opacity: 0.2,
        time: 600
      }, 'linear', 'fade');
      scene.showEffect('wisp', {
        x: attacker.x - 15,
        y: attacker.y,
        z: attacker.z,
        scale: 1,
        opacity: 1,
        time: 300
      }, {
        y: attacker.y + 60,
        opacity: 0.2,
        time: 700
      }, 'linear', 'fade');
      attacker.anim({
        x: attacker.x - 2.5,
        time: 75
      }, 'swing');
      attacker.anim({
        x: attacker.x + 2.5,
        time: 75
      }, 'swing');
      attacker.anim({
        x: attacker.x - 2.5,
        time: 75
      }, 'swing');
      attacker.anim({
        x: attacker.x + 2.5,
        time: 75
      }, 'swing');
      attacker.anim({
        x: attacker.x - 2.5,
        time: 75
      }, 'swing');
      attacker.anim({
        time: 100
      }, 'accel');
    }
  },
  bideunleash: {
    anim: function anim(scene, _ref73) {
      var _ref74 = _slicedToArray(_ref73, 1),
        attacker = _ref74[0];
      scene.showEffect('fireball', {
        x: attacker.x + 40,
        y: attacker.y,
        z: attacker.z,
        scale: 0,
        opacity: 0.6
      }, {
        scale: 6,
        opacity: 0
      }, 'linear');
      scene.showEffect('fireball', {
        x: attacker.x - 40,
        y: attacker.y - 20,
        z: attacker.z,
        scale: 0,
        opacity: 0.6,
        time: 150
      }, {
        scale: 6,
        opacity: 0
      }, 'linear');
      scene.showEffect('fireball', {
        x: attacker.x + 10,
        y: attacker.y + 20,
        z: attacker.z,
        scale: 0,
        opacity: 0.6,
        time: 300
      }, {
        scale: 6,
        opacity: 0
      }, 'linear');
      attacker.anim({
        x: attacker.x - 30,
        time: 75
      });
      attacker.anim({
        x: attacker.x + 30,
        time: 100
      });
      attacker.anim({
        x: attacker.x - 30,
        time: 100
      });
      attacker.anim({
        x: attacker.x + 30,
        time: 100
      });
      attacker.anim({
        x: attacker.x - 30,
        time: 100
      });
      attacker.anim({
        x: attacker.x + 30,
        time: 100
      });
      attacker.anim({
        x: attacker.x,
        time: 100
      });
    }
  },
  spectralthiefboost: {
    anim: function anim(scene, _ref75) {
      var _ref76 = _slicedToArray(_ref75, 2),
        attacker = _ref76[0],
        defender = _ref76[1];
      scene.backgroundEffect('linear-gradient(#000000 30%, #440044', 1400, 0.5);
      scene.showEffect('shadowball', {
        x: defender.x,
        y: defender.y - 30,
        z: defender.z,
        scale: 0.5,
        xscale: 0.5,
        yscale: 1,
        opacity: 0.5
      }, {
        scale: 2,
        xscale: 4,
        opacity: 0.1,
        time: 400
      }, 'decel', 'fade');
      scene.showEffect('poisonwisp', {
        x: defender.x,
        y: defender.y - 25,
        z: defender.z,
        scale: 1
      }, {
        x: defender.x + 50,
        scale: 3,
        xscale: 3.5,
        opacity: 0.3,
        time: 500
      }, 'linear', 'fade');
      scene.showEffect('poisonwisp', {
        x: defender.x,
        y: defender.y - 25,
        z: defender.z,
        scale: 1
      }, {
        x: defender.x - 50,
        scale: 3,
        xscale: 3.5,
        opacity: 0.3,
        time: 500
      }, 'linear', 'fade');
      scene.showEffect('shadowball', {
        x: defender.x + 35,
        y: defender.y,
        z: defender.z,
        opacity: 0.4,
        scale: 0.25,
        time: 50
      }, {
        y: defender.y - 40,
        opacity: 0,
        time: 300
      }, 'accel');
      scene.showEffect('shadowball', {
        x: defender.x - 35,
        y: defender.y,
        z: defender.z,
        opacity: 0.4,
        scale: 0.25,
        time: 100
      }, {
        y: defender.y - 40,
        opacity: 0,
        time: 350
      }, 'accel');
      scene.showEffect('shadowball', {
        x: defender.x + 15,
        y: defender.y,
        z: defender.z,
        opacity: 0.4,
        scale: 0.5,
        time: 150
      }, {
        y: defender.y - 40,
        opacity: 0,
        time: 400
      }, 'accel');
      scene.showEffect('shadowball', {
        x: defender.x + 15,
        y: defender.y,
        z: defender.z,
        opacity: 0.4,
        scale: 0.25,
        time: 200
      }, {
        y: defender.y - 40,
        opacity: 0,
        time: 450
      }, 'accel');
      scene.showEffect('poisonwisp', {
        x: defender.x - 50,
        y: defender.y - 40,
        z: defender.z,
        scale: 2,
        opacity: 0.3,
        time: 300
      }, {
        x: attacker.x - 50,
        y: attacker.y - 40,
        z: attacker.z,
        time: 900
      }, 'decel', 'fade');
      scene.showEffect('poisonwisp', {
        x: defender.x - 50,
        y: defender.y - 40,
        z: defender.z,
        scale: 2,
        opacity: 0.3,
        time: 400
      }, {
        x: attacker.x - 50,
        y: attacker.y - 40,
        z: attacker.z,
        time: 900
      }, 'decel', 'fade');
      scene.showEffect('poisonwisp', {
        x: defender.x,
        y: defender.y - 40,
        z: defender.z,
        scale: 2,
        opacity: 0.3,
        time: 450
      }, {
        x: attacker.x,
        y: attacker.y - 40,
        z: attacker.z,
        time: 950
      }, 'decel', 'fade');
      scene.showEffect('shadowball', {
        x: attacker.x,
        y: attacker.y - 30,
        z: attacker.z,
        scale: 0,
        xscale: 0.5,
        yscale: 1,
        opacity: 0.5,
        time: 750
      }, {
        scale: 2,
        xscale: 4,
        opacity: 0.1,
        time: 1200
      }, 'decel', 'fade');
      scene.showEffect('shadowball', {
        x: attacker.x + 35,
        y: attacker.y - 40,
        z: attacker.z,
        opacity: 0.4,
        scale: 0.25,
        time: 750
      }, {
        y: attacker.y,
        opacity: 0,
        time: 1000
      }, 'decel');
      scene.showEffect('shadowball', {
        x: attacker.x - 35,
        y: attacker.y - 40,
        z: attacker.z,
        opacity: 1,
        scale: 0.25,
        time: 800
      }, {
        y: attacker.y,
        opacity: 0,
        time: 1150
      }, 'decel');
      scene.showEffect('shadowball', {
        x: attacker.x + 15,
        y: attacker.y - 40,
        z: attacker.z,
        opacity: 1,
        scale: 0.25,
        time: 950
      }, {
        y: attacker.y,
        opacity: 0,
        time: 1200
      }, 'decel');
      scene.showEffect('shadowball', {
        x: attacker.x + 15,
        y: attacker.y - 40,
        z: attacker.z,
        opacity: 1,
        scale: 0.25,
        time: 1000
      }, {
        y: attacker.y,
        opacity: 0,
        time: 1350
      }, 'decel');
      scene.showEffect('poisonwisp', {
        x: attacker.x,
        y: attacker.y - 25,
        z: attacker.z,
        scale: 2,
        opacity: 1,
        time: 750
      }, {
        x: attacker.x + 75,
        opacity: 0.3,
        time: 1200
      }, 'linear', 'fade');
      scene.showEffect('poisonwisp', {
        x: attacker.x,
        y: attacker.y - 25,
        z: attacker.z,
        scale: 2,
        opacity: 1,
        time: 750
      }, {
        x: attacker.x - 75,
        opacity: 0.3,
        time: 1200
      }, 'linear', 'fade');
      defender.anim({
        x: defender.x - 15,
        time: 75
      });
      defender.anim({
        x: defender.x + 15,
        time: 100
      });
      defender.anim({
        x: defender.x - 15,
        time: 100
      });
      defender.anim({
        x: defender.x + 15,
        time: 100
      });
      defender.anim({
        x: defender.x - 15,
        time: 100
      });
      defender.anim({
        x: defender.x + 15,
        time: 100
      });
      defender.anim({
        x: defender.x,
        time: 100
      });
    }
  },
  schoolingin: {
    anim: function anim(scene, _ref77) {
      var _ref78 = _slicedToArray(_ref77, 1),
        attacker = _ref78[0];
      scene.backgroundEffect('#0000DD', 600, 0.2);
      scene.showEffect('wisp', {
        x: attacker.x,
        y: attacker.y,
        z: attacker.z,
        scale: 2.5,
        opacity: 1
      }, {
        scale: 3,
        time: 600
      }, 'linear', 'explode');
      scene.showEffect('waterwisp', {
        x: attacker.x,
        y: attacker.y,
        z: attacker.z,
        scale: 3,
        opacity: 0.3
      }, {
        scale: 3.25,
        time: 600
      }, 'linear', 'explode');
      scene.showEffect('iceball', {
        x: attacker.leftof(200),
        y: attacker.y + 40,
        z: attacker.z,
        scale: 0.5,
        opacity: 0.5
      }, {
        x: attacker.x,
        y: attacker.y,
        z: attacker.z,
        opacity: 0,
        time: 200
      }, 'ballistic', 'fade');
      scene.showEffect('iceball', {
        x: attacker.leftof(-140),
        y: attacker.y - 60,
        z: attacker.z,
        scale: 0.5,
        opacity: 0.5,
        time: 100
      }, {
        x: attacker.x,
        y: attacker.y,
        z: attacker.z,
        opacity: 0,
        time: 300
      }, 'ballistic2Under', 'fade');
      scene.showEffect('iceball', {
        x: attacker.leftof(-140),
        y: attacker.y + 50,
        z: attacker.behind(170),
        scale: 0.5,
        opacity: 0.5,
        time: 200
      }, {
        x: attacker.x,
        y: attacker.y,
        z: attacker.z,
        opacity: 0,
        time: 400
      }, 'ballistic2', 'fade');
      scene.showEffect('iceball', {
        x: attacker.x,
        y: attacker.y + 30,
        z: attacker.behind(-250),
        scale: 0.5,
        opacity: 0.5,
        time: 200
      }, {
        x: attacker.x,
        y: attacker.y,
        z: attacker.z,
        opacity: 0,
        time: 500
      }, 'ballistic', 'fade');
      scene.showEffect('iceball', {
        x: attacker.leftof(240),
        y: attacker.y - 80,
        z: attacker.z,
        scale: 0.5,
        opacity: 0.5,
        time: 300
      }, {
        x: attacker.x,
        y: attacker.y,
        z: attacker.z,
        opacity: 0,
        time: 600
      }, 'ballistic2Under');
    }
  },
  schoolingout: {
    anim: function anim(scene, _ref79) {
      var _ref80 = _slicedToArray(_ref79, 1),
        attacker = _ref80[0];
      scene.backgroundEffect('#0000DD', 600, 0.2);
      scene.showEffect('wisp', {
        x: attacker.x,
        y: attacker.y,
        z: attacker.z,
        scale: 3,
        opacity: 1
      }, {
        scale: 2,
        time: 600
      }, 'linear', 'explode');
      scene.showEffect('waterwisp', {
        x: attacker.x,
        y: attacker.y,
        z: attacker.z,
        scale: 3.25,
        opacity: 0.3
      }, {
        scale: 2.5,
        time: 600
      }, 'linear', 'explode');
      scene.showEffect('iceball', {
        x: attacker.x,
        y: attacker.y,
        z: attacker.z,
        scale: 0.5,
        opacity: 0
      }, {
        x: attacker.leftof(200),
        y: attacker.y + 40,
        z: attacker.z,
        scale: 0.5,
        opacity: 0.5,
        time: 200
      }, 'ballistic', 'fade');
      scene.showEffect('iceball', {
        x: attacker.x,
        y: attacker.y,
        z: attacker.z,
        scale: 0.5,
        opacity: 0,
        time: 100
      }, {
        x: attacker.leftof(-140),
        y: attacker.y - 60,
        z: attacker.z,
        opacity: 0.5,
        time: 300
      }, 'ballistic2Under', 'fade');
      scene.showEffect('iceball', {
        x: attacker.x,
        y: attacker.y,
        z: attacker.z,
        scale: 0.5,
        opacity: 0,
        time: 200
      }, {
        x: attacker.leftof(-140),
        y: attacker.y + 50,
        z: attacker.behind(170),
        opacity: 0.5,
        time: 400
      }, 'ballistic2', 'fade');
      scene.showEffect('iceball', {
        x: attacker.x,
        y: attacker.y,
        z: attacker.z,
        scale: 0.5,
        opacity: 0,
        time: 200
      }, {
        x: attacker.x,
        y: attacker.y + 30,
        z: attacker.behind(-250),
        opacity: 0.5,
        time: 500
      }, 'ballistic', 'fade');
      scene.showEffect('iceball', {
        x: attacker.x,
        y: attacker.y,
        z: attacker.z,
        scale: 0.5,
        opacity: 0,
        time: 300
      }, {
        x: attacker.leftof(240),
        y: attacker.y - 80,
        z: attacker.z,
        opacity: 0.5,
        time: 600
      }, 'ballistic2Under');
    }
  },
  primalalpha: {
    anim: function anim(scene, _ref81) {
      var _ref82 = _slicedToArray(_ref81, 1),
        attacker = _ref82[0];
      scene.backgroundEffect('#0000DD', 500, 0.4);
      scene.showEffect('iceball', {
        x: attacker.x,
        y: attacker.y,
        z: attacker.z,
        scale: 2,
        opacity: 0.2,
        time: 0
      }, {
        scale: 0.5,
        opacity: 1,
        time: 300
      }, 'linear', 'fade');
      scene.showEffect('iceball', {
        x: attacker.x,
        y: attacker.y,
        z: attacker.z,
        scale: 0.5,
        opacity: 1,
        time: 300
      }, {
        scale: 4,
        opacity: 0,
        time: 700
      }, 'linear', 'fade');
      scene.showEffect('shadowball', {
        x: attacker.x,
        y: attacker.y,
        z: attacker.z,
        scale: 0.5,
        opacity: 0.5,
        time: 300
      }, {
        scale: 5,
        opacity: 0,
        time: 600
      }, 'linear', 'fade');
      scene.showEffect('alpha', {
        x: attacker.x,
        y: attacker.y,
        z: attacker.z,
        scale: 0.5,
        opacity: 1,
        time: 300
      }, {
        scale: 2.5,
        opacity: 0,
        time: 600
      }, 'decel');
    }
  },
  primalomega: {
    anim: function anim(scene, _ref83) {
      var _ref84 = _slicedToArray(_ref83, 1),
        attacker = _ref84[0];
      scene.backgroundEffect('linear-gradient(#390000 30%, #B84038)', 500, 0.4);
      scene.showEffect('flareball', {
        x: attacker.x,
        y: attacker.y,
        z: attacker.z,
        scale: 2,
        opacity: 0.2,
        time: 0
      }, {
        scale: 0.5,
        opacity: 1,
        time: 300
      }, 'linear', 'fade');
      scene.showEffect('flareball', {
        x: attacker.x,
        y: attacker.y,
        z: attacker.z,
        scale: 0.5,
        opacity: 1,
        time: 300
      }, {
        scale: 4,
        opacity: 0,
        time: 700
      }, 'linear', 'fade');
      scene.showEffect('shadowball', {
        x: attacker.x,
        y: attacker.y,
        z: attacker.z,
        scale: 0.5,
        opacity: 0.5,
        time: 300
      }, {
        scale: 5,
        opacity: 0,
        time: 600
      }, 'linear', 'fade');
      scene.showEffect('omega', {
        x: attacker.x,
        y: attacker.y,
        z: attacker.z,
        scale: 0.5,
        opacity: 1,
        time: 300
      }, {
        scale: 2.5,
        opacity: 0,
        time: 600
      }, 'decel');
    }
  },
  megaevo: {
    anim: function anim(scene, _ref85) {
      var _ref86 = _slicedToArray(_ref85, 1),
        attacker = _ref86[0];
      scene.backgroundEffect('#835BA5', 500, 0.6);
      scene.showEffect('iceball', {
        x: attacker.x,
        y: attacker.y,
        z: attacker.z,
        scale: 2,
        opacity: 0.2,
        time: 0
      }, {
        scale: 0.5,
        opacity: 1,
        time: 300
      }, 'linear', 'fade');
      scene.showEffect('iceball', {
        x: attacker.x,
        y: attacker.y,
        z: attacker.z,
        scale: 0.5,
        opacity: 1,
        time: 300
      }, {
        scale: 4,
        opacity: 0,
        time: 700
      }, 'linear', 'fade');
      scene.showEffect('mistball', {
        x: attacker.x,
        y: attacker.y,
        z: attacker.z,
        scale: 0.5,
        opacity: 0.5,
        time: 300
      }, {
        scale: 5,
        opacity: 0,
        time: 600
      }, 'linear', 'fade');
      scene.showEffect('rainbow', {
        x: attacker.x,
        y: attacker.y,
        z: attacker.z,
        scale: 0.5,
        opacity: 1,
        time: 300
      }, {
        scale: 5,
        opacity: 0,
        time: 600
      }, 'linear', 'fade');
    }
  },
  zpower: {
    anim: function anim(scene, _ref87) {
      var _ref88 = _slicedToArray(_ref87, 1),
        attacker = _ref88[0];
      scene.backgroundEffect('linear-gradient(#000000 20%, #0000DD)', 1800, 0.4);
      scene.showEffect('electroball', {
        x: attacker.x - 60,
        y: attacker.y + 40,
        z: attacker.z,
        scale: 0.7,
        opacity: 0.7,
        time: 0
      }, {
        x: attacker.x,
        y: attacker.y,
        scale: 0.2,
        opacity: 0.2,
        time: 300
      }, 'linear', 'fade');
      scene.showEffect('electroball', {
        x: attacker.x + 60,
        y: attacker.y - 5,
        z: attacker.z,
        scale: 0.7,
        opacity: 0.7,
        time: 100
      }, {
        x: attacker.x,
        y: attacker.y,
        scale: 0.2,
        opacity: 0.2,
        time: 300
      }, 'linear', 'fade');
      scene.showEffect('electroball', {
        x: attacker.x - 30,
        y: attacker.y + 60,
        z: attacker.z,
        scale: 0.7,
        opacity: 0.7,
        time: 100
      }, {
        x: attacker.x,
        y: attacker.y,
        scale: 0.2,
        opacity: 0.2,
        time: 400
      }, 'linear', 'fade');
      scene.showEffect('electroball', {
        x: attacker.x + 20,
        y: attacker.y - 50,
        z: attacker.z,
        scale: 0.7,
        opacity: 0.7,
        time: 100
      }, {
        x: attacker.x,
        y: attacker.y,
        scale: 0.2,
        opacity: 0.2,
        time: 400
      }, 'linear', 'fade');
      scene.showEffect('electroball', {
        x: attacker.x - 70,
        y: attacker.y - 50,
        z: attacker.z,
        scale: 0.7,
        opacity: 0.7,
        time: 200
      }, {
        x: attacker.x,
        y: attacker.y,
        scale: 0.2,
        opacity: 0.2,
        time: 500
      }, 'linear', 'fade');
      scene.showEffect('zsymbol', {
        x: attacker.x,
        y: attacker.y,
        z: attacker.z,
        scale: 0.7,
        opacity: 1,
        time: 500
      }, {
        scale: 1,
        opacity: 0.5,
        time: 800
      }, 'decel', 'explode');
      scene.showEffect(attacker.sp, {
        x: attacker.x,
        y: attacker.y,
        z: attacker.z,
        opacity: 0.3,
        time: 800
      }, {
        y: attacker.y + 20,
        scale: 2,
        opacity: 0,
        time: 1200
      }, 'accel');
      scene.showEffect(attacker.sp, {
        x: attacker.x,
        y: attacker.y,
        z: attacker.z,
        opacity: 0.3,
        time: 1000
      }, {
        y: attacker.y + 20,
        scale: 2,
        opacity: 0,
        time: 1400
      }, 'accel');
      scene.showEffect(attacker.sp, {
        x: attacker.x,
        y: attacker.y,
        z: attacker.z,
        opacity: 0.3,
        time: 1200
      }, {
        y: attacker.y + 20,
        scale: 2,
        opacity: 0,
        time: 1600
      }, 'accel');
    }
  },
  powerconstruct: {
    anim: function anim(scene, _ref89) {
      var _ref90 = _slicedToArray(_ref89, 1),
        attacker = _ref90[0];
      var xf = [1, -1, 1, -1];
      var yf = [1, -1, -1, 1];
      var xf2 = [1, 0, -1, 0];
      var yf2 = [0, 1, 0, -1];
      scene.backgroundEffect('#000000', 1000, 0.7);
      for (var i = 0; i < 4; i++) {
        scene.showEffect('energyball', {
          x: attacker.x + 150 * xf[i],
          y: attacker.y - 50,
          z: attacker.z + 70 * yf[i],
          scale: 0.1,
          xscale: 0.5,
          opacity: 0.4
        }, {
          x: attacker.x,
          y: attacker.y - 50,
          z: attacker.z,
          scale: 0.3,
          xscale: 0.8,
          opacity: 0,
          time: 500
        }, 'decel', 'fade');
        scene.showEffect('energyball', {
          x: attacker.x + 200 * xf2[i],
          y: attacker.y - 50,
          z: attacker.z + 90 * yf2[i],
          scale: 0.1,
          xscale: 0.5,
          opacity: 0.4
        }, {
          x: attacker.x,
          y: attacker.y - 50,
          z: attacker.z,
          scale: 0.3,
          xscale: 0.8,
          opacity: 0,
          time: 500
        }, 'decel', 'fade');
        scene.showEffect('energyball', {
          x: attacker.x + 50 * xf[i],
          y: attacker.y - 50,
          z: attacker.z + 100 * yf[i],
          scale: 0.1,
          xscale: 0.5,
          opacity: 0.4,
          time: 200
        }, {
          x: attacker.x,
          y: attacker.y - 50,
          z: attacker.z,
          scale: 0.3,
          xscale: 0.8,
          opacity: 0,
          time: 500
        }, 'decel', 'fade');
        scene.showEffect('energyball', {
          x: attacker.x + 100 * xf2[i],
          y: attacker.y - 50,
          z: attacker.z + 90 * yf2[i],
          scale: 0.1,
          xscale: 0.5,
          opacity: 0.4,
          time: 200
        }, {
          x: attacker.x,
          y: attacker.y - 50,
          z: attacker.z,
          scale: 0.3,
          xscale: 0.8,
          opacity: 0,
          time: 500
        }, 'decel', 'fade');
      }
      scene.showEffect('energyball', {
        x: attacker.x,
        y: attacker.y - 25,
        z: attacker.z,
        scale: 3,
        opacity: 0,
        time: 50
      }, {
        scale: 1,
        opacity: 0.8,
        time: 300
      }, 'linear', 'fade');
      scene.showEffect('energyball', {
        x: attacker.x,
        y: attacker.y - 25,
        z: attacker.z,
        scale: 3.5,
        opacity: 0,
        time: 150
      }, {
        scale: 1.5,
        opacity: 1,
        time: 350
      }, 'linear', 'fade');
      scene.showEffect('energyball', {
        x: attacker.x,
        y: attacker.y - 25,
        z: attacker.z,
        scale: 0.5,
        opacity: 1,
        time: 200
      }, {
        scale: 3,
        opacity: 0,
        time: 600
      }, 'linear', 'fade');
      scene.showEffect('wisp', {
        x: attacker.x,
        y: attacker.y - 25,
        z: attacker.z,
        scale: 1,
        opacity: 0.6,
        time: 100
      }, {
        scale: 3.5,
        opacity: 0.8,
        time: 500
      }, 'linear', 'explode');
    }
  },
  ultraburst: {
    anim: function anim(scene, _ref91) {
      var _ref92 = _slicedToArray(_ref91, 1),
        attacker = _ref92[0];
      scene.backgroundEffect('#000000', 600, 0.5);
      scene.backgroundEffect('#ffffff', 500, 1, 550);
      scene.showEffect('wisp', {
        x: attacker.x - 60,
        y: attacker.y + 40,
        z: attacker.z,
        scale: 0.7,
        opacity: 0.7,
        time: 0
      }, {
        x: attacker.x,
        y: attacker.y,
        scale: 0.2,
        opacity: 0.2,
        time: 150
      }, 'linear', 'fade');
      scene.showEffect('wisp', {
        x: attacker.x + 60,
        y: attacker.y - 5,
        z: attacker.z,
        scale: 0.7,
        opacity: 0.7,
        time: 100
      }, {
        x: attacker.x,
        y: attacker.y,
        scale: 0.2,
        opacity: 0.2,
        time: 150
      }, 'linear', 'fade');
      scene.showEffect('wisp', {
        x: attacker.x - 30,
        y: attacker.y + 60,
        z: attacker.z,
        scale: 0.7,
        opacity: 0.7,
        time: 100
      }, {
        x: attacker.x,
        y: attacker.y,
        scale: 0.2,
        opacity: 0.2,
        time: 250
      }, 'linear', 'fade');
      scene.showEffect('wisp', {
        x: attacker.x + 20,
        y: attacker.y - 50,
        z: attacker.z,
        scale: 0.7,
        opacity: 0.7,
        time: 100
      }, {
        x: attacker.x,
        y: attacker.y,
        scale: 0.2,
        opacity: 0.2,
        time: 250
      }, 'linear', 'fade');
      scene.showEffect('wisp', {
        x: attacker.x - 70,
        y: attacker.y - 50,
        z: attacker.z,
        scale: 0.7,
        opacity: 0.7,
        time: 100
      }, {
        x: attacker.x,
        y: attacker.y,
        scale: 0.2,
        opacity: 0.2,
        time: 300
      }, 'linear', 'fade');
      scene.showEffect('wisp', {
        x: attacker.x,
        y: attacker.y,
        z: attacker.z,
        scale: 1.5,
        opacity: 1
      }, {
        scale: 4,
        time: 600
      }, 'linear', 'explode');
      scene.showEffect('electroball', {
        x: attacker.x,
        y: attacker.y,
        z: attacker.z,
        scale: 2,
        opacity: 0
      }, {
        scale: 2.25,
        opacity: 0.1,
        time: 600
      }, 'linear', 'explode');
      scene.showEffect('energyball', {
        x: attacker.x,
        y: attacker.y,
        z: attacker.z,
        scale: 2,
        opacity: 0,
        time: 200
      }, {
        scale: 2.25,
        opacity: 0.1,
        time: 600
      }, 'linear', 'explode');
      scene.showEffect('electroball', {
        x: attacker.x,
        y: attacker.y,
        z: attacker.z,
        scale: 6,
        opacity: 0.2
      }, {
        scale: 1,
        opacity: 0,
        time: 300
      }, 'linear');
      scene.showEffect('electroball', {
        x: attacker.x,
        y: attacker.y,
        z: attacker.z,
        scale: 6,
        opacity: 0.2,
        time: 150
      }, {
        scale: 1,
        opacity: 0,
        time: 450
      }, 'linear');
      scene.showEffect('electroball', {
        x: attacker.x,
        y: attacker.y,
        z: attacker.z,
        scale: 6,
        opacity: 0.2,
        time: 300
      }, {
        scale: 1,
        opacity: 0,
        time: 600
      }, 'linear');
      scene.showEffect('ultra', {
        x: attacker.x,
        y: attacker.y,
        z: attacker.z,
        scale: 0.5,
        opacity: 1,
        time: 600
      }, {
        scale: 1,
        opacity: 0,
        time: 900
      }, 'decel');
      scene.showEffect('iceball', {
        x: attacker.x,
        y: attacker.y - 60,
        z: attacker.z,
        scale: 0.5,
        xscale: 0.25,
        yscale: 0,
        opacity: 0.5,
        time: 600
      }, {
        scale: 2,
        xscale: 6,
        yscale: 1,
        opacity: 0,
        time: 800
      }, 'linear');
      scene.showEffect('iceball', {
        x: attacker.x,
        y: attacker.y - 60,
        z: attacker.z,
        scale: 0.5,
        xscale: 0.25,
        yscale: 0.75,
        opacity: 0.5,
        time: 800
      }, {
        scale: 2,
        xscale: 6,
        opacity: 0.1,
        time: 1000
      }, 'linear');
    }
  }
};
var BattleStatusAnims = {
  brn: {
    anim: function anim(scene, _ref93) {
      var _ref94 = _slicedToArray(_ref93, 1),
        attacker = _ref94[0];
      scene.showEffect('fireball', {
        x: attacker.x - 20,
        y: attacker.y - 15,
        z: attacker.z,
        scale: 0.2,
        opacity: 0.3
      }, {
        x: attacker.x + 40,
        y: attacker.y + 15,
        z: attacker.z,
        scale: 1,
        opacity: 1,
        time: 300
      }, 'swing', 'fade');
    }
  },
  psn: {
    anim: function anim(scene, _ref95) {
      var _ref96 = _slicedToArray(_ref95, 1),
        attacker = _ref96[0];
      scene.showEffect('poisonwisp', {
        x: attacker.x + 30,
        y: attacker.y - 40,
        z: attacker.z,
        scale: 0.2,
        opacity: 1,
        time: 0
      }, {
        y: attacker.y,
        scale: 1,
        opacity: 0.5,
        time: 300
      }, 'decel', 'fade');
      scene.showEffect('poisonwisp', {
        x: attacker.x - 30,
        y: attacker.y - 40,
        z: attacker.z,
        scale: 0.2,
        opacity: 1,
        time: 100
      }, {
        y: attacker.y,
        scale: 1,
        opacity: 0.5,
        time: 400
      }, 'decel', 'fade');
      scene.showEffect('poisonwisp', {
        x: attacker.x,
        y: attacker.y - 40,
        z: attacker.z,
        scale: 0.2,
        opacity: 1,
        time: 200
      }, {
        y: attacker.y,
        scale: 1,
        opacity: 0.5,
        time: 500
      }, 'decel', 'fade');
    }
  },
  slp: {
    anim: function anim(scene, _ref97) {
      var _ref98 = _slicedToArray(_ref97, 1),
        attacker = _ref98[0];
      scene.showEffect('wisp', {
        x: attacker.x,
        y: attacker.y + 20,
        z: attacker.z,
        scale: 0.5,
        opacity: 0.1
      }, {
        x: attacker.x,
        y: attacker.y + 20,
        z: attacker.behind(-50),
        scale: 1.5,
        opacity: 1,
        time: 400
      }, 'ballistic2Under', 'fade');
      scene.showEffect('wisp', {
        x: attacker.x,
        y: attacker.y + 20,
        z: attacker.z,
        scale: 0.5,
        opacity: 0.1,
        time: 200
      }, {
        x: attacker.x,
        y: attacker.y + 20,
        z: attacker.behind(-50),
        scale: 1.5,
        opacity: 1,
        time: 600
      }, 'ballistic2Under', 'fade');
    }
  },
  par: {
    anim: function anim(scene, _ref99) {
      var _ref100 = _slicedToArray(_ref99, 1),
        attacker = _ref100[0];
      scene.showEffect('electroball', {
        x: attacker.x,
        y: attacker.y,
        z: attacker.z,
        scale: 1.5,
        opacity: 0.2
      }, {
        scale: 2,
        opacity: 0.1,
        time: 300
      }, 'linear', 'fade');
      attacker.delay(100);
      attacker.anim({
        x: attacker.x - 1,
        time: 75
      }, 'swing');
      attacker.anim({
        x: attacker.x + 1,
        time: 75
      }, 'swing');
      attacker.anim({
        x: attacker.x - 1,
        time: 75
      }, 'swing');
      attacker.anim({
        x: attacker.x + 1,
        time: 75
      }, 'swing');
      attacker.anim({
        x: attacker.x - 1,
        time: 75
      }, 'swing');
      attacker.anim({
        time: 100
      }, 'accel');
    }
  },
  frz: {
    anim: function anim(scene, _ref101) {
      var _ref102 = _slicedToArray(_ref101, 1),
        attacker = _ref102[0];
      scene.showEffect('icicle', {
        x: attacker.x - 30,
        y: attacker.y,
        z: attacker.z,
        scale: 0.5,
        opacity: 0.5,
        time: 200
      }, {
        scale: 0.9,
        opacity: 0,
        time: 600
      }, 'linear', 'fade');
      scene.showEffect('icicle', {
        x: attacker.x,
        y: attacker.y - 30,
        z: attacker.z,
        scale: 0.5,
        opacity: 0.5,
        time: 300
      }, {
        scale: 0.9,
        opacity: 0,
        time: 650
      }, 'linear', 'fade');
      scene.showEffect('icicle', {
        x: attacker.x + 15,
        y: attacker.y,
        z: attacker.z,
        scale: 0.5,
        opacity: 0.5,
        time: 400
      }, {
        scale: 0.9,
        opacity: 0,
        time: 700
      }, 'linear', 'fade');
      scene.showEffect('wisp', {
        x: attacker.x,
        y: attacker.y,
        z: attacker.z,
        scale: 1,
        opacity: 0.5
      }, {
        scale: 3,
        opacity: 0,
        time: 600
      }, 'linear', 'fade');
    }
  },
  flinch: {
    anim: function anim(scene, _ref103) {
      var _ref104 = _slicedToArray(_ref103, 1),
        attacker = _ref104[0];
      scene.showEffect('shadowball', {
        x: attacker.x,
        y: attacker.y,
        z: attacker.z,
        scale: 1,
        opacity: 0.2
      }, {
        scale: 3,
        opacity: 0.1,
        time: 300
      }, 'linear', 'fade');
    }
  },
  attracted: {
    anim: function anim(scene, _ref105) {
      var _ref106 = _slicedToArray(_ref105, 1),
        attacker = _ref106[0];
      scene.showEffect('heart', {
        x: attacker.x + 20,
        y: attacker.y + 20,
        z: attacker.z,
        scale: 0.5,
        opacity: 0.5,
        time: 0
      }, {
        scale: 1,
        opacity: 1,
        time: 300
      }, 'ballistic2Under', 'fade');
      scene.showEffect('heart', {
        x: attacker.x - 20,
        y: attacker.y + 10,
        z: attacker.z,
        scale: 0.5,
        opacity: 0.5,
        time: 100
      }, {
        scale: 1,
        opacity: 1,
        time: 400
      }, 'ballistic2Under', 'fade');
      scene.showEffect('heart', {
        x: attacker.x,
        y: attacker.y + 40,
        z: attacker.z,
        scale: 0.5,
        opacity: 0.5,
        time: 200
      }, {
        scale: 1,
        opacity: 1,
        time: 500
      }, 'ballistic2Under', 'fade');
    }
  },
  cursed: {
    anim: function anim(scene, _ref107) {
      var _ref108 = _slicedToArray(_ref107, 1),
        attacker = _ref108[0];
      scene.backgroundEffect('#000000', 700, 0.2);
      attacker.delay(300);
      attacker.anim({
        x: attacker.x - 5,
        time: 50
      });
      attacker.anim({
        x: attacker.x + 5,
        time: 50
      });
      attacker.anim({
        x: attacker.x - 5,
        time: 50
      });
      attacker.anim({
        x: attacker.x + 5,
        time: 50
      });
      attacker.anim({
        x: attacker.x,
        time: 50
      });
      scene.showEffect(attacker.sp, {
        x: attacker.x,
        y: attacker.y,
        z: attacker.z,
        opacity: 0.5,
        time: 0
      }, {
        z: attacker.behind(20),
        opacity: 0,
        time: 600
      }, 'decel');
    }
  },
  confused: {
    anim: function anim(scene, _ref109) {
      var _ref110 = _slicedToArray(_ref109, 1),
        attacker = _ref110[0];
      scene.showEffect('electroball', {
        x: attacker.x + 50,
        y: attacker.y + 30,
        z: attacker.z,
        scale: 0.1,
        opacity: 1,
        time: 400
      }, {
        x: attacker.x - 50,
        scale: 0.15,
        opacity: 0.4,
        time: 600
      }, 'linear', 'fade');
      scene.showEffect('electroball', {
        x: attacker.x - 50,
        y: attacker.y + 30,
        z: attacker.z,
        scale: 0.1,
        opacity: 1,
        time: 400
      }, {
        x: attacker.x + 50,
        scale: 0.15,
        opacity: 0.4,
        time: 600
      }, 'linear', 'fade');
      scene.showEffect('electroball', {
        x: attacker.x + 50,
        y: attacker.y + 30,
        z: attacker.z,
        scale: 0.1,
        opacity: 1,
        time: 600
      }, {
        x: attacker.x - 50,
        scale: 0.4,
        opacity: 0.4,
        time: 800
      }, 'linear', 'fade');
      scene.showEffect('electroball', {
        x: attacker.x - 50,
        y: attacker.y + 30,
        z: attacker.z,
        scale: 0.15,
        opacity: 1,
        time: 600
      }, {
        x: attacker.x + 50,
        scale: 0.4,
        opacity: 0.4,
        time: 800
      }, 'linear', 'fade');
    }
  },
  confusedselfhit: {
    anim: function anim(scene, _ref111) {
      var _ref112 = _slicedToArray(_ref111, 1),
        attacker = _ref112[0];
      scene.showEffect('wisp', {
        x: attacker.x,
        y: attacker.y,
        z: attacker.z,
        scale: 0,
        opacity: 0.5
      }, {
        scale: 2,
        opacity: 0,
        time: 200
      }, 'linear');
      attacker.delay(50);
      attacker.anim({
        x: attacker.leftof(2),
        z: attacker.behind(5),
        time: 100
      }, 'swing');
      attacker.anim({
        time: 300
      }, 'swing');
    }
  }
};
BattleStatusAnims['focuspunch'] = {
  anim: BattleStatusAnims['flinch'].anim
};