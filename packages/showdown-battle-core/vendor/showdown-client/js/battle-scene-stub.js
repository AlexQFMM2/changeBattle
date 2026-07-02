"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
var BattleSceneStub = /*#__PURE__*/function () {
  function BattleSceneStub() {
    _classCallCheck(this, BattleSceneStub);
    _defineProperty(this, "animating", false);
    _defineProperty(this, "acceleration", NaN);
    _defineProperty(this, "gen", NaN);
    _defineProperty(this, "activeCount", NaN);
    _defineProperty(this, "numericId", NaN);
    _defineProperty(this, "timeOffset", NaN);
    _defineProperty(this, "interruptionCount", NaN);
    _defineProperty(this, "messagebarOpen", false);
    _defineProperty(this, "log", {
      add: function add(args, kwargs) {}
    });
  }
  return _createClass(BattleSceneStub, [{
    key: "abilityActivateAnim",
    value: function abilityActivateAnim(pokemon, result) {}
  }, {
    key: "addPokemonSprite",
    value: function addPokemonSprite(pokemon) {
      return null;
    }
  }, {
    key: "addSideCondition",
    value: function addSideCondition(siden, id, instant) {}
  }, {
    key: "animationOff",
    value: function animationOff() {}
  }, {
    key: "animationOn",
    value: function animationOn() {}
  }, {
    key: "maybeCloseMessagebar",
    value: function maybeCloseMessagebar(args, kwArgs) {
      return false;
    }
  }, {
    key: "closeMessagebar",
    value: function closeMessagebar() {
      return false;
    }
  }, {
    key: "damageAnim",
    value: function damageAnim(pokemon, damage) {}
  }, {
    key: "destroy",
    value: function destroy() {}
  }, {
    key: "finishAnimations",
    value: function finishAnimations() {
      return undefined;
    }
  }, {
    key: "healAnim",
    value: function healAnim(pokemon, damage) {}
  }, {
    key: "hideJoinButtons",
    value: function hideJoinButtons() {}
  }, {
    key: "incrementTurn",
    value: function incrementTurn() {}
  }, {
    key: "updateAcceleration",
    value: function updateAcceleration() {}
  }, {
    key: "message",
    value: function message(_message, hiddenMessage) {}
  }, {
    key: "pause",
    value: function pause() {}
  }, {
    key: "setMute",
    value: function setMute(muted) {}
  }, {
    key: "preemptCatchup",
    value: function preemptCatchup() {}
  }, {
    key: "removeSideCondition",
    value: function removeSideCondition(siden, id) {}
  }, {
    key: "reset",
    value: function reset() {}
  }, {
    key: "resetBgm",
    value: function resetBgm() {}
  }, {
    key: "updateBgm",
    value: function updateBgm() {}
  }, {
    key: "resultAnim",
    value: function resultAnim(pokemon, result, type) {}
  }, {
    key: "typeAnim",
    value: function typeAnim(pokemon, types) {}
  }, {
    key: "resume",
    value: function resume() {}
  }, {
    key: "runMoveAnim",
    value: function runMoveAnim(moveid, participants) {}
  }, {
    key: "runOtherAnim",
    value: function runOtherAnim(moveid, participants) {}
  }, {
    key: "runPrepareAnim",
    value: function runPrepareAnim(moveid, attacker, defender) {}
  }, {
    key: "runResidualAnim",
    value: function runResidualAnim(moveid, pokemon) {}
  }, {
    key: "runStatusAnim",
    value: function runStatusAnim(moveid, participants) {}
  }, {
    key: "startAnimations",
    value: function startAnimations() {}
  }, {
    key: "teamPreview",
    value: function teamPreview() {}
  }, {
    key: "resetSides",
    value: function resetSides() {}
  }, {
    key: "updateGen",
    value: function updateGen() {}
  }, {
    key: "updateSidebar",
    value: function updateSidebar(side) {}
  }, {
    key: "updateSidebars",
    value: function updateSidebars() {}
  }, {
    key: "updateStatbars",
    value: function updateStatbars() {}
  }, {
    key: "updateWeather",
    value: function updateWeather(instant) {}
  }, {
    key: "upkeepWeather",
    value: function upkeepWeather() {}
  }, {
    key: "wait",
    value: function wait(time) {}
  }, {
    key: "setFrameHTML",
    value: function setFrameHTML(html) {}
  }, {
    key: "setControlsHTML",
    value: function setControlsHTML(html) {}
  }, {
    key: "removeEffect",
    value: function removeEffect(pokemon, id, instant) {}
  }, {
    key: "addEffect",
    value: function addEffect(pokemon, id, instant) {}
  }, {
    key: "animSummon",
    value: function animSummon(pokemon, slot, instant) {}
  }, {
    key: "animUnsummon",
    value: function animUnsummon(pokemon, instant) {}
  }, {
    key: "animDragIn",
    value: function animDragIn(pokemon, slot) {}
  }, {
    key: "animDragOut",
    value: function animDragOut(pokemon) {}
  }, {
    key: "resetStatbar",
    value: function resetStatbar(pokemon, startHidden) {}
  }, {
    key: "updateStatbar",
    value: function updateStatbar(pokemon, updatePrevhp, updateHp) {}
  }, {
    key: "updateStatbarIfExists",
    value: function updateStatbarIfExists(pokemon, updatePrevhp, updateHp) {}
  }, {
    key: "animTransform",
    value: function animTransform(pokemon, useSpeciesAnim, isPermanent) {}
  }, {
    key: "clearEffects",
    value: function clearEffects(pokemon) {}
  }, {
    key: "removeTransform",
    value: function removeTransform(pokemon) {}
  }, {
    key: "animFaint",
    value: function animFaint(pokemon) {}
  }, {
    key: "animReset",
    value: function animReset(pokemon) {}
  }, {
    key: "anim",
    value: function anim(pokemon, end, transition) {}
  }, {
    key: "beforeMove",
    value: function beforeMove(pokemon) {}
  }, {
    key: "afterMove",
    value: function afterMove(pokemon) {}
  }]);
}();
if (typeof require === 'function') {
  // in Node
  global.BattleSceneStub = BattleSceneStub;
}