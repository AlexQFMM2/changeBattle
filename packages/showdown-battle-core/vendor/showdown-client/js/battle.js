"use strict";

function _toConsumableArray(r) { return _arrayWithoutHoles(r) || _iterableToArray(r) || _unsupportedIterableToArray(r) || _nonIterableSpread(); }
function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _iterableToArray(r) { if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r); }
function _arrayWithoutHoles(r) { if (Array.isArray(r)) return _arrayLikeToArray(r); }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _slicedToArray(r, e) { return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t.return && (u = t.return(), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
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
 * Pokemon Showdown Battle
 *
 * This is the main file for handling battle animations
 *
 * Licensing note: PS's client has complicated licensing:
 * - The client as a whole is AGPLv3
 * - The battle replay/animation engine (battle-*.ts) by itself is MIT
 *
 * Layout:
 *
 * - Battle
 *   - Side
 *     - Pokemon
 *   - BattleScene
 *     - BattleLog
 *       - BattleTextParser
 *
 * When a Battle receives a message, it splits the message into tokens
 * and parses what happens, updating its own state, and then telling
 * BattleScene to do any relevant animations. The tokens then get
 * passed directly into BattleLog. If the message is an in-battle
 * message, it'll be extracted by BattleTextParser, which adds it to
 * both the battle log itself, as well as the messagebar.
 *
 * @author Guangcong Luo <guangcongluo@gmail.com>
 * @license MIT
 */
// import $ from 'jquery';
/** [id, element?, ...misc] */
var Pokemon = /*#__PURE__*/function () {
  function Pokemon(data, side) {
    _classCallCheck(this, Pokemon);
    _defineProperty(this, "name", '');
    _defineProperty(this, "speciesForme", '');
    /**
     * A string representing information extractable from textual
     * messages: side, nickname.
     *
     * Will be the empty string between Team Preview and the first
     * switch-in.
     *
     * Examples: `p1: Unown` or `p2: Sparky`
     */
    _defineProperty(this, "ident", '');
    /**
     * A string representing visible information not included in
     * ident: species, level, gender, shininess. Level is left off
     * if it's 100; gender is left off if it's genderless.
     *
     * Note: Can be partially filled out in Team Preview, because certain
     * forme information and shininess isn't visible there. In those
     * cases, details can change during the first switch-in, but will
     * otherwise not change over the course of a game.
     *
     * Examples: `Mimikyu, L50, F`, `Steelix, M, shiny`
     */
    _defineProperty(this, "details", '');
    /**
     * `` `${ident}|${details}` ``. Tracked for ease of searching.
     *
     * As with ident, blank before the first switch-in, and will only
     * change during the first switch-in.
     */
    _defineProperty(this, "searchid", '');
    _defineProperty(this, "slot", 0);
    _defineProperty(this, "fainted", false);
    _defineProperty(this, "hp", 0);
    _defineProperty(this, "maxhp", 1000);
    _defineProperty(this, "level", 100);
    _defineProperty(this, "gender", 'N');
    _defineProperty(this, "shiny", false);
    _defineProperty(this, "hpcolor", 'g');
    _defineProperty(this, "moves", []);
    _defineProperty(this, "ability", '');
    _defineProperty(this, "baseAbility", '');
    _defineProperty(this, "item", '');
    _defineProperty(this, "itemEffect", '');
    _defineProperty(this, "prevItem", '');
    _defineProperty(this, "prevItemEffect", '');
    _defineProperty(this, "terastallized", '');
    _defineProperty(this, "teraType", '');
    _defineProperty(this, "moddedType", []);
    _defineProperty(this, "boosts", {});
    _defineProperty(this, "status", '');
    _defineProperty(this, "statusStage", 0);
    _defineProperty(this, "volatiles", {});
    _defineProperty(this, "turnstatuses", {});
    _defineProperty(this, "movestatuses", {});
    _defineProperty(this, "lastMove", '');
    /** [[moveName, ppUsed]] */
    _defineProperty(this, "moveTrack", []);
    _defineProperty(this, "statusData", {
      sleepTurns: 0,
      toxicTurns: 0
    });
    _defineProperty(this, "timesAttacked", 0);
    this.side = side;
    this.speciesForme = data.speciesForme;
    this.details = data.details;
    this.name = data.name;
    this.level = data.level;
    this.shiny = data.shiny;
    this.gender = data.gender || 'N';
    this.ident = data.ident;
    this.terastallized = data.terastallized || '';
    this.searchid = data.searchid;
    this.sprite = side.battle.scene.addPokemonSprite(this);
  }
  return _createClass(Pokemon, [{
    key: "isActive",
    value: function isActive() {
      return this.side.active.includes(this);
    }

    /** @deprecated */
  }, {
    key: "getHPColor",
    value: function getHPColor() {
      if (this.hpcolor) return this.hpcolor;
      var ratio = this.hp / this.maxhp;
      if (ratio > 0.5) return 'g';
      if (ratio > 0.2) return 'y';
      return 'r';
    }
    /** @deprecated */
  }, {
    key: "getHPColorClass",
    value: function getHPColorClass() {
      switch (this.getHPColor()) {
        case 'y':
          return 'hpbar hpbar-yellow';
        case 'r':
          return 'hpbar hpbar-red';
      }
      return 'hpbar';
    }
  }, {
    key: "getDamageRange",
    value:
    // Returns [min, max] damage dealt as a proportion of total HP from 0 to 1
    function getDamageRange(damage) {
      if (damage[1] !== 48) {
        var ratio = damage[0] / damage[1];
        return [ratio, ratio];
      } else if (damage.length === undefined) {
        // wrong pixel damage.
        // this case exists for backward compatibility only.
        return [damage[2] / 100, damage[2] / 100];
      }
      // pixel damage
      var oldrange = Pokemon.getPixelRange(damage[3], damage[4]);
      var newrange = Pokemon.getPixelRange(damage[3] + damage[0], this.hpcolor);
      if (damage[0] === 0) {
        // no change in displayed pixel width
        return [0, newrange[1] - newrange[0]];
      }
      if (oldrange[0] < newrange[0]) {
        // swap order
        var r = oldrange;
        oldrange = newrange;
        newrange = r;
      }
      return [oldrange[0] - newrange[1], oldrange[1] - newrange[0]];
    }
  }, {
    key: "healthParse",
    value: function healthParse(hpstring, parsedamage, heal) {
      var _hpstring;
      // returns [delta, denominator, percent(, oldnum, oldcolor)] or null
      if (!((_hpstring = hpstring) !== null && _hpstring !== void 0 && _hpstring.length)) return null;
      var parenIndex = hpstring.lastIndexOf('(');
      if (parenIndex >= 0) {
        // old style damage and health reporting
        if (parsedamage) {
          var damage = parseFloat(hpstring);
          // unusual check preseved for backward compatbility
          if (isNaN(damage)) damage = 50;
          if (heal) {
            this.hp += this.maxhp * damage / 100;
            if (this.hp > this.maxhp) this.hp = this.maxhp;
          } else {
            this.hp -= this.maxhp * damage / 100;
          }
          // parse the absolute health information
          var ret = this.healthParse(hpstring);
          if ((ret === null || ret === void 0 ? void 0 : ret[1]) === 100) {
            // support for old replays with nearest-100th damage and health
            return [damage, 100, damage];
          }
          // complicated expressions preserved for backward compatibility
          var percent = Math.round(Math.ceil(damage * 48 / 100) / 48 * 100);
          var pixels = Math.ceil(damage * 48 / 100);
          return [pixels, 48, percent];
        }
        if (hpstring.substr(hpstring.length - 1) !== ')') {
          return null;
        }
        hpstring = hpstring.substr(parenIndex + 1, hpstring.length - parenIndex - 2);
      }
      var oldhp = this.fainted ? 0 : this.hp || 1;
      var oldmaxhp = this.maxhp;
      var oldwidth = this.hpWidth(100);
      var oldcolor = this.hpcolor;
      this.side.battle.parseHealth(hpstring, this);
      if (oldmaxhp === 0) {
        // max hp not known before parsing this message
        oldmaxhp = oldhp = this.maxhp;
      }
      var oldnum = oldhp ? Math.floor(this.maxhp * oldhp / oldmaxhp) || 1 : 0;
      var delta = this.hp - oldnum;
      var deltawidth = this.hpWidth(100) - oldwidth;
      return [delta, this.maxhp, deltawidth, oldnum, oldcolor];
    }
  }, {
    key: "checkDetails",
    value: function checkDetails(details) {
      if (!details) return false;
      if (details === this.details) return true;
      if (this.searchid) return false;
      if (details.includes(', shiny')) {
        if (this.checkDetails(details.replace(', shiny', ''))) return true;
      }
      // the actual forme was hidden on Team Preview
      details = details.replace(/(-[A-Za-z0-9-]+)?(, |$)/, '-*$2');
      return details === this.details;
    }
  }, {
    key: "getIdent",
    value: function getIdent() {
      var slots = ['a', 'b', 'c', 'd', 'e', 'f'];
      return this.ident.substr(0, 2) + slots[this.slot] + this.ident.substr(2);
    }
  }, {
    key: "removeVolatile",
    value: function removeVolatile(volatile) {
      this.side.battle.scene.removeEffect(this, volatile);
      if (!this.hasVolatile(volatile)) return;
      delete this.volatiles[volatile];
    }
  }, {
    key: "addVolatile",
    value: function addVolatile(volatile) {
      for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        args[_key - 1] = arguments[_key];
      }
      if (this.hasVolatile(volatile) && !args.length) return;
      this.volatiles[volatile] = [volatile].concat(args);
      this.side.battle.scene.addEffect(this, volatile);
    }
  }, {
    key: "hasVolatile",
    value: function hasVolatile(volatile) {
      return !!this.volatiles[volatile];
    }
  }, {
    key: "removeTurnstatus",
    value: function removeTurnstatus(volatile) {
      this.side.battle.scene.removeEffect(this, volatile);
      if (!this.hasTurnstatus(volatile)) return;
      delete this.turnstatuses[volatile];
    }
  }, {
    key: "addTurnstatus",
    value: function addTurnstatus(volatile) {
      volatile = toID(volatile);
      this.side.battle.scene.addEffect(this, volatile);
      if (this.hasTurnstatus(volatile)) return;
      this.turnstatuses[volatile] = [volatile];
    }
  }, {
    key: "hasTurnstatus",
    value: function hasTurnstatus(volatile) {
      return !!this.turnstatuses[volatile];
    }
  }, {
    key: "clearTurnstatuses",
    value: function clearTurnstatuses() {
      for (var id in this.turnstatuses) {
        this.removeTurnstatus(id);
      }
      this.turnstatuses = {};
      this.side.battle.scene.updateStatbar(this);
    }
  }, {
    key: "removeMovestatus",
    value: function removeMovestatus(volatile) {
      this.side.battle.scene.removeEffect(this, volatile);
      if (!this.hasMovestatus(volatile)) return;
      delete this.movestatuses[volatile];
    }
  }, {
    key: "addMovestatus",
    value: function addMovestatus(volatile) {
      volatile = toID(volatile);
      if (this.hasMovestatus(volatile)) return;
      this.movestatuses[volatile] = [volatile];
      this.side.battle.scene.addEffect(this, volatile);
    }
  }, {
    key: "hasMovestatus",
    value: function hasMovestatus(volatile) {
      return !!this.movestatuses[volatile];
    }
  }, {
    key: "clearMovestatuses",
    value: function clearMovestatuses() {
      for (var id in this.movestatuses) {
        this.removeMovestatus(id);
      }
      this.movestatuses = {};
    }
  }, {
    key: "clearVolatiles",
    value: function clearVolatiles() {
      this.volatiles = {};
      this.clearTurnstatuses();
      this.clearMovestatuses();
      this.side.battle.scene.clearEffects(this);
    }
  }, {
    key: "mergePP",
    value: function mergePP(entry, pp) {
      var ppUsed = entry[1];
      if (typeof ppUsed === 'number') {
        if (typeof pp === 'number') {
          ppUsed += pp;
        } else {
          ppUsed = [ppUsed + pp[0], ppUsed + pp[1]];
        }
      } else {
        if (typeof pp === 'number') {
          ppUsed[0] += pp;
          ppUsed[1] += pp;
        } else {
          ppUsed[0] += pp[0];
          ppUsed[1] += pp[1];
        }
      }
      if (typeof ppUsed === 'number') {
        if (ppUsed < 0) ppUsed = 0;
      } else {
        if (ppUsed[0] < 0) ppUsed[0] = 0;
        if (ppUsed[1] < 0) ppUsed[1] = 0;
        var move = this.side.battle.dex.moves.get(entry[0]);
        var maxpp = move.pp === 1 || move.noPPBoosts ? move.pp : move.pp * 8 / 5;
        if (this.side.battle.tier.includes('Champions')) {
          maxpp = move.pp > 20 ? 20 : move.pp;
          maxpp = move.pp === 1 || move.noPPBoosts ? move.pp : (move.pp / 5 + 1) * 4;
        }
        if (ppUsed[0] > maxpp) ppUsed[0] = maxpp;
        if (ppUsed[0] < ppUsed[1]) ppUsed[0] = ppUsed[1];
        if (ppUsed[0] === ppUsed[1]) ppUsed = ppUsed[0];
      }
      return ppUsed;
    }
  }, {
    key: "rememberMove",
    value: function rememberMove(moveName) {
      var pp = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 1;
      var recursionSource = arguments.length > 2 ? arguments[2] : undefined;
      if (recursionSource === this.ident) return;
      moveName = Dex.moves.get(moveName).name;
      if (moveName.startsWith('*')) return;
      if (moveName === 'Struggle') return;
      if (this.volatiles.transform) {
        // make sure there is no infinite recursion if both Pokemon are transformed into each other
        if (!recursionSource) recursionSource = this.ident;
        this.volatiles.transform[1].rememberMove(moveName, 0, recursionSource);
        moveName = '*' + moveName;
      }
      var _iterator = _createForOfIteratorHelper(this.moveTrack),
        _step;
      try {
        for (_iterator.s(); !(_step = _iterator.n()).done;) {
          var entry = _step.value;
          if (moveName === entry[0]) {
            entry[1] = this.mergePP(entry, pp);
            return;
          }
        }
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }
      this.moveTrack.push([moveName, pp]);
    }
  }, {
    key: "rememberAbility",
    value: function rememberAbility(ability, isNotBase) {
      ability = Dex.abilities.get(ability).name;
      this.ability = ability;
      if (!this.baseAbility && !isNotBase) {
        this.baseAbility = ability;
      }
    }
  }, {
    key: "getBoost",
    value: function getBoost(boostStat) {
      var boostStatTable = {
        atk: 'Atk',
        def: 'Def',
        spa: 'SpA',
        spd: 'SpD',
        spe: 'Spe',
        accuracy: 'Accuracy',
        evasion: 'Evasion',
        spc: 'Spc'
      };
      if (!this.boosts[boostStat]) {
        return '1&times;&nbsp;' + boostStatTable[boostStat];
      }
      if (this.boosts[boostStat] > 6) this.boosts[boostStat] = 6;
      if (this.boosts[boostStat] < -6) this.boosts[boostStat] = -6;
      var isRBY = this.side.battle.gen <= 1 && !this.side.battle.tier.includes('Stadium');
      if (!isRBY && (boostStat === 'accuracy' || boostStat === 'evasion')) {
        if (this.boosts[boostStat] > 0) {
          var goodBoostTable = ['1&times;', '1.33&times;', '1.67&times;', '2&times;', '2.33&times;', '2.67&times;', '3&times;'];
          // let goodBoostTable = ['Normal', '+1', '+2', '+3', '+4', '+5', '+6'];
          return '' + goodBoostTable[this.boosts[boostStat]] + '&nbsp;' + boostStatTable[boostStat];
        }
        var _badBoostTable = ['1&times;', '0.75&times;', '0.6&times;', '0.5&times;', '0.43&times;', '0.38&times;', '0.33&times;'];
        // let badBoostTable = ['Normal', '&minus;1', '&minus;2', '&minus;3', '&minus;4', '&minus;5', '&minus;6'];
        return '' + _badBoostTable[-this.boosts[boostStat]] + '&nbsp;' + boostStatTable[boostStat];
      }
      if (this.boosts[boostStat] > 0) {
        var _goodBoostTable = ['1&times;', '1.5&times;', '2&times;', '2.5&times;', '3&times;', '3.5&times;', '4&times;'];
        // let goodBoostTable = ['Normal', '+1', '+2', '+3', '+4', '+5', '+6'];
        return '' + _goodBoostTable[this.boosts[boostStat]] + '&nbsp;' + boostStatTable[boostStat];
      }
      var badBoostTable = ['1&times;', '0.67&times;', '0.5&times;', '0.4&times;', '0.33&times;', '0.29&times;', '0.25&times;'];
      // let badBoostTable = ['Normal', '&minus;1', '&minus;2', '&minus;3', '&minus;4', '&minus;5', '&minus;6'];
      return '' + badBoostTable[-this.boosts[boostStat]] + '&nbsp;' + boostStatTable[boostStat];
    }
  }, {
    key: "getWeightKg",
    value: function getWeightKg(serverPokemon) {
      var _this$volatiles$autot;
      var autotomizeFactor = ((_this$volatiles$autot = this.volatiles.autotomize) === null || _this$volatiles$autot === void 0 ? void 0 : _this$volatiles$autot[1]) * 100 || 0;
      return Math.max(this.getSpecies(serverPokemon).weightkg - autotomizeFactor, 0.1);
    }
  }, {
    key: "getBoostType",
    value: function getBoostType(boostStat) {
      if (!this.boosts[boostStat]) return 'neutral';
      if (this.boosts[boostStat] > 0) return 'good';
      return 'bad';
    }
  }, {
    key: "clearVolatile",
    value: function clearVolatile() {
      this.ability = this.baseAbility;
      this.boosts = {};
      this.clearVolatiles();
      for (var i = 0; i < this.moveTrack.length; i++) {
        if (this.moveTrack[i][0].startsWith('*')) {
          this.moveTrack.splice(i, 1);
          i--;
        }
      }
      // this.lastMove = '';
      this.statusStage = 0;
      this.statusData.toxicTurns = 0;
      if (this.side.battle.gen === 5) this.statusData.sleepTurns = 0;
    }
  }, {
    key: "copyVolatileFrom",
    value: function copyVolatileFrom(pokemon, copySource) {
      this.boosts = pokemon.boosts;
      this.volatiles = pokemon.volatiles;
      // this.lastMove = pokemon.lastMove; // I think
      if (copySource === 'batonpass') {
        var volatilesToRemove = ['airballoon', 'attract', 'autotomize', 'disable', 'encore', 'foresight', 'gmaxchistrike', 'imprison', 'laserfocus', 'mimic', 'miracleeye', 'nightmare', 'saltcure', 'smackdown', 'stockpile1', 'stockpile2', 'stockpile3', 'syrupbomb', 'torment', 'typeadd', 'typechange', 'yawn'];
        var _iterator2 = _createForOfIteratorHelper(Dex.statNamesExceptHP),
          _step2;
        try {
          for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
            var statName = _step2.value;
            volatilesToRemove.push('protosynthesis' + statName);
            volatilesToRemove.push('quarkdrive' + statName);
          }
        } catch (err) {
          _iterator2.e(err);
        } finally {
          _iterator2.f();
        }
        for (var _i = 0, _volatilesToRemove = volatilesToRemove; _i < _volatilesToRemove.length; _i++) {
          var volatile = _volatilesToRemove[_i];
          delete this.volatiles[volatile];
        }
      }
      // Shed Tail doesn't need special handling because the source already has
      // its volatiles except Substitute cleared in switchOut.
      delete this.volatiles['transform'];
      delete this.volatiles['formechange'];
      pokemon.boosts = {};
      pokemon.volatiles = {};
      pokemon.side.battle.scene.removeTransform(pokemon);
      pokemon.statusStage = 0;
    }
  }, {
    key: "copyTypesFrom",
    value: function copyTypesFrom(pokemon) {
      var preterastallized = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
      var _pokemon$getTypes = pokemon.getTypes(undefined, preterastallized),
        _pokemon$getTypes2 = _slicedToArray(_pokemon$getTypes, 2),
        types = _pokemon$getTypes2[0],
        addedType = _pokemon$getTypes2[1];
      this.addVolatile('typechange', types.join('/'));
      if (addedType) {
        this.addVolatile('typeadd', addedType);
      } else {
        this.removeVolatile('typeadd');
      }
    }
  }, {
    key: "getTypes",
    value: function getTypes(serverPokemon) {
      var preterastallized = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
      var types;
      if (!preterastallized && this.terastallized && this.terastallized !== 'Stellar') {
        types = [this.terastallized];
      } else if (this.volatiles.typechange) {
        types = this.volatiles.typechange[1].split('/');
      } else if (this.moddedType.length) {
        types = this.moddedType;
      } else {
        types = this.getSpecies(serverPokemon).types;
      }
      if (this.hasTurnstatus('roost') && types.includes('Flying')) {
        types = types.filter(function (typeName) {
          return typeName !== 'Flying';
        });
        if (!types.length) types = ['Normal'];
      }
      var addedType = this.volatiles.typeadd ? this.volatiles.typeadd[1] : '';
      return [types, addedType];
    }
  }, {
    key: "isGrounded",
    value: function isGrounded(serverPokemon) {
      var battle = this.side.battle;
      if (battle.hasPseudoWeather('Gravity')) {
        return true;
      } else if (this.volatiles['ingrain'] && battle.gen >= 4) {
        return true;
      } else if (this.volatiles['smackdown']) {
        return true;
      }
      var item = toID(serverPokemon ? serverPokemon.item : this.item);
      var ability = toID(this.effectiveAbility(serverPokemon));
      if (battle.hasPseudoWeather('Magic Room') || this.volatiles['embargo'] || ability === 'klutz') {
        item = '';
      }
      if (item === 'ironball') {
        return true;
      }
      if (ability === 'levitate' || ability === 'eelevate') {
        return false;
      }
      if (this.volatiles['magnetrise'] || this.volatiles['telekinesis']) {
        return false;
      }
      if (item === 'airballoon') {
        return false;
      }
      return !this.getTypeList(serverPokemon).includes('Flying');
    }
  }, {
    key: "effectiveAbility",
    value: function effectiveAbility(serverPokemon) {
      var ability = this.side.battle.dex.abilities.get((serverPokemon === null || serverPokemon === void 0 ? void 0 : serverPokemon.ability) || this.ability || (serverPokemon === null || serverPokemon === void 0 ? void 0 : serverPokemon.baseAbility) || '');
      if (this.fainted || this.volatiles['transform'] && ability.flags['notransform'] || !ability.flags['cantsuppress'] && (this.side.battle.ngasActive() || this.volatiles['gastroacid'])) {
        return '';
      }
      return ability.name;
    }
  }, {
    key: "getTypeList",
    value: function getTypeList(serverPokemon) {
      var preterastallized = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
      var _this$getTypes = this.getTypes(serverPokemon, preterastallized),
        _this$getTypes2 = _slicedToArray(_this$getTypes, 2),
        types = _this$getTypes2[0],
        addedType = _this$getTypes2[1];
      return addedType ? types.concat(addedType) : types;
    }
  }, {
    key: "getSpeciesForme",
    value: function getSpeciesForme(serverPokemon) {
      return this.volatiles.formechange ? this.volatiles.formechange[1] : serverPokemon ? serverPokemon.speciesForme : this.speciesForme;
    }
  }, {
    key: "getSpecies",
    value: function getSpecies(serverPokemon) {
      return this.side.battle.dex.species.get(this.getSpeciesForme(serverPokemon));
    }
  }, {
    key: "getBaseSpecies",
    value: function getBaseSpecies() {
      return this.side.battle.dex.species.get(this.speciesForme);
    }
  }, {
    key: "reset",
    value: function reset() {
      this.clearVolatile();
      this.hp = this.maxhp;
      this.fainted = false;
      this.status = '';
      this.moveTrack = [];
      this.name = this.name || this.speciesForme;
    }
    // This function is used for two things:
    //   1) The percentage to display beside the HP bar.
    //   2) The width to draw an HP bar.
    //
    // This function is NOT used in the calculation of any other displayed
    // percentages or ranges, which have their own, more complex, formulae.
  }, {
    key: "hpWidth",
    value: function hpWidth(maxWidth) {
      if (this.fainted || !this.hp) return 0;

      // special case for low health...
      if (this.hp === 1 && this.maxhp > 45) return 1;
      if (this.maxhp === 48) {
        // Draw the health bar to the middle of the range.
        // This affects the width of the visual health bar *only*; it
        // does not affect the ranges displayed in any way.
        var range = Pokemon.getPixelRange(this.hp, this.hpcolor);
        var ratio = (range[0] + range[1]) / 2;
        return Math.round(maxWidth * ratio) || 1;
      }
      var width = Math.round(this.hp / this.maxhp * maxWidth) || 1;
      return this.hp < this.maxhp && width === maxWidth ? maxWidth - 1 : width;
    }
  }, {
    key: "getHPText",
    value: function getHPText() {
      var precision = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 1;
      return Pokemon.getHPText(this, this.side.battle.reportExactHP, precision);
    }
  }, {
    key: "destroy",
    value: function destroy() {
      var _this$sprite;
      (_this$sprite = this.sprite) === null || _this$sprite === void 0 || _this$sprite.destroy();
      this.sprite = null;
      this.side = null;
    }
  }], [{
    key: "getPixelRange",
    value: function getPixelRange(pixels, color) {
      var epsilon = 0.5 / 714;
      if (pixels === 0) return [0, 0];
      if (pixels === 1) return [0 + epsilon, 2 / 48 - epsilon];
      if (color) {
        if (pixels === 9) {
          if (color === 'y') {
            // ratio is > 0.2
            return [0.2 + epsilon, 10 / 48 - epsilon];
          } else if (color === 'r') {
            // ratio is <= 0.2
            return [9 / 48, 0.2];
          }
        }
        if (pixels === 24) {
          if (color === 'g') {
            // ratio is > 0.5
            return [0.5 + epsilon, 25 / 48 - epsilon];
          } else if (color === 'y') {
            // ratio is exactly 0.5
            return [0.5, 0.5];
          }
        }
      }
      if (pixels === 48) return [1, 1];
      return [pixels / 48, (pixels + 1) / 48 - epsilon];
    }
  }, {
    key: "getFormattedRange",
    value: function getFormattedRange(range, precision, separator) {
      if (range[0] === range[1]) {
        var percentage = Math.abs(range[0] * 100);
        if (Math.floor(percentage) === percentage) {
          return "".concat(percentage, "%");
        }
        return percentage.toFixed(precision) + '%';
      }
      var lower;
      var upper;
      if (precision === 0) {
        lower = Math.floor(range[0] * 100);
        upper = Math.ceil(range[1] * 100);
      } else {
        lower = (range[0] * 100).toFixed(precision);
        upper = (range[1] * 100).toFixed(precision);
      }
      return "".concat(lower).concat(separator).concat(upper, "%");
    }
  }, {
    key: "getHPText",
    value: function getHPText(pokemon, exactHP) {
      var precision = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 1;
      if (exactHP) return "".concat(pokemon.hp, "/").concat(pokemon.maxhp);
      if (pokemon.maxhp === 100) return "".concat(pokemon.hp, "%");
      if (pokemon.maxhp !== 48) return (100 * pokemon.hp / pokemon.maxhp).toFixed(precision) + '%';
      var range = Pokemon.getPixelRange(pokemon.hp, pokemon.hpcolor);
      return Pokemon.getFormattedRange(range, precision, "\u2013");
    }
  }]);
}();
var Side = /*#__PURE__*/function () {
  function Side(battle, n) {
    _classCallCheck(this, Side);
    _defineProperty(this, "name", '');
    _defineProperty(this, "id", '');
    _defineProperty(this, "foe", null);
    _defineProperty(this, "ally", null);
    _defineProperty(this, "avatar", 'unknown');
    _defineProperty(this, "badges", []);
    _defineProperty(this, "rating", '');
    _defineProperty(this, "totalPokemon", 6);
    _defineProperty(this, "x", 0);
    _defineProperty(this, "y", 0);
    _defineProperty(this, "z", 0);
    _defineProperty(this, "missedPokemon", null);
    _defineProperty(this, "wisher", null);
    _defineProperty(this, "active", [null]);
    _defineProperty(this, "lastPokemon", null);
    _defineProperty(this, "pokemon", []);
    _defineProperty(this, "openTeamSheet", false);
    _defineProperty(this, "sideConditions", {});
    _defineProperty(this, "faintCounter", 0);
    this.battle = battle;
    this.n = n;
    this.sideid = ['p1', 'p2', 'p3', 'p4'][n];
    this.isFar = !!(n % 2);
  }
  return _createClass(Side, [{
    key: "rollTrainerSprites",
    value: function rollTrainerSprites() {
      var sprites = ['lucas', 'dawn', 'ethan', 'lyra', 'hilbert', 'hilda'];
      this.avatar = sprites[Math.floor(Math.random() * sprites.length)];
    }
  }, {
    key: "behindx",
    value: function behindx(offset) {
      return this.x + (!this.isFar ? -1 : 1) * offset;
    }
  }, {
    key: "behindy",
    value: function behindy(offset) {
      return this.y + (!this.isFar ? 1 : -1) * offset;
    }
  }, {
    key: "leftof",
    value: function leftof(offset) {
      return (!this.isFar ? -1 : 1) * offset;
    }
  }, {
    key: "behind",
    value: function behind(offset) {
      return this.z + (!this.isFar ? -1 : 1) * offset;
    }
  }, {
    key: "clearPokemon",
    value: function clearPokemon() {
      var _iterator3 = _createForOfIteratorHelper(this.pokemon),
        _step3;
      try {
        for (_iterator3.s(); !(_step3 = _iterator3.n()).done;) {
          var pokemon = _step3.value;
          pokemon.destroy();
        }
      } catch (err) {
        _iterator3.e(err);
      } finally {
        _iterator3.f();
      }
      this.pokemon = [];
      for (var i = 0; i < this.active.length; i++) this.active[i] = null;
      this.lastPokemon = null;
    }
  }, {
    key: "reset",
    value: function reset() {
      this.clearPokemon();
      this.sideConditions = {};
      this.faintCounter = 0;
    }
  }, {
    key: "setAvatar",
    value: function setAvatar(avatar) {
      this.avatar = avatar;
    }
  }, {
    key: "setName",
    value: function setName(name, avatar) {
      if (name) this.name = name;
      this.id = toID(this.name);
      if (avatar) {
        this.setAvatar(avatar);
      } else {
        var _this$foe;
        this.rollTrainerSprites();
        if (this.avatar === ((_this$foe = this.foe) === null || _this$foe === void 0 ? void 0 : _this$foe.avatar)) this.rollTrainerSprites();
      }
    }
  }, {
    key: "addSideCondition",
    value: function addSideCondition(effect, persist) {
      var condition = effect.id;
      if (this.sideConditions[condition]) {
        if (condition === 'spikes' || condition === 'toxicspikes') {
          this.sideConditions[condition][1]++;
        }
        this.battle.scene.addSideCondition(this.n, condition);
        return;
      }
      // Side conditions work as: [effectName, levels, minDuration, maxDuration]
      switch (condition) {
        case 'auroraveil':
          this.sideConditions[condition] = [effect.name, 1, 5, 8];
          break;
        case 'reflect':
          this.sideConditions[condition] = [effect.name, 1, 5, this.battle.gen >= 4 ? 8 : 0];
          break;
        case 'safeguard':
          this.sideConditions[condition] = [effect.name, 1, persist ? 7 : 5, 0];
          break;
        case 'lightscreen':
          this.sideConditions[condition] = [effect.name, 1, 5, this.battle.gen >= 4 ? 8 : 0];
          break;
        case 'mist':
          this.sideConditions[condition] = [effect.name, 1, 5, 0];
          break;
        case 'tailwind':
          this.sideConditions[condition] = [effect.name, 1, this.battle.gen >= 5 ? persist ? 6 : 4 : persist ? 5 : 3, 0];
          break;
        case 'luckychant':
          this.sideConditions[condition] = [effect.name, 1, 5, 0];
          break;
        case 'futuresight':
          this.sideConditions[condition] = ['Future Sight', 1, 3, 0];
          break;
        case 'doomdesire':
          this.sideConditions[condition] = ['Doom Desire', 1, 3, 0];
          break;
        case 'stealthrock':
        case 'spikes':
        case 'toxicspikes':
        case 'stickyweb':
          this.sideConditions[condition] = [effect.name, 1, 0, 0];
          break;
        case 'gmaxwildfire':
        case 'gmaxvolcalith':
        case 'gmaxvinelash':
        case 'gmaxcannonade':
          this.sideConditions[condition] = [effect.name, 1, 4, 0];
          break;
        case 'grasspledge':
          this.sideConditions[condition] = ['Swamp', 1, 4, 0];
          break;
        case 'waterpledge':
          this.sideConditions[condition] = ['Rainbow', 1, 4, 0];
          break;
        case 'firepledge':
          this.sideConditions[condition] = ['Sea of Fire', 1, 4, 0];
          break;
        default:
          this.sideConditions[condition] = [effect.name, 1, 0, 0];
          break;
      }
      this.battle.scene.addSideCondition(this.n, condition);
    }
  }, {
    key: "removeSideCondition",
    value: function removeSideCondition(condition) {
      var id = toID(condition);
      if (!this.sideConditions[id]) return;
      delete this.sideConditions[id];
      this.battle.scene.removeSideCondition(this.n, id);
    }
  }, {
    key: "addPokemon",
    value: function addPokemon(name, ident, details) {
      var replaceSlot = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : -1;
      var oldPokemon = replaceSlot >= 0 ? this.pokemon[replaceSlot] : undefined;
      var data = this.battle.parseDetails(name, ident, details);
      var poke = new Pokemon(data, this);
      if (oldPokemon) {
        poke.item = oldPokemon.item;
        poke.baseAbility = oldPokemon.baseAbility;
        poke.teraType = oldPokemon.teraType;
      }
      if (!poke.ability && poke.baseAbility) poke.ability = poke.baseAbility;
      poke.reset();
      if (oldPokemon !== null && oldPokemon !== void 0 && oldPokemon.moveTrack.length) poke.moveTrack = oldPokemon.moveTrack;
      if (replaceSlot >= 0) {
        this.pokemon[replaceSlot] = poke;
      } else {
        this.pokemon.push(poke);
      }
      if (this.pokemon.length > this.totalPokemon || this.battle.speciesClause) {
        // check for Illusion
        var existingTable = {};
        var toRemove = -1;
        for (var poke1i = 0; poke1i < this.pokemon.length; poke1i++) {
          var poke1 = this.pokemon[poke1i];
          if (!poke1.searchid) continue;
          if (poke1.searchid in existingTable) {
            var poke2i = existingTable[poke1.searchid];
            var poke2 = this.pokemon[poke2i];
            if (poke === poke1) {
              toRemove = poke2i;
            } else if (poke === poke2) {
              toRemove = poke1i;
            } else if (this.active.includes(poke1)) {
              toRemove = poke2i;
            } else if (this.active.includes(poke2)) {
              toRemove = poke1i;
            } else if (poke1.fainted && !poke2.fainted) {
              toRemove = poke2i;
            } else {
              toRemove = poke1i;
            }
            break;
          }
          existingTable[poke1.searchid] = poke1i;
        }
        if (toRemove >= 0) {
          if (this.pokemon[toRemove].fainted) {
            // A fainted Pokemon was actually a Zoroark
            var illusionFound = null;
            var _iterator4 = _createForOfIteratorHelper(this.pokemon),
              _step4;
            try {
              for (_iterator4.s(); !(_step4 = _iterator4.n()).done;) {
                var _curPoke = _step4.value;
                if (_curPoke === poke) continue;
                if (_curPoke.fainted) continue;
                if (this.active.includes(_curPoke)) continue;
                if (_curPoke.speciesForme === 'Zoroark' || _curPoke.speciesForme === 'Zorua' || _curPoke.ability === 'Illusion') {
                  illusionFound = _curPoke;
                  break;
                }
              }
            } catch (err) {
              _iterator4.e(err);
            } finally {
              _iterator4.f();
            }
            if (!illusionFound) {
              // This is Hackmons; we'll just guess a random unfainted Pokemon.
              // This will keep the fainted Pokemon count correct, and will
              // eventually become correct as incorrect guesses are switched in
              // and reguessed.
              var _iterator5 = _createForOfIteratorHelper(this.pokemon),
                _step5;
              try {
                for (_iterator5.s(); !(_step5 = _iterator5.n()).done;) {
                  var curPoke = _step5.value;
                  if (curPoke === poke) continue;
                  if (curPoke.fainted) continue;
                  if (this.active.includes(curPoke)) continue;
                  illusionFound = curPoke;
                  break;
                }
              } catch (err) {
                _iterator5.e(err);
              } finally {
                _iterator5.f();
              }
            }
            if (illusionFound) {
              illusionFound.fainted = true;
              illusionFound.hp = 0;
              illusionFound.status = '';
            }
          }
          this.pokemon.splice(toRemove, 1);
        }
      }
      this.battle.scene.updateSidebar(this);
      return poke;
    }
  }, {
    key: "switchIn",
    value: function switchIn(pokemon, kwArgs) {
      var slot = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : pokemon.slot;
      this.active[slot] = pokemon;
      pokemon.slot = slot;
      pokemon.clearVolatile();
      pokemon.lastMove = '';
      this.battle.lastMove = 'switch-in';
      var effect = Dex.getEffect(kwArgs.from);
      if (['batonpass', 'zbatonpass', 'shedtail'].includes(effect.id)) {
        pokemon.copyVolatileFrom(this.lastPokemon, effect.id === 'shedtail' ? 'shedtail' : 'batonpass');
      } else if (this.battle.tier.includes("Relay Race") && !effect.id) {
        if (this.lastPokemon && !this.lastPokemon.fainted) pokemon.copyVolatileFrom(this.lastPokemon, 'batonpass');
      }
      this.battle.scene.animSummon(pokemon, slot);
    }
  }, {
    key: "dragIn",
    value: function dragIn(pokemon) {
      var slot = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : pokemon.slot;
      var oldpokemon = this.active[slot];
      if (oldpokemon === pokemon) return;
      this.lastPokemon = oldpokemon;
      if (oldpokemon) {
        this.battle.scene.animDragOut(oldpokemon);
        oldpokemon.clearVolatile();
      }
      pokemon.clearVolatile();
      pokemon.lastMove = '';
      this.battle.lastMove = 'switch-in';
      this.active[slot] = pokemon;
      pokemon.slot = slot;
      this.battle.scene.animDragIn(pokemon, slot);
    }
  }, {
    key: "replace",
    value: function replace(pokemon) {
      var slot = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : pokemon.slot;
      var oldpokemon = this.active[slot];
      if (pokemon === oldpokemon) return;
      this.lastPokemon = oldpokemon;
      pokemon.clearVolatile();
      if (oldpokemon) {
        pokemon.lastMove = oldpokemon.lastMove;
        pokemon.hp = oldpokemon.hp;
        pokemon.maxhp = oldpokemon.maxhp;
        pokemon.hpcolor = oldpokemon.hpcolor;
        pokemon.status = oldpokemon.status;
        pokemon.copyVolatileFrom(oldpokemon, 'illusion');
        pokemon.statusData = _objectSpread({}, oldpokemon.statusData);
        if (oldpokemon.terastallized) {
          pokemon.terastallized = oldpokemon.terastallized;
          pokemon.teraType = oldpokemon.terastallized;
          oldpokemon.terastallized = '';
          oldpokemon.teraType = '';
        }
        // we don't know anything about the illusioned pokemon except that it's not fainted
        // technically we also know its status but only at the end of the turn, not here
        oldpokemon.fainted = false;
        oldpokemon.hp = oldpokemon.maxhp;
        oldpokemon.status = '???';
      }
      this.active[slot] = pokemon;
      pokemon.slot = slot;
      if (oldpokemon) {
        this.battle.scene.animUnsummon(oldpokemon, true);
      }
      this.battle.scene.animSummon(pokemon, slot, true);
    }
  }, {
    key: "switchOut",
    value: function switchOut(pokemon, kwArgs) {
      var slot = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : pokemon.slot;
      var effect = Dex.getEffect(kwArgs.from);
      if (!['batonpass', 'zbatonpass'].includes(effect.id) && !(this.battle.tier.includes("Relay Race") && !effect.id)) {
        pokemon.clearVolatile();
        if (effect.id === 'shedtail') {
          var _pokemon$sprite;
          pokemon.volatiles = {
            substitute: ['substitute']
          };
          (_pokemon$sprite = pokemon.sprite) === null || _pokemon$sprite === void 0 || _pokemon$sprite.animSub(true);
        }
      } else {
        pokemon.removeVolatile('transform');
        pokemon.removeVolatile('formechange');
      }
      if (!['batonpass', 'zbatonpass', 'shedtail', 'teleport'].includes(effect.id) && !(this.battle.tier.includes("Relay Race") && !effect.id)) {
        this.battle.log(['switchout', pokemon.ident], {
          from: effect.id
        });
      }
      pokemon.statusData.toxicTurns = 0;
      if (this.battle.gen === 5) pokemon.statusData.sleepTurns = 0;
      if (this.battle.tier.includes('Champions')) {
        pokemon.timesAttacked = 0;
      }
      this.lastPokemon = pokemon;
      this.active[slot] = null;
      this.battle.scene.animUnsummon(pokemon);
    }
  }, {
    key: "swapTo",
    value: function swapTo(pokemon, slot) {
      if (pokemon.slot === slot) return;
      var target = this.active[slot];
      var oslot = pokemon.slot;
      pokemon.slot = slot;
      if (target) target.slot = oslot;
      this.active[slot] = pokemon;
      this.active[oslot] = target;
      this.battle.scene.animUnsummon(pokemon, true);
      if (target) this.battle.scene.animUnsummon(target, true);
      this.battle.scene.animSummon(pokemon, slot, true);
      if (target) this.battle.scene.animSummon(target, oslot, true);
    }
  }, {
    key: "swapWith",
    value: function swapWith(pokemon, target, kwArgs) {
      // method provided for backwards compatibility only
      if (pokemon === target) return;
      var oslot = pokemon.slot;
      var nslot = target.slot;
      pokemon.slot = nslot;
      target.slot = oslot;
      this.active[nslot] = pokemon;
      this.active[oslot] = target;
      this.battle.scene.animUnsummon(pokemon, true);
      this.battle.scene.animUnsummon(target, true);
      this.battle.scene.animSummon(pokemon, nslot, true);
      this.battle.scene.animSummon(target, oslot, true);
    }
  }, {
    key: "faint",
    value: function faint(pokemon) {
      var slot = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : pokemon.slot;
      pokemon.clearVolatile();
      this.lastPokemon = pokemon;
      this.active[slot] = null;
      pokemon.fainted = true;
      pokemon.hp = 0;
      pokemon.terastallized = '';
      pokemon.details = pokemon.details.replace(/, tera:[a-z]+/i, '');
      pokemon.searchid = pokemon.searchid.replace(/, tera:[a-z]+/i, '');
      if (pokemon.side.faintCounter < 100) pokemon.side.faintCounter++;
      this.battle.scene.animFaint(pokemon);
    }
  }, {
    key: "destroy",
    value: function destroy() {
      this.clearPokemon();
      this.battle = null;
      this.foe = null;
    }
  }]);
}();
var Battle = /*#__PURE__*/function () {
  /**
   * The actual pause state. Will only be true if playback is actually
   * paused, not just waiting for the opponent to make a move.
   */

  function Battle() {
    var _this = this;
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    _classCallCheck(this, Battle);
    _defineProperty(this, "viewpointSwitched", false);
    /** See battle.instantAdd */
    _defineProperty(this, "preemptStepQueue", []);
    _defineProperty(this, "waitForAnimations", true);
    /** the index of `stepQueue` currently being animated */
    _defineProperty(this, "currentStep", 0);
    /** null = not seeking, 0 = seek start, Infinity = seek end, otherwise: seek turn number */
    _defineProperty(this, "seeking", null);
    _defineProperty(this, "activeMoveIsSpread", null);
    _defineProperty(this, "mute", false);
    _defineProperty(this, "messageFadeTime", 300);
    _defineProperty(this, "messageShownTime", 1);
    /** for tracking when to accelerate animations in long battles full of double switches */
    _defineProperty(this, "turnsSinceMoved", 0);
    /**
     * * `-1` = non-battle RoomGames, or hasn't hit Team Preview or `|start`
     * * `0` = after Team Preview or `|start` but before `|turn|1`
     */
    _defineProperty(this, "turn", -1);
    /**
     * Are we at the end of the queue and waiting for more input?
     *
     * In addition to at the end of a battle, this is also true if you're
     * playing/watching a battle live, and waiting for a player to make a move.
     */
    _defineProperty(this, "atQueueEnd", false);
    /**
     * Has the battle ever been played or fast-forwarded?
     *
     * This is not exactly `turn > 0` because if you start playing a replay,
     * then pause before turn 1, `turn` will still be 0, but playback should
     * be considered started (for the purposes of displaying "Play" vs "Resume")
     */
    _defineProperty(this, "started", false);
    /**
     * Has playback gotten to the point where a player has won or tied?
     * (Affects whether BGM is playing)
     */
    _defineProperty(this, "ended", false);
    _defineProperty(this, "isReplay", false);
    _defineProperty(this, "usesUpkeep", false);
    _defineProperty(this, "weather", '');
    _defineProperty(this, "pseudoWeather", []);
    _defineProperty(this, "weatherTimeLeft", 0);
    _defineProperty(this, "weatherMinTimeLeft", 0);
    /**
     * The side from which perspective we're viewing. Should be identical to
     * `nearSide` except in multi battles, where `nearSide` is always the first
     * near side, and `mySide` is the active player.
     */
    _defineProperty(this, "mySide", null);
    _defineProperty(this, "nearSide", null);
    _defineProperty(this, "farSide", null);
    _defineProperty(this, "p1", null);
    _defineProperty(this, "p2", null);
    _defineProperty(this, "p3", null);
    _defineProperty(this, "p4", null);
    _defineProperty(this, "pokemonControlled", 0);
    _defineProperty(this, "sides", null);
    _defineProperty(this, "myPokemon", null);
    _defineProperty(this, "myAllyPokemon", null);
    _defineProperty(this, "lastMove", '');
    _defineProperty(this, "gen", 8);
    _defineProperty(this, "dex", Dex);
    _defineProperty(this, "teamPreviewCount", 0);
    _defineProperty(this, "speciesClause", false);
    _defineProperty(this, "tier", '');
    _defineProperty(this, "gameType", 'singles');
    _defineProperty(this, "compatMode", true);
    _defineProperty(this, "rated", false);
    _defineProperty(this, "rules", {});
    _defineProperty(this, "isBlitz", false);
    _defineProperty(this, "reportExactHP", false);
    _defineProperty(this, "endLastTurnPending", false);
    _defineProperty(this, "totalTimeLeft", 0);
    _defineProperty(this, "graceTimeLeft", 0);
    /**
     * true: timer on, state unknown
     * false: timer off
     * number: seconds left this turn
     */
    _defineProperty(this, "kickingInactive", false);
    // options
    _defineProperty(this, "id", '');
    /** used to forward some information to the room in the old client */
    _defineProperty(this, "roomid", '');
    _defineProperty(this, "hardcoreMode", false);
    _defineProperty(this, "ignoreNicks", !!Dex.prefs('ignorenicks'));
    _defineProperty(this, "ignoreOpponent", !!Dex.prefs('ignoreopp'));
    _defineProperty(this, "ignoreSpects", !!Dex.prefs('ignorespects'));
    _defineProperty(this, "joinButtons", false);
    _defineProperty(this, "onResize", function () {
      var width = $(window).width();
      if (width < 950 || _this.hardcoreMode) {
        _this.messageShownTime = 500;
      } else {
        _this.messageShownTime = 1;
      }
      if (width && width < 640) {
        var _this$scene$$frame, _this$scene$$frame2, _this$scene$$frame3;
        var scale = width / 640;
        (_this$scene$$frame = _this.scene.$frame) === null || _this$scene$$frame === void 0 || _this$scene$$frame.css('transform', "scale(".concat(scale, ")"));
        (_this$scene$$frame2 = _this.scene.$frame) === null || _this$scene$$frame2 === void 0 || _this$scene$$frame2.css('transform-origin', 'top left');
        (_this$scene$$frame3 = _this.scene.$frame) === null || _this$scene$$frame3 === void 0 || _this$scene$$frame3.css('margin-bottom', "".concat(360 * scale - 360, "px"));
        // this.$foeHint.css('transform', 'scale(' + scale + ')');
      } else {
        var _this$scene$$frame4, _this$scene$$frame5;
        (_this$scene$$frame4 = _this.scene.$frame) === null || _this$scene$$frame4 === void 0 || _this$scene$$frame4.css('transform', 'none');
        // this.$foeHint.css('transform', 'none');
        (_this$scene$$frame5 = _this.scene.$frame) === null || _this$scene$$frame5 === void 0 || _this$scene$$frame5.css('margin-bottom', '0');
      }
    });
    this.id = options.id || '';
    if (options.$frame && options.$logFrame) {
      this.scene = new BattleScene(this, options.$frame, options.$logFrame);
    } else if (!options.$frame && !options.$logFrame) {
      this.scene = new BattleSceneStub();
    } else {
      throw new Error("You must specify $frame and $logFrame simultaneously");
    }
    this.paused = !!options.paused;
    this.started = !this.paused;
    this.debug = !!options.debug;
    if (typeof options.log === 'string') options.log = options.log.split('\n');
    this.stepQueue = options.log || [];
    this.subscription = options.subscription || null;
    this.autoresize = !!options.autoresize;
    this.p1 = new Side(this, 0);
    this.p2 = new Side(this, 1);
    this.sides = [this.p1, this.p2];
    this.p2.foe = this.p1;
    this.p1.foe = this.p2;
    this.nearSide = this.mySide = this.p1;
    this.farSide = this.p2;
    this.resetStep();
    if (this.autoresize) {
      window.addEventListener('resize', this.onResize);
      this.onResize();
    }
  }
  return _createClass(Battle, [{
    key: "subscribe",
    value: function subscribe(listener) {
      this.subscription = listener;
    }
  }, {
    key: "removePseudoWeather",
    value: function removePseudoWeather(weather) {
      for (var i = 0; i < this.pseudoWeather.length; i++) {
        if (this.pseudoWeather[i][0] === weather) {
          this.pseudoWeather.splice(i, 1);
          this.scene.updateWeather();
          return;
        }
      }
    }
  }, {
    key: "addPseudoWeather",
    value: function addPseudoWeather(weather, minTimeLeft, timeLeft) {
      this.pseudoWeather.push([weather, minTimeLeft, timeLeft]);
      this.scene.updateWeather();
    }
  }, {
    key: "hasPseudoWeather",
    value: function hasPseudoWeather(weather) {
      var _iterator6 = _createForOfIteratorHelper(this.pseudoWeather),
        _step6;
      try {
        for (_iterator6.s(); !(_step6 = _iterator6.n()).done;) {
          var _step6$value = _slicedToArray(_step6.value, 1),
            pseudoWeatherName = _step6$value[0];
          if (weather === pseudoWeatherName) {
            return true;
          }
        }
      } catch (err) {
        _iterator6.e(err);
      } finally {
        _iterator6.f();
      }
      return false;
    }
  }, {
    key: "getAllActive",
    value: function getAllActive() {
      var pokemonList = [];
      // Sides 3 and 4 are synced with sides 1 and 2, so they don't need to be checked
      for (var i = 0; i < 2; i++) {
        var side = this.sides[i];
        var _iterator7 = _createForOfIteratorHelper(side.active),
          _step7;
        try {
          for (_iterator7.s(); !(_step7 = _iterator7.n()).done;) {
            var active = _step7.value;
            if (active && !active.fainted) {
              pokemonList.push(active);
            }
          }
        } catch (err) {
          _iterator7.e(err);
        } finally {
          _iterator7.f();
        }
      }
      return pokemonList;
    }
    // Used in Pokemon#effectiveAbility over abilityActive to prevent infinite recursion
  }, {
    key: "ngasActive",
    value: function ngasActive() {
      var _iterator8 = _createForOfIteratorHelper(this.getAllActive()),
        _step8;
      try {
        for (_iterator8.s(); !(_step8 = _iterator8.n()).done;) {
          var active = _step8.value;
          if (active.ability === 'Neutralizing Gas' && !active.volatiles['gastroacid']) {
            return true;
          }
        }
      } catch (err) {
        _iterator8.e(err);
      } finally {
        _iterator8.f();
      }
      return false;
    }
  }, {
    key: "abilityActive",
    value: function abilityActive(abilities) {
      if (typeof abilities === 'string') abilities = [abilities];
      abilities = abilities.map(toID);
      var _iterator9 = _createForOfIteratorHelper(this.getAllActive()),
        _step9;
      try {
        for (_iterator9.s(); !(_step9 = _iterator9.n()).done;) {
          var active = _step9.value;
          if (abilities.includes(toID(active.effectiveAbility()))) {
            return true;
          }
        }
      } catch (err) {
        _iterator9.e(err);
      } finally {
        _iterator9.f();
      }
      return false;
    }
  }, {
    key: "reset",
    value: function reset() {
      var _this$subscription;
      this.paused = true;
      this.scene.pause();
      this.resetStep();
      (_this$subscription = this.subscription) === null || _this$subscription === void 0 || _this$subscription.call(this, 'paused');
    }
  }, {
    key: "resetStep",
    value: function resetStep() {
      // battle state
      this.turn = -1;
      this.started = !this.paused;
      this.ended = false;
      this.atQueueEnd = false;
      this.weather = '';
      this.weatherTimeLeft = 0;
      this.weatherMinTimeLeft = 0;
      this.pseudoWeather = [];
      this.lastMove = '';
      var _iterator10 = _createForOfIteratorHelper(this.sides),
        _step10;
      try {
        for (_iterator10.s(); !(_step10 = _iterator10.n()).done;) {
          var side = _step10.value;
          if (side) side.reset();
        }
      } catch (err) {
        _iterator10.e(err);
      } finally {
        _iterator10.f();
      }
      this.myPokemon = null;
      this.myAllyPokemon = null;

      // DOM state
      this.scene.reset();

      // activity queue state
      this.activeMoveIsSpread = null;
      this.currentStep = 0;
      this.resetTurnsSinceMoved();
      this.nextStep();
    }
  }, {
    key: "destroy",
    value: function destroy() {
      if (this.autoresize) {
        window.removeEventListener('resize', this.onResize);
      }
      this.scene.destroy();
      for (var i = 0; i < this.sides.length; i++) {
        if (this.sides[i]) this.sides[i].destroy();
        this.sides[i] = null;
      }
      this.mySide = null;
      this.nearSide = null;
      this.farSide = null;
      this.p1 = null;
      this.p2 = null;
      this.p3 = null;
      this.p4 = null;
    }
  }, {
    key: "log",
    value: function log(args, kwArgs, preempt) {
      this.scene.log.add(args, kwArgs, preempt);
    }
  }, {
    key: "resetToCurrentTurn",
    value: function resetToCurrentTurn() {
      this.seekTurn(this.ended ? Infinity : this.turn, true);
    }
  }, {
    key: "switchViewpoint",
    value: function switchViewpoint() {
      this.setViewpoint(this.viewpointSwitched ? 'p1' : 'p2');
    }
  }, {
    key: "setViewpoint",
    value: function setViewpoint(sideid) {
      if (this.mySide.sideid === sideid) return;
      if (sideid.length !== 2 || !sideid.startsWith('p')) return;
      var side = this[sideid];
      if (!side) return;
      this.mySide = side;
      if (side.n % 2 === this.p1.n) {
        this.viewpointSwitched = false;
        this.nearSide = this.p1;
        this.farSide = this.p2;
      } else {
        this.viewpointSwitched = true;
        this.nearSide = this.p2;
        this.farSide = this.p1;
      }
      this.nearSide.isFar = false;
      this.farSide.isFar = true;
      if (this.sides.length > 2) {
        this.sides[this.nearSide.n + 2].isFar = false;
        this.sides[this.farSide.n + 2].isFar = true;
      }
      this.resetToCurrentTurn();
    }

    //
    // activities
    //
  }, {
    key: "start",
    value: function start() {
      this.log(['start']);
      this.resetTurnsSinceMoved();
    }
  }, {
    key: "winner",
    value: function winner(_winner) {
      var _this$subscription2;
      this.log(['win', _winner || '']);
      this.ended = true;
      (_this$subscription2 = this.subscription) === null || _this$subscription2 === void 0 || _this$subscription2.call(this, 'ended');
    }
  }, {
    key: "prematureEnd",
    value: function prematureEnd() {
      var _this$subscription3;
      this.log(['message', 'This replay ends here.']);
      this.ended = true;
      (_this$subscription3 = this.subscription) === null || _this$subscription3 === void 0 || _this$subscription3.call(this, 'ended');
    }
  }, {
    key: "endLastTurn",
    value: function endLastTurn() {
      if (this.endLastTurnPending) {
        this.endLastTurnPending = false;
        this.scene.updateStatbars();
      }
    }
  }, {
    key: "setHardcoreMode",
    value: function setHardcoreMode(mode) {
      this.hardcoreMode = mode;
      this.scene.updateSidebars();
      this.scene.updateWeather(true);
    }
  }, {
    key: "setTurn",
    value: function setTurn(turnNum) {
      if (turnNum === this.turn + 1) {
        this.endLastTurnPending = true;
      }
      if (this.turn && !this.usesUpkeep) this.updateTurnCounters(); // for compatibility with old replays
      this.turn = turnNum;
      this.started = true;
      if (this.seeking === null) this.turnsSinceMoved++;
      this.scene.incrementTurn();
      if (this.seeking !== null) {
        if (turnNum >= this.seeking) {
          this.stopSeeking();
        }
      } else {
        var _this$subscription4;
        (_this$subscription4 = this.subscription) === null || _this$subscription4 === void 0 || _this$subscription4.call(this, 'turn');
      }
    }
  }, {
    key: "resetTurnsSinceMoved",
    value: function resetTurnsSinceMoved() {
      this.turnsSinceMoved = 0;
      this.scene.updateAcceleration();
    }
  }, {
    key: "changeWeather",
    value: function changeWeather(weatherName, poke, isUpkeep, ability) {
      var weather = toID(weatherName);
      if (!weather || weather === 'none') {
        weather = '';
      }
      if (isUpkeep) {
        if (this.weather && this.weatherTimeLeft) {
          this.weatherTimeLeft--;
          if (this.weatherMinTimeLeft !== 0) this.weatherMinTimeLeft--;
        }
        if (this.seeking === null) {
          this.scene.upkeepWeather();
        }
        return;
      }
      if (weather) {
        var isExtremeWeather = weather === 'deltastream' || weather === 'desolateland' || weather === 'primordialsea';
        if (poke) {
          if (ability) {
            this.activateAbility(poke, ability.name);
          }
          this.weatherTimeLeft = this.gen <= 5 || isExtremeWeather ? 0 : 8;
          this.weatherMinTimeLeft = this.gen <= 5 || isExtremeWeather ? 0 : 5;
        } else if (isExtremeWeather) {
          this.weatherTimeLeft = 0;
          this.weatherMinTimeLeft = 0;
        } else {
          this.weatherTimeLeft = this.gen <= 3 ? 5 : 8;
          this.weatherMinTimeLeft = this.gen <= 3 ? 0 : 5;
        }
      }
      this.weather = weather;
      this.scene.updateWeather();
    }
  }, {
    key: "swapSideConditions",
    value: function swapSideConditions() {
      var sideConditions = ['mist', 'lightscreen', 'reflect', 'spikes', 'safeguard', 'tailwind', 'toxicspikes', 'stealthrock', 'waterpledge', 'firepledge', 'grasspledge', 'stickyweb', 'auroraveil', 'gmaxsteelsurge', 'gmaxcannonade', 'gmaxvinelash', 'gmaxwildfire'];
      if (this.gameType === 'freeforall') {
        // Court Change rotates side conditions clockwise in a free-for-all

        // the list of all sides in clockwise order
        var sides = [this.sides[0], this.sides[3], this.sides[1], this.sides[2]];
        var temp = {
          0: {},
          1: {},
          2: {},
          3: {}
        };
        for (var _i2 = 0, _sides = sides; _i2 < _sides.length; _i2++) {
          var side = _sides[_i2];
          for (var id in side.sideConditions) {
            if (!sideConditions.includes(id)) continue;
            temp[side.n][id] = side.sideConditions[id];
            side.removeSideCondition(id);
          }
        }
        for (var i = 0; i < 4; i++) {
          var sourceSide = sides[i]; // the current side in rotation
          var sourceSideConditions = temp[sourceSide.n];
          var targetSide = sides[(i + 1) % 4]; // the next side in rotation
          for (var _id in sourceSideConditions) {
            targetSide.sideConditions[_id] = sourceSideConditions[_id];
            this.scene.addSideCondition(targetSide.n, _id);
          }
        }
        return;
      }
      var side1 = this.sides[0];
      var side2 = this.sides[1];
      for (var _i3 = 0, _sideConditions = sideConditions; _i3 < _sideConditions.length; _i3++) {
        var _id2 = _sideConditions[_i3];
        if (side1.sideConditions[_id2] && side2.sideConditions[_id2]) {
          var _ref = [side2.sideConditions[_id2], side1.sideConditions[_id2]];
          side1.sideConditions[_id2] = _ref[0];
          side2.sideConditions[_id2] = _ref[1];
          this.scene.addSideCondition(side1.n, _id2);
          this.scene.addSideCondition(side2.n, _id2);
        } else if (side1.sideConditions[_id2] && !side2.sideConditions[_id2]) {
          side2.sideConditions[_id2] = side1.sideConditions[_id2];
          this.scene.addSideCondition(side2.n, _id2);
          side1.removeSideCondition(_id2);
        } else if (side2.sideConditions[_id2] && !side1.sideConditions[_id2]) {
          side1.sideConditions[_id2] = side2.sideConditions[_id2];
          this.scene.addSideCondition(side1.n, _id2);
          side2.removeSideCondition(_id2);
        }
      }
    }
  }, {
    key: "updateTurnCounters",
    value: function updateTurnCounters() {
      var _iterator11 = _createForOfIteratorHelper(this.pseudoWeather),
        _step11;
      try {
        for (_iterator11.s(); !(_step11 = _iterator11.n()).done;) {
          var pWeather = _step11.value;
          if (pWeather[1]) pWeather[1]--;
          if (pWeather[2]) pWeather[2]--;
        }
      } catch (err) {
        _iterator11.e(err);
      } finally {
        _iterator11.f();
      }
      var _iterator12 = _createForOfIteratorHelper(this.sides),
        _step12;
      try {
        for (_iterator12.s(); !(_step12 = _iterator12.n()).done;) {
          var side = _step12.value;
          for (var id in side.sideConditions) {
            var cond = side.sideConditions[id];
            if (cond[2]) cond[2]--;
            if (cond[3]) cond[3]--;
          }
        }
      } catch (err) {
        _iterator12.e(err);
      } finally {
        _iterator12.f();
      }
      for (var _i4 = 0, _arr = [].concat(_toConsumableArray(this.nearSide.active), _toConsumableArray(this.farSide.active)); _i4 < _arr.length; _i4++) {
        var poke = _arr[_i4];
        if (poke) {
          if (poke.status === 'tox') poke.statusData.toxicTurns++;
          poke.clearTurnstatuses();
        }
      }
      this.scene.updateWeather();
    }
  }, {
    key: "useMove",
    value: function useMove(pokemon, move, target, kwArgs) {
      var fromeffect = Dex.getEffect(kwArgs.from);
      this.activateAbility(pokemon, fromeffect);
      pokemon.clearMovestatuses();
      if (move.id === 'focuspunch') {
        pokemon.removeTurnstatus('focuspunch');
      }
      this.scene.updateStatbar(pokemon);
      if (fromeffect.id === 'sleeptalk') {
        pokemon.rememberMove(move.name, 0);
      }
      var callerMoveForPressure = null;
      // will not include effects that are conditions named after moves like Magic Coat and Snatch, which is good
      if (fromeffect.id && kwArgs.from.startsWith("move:")) {
        callerMoveForPressure = fromeffect;
      }
      if (!fromeffect.id || callerMoveForPressure || fromeffect.id === 'pursuit') {
        var moveName = move.name;
        if (!callerMoveForPressure) {
          var previousLine = this.stepQueue[this.currentStep - 1];
          var zPower = previousLine.startsWith('|-zpower');
          if (move.isZ && zPower) {
            pokemon.item = move.isZ;
            var item = Dex.items.get(move.isZ);
            if (item.zMoveFrom) moveName = item.zMoveFrom;
          } else if (move.name.startsWith('Z-') && zPower) {
            moveName = moveName.slice(2);
            move = Dex.moves.get(moveName);
            if (window.BattleItems) {
              for (var _item in BattleItems) {
                if (BattleItems[_item].zMoveType === move.type) pokemon.item = _item;
              }
            }
          }
        }
        var pp = callerMoveForPressure ? 0 : 1; // 1 pp was already deducted from using the move itself
        if ((this.abilityActive('Pressure') || this.gen === 3) && move.id !== 'stickyweb') {
          var foeTargets = [];
          var moveTarget = move.pressureTarget;
          if (!target && this.gameType === 'singles' && !['self', 'allies', 'allySide', 'adjacentAlly', 'adjacentAllyOrSelf', 'allyTeam'].includes(moveTarget)) {
            // Hardcode for moves without a target in singles
            foeTargets.push(pokemon.side.foe.active[0]);
          } else if (['all', 'allAdjacent', 'allAdjacentFoes', 'foeSide'].includes(moveTarget)) {
            var _iterator13 = _createForOfIteratorHelper(this.getAllActive()),
              _step13;
            try {
              for (_iterator13.s(); !(_step13 = _iterator13.n()).done;) {
                var active = _step13.value;
                if (active === pokemon) continue;
                // Pressure affects allies in gen 3 and 4
                if (this.gen <= 4 || active.side !== pokemon.side && active.side.ally !== pokemon.side) {
                  foeTargets.push(active);
                }
              }
            } catch (err) {
              _iterator13.e(err);
            } finally {
              _iterator13.f();
            }
          } else if (target && target.side !== pokemon.side) {
            foeTargets.push(target);
          }
          pp = this.getPressurePP(pp, foeTargets.filter(function (foe) {
            return foe && !foe.fainted;
          }));
        }
        pokemon.rememberMove(callerMoveForPressure ? callerMoveForPressure.name : moveName, pp);
      }
      pokemon.lastMove = move.id;
      this.lastMove = move.id;
      if (move.id === 'wish' || move.id === 'healingwish') {
        pokemon.side.wisher = pokemon;
      }
    }
  }, {
    key: "getPressurePP",
    value: function getPressurePP(pp, foes) {
      var _iterator14 = _createForOfIteratorHelper(foes),
        _step14;
      try {
        for (_iterator14.s(); !(_step14 = _iterator14.n()).done;) {
          var foe = _step14.value;
          var abilities = Object.values(this.dex.species.get(foe.speciesForme).abilities);
          var canHavePressure = this.gen === 3 && abilities.includes('Pressure');
          if (foe.effectiveAbility() === 'Pressure' || canHavePressure && abilities.length === 1) {
            if (typeof pp === 'number') {
              pp += 1;
            } else {
              pp[0] += 1;
              pp[1] += 1;
            }
          } else if (canHavePressure) {
            if (typeof pp === 'number') {
              pp = [pp, pp];
            }
            pp[0] += 1;
          }
        }
      } catch (err) {
        _iterator14.e(err);
      } finally {
        _iterator14.f();
      }
      return pp;
    }
  }, {
    key: "animateMove",
    value: function animateMove(pokemon, move, target, kwArgs) {
      this.activeMoveIsSpread = kwArgs.spread;
      if (this.seeking !== null || kwArgs.still) return;
      if (!target) target = pokemon.side.foe.active[0];
      if (!target) target = pokemon.side.foe.missedPokemon;
      if (kwArgs.miss && target.side) {
        target = target.side.missedPokemon;
      }
      if (kwArgs.notarget) {
        return;
      }
      if (kwArgs.prepare || kwArgs.anim === 'prepare') {
        this.scene.runPrepareAnim(move.id, pokemon, target);
        return;
      }
      var usedMove = kwArgs.anim ? Dex.moves.get(kwArgs.anim) : move;
      if (!kwArgs.spread) {
        this.scene.runMoveAnim(usedMove.id, [pokemon, target]);
        return;
      }
      var targets = [pokemon];
      if (kwArgs.spread === '.') {
        //  no target was hit by the attack
        targets.push(target.side.missedPokemon);
      } else {
        var _iterator15 = _createForOfIteratorHelper(kwArgs.spread.split(',')),
          _step15;
        try {
          for (_iterator15.s(); !(_step15 = _iterator15.n()).done;) {
            var hitTarget = _step15.value;
            var curTarget = this.getPokemon(hitTarget + ': ?');
            if (!curTarget) {
              this.log(['error', "Invalid spread move target: \"".concat(hitTarget, "\"")]);
              continue;
            }
            targets.push(curTarget);
          }
        } catch (err) {
          _iterator15.e(err);
        } finally {
          _iterator15.f();
        }
      }
      this.scene.runMoveAnim(usedMove.id, targets);
    }
  }, {
    key: "cantUseMove",
    value: function cantUseMove(pokemon, effect, move, kwArgs) {
      pokemon.clearMovestatuses();
      this.scene.updateStatbar(pokemon);
      if (effect.id in BattleStatusAnims) {
        this.scene.runStatusAnim(effect.id, [pokemon]);
      }
      this.activateAbility(pokemon, effect);
      if (move.id) pokemon.rememberMove(move.name, 0);
      switch (effect.id) {
        case 'par':
          this.scene.resultAnim(pokemon, 'Paralyzed', 'par');
          break;
        case 'frz':
          this.scene.resultAnim(pokemon, 'Frozen', 'frz');
          break;
        case 'slp':
          this.scene.resultAnim(pokemon, 'Asleep', 'slp');
          pokemon.statusData.sleepTurns++;
          break;
        case 'truant':
          this.scene.resultAnim(pokemon, 'Loafing around', 'neutral');
          break;
        case 'recharge':
          this.scene.runOtherAnim('selfstatus', [pokemon]);
          this.scene.resultAnim(pokemon, 'Must recharge', 'neutral');
          break;
        case 'focuspunch':
          this.scene.resultAnim(pokemon, 'Lost focus', 'neutral');
          pokemon.removeTurnstatus('focuspunch');
          break;
        case 'shelltrap':
          this.scene.resultAnim(pokemon, 'Trap failed', 'neutral');
          pokemon.removeTurnstatus('shelltrap');
          break;
        case 'flinch':
          this.scene.resultAnim(pokemon, 'Flinched', 'neutral');
          pokemon.removeTurnstatus('focuspunch');
          break;
        case 'attract':
          this.scene.resultAnim(pokemon, 'Immobilized', 'neutral');
          break;
      }
      this.scene.animReset(pokemon);
    }
  }, {
    key: "activateAbility",
    value: function activateAbility(pokemon, effectOrName, isNotBase) {
      if (!pokemon || !effectOrName) return;
      if (typeof effectOrName !== 'string') {
        if (effectOrName.effectType !== 'Ability') return;
        effectOrName = effectOrName.name;
      }
      this.scene.abilityActivateAnim(pokemon, effectOrName);
      pokemon.rememberAbility(effectOrName, isNotBase);
    }
  }, {
    key: "runMinor",
    value: function runMinor(args, kwArgs, nextArgs, nextKwargs) {
      if (nextArgs && nextKwargs) {
        if (args[2] === 'Sturdy' && args[0] === '-activate') {
          args[2] = 'ability: Sturdy';
        }
        if (['-crit', '-supereffective', '-resisted'].includes(args[0]) || args[2] === 'ability: Sturdy') {
          kwArgs.then = '.';
        }
        if (args[0] === '-damage' && !kwArgs.from && args[1] !== nextArgs[1] && (['-crit', '-supereffective', '-resisted'].includes(nextArgs[0]) || nextArgs[0] === '-damage' && !nextKwargs.from)) {
          kwArgs.then = '.';
        }
        if (args[0] === '-damage' && nextArgs[0] === '-damage' && kwArgs.from && kwArgs.from === nextKwargs.from) {
          kwArgs.then = '.';
        }
        if (args[0] === '-heal' && nextArgs[0] === '-heal' && kwArgs.from && kwArgs.from === nextKwargs.from) {
          kwArgs.then = '.';
        }
        if (args[0] === '-ability' && (args[2] === 'Intimidate' || args[4] === 'boost')) {
          kwArgs.then = '.';
        }
        if (args[0] === '-unboost' && nextArgs[0] === '-unboost') {
          kwArgs.then = '.';
        }
        if (args[0] === '-boost' && nextArgs[0] === '-boost') {
          kwArgs.then = '.';
        }
        if (args[0] === '-damage' && kwArgs.from === 'Leech Seed' && nextArgs[0] === '-heal' && nextKwargs.silent) {
          kwArgs.then = '.';
        }
        if (args[0] === 'detailschange' && nextArgs[0] === '-mega') {
          if (this.scene.closeMessagebar()) {
            this.currentStep--;
            return;
          }
          kwArgs.simult = '.';
        }
      }
      if (kwArgs.then) this.waitForAnimations = false;
      if (kwArgs.simult) this.waitForAnimations = 'simult';
      var CONSUMED = ['eaten', 'popped', 'consumed', 'held up'];
      switch (args[0]) {
        case '-damage':
          {
            var poke = this.getPokemon(args[1]);
            var damage = poke.healthParse(args[2], true);
            if (damage === null) break;
            var range = poke.getDamageRange(damage);
            if (kwArgs.from) {
              var effect = Dex.getEffect(kwArgs.from);
              var ofpoke = this.getPokemon(kwArgs.of);
              this.activateAbility(ofpoke, effect);
              if (effect.effectType === 'Item') {
                var itemPoke = ofpoke || poke;
                if (itemPoke.prevItem !== effect.name && !CONSUMED.includes(itemPoke.prevItemEffect)) {
                  itemPoke.item = effect.name;
                }
              }
              switch (effect.id) {
                case 'brn':
                  this.scene.runStatusAnim('brn', [poke]);
                  break;
                case 'psn':
                  this.scene.runStatusAnim('psn', [poke]);
                  break;
                case 'baddreams':
                  this.scene.runStatusAnim('cursed', [poke]);
                  break;
                case 'curse':
                  this.scene.runStatusAnim('cursed', [poke]);
                  break;
                case 'confusion':
                  this.scene.runStatusAnim('confusedselfhit', [poke]);
                  break;
                case 'leechseed':
                  this.scene.runOtherAnim('leech', [ofpoke, poke]);
                  break;
                case 'bind':
                case 'wrap':
                  this.scene.runOtherAnim('bound', [poke]);
                  break;
              }
            } else {
              if (this.dex.moves.get(this.lastMove).category !== 'Status') {
                poke.timesAttacked++;
              }
              var damageinfo = '' + Pokemon.getFormattedRange(range, damage[1] === 100 ? 0 : 1, "\u2013");
              if (damage[1] !== 100) {
                var hover = "".concat(damage[0] < 0 ? "\u2212" : '').concat(Math.abs(damage[0]), "/").concat(damage[1]);
                if (damage[1] === 48) {
                  // this is a hack
                  hover += ' pixels';
                }
                // battle-log will convert this into <abbr>
                damageinfo = '||' + hover + '||' + damageinfo + '||';
              }
              args[3] = damageinfo;
            }
            this.scene.damageAnim(poke, Pokemon.getFormattedRange(range, 0, ' to '));
            this.log(args, kwArgs);
            break;
          }
        case '-heal':
          {
            var _poke = this.getPokemon(args[1], Dex.getEffect(kwArgs.from).id === 'revivalblessing');
            var _damage = _poke.healthParse(args[2], true, true);
            if (_damage === null) break;
            var _range = _poke.getDamageRange(_damage);
            if (kwArgs.from) {
              var _effect = Dex.getEffect(kwArgs.from);
              var _ofpoke = this.getPokemon(kwArgs.of);
              this.activateAbility(_ofpoke || _poke, _effect);
              if (_effect.effectType === 'Item' && !CONSUMED.includes(_poke.prevItemEffect)) {
                if (_poke.prevItem !== _effect.name) {
                  _poke.item = _effect.name;
                }
              }
              switch (_effect.id) {
                case 'lunardance':
                  var _iterator16 = _createForOfIteratorHelper(_poke.moveTrack),
                    _step16;
                  try {
                    for (_iterator16.s(); !(_step16 = _iterator16.n()).done;) {
                      var trackedMove = _step16.value;
                      trackedMove[1] = 0;
                    }
                  } catch (err) {
                    _iterator16.e(err);
                  } finally {
                    _iterator16.f();
                  }
                // falls through
                case 'healingwish':
                  this.lastMove = 'healing-wish';
                  this.scene.runResidualAnim('healingwish', _poke);
                  _poke.side.wisher = null;
                  _poke.statusData.sleepTurns = 0;
                  _poke.statusData.toxicTurns = 0;
                  break;
                case 'wish':
                  this.scene.runResidualAnim('wish', _poke);
                  break;
                case 'revivalblessing':
                  this.scene.runResidualAnim('wish', _poke);
                  var _this$parsePokemonId = this.parsePokemonId(args[1]),
                    siden = _this$parsePokemonId.siden;
                  var side = this.sides[siden];
                  _poke.fainted = false;
                  _poke.status = '';
                  this.scene.updateSidebar(side);
                  break;
              }
            }
            this.scene.runOtherAnim('heal', [_poke]);
            this.scene.healAnim(_poke, Pokemon.getFormattedRange(_range, 0, ' to '));
            this.log(args, kwArgs);
            break;
          }
        case '-sethp':
          {
            for (var k = 0; k < 2; k++) {
              var cpoke = this.getPokemon(args[1 + 2 * k]);
              if (cpoke) {
                var _damage2 = cpoke.healthParse(args[2 + 2 * k]);
                var _range2 = cpoke.getDamageRange(_damage2);
                var formattedRange = Pokemon.getFormattedRange(_range2, 0, ' to ');
                var diff = _damage2[0];
                if (diff > 0) {
                  this.scene.healAnim(cpoke, formattedRange);
                } else {
                  this.scene.damageAnim(cpoke, formattedRange);
                }
              }
            }
            this.log(args, kwArgs);
            break;
          }
        case '-boost':
          {
            var _poke2 = this.getPokemon(args[1]);
            var stat = args[2];
            if (this.gen === 1 && stat === 'spd') break;
            if (this.gen === 1 && stat === 'spa') stat = 'spc';
            var amount = parseInt(args[3], 10);
            if (amount === 0) {
              this.scene.resultAnim(_poke2, 'already ' + _poke2.getBoost(stat), 'neutral');
              this.log(args, kwArgs);
              break;
            }
            if (!_poke2.boosts[stat]) {
              _poke2.boosts[stat] = 0;
            }
            _poke2.boosts[stat] += amount;
            if (!kwArgs.silent && kwArgs.from) {
              var _effect2 = Dex.getEffect(kwArgs.from);
              var _ofpoke2 = this.getPokemon(kwArgs.of);
              if (!(_effect2.id === 'weakarmor' && stat === 'spe')) {
                this.activateAbility(_ofpoke2 || _poke2, _effect2);
              }
            }
            this.scene.resultAnim(_poke2, _poke2.getBoost(stat), 'good');
            this.log(args, kwArgs);
            break;
          }
        case '-unboost':
          {
            var _poke3 = this.getPokemon(args[1]);
            var _stat = args[2];
            if (this.gen === 1 && _stat === 'spd') break;
            if (this.gen === 1 && _stat === 'spa') _stat = 'spc';
            var _amount = parseInt(args[3], 10);
            if (_amount === 0) {
              this.scene.resultAnim(_poke3, 'already ' + _poke3.getBoost(_stat), 'neutral');
              this.log(args, kwArgs);
              break;
            }
            if (!_poke3.boosts[_stat]) {
              _poke3.boosts[_stat] = 0;
            }
            _poke3.boosts[_stat] -= _amount;
            if (!kwArgs.silent && kwArgs.from) {
              var _effect3 = Dex.getEffect(kwArgs.from);
              var _ofpoke3 = this.getPokemon(kwArgs.of);
              this.activateAbility(_ofpoke3 || _poke3, _effect3);
            }
            this.scene.resultAnim(_poke3, _poke3.getBoost(_stat), 'bad');
            this.log(args, kwArgs);
            break;
          }
        case '-setboost':
          {
            var _poke4 = this.getPokemon(args[1]);
            var _stat2 = args[2];
            var _amount2 = parseInt(args[3], 10);
            _poke4.boosts[_stat2] = _amount2;
            this.scene.resultAnim(_poke4, _poke4.getBoost(_stat2), _amount2 > 0 ? 'good' : 'bad');
            this.log(args, kwArgs);
            break;
          }
        case '-swapboost':
          {
            var _poke5 = this.getPokemon(args[1]);
            var poke2 = this.getPokemon(args[2]);
            var stats = args[3] ? args[3].split(', ') : ['atk', 'def', 'spa', 'spd', 'spe', 'accuracy', 'evasion'];
            var _iterator17 = _createForOfIteratorHelper(stats),
              _step17;
            try {
              for (_iterator17.s(); !(_step17 = _iterator17.n()).done;) {
                var _stat3 = _step17.value;
                var tmp = _poke5.boosts[_stat3];
                _poke5.boosts[_stat3] = poke2.boosts[_stat3];
                if (!_poke5.boosts[_stat3]) delete _poke5.boosts[_stat3];
                poke2.boosts[_stat3] = tmp;
                if (!poke2.boosts[_stat3]) delete poke2.boosts[_stat3];
              }
            } catch (err) {
              _iterator17.e(err);
            } finally {
              _iterator17.f();
            }
            this.scene.resultAnim(_poke5, 'Stats swapped', 'neutral');
            this.scene.resultAnim(poke2, 'Stats swapped', 'neutral');
            this.log(args, kwArgs);
            break;
          }
        case '-clearpositiveboost':
          {
            var _poke6 = this.getPokemon(args[1]);
            var _ofpoke4 = this.getPokemon(args[2]);
            var _effect4 = Dex.getEffect(args[3]);
            for (var _stat4 in _poke6.boosts) {
              if (_poke6.boosts[_stat4] > 0) delete _poke6.boosts[_stat4];
            }
            this.scene.resultAnim(_poke6, 'Boosts lost', 'bad');
            if (_effect4.id) {
              switch (_effect4.id) {
                case 'spectralthief':
                  // todo: update StealBoosts so it animates 1st on Spectral Thief
                  this.scene.runOtherAnim('spectralthiefboost', [_ofpoke4, _poke6]);
                  break;
              }
            }
            this.log(args, kwArgs);
            break;
          }
        case '-clearnegativeboost':
          {
            var _poke7 = this.getPokemon(args[1]);
            for (var _stat5 in _poke7.boosts) {
              if (_poke7.boosts[_stat5] < 0) delete _poke7.boosts[_stat5];
            }
            this.scene.resultAnim(_poke7, 'Restored', 'good');
            this.log(args, kwArgs);
            break;
          }
        case '-copyboost':
          {
            var _poke8 = this.getPokemon(args[1]);
            var frompoke = this.getPokemon(args[2]);
            if (!kwArgs.silent && kwArgs.from) {
              var _effect5 = Dex.getEffect(kwArgs.from);
              this.activateAbility(_poke8, _effect5);
            }
            var _stats = args[3] ? args[3].split(', ') : ['atk', 'def', 'spa', 'spd', 'spe', 'accuracy', 'evasion'];
            var _iterator18 = _createForOfIteratorHelper(_stats),
              _step18;
            try {
              for (_iterator18.s(); !(_step18 = _iterator18.n()).done;) {
                var _stat6 = _step18.value;
                _poke8.boosts[_stat6] = frompoke.boosts[_stat6];
                if (!_poke8.boosts[_stat6]) delete _poke8.boosts[_stat6];
              }
            } catch (err) {
              _iterator18.e(err);
            } finally {
              _iterator18.f();
            }
            if (this.gen >= 6) {
              var volatilesToCopy = ['focusenergy', 'gmaxchistrike', 'laserfocus'];
              for (var _i5 = 0, _volatilesToCopy = volatilesToCopy; _i5 < _volatilesToCopy.length; _i5++) {
                var volatile = _volatilesToCopy[_i5];
                if (frompoke.volatiles[volatile]) {
                  _poke8.addVolatile(volatile);
                } else {
                  _poke8.removeVolatile(volatile);
                }
              }
            }
            this.scene.resultAnim(_poke8, 'Stats copied', 'neutral');
            this.log(args, kwArgs);
            break;
          }
        case '-clearboost':
          {
            var _poke9 = this.getPokemon(args[1]);
            _poke9.boosts = {};
            if (!kwArgs.silent && kwArgs.from) {
              var _effect6 = Dex.getEffect(kwArgs.from);
              var _ofpoke5 = this.getPokemon(kwArgs.of);
              this.activateAbility(_ofpoke5 || _poke9, _effect6);
            }
            this.scene.resultAnim(_poke9, 'Stats reset', 'neutral');
            this.log(args, kwArgs);
            break;
          }
        case '-invertboost':
          {
            var _poke10 = this.getPokemon(args[1]);
            for (var _stat7 in _poke10.boosts) {
              _poke10.boosts[_stat7] = -_poke10.boosts[_stat7];
            }
            this.scene.resultAnim(_poke10, 'Stats inverted', 'neutral');
            this.log(args, kwArgs);
            break;
          }
        case '-clearallboost':
          {
            var timeOffset = this.scene.timeOffset;
            var _iterator19 = _createForOfIteratorHelper(this.getAllActive()),
              _step19;
            try {
              for (_iterator19.s(); !(_step19 = _iterator19.n()).done;) {
                var active = _step19.value;
                active.boosts = {};
                this.scene.timeOffset = timeOffset;
                this.scene.resultAnim(active, 'Stats reset', 'neutral');
              }
            } catch (err) {
              _iterator19.e(err);
            } finally {
              _iterator19.f();
            }
            this.log(args, kwArgs);
            break;
          }
        case '-crit':
          {
            var _poke11 = this.getPokemon(args[1]);
            if (_poke11) this.scene.resultAnim(_poke11, 'Critical hit', 'bad');
            if (this.activeMoveIsSpread) kwArgs.spread = '.';
            this.log(args, kwArgs);
            break;
          }
        case '-supereffective':
          {
            var _poke12 = this.getPokemon(args[1]);
            if (_poke12) {
              this.scene.resultAnim(_poke12, 'Super-effective', 'bad');
              if (Dex.afdMode === true) {
                // April Fool's 2018
                this.scene.runOtherAnim('hitmark', [_poke12]);
              }
            }
            if (this.activeMoveIsSpread) kwArgs.spread = '.';
            this.log(args, kwArgs);
            break;
          }
        case '-resisted':
          {
            var _poke13 = this.getPokemon(args[1]);
            if (_poke13) this.scene.resultAnim(_poke13, 'Resisted', 'neutral');
            if (this.activeMoveIsSpread) kwArgs.spread = '.';
            this.log(args, kwArgs);
            break;
          }
        case '-immune':
          {
            var _poke14 = this.getPokemon(args[1]);
            var fromeffect = Dex.getEffect(kwArgs.from);
            this.activateAbility(this.getPokemon(kwArgs.of) || _poke14, fromeffect);
            this.log(args, kwArgs);
            this.scene.resultAnim(_poke14, 'Immune', 'neutral');
            break;
          }
        case '-miss':
          {
            var target = this.getPokemon(args[2]);
            if (target) {
              this.scene.resultAnim(target, 'Missed', 'neutral');
            }
            this.log(args, kwArgs);
            break;
          }
        case '-fail':
          {
            var _poke15 = this.getPokemon(args[1]);
            var _effect7 = Dex.getEffect(args[2]);
            var _fromeffect = Dex.getEffect(kwArgs.from);
            var _ofpoke6 = this.getPokemon(kwArgs.of);
            if (_fromeffect.id === 'clearamulet') {
              _ofpoke6.item = 'Clear Amulet';
            } else {
              this.activateAbility(_ofpoke6 || _poke15, _fromeffect);
            }
            switch (_effect7.id) {
              case 'brn':
                this.scene.resultAnim(_poke15, 'Already burned', 'neutral');
                break;
              case 'tox':
              case 'psn':
                this.scene.resultAnim(_poke15, 'Already poisoned', 'neutral');
                break;
              case 'slp':
                if (_fromeffect.id === 'uproar') {
                  this.scene.resultAnim(_poke15, 'Failed', 'neutral');
                } else {
                  this.scene.resultAnim(_poke15, 'Already asleep', 'neutral');
                }
                break;
              case 'par':
                this.scene.resultAnim(_poke15, 'Already paralyzed', 'neutral');
                break;
              case 'frz':
                this.scene.resultAnim(_poke15, 'Already frozen', 'neutral');
                break;
              case 'unboost':
                this.scene.resultAnim(_poke15, 'Stat drop blocked', 'neutral');
                break;
              default:
                if (_poke15) {
                  this.scene.resultAnim(_poke15, 'Failed', 'neutral');
                }
                break;
            }
            this.scene.animReset(_poke15);
            this.log(args, kwArgs);
            break;
          }
        case '-block':
          {
            var _poke16 = this.getPokemon(args[1]);
            var _ofpoke7 = this.getPokemon(kwArgs.of);
            var _effect8 = Dex.getEffect(args[2]);
            this.activateAbility(_ofpoke7 || _poke16, _effect8);
            switch (_effect8.id) {
              case 'quickguard':
                _poke16.addTurnstatus('quickguard');
                this.scene.resultAnim(_poke16, 'Quick Guard', 'good');
                break;
              case 'wideguard':
                _poke16.addTurnstatus('wideguard');
                this.scene.resultAnim(_poke16, 'Wide Guard', 'good');
                break;
              case 'craftyshield':
                _poke16.addTurnstatus('craftyshield');
                this.scene.resultAnim(_poke16, 'Crafty Shield', 'good');
                break;
              case 'protect':
                _poke16.addTurnstatus('protect');
                this.scene.resultAnim(_poke16, 'Protected', 'good');
                break;
              case 'safetygoggles':
                _poke16.item = 'Safety Goggles';
                break;
              case 'protectivepads':
                _poke16.item = 'Protective Pads';
                break;
              case 'abilityshield':
                _poke16.item = 'Ability Shield';
                break;
            }
            this.log(args, kwArgs);
            break;
          }
        case '-center':
        case '-notarget':
        case '-ohko':
        case '-combine':
        case '-hitcount':
        case '-waiting':
        case '-zbroken':
          {
            this.log(args, kwArgs);
            break;
          }
        case '-zpower':
          {
            var _poke17 = this.getPokemon(args[1]);
            this.scene.runOtherAnim('zpower', [_poke17]);
            this.log(args, kwArgs);
            break;
          }
        case '-prepare':
          {
            var _poke18 = this.getPokemon(args[1]);
            var moveid = toID(args[2]);
            var _target = this.getPokemon(args[3]) || _poke18.side.foe.active[0] || _poke18;
            this.scene.runPrepareAnim(moveid, _poke18, _target);
            this.log(args, kwArgs);
            break;
          }
        case '-mustrecharge':
          {
            var _poke19 = this.getPokemon(args[1]);
            _poke19.addMovestatus('mustrecharge');
            this.scene.updateStatbar(_poke19);
            break;
          }
        case '-status':
          {
            var _poke20 = this.getPokemon(args[1]);
            var _effect9 = Dex.getEffect(kwArgs.from);
            var _ofpoke8 = this.getPokemon(kwArgs.of) || _poke20;
            _poke20.status = args[2];
            this.activateAbility(_ofpoke8 || _poke20, _effect9);
            if (_effect9.effectType === 'Item') {
              _ofpoke8.item = _effect9.name;
            }
            switch (args[2]) {
              case 'brn':
                this.scene.resultAnim(_poke20, 'Burned', 'brn');
                this.scene.runStatusAnim('brn', [_poke20]);
                break;
              case 'tox':
                this.scene.resultAnim(_poke20, 'Toxic poison', 'psn');
                this.scene.runStatusAnim('psn', [_poke20]);
                _poke20.statusData.toxicTurns = _effect9.name === "Toxic Orb" ? -1 : 0;
                break;
              case 'psn':
                this.scene.resultAnim(_poke20, 'Poisoned', 'psn');
                this.scene.runStatusAnim('psn', [_poke20]);
                break;
              case 'slp':
                this.scene.resultAnim(_poke20, 'Asleep', 'slp');
                if (_effect9.id === 'rest') {
                  _poke20.statusData.sleepTurns = 0; // for Gen 2 use through Sleep Talk
                }
                break;
              case 'par':
                this.scene.resultAnim(_poke20, 'Paralyzed', 'par');
                this.scene.runStatusAnim('par', [_poke20]);
                break;
              case 'frz':
                this.scene.resultAnim(_poke20, 'Frozen', 'frz');
                this.scene.runStatusAnim('frz', [_poke20]);
                break;
              default:
                this.scene.updateStatbar(_poke20);
                break;
            }
            this.log(args, kwArgs);
            break;
          }
        case '-curestatus':
          {
            var _poke21 = this.getPokemon(args[1]);
            var _effect10 = Dex.getEffect(kwArgs.from);
            if (_effect10.id) {
              switch (_effect10.id) {
                case 'flamewheel':
                case 'flareblitz':
                case 'fusionflare':
                case 'sacredfire':
                case 'scald':
                case 'steameruption':
                  kwArgs.thaw = '.';
                  break;
              }
            }
            if (_poke21) {
              _poke21.status = '';
              switch (args[2]) {
                case 'brn':
                  this.scene.resultAnim(_poke21, 'Burn cured', 'good');
                  break;
                case 'tox':
                case 'psn':
                  _poke21.statusData.toxicTurns = 0;
                  this.scene.resultAnim(_poke21, 'Poison cured', 'good');
                  break;
                case 'slp':
                  this.scene.resultAnim(_poke21, 'Woke up', 'good');
                  _poke21.statusData.sleepTurns = 0;
                  break;
                case 'par':
                  this.scene.resultAnim(_poke21, 'Paralysis cured', 'good');
                  break;
                case 'frz':
                  this.scene.resultAnim(_poke21, 'Thawed', 'good');
                  break;
                default:
                  _poke21.removeVolatile('confusion');
                  this.scene.resultAnim(_poke21, 'Cured', 'good');
              }
            }
            this.log(args, kwArgs);
            break;
          }
        case '-cureteam':
          {
            // For old gens when the whole team was always cured
            var _poke22 = this.getPokemon(args[1]);
            var _iterator20 = _createForOfIteratorHelper(_poke22.side.pokemon),
              _step20;
            try {
              for (_iterator20.s(); !(_step20 = _iterator20.n()).done;) {
                var _target2 = _step20.value;
                _target2.status = '';
                this.scene.updateStatbarIfExists(_target2);
              }
            } catch (err) {
              _iterator20.e(err);
            } finally {
              _iterator20.f();
            }
            this.scene.resultAnim(_poke22, 'Team Cured', 'good');
            this.log(args, kwArgs);
            break;
          }
        case '-item':
          {
            var _poke23 = this.getPokemon(args[1]);
            var item = Dex.items.get(args[2]);
            var _effect11 = Dex.getEffect(kwArgs.from);
            var _ofpoke9 = this.getPokemon(kwArgs.of);
            if (!_poke23) {
              if (_effect11.id === 'frisk') {
                var possibleTargets = _ofpoke9.side.foe.active.filter(function (p) {
                  return p !== null;
                });
                if (possibleTargets.length === 1) {
                  _poke23 = possibleTargets[0];
                } else {
                  this.activateAbility(_ofpoke9, "Frisk");
                  this.log(args, kwArgs);
                  break;
                }
              } else {
                throw new Error('No Pokemon in -item message');
              }
            }
            _poke23.item = item.name;
            _poke23.itemEffect = '';
            _poke23.removeVolatile('airballoon');
            if (item.id === 'airballoon') _poke23.addVolatile('airballoon');
            if (_effect11.id) {
              switch (_effect11.id) {
                case 'pickup':
                  this.activateAbility(_poke23, "Pickup");
                // falls through
                case 'recycle':
                  _poke23.itemEffect = 'found';
                  this.scene.resultAnim(_poke23, item.name, 'neutral');
                  break;
                case 'frisk':
                  this.activateAbility(_ofpoke9, "Frisk");
                  if (_poke23 && _poke23 !== _ofpoke9) {
                    // used for gen 6
                    _poke23.itemEffect = 'frisked';
                    this.scene.resultAnim(_poke23, item.name, 'neutral');
                  }
                  break;
                case 'magician':
                case 'pickpocket':
                  this.activateAbility(_poke23, _effect11.name);
                // falls through
                case 'thief':
                case 'covet':
                  // simulate the removal of the item from the ofpoke
                  _ofpoke9.item = '';
                  _ofpoke9.itemEffect = '';
                  _ofpoke9.prevItem = item.name;
                  _ofpoke9.prevItemEffect = 'stolen';
                  _ofpoke9.addVolatile('itemremoved');
                  _poke23.itemEffect = 'stolen';
                  this.scene.resultAnim(_poke23, item.name, 'neutral');
                  this.scene.resultAnim(_ofpoke9, 'Item Stolen', 'bad');
                  break;
                case 'harvest':
                  _poke23.itemEffect = 'harvested';
                  this.activateAbility(_poke23, "Harvest");
                  this.scene.resultAnim(_poke23, item.name, 'neutral');
                  break;
                case 'bestow':
                  _poke23.itemEffect = 'bestowed';
                  this.scene.resultAnim(_poke23, item.name, 'neutral');
                  break;
                case 'switcheroo':
                case 'trick':
                  _poke23.itemEffect = 'tricked';
                // falls through
                default:
                  break;
              }
            } else {
              switch (item.id) {
                case 'airballoon':
                  this.scene.resultAnim(_poke23, 'Balloon', 'good');
                  break;
              }
            }
            this.log(args, kwArgs);
            break;
          }
        case '-enditem':
          {
            var _poke24 = this.getPokemon(args[1]);
            var _item2 = Dex.items.get(args[2]);
            var _effect12 = Dex.getEffect(kwArgs.from);
            if (this.gen > 4 || _effect12.id !== 'knockoff') {
              _poke24.item = '';
              _poke24.itemEffect = '';
              _poke24.prevItem = _item2.name;
              _poke24.prevItemEffect = '';
            }
            _poke24.removeVolatile('airballoon');
            _poke24.addVolatile('itemremoved');
            if (kwArgs.eat) {
              _poke24.prevItemEffect = 'eaten';
              this.scene.runOtherAnim('consume', [_poke24]);
              this.lastMove = _item2.id;
            } else if (kwArgs.weaken) {
              _poke24.prevItemEffect = 'eaten';
              this.lastMove = _item2.id;
            } else if (_effect12.id) {
              switch (_effect12.id) {
                case 'fling':
                  _poke24.prevItemEffect = 'flung';
                  break;
                case 'knockoff':
                  if (this.gen <= 4) {
                    _poke24.itemEffect = 'knocked off';
                  } else {
                    _poke24.prevItemEffect = 'knocked off';
                  }
                  this.scene.runOtherAnim('itemoff', [_poke24]);
                  this.scene.resultAnim(_poke24, 'Item knocked off', 'neutral');
                  break;
                case 'stealeat':
                  _poke24.prevItemEffect = 'stolen';
                  break;
                case 'gem':
                  _poke24.prevItemEffect = 'consumed';
                  break;
                case 'incinerate':
                  _poke24.prevItemEffect = 'incinerated';
                  break;
              }
            } else {
              switch (_item2.id) {
                case 'airballoon':
                  _poke24.prevItemEffect = 'popped';
                  _poke24.removeVolatile('airballoon');
                  this.scene.resultAnim(_poke24, 'Balloon popped', 'neutral');
                  break;
                case 'focussash':
                  _poke24.prevItemEffect = 'consumed';
                  this.scene.resultAnim(_poke24, 'Sash', 'neutral');
                  break;
                case 'focusband':
                  this.scene.resultAnim(_poke24, 'Focus Band', 'neutral');
                  break;
                case 'redcard':
                  _poke24.prevItemEffect = 'held up';
                  break;
                default:
                  _poke24.prevItemEffect = 'consumed';
                  break;
              }
            }
            this.log(args, kwArgs);
            break;
          }
        case '-ability':
          {
            var _poke25 = this.getPokemon(args[1]);
            var ability = Dex.abilities.get(args[2]);
            var oldAbility = Dex.abilities.get(args[3]);
            var _effect13 = Dex.getEffect(kwArgs.from);
            var _ofpoke10 = this.getPokemon(kwArgs.of);
            _poke25.rememberAbility(ability.name, _effect13.id && !kwArgs.fail);
            if (kwArgs.silent) {
              // do nothing
            } else if (oldAbility.id) {
              this.activateAbility(_poke25, oldAbility.name);
              this.scene.wait(500);
              this.activateAbility(_poke25, ability.name, true);
              _ofpoke10 === null || _ofpoke10 === void 0 || _ofpoke10.rememberAbility(ability.name);
            } else if (_effect13.id) {
              switch (_effect13.id) {
                case 'desolateland':
                case 'primordialsea':
                case 'deltastream':
                  if (kwArgs.fail) {
                    this.activateAbility(_poke25, ability.name);
                  }
                  break;
                default:
                  this.activateAbility(_poke25, ability.name);
                  break;
              }
            } else {
              this.activateAbility(_poke25, ability.name);
            }
            this.scene.updateWeather();
            this.log(args, kwArgs);
            break;
          }
        case '-endability':
          {
            // deprecated; use |-start| for Gastro Acid
            // and the third arg of |-ability| for Entrainment et al
            var _poke26 = this.getPokemon(args[1]);
            var _ability = Dex.abilities.get(args[2]);
            _poke26.ability = '(suppressed)';
            if (_ability.id) {
              if (!_poke26.baseAbility) _poke26.baseAbility = _ability.name;
            }
            this.log(args, kwArgs);
            break;
          }
        case 'detailschange':
          {
            var _poke27 = this.getPokemon(args[1]);
            _poke27.removeVolatile('formechange');
            _poke27.removeVolatile('typeadd');
            _poke27.removeVolatile('typechange');
            var newSpeciesForme = args[2];
            var commaIndex = newSpeciesForme.indexOf(',');
            if (commaIndex !== -1) {
              var level = newSpeciesForme.substr(commaIndex + 1).trim();
              if (level.startsWith('L')) {
                _poke27.level = parseInt(level.substr(1), 10);
              }
              newSpeciesForme = args[2].substr(0, commaIndex);
            }
            var species = this.dex.species.get(newSpeciesForme);
            if (nextArgs) {
              // Handle abilities in Mix and Mega
              if (nextArgs[0] === '-mega') {
                var _item3 = this.dex.items.get(nextArgs[3]);
                if (_item3.megaStone) {
                  var index = Object.values(_item3.megaStone).indexOf(species.name);
                  if (index < 0) index = 0;
                  species = this.dex.species.get(Object.values(_item3.megaStone)[index]);
                }
              } else if (nextArgs[0] === '-primal' && nextArgs.length > 2) {
                if (nextArgs[2] === 'Red Orb') species = this.dex.species.get('Groudon-Primal');
                if (nextArgs[2] === 'Blue Orb') species = this.dex.species.get('Kyogre-Primal');
              }
            }
            _poke27.speciesForme = newSpeciesForme;
            _poke27.ability = _poke27.baseAbility = species.abilities ? species.abilities['0'] : '';
            _poke27.details = args[2];
            _poke27.searchid = args[1].substr(0, 2) + args[1].substr(args[1].indexOf(':')) + '|' + args[2];
            this.scene.animTransform(_poke27, true, true);
            this.log(args, kwArgs);
            break;
          }
        case '-transform':
          {
            var _poke28 = this.getPokemon(args[1]);
            var tpoke = this.getPokemon(args[2]);
            var _effect14 = Dex.getEffect(kwArgs.from);
            if (_poke28 === tpoke) throw new Error("Transforming into self");
            if (!kwArgs.silent) {
              this.activateAbility(_poke28, _effect14);
            }
            _poke28.boosts = _objectSpread({}, tpoke.boosts);
            _poke28.copyTypesFrom(tpoke, true);
            _poke28.ability = tpoke.ability;
            _poke28.timesAttacked = tpoke.timesAttacked;
            var targetForme = tpoke.volatiles.formechange;
            var speciesForme = targetForme && !targetForme[1].endsWith('-Gmax') ? targetForme[1] : tpoke.speciesForme;
            var pokemon = tpoke;
            var shiny = tpoke.shiny;
            var gender = tpoke.gender;
            var _level = tpoke.level;
            _poke28.addVolatile('transform', pokemon, shiny, gender, _level);
            _poke28.addVolatile('formechange', speciesForme);
            var _iterator21 = _createForOfIteratorHelper(tpoke.moveTrack),
              _step21;
            try {
              for (_iterator21.s(); !(_step21 = _iterator21.n()).done;) {
                var _trackedMove = _step21.value;
                _poke28.rememberMove(_trackedMove[0], 0);
              }
            } catch (err) {
              _iterator21.e(err);
            } finally {
              _iterator21.f();
            }
            this.scene.animTransform(_poke28);
            this.scene.resultAnim(_poke28, 'Transformed', 'good');
            this.log(['-transform', args[1], args[2], tpoke.speciesForme], kwArgs);
            break;
          }
        case '-formechange':
          {
            var _poke29 = this.getPokemon(args[1]);
            var _species = Dex.species.get(args[2]);
            var _fromeffect2 = Dex.getEffect(kwArgs.from);
            if (!_poke29.getSpeciesForme().endsWith('-Gmax') && !_species.name.endsWith('-Gmax')) {
              _poke29.removeVolatile('typeadd');
              _poke29.removeVolatile('typechange');
              if (this.gen >= 6) _poke29.removeVolatile('autotomize');
            }
            if (!kwArgs.silent) {
              this.activateAbility(_poke29, _fromeffect2);
            }
            _poke29.addVolatile('formechange', _species.name); // the formechange volatile reminds us to revert the sprite change on switch-out
            this.scene.animTransform(_poke29, true);
            this.log(args, kwArgs);
            break;
          }
        case '-mega':
          {
            var _poke30 = this.getPokemon(args[1]);
            var _item4 = Dex.items.get(args[3]);
            if (args[3]) {
              _poke30.item = _item4.name;
            }
            this.log(args, kwArgs);
            break;
          }
        case '-primal':
        case '-burst':
          {
            this.log(args, kwArgs);
            break;
          }
        case '-terastallize':
          {
            var _poke31 = this.getPokemon(args[1]);
            var type = Dex.types.get(args[2]).name;
            var lockForme = false;
            _poke31.removeVolatile('typeadd');
            _poke31.teraType = type;
            _poke31.terastallized = type;
            _poke31.details += ", tera:".concat(type);
            _poke31.searchid += ", tera:".concat(type);
            if (_poke31.speciesForme.startsWith("Morpeko")) {
              lockForme = true;
              _poke31.speciesForme = _poke31.getSpeciesForme();
              _poke31.details = _poke31.details.replace("Morpeko", _poke31.speciesForme);
              _poke31.searchid = "".concat(_poke31.ident, "|").concat(_poke31.details);
              delete _poke31.volatiles['formechange'];
            }
            this.scene.animTransform(_poke31, true, lockForme);
            this.scene.resetStatbar(_poke31);
            this.log(args, kwArgs);
            break;
          }
        case '-start':
          {
            var _poke32 = this.getPokemon(args[1]);
            var _effect15 = Dex.getEffect(args[2]);
            var _ofpoke11 = this.getPokemon(kwArgs.of);
            var _fromeffect3 = Dex.getEffect(kwArgs.from);
            this.activateAbility(_poke32, _effect15);
            this.activateAbility(_ofpoke11 || _poke32, _fromeffect3);
            switch (_effect15.id) {
              case 'typechange':
                if (_poke32.terastallized) break;
                if (_ofpoke11 && _fromeffect3.id === 'reflecttype') {
                  _poke32.copyTypesFrom(_ofpoke11);
                } else {
                  var types = Dex.sanitizeName(args[3] || '???');
                  // Kind of a hack/hardcode protocol for now due to time constraints, should be expanded upon later
                  if (_fromeffect3.id.startsWith('format')) {
                    _poke32.moddedType = types.split('/');
                  }
                  _poke32.removeVolatile('typeadd');
                  _poke32.addVolatile('typechange', types);
                  if (!kwArgs.silent) {
                    this.scene.typeAnim(_poke32, types);
                  }
                }
                this.scene.updateStatbar(_poke32);
                break;
              case 'typeadd':
                var _type = Dex.sanitizeName(args[3]);
                _poke32.addVolatile('typeadd', _type);
                if (kwArgs.silent) break;
                this.scene.typeAnim(_poke32, _type);
                break;
              case 'dynamax':
                _poke32.addVolatile('dynamax', !!args[3]);
                this.scene.animTransform(_poke32, true);
                break;
              case 'powertrick':
                this.scene.resultAnim(_poke32, 'Power Trick', 'neutral');
                break;
              case 'foresight':
              case 'miracleeye':
                this.scene.resultAnim(_poke32, 'Identified', 'bad');
                break;
              case 'telekinesis':
                this.scene.resultAnim(_poke32, 'Telekinesis', 'neutral');
                break;
              case 'confusion':
                if (!kwArgs.already) {
                  this.scene.runStatusAnim('confused', [_poke32]);
                  this.scene.resultAnim(_poke32, 'Confused', 'bad');
                }
                break;
              case 'leechseed':
                this.scene.updateStatbar(_poke32);
                break;
              case 'healblock':
                this.scene.resultAnim(_poke32, 'Heal Block', 'bad');
                break;
              case 'yawn':
                this.scene.resultAnim(_poke32, 'Drowsy', 'slp');
                break;
              case 'taunt':
                this.scene.resultAnim(_poke32, 'Taunted', 'bad');
                break;
              case 'imprison':
                this.scene.resultAnim(_poke32, 'Imprisoning', 'good');
                break;
              case 'disable':
                this.scene.resultAnim(_poke32, 'Disabled', 'bad');
                break;
              case 'embargo':
                this.scene.resultAnim(_poke32, 'Embargo', 'bad');
                break;
              case 'torment':
                this.scene.resultAnim(_poke32, 'Tormented', 'bad');
                break;
              case 'ingrain':
                this.scene.resultAnim(_poke32, 'Ingrained', 'good');
                break;
              case 'aquaring':
                this.scene.resultAnim(_poke32, 'Aqua Ring', 'good');
                break;
              case 'stockpile1':
                this.scene.resultAnim(_poke32, 'Stockpile', 'good');
                break;
              case 'stockpile2':
                _poke32.removeVolatile('stockpile1');
                this.scene.resultAnim(_poke32, 'Stockpile&times;2', 'good');
                break;
              case 'stockpile3':
                _poke32.removeVolatile('stockpile2');
                this.scene.resultAnim(_poke32, 'Stockpile&times;3', 'good');
                break;
              case 'perish0':
                _poke32.removeVolatile('perish1');
                break;
              case 'perish1':
                _poke32.removeVolatile('perish2');
                this.scene.resultAnim(_poke32, 'Perish next turn', 'bad');
                break;
              case 'perish2':
                _poke32.removeVolatile('perish3');
                this.scene.resultAnim(_poke32, 'Perish in 2', 'bad');
                break;
              case 'perish3':
                if (!kwArgs.silent) this.scene.resultAnim(_poke32, 'Perish in 3', 'bad');
                break;
              case 'encore':
                this.scene.resultAnim(_poke32, 'Encored', 'bad');
                break;
              case 'bide':
                this.scene.resultAnim(_poke32, 'Bide', 'good');
                break;
              case 'attract':
                this.scene.resultAnim(_poke32, 'Attracted', 'bad');
                break;
              case 'autotomize':
                this.scene.resultAnim(_poke32, 'Lightened', 'good');
                if (_poke32.volatiles.autotomize) {
                  _poke32.volatiles.autotomize[1]++;
                } else {
                  _poke32.addVolatile('autotomize', 1);
                }
                break;
              case 'focusenergy':
                this.scene.resultAnim(_poke32, '+Crit rate', 'good');
                break;
              case 'curse':
                this.scene.resultAnim(_poke32, 'Cursed', 'bad');
                break;
              case 'nightmare':
                this.scene.resultAnim(_poke32, 'Nightmare', 'bad');
                break;
              case 'magnetrise':
                this.scene.resultAnim(_poke32, 'Magnet Rise', 'good');
                break;
              case 'smackdown':
                this.scene.resultAnim(_poke32, 'Smacked Down', 'bad');
                _poke32.removeVolatile('magnetrise');
                _poke32.removeVolatile('telekinesis');
                if (_poke32.lastMove === 'fly' || _poke32.lastMove === 'bounce') this.scene.animReset(_poke32);
                break;
              case 'substitute':
                if (kwArgs.damage) {
                  this.scene.resultAnim(_poke32, 'Damage', 'bad');
                } else if (kwArgs.block) {
                  this.scene.resultAnim(_poke32, 'Blocked', 'neutral');
                }
                break;

              // Gen 1-2
              case 'mist':
                this.scene.resultAnim(_poke32, 'Mist', 'good');
                break;
              // Gen 1
              case 'lightscreen':
                this.scene.resultAnim(_poke32, 'Light Screen', 'good');
                break;
              case 'reflect':
                this.scene.resultAnim(_poke32, 'Reflect', 'good');
                break;
              case 'futuresight':
                _poke32.side.addSideCondition(_effect15, false);
                this.scene.updateWeather();
                break;
              case 'doomdesire':
                _poke32.side.addSideCondition(_effect15, false);
                this.scene.updateWeather();
                break;
            }
            if (!(_effect15.id === 'typechange' && _poke32.terastallized) && _effect15.id !== 'futuresight' && _effect15.id !== 'doomdesire') {
              _poke32.addVolatile(_effect15.id);
            }
            this.scene.updateStatbar(_poke32);
            this.log(args, kwArgs);
            break;
          }
        case '-end':
          {
            var _poke33 = this.getPokemon(args[1]);
            var _effect16 = Dex.getEffect(args[2]);
            var _fromeffect4 = Dex.getEffect(kwArgs.from);
            _poke33.removeVolatile(_effect16.id);
            if (kwArgs.silent && !(_effect16.id === 'protosynthesis' || _effect16.id === 'quarkdrive')) {
              // do nothing
            } else {
              switch (_effect16.id) {
                case 'dynamax':
                  this.scene.animTransform(_poke33);
                  break;
                case 'powertrick':
                  this.scene.resultAnim(_poke33, 'Power Trick', 'neutral');
                  break;
                case 'telekinesis':
                  this.scene.resultAnim(_poke33, 'Telekinesis&nbsp;ended', 'neutral');
                  break;
                case 'skydrop':
                  if (kwArgs.interrupt) {
                    this.scene.anim(_poke33, {
                      time: 100
                    });
                  }
                  break;
                case 'confusion':
                  this.scene.resultAnim(_poke33, 'Confusion&nbsp;ended', 'good');
                  break;
                case 'leechseed':
                  if (_fromeffect4.id === 'rapidspin') {
                    this.scene.resultAnim(_poke33, 'De-seeded', 'good');
                  }
                  break;
                case 'healblock':
                  this.scene.resultAnim(_poke33, 'Heal Block ended', 'good');
                  break;
                case 'attract':
                  this.scene.resultAnim(_poke33, 'Attract&nbsp;ended', 'good');
                  break;
                case 'taunt':
                  this.scene.resultAnim(_poke33, 'Taunt&nbsp;ended', 'good');
                  break;
                case 'disable':
                  this.scene.resultAnim(_poke33, 'Disable&nbsp;ended', 'good');
                  break;
                case 'embargo':
                  this.scene.resultAnim(_poke33, 'Embargo ended', 'good');
                  break;
                case 'torment':
                  this.scene.resultAnim(_poke33, 'Torment&nbsp;ended', 'good');
                  break;
                case 'encore':
                  this.scene.resultAnim(_poke33, 'Encore&nbsp;ended', 'good');
                  break;
                case 'bide':
                  this.scene.runOtherAnim('bideunleash', [_poke33]);
                  break;
                case 'illusion':
                  this.scene.resultAnim(_poke33, 'Illusion ended', 'bad');
                  _poke33.rememberAbility('Illusion');
                  break;
                case 'slowstart':
                  this.scene.resultAnim(_poke33, 'Slow Start ended', 'good');
                  break;
                case 'perishsong':
                  // for backwards compatibility
                  _poke33.removeVolatile('perish3');
                  break;
                case 'substitute':
                  this.scene.resultAnim(_poke33, 'Faded', 'bad');
                  break;
                case 'stockpile':
                  _poke33.removeVolatile('stockpile1');
                  _poke33.removeVolatile('stockpile2');
                  _poke33.removeVolatile('stockpile3');
                  break;
                case 'protosynthesis':
                  _poke33.removeVolatile('protosynthesisatk');
                  _poke33.removeVolatile('protosynthesisdef');
                  _poke33.removeVolatile('protosynthesisspa');
                  _poke33.removeVolatile('protosynthesisspd');
                  _poke33.removeVolatile('protosynthesisspe');
                  break;
                case 'quarkdrive':
                  _poke33.removeVolatile('quarkdriveatk');
                  _poke33.removeVolatile('quarkdrivedef');
                  _poke33.removeVolatile('quarkdrivespa');
                  _poke33.removeVolatile('quarkdrivespd');
                  _poke33.removeVolatile('quarkdrivespe');
                  break;
                default:
                  if (_effect16.effectType === 'Move') {
                    if (_effect16.name === 'Doom Desire') {
                      this.scene.runOtherAnim('doomdesirehit', [_poke33]);
                      _poke33.side.foe.removeSideCondition('Doom Desire');
                      this.scene.updateWeather();
                    }
                    if (_effect16.name === 'Future Sight') {
                      this.scene.runOtherAnim('futuresighthit', [_poke33]);
                      _poke33.side.foe.removeSideCondition('Future Sight');
                      this.scene.updateWeather();
                    }
                  }
              }
            }
            this.scene.updateStatbar(_poke33);
            this.log(args, kwArgs);
            break;
          }
        case '-singleturn':
          {
            var _poke34 = this.getPokemon(args[1]);
            var _effect17 = Dex.getEffect(args[2]);
            if (_effect17.id === 'roost' && !_poke34.getTypeList().includes('Flying')) {
              break;
            }
            _poke34.addTurnstatus(_effect17.id);
            switch (_effect17.id) {
              case 'roost':
                this.scene.resultAnim(_poke34, 'Landed', 'neutral');
                break;
              case 'quickguard':
                this.scene.resultAnim(_poke34, 'Quick Guard', 'good');
                break;
              case 'wideguard':
                this.scene.resultAnim(_poke34, 'Wide Guard', 'good');
                break;
              case 'craftyshield':
                this.scene.resultAnim(_poke34, 'Crafty Shield', 'good');
                break;
              case 'matblock':
                this.scene.resultAnim(_poke34, 'Mat Block', 'good');
                break;
              case 'protect':
                this.scene.resultAnim(_poke34, 'Protected', 'good');
                break;
              case 'endure':
                this.scene.resultAnim(_poke34, 'Enduring', 'good');
                break;
              case 'helpinghand':
                this.scene.resultAnim(_poke34, 'Helping Hand', 'good');
                break;
              case 'focuspunch':
                this.scene.resultAnim(_poke34, 'Focusing', 'neutral');
                _poke34.rememberMove(_effect17.name, 0);
                break;
              case 'shelltrap':
                this.scene.resultAnim(_poke34, 'Trap set', 'neutral');
                _poke34.rememberMove(_effect17.name, 0);
                break;
              case 'beakblast':
                this.scene.runOtherAnim('bidecharge', [_poke34]);
                this.scene.resultAnim(_poke34, 'Beak Blast', 'neutral');
                break;
            }
            this.scene.updateStatbar(_poke34);
            this.log(args, kwArgs);
            break;
          }
        case '-singlemove':
          {
            var _poke35 = this.getPokemon(args[1]);
            var _effect18 = Dex.getEffect(args[2]);
            _poke35.addMovestatus(_effect18.id);
            switch (_effect18.id) {
              case 'grudge':
                this.scene.resultAnim(_poke35, 'Grudge', 'neutral');
                break;
              case 'destinybond':
                this.scene.resultAnim(_poke35, 'Destiny Bond', 'neutral');
                break;
            }
            this.scene.updateStatbar(_poke35);
            this.log(args, kwArgs);
            break;
          }
        case '-activate':
          {
            var _poke36 = this.getPokemon(args[1]);
            var _effect19 = Dex.getEffect(args[2]);
            var _target3 = this.getPokemon(args[3]);
            this.activateAbility(_poke36, _effect19);
            switch (_effect19.id) {
              case 'poltergeist':
                _poke36.item = kwArgs.item;
                _poke36.itemEffect = 'disturbed';
                break;
              case 'symbiosis':
                _poke36.item = '';
                _poke36.itemEffect = '';
                _poke36.prevItem = kwArgs.item;
                _poke36.prevItemEffect = 'given away';
                _target3.item = kwArgs.item;
                _target3.itemEffect = 'shared';
                break;
              case 'grudge':
                _poke36.rememberMove(kwArgs.move, Infinity);
                break;
              case 'substitute':
                if (kwArgs.damage) {
                  this.scene.resultAnim(_poke36, 'Damage', 'bad');
                } else if (kwArgs.block) {
                  this.scene.resultAnim(_poke36, 'Blocked', 'neutral');
                }
                break;
              case 'attract':
                this.scene.runStatusAnim('attracted', [_poke36]);
                break;
              case 'bide':
                this.scene.runOtherAnim('bidecharge', [_poke36]);
                break;

              // move activations
              case 'aromatherapy':
                this.scene.resultAnim(_poke36, 'Team Cured', 'good');
                break;
              case 'healbell':
                this.scene.resultAnim(_poke36, 'Team Cured', 'good');
                break;
              case 'brickbreak':
                _target3.side.removeSideCondition('Reflect');
                _target3.side.removeSideCondition('LightScreen');
                break;
              case 'hyperspacefury':
              case 'hyperspacehole':
              case 'phantomforce':
              case 'shadowforce':
              case 'feint':
                this.scene.resultAnim(_poke36, 'Protection broken', 'bad');
                _poke36.removeTurnstatus('protect');
                var _iterator22 = _createForOfIteratorHelper(_poke36.side.pokemon),
                  _step22;
                try {
                  for (_iterator22.s(); !(_step22 = _iterator22.n()).done;) {
                    var curTarget = _step22.value;
                    curTarget.removeTurnstatus('wideguard');
                    curTarget.removeTurnstatus('quickguard');
                    curTarget.removeTurnstatus('craftyshield');
                    curTarget.removeTurnstatus('matblock');
                    this.scene.updateStatbar(curTarget);
                  }
                } catch (err) {
                  _iterator22.e(err);
                } finally {
                  _iterator22.f();
                }
                break;
              case 'eeriespell':
              case 'gmaxdepletion':
              case 'spite':
                var move = Dex.moves.get(kwArgs.move).name;
                var pp = Number(kwArgs.number);
                if (isNaN(pp)) pp = 4;
                _poke36.rememberMove(move, pp);
                break;
              case 'gravity':
                _poke36.removeVolatile('magnetrise');
                _poke36.removeVolatile('telekinesis');
                this.scene.anim(_poke36, {
                  time: 100
                });
                break;
              case 'skillswap':
              case 'wanderingspirit':
                if (this.gen <= 4) break;
                var pokeability = Dex.sanitizeName(kwArgs.ability) || _target3.ability;
                var targetability = Dex.sanitizeName(kwArgs.ability2) || _poke36.ability;
                if (pokeability) {
                  _poke36.ability = pokeability;
                  if (!_target3.baseAbility) _target3.baseAbility = pokeability;
                }
                if (targetability) {
                  _target3.ability = targetability;
                  if (!_poke36.baseAbility) _poke36.baseAbility = targetability;
                }
                if (_poke36.side !== _target3.side) {
                  this.activateAbility(_poke36, pokeability, true);
                  this.activateAbility(_target3, targetability, true);
                }
                break;

              // ability activations
              case 'electromorphosis':
              case 'windpower':
                _poke36.addMovestatus('charge');
                break;
              case 'forewarn':
                if (_target3) {
                  _target3.rememberMove(kwArgs.move, 0);
                } else {
                  var foeActive = [];
                  var _iterator23 = _createForOfIteratorHelper(_poke36.side.foe.active),
                    _step23;
                  try {
                    for (_iterator23.s(); !(_step23 = _iterator23.n()).done;) {
                      var maybeTarget = _step23.value;
                      if (maybeTarget && !maybeTarget.fainted) foeActive.push(maybeTarget);
                    }
                  } catch (err) {
                    _iterator23.e(err);
                  } finally {
                    _iterator23.f();
                  }
                  if (foeActive.length === 1) {
                    foeActive[0].rememberMove(kwArgs.move, 0);
                  }
                }
                break;
              case 'lingeringaroma':
              case 'mummy':
                if (!kwArgs.ability) break; // if Mummy activated but failed, no ability will have been sent
                var _ability2 = Dex.abilities.get(kwArgs.ability);
                this.activateAbility(_target3, _ability2.name);
                this.activateAbility(_poke36, _effect19.name);
                this.scene.wait(700);
                this.activateAbility(_target3, _effect19.name, true);
                break;

              // item activations
              case 'leppaberry':
              case 'mysteryberry':
                _poke36.rememberMove(kwArgs.move, _effect19.id === 'leppaberry' ? -10 : -5);
                break;
              case 'focusband':
                _poke36.item = 'Focus Band';
                break;
              case 'quickclaw':
                _poke36.item = 'Quick Claw';
                break;
              case 'abilityshield':
                _poke36.item = 'Ability Shield';
                break;
              default:
                if (kwArgs.broken) {
                  // for custom moves that break protection
                  this.scene.resultAnim(_poke36, 'Protection broken', 'bad');
                }
            }
            this.log(args, kwArgs);
            break;
          }
        case '-sidestart':
          {
            var _side = this.getSide(args[1]);
            var _effect20 = Dex.getEffect(args[2]);
            _side.addSideCondition(_effect20, !!kwArgs.persistent);
            switch (_effect20.id) {
              case 'tailwind':
              case 'auroraveil':
              case 'reflect':
              case 'lightscreen':
              case 'safeguard':
              case 'mist':
              case 'futuresight':
              case 'doomdesire':
              case 'gmaxwildfire':
              case 'gmaxvolcalith':
              case 'gmaxvinelash':
              case 'gmaxcannonade':
              case 'grasspledge':
              case 'firepledge':
              case 'waterpledge':
                this.scene.updateWeather();
                break;
            }
            this.log(args, kwArgs);
            break;
          }
        case '-sideend':
          {
            var _side2 = this.getSide(args[1]);
            var _effect21 = Dex.getEffect(args[2]);
            // let from = Dex.getEffect(kwArgs.from);
            // let ofpoke = this.getPokemon(kwArgs.of);
            _side2.removeSideCondition(_effect21.name);
            this.log(args, kwArgs);
            break;
          }
        case '-swapsideconditions':
          {
            this.swapSideConditions();
            this.scene.updateWeather();
            this.log(args, kwArgs);
            break;
          }
        case '-weather':
          {
            var _effect22 = Dex.getEffect(args[1]);
            var _poke37 = this.getPokemon(kwArgs.of) || undefined;
            var _ability3 = Dex.getEffect(kwArgs.from);
            if (!_effect22.id || _effect22.id === 'none') {
              kwArgs.from = this.weather;
            }
            this.changeWeather(_effect22.name, _poke37, !!kwArgs.upkeep, _ability3);
            this.log(args, kwArgs);
            break;
          }
        case '-fieldstart':
          {
            var _effect23 = Dex.getEffect(args[1]);
            var _poke38 = this.getPokemon(kwArgs.of);
            var _fromeffect5 = Dex.getEffect(kwArgs.from);
            this.activateAbility(_poke38, _fromeffect5);
            var _minTimeLeft = 5;
            var _maxTimeLeft = 0;
            if (_effect23.id.endsWith('terrain')) {
              for (var i = this.pseudoWeather.length - 1; i >= 0; i--) {
                var pwID = toID(this.pseudoWeather[i][0]);
                if (pwID.endsWith('terrain')) {
                  this.pseudoWeather.splice(i, 1);
                  continue;
                }
              }
              if (this.gen > 6) _maxTimeLeft = 8;
            }
            if (kwArgs.persistent) _minTimeLeft += 2;
            this.addPseudoWeather(_effect23.name, _minTimeLeft, _maxTimeLeft);
            switch (_effect23.id) {
              case 'gravity':
                if (this.seeking !== null) break;
                var _iterator24 = _createForOfIteratorHelper(this.getAllActive()),
                  _step24;
                try {
                  for (_iterator24.s(); !(_step24 = _iterator24.n()).done;) {
                    var _active = _step24.value;
                    this.scene.runOtherAnim('gravity', [_active]);
                  }
                } catch (err) {
                  _iterator24.e(err);
                } finally {
                  _iterator24.f();
                }
                break;
            }
            this.log(args, kwArgs);
            break;
          }
        case '-fieldend':
          {
            var _effect24 = Dex.getEffect(args[1]);
            // let poke = this.getPokemon(kwArgs.of);
            this.removePseudoWeather(_effect24.name);
            this.log(args, kwArgs);
            break;
          }
        case '-fieldactivate':
          {
            var _effect25 = Dex.getEffect(args[1]);
            switch (_effect25.id) {
              case 'perishsong':
                this.scene.updateStatbars();
                break;
            }
            this.log(args, kwArgs);
            break;
          }
        case '-anim':
          {
            var _poke39 = this.getPokemon(args[1]);
            var _move = Dex.moves.get(args[2]);
            if (this.checkActive(_poke39)) return;
            var _poke40 = this.getPokemon(args[3]);
            this.scene.beforeMove(_poke39);
            this.animateMove(_poke39, _move, _poke40, kwArgs);
            this.scene.afterMove(_poke39);
            break;
          }
        case '-hint':
        case '-message':
        case '-candynamax':
          {
            this.log(args, kwArgs);
            break;
          }
        default:
          {
            throw new Error("Unrecognized minor action: ".concat(args[0]));
            break;
          }
      }
    }
    /*
    parseSpriteData(name) {
    	let siden = 0,
    		foe = false;
    	while (true) {
    		if (name.substr(0, 6) === 'foeof-') {
    			foe = true;
    			name = name.substr(6);
    		} else if (name.substr(0, 9) === 'switched-') name = name.substr(9);
    		else if (name.substr(0, 9) === 'existing-') name = name.substr(9);
    		else if (name.substr(0, 4) === 'foe-') {
    			siden = this.p2.n;
    			name = name.substr(4);
    		} else if (name.substr(0, 5) === 'ally-') {
    			siden = this.p1.n;
    			name = name.substr(5);
    		} else break;
    	}
    	if (name.substr(name.length - 1) === ')') {
    		let parenIndex = name.lastIndexOf('(');
    		if (parenIndex > 0) {
    			let species = name.substr(parenIndex + 1);
    			name = species.substr(0, species.length - 1);
    		}
    	}
    	if (foe) siden = (siden ? 0 : 1);
    		let data = Dex.species.get(name);
    	return data.spriteData[siden];
    }
    */
    /**
     * @param name Leave blank for Team Preview
     * @param pokemonid Leave blank for Team Preview
     * @param details
     * @param output
     */
  }, {
    key: "parseDetails",
    value: function parseDetails(name, pokemonid, details) {
      var output = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
      var isTeamPreview = !name;
      output.details = details;
      output.name = name;
      output.speciesForme = name;
      output.level = 100;
      output.shiny = false;
      output.gender = '';
      output.ident = !isTeamPreview ? pokemonid : '';
      output.searchid = !isTeamPreview ? "".concat(pokemonid, "|").concat(details) : '';
      var splitDetails = details.split(', ');
      if (splitDetails[splitDetails.length - 1].startsWith('tera:')) {
        output.terastallized = splitDetails[splitDetails.length - 1].slice(5);
        splitDetails.pop();
      }
      if (splitDetails[splitDetails.length - 1] === 'shiny') {
        output.shiny = true;
        splitDetails.pop();
      }
      if (splitDetails[splitDetails.length - 1] === 'M' || splitDetails[splitDetails.length - 1] === 'F') {
        output.gender = splitDetails[splitDetails.length - 1];
        splitDetails.pop();
      }
      if (splitDetails[1]) {
        output.level = parseInt(splitDetails[1].substr(1), 10) || 100;
      }
      if (splitDetails[0]) {
        output.speciesForme = splitDetails[0];
      }
      return output;
    }
  }, {
    key: "parseHealth",
    value: function parseHealth(hpstring) {
      var output = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      var _hpstring$split = hpstring.split(' '),
        _hpstring$split2 = _slicedToArray(_hpstring$split, 2),
        hp = _hpstring$split2[0],
        status = _hpstring$split2[1];

      // hp parse
      output.hpcolor = '';
      if (hp === '0' || hp === '0.0') {
        if (!output.maxhp) output.maxhp = 100;
        output.hp = 0;
      } else if (hp.indexOf('/') > 0) {
        var _hp$split = hp.split('/'),
          _hp$split2 = _slicedToArray(_hp$split, 2),
          curhp = _hp$split2[0],
          maxhp = _hp$split2[1];
        if (isNaN(parseFloat(curhp)) || isNaN(parseFloat(maxhp))) {
          return null;
        }
        output.hp = parseFloat(curhp);
        output.maxhp = parseFloat(maxhp);
        if (output.hp > output.maxhp) output.hp = output.maxhp;
        var colorchar = maxhp.slice(-1);
        if (colorchar === 'r' || colorchar === 'y' || colorchar === 'g') {
          output.hpcolor = colorchar;
        }
      } else if (!isNaN(parseFloat(hp))) {
        if (!output.maxhp) output.maxhp = 100;
        output.hp = output.maxhp * parseFloat(hp) / 100;
      }

      // status parse
      if (!status) {
        output.status = '';
      } else if (status === 'par' || status === 'brn' || status === 'slp' || status === 'frz' || status === 'tox') {
        output.status = status;
      } else if (status === 'psn' && output.status !== 'tox') {
        output.status = status;
      } else if (status === 'fnt') {
        output.hp = 0;
        output.fainted = true;
      }
      return output;
    }
  }, {
    key: "parsePokemonId",
    value: function parsePokemonId(pokemonid) {
      var name = pokemonid;
      var siden = -1;
      var slot = -1; // if there is an explicit slot for this pokemon
      if (/^p[1-9]($|: )/.test(name)) {
        siden = parseInt(name.charAt(1), 10) - 1;
        name = name.slice(4);
      } else if (/^p[1-9][a-f]: /.test(name)) {
        var slotChart = {
          a: 0,
          b: 1,
          c: 2,
          d: 3,
          e: 4,
          f: 5
        };
        siden = parseInt(name.charAt(1), 10) - 1;
        slot = slotChart[name.charAt(2)];
        name = name.slice(5);
        pokemonid = "p".concat(siden + 1, ": ").concat(name);
      }
      return {
        name: name,
        siden: siden,
        slot: slot,
        pokemonid: pokemonid
      };
    }
  }, {
    key: "getSwitchedPokemon",
    value: function getSwitchedPokemon(pokemonid, details) {
      if (pokemonid === '??') throw new Error("pokemonid not passed");
      var _this$parsePokemonId2 = this.parsePokemonId(pokemonid),
        name = _this$parsePokemonId2.name,
        siden = _this$parsePokemonId2.siden,
        slot = _this$parsePokemonId2.slot,
        parsedPokemonid = _this$parsePokemonId2.pokemonid;
      pokemonid = parsedPokemonid;
      var searchid = "".concat(pokemonid, "|").concat(details);
      var side = this.sides[siden];

      // search inactive revealed pokemon
      for (var i = 0; i < side.pokemon.length; i++) {
        var _pokemon = side.pokemon[i];
        if (_pokemon.fainted) continue;
        // already active, can't be switching in
        if (side.active.includes(_pokemon)) continue;
        // just switched out, can't be switching in
        if (_pokemon === side.lastPokemon && !side.active[slot]) continue;
        if (_pokemon.searchid === searchid) {
          // exact match
          if (slot >= 0) _pokemon.slot = slot;
          return _pokemon;
        }
        if (!_pokemon.searchid && _pokemon.checkDetails(details)) {
          // switch-in matches Team Preview entry
          _pokemon = side.addPokemon(name, pokemonid, details, i);
          if (slot >= 0) _pokemon.slot = slot;
          return _pokemon;
        }
      }

      // pokemon not found, create a new pokemon object for it
      var pokemon = side.addPokemon(name, pokemonid, details);
      if (slot >= 0) pokemon.slot = slot;
      return pokemon;
    }
  }, {
    key: "rememberTeamPreviewPokemon",
    value: function rememberTeamPreviewPokemon(sideid, details) {
      var _this$parsePokemonId3 = this.parsePokemonId(sideid),
        siden = _this$parsePokemonId3.siden;
      return this.sides[siden].addPokemon('', '', details);
    }
  }, {
    key: "findCorrespondingPokemon",
    value: function findCorrespondingPokemon(serverPokemon) {
      var _this$parsePokemonId4 = this.parsePokemonId(serverPokemon.ident),
        siden = _this$parsePokemonId4.siden;
      var searchid = "".concat(serverPokemon.ident, "|").concat(serverPokemon.details);
      var _iterator25 = _createForOfIteratorHelper(this.sides[siden].pokemon),
        _step25;
      try {
        for (_iterator25.s(); !(_step25 = _iterator25.n()).done;) {
          var pokemon = _step25.value;
          if (pokemon.searchid === searchid) {
            return pokemon;
          }
        }
      } catch (err) {
        _iterator25.e(err);
      } finally {
        _iterator25.f();
      }
      return null;
    }
  }, {
    key: "getPokemon",
    value: function getPokemon(pokemonid) {
      var faintedOnly = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
      if (!pokemonid || pokemonid === '??' || pokemonid === 'null' || pokemonid === 'false') {
        return null;
      }
      var _this$parsePokemonId5 = this.parsePokemonId(pokemonid),
        siden = _this$parsePokemonId5.siden,
        slot = _this$parsePokemonId5.slot,
        parsedPokemonid = _this$parsePokemonId5.pokemonid;
      pokemonid = parsedPokemonid;

      /** if true, don't match an active pokemon */
      var isInactive = slot < 0;
      var side = this.sides[siden];

      // search player's pokemon
      if (!isInactive && side.active[slot]) return side.active[slot];
      var _iterator26 = _createForOfIteratorHelper(side.pokemon),
        _step26;
      try {
        for (_iterator26.s(); !(_step26 = _iterator26.n()).done;) {
          var pokemon = _step26.value;
          if (isInactive && !this.compatMode && side.active.includes(pokemon)) continue;
          if (faintedOnly && pokemon.hp) continue;
          if (pokemon.ident === pokemonid) {
            // name matched, good enough
            if (slot >= 0) pokemon.slot = slot;
            return pokemon;
          }
        }
      } catch (err) {
        _iterator26.e(err);
      } finally {
        _iterator26.f();
      }
      return null;
    }
  }, {
    key: "getSide",
    value: function getSide(sidename) {
      if (sidename === 'p1' || sidename.startsWith('p1:')) return this.p1;
      if (sidename === 'p2' || sidename.startsWith('p2:')) return this.p2;
      if ((sidename === 'p3' || sidename.startsWith('p3:')) && this.p3) return this.p3;
      if ((sidename === 'p4' || sidename.startsWith('p4:')) && this.p4) return this.p4;
      if (this.nearSide.id === sidename) return this.nearSide;
      if (this.farSide.id === sidename) return this.farSide;
      if (this.nearSide.name === sidename) return this.nearSide;
      if (this.farSide.name === sidename) return this.farSide;
      return {
        name: sidename,
        id: sidename.replace(/ /g, '')
      };
    }
  }, {
    key: "add",
    value: function add(command) {
      if (command) this.stepQueue.push(command);
      if (this.atQueueEnd && this.currentStep < this.stepQueue.length) {
        this.atQueueEnd = false;
        this.nextStep();
      }
    }
    /**
     * PS's preempt system is intended to show chat messages immediately,
     * instead of waiting for the battle to get to the point where the
     * message was said.
     *
     * In addition to being a nice quality-of-life feature, it's also
     * important to make sure timer updates happen in real-time.
     */
  }, {
    key: "instantAdd",
    value: function instantAdd(command) {
      this.run(command, true);
      this.preemptStepQueue.push(command);
      this.add(command);
    }
  }, {
    key: "runMajor",
    value: function runMajor(args, kwArgs, preempt) {
      switch (args[0]) {
        case 'start':
          {
            this.nearSide.active[0] = null;
            this.farSide.active[0] = null;
            this.scene.resetSides();
            this.start();
            break;
          }
        case 'upkeep':
          {
            this.usesUpkeep = true;
            this.updateTurnCounters();
            // Prevents getSwitchedPokemon from skipping over a Pokemon that switched out mid turn (e.g. U-turn)
            var _iterator27 = _createForOfIteratorHelper(this.sides),
              _step27;
            try {
              for (_iterator27.s(); !(_step27 = _iterator27.n()).done;) {
                var side = _step27.value;
                side.lastPokemon = null;
              }
            } catch (err) {
              _iterator27.e(err);
            } finally {
              _iterator27.f();
            }
            break;
          }
        case 'turn':
          {
            this.setTurn(parseInt(args[1], 10));
            this.log(args);
            break;
          }
        case 'tier':
          {
            this.tier = args[1];
            if (this.tier.endsWith('Random Battle')) {
              this.speciesClause = true;
            }
            if (this.tier.endsWith(' (Blitz)')) {
              this.messageFadeTime = 40;
              this.isBlitz = true;
            }
            if (this.tier.includes("Let's Go")) {
              this.dex = Dex.mod('gen7letsgo');
            }
            if (this.tier.includes('Super Staff Bros')) {
              this.dex = Dex.mod('gen9ssb');
            }
            if (this.tier.includes("Champions")) {
              this.dex = Dex.mod('champions');
            }
            this.log(args);
            break;
          }
        case 'gametype':
          {
            this.gameType = args[1];
            this.compatMode = false;
            switch (args[1]) {
              case 'multi':
              case 'freeforall':
                this.pokemonControlled = 1;
                if (!this.p3) this.p3 = new Side(this, 2);
                if (!this.p4) this.p4 = new Side(this, 3);
                this.p3.foe = this.p2;
                this.p4.foe = this.p1;
                if (args[1] === 'multi') {
                  this.p4.ally = this.p2;
                  this.p3.ally = this.p1;
                  this.p1.ally = this.p3;
                  this.p2.ally = this.p4;
                }
                this.p3.isFar = this.p1.isFar;
                this.p4.isFar = this.p2.isFar;
                this.sides = [this.p1, this.p2, this.p3, this.p4];
                // intentionally sync p1/p3 and p2/p4's active arrays
                this.p1.active = this.p3.active = [null, null];
                this.p2.active = this.p4.active = [null, null];
                break;
              case 'doubles':
                this.nearSide.active = [null, null];
                this.farSide.active = [null, null];
                break;
              case 'triples':
              case 'rotation':
                this.nearSide.active = [null, null, null];
                this.farSide.active = [null, null, null];
                break;
              default:
                var _iterator28 = _createForOfIteratorHelper(this.sides),
                  _step28;
                try {
                  for (_iterator28.s(); !(_step28 = _iterator28.n()).done;) {
                    var _side3 = _step28.value;
                    _side3.active = [null];
                  }
                } catch (err) {
                  _iterator28.e(err);
                } finally {
                  _iterator28.f();
                }
                break;
            }
            if (!this.pokemonControlled) this.pokemonControlled = this.nearSide.active.length;
            this.scene.updateGen();
            this.scene.resetSides();
            break;
          }
        case 'rule':
          {
            var ruleName = args[1].split(': ')[0];
            if (ruleName === 'Species Clause') this.speciesClause = true;
            if (ruleName === 'Blitz') {
              this.messageFadeTime = 40;
              this.isBlitz = true;
            }
            if (ruleName === 'Exact HP Mod') this.reportExactHP = true;
            this.rules[ruleName] = 1;
            this.log(args);
            break;
          }
        case 'rated':
          {
            this.rated = args[1] || true;
            this.scene.updateGen();
            this.log(args);
            break;
          }
        case 'inactive':
          {
            if (!this.kickingInactive) this.kickingInactive = true;
            if (args[1].startsWith("Time left: ")) {
              var _args$1$split = args[1].split(' | '),
                _args$1$split2 = _slicedToArray(_args$1$split, 3),
                time = _args$1$split2[0],
                totalTime = _args$1$split2[1],
                graceTime = _args$1$split2[2];
              this.kickingInactive = parseInt(time.slice(11), 10) || true;
              this.totalTimeLeft = parseInt(totalTime, 10);
              this.graceTimeLeft = parseInt(graceTime || '', 10) || 0;
              if (this.totalTimeLeft === this.kickingInactive) this.totalTimeLeft = 0;
              return;
            } else if (args[1].startsWith("You have ")) {
              // this is ugly but parseInt is documented to work this way
              // so I'm going to be lazy and not chop off the rest of the
              // sentence
              this.kickingInactive = parseInt(args[1].slice(9), 10) || true;
              return;
            } else if (args[1].endsWith(' seconds left.')) {
              var _window$app, _window$PS;
              var hasIndex = args[1].indexOf(' has ');
              var userid = ((_window$app = window.app) === null || _window$app === void 0 || (_window$app = _window$app.user) === null || _window$app === void 0 ? void 0 : _window$app.get('userid')) || ((_window$PS = window.PS) === null || _window$PS === void 0 ? void 0 : _window$PS.user.userid);
              if (toID(args[1].slice(0, hasIndex)) === userid) {
                this.kickingInactive = parseInt(args[1].slice(hasIndex + 5), 10) || true;
              }
            } else if (args[1].endsWith(' 15 seconds left this turn.')) {
              if (this.isBlitz) return;
            }
            this.log(args, undefined, preempt);
            break;
          }
        case 'inactiveoff':
          {
            this.kickingInactive = false;
            this.log(args, undefined, preempt);
            break;
          }
        case 'join':
        case 'j':
        case 'J':
          {
            if (this.roomid) {
              var room = app.rooms[this.roomid];
              var user = BattleTextParser.parseNameParts(args[1]);
              var _userid = toUserid(user.name);
              if (!room.users[_userid]) room.userCount.users++;
              room.users[_userid] = user;
              room.userList.add(_userid);
              room.userList.updateUserCount();
              room.userList.updateNoUsersOnline();
            }
            this.log(args, undefined, preempt);
            break;
          }
        case 'leave':
        case 'l':
        case 'L':
          {
            if (this.roomid) {
              var _room = app.rooms[this.roomid];
              var _user = args[1];
              var _userid2 = toUserid(_user);
              if (_room.users[_userid2]) _room.userCount.users--;
              delete _room.users[_userid2];
              _room.userList.remove(_userid2);
              _room.userList.updateUserCount();
              _room.userList.updateNoUsersOnline();
            }
            this.log(args, undefined, preempt);
            break;
          }
        case 'name':
        case 'n':
        case 'N':
          {
            if (this.roomid) {
              var _room2 = app.rooms[this.roomid];
              var _user2 = BattleTextParser.parseNameParts(args[1]);
              var oldid = args[2];
              if (toUserid(oldid) === app.user.get('userid')) {
                app.user.set({
                  away: _user2.away,
                  status: _user2.status
                });
              }
              var _userid3 = toUserid(_user2.name);
              _room2.users[_userid3] = _user2;
              _room2.userList.remove(oldid);
              _room2.userList.add(_userid3);
            }
            if (!this.ignoreSpects) {
              this.log(args, undefined, preempt);
            }
            break;
          }
        case 'player':
          {
            var _side4 = this.getSide(args[1]);
            _side4.setName(args[2]);
            if (args[3]) _side4.setAvatar(args[3]);
            if (args[4]) _side4.rating = args[4];
            if (this.joinButtons) this.scene.hideJoinButtons();
            this.log(args);
            this.scene.updateSidebar(_side4);
            break;
          }
        case 'badge':
          {
            var _side5 = this.getSide(args[1]);
            // handle all the rendering further down
            var badge = args.slice(2).join('|');
            // (don't allow duping)
            if (!_side5.badges.includes(badge)) _side5.badges.push(badge);
            this.scene.updateSidebar(_side5);
            break;
          }
        case 'teamsize':
          {
            var _side6 = this.getSide(args[1]);
            _side6.totalPokemon = parseInt(args[2], 10);
            this.scene.updateSidebar(_side6);
            break;
          }
        case 'win':
        case 'tie':
          {
            this.winner(args[0] === 'tie' ? undefined : args[1]);
            break;
          }
        case 'prematureend':
          {
            this.prematureEnd();
            break;
          }
        case 'clearpoke':
          {
            this.p1.clearPokemon();
            this.p2.clearPokemon();
            break;
          }
        case 'poke':
          {
            var pokemon = this.rememberTeamPreviewPokemon(args[1], args[2]);
            if (args[3] === 'mail') {
              pokemon.item = '(mail)';
            } else if (args[3] === 'item') {
              pokemon.item = '(exists)';
            }
            break;
          }
        case 'updatepoke':
          {
            var _this$parsePokemonId6 = this.parsePokemonId(args[1]),
              siden = _this$parsePokemonId6.siden;
            var _side7 = this.sides[siden];
            for (var i = 0; i < _side7.pokemon.length; i++) {
              var _pokemon2 = _side7.pokemon[i];
              if (_pokemon2.details !== args[2] && _pokemon2.checkDetails(args[2])) {
                _side7.addPokemon('', '', args[2], i);
                break;
              }
            }
            break;
          }
        case 'teampreview':
          {
            this.teamPreviewCount = parseInt(args[1], 10);
            this.scene.teamPreview();
            break;
          }
        case 'showteam':
          {
            var team = Teams.unpack(args[2]);
            if (!team.length) return;
            var _side8 = this.getSide(args[1]);
            _side8.openTeamSheet = true;
            _side8.clearPokemon();
            var _iterator29 = _createForOfIteratorHelper(team),
              _step29;
            try {
              for (_iterator29.s(); !(_step29 = _iterator29.n()).done;) {
                var set = _step29.value;
                var details = set.species + (!set.level || set.level === 100 ? '' : ", L".concat(set.level)) + (!set.gender || set.gender === 'N' ? '' : ", ".concat(set.gender)) + (set.shiny ? ', shiny' : '');
                var _pokemon3 = _side8.addPokemon('', '', details);
                if (set.item) _pokemon3.item = set.item;
                if (set.ability) _pokemon3.rememberAbility(set.ability);
                var _iterator30 = _createForOfIteratorHelper(set.moves),
                  _step30;
                try {
                  for (_iterator30.s(); !(_step30 = _iterator30.n()).done;) {
                    var move = _step30.value;
                    _pokemon3.rememberMove(move, 0);
                  }
                } catch (err) {
                  _iterator30.e(err);
                } finally {
                  _iterator30.f();
                }
                if (set.teraType) _pokemon3.teraType = set.teraType;
              }
            } catch (err) {
              _iterator29.e(err);
            } finally {
              _iterator29.f();
            }
            this.log(args, kwArgs);
            break;
          }
        case 'switch':
        case 'drag':
        case 'replace':
          {
            var _exec;
            this.endLastTurn();
            var poke = this.getSwitchedPokemon(args[1], args[2]);
            var slot = poke.slot;
            poke.healthParse(args[3]);
            poke.removeVolatile('itemremoved');
            poke.terastallized = ((_exec = /tera:([a-z]+)$/i.exec(args[2])) === null || _exec === void 0 ? void 0 : _exec[1]) || '';
            if (args[0] === 'switch') {
              if (poke.side.active[slot]) {
                poke.side.switchOut(poke.side.active[slot], kwArgs);
              }
              poke.side.switchIn(poke, kwArgs);
            } else if (args[0] === 'replace') {
              poke.side.replace(poke);
            } else {
              poke.side.dragIn(poke);
            }
            this.scene.updateWeather();
            this.log(args, kwArgs);
            break;
          }
        case 'faint':
          {
            var _poke41 = this.getPokemon(args[1]);
            _poke41.side.faint(_poke41);
            this.log(args, kwArgs);
            break;
          }
        case 'swap':
          {
            if (isNaN(Number(args[2]))) {
              var _poke42 = this.getPokemon(args[1]);
              _poke42.side.swapWith(_poke42, this.getPokemon(args[2]), kwArgs);
            } else {
              var _poke43 = this.getPokemon(args[1]);
              var targetIndex = parseInt(args[2], 10);
              if (kwArgs.from) {
                var target = _poke43.side.active[targetIndex];
                if (target) args[2] = target.ident;
              }
              _poke43.side.swapTo(_poke43, targetIndex);
            }
            this.log(args, kwArgs);
            break;
          }
        case 'move':
          {
            this.endLastTurn();
            this.resetTurnsSinceMoved();
            var _poke44 = this.getPokemon(args[1]);
            var _move2 = Dex.moves.get(args[2]);
            if (this.checkActive(_poke44)) return;
            var poke2 = this.getPokemon(args[3]);
            this.scene.beforeMove(_poke44);
            this.useMove(_poke44, _move2, poke2, kwArgs);
            this.animateMove(_poke44, _move2, poke2, kwArgs);
            this.scene.afterMove(_poke44);
            this.log(args, kwArgs);
            break;
          }
        case 'cant':
          {
            this.endLastTurn();
            this.resetTurnsSinceMoved();
            var _poke45 = this.getPokemon(args[1]);
            var effect = Dex.getEffect(args[2]);
            var _move3 = Dex.moves.get(args[3]);
            this.cantUseMove(_poke45, effect, _move3, kwArgs);
            this.log(args, kwArgs);
            break;
          }
        case 'gen':
          {
            this.gen = parseInt(args[1], 10);
            this.dex = Dex.forGen(this.gen);
            this.scene.updateGen();
            this.log(args);
            break;
          }
        case 'callback':
          {
            var _this$subscription5;
            (_this$subscription5 = this.subscription) === null || _this$subscription5 === void 0 || _this$subscription5.call(this, 'callback');
            break;
          }
        case 'fieldhtml':
          {
            this.scene.setFrameHTML(BattleLog.sanitizeHTML(args[1]));
            break;
          }
        case 'controlshtml':
          {
            this.scene.setControlsHTML(BattleLog.sanitizeHTML(args[1]));
            break;
          }
        case 'custom':
          {
            // Style is always |custom|-subprotocol|pokemon|additional info
            if (args[1] === '-endterastallize') {
              var _poke46 = this.getPokemon(args[2]);
              _poke46.removeVolatile('terastallize');
              _poke46.teraType = '';
              _poke46.terastallized = '';
              _poke46.details = _poke46.details.replace(/, tera:[a-z]+/i, '');
              _poke46.searchid = _poke46.searchid.replace(/, tera:[a-z]+/i, '');
              this.scene.animTransform(_poke46);
              this.scene.resetStatbar(_poke46);
              this.log(args, kwArgs);
            }
            break;
          }
        default:
          {
            this.log(args, kwArgs, preempt);
            break;
          }
      }
    }
  }, {
    key: "run",
    value: function run(str, preempt) {
      if (!preempt && this.preemptStepQueue.length && str === this.preemptStepQueue[0]) {
        this.preemptStepQueue.shift();
        this.scene.preemptCatchup();
        return;
      }
      if (!str) return;
      var _BattleTextParser$par = BattleTextParser.parseBattleLine(str),
        args = _BattleTextParser$par.args,
        kwArgs = _BattleTextParser$par.kwArgs;
      if (this.scene.maybeCloseMessagebar(args, kwArgs)) {
        this.currentStep--;
        this.activeMoveIsSpread = null;
        return;
      }

      // parse the next line if it's a minor: runMinor needs it parsed to determine when to merge minors
      var nextArgs = [''];
      var nextKwargs = {};
      var nextLine = this.stepQueue[this.currentStep + 1] || '';
      if (nextLine.startsWith('|-')) {
        var _BattleTextParser$par2 = BattleTextParser.parseBattleLine(nextLine);
        nextArgs = _BattleTextParser$par2.args;
        nextKwargs = _BattleTextParser$par2.kwArgs;
      }
      if (this.debug) {
        if (args[0].startsWith('-') || args[0] === 'detailschange') {
          this.runMinor(args, kwArgs, nextArgs, nextKwargs);
        } else {
          this.runMajor(args, kwArgs, preempt);
        }
      } else {
        try {
          if (args[0].startsWith('-') || args[0] === 'detailschange') {
            this.runMinor(args, kwArgs, nextArgs, nextKwargs);
          } else {
            this.runMajor(args, kwArgs, preempt);
          }
        } catch (err) {
          var _this$subscription6;
          this.log(['majorerror', 'Error parsing: ' + str + ' (' + err + ')']);
          if (err.stack) {
            var stack = ('' + err.stack).split('\n');
            var _iterator31 = _createForOfIteratorHelper(stack),
              _step31;
            try {
              for (_iterator31.s(); !(_step31 = _iterator31.n()).done;) {
                var line = _step31.value;
                if (/\brun\b/.test(line)) {
                  break;
                }
                this.log(['error', line]);
              }
            } catch (err) {
              _iterator31.e(err);
            } finally {
              _iterator31.f();
            }
          }
          (_this$subscription6 = this.subscription) === null || _this$subscription6 === void 0 || _this$subscription6.call(this, 'error');
        }
      }
      if (nextLine.startsWith('|start') || args[0] === 'teampreview') {
        if (this.turn === -1) {
          this.turn = 0;
          this.scene.updateBgm();
        }
      }
    }
  }, {
    key: "checkActive",
    value: function checkActive(poke) {
      if (!poke.side.active[poke.slot]) {
        // SOMEONE jumped in in the middle of a replay. <_<
        poke.side.replace(poke);
      }
      return false;
    }
  }, {
    key: "pause",
    value: function pause() {
      var _this$subscription7;
      this.paused = true;
      this.scene.pause();
      (_this$subscription7 = this.subscription) === null || _this$subscription7 === void 0 || _this$subscription7.call(this, 'paused');
    }
    /**
     * Properties relevant to battle playback, for replay UI implementers:
     * - `ended`: has the game ended in a win/loss?
     * - `atQueueEnd`: is animation caught up to the end of the battle queue, waiting for more input?
     * - `seeking`: are we trying to skip to a specific turn
     * - `turn`: what turn are we currently on? `-1` if we haven't started yet, `0` at team preview
     * - `paused`: are we playing at all?
     */
  }, {
    key: "play",
    value: function play() {
      var _this$subscription8;
      this.paused = false;
      this.started = true;
      this.scene.resume();
      this.nextStep();
      (_this$subscription8 = this.subscription) === null || _this$subscription8 === void 0 || _this$subscription8.call(this, 'playing');
    }
  }, {
    key: "skipTurn",
    value: function skipTurn() {
      this.seekBy(1);
    }
  }, {
    key: "seekBy",
    value: function seekBy(deltaTurn) {
      var _this$seeking;
      if (this.seeking === Infinity && deltaTurn < 0) {
        return this.seekTurn(this.turn + 1);
      }
      this.seekTurn(((_this$seeking = this.seeking) !== null && _this$seeking !== void 0 ? _this$seeking : this.turn) + deltaTurn);
    }
  }, {
    key: "seekTurn",
    value: function seekTurn(turn, forceReset) {
      if (isNaN(turn)) return;
      turn = Math.max(Math.floor(turn), 0);
      if (this.seeking !== null && turn > this.turn && !forceReset) {
        this.seeking = turn;
        return;
      }
      if (turn === 0) {
        var _this$subscription9;
        this.seeking = null;
        this.resetStep();
        this.scene.animationOn();
        if (this.paused) (_this$subscription9 = this.subscription) === null || _this$subscription9 === void 0 || _this$subscription9.call(this, 'paused');
        return;
      }
      this.seeking = turn;
      if (turn <= this.turn || forceReset) {
        this.scene.animationOff();
        this.resetStep();
      } else if (this.atQueueEnd) {
        this.scene.animationOn();
        this.seeking = null;
      } else {
        this.scene.animationOff();
        this.nextStep();
      }
    }
  }, {
    key: "stopSeeking",
    value: function stopSeeking() {
      var _this$subscription10;
      this.seeking = null;
      this.scene.animationOn();
      (_this$subscription10 = this.subscription) === null || _this$subscription10 === void 0 || _this$subscription10.call(this, this.paused ? 'paused' : 'playing');
    }
  }, {
    key: "shouldStep",
    value: function shouldStep() {
      if (this.atQueueEnd) return false;
      if (this.seeking !== null) return true;
      return !(this.paused && this.turn >= 0);
    }
  }, {
    key: "nextStep",
    value: function nextStep() {
      var _this2 = this;
      if (!this.shouldStep()) return;
      var time = Date.now();
      this.scene.startAnimations();
      var animations = undefined;
      var interruptionCount;
      do {
        // modified in this.run() but idk how to tell TS that
        this.waitForAnimations = true;
        if (this.currentStep >= this.stepQueue.length) {
          var _this$subscription11;
          this.atQueueEnd = true;
          if (!this.ended && this.isReplay) this.prematureEnd();
          this.stopSeeking();
          if (this.ended) {
            this.scene.updateBgm();
          }
          (_this$subscription11 = this.subscription) === null || _this$subscription11 === void 0 || _this$subscription11.call(this, 'atqueueend');
          return;
        }
        this.run(this.stepQueue[this.currentStep]);
        this.currentStep++;
        if (this.waitForAnimations === true) {
          animations = this.scene.finishAnimations();
        } else if (this.waitForAnimations === 'simult') {
          this.scene.timeOffset = 0;
        }
        if (Date.now() - time > 300) {
          interruptionCount = this.scene.interruptionCount;
          setTimeout(function () {
            if (interruptionCount === _this2.scene.interruptionCount) {
              _this2.nextStep();
            }
          }, 1);
          return;
        }
      } while (!animations && this.shouldStep());
      if (this.paused && this.turn >= 0 && this.seeking === null) {
        // initial Play button, team preview
        this.scene.pause();
        return;
      }
      if (!animations) return;
      interruptionCount = this.scene.interruptionCount;
      animations.done(function () {
        if (interruptionCount === _this2.scene.interruptionCount) {
          _this2.nextStep();
        }
      });
    }
  }, {
    key: "setQueue",
    value: function setQueue(queue) {
      this.stepQueue = queue;
      this.resetStep();
    }
  }, {
    key: "setMute",
    value: function setMute(mute) {
      this.scene.setMute(mute);
    }
  }]);
}();
if (typeof require === 'function') {
  // in Node
  global.Battle = Battle;
  global.Pokemon = Pokemon;
}