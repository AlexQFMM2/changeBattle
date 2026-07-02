"use strict";

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
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
var Teams = new (/*#__PURE__*/function () {
  function _class() {
    _classCallCheck(this, _class);
  }
  return _createClass(_class, [{
    key: "pack",
    value: function pack(team) {
      if (!team) return '';
      function getIv(ivs, s) {
        return ivs[s] === 31 || ivs[s] === undefined ? '' : ivs[s].toString();
      }
      var buf = '';
      var _iterator = _createForOfIteratorHelper(team),
        _step;
      try {
        for (_iterator.s(); !(_step = _iterator.n()).done;) {
          var set = _step.value;
          if (buf) buf += ']';

          // name
          buf += set.name || set.species;

          // species
          var speciesid = this.packName(set.species || set.name);
          buf += "|".concat(this.packName(set.name || set.species) === speciesid ? '' : speciesid);

          // item
          buf += "|".concat(this.packName(set.item));

          // ability
          buf += "|".concat(this.packName(set.ability));

          // moves
          buf += '|' + set.moves.map(this.packName).join(',');

          // nature
          buf += "|".concat(set.nature || '');

          // evs
          var evs = '|';
          if (set.evs) {
            evs = "|".concat(set.evs['hp'] || '', ",").concat(set.evs['atk'] || '', ",").concat(set.evs['def'] || '', ",") + "".concat(set.evs['spa'] || '', ",").concat(set.evs['spd'] || '', ",").concat(set.evs['spe'] || '');
          }
          buf += evs === '|,,,,,' ? '|' : evs;

          // gender
          buf += "|".concat(set.gender || '');

          // ivs
          var ivs = '|';
          if (set.ivs) {
            ivs = "|".concat(getIv(set.ivs, 'hp'), ",").concat(getIv(set.ivs, 'atk'), ",").concat(getIv(set.ivs, 'def'), ",") + "".concat(getIv(set.ivs, 'spa'), ",").concat(getIv(set.ivs, 'spd'), ",").concat(getIv(set.ivs, 'spe'));
          }
          buf += ivs === '|,,,,,' ? '|' : ivs;

          // shiny
          buf += "|".concat(set.shiny ? 'S' : '');

          // level
          buf += "|".concat(set.level && set.level !== 100 ? set.level : '');

          // happiness
          buf += "|".concat(set.happiness !== undefined && set.happiness !== 255 ? set.happiness : '');
          if (set.pokeball || set.hpType || set.gigantamax || set.dynamaxLevel !== undefined && set.dynamaxLevel !== 10 || set.teraType) {
            buf += ",".concat(set.hpType || '');
            buf += ",".concat(this.packName(set.pokeball || ''));
            buf += ",".concat(set.gigantamax ? 'G' : '');
            buf += ",".concat(set.dynamaxLevel !== undefined && set.dynamaxLevel !== 10 ? set.dynamaxLevel : '');
            buf += ",".concat(set.teraType || '');
          }
        }
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }
      return buf;
    }
    /** Very similar to toID but without the lowercase conversion */
  }, {
    key: "packName",
    value: function packName(name) {
      if (!name) return '';
      return name.replace(/[^A-Za-z0-9]+/g, '');
    }
  }, {
    key: "unpack",
    value: function unpack(buf) {
      if (!buf) return [];

      // first, detect if this has team metadata
      var endIndex = buf.indexOf(']');
      if (endIndex > 0) {
        var firstPart = buf.slice(0, endIndex);
        var pipeCount = firstPart.split('|').length - 1;
        if (pipeCount === 12 || pipeCount === 1) {
          buf = buf.slice(buf.indexOf('|') + 1);
        }
      }
      var team = [];
      var i = 0;
      var j = 0;
      var lastI = 0;
      while (true) {
        var set = {};
        team.push(set);

        // name
        j = buf.indexOf('|', i);
        var name = buf.substring(i, j);
        i = j + 1;

        // species
        j = buf.indexOf('|', i);
        var species = Dex.species.get(buf.substring(i, j) || name);
        set.species = species.name;
        if (species.baseSpecies !== name) set.name = name;
        i = j + 1;

        // item
        j = buf.indexOf('|', i);
        set.item = Dex.items.get(buf.substring(i, j)).name;
        i = j + 1;

        // ability
        j = buf.indexOf('|', i);
        var ability = Dex.abilities.get(buf.substring(i, j)).name;
        set.ability = species.abilities && ['', '0', '1', 'H', 'S'].includes(ability) ? species.abilities[ability || '0'] : ability;
        i = j + 1;

        // moves
        j = buf.indexOf('|', i);
        set.moves = buf.substring(i, j).split(',').map(function (moveid) {
          return Dex.moves.get(moveid).name;
        });
        i = j + 1;

        // nature
        j = buf.indexOf('|', i);
        var nature = buf.substring(i, j);
        set.nature = nature.charAt(0).toUpperCase() + nature.slice(1);
        if (set.nature === 'Undefined') delete set.nature;
        i = j + 1;

        // evs
        j = buf.indexOf('|', i);
        if (j !== i) {
          var evstring = buf.substring(i, j);
          if (evstring.length > 5) {
            var evs = evstring.split(',');
            set.evs = {
              hp: Number(evs[0]) || 0,
              atk: Number(evs[1]) || 0,
              def: Number(evs[2]) || 0,
              spa: Number(evs[3]) || 0,
              spd: Number(evs[4]) || 0,
              spe: Number(evs[5]) || 0
            };
          } else if (evstring === '0') {
            set.evs = {
              hp: 0,
              atk: 0,
              def: 0,
              spa: 0,
              spd: 0,
              spe: 0
            };
          }
        }
        i = j + 1;

        // gender
        j = buf.indexOf('|', i);
        if (i !== j) set.gender = buf.substring(i, j);
        i = j + 1;

        // ivs
        j = buf.indexOf('|', i);
        if (j !== i) {
          var ivs = buf.substring(i, j).split(',');
          set.ivs = {
            hp: ivs[0] === '' ? 31 : Number(ivs[0]),
            atk: ivs[1] === '' ? 31 : Number(ivs[1]),
            def: ivs[2] === '' ? 31 : Number(ivs[2]),
            spa: ivs[3] === '' ? 31 : Number(ivs[3]),
            spd: ivs[4] === '' ? 31 : Number(ivs[4]),
            spe: ivs[5] === '' ? 31 : Number(ivs[5])
          };
        }
        i = j + 1;

        // shiny
        j = buf.indexOf('|', i);
        if (i !== j) set.shiny = true;
        i = j + 1;

        // level
        j = buf.indexOf('|', i);
        if (i !== j) set.level = parseInt(buf.substring(i, j), 10);
        i = j + 1;

        // happiness
        j = buf.indexOf(']', i);
        var misc = void 0;
        if (j < 0) {
          if (i < buf.length) misc = buf.substring(i).split(',', 6);
        } else {
          if (i !== j) misc = buf.substring(i, j).split(',', 6);
        }
        if (misc) {
          set.happiness = misc[0] ? Number(misc[0]) : undefined;
          set.hpType = misc[1] || undefined;
          set.pokeball = misc[2] || undefined;
          set.gigantamax = !!misc[3] || undefined;
          set.dynamaxLevel = misc[4] ? Number(misc[4]) : undefined;
          set.teraType = misc[5] || undefined;
        }
        i = j + 1;
        if (j < 0 || i <= lastI) break;
        lastI = i;
      }
      return team;
    }
  }, {
    key: "unpackSpeciesOnly",
    value: function unpackSpeciesOnly(buf) {
      if (!buf) return [];
      var team = [];
      var i = 0;
      var lastI = 0;
      while (true) {
        var name = buf.slice(i, buf.indexOf('|', i));
        i = buf.indexOf('|', i) + 1;
        team.push(buf.slice(i, buf.indexOf('|', i)) || name);
        for (var k = 0; k < 9; k++) {
          i = buf.indexOf('|', i) + 1;
        }
        i = buf.indexOf(']', i) + 1;
        if (i < 1 || i <= lastI) break;
        lastI = i;
      }
      return team;
    }
    /**
     * (You may wish to manually add two spaces to the end of every line so
     * linebreaks are preserved in Markdown; I assume mostly for Reddit.)
     */
  }, {
    key: "exportSet",
    value: function exportSet(set) {
      var dex = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : Dex;
      var newFormat = arguments.length > 2 ? arguments[2] : undefined;
      var text = '';

      // core
      if (set.name && set.name !== set.species) {
        text += "".concat(set.name, " (").concat(set.species, ")");
      } else {
        text += "".concat(set.species);
      }
      if (set.gender === 'M') text += " (M)";
      if (set.gender === 'F') text += " (F)";
      if (!newFormat && set.item) {
        text += " @ ".concat(set.item);
      }
      text += "\n";
      if ((set.item || set.ability || dex.gen >= 2) && newFormat) {
        if (set.ability || dex.gen >= 3) text += "[".concat(set.ability || '(select ability)', "]");
        if (set.item || dex.gen >= 2) text += " @ ".concat(set.item || "(no item)");
        text += "\n";
      } else if (set.ability && set.ability !== 'No Ability') {
        text += "Ability: ".concat(set.ability, "\n");
      }
      if (newFormat) {
        if (set.moves) {
          var _iterator2 = _createForOfIteratorHelper(set.moves),
            _step2;
          try {
            for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
              var move = _step2.value;
              if (move.startsWith('Hidden Power ')) {
                var hpType = move.slice(13);
                move = move.slice(0, 13);
                move = "".concat(move, "[").concat(hpType, "]");
              }
              text += "- ".concat(move || '', "\n");
            }
          } catch (err) {
            _iterator2.e(err);
          } finally {
            _iterator2.f();
          }
        }
        for (var i = ((_set$moves = set.moves) === null || _set$moves === void 0 ? void 0 : _set$moves.length) || 0; i < 4; i++) {
          var _set$moves;
          text += "- \n";
        }
      }

      // stats
      var first = true;
      if (set.evs || set.nature) {
        var nature = newFormat ? BattleNatures[set.nature] : null;
        var _iterator3 = _createForOfIteratorHelper(Dex.statNames),
          _step3;
        try {
          for (_iterator3.s(); !(_step3 = _iterator3.n()).done;) {
            var _set$evs;
            var stat = _step3.value;
            var plusMinus = !newFormat ? '' : (nature === null || nature === void 0 ? void 0 : nature.plus) === stat ? '+' : (nature === null || nature === void 0 ? void 0 : nature.minus) === stat ? '-' : '';
            var ev = ((_set$evs = set.evs) === null || _set$evs === void 0 ? void 0 : _set$evs[stat]) || '';
            if (ev === '' && !plusMinus) continue;
            text += first ? "EVs: " : " / ";
            first = false;
            text += "".concat(ev).concat(plusMinus, " ").concat(BattleStatNames[stat]);
          }
        } catch (err) {
          _iterator3.e(err);
        } finally {
          _iterator3.f();
        }
      }
      if (!first) {
        if (set.nature && newFormat) text += " (".concat(set.nature, ")");
        text += "\n";
      }
      if (set.nature && !newFormat) {
        text += "".concat(set.nature, " Nature\n");
      } else if (['Hardy', 'Docile', 'Serious', 'Bashful', 'Quirky'].includes(set.nature)) {
        text += "".concat(set.nature, " Nature\n");
      }
      first = true;
      if (set.ivs) {
        var _iterator4 = _createForOfIteratorHelper(Dex.statNames),
          _step4;
        try {
          for (_iterator4.s(); !(_step4 = _iterator4.n()).done;) {
            var _stat = _step4.value;
            if (set.ivs[_stat] === undefined || isNaN(set.ivs[_stat]) || set.ivs[_stat] === 31) continue;
            if (first) {
              text += "IVs: ";
              first = false;
            } else {
              text += " / ";
            }
            text += "".concat(set.ivs[_stat], " ").concat(BattleStatNames[_stat]);
          }
        } catch (err) {
          _iterator4.e(err);
        } finally {
          _iterator4.f();
        }
      }
      if (!first) {
        text += "\n";
      }

      // details
      if (set.level && set.level !== 100) {
        text += "Level: ".concat(set.level, "\n");
      }
      if (set.shiny) {
        text += !newFormat ? "Shiny: Yes\n" : "Shiny\n";
      }
      if (typeof set.happiness === 'number' && set.happiness !== 255 && !isNaN(set.happiness)) {
        text += "Happiness: ".concat(set.happiness, "\n");
      }
      if (typeof set.dynamaxLevel === 'number' && set.dynamaxLevel !== 255 && !isNaN(set.dynamaxLevel)) {
        text += "Dynamax Level: ".concat(set.dynamaxLevel, "\n");
      }
      if (set.gigantamax) {
        text += !newFormat ? "Gigantamax: Yes\n" : "Gigantamax\n";
      }
      if (set.teraType) {
        text += "Tera Type: ".concat(set.teraType, "\n");
      }
      if (!newFormat) {
        var _iterator5 = _createForOfIteratorHelper(set.moves || []),
          _step5;
        try {
          for (_iterator5.s(); !(_step5 = _iterator5.n()).done;) {
            var _move = _step5.value;
            if (_move.startsWith('Hidden Power ')) {
              var _hpType = _move.slice(13);
              _move = _move.slice(0, 13);
              _move = !newFormat ? "".concat(_move, "[").concat(_hpType, "]") : "".concat(_move).concat(_hpType);
            }
            text += "- ".concat(_move, "\n");
          }
        } catch (err) {
          _iterator5.e(err);
        } finally {
          _iterator5.f();
        }
        for (var _i = ((_set$moves2 = set.moves) === null || _set$moves2 === void 0 ? void 0 : _set$moves2.length) || 0; _i < 4; _i++) {
          var _set$moves2;
          text += "- \n";
        }
      }
      text += "\n";
      return text;
    }
    // TODO: finish this impl
    // getFullSet(set: Teams.PokemonSet, dex: ModdedDex): Teams.FullPokemonSet {
    // 	//
    // }
  }, {
    key: "export",
    value: function _export(sets, dex, newFormat) {
      var text = '';
      var _iterator6 = _createForOfIteratorHelper(sets),
        _step6;
      try {
        for (_iterator6.s(); !(_step6 = _iterator6.n()).done;) {
          var set = _step6.value;
          // core
          text += Teams.exportSet(set, dex, newFormat);
        }
      } catch (err) {
        _iterator6.e(err);
      } finally {
        _iterator6.f();
      }
      return text;
    }
  }, {
    key: "parseExportedTeamLine",
    value: function parseExportedTeamLine(line, isFirstLine, set) {
      if (isFirstLine || line.startsWith('[')) {
        var _item;
        var item;
        var _line$split = line.split('@');
        var _line$split2 = _slicedToArray(_line$split, 2);
        line = _line$split2[0];
        item = _line$split2[1];
        line = line.trim();
        item = (_item = item) === null || _item === void 0 ? void 0 : _item.trim();
        if (item) {
          set.item = item;
          if (toID(set.item) === 'noitem') set.item = '';
        }
        if (line.endsWith(' (M)')) {
          set.gender = 'M';
          line = line.slice(0, -4);
        }
        if (line.endsWith(' (F)')) {
          set.gender = 'F';
          line = line.slice(0, -4);
        }
        if (line.startsWith('[') && line.endsWith(']')) {
          // the ending `]` is necessary to establish this as ability
          // (rather than nickname starting with `[`)
          set.ability = line.slice(1, -1);
          if (toID(set.ability) === 'selectability') {
            set.ability = '';
          }
        } else if (line) {
          var parenIndex = line.lastIndexOf(' (');
          if (line.endsWith(')') && parenIndex !== -1) {
            set.species = Dex.species.get(line.slice(parenIndex + 2, -1)).name;
            set.name = line.slice(0, parenIndex);
          } else {
            set.species = Dex.species.get(line).name;
            set.name = '';
          }
        }
      } else if (line.startsWith('Trait: ')) {
        set.ability = line.slice(7);
      } else if (line.startsWith('Ability: ')) {
        set.ability = line.slice(9);
      } else if (line.startsWith('Item: ')) {
        set.item = line.slice(6);
      } else if (line.startsWith('Nickname: ')) {
        set.name = line.slice(10);
      } else if (line.startsWith('Species: ')) {
        set.species = line.slice(9);
      } else if (line === 'Shiny: Yes' || line === 'Shiny') {
        set.shiny = true;
      } else if (line.startsWith('Level: ')) {
        set.level = +line.slice(7);
      } else if (line.startsWith('Happiness: ')) {
        set.happiness = +line.slice(11);
      } else if (line.startsWith('Pokeball: ')) {
        set.pokeball = line.slice(10);
      } else if (line.startsWith('Hidden Power: ')) {
        set.hpType = line.slice(14);
      } else if (line.startsWith('Dynamax Level: ')) {
        set.dynamaxLevel = +line.slice(15);
      } else if (line === 'Gigantamax: Yes' || line === 'Gigantamax') {
        set.gigantamax = true;
      } else if (line.startsWith('Tera Type: ')) {
        set.teraType = line.slice(11);
      } else if (line.startsWith('EVs: ')) {
        var evLines = line.slice(5).split('(')[0].split('/');
        set.evs = {
          hp: 0,
          atk: 0,
          def: 0,
          spa: 0,
          spd: 0,
          spe: 0
        };
        var plus = '',
          minus = '';
        var _iterator7 = _createForOfIteratorHelper(evLines),
          _step7;
        try {
          for (_iterator7.s(); !(_step7 = _iterator7.n()).done;) {
            var evLine = _step7.value;
            evLine = evLine.trim();
            var spaceIndex = evLine.indexOf(' ');
            if (spaceIndex === -1) continue;
            var statid = BattleStatIDs[evLine.slice(spaceIndex + 1)];
            if (!statid) continue;
            if (evLine.charAt(spaceIndex - 1) === '+') plus = statid;
            if (evLine.charAt(spaceIndex - 1) === '-') minus = statid;
            set.evs[statid] = parseInt(evLine.slice(0, spaceIndex), 10) || 0;
          }
        } catch (err) {
          _iterator7.e(err);
        } finally {
          _iterator7.f();
        }
        var nature = this.getNatureFromPlusMinus(plus, minus);
        if (nature) set.nature = nature;
      } else if (line.startsWith('IVs: ')) {
        var ivLines = line.slice(5).split(' / ');
        set.ivs = {
          hp: 31,
          atk: 31,
          def: 31,
          spa: 31,
          spd: 31,
          spe: 31
        };
        var _iterator8 = _createForOfIteratorHelper(ivLines),
          _step8;
        try {
          for (_iterator8.s(); !(_step8 = _iterator8.n()).done;) {
            var ivLine = _step8.value;
            ivLine = ivLine.trim();
            var _spaceIndex = ivLine.indexOf(' ');
            if (_spaceIndex === -1) continue;
            var _statid = BattleStatIDs[ivLine.slice(_spaceIndex + 1)];
            if (!_statid) continue;
            var statval = parseInt(ivLine.slice(0, _spaceIndex), 10);
            if (isNaN(statval)) statval = 31;
            set.ivs[_statid] = statval;
          }
        } catch (err) {
          _iterator8.e(err);
        } finally {
          _iterator8.f();
        }
      } else if (/^[A-Za-z]+ (N|n)ature/.exec(line)) {
        var natureIndex = line.indexOf(' Nature');
        if (natureIndex === -1) natureIndex = line.indexOf(' nature');
        if (natureIndex === -1) return;
        line = line.slice(0, natureIndex);
        if (line !== 'undefined') set.nature = line;
      } else if (line.startsWith('-') || line.startsWith('~') || line.startsWith('Move:')) {
        if (line.startsWith('Move:')) line = line.slice(4);
        line = line.slice(line.charAt(1) === ' ' ? 2 : 1);
        if (line.startsWith('Hidden Power [')) {
          var hpType = line.slice(14, line.indexOf(']'));
          if (hpType.includes(']') || hpType.includes('[')) hpType = '';
          line = 'Hidden Power ' + hpType;
          set.hpType = hpType;
        }
        if (line === 'Frustration' && set.happiness === undefined) {
          set.happiness = 0;
        }
        set.moves.push(line);
      }
    }
  }, {
    key: "getNatureFromPlusMinus",
    value: function getNatureFromPlusMinus(plus, minus) {
      if (!plus || !minus) return null;
      for (var i in BattleNatures) {
        if (BattleNatures[i].plus === plus && BattleNatures[i].minus === minus) {
          return i;
        }
      }
      return null;
    }
  }, {
    key: "import",
    value: function _import(buffer) {
      var lines = buffer.split("\n");
      var sets = [];
      var curSet = null;
      while (lines.length && !lines[0]) lines.shift();
      while (lines.length && !lines[lines.length - 1]) lines.pop();
      if (lines.length === 1 && lines[0].includes('|')) {
        return Teams.unpack(lines[0]);
      }
      var _iterator9 = _createForOfIteratorHelper(lines),
        _step9;
      try {
        for (_iterator9.s(); !(_step9 = _iterator9.n()).done;) {
          var line = _step9.value;
          line = line.trim();
          if (line === '' || line === '---') {
            curSet = null;
          } else if (line.startsWith('===')) {
            // team backup format; ignore
          } else if (line.includes('|')) {
            // packed format
            return Teams.unpack(line);
          } else if (!curSet) {
            curSet = {
              name: '',
              species: '',
              gender: '',
              moves: []
            };
            sets.push(curSet);
            this.parseExportedTeamLine(line, true, curSet);
          } else {
            this.parseExportedTeamLine(line, false, curSet);
          }
        }
      } catch (err) {
        _iterator9.e(err);
      } finally {
        _iterator9.f();
      }
      return sets;
    }
  }]);
}())();