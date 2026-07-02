"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
var _process$versions;
function _toConsumableArray(r) { return _arrayWithoutHoles(r) || _iterableToArray(r) || _unsupportedIterableToArray(r) || _nonIterableSpread(); }
function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _iterableToArray(r) { if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r); }
function _arrayWithoutHoles(r) { if (Array.isArray(r)) return _arrayLikeToArray(r); }
function _createForOfIteratorHelper(r, e) { var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (!t) { if (Array.isArray(r) || (t = _unsupportedIterableToArray(r)) || e && r && "number" == typeof r.length) { t && (r = t); var _n = 0, F = function F() {}; return { s: F, n: function n() { return _n >= r.length ? { done: !0 } : { done: !1, value: r[_n++] }; }, e: function e(r) { throw r; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var o, a = !0, u = !1; return { s: function s() { t = t.call(r); }, n: function n() { var r = t.next(); return a = r.done, r; }, e: function e(r) { u = !0, o = r; }, f: function f() { try { a || null == t.return || t.return(); } finally { if (u) throw o; } } }; }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _slicedToArray(r, e) { return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t.return && (u = t.return(), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
/**
 * Pokemon Showdown Dex
 *
 * Roughly equivalent to sim/dex.js in a Pokemon Showdown server, but
 * designed for use in browsers rather than in Node.
 *
 * This is a generic utility library for Pokemon Showdown code: any
 * code shared between the replay viewer and the client usually ends up
 * here.
 *
 * Licensing note: PS's client has complicated licensing:
 * - The client as a whole is AGPLv3
 * - The battle replay/animation engine (battle-*.ts) by itself is MIT
 *
 * Compiled into battledata.js which includes all dependencies
 *
 * @author Guangcong Luo <guangcongluo@gmail.com>
 * @license MIT
 */

if (typeof window === 'undefined') {
  // Node
  global.window = global;
} else {
  // browser (possibly NW.js!)
  window.exports = window;
}
window.nodewebkit = !!(typeof process !== 'undefined' && (_process$versions = process.versions) !== null && _process$versions !== void 0 && _process$versions['node-webkit']);
function toID(text) {
  var _text, _text2;
  if ((_text = text) !== null && _text !== void 0 && _text.id) {
    text = text.id;
  } else if ((_text2 = text) !== null && _text2 !== void 0 && _text2.userid) {
    text = text.userid;
  }
  if (typeof text !== 'string' && typeof text !== 'number') return '';
  return "".concat(text).toLowerCase().replace(/[^a-z0-9]+/g, '');
}
function toUserid(text) {
  return toID(text);
}
var PSUtils = new (/*#__PURE__*/function () {
  function _class() {
    _classCallCheck(this, _class);
  }
  return _createClass(_class, [{
    key: "splitFirst",
    value:
    /**
     * Like string.split(delimiter), but only recognizes the first `limit`
     * delimiters (default 1).
     *
     * `"1 2 3 4".split(" ", 2) => ["1", "2"]`
     *
     * `splitFirst("1 2 3 4", " ", 1) => ["1", "2 3 4"]`
     *
     * Returns an array of length exactly limit + 1.
     */
    function splitFirst(str, delimiter) {
      var limit = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 1;
      var splitStr = [];
      while (splitStr.length < limit) {
        var delimiterIndex = str.indexOf(delimiter);
        if (delimiterIndex >= 0) {
          splitStr.push(str.slice(0, delimiterIndex));
          str = str.slice(delimiterIndex + delimiter.length);
        } else {
          splitStr.push(str);
          str = '';
        }
      }
      splitStr.push(str);
      return splitStr;
    }

    /**
     * Compares two variables; intended to be used as a smarter comparator.
     * The two variables must be the same type (TypeScript will not check this).
     *
     * - Numbers are sorted low-to-high, use `-val` to reverse
     * - Strings are sorted A to Z case-semi-insensitively, use `{reverse: val}` to reverse
     * - Booleans are sorted true-first (REVERSE of casting to numbers), use `!val` to reverse
     * - Arrays are sorted lexically in the order of their elements
     *
     * In other words: `[num, str]` will be sorted A to Z, `[num, {reverse: str}]` will be sorted Z to A.
     */
  }, {
    key: "compare",
    value: function compare(a, b) {
      if (typeof a === 'number') {
        return a - b;
      }
      if (typeof a === 'string') {
        return a.localeCompare(b);
      }
      if (typeof a === 'boolean') {
        return (a ? 1 : 2) - (b ? 1 : 2);
      }
      if (Array.isArray(a)) {
        for (var i = 0; i < a.length; i++) {
          var comparison = PSUtils.compare(a[i], b[i]);
          if (comparison) return comparison;
        }
        return 0;
      }
      if (a.reverse) {
        return PSUtils.compare(b.reverse, a.reverse);
      }
      throw new Error("Passed value ".concat(a, " is not comparable"));
    }
    /**
     * Sorts an array according to the callback's output on its elements.
     *
     * The callback's output is compared according to `PSUtils.compare` (in
     * particular, it supports arrays so you can sort by multiple things).
     */
  }, {
    key: "sortBy",
    value: function sortBy(array, callback) {
      if (!callback) return array.sort(PSUtils.compare);
      return array.sort(function (a, b) {
        return PSUtils.compare(callback(a), callback(b));
      });
    }
  }]);
}())();

/**
 * Sanitize a room ID by removing anything that isn't alphanumeric or `-`.
 * Shouldn't actually do anything except against malicious input.
 */
function toRoomid(roomid) {
  return roomid.replace(/[^a-zA-Z0-9-]+/g, '').toLowerCase();
}
function toName(name) {
  if (typeof name !== 'string' && typeof name !== 'number') return '';
  name = "".concat(name).replace(/[|\s[\],\u202e]+/g, ' ').trim();
  if (name.length > 18) name = name.substr(0, 18).trim();

  // remove zalgo
  name = name.replace(/[\u0300-\u036f\u0483-\u0489\u0610-\u0615\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06ED\u0E31\u0E34-\u0E3A\u0E47-\u0E4E]{3,}/g, '');
  name = name.replace(/[\u239b-\u23b9]/g, '');
  return name;
}
var Dex = new (/*#__PURE__*/function () {
  function _class2() {
    var _this = this;
    _classCallCheck(this, _class2);
    _defineProperty(this, "Ability", Ability);
    _defineProperty(this, "Item", Item);
    _defineProperty(this, "Move", Move);
    _defineProperty(this, "Species", Species);
    _defineProperty(this, "gen", 9);
    _defineProperty(this, "modid", 'gen9');
    _defineProperty(this, "cache", null);
    _defineProperty(this, "REGULAR", 0);
    _defineProperty(this, "WEAK", 1);
    _defineProperty(this, "RESIST", 2);
    _defineProperty(this, "IMMUNE", 3);
    _defineProperty(this, "statNames", ['hp', 'atk', 'def', 'spa', 'spd', 'spe']);
    _defineProperty(this, "statNamesExceptHP", ['atk', 'def', 'spa', 'spd', 'spe']);
    _defineProperty(this, "pokeballs", null);
    _defineProperty(this, "resourcePrefix", function (_window$document) {
      var prefix = '';
      if (((_window$document = window.document) === null || _window$document === void 0 || (_window$document = _window$document.location) === null || _window$document === void 0 ? void 0 : _window$document.protocol) !== 'http:') prefix = 'https:';
      return "".concat(prefix, "//").concat(window.Config ? Config.routes.client : 'play.pokemonshowdown.com', "/");
    }());
    _defineProperty(this, "fxPrefix", function (_window$document2) {
      var protocol = ((_window$document2 = window.document) === null || _window$document2 === void 0 || (_window$document2 = _window$document2.location) === null || _window$document2 === void 0 ? void 0 : _window$document2.protocol) !== 'http:' ? 'https:' : '';
      return "".concat(protocol, "//").concat(window.Config ? Config.routes.client : 'play.pokemonshowdown.com', "/fx/");
    }());
    _defineProperty(this, "loadedSpriteData", {
      xy: 1,
      bw: 0
    });
    _defineProperty(this, "moddedDexes", {});
    _defineProperty(this, "moves", {
      get: function get(nameOrMove) {
        if (nameOrMove && typeof nameOrMove !== 'string') {
          // TODO: don't accept Moves here
          return nameOrMove;
        }
        var name = nameOrMove || '';
        var id = toID(nameOrMove);
        if (window.BattleAliases && id in BattleAliases) {
          name = BattleAliases[id];
          id = toID(name);
        }
        if (!window.BattleMovedex) window.BattleMovedex = {};
        var data = window.BattleMovedex[id];
        if (data && typeof data.exists === 'boolean') return data;
        if (!data && id.substr(0, 11) === 'hiddenpower' && id.length > 11) {
          var _ref = /([a-z]*)([0-9]*)/.exec(id),
            _ref2 = _slicedToArray(_ref, 3),
            hpWithType = _ref2[1],
            hpPower = _ref2[2];
          data = _objectSpread(_objectSpread({}, window.BattleMovedex[hpWithType] || {}), {}, {
            basePower: Number(hpPower) || 60
          });
        }
        if (!data && id.substr(0, 6) === 'return' && id.length > 6) {
          data = _objectSpread(_objectSpread({}, window.BattleMovedex['return'] || {}), {}, {
            basePower: Number(id.slice(6))
          });
        }
        if (!data && id.substr(0, 11) === 'frustration' && id.length > 11) {
          data = _objectSpread(_objectSpread({}, window.BattleMovedex['frustration'] || {}), {}, {
            basePower: Number(id.slice(11))
          });
        }
        if (!data) data = {
          exists: false
        };
        var move = new Move(id, name, data);
        window.BattleMovedex[id] = move;
        return move;
      }
    });
    _defineProperty(this, "items", {
      get: function get(nameOrItem) {
        if (nameOrItem && typeof nameOrItem !== 'string') {
          // TODO: don't accept Items here
          return nameOrItem;
        }
        var name = nameOrItem || '';
        var id = toID(nameOrItem);
        if (window.BattleAliases && id in BattleAliases) {
          name = BattleAliases[id];
          id = toID(name);
        }
        if (!window.BattleItems) window.BattleItems = {};
        var data = window.BattleItems[id];
        if (data && typeof data.exists === 'boolean') return data;
        if (!data) data = {
          exists: false
        };
        var item = new Item(id, name, data);
        window.BattleItems[id] = item;
        return item;
      }
    });
    _defineProperty(this, "abilities", {
      get: function get(nameOrAbility) {
        if (nameOrAbility && typeof nameOrAbility !== 'string') {
          // TODO: don't accept Abilities here
          return nameOrAbility;
        }
        var name = nameOrAbility || '';
        var id = toID(nameOrAbility);
        if (window.BattleAliases && id in BattleAliases) {
          name = BattleAliases[id];
          id = toID(name);
        }
        if (!window.BattleAbilities) window.BattleAbilities = {};
        var data = window.BattleAbilities[id];
        if (data && typeof data.exists === 'boolean') return data;
        if (!data) data = {
          exists: false
        };
        var ability = new Ability(id, name, data);
        window.BattleAbilities[id] = ability;
        return ability;
      }
    });
    _defineProperty(this, "species", {
      get: function get(nameOrSpecies) {
        if (nameOrSpecies && typeof nameOrSpecies !== 'string') {
          // TODO: don't accept Species' here
          return nameOrSpecies;
        }
        var name = nameOrSpecies || '';
        var id = toID(nameOrSpecies);
        var formid = id;
        if (!window.BattlePokedexAltForms) window.BattlePokedexAltForms = {};
        if (formid in window.BattlePokedexAltForms) return window.BattlePokedexAltForms[formid];
        if (window.BattleAliases && id in BattleAliases) {
          name = BattleAliases[id];
          id = toID(name);
        } else if (window.BattlePokedex && !(id in BattlePokedex) && window.BattleBaseSpeciesChart) {
          var _iterator = _createForOfIteratorHelper(BattleBaseSpeciesChart),
            _step;
          try {
            for (_iterator.s(); !(_step = _iterator.n()).done;) {
              var baseSpeciesId = _step.value;
              if (formid.startsWith(baseSpeciesId)) {
                id = baseSpeciesId;
                break;
              }
            }
          } catch (err) {
            _iterator.e(err);
          } finally {
            _iterator.f();
          }
        }
        if (!window.BattlePokedex) window.BattlePokedex = {};
        var data = window.BattlePokedex[id];
        var species;
        if (data && typeof data.exists === 'boolean') {
          species = data;
        } else {
          var _evos;
          if (!data) data = {
            exists: false
          };
          if (!data.tier && id.endsWith('totem')) {
            data.tier = _this.species.get(id.slice(0, -5)).tier;
          }
          if (!data.tier && data.baseSpecies && toID(data.baseSpecies) !== id) {
            data.tier = _this.species.get(data.baseSpecies).tier;
          }
          data.nfe = data.id === 'dipplin' || !!((_evos = data.evos) !== null && _evos !== void 0 && _evos.some(function (evo) {
            var evoSpecies = _this.species.get(evo);
            return !evoSpecies.isNonstandard || evoSpecies.isNonstandard === data.isNonstandard ||
            // Pokemon with Hisui evolutions
            evoSpecies.isNonstandard === "Unobtainable";
          }));
          species = new Species(id, name, data);
          window.BattlePokedex[id] = species;
        }
        if (species.cosmeticFormes) {
          var _iterator2 = _createForOfIteratorHelper(species.cosmeticFormes),
            _step2;
          try {
            for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
              var forme = _step2.value;
              if (toID(forme) === formid) {
                species = new Species(formid, name, _objectSpread(_objectSpread({}, species), {}, {
                  name: forme,
                  forme: forme.slice(species.name.length + 1),
                  baseForme: "",
                  baseSpecies: species.name,
                  otherFormes: null
                }));
                window.BattlePokedexAltForms[formid] = species;
                break;
              }
            }
          } catch (err) {
            _iterator2.e(err);
          } finally {
            _iterator2.f();
          }
        }
        return species;
      }
    });
    _defineProperty(this, "types", {
      allCache: null,
      namesCache: null,
      get: function get(type) {
        if (!type || typeof type === 'string') {
          var _window$BattleTypeCha;
          var id = toID(type);
          var name = id.substr(0, 1).toUpperCase() + id.substr(1);
          type = ((_window$BattleTypeCha = window.BattleTypeChart) === null || _window$BattleTypeCha === void 0 ? void 0 : _window$BattleTypeCha[id]) || {};
          if (type.damageTaken) type.exists = true;
          if (!type.id) type.id = id;
          if (!type.name) type.name = name;
          if (!type.effectType) {
            type.effectType = 'Type';
          }
        }
        return type;
      },
      all: function all() {
        if (_this.types.allCache) return _this.types.allCache;
        var types = [];
        for (var id in window.BattleTypeChart || {}) {
          types.push(Dex.types.get(id));
        }
        if (types.length) _this.types.allCache = types;
        return types;
      },
      names: function names() {
        if (_this.types.namesCache) return _this.types.namesCache;
        var names = _this.types.all().map(function (type) {
          return type.name;
        });
        names.splice(names.indexOf('Stellar'), 1);
        if (names.length) _this.types.namesCache = names;
        return names;
      },
      isName: function isName(name) {
        var _window$BattleTypeCha2;
        var id = toID(name);
        if (name !== id.substr(0, 1).toUpperCase() + id.substr(1)) return false;
        return (_window$BattleTypeCha2 = window.BattleTypeChart) === null || _window$BattleTypeCha2 === void 0 ? void 0 : _window$BattleTypeCha2.hasOwnProperty(id);
      }
    });
  }
  return _createClass(_class2, [{
    key: "mod",
    value:
    /**
     * April Fools' Day setting:
     * * `true` = FULL, all jokes on
     * * `'sprites'` = SPRITES, only sprites and taunts
     * * `false | null | undefined` = OFF
     */

    function mod(modid) {
      if (modid === 'gen9') return this;
      if (!window.BattleTeambuilderTable) return this;
      if (modid in this.moddedDexes) {
        return this.moddedDexes[modid];
      }
      this.moddedDexes[modid] = new ModdedDex(modid);
      return this.moddedDexes[modid];
    }
  }, {
    key: "forGen",
    value: function forGen(gen) {
      if (!gen) return this;
      return this.mod("gen".concat(gen));
    }
  }, {
    key: "formatGen",
    value: function formatGen(format) {
      var formatid = toID(format);
      if (!formatid) return Dex.gen;
      if (!formatid.startsWith('gen')) return 6;
      return parseInt(formatid.charAt(3)) || Dex.gen;
    }
  }, {
    key: "forFormat",
    value: function forFormat(format) {
      var dex = Dex.forGen(Dex.formatGen(format));
      var formatid = toID(format).slice(4);
      if (dex.gen === 7 && formatid.includes('letsgo')) {
        dex = Dex.mod('gen7letsgo');
      }
      if (dex.gen === 8 && formatid.includes('bdsp')) {
        dex = Dex.mod('gen8bdsp');
      }
      if (dex.gen === 9 && formatid.includes('champions')) {
        dex = Dex.mod('champions');
      }
      return dex;
    }
  }, {
    key: "resolveAvatar",
    value: function resolveAvatar(avatar) {
      if (window.BattleAvatarNumbers && avatar in BattleAvatarNumbers) {
        avatar = BattleAvatarNumbers[avatar];
      }
      if (avatar.startsWith('#')) {
        return Dex.resourcePrefix + 'sprites/trainers-custom/' + toID(avatar.substr(1)) + '.png';
      }
      if (avatar.includes('.')) {
        // previously checked `&& window.Config?.server?.registered`
        // currently doesn't, bc server registration isn't a thing anymore
        // custom avatar served by the server
        var protocol = Config.server.port === 443 ? 'https' : 'http';
        var server = "".concat(protocol, "://").concat(Config.server.host, ":").concat(Config.server.port);
        return "".concat(server, "/avatars/").concat(encodeURIComponent(avatar).replace(/%3F/g, '?'));
      }
      return Dex.resourcePrefix + 'sprites/trainers/' + Dex.sanitizeName(avatar || 'unknown') + '.png';
    }

    /**
     * This is used to sanitize strings from data files like `moves.js` and
     * `teambuilder-tables.js`.
     *
     * This makes sure untrusted strings can't wreak havoc if someone forgets to
     * escape it before putting it in HTML.
     *
     * None of these characters belong in these files, anyway. (They can be used
     * in move descriptions, but those are served from `text.js`, which are
     * definitely always treated as unsanitized.)
     */
  }, {
    key: "sanitizeName",
    value: function sanitizeName(name) {
      if (!name) return '';
      return ('' + name).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').slice(0, 50);
    }
  }, {
    key: "prefs",
    value: function prefs(prop) {
      var _window$Storage, _window$PS;
      // @ts-expect-error this is what I get for calling it Storage...
      return (_window$Storage = window.Storage) !== null && _window$Storage !== void 0 && _window$Storage.prefs ? window.Storage.prefs(prop) : (_window$PS = window.PS) === null || _window$PS === void 0 || (_window$PS = _window$PS.prefs) === null || _window$PS === void 0 ? void 0 : _window$PS[prop];
    }
  }, {
    key: "getShortName",
    value: function getShortName(name) {
      var shortName = name.replace(/[^A-Za-z0-9]+$/, '');
      if (shortName.includes('(')) {
        shortName += name.slice(shortName.length).replace(/[^()]+/g, '').replace(/\(\)/g, '');
      }
      return shortName;
    }
  }, {
    key: "getEffect",
    value: function getEffect(name) {
      name = (name || '').trim();
      if (name.substr(0, 5) === 'item:') {
        return Dex.items.get(name.substr(5).trim());
      } else if (name.substr(0, 8) === 'ability:') {
        return Dex.abilities.get(name.substr(8).trim());
      } else if (name.substr(0, 5) === 'move:') {
        return Dex.moves.get(name.substr(5).trim());
      }
      var id = toID(name);
      return new PureEffect(id, name);
    }
  }, {
    key: "getGen3Category",
    value: function getGen3Category(type) {
      return ['Fire', 'Water', 'Grass', 'Electric', 'Ice', 'Psychic', 'Dark', 'Dragon'].includes(type) ? 'Special' : 'Physical';
    }
  }, {
    key: "hasAbility",
    value: function hasAbility(species, ability) {
      for (var i in species.abilities) {
        if (ability === species.abilities[i]) return true;
      }
      return false;
    }
  }, {
    key: "loadSpriteData",
    value: function loadSpriteData(gen) {
      if (this.loadedSpriteData[gen]) return;
      this.loadedSpriteData[gen] = 1;
      var path = $('script[src*="pokedex-mini.js"]').attr('src') || '';
      var qs = '?' + (path.split('?')[1] || '');
      path = (/.+?(?=data\/pokedex-mini\.js)/.exec(path) || [])[0] || '';
      var el = document.createElement('script');
      el.src = path + 'data/pokedex-mini-bw.js' + qs;
      document.getElementsByTagName('body')[0].appendChild(el);
    }
  }, {
    key: "getSpriteData",
    value: function getSpriteData(pokemon, isFront) {
      var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {
        gen: 6
      };
      var mechanicsGen = options.gen || 6;
      var isDynamax = !!options.dynamax;
      if (pokemon instanceof Pokemon) {
        if (pokemon.volatiles.transform) {
          options.shiny = pokemon.volatiles.transform[2];
          options.gender = pokemon.volatiles.transform[3];
        } else {
          options.shiny = pokemon.shiny;
          options.gender = pokemon.gender;
        }
        var isGigantamax = false;
        if (pokemon.volatiles.dynamax) {
          if (pokemon.volatiles.dynamax[1]) {
            isGigantamax = true;
          } else if (options.dynamax !== false) {
            isDynamax = true;
          }
        }
        pokemon = pokemon.getSpeciesForme() + (isGigantamax ? '-Gmax' : '');
      }
      var species = Dex.species.get(pokemon);
      // Gmax sprites are already extremely large, so we don't need to double.
      if (species.name.endsWith('-Gmax')) isDynamax = false;
      var spriteData = {
        gen: mechanicsGen,
        w: 96,
        h: 96,
        y: 0,
        url: Dex.resourcePrefix + 'sprites/',
        pixelated: true,
        isFrontSprite: false,
        cryurl: '',
        shiny: options.shiny
      };
      var name = species.spriteid;
      var dir;
      var facing;
      if (isFront) {
        spriteData.isFrontSprite = true;
        dir = '';
        facing = 'front';
      } else {
        dir = '-back';
        facing = 'back';
      }

      // Decide which gen sprites to use.
      //
      // There are several different generations we care about here:
      //
      //   - mechanicsGen: the generation number of the mechanics and battle (options.gen)
      //   - graphicsGen: the generation number of sprite/field graphics the user has requested.
      //     This will default to mechanicsGen, but may be altered depending on user preferences.
      //   - spriteData.gen: the generation number of a the specific Pokemon sprite in question.
      //     This defaults to graphicsGen, but if the graphicsGen doesn't have a sprite for the Pokemon
      //     (eg. Darmanitan in graphicsGen 2) then we go up gens until it exists.
      //
      var graphicsGen = mechanicsGen;
      if (Dex.prefs('nopastgens')) graphicsGen = 6;
      if (Dex.prefs('bwgfx') && graphicsGen >= 6) graphicsGen = 5;
      spriteData.gen = Math.max(graphicsGen, Math.min(species.gen, 5));
      var baseDir = ['', 'gen1', 'gen2', 'gen3', 'gen4', 'gen5', '', '', '', ''][spriteData.gen];
      var miscData = null;
      var speciesid = species.id;
      if (species.isTotem) speciesid = toID(name);
      if (window.BattlePokemonSprites) miscData = BattlePokemonSprites[speciesid];
      if (!miscData && window.BattlePokemonSpritesBW) miscData = BattlePokemonSpritesBW[speciesid];
      if (!miscData) miscData = {};
      if (miscData.num !== 0 && miscData.num > -5000) {
        var baseSpeciesid = toID(species.baseSpecies);
        spriteData.cryurl = 'audio/cries/' + baseSpeciesid;
        var formeid = species.formeid;
        var specialFormeCries = ['-bloodmoon', '-crowned', '-eternal', '-eternamax', '-four', '-hangry', '-hero', '-lowkey', '-noice', '-primal', '-rapidstrike', '-roaming', '-school', '-sky', '-starter', '-super', '-therian', '-unbound'];
        var specialBaseSpeciesCries = ['calyrex', 'kyurem', 'cramorant', 'indeedee', 'lycanroc', 'necrozma', 'oinkologne', 'oricorio', 'slowpoke', 'tatsugiri', 'zygarde'];
        if (species.isMega || formeid && (specialFormeCries.includes(formeid) || specialBaseSpeciesCries.includes(baseSpeciesid))) {
          if (species.isMega && (baseSpeciesid === 'meowstic' || baseSpeciesid === 'tatsugiri')) {
            spriteData.cryurl += '-mega';
          } else {
            spriteData.cryurl += formeid;
          }
        }
        spriteData.cryurl += '.mp3';
      }
      if (options.shiny && mechanicsGen > 1) dir += '-shiny';

      // April Fool's 2014
      if (Dex.afdMode || options.afd) {
        // Explicit false check above means AFD will be off if the user disables it - no matter what
        dir = 'afd' + dir;
        spriteData.url += dir + '/' + name + '.png';
        // Duplicate code but needed to make AFD tinymax work
        // April Fool's 2020
        if (isDynamax && !options.noScale) {
          spriteData.w *= 0.25;
          spriteData.h *= 0.25;
          spriteData.y += -22;
        } else if (species.isTotem && !options.noScale) {
          spriteData.w *= 0.5;
          spriteData.h *= 0.5;
          spriteData.y += -11;
        }
        return spriteData;
      }

      // Mod Cries
      if (options.mod) {
        spriteData.cryurl = "sprites/".concat(options.mod, "/audio/").concat(toID(species.baseSpecies));
        spriteData.cryurl += '.mp3';
      }
      var animatedSprite = false;
      if (!Dex.prefs('noanim') && !Dex.prefs('nogif') && spriteData.gen >= 5) {
        var animationArray = [];
        if (baseDir === '' && window.BattlePokemonSprites) {
          animationArray.push([BattlePokemonSprites[speciesid], '']);
        }
        if (window.BattlePokemonSpritesBW) {
          animationArray.push([BattlePokemonSpritesBW[speciesid], 'gen5']);
        }
        for (var _i = 0, _animationArray = animationArray; _i < _animationArray.length; _i++) {
          var _animationArray$_i = _slicedToArray(_animationArray[_i], 2),
            animationData = _animationArray$_i[0],
            animDir = _animationArray$_i[1];
          if (!animationData) continue;
          if (animationData[facing + 'f'] && options.gender === 'F') facing += 'f';
          if (!animationData[facing]) continue;
          if (facing.endsWith('f')) name += '-f';
          if (spriteData.gen >= 6) spriteData.pixelated = false;
          dir = animDir + 'ani' + dir;
          spriteData.w = animationData[facing].w;
          spriteData.h = animationData[facing].h;
          spriteData.url += dir + '/' + name + '.gif';
          animatedSprite = true;
          break;
        }
      }
      if (!animatedSprite) {
        // There is no entry or enough data in pokedex-mini.js
        // Handle these in case-by-case basis; either using BW sprites or matching the played gen.
        dir = (baseDir || 'gen5') + dir;

        // Gender differences don't exist prior to Gen 4,
        // so there are no sprites for it
        if (spriteData.gen >= 4 && miscData['frontf'] && options.gender === 'F') {
          name += '-f';
        }
        spriteData.url += dir + '/' + name + '.png';
      }
      if (!options.noScale) {
        if (graphicsGen > 4) {
          // no scaling
        } else if (spriteData.isFrontSprite) {
          spriteData.w *= 2;
          spriteData.h *= 2;
          spriteData.y += -16;
        } else {
          // old gen backsprites are multiplied by 1.5x by the 3D engine
          spriteData.w *= 2 / 1.5;
          spriteData.h *= 2 / 1.5;
          spriteData.y += -11;
        }
        if (spriteData.gen <= 2) spriteData.y += 2;
      }
      if (isDynamax && !options.noScale) {
        spriteData.w *= 2;
        spriteData.h *= 2;
        spriteData.y += -22;
      } else if (species.isTotem && !options.noScale) {
        spriteData.w *= 1.5;
        spriteData.h *= 1.5;
        spriteData.y += -11;
      }
      return spriteData;
    }
  }, {
    key: "getPokemonIconNum",
    value: function getPokemonIconNum(id, isFemale, facingLeft) {
      var _window$BattlePokemon, _window$BattlePokedex, _window$BattlePokemon2;
      var num = 0;
      if ((_window$BattlePokemon = window.BattlePokemonSprites) !== null && _window$BattlePokemon !== void 0 && (_window$BattlePokemon = _window$BattlePokemon[id]) !== null && _window$BattlePokemon !== void 0 && _window$BattlePokemon.num) {
        num = BattlePokemonSprites[id].num;
      } else if ((_window$BattlePokedex = window.BattlePokedex) !== null && _window$BattlePokedex !== void 0 && (_window$BattlePokedex = _window$BattlePokedex[id]) !== null && _window$BattlePokedex !== void 0 && _window$BattlePokedex.num) {
        num = BattlePokedex[id].num;
      }
      if (num < 0) num = 0;
      if (num > 1025) num = 0;
      if ((_window$BattlePokemon2 = window.BattlePokemonIconIndexes) !== null && _window$BattlePokemon2 !== void 0 && _window$BattlePokemon2[id]) {
        num = BattlePokemonIconIndexes[id];
      }
      if (isFemale) {
        if (['unfezant', 'frillish', 'jellicent', 'meowstic', 'pyroar'].includes(id)) {
          num = BattlePokemonIconIndexes[id + 'f'];
        }
      }
      if (facingLeft) {
        if (BattlePokemonIconIndexesLeft[id]) {
          num = BattlePokemonIconIndexesLeft[id];
        }
      }
      return num;
    }
  }, {
    key: "getPokemonIcon",
    value: function getPokemonIcon(pokemon, facingLeft) {
      var _pokemon, _pokemon2, _pokemon3, _pokemon4, _pokemon5;
      if (pokemon === 'pokeball') {
        return "background:transparent url(".concat(Dex.resourcePrefix, "sprites/pokemonicons-pokeball-sheet.png) no-repeat scroll -0px 4px");
      } else if (pokemon === 'pokeball-statused') {
        return "background:transparent url(".concat(Dex.resourcePrefix, "sprites/pokemonicons-pokeball-sheet.png) no-repeat scroll -40px 4px");
      } else if (pokemon === 'pokeball-fainted') {
        return "background:transparent url(".concat(Dex.resourcePrefix, "sprites/pokemonicons-pokeball-sheet.png) no-repeat scroll -80px 4px;opacity:.4;filter:contrast(0)");
      } else if (pokemon === 'pokeball-none') {
        return "background:transparent url(".concat(Dex.resourcePrefix, "sprites/pokemonicons-pokeball-sheet.png) no-repeat scroll -80px 4px");
      }
      var id = toID(pokemon);
      if (!pokemon || typeof pokemon === 'string') pokemon = null;
      // @ts-expect-error safe, but too lazy to cast
      if ((_pokemon = pokemon) !== null && _pokemon !== void 0 && _pokemon.speciesForme) id = toID(pokemon.speciesForme);
      // @ts-expect-error safe, but too lazy to cast
      if ((_pokemon2 = pokemon) !== null && _pokemon2 !== void 0 && _pokemon2.species) id = toID(pokemon.species);
      // @ts-expect-error safe, but too lazy to cast
      if ((_pokemon3 = pokemon) !== null && _pokemon3 !== void 0 && (_pokemon3 = _pokemon3.volatiles) !== null && _pokemon3 !== void 0 && _pokemon3.formechange && !pokemon.volatiles.transform) {
        // @ts-expect-error safe, but too lazy to cast
        id = toID(pokemon.volatiles.formechange[1]);
      }
      var num = this.getPokemonIconNum(id, ((_pokemon4 = pokemon) === null || _pokemon4 === void 0 ? void 0 : _pokemon4.gender) === 'F', facingLeft);
      var top = Math.floor(num / 12) * 30;
      var left = num % 12 * 40;
      var fainted = (_pokemon5 = pokemon) !== null && _pokemon5 !== void 0 && _pokemon5.fainted ? ";opacity:.3;filter:grayscale(100%) brightness(.5)" : "";
      return "background:transparent url(".concat(Dex.resourcePrefix, "sprites/pokemonicons-sheet.png?v22) no-repeat scroll -").concat(left, "px -").concat(top, "px").concat(fainted);
    }
  }, {
    key: "getTeambuilderSpriteData",
    value: function getTeambuilderSpriteData(pokemon) {
      var dex = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : Dex;
      var gen = dex.gen;
      var id = toID(pokemon.species || pokemon);
      var species = Dex.species.get(id);
      var spriteid;
      if (typeof pokemon === 'string') {
        spriteid = species.spriteid || id;
      } else {
        spriteid = pokemon.spriteid;
        if (pokemon.species && !spriteid) {
          spriteid = species.spriteid || id;
        }
      }
      if (species.exists === false) return {
        spriteDir: 'sprites/gen5',
        spriteid: '0',
        x: 10,
        y: 5,
        pixelated: true
      };
      if (Dex.afdMode) {
        return {
          spriteid: spriteid,
          spriteDir: 'sprites/afd',
          shiny: !!pokemon.shiny,
          x: 10,
          y: 5
        };
      }
      var spriteData = {
        spriteid: spriteid,
        spriteDir: 'sprites/dex',
        x: -2,
        y: -3
      };
      if (pokemon.shiny) spriteData.shiny = true;
      if (dex.modid === 'gen7letsgo') gen = 8;
      if (Dex.prefs('nopastgens')) gen = 9;
      if (Dex.prefs('bwgfx') && gen > 5) gen = 5;
      // TODO: refactor after we get home sprites for Z-A Megas and Eternal Floette
      var homeExists = (!species.isNonstandard || !['CAP', 'Custom'].includes(species.isNonstandard) || species.id === "xerneasneutral") && !["floetteeternal", "pichuspikyeared", "pikachubelle", "pikachucosplay", "pikachulibre", "pikachuphd", "pikachupopstar", "pikachurockstar"].includes(species.id) && !(species.isMega && species.gen === 9);
      if (gen >= 8 && homeExists) {
        spriteData.spriteDir = 'sprites/home-centered';
        spriteData.x = 8;
        spriteData.y = 10;
        spriteData.h = 96;
        return spriteData;
      }
      var xydexExists = !species.isNonstandard || species.isNonstandard === 'Past' || species.isNonstandard === 'CAP' || ["pikachustarter", "eeveestarter", "meltan", "melmetal", "pokestarufo", "pokestarufo2", "pokestarbrycenman", "pokestarmt", "pokestarmt2", "pokestargiant", "pokestarhumanoid", "pokestarmonster", "pokestarf00", "pokestarf002", "pokestarspirit"].includes(species.id);
      if (species.gen >= 8 && species.isNonstandard !== 'CAP') xydexExists = false;
      if (gen >= 6 && xydexExists) {
        if (species.gen >= 7) {
          spriteData.x = -6;
          spriteData.y = -7;
        } else if (id.substr(0, 6) === 'arceus') {
          spriteData.x = -2;
          spriteData.y = 7;
        } else if (id === 'garchomp') {
          spriteData.x = -2;
          spriteData.y = 2;
        } else if (id === 'garchompmega') {
          spriteData.x = -2;
          spriteData.y = 0;
        }
        return spriteData;
      }
      spriteData.spriteDir = 'sprites/gen5';
      if (gen <= 1 && species.gen <= 1) spriteData.spriteDir = 'sprites/gen1';else if (gen <= 2 && species.gen <= 2) spriteData.spriteDir = 'sprites/gen2';else if (gen <= 3 && species.gen <= 3) spriteData.spriteDir = 'sprites/gen3';else if (gen <= 4 && species.gen <= 4) spriteData.spriteDir = 'sprites/gen4';
      spriteData.pixelated = true;
      spriteData.x = 10;
      spriteData.y = 5;
      return spriteData;
    }
  }, {
    key: "getTeambuilderSprite",
    value: function getTeambuilderSprite(pokemon, dex) {
      var xOffset = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
      var yOffset = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0;
      if (!pokemon) return '';
      var data = this.getTeambuilderSpriteData(pokemon, dex);
      var shiny = data.shiny ? '-shiny' : '';
      var resize = data.h ? "background-size:".concat(data.h, "px") : '';
      return "background-image:url(".concat(Dex.resourcePrefix).concat(data.spriteDir).concat(shiny, "/").concat(data.spriteid, ".png);background-position:").concat(data.x + xOffset, "px ").concat(data.y + yOffset, "px;background-repeat:no-repeat;").concat(resize);
    }
  }, {
    key: "getItemIcon",
    value: function getItemIcon(item) {
      var _item;
      var num = 0;
      if (typeof item === 'string' && window.BattleItems) item = window.BattleItems[toID(item)];
      if ((_item = item) !== null && _item !== void 0 && _item.spritenum) num = item.spritenum;
      var top = Math.floor(num / 16) * 24;
      var left = num % 16 * 24;
      return "background:transparent url(".concat(Dex.resourcePrefix, "sprites/itemicons-sheet.png?v1) no-repeat scroll -").concat(left, "px -").concat(top, "px");
    }
  }, {
    key: "getTypeIcon",
    value: function getTypeIcon(type, b) {
      // b is just for utilichart.js
      type = this.types.get(type).name;
      if (!type) type = '???';
      var sanitizedType = type.replace(/\?/g, '%3f');
      return "<img src=\"".concat(Dex.resourcePrefix, "sprites/types/").concat(sanitizedType, ".png\" alt=\"").concat(type, "\" height=\"14\" width=\"32\" class=\"pixelated").concat(b ? ' b' : '', "\" />");
    }
  }, {
    key: "getCategoryIcon",
    value: function getCategoryIcon(category) {
      var categoryID = toID(category);
      var sanitizedCategory = '';
      switch (categoryID) {
        case 'physical':
        case 'special':
        case 'status':
          sanitizedCategory = categoryID.charAt(0).toUpperCase() + categoryID.slice(1);
          break;
        default:
          sanitizedCategory = 'undefined';
          break;
      }
      return "<img src=\"".concat(Dex.resourcePrefix, "sprites/categories/").concat(sanitizedCategory, ".png\" alt=\"").concat(sanitizedCategory, "\" height=\"14\" width=\"32\" class=\"pixelated\" />");
    }
  }, {
    key: "getPokeballs",
    value: function getPokeballs() {
      var _window;
      if (this.pokeballs) return this.pokeballs;
      this.pokeballs = [];
      (_window = window).BattleItems || (_window.BattleItems = {});
      for (var _i2 = 0, _Object$values = Object.values(BattleItems); _i2 < _Object$values.length; _i2++) {
        var data = _Object$values[_i2];
        if (!data.isPokeball) continue;
        this.pokeballs.push(data.name);
      }
      return this.pokeballs;
    }
  }]);
}())();
var ModdedDex = /*#__PURE__*/function () {
  function ModdedDex(modid) {
    var _this2 = this;
    _classCallCheck(this, ModdedDex);
    _defineProperty(this, "cache", {
      Moves: {},
      Items: {},
      Abilities: {},
      Species: {},
      Types: {}
    });
    _defineProperty(this, "pokeballs", null);
    _defineProperty(this, "moves", {
      get: function get(name) {
        var id = toID(name);
        if (window.BattleAliases && id in BattleAliases) {
          name = BattleAliases[id];
          id = toID(name);
        }
        if (_this2.cache.Moves.hasOwnProperty(id)) return _this2.cache.Moves[id];
        var data = _objectSpread({}, Dex.moves.get(name));
        for (var i = Dex.gen - 1; i >= _this2.gen; i--) {
          var table = window.BattleTeambuilderTable["gen".concat(i)];
          if (id in table.overrideMoveData) {
            Object.assign(data, table.overrideMoveData[id]);
          }
        }
        if (_this2.modid !== "gen".concat(_this2.gen)) {
          var _table = window.BattleTeambuilderTable[_this2.modid];
          if (id in _table.overrideMoveData) {
            Object.assign(data, _table.overrideMoveData[id]);
          }
        }
        if (_this2.gen <= 3 && data.category !== 'Status') {
          data.category = Dex.getGen3Category(data.type);
        }
        var move = new Move(id, name, data);
        _this2.cache.Moves[id] = move;
        return move;
      }
    });
    _defineProperty(this, "items", {
      get: function get(name) {
        var id = toID(name);
        if (window.BattleAliases && id in BattleAliases) {
          name = BattleAliases[id];
          id = toID(name);
        }
        if (_this2.cache.Items.hasOwnProperty(id)) return _this2.cache.Items[id];
        var data = _objectSpread({}, Dex.items.get(name));
        for (var i = Dex.gen - 1; i >= _this2.gen; i--) {
          var table = window.BattleTeambuilderTable["gen".concat(i)];
          if (id in table.overrideItemData) {
            Object.assign(data, table.overrideItemData[id]);
          }
        }
        if (_this2.modid !== "gen".concat(_this2.gen)) {
          var _table2 = window.BattleTeambuilderTable[_this2.modid];
          if (id in _table2.overrideItemData) {
            Object.assign(data, _table2.overrideItemData[id]);
          }
        }
        var item = new Item(id, name, data);
        _this2.cache.Items[id] = item;
        return item;
      }
    });
    _defineProperty(this, "abilities", {
      get: function get(name) {
        var id = toID(name);
        if (window.BattleAliases && id in BattleAliases) {
          name = BattleAliases[id];
          id = toID(name);
        }
        if (_this2.cache.Abilities.hasOwnProperty(id)) return _this2.cache.Abilities[id];
        var data = _objectSpread({}, Dex.abilities.get(name));
        for (var i = Dex.gen - 1; i >= _this2.gen; i--) {
          var table = window.BattleTeambuilderTable["gen".concat(i)];
          if (id in table.overrideAbilityData) {
            Object.assign(data, table.overrideAbilityData[id]);
          }
        }
        if (_this2.modid !== "gen".concat(_this2.gen)) {
          var _table3 = window.BattleTeambuilderTable[_this2.modid];
          if (id in _table3.overrideAbilityData) {
            Object.assign(data, _table3.overrideAbilityData[id]);
          }
        }
        var ability = new Ability(id, name, data);
        _this2.cache.Abilities[id] = ability;
        return ability;
      }
    });
    _defineProperty(this, "species", {
      get: function get(name) {
        var _data$evos;
        var id = toID(name);
        if (window.BattleAliases && id in BattleAliases) {
          name = BattleAliases[id];
          id = toID(name);
        }
        if (_this2.cache.Species.hasOwnProperty(id)) return _this2.cache.Species[id];
        var data = _objectSpread({}, Dex.species.get(name));
        for (var i = Dex.gen - 1; i >= _this2.gen; i--) {
          var _table4 = window.BattleTeambuilderTable["gen".concat(i)];
          if (id in _table4.overrideSpeciesData) {
            Object.assign(data, _table4.overrideSpeciesData[id]);
          }
        }
        if (_this2.modid !== "gen".concat(_this2.gen)) {
          var _table5 = window.BattleTeambuilderTable[_this2.modid];
          if (id in _table5.overrideSpeciesData) {
            Object.assign(data, _table5.overrideSpeciesData[id]);
          }
        }
        if (_this2.gen < 3 || _this2.modid === 'gen7letsgo') {
          data.abilities = {
            0: "No Ability"
          };
        }
        var table = window.BattleTeambuilderTable[_this2.modid];
        if (id in table.overrideTier) data.tier = table.overrideTier[id];
        if (!data.tier && id.endsWith('totem')) {
          data.tier = _this2.species.get(id.slice(0, -5)).tier;
        }
        if (!data.tier && data.baseSpecies && toID(data.baseSpecies) !== id) {
          data.tier = _this2.species.get(data.baseSpecies).tier;
        }
        if (data.gen > _this2.gen) data.tier = 'Illegal';
        data.nfe = data.id === 'dipplin' || !!((_data$evos = data.evos) !== null && _data$evos !== void 0 && _data$evos.some(function (evo) {
          var evoSpecies = _this2.species.get(evo);
          return !evoSpecies.isNonstandard || evoSpecies.isNonstandard === data.isNonstandard ||
          // Pokemon with Hisui evolutions
          evoSpecies.isNonstandard === "Unobtainable";
        }));
        var species = new Species(id, name, data);
        _this2.cache.Species[id] = species;
        return species;
      }
    });
    _defineProperty(this, "types", {
      namesCache: null,
      names: function names() {
        if (_this2.types.namesCache) return _this2.types.namesCache;
        var names = Dex.types.names();
        if (!names.length) return [];
        var curNames = _toConsumableArray(names);
        // if (this.gen < 9) curNames.splice(curNames.indexOf('Stellar'), 1);
        if (_this2.gen < 6) curNames.splice(curNames.indexOf('Fairy'), 1);
        if (_this2.gen < 2) curNames.splice(curNames.indexOf('Dark'), 1);
        if (_this2.gen < 2) curNames.splice(curNames.indexOf('Steel'), 1);
        _this2.types.namesCache = curNames;
        return curNames;
      },
      get: function get(name) {
        var id = toID(name);
        name = id.substr(0, 1).toUpperCase() + id.substr(1);
        if (_this2.cache.Types.hasOwnProperty(id)) return _this2.cache.Types[id];
        var data = _objectSpread({}, Dex.types.get(name));
        for (var i = 7; i >= _this2.gen; i--) {
          var table = window.BattleTeambuilderTable["gen".concat(i)];
          if (id in table.removeType) {
            data.exists = false;
            // don't bother correcting its attributes given it doesn't exist
            break;
          }
          if (id in table.overrideTypeChart) {
            data = _objectSpread(_objectSpread({}, data), table.overrideTypeChart[id]);
          }
        }
        _this2.cache.Types[id] = data;
        return data;
      }
    });
    this.modid = modid;
    var gen = parseInt(modid.charAt(3), 10);
    if (this.modid === 'champions') gen = 9;
    if (modid !== 'champions' && !modid.startsWith('gen') || !gen) throw new Error("Unsupported modid");
    this.gen = gen;
  }
  return _createClass(ModdedDex, [{
    key: "getPokeballs",
    value: function getPokeballs() {
      var _window2;
      if (this.pokeballs) return this.pokeballs;
      this.pokeballs = [];
      (_window2 = window).BattleItems || (_window2.BattleItems = {});
      for (var _i3 = 0, _Object$values2 = Object.values(BattleItems); _i3 < _Object$values2.length; _i3++) {
        var data = _Object$values2[_i3];
        if (data.gen && data.gen > this.gen) continue;
        if (!data.isPokeball) continue;
        this.pokeballs.push(data.name);
      }
      return this.pokeballs;
    }
  }]);
}();
if (typeof require === 'function') {
  // in Node
  global.Dex = Dex;
  global.toID = toID;
}