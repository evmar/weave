(() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target, mod));

  // ../node_modules/webtreemap/build/tree.js
  var require_tree = __commonJS({
    "../node_modules/webtreemap/build/tree.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      function treeify(data) {
        var tree = { size: 0 };
        for (var _i = 0, data_1 = data; _i < data_1.length; _i++) {
          var _a = data_1[_i], path2 = _a[0], size = _a[1];
          var parts = path2.replace(/\/$/, "").split("/");
          var t3 = tree;
          var _loop_1 = function() {
            var id2 = parts.shift();
            if (!t3.children)
              t3.children = [];
            var child = t3.children.find(function(c3) {
              return c3.id === id2;
            });
            if (!child) {
              child = { id: id2, size: 0 };
              t3.children.push(child);
            }
            if (parts.length === 0) {
              if (child.size !== 0) {
                throw new Error("duplicate path " + path2 + " " + child.size);
              }
              child.size = size;
            }
            t3 = child;
          };
          while (parts.length > 0) {
            _loop_1();
          }
        }
        return tree;
      }
      exports.treeify = treeify;
      function flatten(n2, join) {
        if (join === void 0) {
          join = function(parent, child2) {
            return parent + "/" + child2;
          };
        }
        if (n2.children) {
          for (var _i = 0, _a = n2.children; _i < _a.length; _i++) {
            var c3 = _a[_i];
            flatten(c3, join);
          }
          if (n2.children.length === 1) {
            var child = n2.children[0];
            n2.id += "/" + child.id;
            n2.children = child.children;
          }
        }
      }
      exports.flatten = flatten;
      function rollup(n2) {
        if (!n2.children)
          return;
        var total = 0;
        for (var _i = 0, _a = n2.children; _i < _a.length; _i++) {
          var c3 = _a[_i];
          rollup(c3);
          total += c3.size;
        }
        if (total > n2.size)
          n2.size = total;
      }
      exports.rollup = rollup;
      function sort(n2) {
        if (!n2.children)
          return;
        for (var _i = 0, _a = n2.children; _i < _a.length; _i++) {
          var c3 = _a[_i];
          sort(c3);
        }
        n2.children.sort(function(a3, b3) {
          return b3.size - a3.size;
        });
      }
      exports.sort = sort;
    }
  });

  // ../node_modules/webtreemap/build/treemap.js
  var require_treemap = __commonJS({
    "../node_modules/webtreemap/build/treemap.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      var CSS_PREFIX = "webtreemap-";
      var NODE_CSS_CLASS = CSS_PREFIX + "node";
      var DEFAULT_CSS = "\n.webtreemap-node {\n  cursor: pointer;\n  position: absolute;\n  border: solid 1px #666;\n  box-sizing: border-box;\n  overflow: hidden;\n  background: white;\n  transition: left .15s, top .15s, width .15s, height .15s;\n}\n\n.webtreemap-node:hover {\n  background: #ddd;\n}\n\n.webtreemap-caption {\n  font-size: 10px;\n  text-align: center;\n}\n";
      function addCSS(parent) {
        var style = document.createElement("style");
        style.innerText = DEFAULT_CSS;
        parent.appendChild(style);
      }
      function isDOMNode(e3) {
        return e3.classList.contains(NODE_CSS_CLASS);
      }
      exports.isDOMNode = isDOMNode;
      function getNodeIndex(target) {
        var index = 0;
        var node = target;
        while (node = node.previousElementSibling) {
          if (isDOMNode(node))
            index++;
        }
        return index;
      }
      function getAddress(el) {
        var address = [];
        var n2 = el;
        while (n2 && isDOMNode(n2)) {
          address.unshift(getNodeIndex(n2));
          n2 = n2.parentElement;
        }
        address.shift();
        return address;
      }
      exports.getAddress = getAddress;
      function px(x3) {
        return Math.round(x3) + "px";
      }
      function defaultOptions(options) {
        var opts = {
          padding: options.padding || [14, 3, 3, 3],
          caption: options.caption || function(node) {
            return node.id || "";
          },
          showNode: options.showNode || function(node, width, height) {
            return width > 20 && height >= opts.padding[0];
          },
          showChildren: options.showChildren || function(node, width, height) {
            return width > 40 && height > 40;
          }
        };
        return opts;
      }
      var TreeMap = function() {
        function TreeMap2(node, options) {
          this.node = node;
          this.options = defaultOptions(options);
        }
        TreeMap2.prototype.ensureDOM = function(node) {
          if (node.dom)
            return node.dom;
          var dom = document.createElement("div");
          dom.className = NODE_CSS_CLASS;
          if (this.options.caption) {
            var caption = document.createElement("div");
            caption.className = CSS_PREFIX + "caption";
            caption.innerText = this.options.caption(node);
            dom.appendChild(caption);
          }
          node.dom = dom;
          return dom;
        };
        TreeMap2.prototype.selectSpan = function(children2, space, start2) {
          var smin = children2[start2].size;
          var smax = smin;
          var sum2 = 0;
          var lastScore = 0;
          var end = start2;
          for (; end < children2.length; end++) {
            var size = children2[end].size;
            if (size < smin)
              smin = size;
            if (size > smax)
              smax = size;
            var nextSum = sum2 + size;
            var score = Math.max(smax * space * space / (nextSum * nextSum), nextSum * nextSum / (smin * space * space));
            if (lastScore && score > lastScore) {
              break;
            }
            lastScore = score;
            sum2 = nextSum;
          }
          return { end, sum: sum2 };
        };
        TreeMap2.prototype.layoutChildren = function(node, level, width, height) {
          var total = node.size;
          var children2 = node.children;
          if (!children2)
            return;
          var x1 = -1, y1 = -1, x22 = width - 1, y22 = height - 1;
          var spacing = 0;
          var padding = this.options.padding;
          y1 += padding[0];
          if (padding[1]) {
            x22 -= padding[1] + 1;
          }
          y22 -= padding[2];
          x1 += padding[3];
          var i3 = 0;
          if (this.options.showChildren(node, x22 - x1, y22 - y1)) {
            var scale = Math.sqrt(total / ((x22 - x1) * (y22 - y1)));
            var x3 = x1, y3 = y1;
            children:
              for (var start2 = 0; start2 < children2.length; ) {
                x3 = x1;
                var space = scale * (x22 - x1);
                var _a = this.selectSpan(children2, space, start2), end = _a.end, sum2 = _a.sum;
                if (sum2 / total < 0.1)
                  break;
                var height_1 = sum2 / space;
                var heightPx = Math.round(height_1 / scale) + 1;
                for (i3 = start2; i3 < end; i3++) {
                  var child = children2[i3];
                  var size = child.size;
                  var width_1 = size / height_1;
                  var widthPx = Math.round(width_1 / scale) + 1;
                  if (!this.options.showNode(child, widthPx - spacing, heightPx - spacing)) {
                    break children;
                  }
                  var needsAppend = child.dom == null;
                  var dom = this.ensureDOM(child);
                  var style = dom.style;
                  style.left = px(x3);
                  style.width = px(widthPx - spacing);
                  style.top = px(y3);
                  style.height = px(heightPx - spacing);
                  if (needsAppend) {
                    node.dom.appendChild(dom);
                  }
                  this.layoutChildren(child, level + 1, widthPx, heightPx);
                  x3 += widthPx - 1;
                }
                y3 += heightPx - 1;
                start2 = end;
              }
          }
          for (; i3 < children2.length; i3++) {
            if (!children2[i3].dom)
              break;
            children2[i3].dom.parentNode.removeChild(children2[i3].dom);
            children2[i3].dom = void 0;
          }
        };
        TreeMap2.prototype.render = function(container) {
          var _this = this;
          addCSS(container);
          var dom = this.ensureDOM(this.node);
          var width = container.offsetWidth;
          var height = container.offsetHeight;
          dom.onclick = function(e3) {
            var node = e3.target;
            while (!isDOMNode(node)) {
              node = node.parentElement;
              if (!node)
                return;
            }
            var address = getAddress(node);
            _this.zoom(address);
          };
          dom.style.width = width + "px";
          dom.style.height = height + "px";
          container.appendChild(dom);
          this.layoutChildren(this.node, 0, width, height);
        };
        TreeMap2.prototype.zoom = function(address) {
          var node = this.node;
          var _a = this.options.padding, padTop = _a[0], padRight = _a[1], padBottom = _a[2], padLeft = _a[3];
          var width = node.dom.offsetWidth;
          var height = node.dom.offsetHeight;
          for (var _i = 0, address_1 = address; _i < address_1.length; _i++) {
            var index = address_1[_i];
            width -= padLeft + padRight;
            height -= padTop + padBottom;
            if (!node.children)
              throw new Error("bad address");
            for (var _b = 0, _c = node.children; _b < _c.length; _b++) {
              var c3 = _c[_b];
              if (c3.dom)
                c3.dom.style.zIndex = "0";
            }
            node = node.children[index];
            var style = node.dom.style;
            style.zIndex = "1";
            style.left = px(padLeft - 1);
            style.width = px(width);
            style.top = px(padTop - 1);
            style.height = px(height);
          }
          this.layoutChildren(node, 0, width, height);
        };
        return TreeMap2;
      }();
      exports.TreeMap = TreeMap;
      function render2(container, node, options) {
        new TreeMap(node, options).render(container);
      }
      exports.render = render2;
    }
  });

  // ../node_modules/webtreemap/build/webtreemap.js
  var require_webtreemap = __commonJS({
    "../node_modules/webtreemap/build/webtreemap.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      var tree_1 = require_tree();
      exports.flatten = tree_1.flatten;
      exports.rollup = tree_1.rollup;
      exports.sort = tree_1.sort;
      exports.treeify = tree_1.treeify;
      var treemap_1 = require_treemap();
      exports.render = treemap_1.render;
    }
  });

  // ../node_modules/preact/dist/preact.module.js
  var n;
  var l;
  var u;
  var i;
  var t;
  var o;
  var r;
  var f;
  var e = {};
  var c = [];
  var s = /acit|ex(?:s|g|n|p|$)|rph|grid|ows|mnc|ntw|ine[ch]|zoo|^ord|itera/i;
  function a(n2, l3) {
    for (var u3 in l3)
      n2[u3] = l3[u3];
    return n2;
  }
  function h(n2) {
    var l3 = n2.parentNode;
    l3 && l3.removeChild(n2);
  }
  function v(l3, u3, i3) {
    var t3, o3, r3, f3 = {};
    for (r3 in u3)
      r3 == "key" ? t3 = u3[r3] : r3 == "ref" ? o3 = u3[r3] : f3[r3] = u3[r3];
    if (arguments.length > 2 && (f3.children = arguments.length > 3 ? n.call(arguments, 2) : i3), typeof l3 == "function" && l3.defaultProps != null)
      for (r3 in l3.defaultProps)
        f3[r3] === void 0 && (f3[r3] = l3.defaultProps[r3]);
    return y(l3, f3, t3, o3, null);
  }
  function y(n2, i3, t3, o3, r3) {
    var f3 = { type: n2, props: i3, key: t3, ref: o3, __k: null, __: null, __b: 0, __e: null, __d: void 0, __c: null, __h: null, constructor: void 0, __v: r3 == null ? ++u : r3 };
    return r3 == null && l.vnode != null && l.vnode(f3), f3;
  }
  function p() {
    return { current: null };
  }
  function d(n2) {
    return n2.children;
  }
  function _(n2, l3) {
    this.props = n2, this.context = l3;
  }
  function k(n2, l3) {
    if (l3 == null)
      return n2.__ ? k(n2.__, n2.__.__k.indexOf(n2) + 1) : null;
    for (var u3; l3 < n2.__k.length; l3++)
      if ((u3 = n2.__k[l3]) != null && u3.__e != null)
        return u3.__e;
    return typeof n2.type == "function" ? k(n2) : null;
  }
  function b(n2) {
    var l3, u3;
    if ((n2 = n2.__) != null && n2.__c != null) {
      for (n2.__e = n2.__c.base = null, l3 = 0; l3 < n2.__k.length; l3++)
        if ((u3 = n2.__k[l3]) != null && u3.__e != null) {
          n2.__e = n2.__c.base = u3.__e;
          break;
        }
      return b(n2);
    }
  }
  function m(n2) {
    (!n2.__d && (n2.__d = true) && t.push(n2) && !g.__r++ || r !== l.debounceRendering) && ((r = l.debounceRendering) || o)(g);
  }
  function g() {
    for (var n2; g.__r = t.length; )
      n2 = t.sort(function(n3, l3) {
        return n3.__v.__b - l3.__v.__b;
      }), t = [], n2.some(function(n3) {
        var l3, u3, i3, t3, o3, r3;
        n3.__d && (o3 = (t3 = (l3 = n3).__v).__e, (r3 = l3.__P) && (u3 = [], (i3 = a({}, t3)).__v = t3.__v + 1, j(r3, t3, i3, l3.__n, r3.ownerSVGElement !== void 0, t3.__h != null ? [o3] : null, u3, o3 == null ? k(t3) : o3, t3.__h), z(u3, t3), t3.__e != o3 && b(t3)));
      });
  }
  function w(n2, l3, u3, i3, t3, o3, r3, f3, s3, a3) {
    var h3, v3, p3, _3, b3, m3, g3, w4 = i3 && i3.__k || c, A4 = w4.length;
    for (u3.__k = [], h3 = 0; h3 < l3.length; h3++)
      if ((_3 = u3.__k[h3] = (_3 = l3[h3]) == null || typeof _3 == "boolean" ? null : typeof _3 == "string" || typeof _3 == "number" || typeof _3 == "bigint" ? y(null, _3, null, null, _3) : Array.isArray(_3) ? y(d, { children: _3 }, null, null, null) : _3.__b > 0 ? y(_3.type, _3.props, _3.key, null, _3.__v) : _3) != null) {
        if (_3.__ = u3, _3.__b = u3.__b + 1, (p3 = w4[h3]) === null || p3 && _3.key == p3.key && _3.type === p3.type)
          w4[h3] = void 0;
        else
          for (v3 = 0; v3 < A4; v3++) {
            if ((p3 = w4[v3]) && _3.key == p3.key && _3.type === p3.type) {
              w4[v3] = void 0;
              break;
            }
            p3 = null;
          }
        j(n2, _3, p3 = p3 || e, t3, o3, r3, f3, s3, a3), b3 = _3.__e, (v3 = _3.ref) && p3.ref != v3 && (g3 || (g3 = []), p3.ref && g3.push(p3.ref, null, _3), g3.push(v3, _3.__c || b3, _3)), b3 != null ? (m3 == null && (m3 = b3), typeof _3.type == "function" && _3.__k === p3.__k ? _3.__d = s3 = x(_3, s3, n2) : s3 = P(n2, _3, p3, w4, b3, s3), typeof u3.type == "function" && (u3.__d = s3)) : s3 && p3.__e == s3 && s3.parentNode != n2 && (s3 = k(p3));
      }
    for (u3.__e = m3, h3 = A4; h3--; )
      w4[h3] != null && (typeof u3.type == "function" && w4[h3].__e != null && w4[h3].__e == u3.__d && (u3.__d = k(i3, h3 + 1)), N(w4[h3], w4[h3]));
    if (g3)
      for (h3 = 0; h3 < g3.length; h3++)
        M(g3[h3], g3[++h3], g3[++h3]);
  }
  function x(n2, l3, u3) {
    for (var i3, t3 = n2.__k, o3 = 0; t3 && o3 < t3.length; o3++)
      (i3 = t3[o3]) && (i3.__ = n2, l3 = typeof i3.type == "function" ? x(i3, l3, u3) : P(u3, i3, i3, t3, i3.__e, l3));
    return l3;
  }
  function A(n2, l3) {
    return l3 = l3 || [], n2 == null || typeof n2 == "boolean" || (Array.isArray(n2) ? n2.some(function(n3) {
      A(n3, l3);
    }) : l3.push(n2)), l3;
  }
  function P(n2, l3, u3, i3, t3, o3) {
    var r3, f3, e3;
    if (l3.__d !== void 0)
      r3 = l3.__d, l3.__d = void 0;
    else if (u3 == null || t3 != o3 || t3.parentNode == null)
      n:
        if (o3 == null || o3.parentNode !== n2)
          n2.appendChild(t3), r3 = null;
        else {
          for (f3 = o3, e3 = 0; (f3 = f3.nextSibling) && e3 < i3.length; e3 += 2)
            if (f3 == t3)
              break n;
          n2.insertBefore(t3, o3), r3 = o3;
        }
    return r3 !== void 0 ? r3 : t3.nextSibling;
  }
  function C(n2, l3, u3, i3, t3) {
    var o3;
    for (o3 in u3)
      o3 === "children" || o3 === "key" || o3 in l3 || H(n2, o3, null, u3[o3], i3);
    for (o3 in l3)
      t3 && typeof l3[o3] != "function" || o3 === "children" || o3 === "key" || o3 === "value" || o3 === "checked" || u3[o3] === l3[o3] || H(n2, o3, l3[o3], u3[o3], i3);
  }
  function $(n2, l3, u3) {
    l3[0] === "-" ? n2.setProperty(l3, u3) : n2[l3] = u3 == null ? "" : typeof u3 != "number" || s.test(l3) ? u3 : u3 + "px";
  }
  function H(n2, l3, u3, i3, t3) {
    var o3;
    n:
      if (l3 === "style")
        if (typeof u3 == "string")
          n2.style.cssText = u3;
        else {
          if (typeof i3 == "string" && (n2.style.cssText = i3 = ""), i3)
            for (l3 in i3)
              u3 && l3 in u3 || $(n2.style, l3, "");
          if (u3)
            for (l3 in u3)
              i3 && u3[l3] === i3[l3] || $(n2.style, l3, u3[l3]);
        }
      else if (l3[0] === "o" && l3[1] === "n")
        o3 = l3 !== (l3 = l3.replace(/Capture$/, "")), l3 = l3.toLowerCase() in n2 ? l3.toLowerCase().slice(2) : l3.slice(2), n2.l || (n2.l = {}), n2.l[l3 + o3] = u3, u3 ? i3 || n2.addEventListener(l3, o3 ? T : I, o3) : n2.removeEventListener(l3, o3 ? T : I, o3);
      else if (l3 !== "dangerouslySetInnerHTML") {
        if (t3)
          l3 = l3.replace(/xlink(H|:h)/, "h").replace(/sName$/, "s");
        else if (l3 !== "href" && l3 !== "list" && l3 !== "form" && l3 !== "tabIndex" && l3 !== "download" && l3 in n2)
          try {
            n2[l3] = u3 == null ? "" : u3;
            break n;
          } catch (n3) {
          }
        typeof u3 == "function" || (u3 != null && (u3 !== false || l3[0] === "a" && l3[1] === "r") ? n2.setAttribute(l3, u3) : n2.removeAttribute(l3));
      }
  }
  function I(n2) {
    this.l[n2.type + false](l.event ? l.event(n2) : n2);
  }
  function T(n2) {
    this.l[n2.type + true](l.event ? l.event(n2) : n2);
  }
  function j(n2, u3, i3, t3, o3, r3, f3, e3, c3) {
    var s3, h3, v3, y3, p3, k3, b3, m3, g3, x3, A4, P3 = u3.type;
    if (u3.constructor !== void 0)
      return null;
    i3.__h != null && (c3 = i3.__h, e3 = u3.__e = i3.__e, u3.__h = null, r3 = [e3]), (s3 = l.__b) && s3(u3);
    try {
      n:
        if (typeof P3 == "function") {
          if (m3 = u3.props, g3 = (s3 = P3.contextType) && t3[s3.__c], x3 = s3 ? g3 ? g3.props.value : s3.__ : t3, i3.__c ? b3 = (h3 = u3.__c = i3.__c).__ = h3.__E : ("prototype" in P3 && P3.prototype.render ? u3.__c = h3 = new P3(m3, x3) : (u3.__c = h3 = new _(m3, x3), h3.constructor = P3, h3.render = O), g3 && g3.sub(h3), h3.props = m3, h3.state || (h3.state = {}), h3.context = x3, h3.__n = t3, v3 = h3.__d = true, h3.__h = []), h3.__s == null && (h3.__s = h3.state), P3.getDerivedStateFromProps != null && (h3.__s == h3.state && (h3.__s = a({}, h3.__s)), a(h3.__s, P3.getDerivedStateFromProps(m3, h3.__s))), y3 = h3.props, p3 = h3.state, v3)
            P3.getDerivedStateFromProps == null && h3.componentWillMount != null && h3.componentWillMount(), h3.componentDidMount != null && h3.__h.push(h3.componentDidMount);
          else {
            if (P3.getDerivedStateFromProps == null && m3 !== y3 && h3.componentWillReceiveProps != null && h3.componentWillReceiveProps(m3, x3), !h3.__e && h3.shouldComponentUpdate != null && h3.shouldComponentUpdate(m3, h3.__s, x3) === false || u3.__v === i3.__v) {
              h3.props = m3, h3.state = h3.__s, u3.__v !== i3.__v && (h3.__d = false), h3.__v = u3, u3.__e = i3.__e, u3.__k = i3.__k, u3.__k.forEach(function(n3) {
                n3 && (n3.__ = u3);
              }), h3.__h.length && f3.push(h3);
              break n;
            }
            h3.componentWillUpdate != null && h3.componentWillUpdate(m3, h3.__s, x3), h3.componentDidUpdate != null && h3.__h.push(function() {
              h3.componentDidUpdate(y3, p3, k3);
            });
          }
          h3.context = x3, h3.props = m3, h3.state = h3.__s, (s3 = l.__r) && s3(u3), h3.__d = false, h3.__v = u3, h3.__P = n2, s3 = h3.render(h3.props, h3.state, h3.context), h3.state = h3.__s, h3.getChildContext != null && (t3 = a(a({}, t3), h3.getChildContext())), v3 || h3.getSnapshotBeforeUpdate == null || (k3 = h3.getSnapshotBeforeUpdate(y3, p3)), A4 = s3 != null && s3.type === d && s3.key == null ? s3.props.children : s3, w(n2, Array.isArray(A4) ? A4 : [A4], u3, i3, t3, o3, r3, f3, e3, c3), h3.base = u3.__e, u3.__h = null, h3.__h.length && f3.push(h3), b3 && (h3.__E = h3.__ = null), h3.__e = false;
        } else
          r3 == null && u3.__v === i3.__v ? (u3.__k = i3.__k, u3.__e = i3.__e) : u3.__e = L(i3.__e, u3, i3, t3, o3, r3, f3, c3);
      (s3 = l.diffed) && s3(u3);
    } catch (n3) {
      u3.__v = null, (c3 || r3 != null) && (u3.__e = e3, u3.__h = !!c3, r3[r3.indexOf(e3)] = null), l.__e(n3, u3, i3);
    }
  }
  function z(n2, u3) {
    l.__c && l.__c(u3, n2), n2.some(function(u4) {
      try {
        n2 = u4.__h, u4.__h = [], n2.some(function(n3) {
          n3.call(u4);
        });
      } catch (n3) {
        l.__e(n3, u4.__v);
      }
    });
  }
  function L(l3, u3, i3, t3, o3, r3, f3, c3) {
    var s3, a3, v3, y3 = i3.props, p3 = u3.props, d3 = u3.type, _3 = 0;
    if (d3 === "svg" && (o3 = true), r3 != null) {
      for (; _3 < r3.length; _3++)
        if ((s3 = r3[_3]) && "setAttribute" in s3 == !!d3 && (d3 ? s3.localName === d3 : s3.nodeType === 3)) {
          l3 = s3, r3[_3] = null;
          break;
        }
    }
    if (l3 == null) {
      if (d3 === null)
        return document.createTextNode(p3);
      l3 = o3 ? document.createElementNS("http://www.w3.org/2000/svg", d3) : document.createElement(d3, p3.is && p3), r3 = null, c3 = false;
    }
    if (d3 === null)
      y3 === p3 || c3 && l3.data === p3 || (l3.data = p3);
    else {
      if (r3 = r3 && n.call(l3.childNodes), a3 = (y3 = i3.props || e).dangerouslySetInnerHTML, v3 = p3.dangerouslySetInnerHTML, !c3) {
        if (r3 != null)
          for (y3 = {}, _3 = 0; _3 < l3.attributes.length; _3++)
            y3[l3.attributes[_3].name] = l3.attributes[_3].value;
        (v3 || a3) && (v3 && (a3 && v3.__html == a3.__html || v3.__html === l3.innerHTML) || (l3.innerHTML = v3 && v3.__html || ""));
      }
      if (C(l3, p3, y3, o3, c3), v3)
        u3.__k = [];
      else if (_3 = u3.props.children, w(l3, Array.isArray(_3) ? _3 : [_3], u3, i3, t3, o3 && d3 !== "foreignObject", r3, f3, r3 ? r3[0] : i3.__k && k(i3, 0), c3), r3 != null)
        for (_3 = r3.length; _3--; )
          r3[_3] != null && h(r3[_3]);
      c3 || ("value" in p3 && (_3 = p3.value) !== void 0 && (_3 !== l3.value || d3 === "progress" && !_3 || d3 === "option" && _3 !== y3.value) && H(l3, "value", _3, y3.value, false), "checked" in p3 && (_3 = p3.checked) !== void 0 && _3 !== l3.checked && H(l3, "checked", _3, y3.checked, false));
    }
    return l3;
  }
  function M(n2, u3, i3) {
    try {
      typeof n2 == "function" ? n2(u3) : n2.current = u3;
    } catch (n3) {
      l.__e(n3, i3);
    }
  }
  function N(n2, u3, i3) {
    var t3, o3;
    if (l.unmount && l.unmount(n2), (t3 = n2.ref) && (t3.current && t3.current !== n2.__e || M(t3, null, u3)), (t3 = n2.__c) != null) {
      if (t3.componentWillUnmount)
        try {
          t3.componentWillUnmount();
        } catch (n3) {
          l.__e(n3, u3);
        }
      t3.base = t3.__P = null;
    }
    if (t3 = n2.__k)
      for (o3 = 0; o3 < t3.length; o3++)
        t3[o3] && N(t3[o3], u3, typeof n2.type != "function");
    i3 || n2.__e == null || h(n2.__e), n2.__e = n2.__d = void 0;
  }
  function O(n2, l3, u3) {
    return this.constructor(n2, u3);
  }
  function S(u3, i3, t3) {
    var o3, r3, f3;
    l.__ && l.__(u3, i3), r3 = (o3 = typeof t3 == "function") ? null : t3 && t3.__k || i3.__k, f3 = [], j(i3, u3 = (!o3 && t3 || i3).__k = v(d, null, [u3]), r3 || e, e, i3.ownerSVGElement !== void 0, !o3 && t3 ? [t3] : r3 ? null : i3.firstChild ? n.call(i3.childNodes) : null, f3, !o3 && t3 ? t3 : r3 ? r3.__e : i3.firstChild, o3), z(f3, u3);
  }
  n = c.slice, l = { __e: function(n2, l3, u3, i3) {
    for (var t3, o3, r3; l3 = l3.__; )
      if ((t3 = l3.__c) && !t3.__)
        try {
          if ((o3 = t3.constructor) && o3.getDerivedStateFromError != null && (t3.setState(o3.getDerivedStateFromError(n2)), r3 = t3.__d), t3.componentDidCatch != null && (t3.componentDidCatch(n2, i3 || {}), r3 = t3.__d), r3)
            return t3.__E = t3;
        } catch (l4) {
          n2 = l4;
        }
    throw n2;
  } }, u = 0, i = function(n2) {
    return n2 != null && n2.constructor === void 0;
  }, _.prototype.setState = function(n2, l3) {
    var u3;
    u3 = this.__s != null && this.__s !== this.state ? this.__s : this.__s = a({}, this.state), typeof n2 == "function" && (n2 = n2(a({}, u3), this.props)), n2 && a(u3, n2), n2 != null && this.__v && (l3 && this.__h.push(l3), m(this));
  }, _.prototype.forceUpdate = function(n2) {
    this.__v && (this.__e = true, n2 && this.__h.push(n2), m(this));
  }, _.prototype.render = d, t = [], o = typeof Promise == "function" ? Promise.prototype.then.bind(Promise.resolve()) : setTimeout, g.__r = 0, f = 0;

  // ../node_modules/preact/hooks/dist/hooks.module.js
  var t2;
  var u2;
  var r2;
  var o2 = 0;
  var i2 = [];
  var c2 = l.__b;
  var f2 = l.__r;
  var e2 = l.diffed;
  var a2 = l.__c;
  var v2 = l.unmount;
  function l2(t3, r3) {
    l.__h && l.__h(u2, t3, o2 || r3), o2 = 0;
    var i3 = u2.__H || (u2.__H = { __: [], __h: [] });
    return t3 >= i3.__.length && i3.__.push({}), i3.__[t3];
  }
  function m2(n2) {
    return o2 = 1, p2(w2, n2);
  }
  function p2(n2, r3, o3) {
    var i3 = l2(t2++, 2);
    return i3.t = n2, i3.__c || (i3.__ = [o3 ? o3(r3) : w2(void 0, r3), function(n3) {
      var t3 = i3.t(i3.__[0], n3);
      i3.__[0] !== t3 && (i3.__ = [t3, i3.__[1]], i3.__c.setState({}));
    }], i3.__c = u2), i3.__;
  }
  function y2(r3, o3) {
    var i3 = l2(t2++, 3);
    !l.__s && k2(i3.__H, o3) && (i3.__ = r3, i3.__H = o3, u2.__H.__h.push(i3));
  }
  function h2(n2) {
    return o2 = 5, _2(function() {
      return { current: n2 };
    }, []);
  }
  function _2(n2, u3) {
    var r3 = l2(t2++, 7);
    return k2(r3.__H, u3) && (r3.__ = n2(), r3.__H = u3, r3.__h = n2), r3.__;
  }
  function x2() {
    for (var t3; t3 = i2.shift(); )
      if (t3.__P)
        try {
          t3.__H.__h.forEach(g2), t3.__H.__h.forEach(j2), t3.__H.__h = [];
        } catch (u3) {
          t3.__H.__h = [], l.__e(u3, t3.__v);
        }
  }
  l.__b = function(n2) {
    u2 = null, c2 && c2(n2);
  }, l.__r = function(n2) {
    f2 && f2(n2), t2 = 0;
    var r3 = (u2 = n2.__c).__H;
    r3 && (r3.__h.forEach(g2), r3.__h.forEach(j2), r3.__h = []);
  }, l.diffed = function(t3) {
    e2 && e2(t3);
    var o3 = t3.__c;
    o3 && o3.__H && o3.__H.__h.length && (i2.push(o3) !== 1 && r2 === l.requestAnimationFrame || ((r2 = l.requestAnimationFrame) || function(n2) {
      var t4, u3 = function() {
        clearTimeout(r3), b2 && cancelAnimationFrame(t4), setTimeout(n2);
      }, r3 = setTimeout(u3, 100);
      b2 && (t4 = requestAnimationFrame(u3));
    })(x2)), u2 = null;
  }, l.__c = function(t3, u3) {
    u3.some(function(t4) {
      try {
        t4.__h.forEach(g2), t4.__h = t4.__h.filter(function(n2) {
          return !n2.__ || j2(n2);
        });
      } catch (r3) {
        u3.some(function(n2) {
          n2.__h && (n2.__h = []);
        }), u3 = [], l.__e(r3, t4.__v);
      }
    }), a2 && a2(t3, u3);
  }, l.unmount = function(t3) {
    v2 && v2(t3);
    var u3, r3 = t3.__c;
    r3 && r3.__H && (r3.__H.__.forEach(function(n2) {
      try {
        g2(n2);
      } catch (n3) {
        u3 = n3;
      }
    }), u3 && l.__e(u3, r3.__v));
  };
  var b2 = typeof requestAnimationFrame == "function";
  function g2(n2) {
    var t3 = u2, r3 = n2.__c;
    typeof r3 == "function" && (n2.__c = void 0, r3()), u2 = t3;
  }
  function j2(n2) {
    var t3 = u2;
    n2.__c = n2.__(), u2 = t3;
  }
  function k2(n2, t3) {
    return !n2 || n2.length !== t3.length || t3.some(function(t4, u3) {
      return t4 !== n2[u3];
    });
  }
  function w2(n2, t3) {
    return typeof t3 == "function" ? t3(n2) : t3;
  }

  // ../wasm/reader.ts
  var textDecoder = new TextDecoder();
  var Reader = class {
    constructor(view) {
      this.view = view;
      this.ofs = 0;
    }
    done() {
      return this.ofs == this.view.byteLength;
    }
    debug() {
      let out = `${this.view.byteLength - this.ofs} remaining:`;
      for (let i3 = 0; i3 < 16; i3++) {
        out += " " + this.read8().toString(16);
      }
      return out;
    }
    read8() {
      const val = this.view.getUint8(this.ofs);
      this.ofs += 1;
      return val;
    }
    back() {
      this.ofs -= 1;
    }
    read32() {
      const val = this.view.getUint32(this.ofs, true);
      this.ofs += 4;
      return val;
    }
    readUint() {
      let n2 = 0;
      let shift = 0;
      while (true) {
        const b3 = this.read8();
        n2 |= (b3 & 127) << shift;
        if ((b3 & 128) === 0)
          break;
        shift += 7;
      }
      return n2;
    }
    readSint() {
      return this.readUint();
    }
    readSintBig() {
      let n2 = 0n;
      let shift = 0;
      while (true) {
        const b3 = this.read8();
        n2 |= BigInt(b3 & 127) << BigInt(shift);
        if ((b3 & 128) === 0)
          break;
        shift += 7;
      }
      return n2;
    }
    readF32() {
      const val = this.view.getFloat32(this.ofs, true);
      this.ofs += 4;
      return val;
    }
    readF64() {
      const val = this.view.getFloat64(this.ofs, true);
      this.ofs += 8;
      return val;
    }
    skip(len) {
      this.ofs += len;
    }
    slice(len) {
      const view = new DataView(this.view.buffer, this.view.byteOffset + this.ofs, len);
      this.ofs += len;
      return view;
    }
    vec(f3) {
      const len = this.readUint();
      const ts = new Array(len);
      for (let i3 = 0; i3 < len; i3++) {
        ts[i3] = f3(this);
      }
      return ts;
    }
    name() {
      const len = this.readUint();
      const str = textDecoder.decode(new DataView(this.view.buffer, this.view.byteOffset + this.ofs, len));
      this.ofs += len;
      return str;
    }
  };

  // ../wasm/type.ts
  function readValType(r3) {
    const n2 = r3.read8();
    switch (n2) {
      case 127:
        return "i32" /* i32 */;
      case 126:
        return "i64" /* i64 */;
      case 125:
        return "f32" /* f32 */;
      case 124:
        return "f64" /* f64 */;
      case 123:
        return "v128" /* v128 */;
      case 112:
        return "funcref" /* funcref */;
      case 111:
        return "externref" /* externref */;
      default:
        throw new Error(`unknown type byte ${n2.toString(16)}`);
    }
  }
  function readFuncType(r3) {
    if (r3.read8() !== 96)
      throw new Error(`expected function type`);
    const params = r3.vec(() => readValType(r3));
    const result = r3.vec(() => readValType(r3));
    return { params, result };
  }
  function funcTypeToString(f3) {
    const params = f3.params.join(", ");
    if (f3.result.length == 0) {
      return `(${params})`;
    }
    const result = f3.result.join(", ");
    return `(${params}) => ${result}`;
  }

  // ../wasm/code.ts
  function readBlockType(r3) {
    const b3 = r3.read8();
    if (b3 === 64) {
      return void 0;
    }
    r3.back();
    return readValType(r3);
  }
  function readMemOp(r3, op) {
    return { op, align: r3.readUint(), offset: r3.readUint() };
  }
  function readInstruction(r3) {
    const op = r3.read8();
    switch (op) {
      case 0:
        return { op: "unreachable" /* unreachable */ };
      case 1:
        return { op: "nop" /* nop */ };
      case 2:
        readBlockType(r3);
        return { op: "block" /* block */, body: readExpr(r3) };
      case 3:
        readBlockType(r3);
        return { op: "loop" /* loop */, body: readExpr(r3) };
      case 4:
        readBlockType(r3);
        {
          let [body, end] = readInstrs(r3);
          let instr = { op: "if" /* if */, body };
          if (end === "else" /* else */) {
            instr.else = readExpr(r3);
          }
          return instr;
        }
      case 5:
        return { op: "else" /* else */ };
      case 11:
        return { op: "end" /* end */ };
      case 12:
        return { op: "br" /* br */, label: r3.readUint() };
      case 13:
        return { op: "br_if" /* br_if */, label: r3.readUint() };
      case 14:
        return {
          op: "br_table" /* br_table */,
          labels: r3.vec(() => r3.readUint()),
          default: r3.readUint()
        };
      case 15:
        return { op: "return" /* return */ };
      case 16:
        return { op: "call" /* call */, func: r3.readUint() };
      case 17:
        return {
          op: "call_indirect" /* call_indirect */,
          type: r3.readUint(),
          table: r3.readUint()
        };
      case 26:
        return { op: "drop" /* drop */ };
      case 27:
        return { op: "select" /* select */ };
      case 28: {
        const types = r3.vec(readValType);
        return { op: "select" /* select */, types };
      }
      case 32:
        return { op: "local.get" /* local_get */, local: r3.readUint() };
      case 33:
        return { op: "local.set" /* local_set */, local: r3.readUint() };
      case 34:
        return { op: "local.tee" /* local_tee */, local: r3.readUint() };
      case 35:
        return {
          op: "global.get" /* global_get */,
          global: r3.readUint()
        };
      case 36:
        return {
          op: "global.set" /* global_set */,
          global: r3.readUint()
        };
      case 40:
        return readMemOp(r3, "i32.load" /* i32_load */);
      case 41:
        return readMemOp(r3, "i64.load" /* i64_load */);
      case 42:
        return readMemOp(r3, "f32.load" /* f32_load */);
      case 43:
        return readMemOp(r3, "f64.load" /* f64_load */);
      case 44:
        return readMemOp(r3, "i32.load8_s" /* i32_load8_s */);
      case 45:
        return readMemOp(r3, "i32.load8_u" /* i32_load8_u */);
      case 46:
        return readMemOp(r3, "i32.load16_s" /* i32_load16_s */);
      case 47:
        return readMemOp(r3, "i32.load16_u" /* i32_load16_u */);
      case 48:
        return readMemOp(r3, "i64.load8_s" /* i64_load8_s */);
      case 49:
        return readMemOp(r3, "i64.load8_u" /* i64_load8_u */);
      case 50:
        return readMemOp(r3, "i64.load16_s" /* i64_load16_s */);
      case 51:
        return readMemOp(r3, "i64.load16_u" /* i64_load16_u */);
      case 52:
        return readMemOp(r3, "i64.load32_s" /* i64_load32_s */);
      case 53:
        return readMemOp(r3, "i64.load32_u" /* i64_load32_u */);
      case 54:
        return readMemOp(r3, "i32.store" /* i32_store */);
      case 55:
        return readMemOp(r3, "i64.store" /* i64_store */);
      case 56:
        return readMemOp(r3, "f32.store" /* f32_store */);
      case 57:
        return readMemOp(r3, "f64.store" /* f64_store */);
      case 58:
        return readMemOp(r3, "i32.store8" /* i32_store8 */);
      case 59:
        return readMemOp(r3, "i32.store16" /* i32_store16 */);
      case 60:
        return readMemOp(r3, "i64.store8" /* i64_store8 */);
      case 61:
        return readMemOp(r3, "i64.store16" /* i64_store16 */);
      case 62:
        return readMemOp(r3, "i64.store32" /* i64_store32 */);
      case 63: {
        const b3 = r3.read8();
        if (b3 !== 0) {
          throw new Error(`bad instruction sequence 0x3f ${b3.toString(16)}`);
        }
        return { op: "memory.size" /* memory_size */ };
      }
      case 64: {
        const b3 = r3.read8();
        if (b3 !== 0) {
          throw new Error(`bad instruction sequence 0x40 ${b3.toString(16)}`);
        }
        return { op: "memory.grow" /* memory_grow */ };
      }
      case 65:
        return { op: "i32.const" /* i32_const */, n: r3.readSint() };
      case 66:
        return { op: "i64.const" /* i64_const */, n: r3.readSintBig() };
      case 67:
        return { op: "f32.const" /* f32_const */, z: r3.readF32() };
      case 68:
        return { op: "f64.const" /* f64_const */, z: r3.readF64() };
      case 69:
        return { op: "i32.eqz" /* i32_eqz */ };
      case 70:
        return { op: "i32.eq" /* i32_eq */ };
      case 71:
        return { op: "i32.ne" /* i32_ne */ };
      case 72:
        return { op: "i32.lt_s" /* i32_lt_s */ };
      case 73:
        return { op: "i32.lt_u" /* i32_lt_u */ };
      case 74:
        return { op: "i32.gt_s" /* i32_gt_s */ };
      case 75:
        return { op: "i32.gt_u" /* i32_gt_u */ };
      case 76:
        return { op: "i32.le_s" /* i32_le_s */ };
      case 77:
        return { op: "i32.le_u" /* i32_le_u */ };
      case 78:
        return { op: "i32.ge_s" /* i32_ge_s */ };
      case 79:
        return { op: "i32.ge_u" /* i32_ge_u */ };
      case 80:
        return { op: "i64.eqz" /* i64_eqz */ };
      case 81:
        return { op: "i64.eq" /* i64_eq */ };
      case 82:
        return { op: "i64.ne" /* i64_ne */ };
      case 83:
        return { op: "i64.lt_s" /* i64_lt_s */ };
      case 84:
        return { op: "i64.lt_u" /* i64_lt_u */ };
      case 85:
        return { op: "i64.gt_s" /* i64_gt_s */ };
      case 86:
        return { op: "i64.gt_u" /* i64_gt_u */ };
      case 87:
        return { op: "i64.le_s" /* i64_le_s */ };
      case 88:
        return { op: "i64.le_u" /* i64_le_u */ };
      case 89:
        return { op: "i64.ge_s" /* i64_ge_s */ };
      case 90:
        return { op: "i64.ge_u" /* i64_ge_u */ };
      case 91:
        return { op: "f32.eq" /* f32_eq */ };
      case 92:
        return { op: "f32.ne" /* f32_ne */ };
      case 93:
        return { op: "f32.lt" /* f32_lt */ };
      case 94:
        return { op: "f32.gt" /* f32_gt */ };
      case 95:
        return { op: "f32.le" /* f32_le */ };
      case 96:
        return { op: "f32.ge" /* f32_ge */ };
      case 97:
        return { op: "f64.eq" /* f64_eq */ };
      case 98:
        return { op: "f64.ne" /* f64_ne */ };
      case 99:
        return { op: "f64.lt" /* f64_lt */ };
      case 100:
        return { op: "f64.gt" /* f64_gt */ };
      case 101:
        return { op: "f64.le" /* f64_le */ };
      case 102:
        return { op: "f64.ge" /* f64_ge */ };
      case 103:
        return { op: "i32.clz" /* i32_clz */ };
      case 104:
        return { op: "i32.ctz" /* i32_ctz */ };
      case 105:
        return { op: "i32.popcnt" /* i32_popcnt */ };
      case 106:
        return { op: "i32.add" /* i32_add */ };
      case 107:
        return { op: "i32.sub" /* i32_sub */ };
      case 108:
        return { op: "i32.mul" /* i32_mul */ };
      case 109:
        return { op: "i32.div_s" /* i32_div_s */ };
      case 110:
        return { op: "i32.div_u" /* i32_div_u */ };
      case 111:
        return { op: "i32.rem_s" /* i32_rem_s */ };
      case 112:
        return { op: "i32.rem_u" /* i32_rem_u */ };
      case 113:
        return { op: "i32.and" /* i32_and */ };
      case 114:
        return { op: "i32.or" /* i32_or */ };
      case 115:
        return { op: "i32.xor" /* i32_xor */ };
      case 116:
        return { op: "i32.shl" /* i32_shl */ };
      case 117:
        return { op: "i32.shr_s" /* i32_shr_s */ };
      case 118:
        return { op: "i32.shr_u" /* i32_shr_u */ };
      case 119:
        return { op: "i32.rotl" /* i32_rotl */ };
      case 120:
        return { op: "i32.rotr" /* i32_rotr */ };
      case 121:
        return { op: "i64.clz" /* i64_clz */ };
      case 122:
        return { op: "i64.ctz" /* i64_ctz */ };
      case 123:
        return { op: "i64.popcnt" /* i64_popcnt */ };
      case 124:
        return { op: "i64.add" /* i64_add */ };
      case 125:
        return { op: "i64.sub" /* i64_sub */ };
      case 126:
        return { op: "i64.mul" /* i64_mul */ };
      case 127:
        return { op: "i64.div_s" /* i64_div_s */ };
      case 128:
        return { op: "i64.div_u" /* i64_div_u */ };
      case 129:
        return { op: "i64.rem_s" /* i64_rem_s */ };
      case 130:
        return { op: "i64.rem_u" /* i64_rem_u */ };
      case 131:
        return { op: "i64.and" /* i64_and */ };
      case 132:
        return { op: "i64.or" /* i64_or */ };
      case 133:
        return { op: "i64.xor" /* i64_xor */ };
      case 134:
        return { op: "i64.shl" /* i64_shl */ };
      case 135:
        return { op: "i64.shr_s" /* i64_shr_s */ };
      case 136:
        return { op: "i64.shr_u" /* i64_shr_u */ };
      case 137:
        return { op: "i64.rotl" /* i64_rotl */ };
      case 138:
        return { op: "i64.rotr" /* i64_rotr */ };
      case 139:
        return { op: "f32.abs" /* f32_abs */ };
      case 140:
        return { op: "f32.neg" /* f32_neg */ };
      case 141:
        return { op: "f32.ceil" /* f32_ceil */ };
      case 142:
        return { op: "f32.floor" /* f32_floor */ };
      case 143:
        return { op: "f32.trunc" /* f32_trunc */ };
      case 144:
        return { op: "f32.nearest" /* f32_nearest */ };
      case 145:
        return { op: "f32.sqrt" /* f32_sqrt */ };
      case 146:
        return { op: "f32.add" /* f32_add */ };
      case 147:
        return { op: "f32.sub" /* f32_sub */ };
      case 148:
        return { op: "f32.mul" /* f32_mul */ };
      case 149:
        return { op: "f32.div" /* f32_div */ };
      case 150:
        return { op: "f32.min" /* f32_min */ };
      case 151:
        return { op: "f32.max" /* f32_max */ };
      case 152:
        return { op: "f32.copysign" /* f32_copysign */ };
      case 153:
        return { op: "f64.abs" /* f64_abs */ };
      case 154:
        return { op: "f64.neg" /* f64_neg */ };
      case 155:
        return { op: "f64.ceil" /* f64_ceil */ };
      case 156:
        return { op: "f64.floor" /* f64_floor */ };
      case 157:
        return { op: "f64.trunc" /* f64_trunc */ };
      case 158:
        return { op: "f64.nearest" /* f64_nearest */ };
      case 159:
        return { op: "f64.sqrt" /* f64_sqrt */ };
      case 160:
        return { op: "f64.add" /* f64_add */ };
      case 161:
        return { op: "f64.sub" /* f64_sub */ };
      case 162:
        return { op: "f64.mul" /* f64_mul */ };
      case 163:
        return { op: "f64.div" /* f64_div */ };
      case 164:
        return { op: "f64.min" /* f64_min */ };
      case 165:
        return { op: "f64.max" /* f64_max */ };
      case 166:
        return { op: "f64.copysign" /* f64_copysign */ };
      case 167:
        return { op: "i32.wrap_i64" /* i32_wrap_i64 */ };
      case 168:
        return { op: "i32.trunc_f32_s" /* i32_trunc_f32_s */ };
      case 169:
        return { op: "i32.trunc_f32_u" /* i32_trunc_f32_u */ };
      case 170:
        return { op: "i32.trunc_f64_s" /* i32_trunc_f64_s */ };
      case 171:
        return { op: "i32.trunc_f64_u" /* i32_trunc_f64_u */ };
      case 172:
        return { op: "i64.extend_i32_s" /* i64_extend_i32_s */ };
      case 173:
        return { op: "i64.extend_i32_u" /* i64_extend_i32_u */ };
      case 174:
        return { op: "i64.trunc_f32_s" /* i64_trunc_f32_s */ };
      case 175:
        return { op: "i64.trunc_f32_u" /* i64_trunc_f32_u */ };
      case 176:
        return { op: "i64.trunc_f64_s" /* i64_trunc_f64_s */ };
      case 177:
        return { op: "i64.trunc_f64_u" /* i64_trunc_f64_u */ };
      case 178:
        return { op: "f32.convert_i32_s" /* f32_convert_i32_s */ };
      case 179:
        return { op: "f32.convert_i32_u" /* f32_convert_i32_u */ };
      case 180:
        return { op: "f32.convert_i64_s" /* f32_convert_i64_s */ };
      case 181:
        return { op: "f32.convert_i64_u" /* f32_convert_i64_u */ };
      case 182:
        return { op: "f32.demote_f64" /* f32_demote_f64 */ };
      case 183:
        return { op: "f64.convert_i32_s" /* f64_convert_i32_s */ };
      case 184:
        return { op: "f64.convert_i32_u" /* f64_convert_i32_u */ };
      case 185:
        return { op: "f64.convert_i64_s" /* f64_convert_i64_s */ };
      case 186:
        return { op: "f64.convert_i64_u" /* f64_convert_i64_u */ };
      case 187:
        return { op: "f64.promote_f32" /* f64_promote_f32 */ };
      case 188:
        return { op: "i32.reinterpret_f32" /* i32_reinterpret_f32 */ };
      case 189:
        return { op: "i64.reinterpret_f64" /* i64_reinterpret_f64 */ };
      case 190:
        return { op: "f32.reinterpret_i32" /* f32_reinterpret_i32 */ };
      case 191:
        return { op: "f64.reinterpret_i64" /* f64_reinterpret_i64 */ };
      case 192:
        return { op: "i32.extend8_s" /* i32_extend8_s */ };
      case 193:
        return { op: "i32.extend16_s" /* i32_extend16_s */ };
      case 194:
        return { op: "i64.extend8_s" /* i64_extend8_s */ };
      case 195:
        return { op: "i64.extend16_s" /* i64_extend16_s */ };
      case 196:
        return { op: "i64.extend32_s" /* i64_extend32_s */ };
      case 208:
        return { op: "ref.null" /* ref_null */, type: readValType(r3) };
      case 209:
        return { op: "ref.is_null" /* ref_is_null */ };
      case 210:
        return { op: "ref.func" /* ref_func */, index: r3.readUint() };
      default:
        throw new Error(`unhandled op ${op.toString(16)}`);
    }
  }
  function readInstrs(r3) {
    const instrs = [];
    while (true) {
      const instr = readInstruction(r3);
      if (instr.op === "end" /* end */ || instr.op === "else" /* else */) {
        return [instrs, instr.op];
      }
      instrs.push(instr);
    }
  }
  function readExpr(r3) {
    return readInstrs(r3)[0];
  }
  function readFunction(r3) {
    const locals = [];
    const len = r3.readUint();
    for (let i3 = 0; i3 < len; i3++) {
      const count = r3.readUint();
      const type2 = readValType(r3);
      for (let j4 = 0; j4 < count; j4++) {
        locals.push(type2);
      }
    }
    const body = readExpr(r3);
    return { locals, body };
  }
  function read(r3) {
    const funcs = r3.vec(() => {
      const size = r3.readUint();
      const header = { ofs: r3.view.byteOffset + r3.ofs, len: size };
      r3.skip(size);
      return header;
    });
    return funcs;
  }

  // ../wasm/shared.ts
  function descToString(desc) {
    switch (desc.kind) {
      case "table" /* table */:
        return `table ${desc.table}`;
      case "mem" /* mem */:
        return `mem ${limitsToString(desc.limits)}`;
      case "global" /* global */:
        return `mem ${desc}`;
      default:
        return `${desc.kind} index ${desc.index}`;
    }
  }
  function readLimits(r3) {
    const b3 = r3.read8();
    let minimum = r3.readUint();
    let maximum;
    if (b3 & 1) {
      maximum = r3.readUint();
    }
    let shared = (b3 & 2) !== 0;
    if (b3 >> 2 !== 0) {
      throw new Error(`invalid limits flag ${b3.toString(16)}`);
    }
    return { minimum, maximum, shared };
  }
  function limitsToString(limits) {
    return `min=${limits.minimum} max=${limits.maximum ?? "none"}${limits.shared ? " shared" : ""}`;
  }
  function readTable(r3) {
    const element = readValType(r3);
    const limits = readLimits(r3);
    return { element, limits };
  }
  function readGlobalType(r3) {
    const valType = readValType(r3);
    const mutB = r3.read8();
    let mut;
    switch (mutB) {
      case 0:
        mut = false;
        break;
      case 1:
        mut = true;
        break;
      default:
        throw new Error(`invalid mutability flag ${mutB.toString(16)}`);
    }
    return { valType, mut };
  }

  // ../wasm/sections.ts
  function readCustomSection(r3) {
    const name = r3.name();
    return { name };
  }
  function readNameMap(r3) {
    const len = r3.readUint();
    const map2 = /* @__PURE__ */ new Map();
    for (let i3 = 0; i3 < len; i3++) {
      map2.set(r3.readUint(), r3.name());
    }
    return map2;
  }
  function readIndirectNameMap(r3) {
    const len = r3.readUint();
    const map2 = /* @__PURE__ */ new Map();
    for (let i3 = 0; i3 < len; i3++) {
      const idx = r3.readUint();
      const submap = readNameMap(r3);
      map2.set(idx, submap);
    }
    return map2;
  }
  function readNameSection(r3) {
    let sec = {};
    while (!r3.done()) {
      const b3 = r3.read8();
      const size = r3.readUint();
      switch (b3) {
        case 0:
          sec.moduleName = r3.name();
          break;
        case 1:
          sec.functionNames = readNameMap(r3);
          break;
        case 2:
          sec.localNames = readIndirectNameMap(r3);
          break;
        case 7:
          sec.globalNames = readNameMap(r3);
          break;
        case 9:
          sec.dataNames = readNameMap(r3);
          break;
        default:
          console.warn(`ignoring unknown name subsection id ${b3.toString(16)}`);
          r3.skip(size);
          break;
      }
    }
    return sec;
  }
  function readProducersSection(r3) {
    return r3.vec(() => {
      const name = r3.name();
      const values = r3.vec(() => {
        return { name: r3.name(), version: r3.name() };
      });
      return { name, values };
    });
  }
  function readTypeSection(r3) {
    return r3.vec(readFuncType);
  }
  function readImportSection(r3) {
    return r3.vec(() => {
      const module = r3.name();
      const name = r3.name();
      const desc8 = r3.read8();
      let desc;
      switch (desc8) {
        case 0:
          desc = { kind: "typeidx" /* typeidx */, index: r3.readUint() };
          break;
        case 1:
          desc = { kind: "table" /* table */, table: readTable(r3) };
          break;
        case 2:
          desc = { kind: "mem" /* mem */, limits: readLimits(r3) };
          break;
        case 3:
          desc = { kind: "global" /* global */, globalType: readGlobalType(r3) };
          break;
        default:
          throw new Error(`unhandled import desc type ${desc8.toString(16)}`);
      }
      return { module, name, desc };
    });
  }
  function readFunctionSection(r3) {
    return r3.vec(() => r3.readUint());
  }
  function readTableSection(r3) {
    return r3.vec(() => readTable(r3));
  }
  function readMemorySection(r3) {
    return r3.vec(() => readLimits(r3));
  }
  function readGlobalSection(r3) {
    return r3.vec(() => {
      return { type: readGlobalType(r3), init: readExpr(r3) };
    });
  }
  function readExportSection(r3) {
    return r3.vec(() => {
      const name = r3.name();
      const desc8 = r3.read8();
      let desc;
      const kind = [
        "funcidx" /* funcidx */,
        "tableidx" /* tableidx */,
        "memidx" /* memidx */,
        "globalidx" /* globalidx */
      ][desc8];
      if (!kind) {
        throw new Error(`unhandled export desc type ${desc8.toString(16)}`);
      }
      return { name, desc: { kind, index: r3.readUint() } };
    });
  }
  function readElementSection(r3) {
    return r3.vec(() => {
      const flags = r3.read8();
      switch (flags) {
        case 0: {
          const expr = readExpr(r3);
          const funcs = r3.vec(() => r3.readUint());
          const init2 = funcs.map((index) => [
            { op: "ref.func" /* ref_func */, index }
          ]);
          return {
            type: "funcref" /* funcref */,
            init: init2,
            mode: "active" /* active */,
            table: 0,
            offset: expr
          };
        }
        default:
          throw new Error(`TODO: unhandled element flags ${flags.toString(16)}`);
      }
    });
  }
  function readDataSection(r3) {
    return r3.vec(() => {
      const flags = r3.read8();
      switch (flags) {
        case 0: {
          const expr = readExpr(r3);
          const len = r3.readUint();
          return { init: r3.slice(len), memidx: 0, offset: expr };
        }
        case 1: {
          const len = r3.readUint();
          return { init: r3.slice(len) };
        }
        default:
          throw new Error(`unhandled data section data flags ${flags.toString(16)}`);
      }
    });
  }

  // ../wasm/index.ts
  function getSectionReader(buffer, section) {
    return new Reader(new DataView(buffer, section.ofs, section.len));
  }
  function readFileHeader(r3) {
    const magic = r3.read32();
    if (magic !== 1836278016) {
      throw new Error(`invalid signature: ${magic.toString(16)}`);
    }
    const version = r3.read32();
    if (version !== 1) {
      throw new Error(`bad version, expected 1, got ${version}`);
    }
  }
  function readSectionHeader(r3, index) {
    const id2 = r3.read8();
    const len = r3.readUint();
    const ofs = r3.ofs;
    r3.skip(len);
    const kind = [
      "custom" /* custom */,
      "type" /* type */,
      "import" /* import */,
      "function" /* function */,
      "table" /* table */,
      "memory" /* memory */,
      "global" /* global */,
      "export" /* export */,
      "start" /* start */,
      "element" /* element */,
      "code" /* code */,
      "data" /* data */,
      "data count" /* data_count */
    ][id2];
    return { index, kind, ofs, len };
  }
  function read2(buffer) {
    const r3 = new Reader(new DataView(buffer));
    readFileHeader(r3);
    const sections = [];
    for (let index = 0; !r3.done(); index++) {
      sections.push(readSectionHeader(r3, index));
    }
    return sections;
  }

  // ../node_modules/d3-array/src/ascending.js
  function ascending(a3, b3) {
    return a3 == null || b3 == null ? NaN : a3 < b3 ? -1 : a3 > b3 ? 1 : a3 >= b3 ? 0 : NaN;
  }

  // ../node_modules/d3-array/src/descending.js
  function descending(a3, b3) {
    return a3 == null || b3 == null ? NaN : b3 < a3 ? -1 : b3 > a3 ? 1 : b3 >= a3 ? 0 : NaN;
  }

  // ../node_modules/internmap/src/index.js
  var InternMap = class extends Map {
    constructor(entries, key = keyof) {
      super();
      Object.defineProperties(this, { _intern: { value: /* @__PURE__ */ new Map() }, _key: { value: key } });
      if (entries != null)
        for (const [key2, value] of entries)
          this.set(key2, value);
    }
    get(key) {
      return super.get(intern_get(this, key));
    }
    has(key) {
      return super.has(intern_get(this, key));
    }
    set(key, value) {
      return super.set(intern_set(this, key), value);
    }
    delete(key) {
      return super.delete(intern_delete(this, key));
    }
  };
  function intern_get({ _intern, _key }, value) {
    const key = _key(value);
    return _intern.has(key) ? _intern.get(key) : value;
  }
  function intern_set({ _intern, _key }, value) {
    const key = _key(value);
    if (_intern.has(key))
      return _intern.get(key);
    _intern.set(key, value);
    return value;
  }
  function intern_delete({ _intern, _key }, value) {
    const key = _key(value);
    if (_intern.has(key)) {
      value = _intern.get(key);
      _intern.delete(key);
    }
    return value;
  }
  function keyof(value) {
    return value !== null && typeof value === "object" ? value.valueOf() : value;
  }

  // ../node_modules/d3-array/src/sum.js
  function sum(values, valueof) {
    let sum2 = 0;
    if (valueof === void 0) {
      for (let value of values) {
        if (value = +value) {
          sum2 += value;
        }
      }
    } else {
      let index = -1;
      for (let value of values) {
        if (value = +valueof(value, ++index, values)) {
          sum2 += value;
        }
      }
    }
    return sum2;
  }

  // ../node_modules/d3-dispatch/src/dispatch.js
  var noop = { value: () => {
  } };
  function dispatch() {
    for (var i3 = 0, n2 = arguments.length, _3 = {}, t3; i3 < n2; ++i3) {
      if (!(t3 = arguments[i3] + "") || t3 in _3 || /[\s.]/.test(t3))
        throw new Error("illegal type: " + t3);
      _3[t3] = [];
    }
    return new Dispatch(_3);
  }
  function Dispatch(_3) {
    this._ = _3;
  }
  function parseTypenames(typenames, types) {
    return typenames.trim().split(/^|\s+/).map(function(t3) {
      var name = "", i3 = t3.indexOf(".");
      if (i3 >= 0)
        name = t3.slice(i3 + 1), t3 = t3.slice(0, i3);
      if (t3 && !types.hasOwnProperty(t3))
        throw new Error("unknown type: " + t3);
      return { type: t3, name };
    });
  }
  Dispatch.prototype = dispatch.prototype = {
    constructor: Dispatch,
    on: function(typename, callback) {
      var _3 = this._, T4 = parseTypenames(typename + "", _3), t3, i3 = -1, n2 = T4.length;
      if (arguments.length < 2) {
        while (++i3 < n2)
          if ((t3 = (typename = T4[i3]).type) && (t3 = get(_3[t3], typename.name)))
            return t3;
        return;
      }
      if (callback != null && typeof callback !== "function")
        throw new Error("invalid callback: " + callback);
      while (++i3 < n2) {
        if (t3 = (typename = T4[i3]).type)
          _3[t3] = set(_3[t3], typename.name, callback);
        else if (callback == null)
          for (t3 in _3)
            _3[t3] = set(_3[t3], typename.name, null);
      }
      return this;
    },
    copy: function() {
      var copy = {}, _3 = this._;
      for (var t3 in _3)
        copy[t3] = _3[t3].slice();
      return new Dispatch(copy);
    },
    call: function(type2, that) {
      if ((n2 = arguments.length - 2) > 0)
        for (var args = new Array(n2), i3 = 0, n2, t3; i3 < n2; ++i3)
          args[i3] = arguments[i3 + 2];
      if (!this._.hasOwnProperty(type2))
        throw new Error("unknown type: " + type2);
      for (t3 = this._[type2], i3 = 0, n2 = t3.length; i3 < n2; ++i3)
        t3[i3].value.apply(that, args);
    },
    apply: function(type2, that, args) {
      if (!this._.hasOwnProperty(type2))
        throw new Error("unknown type: " + type2);
      for (var t3 = this._[type2], i3 = 0, n2 = t3.length; i3 < n2; ++i3)
        t3[i3].value.apply(that, args);
    }
  };
  function get(type2, name) {
    for (var i3 = 0, n2 = type2.length, c3; i3 < n2; ++i3) {
      if ((c3 = type2[i3]).name === name) {
        return c3.value;
      }
    }
  }
  function set(type2, name, callback) {
    for (var i3 = 0, n2 = type2.length; i3 < n2; ++i3) {
      if (type2[i3].name === name) {
        type2[i3] = noop, type2 = type2.slice(0, i3).concat(type2.slice(i3 + 1));
        break;
      }
    }
    if (callback != null)
      type2.push({ name, value: callback });
    return type2;
  }
  var dispatch_default = dispatch;

  // ../node_modules/d3-selection/src/namespaces.js
  var xhtml = "http://www.w3.org/1999/xhtml";
  var namespaces_default = {
    svg: "http://www.w3.org/2000/svg",
    xhtml,
    xlink: "http://www.w3.org/1999/xlink",
    xml: "http://www.w3.org/XML/1998/namespace",
    xmlns: "http://www.w3.org/2000/xmlns/"
  };

  // ../node_modules/d3-selection/src/namespace.js
  function namespace_default(name) {
    var prefix = name += "", i3 = prefix.indexOf(":");
    if (i3 >= 0 && (prefix = name.slice(0, i3)) !== "xmlns")
      name = name.slice(i3 + 1);
    return namespaces_default.hasOwnProperty(prefix) ? { space: namespaces_default[prefix], local: name } : name;
  }

  // ../node_modules/d3-selection/src/creator.js
  function creatorInherit(name) {
    return function() {
      var document2 = this.ownerDocument, uri = this.namespaceURI;
      return uri === xhtml && document2.documentElement.namespaceURI === xhtml ? document2.createElement(name) : document2.createElementNS(uri, name);
    };
  }
  function creatorFixed(fullname) {
    return function() {
      return this.ownerDocument.createElementNS(fullname.space, fullname.local);
    };
  }
  function creator_default(name) {
    var fullname = namespace_default(name);
    return (fullname.local ? creatorFixed : creatorInherit)(fullname);
  }

  // ../node_modules/d3-selection/src/selector.js
  function none() {
  }
  function selector_default(selector) {
    return selector == null ? none : function() {
      return this.querySelector(selector);
    };
  }

  // ../node_modules/d3-selection/src/selection/select.js
  function select_default(select) {
    if (typeof select !== "function")
      select = selector_default(select);
    for (var groups = this._groups, m3 = groups.length, subgroups = new Array(m3), j4 = 0; j4 < m3; ++j4) {
      for (var group = groups[j4], n2 = group.length, subgroup = subgroups[j4] = new Array(n2), node, subnode, i3 = 0; i3 < n2; ++i3) {
        if ((node = group[i3]) && (subnode = select.call(node, node.__data__, i3, group))) {
          if ("__data__" in node)
            subnode.__data__ = node.__data__;
          subgroup[i3] = subnode;
        }
      }
    }
    return new Selection(subgroups, this._parents);
  }

  // ../node_modules/d3-selection/src/array.js
  function array(x3) {
    return x3 == null ? [] : Array.isArray(x3) ? x3 : Array.from(x3);
  }

  // ../node_modules/d3-selection/src/selectorAll.js
  function empty() {
    return [];
  }
  function selectorAll_default(selector) {
    return selector == null ? empty : function() {
      return this.querySelectorAll(selector);
    };
  }

  // ../node_modules/d3-selection/src/selection/selectAll.js
  function arrayAll(select) {
    return function() {
      return array(select.apply(this, arguments));
    };
  }
  function selectAll_default(select) {
    if (typeof select === "function")
      select = arrayAll(select);
    else
      select = selectorAll_default(select);
    for (var groups = this._groups, m3 = groups.length, subgroups = [], parents = [], j4 = 0; j4 < m3; ++j4) {
      for (var group = groups[j4], n2 = group.length, node, i3 = 0; i3 < n2; ++i3) {
        if (node = group[i3]) {
          subgroups.push(select.call(node, node.__data__, i3, group));
          parents.push(node);
        }
      }
    }
    return new Selection(subgroups, parents);
  }

  // ../node_modules/d3-selection/src/matcher.js
  function matcher_default(selector) {
    return function() {
      return this.matches(selector);
    };
  }
  function childMatcher(selector) {
    return function(node) {
      return node.matches(selector);
    };
  }

  // ../node_modules/d3-selection/src/selection/selectChild.js
  var find = Array.prototype.find;
  function childFind(match) {
    return function() {
      return find.call(this.children, match);
    };
  }
  function childFirst() {
    return this.firstElementChild;
  }
  function selectChild_default(match) {
    return this.select(match == null ? childFirst : childFind(typeof match === "function" ? match : childMatcher(match)));
  }

  // ../node_modules/d3-selection/src/selection/selectChildren.js
  var filter = Array.prototype.filter;
  function children() {
    return Array.from(this.children);
  }
  function childrenFilter(match) {
    return function() {
      return filter.call(this.children, match);
    };
  }
  function selectChildren_default(match) {
    return this.selectAll(match == null ? children : childrenFilter(typeof match === "function" ? match : childMatcher(match)));
  }

  // ../node_modules/d3-selection/src/selection/filter.js
  function filter_default(match) {
    if (typeof match !== "function")
      match = matcher_default(match);
    for (var groups = this._groups, m3 = groups.length, subgroups = new Array(m3), j4 = 0; j4 < m3; ++j4) {
      for (var group = groups[j4], n2 = group.length, subgroup = subgroups[j4] = [], node, i3 = 0; i3 < n2; ++i3) {
        if ((node = group[i3]) && match.call(node, node.__data__, i3, group)) {
          subgroup.push(node);
        }
      }
    }
    return new Selection(subgroups, this._parents);
  }

  // ../node_modules/d3-selection/src/selection/sparse.js
  function sparse_default(update) {
    return new Array(update.length);
  }

  // ../node_modules/d3-selection/src/selection/enter.js
  function enter_default() {
    return new Selection(this._enter || this._groups.map(sparse_default), this._parents);
  }
  function EnterNode(parent, datum2) {
    this.ownerDocument = parent.ownerDocument;
    this.namespaceURI = parent.namespaceURI;
    this._next = null;
    this._parent = parent;
    this.__data__ = datum2;
  }
  EnterNode.prototype = {
    constructor: EnterNode,
    appendChild: function(child) {
      return this._parent.insertBefore(child, this._next);
    },
    insertBefore: function(child, next) {
      return this._parent.insertBefore(child, next);
    },
    querySelector: function(selector) {
      return this._parent.querySelector(selector);
    },
    querySelectorAll: function(selector) {
      return this._parent.querySelectorAll(selector);
    }
  };

  // ../node_modules/d3-selection/src/constant.js
  function constant_default(x3) {
    return function() {
      return x3;
    };
  }

  // ../node_modules/d3-selection/src/selection/data.js
  function bindIndex(parent, group, enter, update, exit, data) {
    var i3 = 0, node, groupLength = group.length, dataLength = data.length;
    for (; i3 < dataLength; ++i3) {
      if (node = group[i3]) {
        node.__data__ = data[i3];
        update[i3] = node;
      } else {
        enter[i3] = new EnterNode(parent, data[i3]);
      }
    }
    for (; i3 < groupLength; ++i3) {
      if (node = group[i3]) {
        exit[i3] = node;
      }
    }
  }
  function bindKey(parent, group, enter, update, exit, data, key) {
    var i3, node, nodeByKeyValue = /* @__PURE__ */ new Map(), groupLength = group.length, dataLength = data.length, keyValues = new Array(groupLength), keyValue;
    for (i3 = 0; i3 < groupLength; ++i3) {
      if (node = group[i3]) {
        keyValues[i3] = keyValue = key.call(node, node.__data__, i3, group) + "";
        if (nodeByKeyValue.has(keyValue)) {
          exit[i3] = node;
        } else {
          nodeByKeyValue.set(keyValue, node);
        }
      }
    }
    for (i3 = 0; i3 < dataLength; ++i3) {
      keyValue = key.call(parent, data[i3], i3, data) + "";
      if (node = nodeByKeyValue.get(keyValue)) {
        update[i3] = node;
        node.__data__ = data[i3];
        nodeByKeyValue.delete(keyValue);
      } else {
        enter[i3] = new EnterNode(parent, data[i3]);
      }
    }
    for (i3 = 0; i3 < groupLength; ++i3) {
      if ((node = group[i3]) && nodeByKeyValue.get(keyValues[i3]) === node) {
        exit[i3] = node;
      }
    }
  }
  function datum(node) {
    return node.__data__;
  }
  function data_default(value, key) {
    if (!arguments.length)
      return Array.from(this, datum);
    var bind = key ? bindKey : bindIndex, parents = this._parents, groups = this._groups;
    if (typeof value !== "function")
      value = constant_default(value);
    for (var m3 = groups.length, update = new Array(m3), enter = new Array(m3), exit = new Array(m3), j4 = 0; j4 < m3; ++j4) {
      var parent = parents[j4], group = groups[j4], groupLength = group.length, data = arraylike(value.call(parent, parent && parent.__data__, j4, parents)), dataLength = data.length, enterGroup = enter[j4] = new Array(dataLength), updateGroup = update[j4] = new Array(dataLength), exitGroup = exit[j4] = new Array(groupLength);
      bind(parent, group, enterGroup, updateGroup, exitGroup, data, key);
      for (var i0 = 0, i1 = 0, previous, next; i0 < dataLength; ++i0) {
        if (previous = enterGroup[i0]) {
          if (i0 >= i1)
            i1 = i0 + 1;
          while (!(next = updateGroup[i1]) && ++i1 < dataLength)
            ;
          previous._next = next || null;
        }
      }
    }
    update = new Selection(update, parents);
    update._enter = enter;
    update._exit = exit;
    return update;
  }
  function arraylike(data) {
    return typeof data === "object" && "length" in data ? data : Array.from(data);
  }

  // ../node_modules/d3-selection/src/selection/exit.js
  function exit_default() {
    return new Selection(this._exit || this._groups.map(sparse_default), this._parents);
  }

  // ../node_modules/d3-selection/src/selection/join.js
  function join_default(onenter, onupdate, onexit) {
    var enter = this.enter(), update = this, exit = this.exit();
    if (typeof onenter === "function") {
      enter = onenter(enter);
      if (enter)
        enter = enter.selection();
    } else {
      enter = enter.append(onenter + "");
    }
    if (onupdate != null) {
      update = onupdate(update);
      if (update)
        update = update.selection();
    }
    if (onexit == null)
      exit.remove();
    else
      onexit(exit);
    return enter && update ? enter.merge(update).order() : update;
  }

  // ../node_modules/d3-selection/src/selection/merge.js
  function merge_default(context) {
    var selection2 = context.selection ? context.selection() : context;
    for (var groups0 = this._groups, groups1 = selection2._groups, m0 = groups0.length, m1 = groups1.length, m3 = Math.min(m0, m1), merges = new Array(m0), j4 = 0; j4 < m3; ++j4) {
      for (var group0 = groups0[j4], group1 = groups1[j4], n2 = group0.length, merge = merges[j4] = new Array(n2), node, i3 = 0; i3 < n2; ++i3) {
        if (node = group0[i3] || group1[i3]) {
          merge[i3] = node;
        }
      }
    }
    for (; j4 < m0; ++j4) {
      merges[j4] = groups0[j4];
    }
    return new Selection(merges, this._parents);
  }

  // ../node_modules/d3-selection/src/selection/order.js
  function order_default() {
    for (var groups = this._groups, j4 = -1, m3 = groups.length; ++j4 < m3; ) {
      for (var group = groups[j4], i3 = group.length - 1, next = group[i3], node; --i3 >= 0; ) {
        if (node = group[i3]) {
          if (next && node.compareDocumentPosition(next) ^ 4)
            next.parentNode.insertBefore(node, next);
          next = node;
        }
      }
    }
    return this;
  }

  // ../node_modules/d3-selection/src/selection/sort.js
  function sort_default(compare) {
    if (!compare)
      compare = ascending2;
    function compareNode(a3, b3) {
      return a3 && b3 ? compare(a3.__data__, b3.__data__) : !a3 - !b3;
    }
    for (var groups = this._groups, m3 = groups.length, sortgroups = new Array(m3), j4 = 0; j4 < m3; ++j4) {
      for (var group = groups[j4], n2 = group.length, sortgroup = sortgroups[j4] = new Array(n2), node, i3 = 0; i3 < n2; ++i3) {
        if (node = group[i3]) {
          sortgroup[i3] = node;
        }
      }
      sortgroup.sort(compareNode);
    }
    return new Selection(sortgroups, this._parents).order();
  }
  function ascending2(a3, b3) {
    return a3 < b3 ? -1 : a3 > b3 ? 1 : a3 >= b3 ? 0 : NaN;
  }

  // ../node_modules/d3-selection/src/selection/call.js
  function call_default() {
    var callback = arguments[0];
    arguments[0] = this;
    callback.apply(null, arguments);
    return this;
  }

  // ../node_modules/d3-selection/src/selection/nodes.js
  function nodes_default() {
    return Array.from(this);
  }

  // ../node_modules/d3-selection/src/selection/node.js
  function node_default() {
    for (var groups = this._groups, j4 = 0, m3 = groups.length; j4 < m3; ++j4) {
      for (var group = groups[j4], i3 = 0, n2 = group.length; i3 < n2; ++i3) {
        var node = group[i3];
        if (node)
          return node;
      }
    }
    return null;
  }

  // ../node_modules/d3-selection/src/selection/size.js
  function size_default() {
    let size = 0;
    for (const node of this)
      ++size;
    return size;
  }

  // ../node_modules/d3-selection/src/selection/empty.js
  function empty_default() {
    return !this.node();
  }

  // ../node_modules/d3-selection/src/selection/each.js
  function each_default(callback) {
    for (var groups = this._groups, j4 = 0, m3 = groups.length; j4 < m3; ++j4) {
      for (var group = groups[j4], i3 = 0, n2 = group.length, node; i3 < n2; ++i3) {
        if (node = group[i3])
          callback.call(node, node.__data__, i3, group);
      }
    }
    return this;
  }

  // ../node_modules/d3-selection/src/selection/attr.js
  function attrRemove(name) {
    return function() {
      this.removeAttribute(name);
    };
  }
  function attrRemoveNS(fullname) {
    return function() {
      this.removeAttributeNS(fullname.space, fullname.local);
    };
  }
  function attrConstant(name, value) {
    return function() {
      this.setAttribute(name, value);
    };
  }
  function attrConstantNS(fullname, value) {
    return function() {
      this.setAttributeNS(fullname.space, fullname.local, value);
    };
  }
  function attrFunction(name, value) {
    return function() {
      var v3 = value.apply(this, arguments);
      if (v3 == null)
        this.removeAttribute(name);
      else
        this.setAttribute(name, v3);
    };
  }
  function attrFunctionNS(fullname, value) {
    return function() {
      var v3 = value.apply(this, arguments);
      if (v3 == null)
        this.removeAttributeNS(fullname.space, fullname.local);
      else
        this.setAttributeNS(fullname.space, fullname.local, v3);
    };
  }
  function attr_default(name, value) {
    var fullname = namespace_default(name);
    if (arguments.length < 2) {
      var node = this.node();
      return fullname.local ? node.getAttributeNS(fullname.space, fullname.local) : node.getAttribute(fullname);
    }
    return this.each((value == null ? fullname.local ? attrRemoveNS : attrRemove : typeof value === "function" ? fullname.local ? attrFunctionNS : attrFunction : fullname.local ? attrConstantNS : attrConstant)(fullname, value));
  }

  // ../node_modules/d3-selection/src/window.js
  function window_default(node) {
    return node.ownerDocument && node.ownerDocument.defaultView || node.document && node || node.defaultView;
  }

  // ../node_modules/d3-selection/src/selection/style.js
  function styleRemove(name) {
    return function() {
      this.style.removeProperty(name);
    };
  }
  function styleConstant(name, value, priority) {
    return function() {
      this.style.setProperty(name, value, priority);
    };
  }
  function styleFunction(name, value, priority) {
    return function() {
      var v3 = value.apply(this, arguments);
      if (v3 == null)
        this.style.removeProperty(name);
      else
        this.style.setProperty(name, v3, priority);
    };
  }
  function style_default(name, value, priority) {
    return arguments.length > 1 ? this.each((value == null ? styleRemove : typeof value === "function" ? styleFunction : styleConstant)(name, value, priority == null ? "" : priority)) : styleValue(this.node(), name);
  }
  function styleValue(node, name) {
    return node.style.getPropertyValue(name) || window_default(node).getComputedStyle(node, null).getPropertyValue(name);
  }

  // ../node_modules/d3-selection/src/selection/property.js
  function propertyRemove(name) {
    return function() {
      delete this[name];
    };
  }
  function propertyConstant(name, value) {
    return function() {
      this[name] = value;
    };
  }
  function propertyFunction(name, value) {
    return function() {
      var v3 = value.apply(this, arguments);
      if (v3 == null)
        delete this[name];
      else
        this[name] = v3;
    };
  }
  function property_default(name, value) {
    return arguments.length > 1 ? this.each((value == null ? propertyRemove : typeof value === "function" ? propertyFunction : propertyConstant)(name, value)) : this.node()[name];
  }

  // ../node_modules/d3-selection/src/selection/classed.js
  function classArray(string) {
    return string.trim().split(/^|\s+/);
  }
  function classList(node) {
    return node.classList || new ClassList(node);
  }
  function ClassList(node) {
    this._node = node;
    this._names = classArray(node.getAttribute("class") || "");
  }
  ClassList.prototype = {
    add: function(name) {
      var i3 = this._names.indexOf(name);
      if (i3 < 0) {
        this._names.push(name);
        this._node.setAttribute("class", this._names.join(" "));
      }
    },
    remove: function(name) {
      var i3 = this._names.indexOf(name);
      if (i3 >= 0) {
        this._names.splice(i3, 1);
        this._node.setAttribute("class", this._names.join(" "));
      }
    },
    contains: function(name) {
      return this._names.indexOf(name) >= 0;
    }
  };
  function classedAdd(node, names) {
    var list = classList(node), i3 = -1, n2 = names.length;
    while (++i3 < n2)
      list.add(names[i3]);
  }
  function classedRemove(node, names) {
    var list = classList(node), i3 = -1, n2 = names.length;
    while (++i3 < n2)
      list.remove(names[i3]);
  }
  function classedTrue(names) {
    return function() {
      classedAdd(this, names);
    };
  }
  function classedFalse(names) {
    return function() {
      classedRemove(this, names);
    };
  }
  function classedFunction(names, value) {
    return function() {
      (value.apply(this, arguments) ? classedAdd : classedRemove)(this, names);
    };
  }
  function classed_default(name, value) {
    var names = classArray(name + "");
    if (arguments.length < 2) {
      var list = classList(this.node()), i3 = -1, n2 = names.length;
      while (++i3 < n2)
        if (!list.contains(names[i3]))
          return false;
      return true;
    }
    return this.each((typeof value === "function" ? classedFunction : value ? classedTrue : classedFalse)(names, value));
  }

  // ../node_modules/d3-selection/src/selection/text.js
  function textRemove() {
    this.textContent = "";
  }
  function textConstant(value) {
    return function() {
      this.textContent = value;
    };
  }
  function textFunction(value) {
    return function() {
      var v3 = value.apply(this, arguments);
      this.textContent = v3 == null ? "" : v3;
    };
  }
  function text_default(value) {
    return arguments.length ? this.each(value == null ? textRemove : (typeof value === "function" ? textFunction : textConstant)(value)) : this.node().textContent;
  }

  // ../node_modules/d3-selection/src/selection/html.js
  function htmlRemove() {
    this.innerHTML = "";
  }
  function htmlConstant(value) {
    return function() {
      this.innerHTML = value;
    };
  }
  function htmlFunction(value) {
    return function() {
      var v3 = value.apply(this, arguments);
      this.innerHTML = v3 == null ? "" : v3;
    };
  }
  function html_default(value) {
    return arguments.length ? this.each(value == null ? htmlRemove : (typeof value === "function" ? htmlFunction : htmlConstant)(value)) : this.node().innerHTML;
  }

  // ../node_modules/d3-selection/src/selection/raise.js
  function raise() {
    if (this.nextSibling)
      this.parentNode.appendChild(this);
  }
  function raise_default() {
    return this.each(raise);
  }

  // ../node_modules/d3-selection/src/selection/lower.js
  function lower() {
    if (this.previousSibling)
      this.parentNode.insertBefore(this, this.parentNode.firstChild);
  }
  function lower_default() {
    return this.each(lower);
  }

  // ../node_modules/d3-selection/src/selection/append.js
  function append_default(name) {
    var create2 = typeof name === "function" ? name : creator_default(name);
    return this.select(function() {
      return this.appendChild(create2.apply(this, arguments));
    });
  }

  // ../node_modules/d3-selection/src/selection/insert.js
  function constantNull() {
    return null;
  }
  function insert_default(name, before) {
    var create2 = typeof name === "function" ? name : creator_default(name), select = before == null ? constantNull : typeof before === "function" ? before : selector_default(before);
    return this.select(function() {
      return this.insertBefore(create2.apply(this, arguments), select.apply(this, arguments) || null);
    });
  }

  // ../node_modules/d3-selection/src/selection/remove.js
  function remove() {
    var parent = this.parentNode;
    if (parent)
      parent.removeChild(this);
  }
  function remove_default() {
    return this.each(remove);
  }

  // ../node_modules/d3-selection/src/selection/clone.js
  function selection_cloneShallow() {
    var clone = this.cloneNode(false), parent = this.parentNode;
    return parent ? parent.insertBefore(clone, this.nextSibling) : clone;
  }
  function selection_cloneDeep() {
    var clone = this.cloneNode(true), parent = this.parentNode;
    return parent ? parent.insertBefore(clone, this.nextSibling) : clone;
  }
  function clone_default(deep) {
    return this.select(deep ? selection_cloneDeep : selection_cloneShallow);
  }

  // ../node_modules/d3-selection/src/selection/datum.js
  function datum_default(value) {
    return arguments.length ? this.property("__data__", value) : this.node().__data__;
  }

  // ../node_modules/d3-selection/src/selection/on.js
  function contextListener(listener) {
    return function(event) {
      listener.call(this, event, this.__data__);
    };
  }
  function parseTypenames2(typenames) {
    return typenames.trim().split(/^|\s+/).map(function(t3) {
      var name = "", i3 = t3.indexOf(".");
      if (i3 >= 0)
        name = t3.slice(i3 + 1), t3 = t3.slice(0, i3);
      return { type: t3, name };
    });
  }
  function onRemove(typename) {
    return function() {
      var on = this.__on;
      if (!on)
        return;
      for (var j4 = 0, i3 = -1, m3 = on.length, o3; j4 < m3; ++j4) {
        if (o3 = on[j4], (!typename.type || o3.type === typename.type) && o3.name === typename.name) {
          this.removeEventListener(o3.type, o3.listener, o3.options);
        } else {
          on[++i3] = o3;
        }
      }
      if (++i3)
        on.length = i3;
      else
        delete this.__on;
    };
  }
  function onAdd(typename, value, options) {
    return function() {
      var on = this.__on, o3, listener = contextListener(value);
      if (on)
        for (var j4 = 0, m3 = on.length; j4 < m3; ++j4) {
          if ((o3 = on[j4]).type === typename.type && o3.name === typename.name) {
            this.removeEventListener(o3.type, o3.listener, o3.options);
            this.addEventListener(o3.type, o3.listener = listener, o3.options = options);
            o3.value = value;
            return;
          }
        }
      this.addEventListener(typename.type, listener, options);
      o3 = { type: typename.type, name: typename.name, value, listener, options };
      if (!on)
        this.__on = [o3];
      else
        on.push(o3);
    };
  }
  function on_default(typename, value, options) {
    var typenames = parseTypenames2(typename + ""), i3, n2 = typenames.length, t3;
    if (arguments.length < 2) {
      var on = this.node().__on;
      if (on)
        for (var j4 = 0, m3 = on.length, o3; j4 < m3; ++j4) {
          for (i3 = 0, o3 = on[j4]; i3 < n2; ++i3) {
            if ((t3 = typenames[i3]).type === o3.type && t3.name === o3.name) {
              return o3.value;
            }
          }
        }
      return;
    }
    on = value ? onAdd : onRemove;
    for (i3 = 0; i3 < n2; ++i3)
      this.each(on(typenames[i3], value, options));
    return this;
  }

  // ../node_modules/d3-selection/src/selection/dispatch.js
  function dispatchEvent(node, type2, params) {
    var window2 = window_default(node), event = window2.CustomEvent;
    if (typeof event === "function") {
      event = new event(type2, params);
    } else {
      event = window2.document.createEvent("Event");
      if (params)
        event.initEvent(type2, params.bubbles, params.cancelable), event.detail = params.detail;
      else
        event.initEvent(type2, false, false);
    }
    node.dispatchEvent(event);
  }
  function dispatchConstant(type2, params) {
    return function() {
      return dispatchEvent(this, type2, params);
    };
  }
  function dispatchFunction(type2, params) {
    return function() {
      return dispatchEvent(this, type2, params.apply(this, arguments));
    };
  }
  function dispatch_default2(type2, params) {
    return this.each((typeof params === "function" ? dispatchFunction : dispatchConstant)(type2, params));
  }

  // ../node_modules/d3-selection/src/selection/iterator.js
  function* iterator_default() {
    for (var groups = this._groups, j4 = 0, m3 = groups.length; j4 < m3; ++j4) {
      for (var group = groups[j4], i3 = 0, n2 = group.length, node; i3 < n2; ++i3) {
        if (node = group[i3])
          yield node;
      }
    }
  }

  // ../node_modules/d3-selection/src/selection/index.js
  var root = [null];
  function Selection(groups, parents) {
    this._groups = groups;
    this._parents = parents;
  }
  function selection() {
    return new Selection([[document.documentElement]], root);
  }
  function selection_selection() {
    return this;
  }
  Selection.prototype = selection.prototype = {
    constructor: Selection,
    select: select_default,
    selectAll: selectAll_default,
    selectChild: selectChild_default,
    selectChildren: selectChildren_default,
    filter: filter_default,
    data: data_default,
    enter: enter_default,
    exit: exit_default,
    join: join_default,
    merge: merge_default,
    selection: selection_selection,
    order: order_default,
    sort: sort_default,
    call: call_default,
    nodes: nodes_default,
    node: node_default,
    size: size_default,
    empty: empty_default,
    each: each_default,
    attr: attr_default,
    style: style_default,
    property: property_default,
    classed: classed_default,
    text: text_default,
    html: html_default,
    raise: raise_default,
    lower: lower_default,
    append: append_default,
    insert: insert_default,
    remove: remove_default,
    clone: clone_default,
    datum: datum_default,
    on: on_default,
    dispatch: dispatch_default2,
    [Symbol.iterator]: iterator_default
  };
  var selection_default = selection;

  // ../node_modules/d3-selection/src/select.js
  function select_default2(selector) {
    return typeof selector === "string" ? new Selection([[document.querySelector(selector)]], [document.documentElement]) : new Selection([[selector]], root);
  }

  // ../node_modules/d3-color/src/define.js
  function define_default(constructor, factory, prototype) {
    constructor.prototype = factory.prototype = prototype;
    prototype.constructor = constructor;
  }
  function extend(parent, definition) {
    var prototype = Object.create(parent.prototype);
    for (var key in definition)
      prototype[key] = definition[key];
    return prototype;
  }

  // ../node_modules/d3-color/src/color.js
  function Color() {
  }
  var darker = 0.7;
  var brighter = 1 / darker;
  var reI = "\\s*([+-]?\\d+)\\s*";
  var reN = "\\s*([+-]?(?:\\d*\\.)?\\d+(?:[eE][+-]?\\d+)?)\\s*";
  var reP = "\\s*([+-]?(?:\\d*\\.)?\\d+(?:[eE][+-]?\\d+)?)%\\s*";
  var reHex = /^#([0-9a-f]{3,8})$/;
  var reRgbInteger = new RegExp(`^rgb\\(${reI},${reI},${reI}\\)$`);
  var reRgbPercent = new RegExp(`^rgb\\(${reP},${reP},${reP}\\)$`);
  var reRgbaInteger = new RegExp(`^rgba\\(${reI},${reI},${reI},${reN}\\)$`);
  var reRgbaPercent = new RegExp(`^rgba\\(${reP},${reP},${reP},${reN}\\)$`);
  var reHslPercent = new RegExp(`^hsl\\(${reN},${reP},${reP}\\)$`);
  var reHslaPercent = new RegExp(`^hsla\\(${reN},${reP},${reP},${reN}\\)$`);
  var named = {
    aliceblue: 15792383,
    antiquewhite: 16444375,
    aqua: 65535,
    aquamarine: 8388564,
    azure: 15794175,
    beige: 16119260,
    bisque: 16770244,
    black: 0,
    blanchedalmond: 16772045,
    blue: 255,
    blueviolet: 9055202,
    brown: 10824234,
    burlywood: 14596231,
    cadetblue: 6266528,
    chartreuse: 8388352,
    chocolate: 13789470,
    coral: 16744272,
    cornflowerblue: 6591981,
    cornsilk: 16775388,
    crimson: 14423100,
    cyan: 65535,
    darkblue: 139,
    darkcyan: 35723,
    darkgoldenrod: 12092939,
    darkgray: 11119017,
    darkgreen: 25600,
    darkgrey: 11119017,
    darkkhaki: 12433259,
    darkmagenta: 9109643,
    darkolivegreen: 5597999,
    darkorange: 16747520,
    darkorchid: 10040012,
    darkred: 9109504,
    darksalmon: 15308410,
    darkseagreen: 9419919,
    darkslateblue: 4734347,
    darkslategray: 3100495,
    darkslategrey: 3100495,
    darkturquoise: 52945,
    darkviolet: 9699539,
    deeppink: 16716947,
    deepskyblue: 49151,
    dimgray: 6908265,
    dimgrey: 6908265,
    dodgerblue: 2003199,
    firebrick: 11674146,
    floralwhite: 16775920,
    forestgreen: 2263842,
    fuchsia: 16711935,
    gainsboro: 14474460,
    ghostwhite: 16316671,
    gold: 16766720,
    goldenrod: 14329120,
    gray: 8421504,
    green: 32768,
    greenyellow: 11403055,
    grey: 8421504,
    honeydew: 15794160,
    hotpink: 16738740,
    indianred: 13458524,
    indigo: 4915330,
    ivory: 16777200,
    khaki: 15787660,
    lavender: 15132410,
    lavenderblush: 16773365,
    lawngreen: 8190976,
    lemonchiffon: 16775885,
    lightblue: 11393254,
    lightcoral: 15761536,
    lightcyan: 14745599,
    lightgoldenrodyellow: 16448210,
    lightgray: 13882323,
    lightgreen: 9498256,
    lightgrey: 13882323,
    lightpink: 16758465,
    lightsalmon: 16752762,
    lightseagreen: 2142890,
    lightskyblue: 8900346,
    lightslategray: 7833753,
    lightslategrey: 7833753,
    lightsteelblue: 11584734,
    lightyellow: 16777184,
    lime: 65280,
    limegreen: 3329330,
    linen: 16445670,
    magenta: 16711935,
    maroon: 8388608,
    mediumaquamarine: 6737322,
    mediumblue: 205,
    mediumorchid: 12211667,
    mediumpurple: 9662683,
    mediumseagreen: 3978097,
    mediumslateblue: 8087790,
    mediumspringgreen: 64154,
    mediumturquoise: 4772300,
    mediumvioletred: 13047173,
    midnightblue: 1644912,
    mintcream: 16121850,
    mistyrose: 16770273,
    moccasin: 16770229,
    navajowhite: 16768685,
    navy: 128,
    oldlace: 16643558,
    olive: 8421376,
    olivedrab: 7048739,
    orange: 16753920,
    orangered: 16729344,
    orchid: 14315734,
    palegoldenrod: 15657130,
    palegreen: 10025880,
    paleturquoise: 11529966,
    palevioletred: 14381203,
    papayawhip: 16773077,
    peachpuff: 16767673,
    peru: 13468991,
    pink: 16761035,
    plum: 14524637,
    powderblue: 11591910,
    purple: 8388736,
    rebeccapurple: 6697881,
    red: 16711680,
    rosybrown: 12357519,
    royalblue: 4286945,
    saddlebrown: 9127187,
    salmon: 16416882,
    sandybrown: 16032864,
    seagreen: 3050327,
    seashell: 16774638,
    sienna: 10506797,
    silver: 12632256,
    skyblue: 8900331,
    slateblue: 6970061,
    slategray: 7372944,
    slategrey: 7372944,
    snow: 16775930,
    springgreen: 65407,
    steelblue: 4620980,
    tan: 13808780,
    teal: 32896,
    thistle: 14204888,
    tomato: 16737095,
    turquoise: 4251856,
    violet: 15631086,
    wheat: 16113331,
    white: 16777215,
    whitesmoke: 16119285,
    yellow: 16776960,
    yellowgreen: 10145074
  };
  define_default(Color, color, {
    copy(channels) {
      return Object.assign(new this.constructor(), this, channels);
    },
    displayable() {
      return this.rgb().displayable();
    },
    hex: color_formatHex,
    formatHex: color_formatHex,
    formatHex8: color_formatHex8,
    formatHsl: color_formatHsl,
    formatRgb: color_formatRgb,
    toString: color_formatRgb
  });
  function color_formatHex() {
    return this.rgb().formatHex();
  }
  function color_formatHex8() {
    return this.rgb().formatHex8();
  }
  function color_formatHsl() {
    return hslConvert(this).formatHsl();
  }
  function color_formatRgb() {
    return this.rgb().formatRgb();
  }
  function color(format2) {
    var m3, l3;
    format2 = (format2 + "").trim().toLowerCase();
    return (m3 = reHex.exec(format2)) ? (l3 = m3[1].length, m3 = parseInt(m3[1], 16), l3 === 6 ? rgbn(m3) : l3 === 3 ? new Rgb(m3 >> 8 & 15 | m3 >> 4 & 240, m3 >> 4 & 15 | m3 & 240, (m3 & 15) << 4 | m3 & 15, 1) : l3 === 8 ? rgba(m3 >> 24 & 255, m3 >> 16 & 255, m3 >> 8 & 255, (m3 & 255) / 255) : l3 === 4 ? rgba(m3 >> 12 & 15 | m3 >> 8 & 240, m3 >> 8 & 15 | m3 >> 4 & 240, m3 >> 4 & 15 | m3 & 240, ((m3 & 15) << 4 | m3 & 15) / 255) : null) : (m3 = reRgbInteger.exec(format2)) ? new Rgb(m3[1], m3[2], m3[3], 1) : (m3 = reRgbPercent.exec(format2)) ? new Rgb(m3[1] * 255 / 100, m3[2] * 255 / 100, m3[3] * 255 / 100, 1) : (m3 = reRgbaInteger.exec(format2)) ? rgba(m3[1], m3[2], m3[3], m3[4]) : (m3 = reRgbaPercent.exec(format2)) ? rgba(m3[1] * 255 / 100, m3[2] * 255 / 100, m3[3] * 255 / 100, m3[4]) : (m3 = reHslPercent.exec(format2)) ? hsla(m3[1], m3[2] / 100, m3[3] / 100, 1) : (m3 = reHslaPercent.exec(format2)) ? hsla(m3[1], m3[2] / 100, m3[3] / 100, m3[4]) : named.hasOwnProperty(format2) ? rgbn(named[format2]) : format2 === "transparent" ? new Rgb(NaN, NaN, NaN, 0) : null;
  }
  function rgbn(n2) {
    return new Rgb(n2 >> 16 & 255, n2 >> 8 & 255, n2 & 255, 1);
  }
  function rgba(r3, g3, b3, a3) {
    if (a3 <= 0)
      r3 = g3 = b3 = NaN;
    return new Rgb(r3, g3, b3, a3);
  }
  function rgbConvert(o3) {
    if (!(o3 instanceof Color))
      o3 = color(o3);
    if (!o3)
      return new Rgb();
    o3 = o3.rgb();
    return new Rgb(o3.r, o3.g, o3.b, o3.opacity);
  }
  function rgb(r3, g3, b3, opacity) {
    return arguments.length === 1 ? rgbConvert(r3) : new Rgb(r3, g3, b3, opacity == null ? 1 : opacity);
  }
  function Rgb(r3, g3, b3, opacity) {
    this.r = +r3;
    this.g = +g3;
    this.b = +b3;
    this.opacity = +opacity;
  }
  define_default(Rgb, rgb, extend(Color, {
    brighter(k3) {
      k3 = k3 == null ? brighter : Math.pow(brighter, k3);
      return new Rgb(this.r * k3, this.g * k3, this.b * k3, this.opacity);
    },
    darker(k3) {
      k3 = k3 == null ? darker : Math.pow(darker, k3);
      return new Rgb(this.r * k3, this.g * k3, this.b * k3, this.opacity);
    },
    rgb() {
      return this;
    },
    clamp() {
      return new Rgb(clampi(this.r), clampi(this.g), clampi(this.b), clampa(this.opacity));
    },
    displayable() {
      return -0.5 <= this.r && this.r < 255.5 && (-0.5 <= this.g && this.g < 255.5) && (-0.5 <= this.b && this.b < 255.5) && (0 <= this.opacity && this.opacity <= 1);
    },
    hex: rgb_formatHex,
    formatHex: rgb_formatHex,
    formatHex8: rgb_formatHex8,
    formatRgb: rgb_formatRgb,
    toString: rgb_formatRgb
  }));
  function rgb_formatHex() {
    return `#${hex(this.r)}${hex(this.g)}${hex(this.b)}`;
  }
  function rgb_formatHex8() {
    return `#${hex(this.r)}${hex(this.g)}${hex(this.b)}${hex((isNaN(this.opacity) ? 1 : this.opacity) * 255)}`;
  }
  function rgb_formatRgb() {
    const a3 = clampa(this.opacity);
    return `${a3 === 1 ? "rgb(" : "rgba("}${clampi(this.r)}, ${clampi(this.g)}, ${clampi(this.b)}${a3 === 1 ? ")" : `, ${a3})`}`;
  }
  function clampa(opacity) {
    return isNaN(opacity) ? 1 : Math.max(0, Math.min(1, opacity));
  }
  function clampi(value) {
    return Math.max(0, Math.min(255, Math.round(value) || 0));
  }
  function hex(value) {
    value = clampi(value);
    return (value < 16 ? "0" : "") + value.toString(16);
  }
  function hsla(h3, s3, l3, a3) {
    if (a3 <= 0)
      h3 = s3 = l3 = NaN;
    else if (l3 <= 0 || l3 >= 1)
      h3 = s3 = NaN;
    else if (s3 <= 0)
      h3 = NaN;
    return new Hsl(h3, s3, l3, a3);
  }
  function hslConvert(o3) {
    if (o3 instanceof Hsl)
      return new Hsl(o3.h, o3.s, o3.l, o3.opacity);
    if (!(o3 instanceof Color))
      o3 = color(o3);
    if (!o3)
      return new Hsl();
    if (o3 instanceof Hsl)
      return o3;
    o3 = o3.rgb();
    var r3 = o3.r / 255, g3 = o3.g / 255, b3 = o3.b / 255, min3 = Math.min(r3, g3, b3), max3 = Math.max(r3, g3, b3), h3 = NaN, s3 = max3 - min3, l3 = (max3 + min3) / 2;
    if (s3) {
      if (r3 === max3)
        h3 = (g3 - b3) / s3 + (g3 < b3) * 6;
      else if (g3 === max3)
        h3 = (b3 - r3) / s3 + 2;
      else
        h3 = (r3 - g3) / s3 + 4;
      s3 /= l3 < 0.5 ? max3 + min3 : 2 - max3 - min3;
      h3 *= 60;
    } else {
      s3 = l3 > 0 && l3 < 1 ? 0 : h3;
    }
    return new Hsl(h3, s3, l3, o3.opacity);
  }
  function hsl(h3, s3, l3, opacity) {
    return arguments.length === 1 ? hslConvert(h3) : new Hsl(h3, s3, l3, opacity == null ? 1 : opacity);
  }
  function Hsl(h3, s3, l3, opacity) {
    this.h = +h3;
    this.s = +s3;
    this.l = +l3;
    this.opacity = +opacity;
  }
  define_default(Hsl, hsl, extend(Color, {
    brighter(k3) {
      k3 = k3 == null ? brighter : Math.pow(brighter, k3);
      return new Hsl(this.h, this.s, this.l * k3, this.opacity);
    },
    darker(k3) {
      k3 = k3 == null ? darker : Math.pow(darker, k3);
      return new Hsl(this.h, this.s, this.l * k3, this.opacity);
    },
    rgb() {
      var h3 = this.h % 360 + (this.h < 0) * 360, s3 = isNaN(h3) || isNaN(this.s) ? 0 : this.s, l3 = this.l, m22 = l3 + (l3 < 0.5 ? l3 : 1 - l3) * s3, m1 = 2 * l3 - m22;
      return new Rgb(hsl2rgb(h3 >= 240 ? h3 - 240 : h3 + 120, m1, m22), hsl2rgb(h3, m1, m22), hsl2rgb(h3 < 120 ? h3 + 240 : h3 - 120, m1, m22), this.opacity);
    },
    clamp() {
      return new Hsl(clamph(this.h), clampt(this.s), clampt(this.l), clampa(this.opacity));
    },
    displayable() {
      return (0 <= this.s && this.s <= 1 || isNaN(this.s)) && (0 <= this.l && this.l <= 1) && (0 <= this.opacity && this.opacity <= 1);
    },
    formatHsl() {
      const a3 = clampa(this.opacity);
      return `${a3 === 1 ? "hsl(" : "hsla("}${clamph(this.h)}, ${clampt(this.s) * 100}%, ${clampt(this.l) * 100}%${a3 === 1 ? ")" : `, ${a3})`}`;
    }
  }));
  function clamph(value) {
    value = (value || 0) % 360;
    return value < 0 ? value + 360 : value;
  }
  function clampt(value) {
    return Math.max(0, Math.min(1, value || 0));
  }
  function hsl2rgb(h3, m1, m22) {
    return (h3 < 60 ? m1 + (m22 - m1) * h3 / 60 : h3 < 180 ? m22 : h3 < 240 ? m1 + (m22 - m1) * (240 - h3) / 60 : m1) * 255;
  }

  // ../node_modules/d3-interpolate/src/basis.js
  function basis(t1, v0, v1, v22, v3) {
    var t22 = t1 * t1, t3 = t22 * t1;
    return ((1 - 3 * t1 + 3 * t22 - t3) * v0 + (4 - 6 * t22 + 3 * t3) * v1 + (1 + 3 * t1 + 3 * t22 - 3 * t3) * v22 + t3 * v3) / 6;
  }
  function basis_default(values) {
    var n2 = values.length - 1;
    return function(t3) {
      var i3 = t3 <= 0 ? t3 = 0 : t3 >= 1 ? (t3 = 1, n2 - 1) : Math.floor(t3 * n2), v1 = values[i3], v22 = values[i3 + 1], v0 = i3 > 0 ? values[i3 - 1] : 2 * v1 - v22, v3 = i3 < n2 - 1 ? values[i3 + 2] : 2 * v22 - v1;
      return basis((t3 - i3 / n2) * n2, v0, v1, v22, v3);
    };
  }

  // ../node_modules/d3-interpolate/src/basisClosed.js
  function basisClosed_default(values) {
    var n2 = values.length;
    return function(t3) {
      var i3 = Math.floor(((t3 %= 1) < 0 ? ++t3 : t3) * n2), v0 = values[(i3 + n2 - 1) % n2], v1 = values[i3 % n2], v22 = values[(i3 + 1) % n2], v3 = values[(i3 + 2) % n2];
      return basis((t3 - i3 / n2) * n2, v0, v1, v22, v3);
    };
  }

  // ../node_modules/d3-interpolate/src/constant.js
  var constant_default2 = (x3) => () => x3;

  // ../node_modules/d3-interpolate/src/color.js
  function linear(a3, d3) {
    return function(t3) {
      return a3 + t3 * d3;
    };
  }
  function exponential(a3, b3, y3) {
    return a3 = Math.pow(a3, y3), b3 = Math.pow(b3, y3) - a3, y3 = 1 / y3, function(t3) {
      return Math.pow(a3 + t3 * b3, y3);
    };
  }
  function gamma(y3) {
    return (y3 = +y3) === 1 ? nogamma : function(a3, b3) {
      return b3 - a3 ? exponential(a3, b3, y3) : constant_default2(isNaN(a3) ? b3 : a3);
    };
  }
  function nogamma(a3, b3) {
    var d3 = b3 - a3;
    return d3 ? linear(a3, d3) : constant_default2(isNaN(a3) ? b3 : a3);
  }

  // ../node_modules/d3-interpolate/src/rgb.js
  var rgb_default = function rgbGamma(y3) {
    var color2 = gamma(y3);
    function rgb2(start2, end) {
      var r3 = color2((start2 = rgb(start2)).r, (end = rgb(end)).r), g3 = color2(start2.g, end.g), b3 = color2(start2.b, end.b), opacity = nogamma(start2.opacity, end.opacity);
      return function(t3) {
        start2.r = r3(t3);
        start2.g = g3(t3);
        start2.b = b3(t3);
        start2.opacity = opacity(t3);
        return start2 + "";
      };
    }
    rgb2.gamma = rgbGamma;
    return rgb2;
  }(1);
  function rgbSpline(spline) {
    return function(colors) {
      var n2 = colors.length, r3 = new Array(n2), g3 = new Array(n2), b3 = new Array(n2), i3, color2;
      for (i3 = 0; i3 < n2; ++i3) {
        color2 = rgb(colors[i3]);
        r3[i3] = color2.r || 0;
        g3[i3] = color2.g || 0;
        b3[i3] = color2.b || 0;
      }
      r3 = spline(r3);
      g3 = spline(g3);
      b3 = spline(b3);
      color2.opacity = 1;
      return function(t3) {
        color2.r = r3(t3);
        color2.g = g3(t3);
        color2.b = b3(t3);
        return color2 + "";
      };
    };
  }
  var rgbBasis = rgbSpline(basis_default);
  var rgbBasisClosed = rgbSpline(basisClosed_default);

  // ../node_modules/d3-interpolate/src/number.js
  function number_default(a3, b3) {
    return a3 = +a3, b3 = +b3, function(t3) {
      return a3 * (1 - t3) + b3 * t3;
    };
  }

  // ../node_modules/d3-interpolate/src/string.js
  var reA = /[-+]?(?:\d+\.?\d*|\.?\d+)(?:[eE][-+]?\d+)?/g;
  var reB = new RegExp(reA.source, "g");
  function zero(b3) {
    return function() {
      return b3;
    };
  }
  function one(b3) {
    return function(t3) {
      return b3(t3) + "";
    };
  }
  function string_default(a3, b3) {
    var bi = reA.lastIndex = reB.lastIndex = 0, am, bm, bs, i3 = -1, s3 = [], q3 = [];
    a3 = a3 + "", b3 = b3 + "";
    while ((am = reA.exec(a3)) && (bm = reB.exec(b3))) {
      if ((bs = bm.index) > bi) {
        bs = b3.slice(bi, bs);
        if (s3[i3])
          s3[i3] += bs;
        else
          s3[++i3] = bs;
      }
      if ((am = am[0]) === (bm = bm[0])) {
        if (s3[i3])
          s3[i3] += bm;
        else
          s3[++i3] = bm;
      } else {
        s3[++i3] = null;
        q3.push({ i: i3, x: number_default(am, bm) });
      }
      bi = reB.lastIndex;
    }
    if (bi < b3.length) {
      bs = b3.slice(bi);
      if (s3[i3])
        s3[i3] += bs;
      else
        s3[++i3] = bs;
    }
    return s3.length < 2 ? q3[0] ? one(q3[0].x) : zero(b3) : (b3 = q3.length, function(t3) {
      for (var i4 = 0, o3; i4 < b3; ++i4)
        s3[(o3 = q3[i4]).i] = o3.x(t3);
      return s3.join("");
    });
  }

  // ../node_modules/d3-interpolate/src/transform/decompose.js
  var degrees = 180 / Math.PI;
  var identity = {
    translateX: 0,
    translateY: 0,
    rotate: 0,
    skewX: 0,
    scaleX: 1,
    scaleY: 1
  };
  function decompose_default(a3, b3, c3, d3, e3, f3) {
    var scaleX, scaleY, skewX;
    if (scaleX = Math.sqrt(a3 * a3 + b3 * b3))
      a3 /= scaleX, b3 /= scaleX;
    if (skewX = a3 * c3 + b3 * d3)
      c3 -= a3 * skewX, d3 -= b3 * skewX;
    if (scaleY = Math.sqrt(c3 * c3 + d3 * d3))
      c3 /= scaleY, d3 /= scaleY, skewX /= scaleY;
    if (a3 * d3 < b3 * c3)
      a3 = -a3, b3 = -b3, skewX = -skewX, scaleX = -scaleX;
    return {
      translateX: e3,
      translateY: f3,
      rotate: Math.atan2(b3, a3) * degrees,
      skewX: Math.atan(skewX) * degrees,
      scaleX,
      scaleY
    };
  }

  // ../node_modules/d3-interpolate/src/transform/parse.js
  var svgNode;
  function parseCss(value) {
    const m3 = new (typeof DOMMatrix === "function" ? DOMMatrix : WebKitCSSMatrix)(value + "");
    return m3.isIdentity ? identity : decompose_default(m3.a, m3.b, m3.c, m3.d, m3.e, m3.f);
  }
  function parseSvg(value) {
    if (value == null)
      return identity;
    if (!svgNode)
      svgNode = document.createElementNS("http://www.w3.org/2000/svg", "g");
    svgNode.setAttribute("transform", value);
    if (!(value = svgNode.transform.baseVal.consolidate()))
      return identity;
    value = value.matrix;
    return decompose_default(value.a, value.b, value.c, value.d, value.e, value.f);
  }

  // ../node_modules/d3-interpolate/src/transform/index.js
  function interpolateTransform(parse, pxComma, pxParen, degParen) {
    function pop(s3) {
      return s3.length ? s3.pop() + " " : "";
    }
    function translate(xa, ya, xb, yb, s3, q3) {
      if (xa !== xb || ya !== yb) {
        var i3 = s3.push("translate(", null, pxComma, null, pxParen);
        q3.push({ i: i3 - 4, x: number_default(xa, xb) }, { i: i3 - 2, x: number_default(ya, yb) });
      } else if (xb || yb) {
        s3.push("translate(" + xb + pxComma + yb + pxParen);
      }
    }
    function rotate(a3, b3, s3, q3) {
      if (a3 !== b3) {
        if (a3 - b3 > 180)
          b3 += 360;
        else if (b3 - a3 > 180)
          a3 += 360;
        q3.push({ i: s3.push(pop(s3) + "rotate(", null, degParen) - 2, x: number_default(a3, b3) });
      } else if (b3) {
        s3.push(pop(s3) + "rotate(" + b3 + degParen);
      }
    }
    function skewX(a3, b3, s3, q3) {
      if (a3 !== b3) {
        q3.push({ i: s3.push(pop(s3) + "skewX(", null, degParen) - 2, x: number_default(a3, b3) });
      } else if (b3) {
        s3.push(pop(s3) + "skewX(" + b3 + degParen);
      }
    }
    function scale(xa, ya, xb, yb, s3, q3) {
      if (xa !== xb || ya !== yb) {
        var i3 = s3.push(pop(s3) + "scale(", null, ",", null, ")");
        q3.push({ i: i3 - 4, x: number_default(xa, xb) }, { i: i3 - 2, x: number_default(ya, yb) });
      } else if (xb !== 1 || yb !== 1) {
        s3.push(pop(s3) + "scale(" + xb + "," + yb + ")");
      }
    }
    return function(a3, b3) {
      var s3 = [], q3 = [];
      a3 = parse(a3), b3 = parse(b3);
      translate(a3.translateX, a3.translateY, b3.translateX, b3.translateY, s3, q3);
      rotate(a3.rotate, b3.rotate, s3, q3);
      skewX(a3.skewX, b3.skewX, s3, q3);
      scale(a3.scaleX, a3.scaleY, b3.scaleX, b3.scaleY, s3, q3);
      a3 = b3 = null;
      return function(t3) {
        var i3 = -1, n2 = q3.length, o3;
        while (++i3 < n2)
          s3[(o3 = q3[i3]).i] = o3.x(t3);
        return s3.join("");
      };
    };
  }
  var interpolateTransformCss = interpolateTransform(parseCss, "px, ", "px)", "deg)");
  var interpolateTransformSvg = interpolateTransform(parseSvg, ", ", ")", ")");

  // ../node_modules/d3-timer/src/timer.js
  var frame = 0;
  var timeout = 0;
  var interval = 0;
  var pokeDelay = 1e3;
  var taskHead;
  var taskTail;
  var clockLast = 0;
  var clockNow = 0;
  var clockSkew = 0;
  var clock = typeof performance === "object" && performance.now ? performance : Date;
  var setFrame = typeof window === "object" && window.requestAnimationFrame ? window.requestAnimationFrame.bind(window) : function(f3) {
    setTimeout(f3, 17);
  };
  function now() {
    return clockNow || (setFrame(clearNow), clockNow = clock.now() + clockSkew);
  }
  function clearNow() {
    clockNow = 0;
  }
  function Timer() {
    this._call = this._time = this._next = null;
  }
  Timer.prototype = timer.prototype = {
    constructor: Timer,
    restart: function(callback, delay, time) {
      if (typeof callback !== "function")
        throw new TypeError("callback is not a function");
      time = (time == null ? now() : +time) + (delay == null ? 0 : +delay);
      if (!this._next && taskTail !== this) {
        if (taskTail)
          taskTail._next = this;
        else
          taskHead = this;
        taskTail = this;
      }
      this._call = callback;
      this._time = time;
      sleep();
    },
    stop: function() {
      if (this._call) {
        this._call = null;
        this._time = Infinity;
        sleep();
      }
    }
  };
  function timer(callback, delay, time) {
    var t3 = new Timer();
    t3.restart(callback, delay, time);
    return t3;
  }
  function timerFlush() {
    now();
    ++frame;
    var t3 = taskHead, e3;
    while (t3) {
      if ((e3 = clockNow - t3._time) >= 0)
        t3._call.call(void 0, e3);
      t3 = t3._next;
    }
    --frame;
  }
  function wake() {
    clockNow = (clockLast = clock.now()) + clockSkew;
    frame = timeout = 0;
    try {
      timerFlush();
    } finally {
      frame = 0;
      nap();
      clockNow = 0;
    }
  }
  function poke() {
    var now2 = clock.now(), delay = now2 - clockLast;
    if (delay > pokeDelay)
      clockSkew -= delay, clockLast = now2;
  }
  function nap() {
    var t0, t1 = taskHead, t22, time = Infinity;
    while (t1) {
      if (t1._call) {
        if (time > t1._time)
          time = t1._time;
        t0 = t1, t1 = t1._next;
      } else {
        t22 = t1._next, t1._next = null;
        t1 = t0 ? t0._next = t22 : taskHead = t22;
      }
    }
    taskTail = t0;
    sleep(time);
  }
  function sleep(time) {
    if (frame)
      return;
    if (timeout)
      timeout = clearTimeout(timeout);
    var delay = time - clockNow;
    if (delay > 24) {
      if (time < Infinity)
        timeout = setTimeout(wake, time - clock.now() - clockSkew);
      if (interval)
        interval = clearInterval(interval);
    } else {
      if (!interval)
        clockLast = clock.now(), interval = setInterval(poke, pokeDelay);
      frame = 1, setFrame(wake);
    }
  }

  // ../node_modules/d3-timer/src/timeout.js
  function timeout_default(callback, delay, time) {
    var t3 = new Timer();
    delay = delay == null ? 0 : +delay;
    t3.restart((elapsed) => {
      t3.stop();
      callback(elapsed + delay);
    }, delay, time);
    return t3;
  }

  // ../node_modules/d3-transition/src/transition/schedule.js
  var emptyOn = dispatch_default("start", "end", "cancel", "interrupt");
  var emptyTween = [];
  var CREATED = 0;
  var SCHEDULED = 1;
  var STARTING = 2;
  var STARTED = 3;
  var RUNNING = 4;
  var ENDING = 5;
  var ENDED = 6;
  function schedule_default(node, name, id2, index, group, timing) {
    var schedules = node.__transition;
    if (!schedules)
      node.__transition = {};
    else if (id2 in schedules)
      return;
    create(node, id2, {
      name,
      index,
      group,
      on: emptyOn,
      tween: emptyTween,
      time: timing.time,
      delay: timing.delay,
      duration: timing.duration,
      ease: timing.ease,
      timer: null,
      state: CREATED
    });
  }
  function init(node, id2) {
    var schedule = get2(node, id2);
    if (schedule.state > CREATED)
      throw new Error("too late; already scheduled");
    return schedule;
  }
  function set2(node, id2) {
    var schedule = get2(node, id2);
    if (schedule.state > STARTED)
      throw new Error("too late; already running");
    return schedule;
  }
  function get2(node, id2) {
    var schedule = node.__transition;
    if (!schedule || !(schedule = schedule[id2]))
      throw new Error("transition not found");
    return schedule;
  }
  function create(node, id2, self) {
    var schedules = node.__transition, tween;
    schedules[id2] = self;
    self.timer = timer(schedule, 0, self.time);
    function schedule(elapsed) {
      self.state = SCHEDULED;
      self.timer.restart(start2, self.delay, self.time);
      if (self.delay <= elapsed)
        start2(elapsed - self.delay);
    }
    function start2(elapsed) {
      var i3, j4, n2, o3;
      if (self.state !== SCHEDULED)
        return stop();
      for (i3 in schedules) {
        o3 = schedules[i3];
        if (o3.name !== self.name)
          continue;
        if (o3.state === STARTED)
          return timeout_default(start2);
        if (o3.state === RUNNING) {
          o3.state = ENDED;
          o3.timer.stop();
          o3.on.call("interrupt", node, node.__data__, o3.index, o3.group);
          delete schedules[i3];
        } else if (+i3 < id2) {
          o3.state = ENDED;
          o3.timer.stop();
          o3.on.call("cancel", node, node.__data__, o3.index, o3.group);
          delete schedules[i3];
        }
      }
      timeout_default(function() {
        if (self.state === STARTED) {
          self.state = RUNNING;
          self.timer.restart(tick, self.delay, self.time);
          tick(elapsed);
        }
      });
      self.state = STARTING;
      self.on.call("start", node, node.__data__, self.index, self.group);
      if (self.state !== STARTING)
        return;
      self.state = STARTED;
      tween = new Array(n2 = self.tween.length);
      for (i3 = 0, j4 = -1; i3 < n2; ++i3) {
        if (o3 = self.tween[i3].value.call(node, node.__data__, self.index, self.group)) {
          tween[++j4] = o3;
        }
      }
      tween.length = j4 + 1;
    }
    function tick(elapsed) {
      var t3 = elapsed < self.duration ? self.ease.call(null, elapsed / self.duration) : (self.timer.restart(stop), self.state = ENDING, 1), i3 = -1, n2 = tween.length;
      while (++i3 < n2) {
        tween[i3].call(node, t3);
      }
      if (self.state === ENDING) {
        self.on.call("end", node, node.__data__, self.index, self.group);
        stop();
      }
    }
    function stop() {
      self.state = ENDED;
      self.timer.stop();
      delete schedules[id2];
      for (var i3 in schedules)
        return;
      delete node.__transition;
    }
  }

  // ../node_modules/d3-transition/src/interrupt.js
  function interrupt_default(node, name) {
    var schedules = node.__transition, schedule, active, empty2 = true, i3;
    if (!schedules)
      return;
    name = name == null ? null : name + "";
    for (i3 in schedules) {
      if ((schedule = schedules[i3]).name !== name) {
        empty2 = false;
        continue;
      }
      active = schedule.state > STARTING && schedule.state < ENDING;
      schedule.state = ENDED;
      schedule.timer.stop();
      schedule.on.call(active ? "interrupt" : "cancel", node, node.__data__, schedule.index, schedule.group);
      delete schedules[i3];
    }
    if (empty2)
      delete node.__transition;
  }

  // ../node_modules/d3-transition/src/selection/interrupt.js
  function interrupt_default2(name) {
    return this.each(function() {
      interrupt_default(this, name);
    });
  }

  // ../node_modules/d3-transition/src/transition/tween.js
  function tweenRemove(id2, name) {
    var tween0, tween1;
    return function() {
      var schedule = set2(this, id2), tween = schedule.tween;
      if (tween !== tween0) {
        tween1 = tween0 = tween;
        for (var i3 = 0, n2 = tween1.length; i3 < n2; ++i3) {
          if (tween1[i3].name === name) {
            tween1 = tween1.slice();
            tween1.splice(i3, 1);
            break;
          }
        }
      }
      schedule.tween = tween1;
    };
  }
  function tweenFunction(id2, name, value) {
    var tween0, tween1;
    if (typeof value !== "function")
      throw new Error();
    return function() {
      var schedule = set2(this, id2), tween = schedule.tween;
      if (tween !== tween0) {
        tween1 = (tween0 = tween).slice();
        for (var t3 = { name, value }, i3 = 0, n2 = tween1.length; i3 < n2; ++i3) {
          if (tween1[i3].name === name) {
            tween1[i3] = t3;
            break;
          }
        }
        if (i3 === n2)
          tween1.push(t3);
      }
      schedule.tween = tween1;
    };
  }
  function tween_default(name, value) {
    var id2 = this._id;
    name += "";
    if (arguments.length < 2) {
      var tween = get2(this.node(), id2).tween;
      for (var i3 = 0, n2 = tween.length, t3; i3 < n2; ++i3) {
        if ((t3 = tween[i3]).name === name) {
          return t3.value;
        }
      }
      return null;
    }
    return this.each((value == null ? tweenRemove : tweenFunction)(id2, name, value));
  }
  function tweenValue(transition2, name, value) {
    var id2 = transition2._id;
    transition2.each(function() {
      var schedule = set2(this, id2);
      (schedule.value || (schedule.value = {}))[name] = value.apply(this, arguments);
    });
    return function(node) {
      return get2(node, id2).value[name];
    };
  }

  // ../node_modules/d3-transition/src/transition/interpolate.js
  function interpolate_default(a3, b3) {
    var c3;
    return (typeof b3 === "number" ? number_default : b3 instanceof color ? rgb_default : (c3 = color(b3)) ? (b3 = c3, rgb_default) : string_default)(a3, b3);
  }

  // ../node_modules/d3-transition/src/transition/attr.js
  function attrRemove2(name) {
    return function() {
      this.removeAttribute(name);
    };
  }
  function attrRemoveNS2(fullname) {
    return function() {
      this.removeAttributeNS(fullname.space, fullname.local);
    };
  }
  function attrConstant2(name, interpolate, value1) {
    var string00, string1 = value1 + "", interpolate0;
    return function() {
      var string0 = this.getAttribute(name);
      return string0 === string1 ? null : string0 === string00 ? interpolate0 : interpolate0 = interpolate(string00 = string0, value1);
    };
  }
  function attrConstantNS2(fullname, interpolate, value1) {
    var string00, string1 = value1 + "", interpolate0;
    return function() {
      var string0 = this.getAttributeNS(fullname.space, fullname.local);
      return string0 === string1 ? null : string0 === string00 ? interpolate0 : interpolate0 = interpolate(string00 = string0, value1);
    };
  }
  function attrFunction2(name, interpolate, value) {
    var string00, string10, interpolate0;
    return function() {
      var string0, value1 = value(this), string1;
      if (value1 == null)
        return void this.removeAttribute(name);
      string0 = this.getAttribute(name);
      string1 = value1 + "";
      return string0 === string1 ? null : string0 === string00 && string1 === string10 ? interpolate0 : (string10 = string1, interpolate0 = interpolate(string00 = string0, value1));
    };
  }
  function attrFunctionNS2(fullname, interpolate, value) {
    var string00, string10, interpolate0;
    return function() {
      var string0, value1 = value(this), string1;
      if (value1 == null)
        return void this.removeAttributeNS(fullname.space, fullname.local);
      string0 = this.getAttributeNS(fullname.space, fullname.local);
      string1 = value1 + "";
      return string0 === string1 ? null : string0 === string00 && string1 === string10 ? interpolate0 : (string10 = string1, interpolate0 = interpolate(string00 = string0, value1));
    };
  }
  function attr_default2(name, value) {
    var fullname = namespace_default(name), i3 = fullname === "transform" ? interpolateTransformSvg : interpolate_default;
    return this.attrTween(name, typeof value === "function" ? (fullname.local ? attrFunctionNS2 : attrFunction2)(fullname, i3, tweenValue(this, "attr." + name, value)) : value == null ? (fullname.local ? attrRemoveNS2 : attrRemove2)(fullname) : (fullname.local ? attrConstantNS2 : attrConstant2)(fullname, i3, value));
  }

  // ../node_modules/d3-transition/src/transition/attrTween.js
  function attrInterpolate(name, i3) {
    return function(t3) {
      this.setAttribute(name, i3.call(this, t3));
    };
  }
  function attrInterpolateNS(fullname, i3) {
    return function(t3) {
      this.setAttributeNS(fullname.space, fullname.local, i3.call(this, t3));
    };
  }
  function attrTweenNS(fullname, value) {
    var t0, i0;
    function tween() {
      var i3 = value.apply(this, arguments);
      if (i3 !== i0)
        t0 = (i0 = i3) && attrInterpolateNS(fullname, i3);
      return t0;
    }
    tween._value = value;
    return tween;
  }
  function attrTween(name, value) {
    var t0, i0;
    function tween() {
      var i3 = value.apply(this, arguments);
      if (i3 !== i0)
        t0 = (i0 = i3) && attrInterpolate(name, i3);
      return t0;
    }
    tween._value = value;
    return tween;
  }
  function attrTween_default(name, value) {
    var key = "attr." + name;
    if (arguments.length < 2)
      return (key = this.tween(key)) && key._value;
    if (value == null)
      return this.tween(key, null);
    if (typeof value !== "function")
      throw new Error();
    var fullname = namespace_default(name);
    return this.tween(key, (fullname.local ? attrTweenNS : attrTween)(fullname, value));
  }

  // ../node_modules/d3-transition/src/transition/delay.js
  function delayFunction(id2, value) {
    return function() {
      init(this, id2).delay = +value.apply(this, arguments);
    };
  }
  function delayConstant(id2, value) {
    return value = +value, function() {
      init(this, id2).delay = value;
    };
  }
  function delay_default(value) {
    var id2 = this._id;
    return arguments.length ? this.each((typeof value === "function" ? delayFunction : delayConstant)(id2, value)) : get2(this.node(), id2).delay;
  }

  // ../node_modules/d3-transition/src/transition/duration.js
  function durationFunction(id2, value) {
    return function() {
      set2(this, id2).duration = +value.apply(this, arguments);
    };
  }
  function durationConstant(id2, value) {
    return value = +value, function() {
      set2(this, id2).duration = value;
    };
  }
  function duration_default(value) {
    var id2 = this._id;
    return arguments.length ? this.each((typeof value === "function" ? durationFunction : durationConstant)(id2, value)) : get2(this.node(), id2).duration;
  }

  // ../node_modules/d3-transition/src/transition/ease.js
  function easeConstant(id2, value) {
    if (typeof value !== "function")
      throw new Error();
    return function() {
      set2(this, id2).ease = value;
    };
  }
  function ease_default(value) {
    var id2 = this._id;
    return arguments.length ? this.each(easeConstant(id2, value)) : get2(this.node(), id2).ease;
  }

  // ../node_modules/d3-transition/src/transition/easeVarying.js
  function easeVarying(id2, value) {
    return function() {
      var v3 = value.apply(this, arguments);
      if (typeof v3 !== "function")
        throw new Error();
      set2(this, id2).ease = v3;
    };
  }
  function easeVarying_default(value) {
    if (typeof value !== "function")
      throw new Error();
    return this.each(easeVarying(this._id, value));
  }

  // ../node_modules/d3-transition/src/transition/filter.js
  function filter_default2(match) {
    if (typeof match !== "function")
      match = matcher_default(match);
    for (var groups = this._groups, m3 = groups.length, subgroups = new Array(m3), j4 = 0; j4 < m3; ++j4) {
      for (var group = groups[j4], n2 = group.length, subgroup = subgroups[j4] = [], node, i3 = 0; i3 < n2; ++i3) {
        if ((node = group[i3]) && match.call(node, node.__data__, i3, group)) {
          subgroup.push(node);
        }
      }
    }
    return new Transition(subgroups, this._parents, this._name, this._id);
  }

  // ../node_modules/d3-transition/src/transition/merge.js
  function merge_default2(transition2) {
    if (transition2._id !== this._id)
      throw new Error();
    for (var groups0 = this._groups, groups1 = transition2._groups, m0 = groups0.length, m1 = groups1.length, m3 = Math.min(m0, m1), merges = new Array(m0), j4 = 0; j4 < m3; ++j4) {
      for (var group0 = groups0[j4], group1 = groups1[j4], n2 = group0.length, merge = merges[j4] = new Array(n2), node, i3 = 0; i3 < n2; ++i3) {
        if (node = group0[i3] || group1[i3]) {
          merge[i3] = node;
        }
      }
    }
    for (; j4 < m0; ++j4) {
      merges[j4] = groups0[j4];
    }
    return new Transition(merges, this._parents, this._name, this._id);
  }

  // ../node_modules/d3-transition/src/transition/on.js
  function start(name) {
    return (name + "").trim().split(/^|\s+/).every(function(t3) {
      var i3 = t3.indexOf(".");
      if (i3 >= 0)
        t3 = t3.slice(0, i3);
      return !t3 || t3 === "start";
    });
  }
  function onFunction(id2, name, listener) {
    var on0, on1, sit = start(name) ? init : set2;
    return function() {
      var schedule = sit(this, id2), on = schedule.on;
      if (on !== on0)
        (on1 = (on0 = on).copy()).on(name, listener);
      schedule.on = on1;
    };
  }
  function on_default2(name, listener) {
    var id2 = this._id;
    return arguments.length < 2 ? get2(this.node(), id2).on.on(name) : this.each(onFunction(id2, name, listener));
  }

  // ../node_modules/d3-transition/src/transition/remove.js
  function removeFunction(id2) {
    return function() {
      var parent = this.parentNode;
      for (var i3 in this.__transition)
        if (+i3 !== id2)
          return;
      if (parent)
        parent.removeChild(this);
    };
  }
  function remove_default2() {
    return this.on("end.remove", removeFunction(this._id));
  }

  // ../node_modules/d3-transition/src/transition/select.js
  function select_default3(select) {
    var name = this._name, id2 = this._id;
    if (typeof select !== "function")
      select = selector_default(select);
    for (var groups = this._groups, m3 = groups.length, subgroups = new Array(m3), j4 = 0; j4 < m3; ++j4) {
      for (var group = groups[j4], n2 = group.length, subgroup = subgroups[j4] = new Array(n2), node, subnode, i3 = 0; i3 < n2; ++i3) {
        if ((node = group[i3]) && (subnode = select.call(node, node.__data__, i3, group))) {
          if ("__data__" in node)
            subnode.__data__ = node.__data__;
          subgroup[i3] = subnode;
          schedule_default(subgroup[i3], name, id2, i3, subgroup, get2(node, id2));
        }
      }
    }
    return new Transition(subgroups, this._parents, name, id2);
  }

  // ../node_modules/d3-transition/src/transition/selectAll.js
  function selectAll_default2(select) {
    var name = this._name, id2 = this._id;
    if (typeof select !== "function")
      select = selectorAll_default(select);
    for (var groups = this._groups, m3 = groups.length, subgroups = [], parents = [], j4 = 0; j4 < m3; ++j4) {
      for (var group = groups[j4], n2 = group.length, node, i3 = 0; i3 < n2; ++i3) {
        if (node = group[i3]) {
          for (var children2 = select.call(node, node.__data__, i3, group), child, inherit2 = get2(node, id2), k3 = 0, l3 = children2.length; k3 < l3; ++k3) {
            if (child = children2[k3]) {
              schedule_default(child, name, id2, k3, children2, inherit2);
            }
          }
          subgroups.push(children2);
          parents.push(node);
        }
      }
    }
    return new Transition(subgroups, parents, name, id2);
  }

  // ../node_modules/d3-transition/src/transition/selection.js
  var Selection2 = selection_default.prototype.constructor;
  function selection_default2() {
    return new Selection2(this._groups, this._parents);
  }

  // ../node_modules/d3-transition/src/transition/style.js
  function styleNull(name, interpolate) {
    var string00, string10, interpolate0;
    return function() {
      var string0 = styleValue(this, name), string1 = (this.style.removeProperty(name), styleValue(this, name));
      return string0 === string1 ? null : string0 === string00 && string1 === string10 ? interpolate0 : interpolate0 = interpolate(string00 = string0, string10 = string1);
    };
  }
  function styleRemove2(name) {
    return function() {
      this.style.removeProperty(name);
    };
  }
  function styleConstant2(name, interpolate, value1) {
    var string00, string1 = value1 + "", interpolate0;
    return function() {
      var string0 = styleValue(this, name);
      return string0 === string1 ? null : string0 === string00 ? interpolate0 : interpolate0 = interpolate(string00 = string0, value1);
    };
  }
  function styleFunction2(name, interpolate, value) {
    var string00, string10, interpolate0;
    return function() {
      var string0 = styleValue(this, name), value1 = value(this), string1 = value1 + "";
      if (value1 == null)
        string1 = value1 = (this.style.removeProperty(name), styleValue(this, name));
      return string0 === string1 ? null : string0 === string00 && string1 === string10 ? interpolate0 : (string10 = string1, interpolate0 = interpolate(string00 = string0, value1));
    };
  }
  function styleMaybeRemove(id2, name) {
    var on0, on1, listener0, key = "style." + name, event = "end." + key, remove2;
    return function() {
      var schedule = set2(this, id2), on = schedule.on, listener = schedule.value[key] == null ? remove2 || (remove2 = styleRemove2(name)) : void 0;
      if (on !== on0 || listener0 !== listener)
        (on1 = (on0 = on).copy()).on(event, listener0 = listener);
      schedule.on = on1;
    };
  }
  function style_default2(name, value, priority) {
    var i3 = (name += "") === "transform" ? interpolateTransformCss : interpolate_default;
    return value == null ? this.styleTween(name, styleNull(name, i3)).on("end.style." + name, styleRemove2(name)) : typeof value === "function" ? this.styleTween(name, styleFunction2(name, i3, tweenValue(this, "style." + name, value))).each(styleMaybeRemove(this._id, name)) : this.styleTween(name, styleConstant2(name, i3, value), priority).on("end.style." + name, null);
  }

  // ../node_modules/d3-transition/src/transition/styleTween.js
  function styleInterpolate(name, i3, priority) {
    return function(t3) {
      this.style.setProperty(name, i3.call(this, t3), priority);
    };
  }
  function styleTween(name, value, priority) {
    var t3, i0;
    function tween() {
      var i3 = value.apply(this, arguments);
      if (i3 !== i0)
        t3 = (i0 = i3) && styleInterpolate(name, i3, priority);
      return t3;
    }
    tween._value = value;
    return tween;
  }
  function styleTween_default(name, value, priority) {
    var key = "style." + (name += "");
    if (arguments.length < 2)
      return (key = this.tween(key)) && key._value;
    if (value == null)
      return this.tween(key, null);
    if (typeof value !== "function")
      throw new Error();
    return this.tween(key, styleTween(name, value, priority == null ? "" : priority));
  }

  // ../node_modules/d3-transition/src/transition/text.js
  function textConstant2(value) {
    return function() {
      this.textContent = value;
    };
  }
  function textFunction2(value) {
    return function() {
      var value1 = value(this);
      this.textContent = value1 == null ? "" : value1;
    };
  }
  function text_default2(value) {
    return this.tween("text", typeof value === "function" ? textFunction2(tweenValue(this, "text", value)) : textConstant2(value == null ? "" : value + ""));
  }

  // ../node_modules/d3-transition/src/transition/textTween.js
  function textInterpolate(i3) {
    return function(t3) {
      this.textContent = i3.call(this, t3);
    };
  }
  function textTween(value) {
    var t0, i0;
    function tween() {
      var i3 = value.apply(this, arguments);
      if (i3 !== i0)
        t0 = (i0 = i3) && textInterpolate(i3);
      return t0;
    }
    tween._value = value;
    return tween;
  }
  function textTween_default(value) {
    var key = "text";
    if (arguments.length < 1)
      return (key = this.tween(key)) && key._value;
    if (value == null)
      return this.tween(key, null);
    if (typeof value !== "function")
      throw new Error();
    return this.tween(key, textTween(value));
  }

  // ../node_modules/d3-transition/src/transition/transition.js
  function transition_default() {
    var name = this._name, id0 = this._id, id1 = newId();
    for (var groups = this._groups, m3 = groups.length, j4 = 0; j4 < m3; ++j4) {
      for (var group = groups[j4], n2 = group.length, node, i3 = 0; i3 < n2; ++i3) {
        if (node = group[i3]) {
          var inherit2 = get2(node, id0);
          schedule_default(node, name, id1, i3, group, {
            time: inherit2.time + inherit2.delay + inherit2.duration,
            delay: 0,
            duration: inherit2.duration,
            ease: inherit2.ease
          });
        }
      }
    }
    return new Transition(groups, this._parents, name, id1);
  }

  // ../node_modules/d3-transition/src/transition/end.js
  function end_default() {
    var on0, on1, that = this, id2 = that._id, size = that.size();
    return new Promise(function(resolve, reject) {
      var cancel = { value: reject }, end = { value: function() {
        if (--size === 0)
          resolve();
      } };
      that.each(function() {
        var schedule = set2(this, id2), on = schedule.on;
        if (on !== on0) {
          on1 = (on0 = on).copy();
          on1._.cancel.push(cancel);
          on1._.interrupt.push(cancel);
          on1._.end.push(end);
        }
        schedule.on = on1;
      });
      if (size === 0)
        resolve();
    });
  }

  // ../node_modules/d3-transition/src/transition/index.js
  var id = 0;
  function Transition(groups, parents, name, id2) {
    this._groups = groups;
    this._parents = parents;
    this._name = name;
    this._id = id2;
  }
  function transition(name) {
    return selection_default().transition(name);
  }
  function newId() {
    return ++id;
  }
  var selection_prototype = selection_default.prototype;
  Transition.prototype = transition.prototype = {
    constructor: Transition,
    select: select_default3,
    selectAll: selectAll_default2,
    selectChild: selection_prototype.selectChild,
    selectChildren: selection_prototype.selectChildren,
    filter: filter_default2,
    merge: merge_default2,
    selection: selection_default2,
    transition: transition_default,
    call: selection_prototype.call,
    nodes: selection_prototype.nodes,
    node: selection_prototype.node,
    size: selection_prototype.size,
    empty: selection_prototype.empty,
    each: selection_prototype.each,
    on: on_default2,
    attr: attr_default2,
    attrTween: attrTween_default,
    style: style_default2,
    styleTween: styleTween_default,
    text: text_default2,
    textTween: textTween_default,
    remove: remove_default2,
    tween: tween_default,
    delay: delay_default,
    duration: duration_default,
    ease: ease_default,
    easeVarying: easeVarying_default,
    end: end_default,
    [Symbol.iterator]: selection_prototype[Symbol.iterator]
  };

  // ../node_modules/d3-ease/src/cubic.js
  function cubicInOut(t3) {
    return ((t3 *= 2) <= 1 ? t3 * t3 * t3 : (t3 -= 2) * t3 * t3 + 2) / 2;
  }

  // ../node_modules/d3-transition/src/selection/transition.js
  var defaultTiming = {
    time: null,
    delay: 0,
    duration: 250,
    ease: cubicInOut
  };
  function inherit(node, id2) {
    var timing;
    while (!(timing = node.__transition) || !(timing = timing[id2])) {
      if (!(node = node.parentNode)) {
        throw new Error(`transition ${id2} not found`);
      }
    }
    return timing;
  }
  function transition_default2(name) {
    var id2, timing;
    if (name instanceof Transition) {
      id2 = name._id, name = name._name;
    } else {
      id2 = newId(), (timing = defaultTiming).time = now(), name = name == null ? null : name + "";
    }
    for (var groups = this._groups, m3 = groups.length, j4 = 0; j4 < m3; ++j4) {
      for (var group = groups[j4], n2 = group.length, node, i3 = 0; i3 < n2; ++i3) {
        if (node = group[i3]) {
          schedule_default(node, name, id2, i3, group, timing || inherit(node, id2));
        }
      }
    }
    return new Transition(groups, this._parents, name, id2);
  }

  // ../node_modules/d3-transition/src/selection/index.js
  selection_default.prototype.interrupt = interrupt_default2;
  selection_default.prototype.transition = transition_default2;

  // ../node_modules/d3-brush/src/brush.js
  var { abs, max, min } = Math;
  function number1(e3) {
    return [+e3[0], +e3[1]];
  }
  function number2(e3) {
    return [number1(e3[0]), number1(e3[1])];
  }
  var X = {
    name: "x",
    handles: ["w", "e"].map(type),
    input: function(x3, e3) {
      return x3 == null ? null : [[+x3[0], e3[0][1]], [+x3[1], e3[1][1]]];
    },
    output: function(xy) {
      return xy && [xy[0][0], xy[1][0]];
    }
  };
  var Y = {
    name: "y",
    handles: ["n", "s"].map(type),
    input: function(y3, e3) {
      return y3 == null ? null : [[e3[0][0], +y3[0]], [e3[1][0], +y3[1]]];
    },
    output: function(xy) {
      return xy && [xy[0][1], xy[1][1]];
    }
  };
  var XY = {
    name: "xy",
    handles: ["n", "w", "e", "s", "nw", "ne", "sw", "se"].map(type),
    input: function(xy) {
      return xy == null ? null : number2(xy);
    },
    output: function(xy) {
      return xy;
    }
  };
  function type(t3) {
    return { type: t3 };
  }

  // ../node_modules/d3-path/src/path.js
  var pi = Math.PI;
  var tau = 2 * pi;
  var epsilon = 1e-6;
  var tauEpsilon = tau - epsilon;
  function Path() {
    this._x0 = this._y0 = this._x1 = this._y1 = null;
    this._ = "";
  }
  function path() {
    return new Path();
  }
  Path.prototype = path.prototype = {
    constructor: Path,
    moveTo: function(x3, y3) {
      this._ += "M" + (this._x0 = this._x1 = +x3) + "," + (this._y0 = this._y1 = +y3);
    },
    closePath: function() {
      if (this._x1 !== null) {
        this._x1 = this._x0, this._y1 = this._y0;
        this._ += "Z";
      }
    },
    lineTo: function(x3, y3) {
      this._ += "L" + (this._x1 = +x3) + "," + (this._y1 = +y3);
    },
    quadraticCurveTo: function(x1, y1, x3, y3) {
      this._ += "Q" + +x1 + "," + +y1 + "," + (this._x1 = +x3) + "," + (this._y1 = +y3);
    },
    bezierCurveTo: function(x1, y1, x22, y22, x3, y3) {
      this._ += "C" + +x1 + "," + +y1 + "," + +x22 + "," + +y22 + "," + (this._x1 = +x3) + "," + (this._y1 = +y3);
    },
    arcTo: function(x1, y1, x22, y22, r3) {
      x1 = +x1, y1 = +y1, x22 = +x22, y22 = +y22, r3 = +r3;
      var x0 = this._x1, y0 = this._y1, x21 = x22 - x1, y21 = y22 - y1, x01 = x0 - x1, y01 = y0 - y1, l01_2 = x01 * x01 + y01 * y01;
      if (r3 < 0)
        throw new Error("negative radius: " + r3);
      if (this._x1 === null) {
        this._ += "M" + (this._x1 = x1) + "," + (this._y1 = y1);
      } else if (!(l01_2 > epsilon))
        ;
      else if (!(Math.abs(y01 * x21 - y21 * x01) > epsilon) || !r3) {
        this._ += "L" + (this._x1 = x1) + "," + (this._y1 = y1);
      } else {
        var x20 = x22 - x0, y20 = y22 - y0, l21_2 = x21 * x21 + y21 * y21, l20_2 = x20 * x20 + y20 * y20, l21 = Math.sqrt(l21_2), l01 = Math.sqrt(l01_2), l3 = r3 * Math.tan((pi - Math.acos((l21_2 + l01_2 - l20_2) / (2 * l21 * l01))) / 2), t01 = l3 / l01, t21 = l3 / l21;
        if (Math.abs(t01 - 1) > epsilon) {
          this._ += "L" + (x1 + t01 * x01) + "," + (y1 + t01 * y01);
        }
        this._ += "A" + r3 + "," + r3 + ",0,0," + +(y01 * x20 > x01 * y20) + "," + (this._x1 = x1 + t21 * x21) + "," + (this._y1 = y1 + t21 * y21);
      }
    },
    arc: function(x3, y3, r3, a0, a1, ccw) {
      x3 = +x3, y3 = +y3, r3 = +r3, ccw = !!ccw;
      var dx = r3 * Math.cos(a0), dy = r3 * Math.sin(a0), x0 = x3 + dx, y0 = y3 + dy, cw = 1 ^ ccw, da = ccw ? a0 - a1 : a1 - a0;
      if (r3 < 0)
        throw new Error("negative radius: " + r3);
      if (this._x1 === null) {
        this._ += "M" + x0 + "," + y0;
      } else if (Math.abs(this._x1 - x0) > epsilon || Math.abs(this._y1 - y0) > epsilon) {
        this._ += "L" + x0 + "," + y0;
      }
      if (!r3)
        return;
      if (da < 0)
        da = da % tau + tau;
      if (da > tauEpsilon) {
        this._ += "A" + r3 + "," + r3 + ",0,1," + cw + "," + (x3 - dx) + "," + (y3 - dy) + "A" + r3 + "," + r3 + ",0,1," + cw + "," + (this._x1 = x0) + "," + (this._y1 = y0);
      } else if (da > epsilon) {
        this._ += "A" + r3 + "," + r3 + ",0," + +(da >= pi) + "," + cw + "," + (this._x1 = x3 + r3 * Math.cos(a1)) + "," + (this._y1 = y3 + r3 * Math.sin(a1));
      }
    },
    rect: function(x3, y3, w4, h3) {
      this._ += "M" + (this._x0 = this._x1 = +x3) + "," + (this._y0 = this._y1 = +y3) + "h" + +w4 + "v" + +h3 + "h" + -w4 + "Z";
    },
    toString: function() {
      return this._;
    }
  };
  var path_default = path;

  // ../node_modules/d3-format/src/formatDecimal.js
  function formatDecimal_default(x3) {
    return Math.abs(x3 = Math.round(x3)) >= 1e21 ? x3.toLocaleString("en").replace(/,/g, "") : x3.toString(10);
  }
  function formatDecimalParts(x3, p3) {
    if ((i3 = (x3 = p3 ? x3.toExponential(p3 - 1) : x3.toExponential()).indexOf("e")) < 0)
      return null;
    var i3, coefficient = x3.slice(0, i3);
    return [
      coefficient.length > 1 ? coefficient[0] + coefficient.slice(2) : coefficient,
      +x3.slice(i3 + 1)
    ];
  }

  // ../node_modules/d3-format/src/exponent.js
  function exponent_default(x3) {
    return x3 = formatDecimalParts(Math.abs(x3)), x3 ? x3[1] : NaN;
  }

  // ../node_modules/d3-format/src/formatGroup.js
  function formatGroup_default(grouping, thousands) {
    return function(value, width) {
      var i3 = value.length, t3 = [], j4 = 0, g3 = grouping[0], length = 0;
      while (i3 > 0 && g3 > 0) {
        if (length + g3 + 1 > width)
          g3 = Math.max(1, width - length);
        t3.push(value.substring(i3 -= g3, i3 + g3));
        if ((length += g3 + 1) > width)
          break;
        g3 = grouping[j4 = (j4 + 1) % grouping.length];
      }
      return t3.reverse().join(thousands);
    };
  }

  // ../node_modules/d3-format/src/formatNumerals.js
  function formatNumerals_default(numerals) {
    return function(value) {
      return value.replace(/[0-9]/g, function(i3) {
        return numerals[+i3];
      });
    };
  }

  // ../node_modules/d3-format/src/formatSpecifier.js
  var re = /^(?:(.)?([<>=^]))?([+\-( ])?([$#])?(0)?(\d+)?(,)?(\.\d+)?(~)?([a-z%])?$/i;
  function formatSpecifier(specifier) {
    if (!(match = re.exec(specifier)))
      throw new Error("invalid format: " + specifier);
    var match;
    return new FormatSpecifier({
      fill: match[1],
      align: match[2],
      sign: match[3],
      symbol: match[4],
      zero: match[5],
      width: match[6],
      comma: match[7],
      precision: match[8] && match[8].slice(1),
      trim: match[9],
      type: match[10]
    });
  }
  formatSpecifier.prototype = FormatSpecifier.prototype;
  function FormatSpecifier(specifier) {
    this.fill = specifier.fill === void 0 ? " " : specifier.fill + "";
    this.align = specifier.align === void 0 ? ">" : specifier.align + "";
    this.sign = specifier.sign === void 0 ? "-" : specifier.sign + "";
    this.symbol = specifier.symbol === void 0 ? "" : specifier.symbol + "";
    this.zero = !!specifier.zero;
    this.width = specifier.width === void 0 ? void 0 : +specifier.width;
    this.comma = !!specifier.comma;
    this.precision = specifier.precision === void 0 ? void 0 : +specifier.precision;
    this.trim = !!specifier.trim;
    this.type = specifier.type === void 0 ? "" : specifier.type + "";
  }
  FormatSpecifier.prototype.toString = function() {
    return this.fill + this.align + this.sign + this.symbol + (this.zero ? "0" : "") + (this.width === void 0 ? "" : Math.max(1, this.width | 0)) + (this.comma ? "," : "") + (this.precision === void 0 ? "" : "." + Math.max(0, this.precision | 0)) + (this.trim ? "~" : "") + this.type;
  };

  // ../node_modules/d3-format/src/formatTrim.js
  function formatTrim_default(s3) {
    out:
      for (var n2 = s3.length, i3 = 1, i0 = -1, i1; i3 < n2; ++i3) {
        switch (s3[i3]) {
          case ".":
            i0 = i1 = i3;
            break;
          case "0":
            if (i0 === 0)
              i0 = i3;
            i1 = i3;
            break;
          default:
            if (!+s3[i3])
              break out;
            if (i0 > 0)
              i0 = 0;
            break;
        }
      }
    return i0 > 0 ? s3.slice(0, i0) + s3.slice(i1 + 1) : s3;
  }

  // ../node_modules/d3-format/src/formatPrefixAuto.js
  var prefixExponent;
  function formatPrefixAuto_default(x3, p3) {
    var d3 = formatDecimalParts(x3, p3);
    if (!d3)
      return x3 + "";
    var coefficient = d3[0], exponent = d3[1], i3 = exponent - (prefixExponent = Math.max(-8, Math.min(8, Math.floor(exponent / 3))) * 3) + 1, n2 = coefficient.length;
    return i3 === n2 ? coefficient : i3 > n2 ? coefficient + new Array(i3 - n2 + 1).join("0") : i3 > 0 ? coefficient.slice(0, i3) + "." + coefficient.slice(i3) : "0." + new Array(1 - i3).join("0") + formatDecimalParts(x3, Math.max(0, p3 + i3 - 1))[0];
  }

  // ../node_modules/d3-format/src/formatRounded.js
  function formatRounded_default(x3, p3) {
    var d3 = formatDecimalParts(x3, p3);
    if (!d3)
      return x3 + "";
    var coefficient = d3[0], exponent = d3[1];
    return exponent < 0 ? "0." + new Array(-exponent).join("0") + coefficient : coefficient.length > exponent + 1 ? coefficient.slice(0, exponent + 1) + "." + coefficient.slice(exponent + 1) : coefficient + new Array(exponent - coefficient.length + 2).join("0");
  }

  // ../node_modules/d3-format/src/formatTypes.js
  var formatTypes_default = {
    "%": (x3, p3) => (x3 * 100).toFixed(p3),
    "b": (x3) => Math.round(x3).toString(2),
    "c": (x3) => x3 + "",
    "d": formatDecimal_default,
    "e": (x3, p3) => x3.toExponential(p3),
    "f": (x3, p3) => x3.toFixed(p3),
    "g": (x3, p3) => x3.toPrecision(p3),
    "o": (x3) => Math.round(x3).toString(8),
    "p": (x3, p3) => formatRounded_default(x3 * 100, p3),
    "r": formatRounded_default,
    "s": formatPrefixAuto_default,
    "X": (x3) => Math.round(x3).toString(16).toUpperCase(),
    "x": (x3) => Math.round(x3).toString(16)
  };

  // ../node_modules/d3-format/src/identity.js
  function identity_default(x3) {
    return x3;
  }

  // ../node_modules/d3-format/src/locale.js
  var map = Array.prototype.map;
  var prefixes = ["y", "z", "a", "f", "p", "n", "\xB5", "m", "", "k", "M", "G", "T", "P", "E", "Z", "Y"];
  function locale_default(locale2) {
    var group = locale2.grouping === void 0 || locale2.thousands === void 0 ? identity_default : formatGroup_default(map.call(locale2.grouping, Number), locale2.thousands + ""), currencyPrefix = locale2.currency === void 0 ? "" : locale2.currency[0] + "", currencySuffix = locale2.currency === void 0 ? "" : locale2.currency[1] + "", decimal = locale2.decimal === void 0 ? "." : locale2.decimal + "", numerals = locale2.numerals === void 0 ? identity_default : formatNumerals_default(map.call(locale2.numerals, String)), percent = locale2.percent === void 0 ? "%" : locale2.percent + "", minus = locale2.minus === void 0 ? "\u2212" : locale2.minus + "", nan = locale2.nan === void 0 ? "NaN" : locale2.nan + "";
    function newFormat(specifier) {
      specifier = formatSpecifier(specifier);
      var fill = specifier.fill, align = specifier.align, sign = specifier.sign, symbol = specifier.symbol, zero2 = specifier.zero, width = specifier.width, comma = specifier.comma, precision = specifier.precision, trim = specifier.trim, type2 = specifier.type;
      if (type2 === "n")
        comma = true, type2 = "g";
      else if (!formatTypes_default[type2])
        precision === void 0 && (precision = 12), trim = true, type2 = "g";
      if (zero2 || fill === "0" && align === "=")
        zero2 = true, fill = "0", align = "=";
      var prefix = symbol === "$" ? currencyPrefix : symbol === "#" && /[boxX]/.test(type2) ? "0" + type2.toLowerCase() : "", suffix = symbol === "$" ? currencySuffix : /[%p]/.test(type2) ? percent : "";
      var formatType = formatTypes_default[type2], maybeSuffix = /[defgprs%]/.test(type2);
      precision = precision === void 0 ? 6 : /[gprs]/.test(type2) ? Math.max(1, Math.min(21, precision)) : Math.max(0, Math.min(20, precision));
      function format2(value) {
        var valuePrefix = prefix, valueSuffix = suffix, i3, n2, c3;
        if (type2 === "c") {
          valueSuffix = formatType(value) + valueSuffix;
          value = "";
        } else {
          value = +value;
          var valueNegative = value < 0 || 1 / value < 0;
          value = isNaN(value) ? nan : formatType(Math.abs(value), precision);
          if (trim)
            value = formatTrim_default(value);
          if (valueNegative && +value === 0 && sign !== "+")
            valueNegative = false;
          valuePrefix = (valueNegative ? sign === "(" ? sign : minus : sign === "-" || sign === "(" ? "" : sign) + valuePrefix;
          valueSuffix = (type2 === "s" ? prefixes[8 + prefixExponent / 3] : "") + valueSuffix + (valueNegative && sign === "(" ? ")" : "");
          if (maybeSuffix) {
            i3 = -1, n2 = value.length;
            while (++i3 < n2) {
              if (c3 = value.charCodeAt(i3), 48 > c3 || c3 > 57) {
                valueSuffix = (c3 === 46 ? decimal + value.slice(i3 + 1) : value.slice(i3)) + valueSuffix;
                value = value.slice(0, i3);
                break;
              }
            }
          }
        }
        if (comma && !zero2)
          value = group(value, Infinity);
        var length = valuePrefix.length + value.length + valueSuffix.length, padding = length < width ? new Array(width - length + 1).join(fill) : "";
        if (comma && zero2)
          value = group(padding + value, padding.length ? width - valueSuffix.length : Infinity), padding = "";
        switch (align) {
          case "<":
            value = valuePrefix + value + valueSuffix + padding;
            break;
          case "=":
            value = valuePrefix + padding + value + valueSuffix;
            break;
          case "^":
            value = padding.slice(0, length = padding.length >> 1) + valuePrefix + value + valueSuffix + padding.slice(length);
            break;
          default:
            value = padding + valuePrefix + value + valueSuffix;
            break;
        }
        return numerals(value);
      }
      format2.toString = function() {
        return specifier + "";
      };
      return format2;
    }
    function formatPrefix2(specifier, value) {
      var f3 = newFormat((specifier = formatSpecifier(specifier), specifier.type = "f", specifier)), e3 = Math.max(-8, Math.min(8, Math.floor(exponent_default(value) / 3))) * 3, k3 = Math.pow(10, -e3), prefix = prefixes[8 + e3 / 3];
      return function(value2) {
        return f3(k3 * value2) + prefix;
      };
    }
    return {
      format: newFormat,
      formatPrefix: formatPrefix2
    };
  }

  // ../node_modules/d3-format/src/defaultLocale.js
  var locale;
  var format;
  var formatPrefix;
  defaultLocale({
    thousands: ",",
    grouping: [3],
    currency: ["$", ""]
  });
  function defaultLocale(definition) {
    locale = locale_default(definition);
    format = locale.format;
    formatPrefix = locale.formatPrefix;
    return locale;
  }

  // ../node_modules/d3-scale/src/init.js
  function initRange(domain, range) {
    switch (arguments.length) {
      case 0:
        break;
      case 1:
        this.range(domain);
        break;
      default:
        this.range(range).domain(domain);
        break;
    }
    return this;
  }

  // ../node_modules/d3-scale/src/ordinal.js
  var implicit = Symbol("implicit");
  function ordinal() {
    var index = new InternMap(), domain = [], range = [], unknown = implicit;
    function scale(d3) {
      let i3 = index.get(d3);
      if (i3 === void 0) {
        if (unknown !== implicit)
          return unknown;
        index.set(d3, i3 = domain.push(d3) - 1);
      }
      return range[i3 % range.length];
    }
    scale.domain = function(_3) {
      if (!arguments.length)
        return domain.slice();
      domain = [], index = new InternMap();
      for (const value of _3) {
        if (index.has(value))
          continue;
        index.set(value, domain.push(value) - 1);
      }
      return scale;
    };
    scale.range = function(_3) {
      return arguments.length ? (range = Array.from(_3), scale) : range.slice();
    };
    scale.unknown = function(_3) {
      return arguments.length ? (unknown = _3, scale) : unknown;
    };
    scale.copy = function() {
      return ordinal(domain, range).unknown(unknown);
    };
    initRange.apply(scale, arguments);
    return scale;
  }

  // ../node_modules/d3-scale-chromatic/src/colors.js
  function colors_default(specifier) {
    var n2 = specifier.length / 6 | 0, colors = new Array(n2), i3 = 0;
    while (i3 < n2)
      colors[i3] = "#" + specifier.slice(i3 * 6, ++i3 * 6);
    return colors;
  }

  // ../node_modules/d3-scale-chromatic/src/ramp.js
  var ramp_default = (scheme2) => rgbBasis(scheme2[scheme2.length - 1]);

  // ../node_modules/d3-scale-chromatic/src/sequential-single/Blues.js
  var scheme = new Array(3).concat("deebf79ecae13182bd", "eff3ffbdd7e76baed62171b5", "eff3ffbdd7e76baed63182bd08519c", "eff3ffc6dbef9ecae16baed63182bd08519c", "eff3ffc6dbef9ecae16baed64292c62171b5084594", "f7fbffdeebf7c6dbef9ecae16baed64292c62171b5084594", "f7fbffdeebf7c6dbef9ecae16baed64292c62171b508519c08306b").map(colors_default);
  var Blues_default = ramp_default(scheme);

  // ../node_modules/d3-shape/src/constant.js
  function constant_default4(x3) {
    return function constant() {
      return x3;
    };
  }

  // ../node_modules/d3-shape/src/math.js
  var abs2 = Math.abs;
  var atan2 = Math.atan2;
  var cos = Math.cos;
  var max2 = Math.max;
  var min2 = Math.min;
  var sin = Math.sin;
  var sqrt = Math.sqrt;
  var epsilon2 = 1e-12;
  var pi2 = Math.PI;
  var halfPi = pi2 / 2;
  var tau2 = 2 * pi2;
  function acos(x3) {
    return x3 > 1 ? 0 : x3 < -1 ? pi2 : Math.acos(x3);
  }
  function asin(x3) {
    return x3 >= 1 ? halfPi : x3 <= -1 ? -halfPi : Math.asin(x3);
  }

  // ../node_modules/d3-shape/src/arc.js
  function arcInnerRadius(d3) {
    return d3.innerRadius;
  }
  function arcOuterRadius(d3) {
    return d3.outerRadius;
  }
  function arcStartAngle(d3) {
    return d3.startAngle;
  }
  function arcEndAngle(d3) {
    return d3.endAngle;
  }
  function arcPadAngle(d3) {
    return d3 && d3.padAngle;
  }
  function intersect(x0, y0, x1, y1, x22, y22, x3, y3) {
    var x10 = x1 - x0, y10 = y1 - y0, x32 = x3 - x22, y32 = y3 - y22, t3 = y32 * x10 - x32 * y10;
    if (t3 * t3 < epsilon2)
      return;
    t3 = (x32 * (y0 - y22) - y32 * (x0 - x22)) / t3;
    return [x0 + t3 * x10, y0 + t3 * y10];
  }
  function cornerTangents(x0, y0, x1, y1, r1, rc, cw) {
    var x01 = x0 - x1, y01 = y0 - y1, lo = (cw ? rc : -rc) / sqrt(x01 * x01 + y01 * y01), ox = lo * y01, oy = -lo * x01, x11 = x0 + ox, y11 = y0 + oy, x10 = x1 + ox, y10 = y1 + oy, x00 = (x11 + x10) / 2, y00 = (y11 + y10) / 2, dx = x10 - x11, dy = y10 - y11, d22 = dx * dx + dy * dy, r3 = r1 - rc, D2 = x11 * y10 - x10 * y11, d3 = (dy < 0 ? -1 : 1) * sqrt(max2(0, r3 * r3 * d22 - D2 * D2)), cx0 = (D2 * dy - dx * d3) / d22, cy0 = (-D2 * dx - dy * d3) / d22, cx1 = (D2 * dy + dx * d3) / d22, cy1 = (-D2 * dx + dy * d3) / d22, dx0 = cx0 - x00, dy0 = cy0 - y00, dx1 = cx1 - x00, dy1 = cy1 - y00;
    if (dx0 * dx0 + dy0 * dy0 > dx1 * dx1 + dy1 * dy1)
      cx0 = cx1, cy0 = cy1;
    return {
      cx: cx0,
      cy: cy0,
      x01: -ox,
      y01: -oy,
      x11: cx0 * (r1 / r3 - 1),
      y11: cy0 * (r1 / r3 - 1)
    };
  }
  function arc_default() {
    var innerRadius = arcInnerRadius, outerRadius = arcOuterRadius, cornerRadius = constant_default4(0), padRadius = null, startAngle = arcStartAngle, endAngle = arcEndAngle, padAngle = arcPadAngle, context = null;
    function arc() {
      var buffer, r3, r0 = +innerRadius.apply(this, arguments), r1 = +outerRadius.apply(this, arguments), a0 = startAngle.apply(this, arguments) - halfPi, a1 = endAngle.apply(this, arguments) - halfPi, da = abs2(a1 - a0), cw = a1 > a0;
      if (!context)
        context = buffer = path_default();
      if (r1 < r0)
        r3 = r1, r1 = r0, r0 = r3;
      if (!(r1 > epsilon2))
        context.moveTo(0, 0);
      else if (da > tau2 - epsilon2) {
        context.moveTo(r1 * cos(a0), r1 * sin(a0));
        context.arc(0, 0, r1, a0, a1, !cw);
        if (r0 > epsilon2) {
          context.moveTo(r0 * cos(a1), r0 * sin(a1));
          context.arc(0, 0, r0, a1, a0, cw);
        }
      } else {
        var a01 = a0, a11 = a1, a00 = a0, a10 = a1, da0 = da, da1 = da, ap = padAngle.apply(this, arguments) / 2, rp = ap > epsilon2 && (padRadius ? +padRadius.apply(this, arguments) : sqrt(r0 * r0 + r1 * r1)), rc = min2(abs2(r1 - r0) / 2, +cornerRadius.apply(this, arguments)), rc0 = rc, rc1 = rc, t0, t1;
        if (rp > epsilon2) {
          var p0 = asin(rp / r0 * sin(ap)), p1 = asin(rp / r1 * sin(ap));
          if ((da0 -= p0 * 2) > epsilon2)
            p0 *= cw ? 1 : -1, a00 += p0, a10 -= p0;
          else
            da0 = 0, a00 = a10 = (a0 + a1) / 2;
          if ((da1 -= p1 * 2) > epsilon2)
            p1 *= cw ? 1 : -1, a01 += p1, a11 -= p1;
          else
            da1 = 0, a01 = a11 = (a0 + a1) / 2;
        }
        var x01 = r1 * cos(a01), y01 = r1 * sin(a01), x10 = r0 * cos(a10), y10 = r0 * sin(a10);
        if (rc > epsilon2) {
          var x11 = r1 * cos(a11), y11 = r1 * sin(a11), x00 = r0 * cos(a00), y00 = r0 * sin(a00), oc;
          if (da < pi2 && (oc = intersect(x01, y01, x00, y00, x11, y11, x10, y10))) {
            var ax = x01 - oc[0], ay = y01 - oc[1], bx = x11 - oc[0], by = y11 - oc[1], kc = 1 / sin(acos((ax * bx + ay * by) / (sqrt(ax * ax + ay * ay) * sqrt(bx * bx + by * by))) / 2), lc = sqrt(oc[0] * oc[0] + oc[1] * oc[1]);
            rc0 = min2(rc, (r0 - lc) / (kc - 1));
            rc1 = min2(rc, (r1 - lc) / (kc + 1));
          }
        }
        if (!(da1 > epsilon2))
          context.moveTo(x01, y01);
        else if (rc1 > epsilon2) {
          t0 = cornerTangents(x00, y00, x01, y01, r1, rc1, cw);
          t1 = cornerTangents(x11, y11, x10, y10, r1, rc1, cw);
          context.moveTo(t0.cx + t0.x01, t0.cy + t0.y01);
          if (rc1 < rc)
            context.arc(t0.cx, t0.cy, rc1, atan2(t0.y01, t0.x01), atan2(t1.y01, t1.x01), !cw);
          else {
            context.arc(t0.cx, t0.cy, rc1, atan2(t0.y01, t0.x01), atan2(t0.y11, t0.x11), !cw);
            context.arc(0, 0, r1, atan2(t0.cy + t0.y11, t0.cx + t0.x11), atan2(t1.cy + t1.y11, t1.cx + t1.x11), !cw);
            context.arc(t1.cx, t1.cy, rc1, atan2(t1.y11, t1.x11), atan2(t1.y01, t1.x01), !cw);
          }
        } else
          context.moveTo(x01, y01), context.arc(0, 0, r1, a01, a11, !cw);
        if (!(r0 > epsilon2) || !(da0 > epsilon2))
          context.lineTo(x10, y10);
        else if (rc0 > epsilon2) {
          t0 = cornerTangents(x10, y10, x11, y11, r0, -rc0, cw);
          t1 = cornerTangents(x01, y01, x00, y00, r0, -rc0, cw);
          context.lineTo(t0.cx + t0.x01, t0.cy + t0.y01);
          if (rc0 < rc)
            context.arc(t0.cx, t0.cy, rc0, atan2(t0.y01, t0.x01), atan2(t1.y01, t1.x01), !cw);
          else {
            context.arc(t0.cx, t0.cy, rc0, atan2(t0.y01, t0.x01), atan2(t0.y11, t0.x11), !cw);
            context.arc(0, 0, r0, atan2(t0.cy + t0.y11, t0.cx + t0.x11), atan2(t1.cy + t1.y11, t1.cx + t1.x11), cw);
            context.arc(t1.cx, t1.cy, rc0, atan2(t1.y11, t1.x11), atan2(t1.y01, t1.x01), !cw);
          }
        } else
          context.arc(0, 0, r0, a10, a00, cw);
      }
      context.closePath();
      if (buffer)
        return context = null, buffer + "" || null;
    }
    arc.centroid = function() {
      var r3 = (+innerRadius.apply(this, arguments) + +outerRadius.apply(this, arguments)) / 2, a3 = (+startAngle.apply(this, arguments) + +endAngle.apply(this, arguments)) / 2 - pi2 / 2;
      return [cos(a3) * r3, sin(a3) * r3];
    };
    arc.innerRadius = function(_3) {
      return arguments.length ? (innerRadius = typeof _3 === "function" ? _3 : constant_default4(+_3), arc) : innerRadius;
    };
    arc.outerRadius = function(_3) {
      return arguments.length ? (outerRadius = typeof _3 === "function" ? _3 : constant_default4(+_3), arc) : outerRadius;
    };
    arc.cornerRadius = function(_3) {
      return arguments.length ? (cornerRadius = typeof _3 === "function" ? _3 : constant_default4(+_3), arc) : cornerRadius;
    };
    arc.padRadius = function(_3) {
      return arguments.length ? (padRadius = _3 == null ? null : typeof _3 === "function" ? _3 : constant_default4(+_3), arc) : padRadius;
    };
    arc.startAngle = function(_3) {
      return arguments.length ? (startAngle = typeof _3 === "function" ? _3 : constant_default4(+_3), arc) : startAngle;
    };
    arc.endAngle = function(_3) {
      return arguments.length ? (endAngle = typeof _3 === "function" ? _3 : constant_default4(+_3), arc) : endAngle;
    };
    arc.padAngle = function(_3) {
      return arguments.length ? (padAngle = typeof _3 === "function" ? _3 : constant_default4(+_3), arc) : padAngle;
    };
    arc.context = function(_3) {
      return arguments.length ? (context = _3 == null ? null : _3, arc) : context;
    };
    return arc;
  }

  // ../node_modules/d3-shape/src/array.js
  var slice = Array.prototype.slice;
  function array_default(x3) {
    return typeof x3 === "object" && "length" in x3 ? x3 : Array.from(x3);
  }

  // ../node_modules/d3-shape/src/descending.js
  function descending_default(a3, b3) {
    return b3 < a3 ? -1 : b3 > a3 ? 1 : b3 >= a3 ? 0 : NaN;
  }

  // ../node_modules/d3-shape/src/identity.js
  function identity_default2(d3) {
    return d3;
  }

  // ../node_modules/d3-shape/src/pie.js
  function pie_default() {
    var value = identity_default2, sortValues = descending_default, sort = null, startAngle = constant_default4(0), endAngle = constant_default4(tau2), padAngle = constant_default4(0);
    function pie(data) {
      var i3, n2 = (data = array_default(data)).length, j4, k3, sum2 = 0, index = new Array(n2), arcs = new Array(n2), a0 = +startAngle.apply(this, arguments), da = Math.min(tau2, Math.max(-tau2, endAngle.apply(this, arguments) - a0)), a1, p3 = Math.min(Math.abs(da) / n2, padAngle.apply(this, arguments)), pa = p3 * (da < 0 ? -1 : 1), v3;
      for (i3 = 0; i3 < n2; ++i3) {
        if ((v3 = arcs[index[i3] = i3] = +value(data[i3], i3, data)) > 0) {
          sum2 += v3;
        }
      }
      if (sortValues != null)
        index.sort(function(i4, j5) {
          return sortValues(arcs[i4], arcs[j5]);
        });
      else if (sort != null)
        index.sort(function(i4, j5) {
          return sort(data[i4], data[j5]);
        });
      for (i3 = 0, k3 = sum2 ? (da - n2 * pa) / sum2 : 0; i3 < n2; ++i3, a0 = a1) {
        j4 = index[i3], v3 = arcs[j4], a1 = a0 + (v3 > 0 ? v3 * k3 : 0) + pa, arcs[j4] = {
          data: data[j4],
          index: i3,
          value: v3,
          startAngle: a0,
          endAngle: a1,
          padAngle: p3
        };
      }
      return arcs;
    }
    pie.value = function(_3) {
      return arguments.length ? (value = typeof _3 === "function" ? _3 : constant_default4(+_3), pie) : value;
    };
    pie.sortValues = function(_3) {
      return arguments.length ? (sortValues = _3, sort = null, pie) : sortValues;
    };
    pie.sort = function(_3) {
      return arguments.length ? (sort = _3, sortValues = null, pie) : sort;
    };
    pie.startAngle = function(_3) {
      return arguments.length ? (startAngle = typeof _3 === "function" ? _3 : constant_default4(+_3), pie) : startAngle;
    };
    pie.endAngle = function(_3) {
      return arguments.length ? (endAngle = typeof _3 === "function" ? _3 : constant_default4(+_3), pie) : endAngle;
    };
    pie.padAngle = function(_3) {
      return arguments.length ? (padAngle = typeof _3 === "function" ? _3 : constant_default4(+_3), pie) : padAngle;
    };
    return pie;
  }

  // ../node_modules/d3-zoom/src/transform.js
  function Transform(k3, x3, y3) {
    this.k = k3;
    this.x = x3;
    this.y = y3;
  }
  Transform.prototype = {
    constructor: Transform,
    scale: function(k3) {
      return k3 === 1 ? this : new Transform(this.k * k3, this.x, this.y);
    },
    translate: function(x3, y3) {
      return x3 === 0 & y3 === 0 ? this : new Transform(this.k, this.x + this.k * x3, this.y + this.k * y3);
    },
    apply: function(point) {
      return [point[0] * this.k + this.x, point[1] * this.k + this.y];
    },
    applyX: function(x3) {
      return x3 * this.k + this.x;
    },
    applyY: function(y3) {
      return y3 * this.k + this.y;
    },
    invert: function(location) {
      return [(location[0] - this.x) / this.k, (location[1] - this.y) / this.k];
    },
    invertX: function(x3) {
      return (x3 - this.x) / this.k;
    },
    invertY: function(y3) {
      return (y3 - this.y) / this.k;
    },
    rescaleX: function(x3) {
      return x3.copy().domain(x3.range().map(this.invertX, this).map(x3.invert, x3));
    },
    rescaleY: function(y3) {
      return y3.copy().domain(y3.range().map(this.invertY, this).map(y3.invert, y3));
    },
    toString: function() {
      return "translate(" + this.x + "," + this.y + ") scale(" + this.k + ")";
    }
  };
  var identity2 = new Transform(1, 0, 0);
  transform.prototype = Transform.prototype;
  function transform(node) {
    while (!node.__zoom)
      if (!(node = node.parentNode))
        return identity2;
    return node.__zoom;
  }

  // ../node_modules/preact/compat/dist/compat.module.js
  function C2(n2, t3) {
    for (var e3 in t3)
      n2[e3] = t3[e3];
    return n2;
  }
  function S2(n2, t3) {
    for (var e3 in n2)
      if (e3 !== "__source" && !(e3 in t3))
        return true;
    for (var r3 in t3)
      if (r3 !== "__source" && n2[r3] !== t3[r3])
        return true;
    return false;
  }
  function E(n2) {
    this.props = n2;
  }
  (E.prototype = new _()).isPureReactComponent = true, E.prototype.shouldComponentUpdate = function(n2, t3) {
    return S2(this.props, n2) || S2(this.state, t3);
  };
  var w3 = l.__b;
  l.__b = function(n2) {
    n2.type && n2.type.__f && n2.ref && (n2.props.ref = n2.ref, n2.ref = null), w3 && w3(n2);
  };
  var R = typeof Symbol != "undefined" && Symbol.for && Symbol.for("react.forward_ref") || 3911;
  var A3 = l.__e;
  l.__e = function(n2, t3, e3, r3) {
    if (n2.then) {
      for (var u3, o3 = t3; o3 = o3.__; )
        if ((u3 = o3.__c) && u3.__c)
          return t3.__e == null && (t3.__e = e3.__e, t3.__k = e3.__k), u3.__c(n2, t3);
    }
    A3(n2, t3, e3, r3);
  };
  var O2 = l.unmount;
  function L2() {
    this.__u = 0, this.t = null, this.__b = null;
  }
  function U(n2) {
    var t3 = n2.__.__c;
    return t3 && t3.__e && t3.__e(n2);
  }
  function M2() {
    this.u = null, this.o = null;
  }
  l.unmount = function(n2) {
    var t3 = n2.__c;
    t3 && t3.__R && t3.__R(), t3 && n2.__h === true && (n2.type = null), O2 && O2(n2);
  }, (L2.prototype = new _()).__c = function(n2, t3) {
    var e3 = t3.__c, r3 = this;
    r3.t == null && (r3.t = []), r3.t.push(e3);
    var u3 = U(r3.__v), o3 = false, i3 = function() {
      o3 || (o3 = true, e3.__R = null, u3 ? u3(l3) : l3());
    };
    e3.__R = i3;
    var l3 = function() {
      if (!--r3.__u) {
        if (r3.state.__e) {
          var n3 = r3.state.__e;
          r3.__v.__k[0] = function n4(t5, e4, r4) {
            return t5 && (t5.__v = null, t5.__k = t5.__k && t5.__k.map(function(t6) {
              return n4(t6, e4, r4);
            }), t5.__c && t5.__c.__P === e4 && (t5.__e && r4.insertBefore(t5.__e, t5.__d), t5.__c.__e = true, t5.__c.__P = r4)), t5;
          }(n3, n3.__c.__P, n3.__c.__O);
        }
        var t4;
        for (r3.setState({ __e: r3.__b = null }); t4 = r3.t.pop(); )
          t4.forceUpdate();
      }
    }, f3 = t3.__h === true;
    r3.__u++ || f3 || r3.setState({ __e: r3.__b = r3.__v.__k[0] }), n2.then(i3, i3);
  }, L2.prototype.componentWillUnmount = function() {
    this.t = [];
  }, L2.prototype.render = function(n2, t3) {
    if (this.__b) {
      if (this.__v.__k) {
        var e3 = document.createElement("div"), r3 = this.__v.__k[0].__c;
        this.__v.__k[0] = function n3(t4, e4, r4) {
          return t4 && (t4.__c && t4.__c.__H && (t4.__c.__H.__.forEach(function(n4) {
            typeof n4.__c == "function" && n4.__c();
          }), t4.__c.__H = null), (t4 = C2({}, t4)).__c != null && (t4.__c.__P === r4 && (t4.__c.__P = e4), t4.__c = null), t4.__k = t4.__k && t4.__k.map(function(t5) {
            return n3(t5, e4, r4);
          })), t4;
        }(this.__b, e3, r3.__O = r3.__P);
      }
      this.__b = null;
    }
    var u3 = t3.__e && v(d, null, n2.fallback);
    return u3 && (u3.__h = null), [v(d, null, t3.__e ? null : n2.children), u3];
  };
  var T3 = function(n2, t3, e3) {
    if (++e3[1] === e3[0] && n2.o.delete(t3), n2.props.revealOrder && (n2.props.revealOrder[0] !== "t" || !n2.o.size))
      for (e3 = n2.u; e3; ) {
        for (; e3.length > 3; )
          e3.pop()();
        if (e3[1] < e3[0])
          break;
        n2.u = e3 = e3[2];
      }
  };
  (M2.prototype = new _()).__e = function(n2) {
    var t3 = this, e3 = U(t3.__v), r3 = t3.o.get(n2);
    return r3[0]++, function(u3) {
      var o3 = function() {
        t3.props.revealOrder ? (r3.push(u3), T3(t3, n2, r3)) : u3();
      };
      e3 ? e3(o3) : o3();
    };
  }, M2.prototype.render = function(n2) {
    this.u = null, this.o = /* @__PURE__ */ new Map();
    var t3 = A(n2.children);
    n2.revealOrder && n2.revealOrder[0] === "b" && t3.reverse();
    for (var e3 = t3.length; e3--; )
      this.o.set(t3[e3], this.u = [1, 0, this.u]);
    return n2.children;
  }, M2.prototype.componentDidUpdate = M2.prototype.componentDidMount = function() {
    var n2 = this;
    this.o.forEach(function(t3, e3) {
      T3(n2, e3, t3);
    });
  };
  var P2 = typeof Symbol != "undefined" && Symbol.for && Symbol.for("react.element") || 60103;
  var V = /^(?:accent|alignment|arabic|baseline|cap|clip(?!PathU)|color|dominant|fill|flood|font|glyph(?!R)|horiz|marker(?!H|W|U)|overline|paint|stop|strikethrough|stroke|text(?!L)|underline|unicode|units|v|vector|vert|word|writing|x(?!C))[A-Z]/;
  var j3 = typeof document != "undefined";
  var z2 = function(n2) {
    return (typeof Symbol != "undefined" && typeof Symbol() == "symbol" ? /fil|che|rad/i : /fil|che|ra/i).test(n2);
  };
  _.prototype.isReactComponent = {}, ["componentWillMount", "componentWillReceiveProps", "componentWillUpdate"].forEach(function(n2) {
    Object.defineProperty(_.prototype, n2, { configurable: true, get: function() {
      return this["UNSAFE_" + n2];
    }, set: function(t3) {
      Object.defineProperty(this, n2, { configurable: true, writable: true, value: t3 });
    } });
  });
  var H2 = l.event;
  function Z() {
  }
  function Y2() {
    return this.cancelBubble;
  }
  function q2() {
    return this.defaultPrevented;
  }
  l.event = function(n2) {
    return H2 && (n2 = H2(n2)), n2.persist = Z, n2.isPropagationStopped = Y2, n2.isDefaultPrevented = q2, n2.nativeEvent = n2;
  };
  var G;
  var J = { configurable: true, get: function() {
    return this.class;
  } };
  var K = l.vnode;
  l.vnode = function(n2) {
    var t3 = n2.type, e3 = n2.props, r3 = e3;
    if (typeof t3 == "string") {
      var u3 = t3.indexOf("-") === -1;
      for (var o3 in r3 = {}, e3) {
        var i3 = e3[o3];
        j3 && o3 === "children" && t3 === "noscript" || o3 === "value" && "defaultValue" in e3 && i3 == null || (o3 === "defaultValue" && "value" in e3 && e3.value == null ? o3 = "value" : o3 === "download" && i3 === true ? i3 = "" : /ondoubleclick/i.test(o3) ? o3 = "ondblclick" : /^onchange(textarea|input)/i.test(o3 + t3) && !z2(e3.type) ? o3 = "oninput" : /^onfocus$/i.test(o3) ? o3 = "onfocusin" : /^onblur$/i.test(o3) ? o3 = "onfocusout" : /^on(Ani|Tra|Tou|BeforeInp|Compo)/.test(o3) ? o3 = o3.toLowerCase() : u3 && V.test(o3) ? o3 = o3.replace(/[A-Z0-9]/, "-$&").toLowerCase() : i3 === null && (i3 = void 0), r3[o3] = i3);
      }
      t3 == "select" && r3.multiple && Array.isArray(r3.value) && (r3.value = A(e3.children).forEach(function(n3) {
        n3.props.selected = r3.value.indexOf(n3.props.value) != -1;
      })), t3 == "select" && r3.defaultValue != null && (r3.value = A(e3.children).forEach(function(n3) {
        n3.props.selected = r3.multiple ? r3.defaultValue.indexOf(n3.props.value) != -1 : r3.defaultValue == n3.props.value;
      })), n2.props = r3, e3.class != e3.className && (J.enumerable = "className" in e3, e3.className != null && (r3.class = e3.className), Object.defineProperty(r3, "className", J));
    }
    n2.$$typeof = P2, K && K(n2);
  };
  var Q = l.__r;
  l.__r = function(n2) {
    Q && Q(n2), G = n2.__c;
  };
  function un(n2) {
    return !!n2.__k && (S(null, n2), true);
  }

  // code-treemap.tsx
  var webtreemap = __toESM(require_webtreemap());

  // symbol.ts
  function parseCPP(name) {
    const stack = [];
    let letters = [];
    for (let i3 = 0; i3 < name.length; i3++) {
      switch (name[i3]) {
        case "(":
          stack.push(name[i3]);
          continue;
        case "<":
          if (name[i3 + 1] !== "=") {
            stack.push(name[i3]);
            continue;
          }
          break;
        case ")":
          if (stack.pop() !== "(")
            throw new Error("failed to parse C++ symbol");
          if (stack.length === 0)
            letters.push("()");
          continue;
        case ">":
          if (name[i3 + 1] !== "=") {
            if (stack.pop() !== "<") {
              throw new Error("failed to parse C++ symbol");
            }
            continue;
          }
          break;
        case "-":
          if (name[i3 + 1] === ">") {
            i3++;
            if (stack.length === 0)
              letters.push("->");
            continue;
          }
          break;
      }
      if (stack.length === 0) {
        letters.push(name[i3]);
      }
    }
    name = letters.join("");
    let parts = name.split(" ").filter((part) => part !== "()");
    let fn = parts.find((part) => part.endsWith("()") && part !== "decltype()");
    if (fn) {
      fn = fn.slice(0, -2);
    } else {
      fn = parts[parts.length - 1];
    }
    return fn.split("::");
  }
  function parseRust(name) {
    const parts = name.split("::");
    const last = parts[parts.length - 1];
    if (/h[0-9a-f]{16}/.test(last)) {
      parts.pop();
    }
    return parts;
  }

  // code-treemap.tsx
  function showCodeTreemap(toolchain, headers, nameMap) {
    const root2 = new FunctionNode("code");
    let nameToPath = (name) => name.split(".");
    switch (toolchain) {
      case "Go":
        nameToPath = (name) => name.split(/[._:]/);
        break;
      case "Rust":
        nameToPath = parseRust;
        break;
      default:
        for (const name of nameMap.values()) {
          if (name.startsWith("std::")) {
            nameToPath = parseCPP;
            break;
          }
        }
    }
    for (const header of headers) {
      const name = nameMap.get(header.index);
      let path2 = ["unknown", String(header.index)];
      try {
        if (name) {
          const parsed = nameToPath(name).filter((p3) => p3);
          if (parsed.length === 0) {
            console.error(`BUG: failed to simplify ${name}`);
          } else {
            path2 = parsed;
          }
        }
      } catch (err) {
        console.error(`parsing ${JSON.stringify(name)}: ${err}`);
      }
      root2.addFunction(header, path2);
    }
    root2.sort();
    const container = document.createElement("div");
    container.className = "code-treemap-container";
    document.body.appendChild(container);
    S(/* @__PURE__ */ v(Treemap, {
      root: root2,
      onDone: () => {
        un(container);
        container.remove();
      }
    }), container);
  }
  var Treemap = class extends _ {
    constructor() {
      super(...arguments);
      this.containerRef = p();
    }
    render() {
      const { onDone } = this.props;
      return /* @__PURE__ */ v(d, null, /* @__PURE__ */ v("button", {
        className: "code-treemap-done",
        onClick: onDone
      }, "\u274C"), /* @__PURE__ */ v("div", {
        className: "code-treemap",
        ref: this.containerRef
      }));
    }
    componentDidMount() {
      const { current: container } = this.containerRef;
      if (!container) {
        return;
      }
      const { root: root2 } = this.props;
      webtreemap.render(container, root2, {
        caption(node) {
          return `${node.id} (${format(",")(node.size)})`;
        }
      });
    }
  };
  var FunctionNode = class {
    constructor(id2, size = 0) {
      this.children = [];
      this.childrenByName = /* @__PURE__ */ new Map();
      this.id = id2;
      this.size = size;
    }
    addFunction(func, path2) {
      this.size += func.len;
      if (path2.length === 1) {
        const child2 = new FunctionNode(path2[0], func.len);
        this.children.push(child2);
        return;
      }
      const [head, ...tail] = path2;
      let child = this.childrenByName.get(head);
      if (!child) {
        child = new FunctionNode(head);
        this.children.push(child);
        this.childrenByName.set(head, child);
      }
      child.addFunction(func, tail);
    }
    sort() {
      this.children.sort((a3, b3) => descending(a3.size, b3.size));
      for (const child of this.childrenByName.values()) {
        child.sort();
      }
    }
  };

  // memo.ts
  function arrayEqual(a3, b3) {
    if (a3.length !== b3.length)
      return false;
    for (let i3 = 0; i3 < a3.length; i3++) {
      if (a3[i3] !== b3[i3])
        return false;
    }
    return true;
  }
  function memo(fn) {
    let lastArgs = [];
    let lastValue = void 0;
    const memoed = function() {
      if (!arrayEqual(arguments, lastArgs)) {
        lastArgs = [...arguments];
        lastValue = fn(...lastArgs);
      }
      return lastValue;
    };
    return memoed;
  }

  // table.tsx
  var Table = class extends _ {
    constructor() {
      super(...arguments);
      this.state = { limit: 100 };
      this.rows = memo(function(sortBy, limit, rows) {
        rows = [...rows];
        if (sortBy && sortBy.sort) {
          rows.sort(sortBy.sort);
        }
        if (limit < rows.length) {
          rows = rows.slice(0, limit);
        }
        return rows;
      });
    }
    shouldComponentUpdate(nextProps, nextState) {
      return this.props !== nextProps || this.state !== nextState;
    }
    render() {
      const rows = this.rows(this.state.sortBy, this.state.limit, this.props.children);
      return /* @__PURE__ */ v("table", {
        cellSpacing: "0",
        cellPadding: "0"
      }, /* @__PURE__ */ v("thead", null, /* @__PURE__ */ v("tr", null, this.props.columns.map((col) => {
        const canSort = col.sort !== void 0;
        return /* @__PURE__ */ v("th", {
          className: (col.className ?? "") + (canSort ? " pointer" : ""),
          onClick: canSort ? () => this.setState({ sortBy: col }) : void 0
        }, col.name, this.state.sortBy === col && " \u2193");
      }))), /* @__PURE__ */ v("tbody", null, rows.map((row) => {
        return /* @__PURE__ */ v("tr", {
          className: this.props.onClick ? "hover pointer" : "",
          onClick: this.props.onClick && (() => this.props.onClick(row))
        }, this.props.columns.map((col) => {
          return /* @__PURE__ */ v("td", {
            className: col.className + " " + col.cellClass
          }, col.data(row));
        }));
      }), rows.length < this.props.children.length && /* @__PURE__ */ v("tr", null, /* @__PURE__ */ v("td", {
        colSpan: this.props.columns.length
      }, /* @__PURE__ */ v("button", {
        onClick: () => this.setState({ limit: this.state.limit + 1e3 })
      }, "show ", Math.min(1e3, this.props.children.length - this.rows.length), " more")))));
    }
  };

  // code.tsx
  function XRef(props) {
    const name = props.names?.get(props.id) ?? props.id;
    return /* @__PURE__ */ v("span", {
      className: props.highlight === props.id ? "highlight" : void 0,
      title: props.id,
      onMouseEnter: () => props.onHighlight?.(props.id)
    }, name);
  }
  var Instructions = class extends _ {
    constructor() {
      super(...arguments);
      this.state = { expanded: false };
      this.labelRefCounts = [];
      this.labelStack = [];
      this.nextLabel = 0;
      this.expand = () => {
        this.setState({ expanded: true });
      };
    }
    render() {
      const lines = [];
      let expand;
      this.labelStack = [];
      this.nextLabel = 0;
      this.addLabel();
      for (const line of this.renderInstrs(this.props.instrs)) {
        lines.push(line);
        if (lines.length >= 50 && !this.state.expanded) {
          expand = /* @__PURE__ */ v("div", null, "\n", /* @__PURE__ */ v("button", {
            onClick: this.expand
          }, "show all"));
          break;
        }
      }
      return /* @__PURE__ */ v(d, null, /* @__PURE__ */ v("pre", {
        class: "code"
      }, lines), expand);
    }
    addLabel() {
      const label = this.nextLabel++;
      this.labelStack.push(label);
      this.labelRefCounts[label] = 0;
      return label;
    }
    labelRef(stackIndex) {
      const label = this.labelStack[this.labelStack.length - stackIndex - 1];
      this.labelRefCounts[label]++;
      return /* @__PURE__ */ v(XRef, {
        id: `label${label}`,
        highlight: this.props.highlight,
        onHighlight: this.props.onHighlight
      });
    }
    labelTarget(label) {
      return /* @__PURE__ */ v("div", {
        class: "label"
      }, /* @__PURE__ */ v(XRef, {
        id: `label${label}`,
        highlight: this.props.highlight,
        onHighlight: this.props.onHighlight
      }), ":");
    }
    *renderInstr(instr, indent = 0) {
      switch (instr.op) {
        case "block" /* block */: {
          const label = this.addLabel();
          yield* this.renderInstrs(instr.body, indent);
          yield this.labelTarget(label);
          this.labelStack.pop();
          break;
        }
        case "loop" /* loop */: {
          const label = this.addLabel();
          yield /* @__PURE__ */ v("div", {
            style: `padding-left: ${indent * 2}ch`
          }, "loop");
          yield this.labelTarget(label);
          yield* this.renderInstrs(instr.body, indent + 1);
          this.labelStack.pop();
          break;
        }
        case "if" /* if */: {
          const label = this.addLabel();
          yield /* @__PURE__ */ v("div", {
            style: `padding-left: ${indent * 2}ch`
          }, "if");
          yield* this.renderInstrs(instr.body, indent + 1);
          if (instr.else) {
            yield /* @__PURE__ */ v("div", {
              style: `padding-left: ${indent * 2}ch`
            }, "else");
            yield* this.renderInstrs(instr.else, indent + 1);
          }
          yield this.labelTarget(label);
          this.labelStack.pop();
          break;
        }
        case "call" /* call */:
          yield /* @__PURE__ */ v("div", {
            style: `padding-left: ${indent * 2}ch`
          }, instr.op, " ", /* @__PURE__ */ v(FunctionRef, {
            module: this.props.module,
            index: instr.func
          }));
          break;
        case "global.get" /* global_get */:
        case "global.set" /* global_set */:
          yield /* @__PURE__ */ v("div", {
            style: `padding-left: ${indent * 2}ch`
          }, instr.op, " ", /* @__PURE__ */ v(GlobalRef, {
            module: this.props.module,
            index: instr.global
          }));
          break;
        case "local.get" /* local_get */:
        case "local.set" /* local_set */:
        case "local.tee" /* local_tee */:
          yield /* @__PURE__ */ v("div", {
            style: `padding-left: ${indent * 2}ch`
          }, instr.op, " $", /* @__PURE__ */ v(XRef, {
            id: `local${instr.local}`,
            names: this.props.localNames,
            highlight: this.props.highlight,
            onHighlight: this.props.onHighlight
          }));
          break;
        case "br" /* br */:
        case "br_if" /* br_if */: {
          const target = instr.label;
          yield /* @__PURE__ */ v("div", {
            style: `padding-left: ${indent * 2}ch`
          }, instr.op, " ", this.labelRef(target));
          break;
        }
        case "br_table" /* br_table */:
          yield /* @__PURE__ */ v("div", {
            style: `padding-left: ${indent * 2}ch`
          }, instr.op, " ", instr.labels.map((target, i3) => {
            const label = this.labelRef(target);
            return /* @__PURE__ */ v("span", null, i3, "=>", label, " ");
          }), " else=>", this.labelRef(instr.default));
          break;
        case "i32.const" /* i32_const */:
        case "i64.const" /* i64_const */:
          yield /* @__PURE__ */ v("div", {
            style: `padding-left: ${indent * 2}ch`
          }, instr.op, " ", instr.n);
          break;
        case "f32.const" /* f32_const */:
        case "f64.const" /* f64_const */:
          yield /* @__PURE__ */ v("div", {
            style: `padding-left: ${indent * 2}ch`
          }, instr.op, " ", instr.z);
          break;
        default:
          const toPrint = [instr.op.toString()];
          for (const [key, val] of Object.entries(instr)) {
            if (key === "op")
              continue;
            if (val instanceof Array)
              continue;
            toPrint.push(` ${key}=${val}`);
          }
          yield /* @__PURE__ */ v("div", {
            style: `padding-left: ${indent * 2}ch`
          }, toPrint.join(""), "\n");
      }
    }
    *renderInstrs(instrs, indent = 0) {
      for (const instr of instrs) {
        yield* this.renderInstr(instr, indent);
      }
    }
  };
  function EditableLocal(props) {
    return /* @__PURE__ */ v("span", {
      className: "flex-container",
      onMouseOver: props.onHover
    }, /* @__PURE__ */ v(InlineEdit, {
      onEdit: props.onEdit
    }, props.name));
  }
  function Function(props) {
    const funcBody = readFunction(new Reader(new DataView(props.module.bytes, props.func.ofs, props.func.len)));
    const funcType = props.module.types[props.func.typeidx];
    const [localNames, setLocalNames] = m2(() => {
      const localNames2 = /* @__PURE__ */ new Map();
      let index = 0;
      for (const param of funcType.params) {
        localNames2.set(`local${index}`, `param${index}`);
        index++;
      }
      for (const local of funcBody.locals) {
        localNames2.set(`local${index}`, `local${index}`);
        index++;
      }
      return localNames2;
    });
    const nameLocal = (id2, name) => {
      setLocalNames(new Map(localNames.set(id2, name)));
    };
    const [highlight, setHighlight] = m2(void 0);
    return /* @__PURE__ */ v(Screen, {
      title: `function ${props.func.index}`
    }, /* @__PURE__ */ v("table", null, /* @__PURE__ */ v("tr", null, /* @__PURE__ */ v("th", {
      className: "right"
    }, "name"), /* @__PURE__ */ v("td", null, props.name)), funcType.params.length > 0 && /* @__PURE__ */ v("tr", null, /* @__PURE__ */ v("th", {
      className: "right"
    }, "params"), /* @__PURE__ */ v("td", null, funcType.params.map((type2, index) => {
      const id2 = `local${index}`;
      return /* @__PURE__ */ v("div", {
        class: "flex-container"
      }, type2, "\xA0", /* @__PURE__ */ v(EditableLocal, {
        name: localNames.get(id2) ?? "",
        onHover: () => setHighlight(id2),
        onEdit: (name) => nameLocal(id2, name)
      }));
    }))), funcType.result.length > 0 && /* @__PURE__ */ v("tr", null, /* @__PURE__ */ v("th", {
      className: "right"
    }, "result"), /* @__PURE__ */ v("td", null, funcType.result.map((p3) => p3).join(", "))), funcBody.locals.length > 0 && /* @__PURE__ */ v("tr", null, /* @__PURE__ */ v("th", {
      className: "right"
    }, "locals"), /* @__PURE__ */ v("td", null, funcBody.locals.map((type2, i3) => {
      const index = i3 + funcType.params.length;
      const id2 = `local${index}`;
      return /* @__PURE__ */ v("div", {
        class: "flex-container"
      }, type2, "\xA0", /* @__PURE__ */ v(EditableLocal, {
        name: localNames.get(id2) ?? "",
        onHover: () => setHighlight(id2),
        onEdit: (name) => nameLocal(id2, name)
      }));
    })))), /* @__PURE__ */ v(Instructions, {
      module: props.module,
      localNames,
      instrs: funcBody.body,
      highlight,
      onHighlight: setHighlight
    }));
  }
  function IncrementalInput(args) {
    const incrementalArgs = { type: "search", incremental: true, ...args };
    return /* @__PURE__ */ v("input", {
      ...incrementalArgs
    });
  }
  function CodeSection(props) {
    const totalSize = _2(() => sum(props.children.map((f3) => f3.len)), props.children);
    const [filter2, setFilter] = m2("");
    const funcs = filter2 ? props.children.filter((f3) => {
      const name = props.functionNames.get(f3.index);
      return name?.match(filter2);
    }) : props.children;
    const columns = [
      { name: "index", className: "right", sort: null, data: (f3) => f3.index },
      {
        name: "name",
        cellClass: "break-all",
        sort: (a3, b3) => ascending(props.functionNames.get(a3.index), props.functionNames.get(b3.index)),
        data: (f3) => /* @__PURE__ */ v("code", null, props.functionNames.get(f3.index))
      },
      {
        name: "size",
        className: "right",
        sort: (a3, b3) => descending(a3.len, b3.len),
        data: (f3) => format(",")(f3.len)
      },
      {
        name: "%",
        className: "right",
        data: (f3) => format(".1%")(f3.len / totalSize)
      }
    ];
    return /* @__PURE__ */ v(Screen, {
      title: '"code" section'
    }, /* @__PURE__ */ v("p", {
      style: { display: "flex" }
    }, /* @__PURE__ */ v("div", null, "Function bodies.", " ", /* @__PURE__ */ v("button", {
      onClick: () => showCodeTreemap(props.module.toolchain, props.children, props.functionNames)
    }, "View Treemap")), /* @__PURE__ */ v("div", {
      style: { flex: 1 }
    }), /* @__PURE__ */ v(IncrementalInput, {
      placeholder: "filter by name",
      onSearch: (ev) => setFilter(ev.target.value)
    })), /* @__PURE__ */ v(Table, {
      columns,
      onClick: (func) => props.onClick(func.index)
    }, funcs));
  }

  // data.tsx
  function DataSection(props) {
    const columns = [
      {
        name: "index",
        className: "right",
        sort: null,
        data: (data) => data.index
      },
      {
        name: "size",
        className: "right",
        sort: (a3, b3) => b3.init.byteLength - a3.init.byteLength,
        data: (data) => data.init.byteLength
      },
      {
        name: "init",
        data: (data) => {
          if (data.memidx === void 0)
            return "passive";
          return /* @__PURE__ */ v(Instructions, {
            module: props.module,
            instrs: data.offset
          });
        }
      }
    ];
    return /* @__PURE__ */ v(Screen, {
      title: '"data" section'
    }, /* @__PURE__ */ v("p", null, "Initialization-time data."), /* @__PURE__ */ v(Table, {
      columns,
      onClick: props.onClick
    }, props.data));
  }
  function hex2(byte, pad = 2) {
    return byte.toString(16).padStart(pad, "0");
  }
  var HexView = class extends _ {
    render() {
      const visibleRows = 20;
      const view = this.props.data;
      const rows = [];
      for (let row = 0; row < visibleRows && row * 16 < view.byteLength; row++) {
        const hexBytes = [];
        const vizBytes = [];
        for (let col = 0; col < 16; col++) {
          const index = row * 16 + col;
          if (index >= view.byteLength) {
            hexBytes.push("   ");
            vizBytes.push(" ");
            continue;
          }
          const byte = view.getUint8(index);
          const hexByte = hex2(byte);
          const vizByte = byte >= 32 && byte < 127 ? String.fromCharCode(byte) : ".";
          hexBytes.push(" ", /* @__PURE__ */ v("span", {
            onMouseOver: () => this.setState({ hover: index }),
            className: index === this.state.hover ? "highlight" : ""
          }, hexByte));
          vizBytes.push(/* @__PURE__ */ v("span", {
            onMouseOver: () => this.setState({ hover: index }),
            className: index === this.state.hover ? "highlight" : ""
          }, vizByte));
        }
        rows.push(/* @__PURE__ */ v("div", null, hex2(row * 16, 6), " ", hexBytes, "  ", vizBytes));
      }
      return /* @__PURE__ */ v("pre", null, rows);
    }
  };
  function DataHex(props) {
    return /* @__PURE__ */ v(Screen, {
      title: `data[${props.data.index}]`
    }, /* @__PURE__ */ v("table", null, /* @__PURE__ */ v("tr", null, /* @__PURE__ */ v("th", {
      className: "right"
    }, "size"), /* @__PURE__ */ v("td", null, format(",")(props.data.init.byteLength), " bytes")), /* @__PURE__ */ v("tr", null, /* @__PURE__ */ v("th", {
      className: "right"
    }, "init"), /* @__PURE__ */ v("td", null, /* @__PURE__ */ v(Instructions, {
      module: props.module,
      instrs: props.data.offset
    })))), /* @__PURE__ */ v(HexView, {
      data: props.data.init
    }));
  }

  // impexp.tsx
  function ImpExpDesc(props) {
    switch (props.desc.kind) {
      case "typeidx" /* typeidx */:
        return /* @__PURE__ */ v("div", null, "function ", props.index, ": ", /* @__PURE__ */ v(FunctionType, {
          type: props.module.types[props.desc.index]
        }));
      case "funcidx" /* funcidx */:
        return /* @__PURE__ */ v("div", null, "function ", props.desc.index, ": ", /* @__PURE__ */ v(FunctionRef, {
          module: props.module,
          index: props.desc.index
        }));
      case "tableidx" /* tableidx */: {
        const sec = props.module.sections.findIndex((sec2) => sec2.kind === "table" /* table */);
        return /* @__PURE__ */ v("div", null, /* @__PURE__ */ v(Link, {
          target: ["section", sec]
        }, "table ", props.desc.index));
      }
      case "memidx" /* memidx */: {
        const sec = props.module.sections.findIndex((sec2) => sec2.kind === "memory" /* memory */);
        return /* @__PURE__ */ v("div", null, /* @__PURE__ */ v(Link, {
          target: ["section", sec]
        }, "memory ", props.desc.index));
      }
      default:
        return /* @__PURE__ */ v("div", null, descToString(props.desc));
    }
  }
  function Imports(props) {
    const columns = [
      {
        name: "name",
        cellClass: "break-all",
        data: (imp) => /* @__PURE__ */ v("code", null, imp.module, ".", imp.name)
      },
      {
        name: "desc",
        cellClass: "nowrap",
        data: (imp) => /* @__PURE__ */ v(ImpExpDesc, {
          module: props.module,
          index: imp.index,
          desc: imp.desc
        })
      }
    ];
    return /* @__PURE__ */ v(Screen, {
      title: '"import" section'
    }, /* @__PURE__ */ v("p", null, "Functions etc. imported from the host environment."), /* @__PURE__ */ v(Table, {
      columns
    }, props.module.imports));
  }
  function Exports(props) {
    const columns = [
      {
        name: "name",
        cellClass: "break-all",
        data: (exp) => /* @__PURE__ */ v("code", null, exp.name)
      },
      {
        name: "desc",
        cellClass: "nowrap",
        data: (exp) => /* @__PURE__ */ v(ImpExpDesc, {
          module: props.module,
          desc: exp.desc
        })
      }
    ];
    return /* @__PURE__ */ v(Screen, {
      title: '"export" section'
    }, /* @__PURE__ */ v("p", null, "Functions etc. exported to the host environment."), /* @__PURE__ */ v(Table, {
      columns
    }, props.module.exports));
  }

  // sections.tsx
  function Pie(props) {
    const width = 200;
    const height = 200;
    const colors = props.sections.map((_3, i3) => Blues_default(i3 / props.sections.length));
    const color2 = ordinal(props.sections, colors);
    const arcs = pie_default().padAngle(0.01).value((s3) => s3.len)(props.sections);
    const arc = arc_default().innerRadius(width / 2 * 0.6).outerRadius(width / 2 * 0.95);
    return /* @__PURE__ */ v("svg", {
      width,
      height,
      viewBox: [-width / 2, -height / 2, width, height].join(" ")
    }, /* @__PURE__ */ v("g", {
      strokeLinejoin: "round",
      strokeWidth: "2",
      ref: (g3) => select_default2(g3).selectAll("path").data(arcs).join("path").attr("fill", (d3) => color2(d3.data)).attr("stroke", (d3) => d3.data === props.hovered ? "black" : "none").attr("d", arc).on("mouseover", (ev, d3) => props.onHover(d3.data)).on("mouseout", (ev, d3) => props.onHover(void 0)).on("click", (e3, d3) => props.onClick(d3.data))
    }));
  }
  function SectionTable(props) {
    const totalSize = sum(props.sections.map((sec) => sec.len));
    return /* @__PURE__ */ v("table", {
      style: "flex:1",
      cellSpacing: "0",
      cellPadding: "0"
    }, /* @__PURE__ */ v("thead", null, /* @__PURE__ */ v("tr", null, /* @__PURE__ */ v("th", null, "section"), /* @__PURE__ */ v("th", {
      className: "right"
    }, "size"), /* @__PURE__ */ v("th", {
      className: "right"
    }, "%"))), /* @__PURE__ */ v("tbody", {
      id: "table"
    }, props.sections.map((sec) => /* @__PURE__ */ v("tr", {
      className: "pointer hover " + (sec === props.hovered ? "highlight" : ""),
      onMouseEnter: () => props.onHover(sec),
      onMouseLeave: () => props.onHover(void 0),
      onClick: () => props.onClick(sec)
    }, /* @__PURE__ */ v("td", null, sec.name ?? sec.kind), /* @__PURE__ */ v("td", {
      className: "right"
    }, format(",")(sec.len)), /* @__PURE__ */ v("td", {
      className: "right"
    }, format(".1%")(sec.len / totalSize))))));
  }
  var Sections = class extends _ {
    constructor() {
      super(...arguments);
      this.onSectionHover = (section) => {
        this.setState({ hovered: section });
      };
    }
    render(props, state) {
      return /* @__PURE__ */ v(Screen, {
        title: "sections"
      }, /* @__PURE__ */ v("div", {
        style: "display: flex; align-items: center; gap: 2ex"
      }, /* @__PURE__ */ v(Pie, {
        ...props,
        ...state,
        onHover: this.onSectionHover
      }), /* @__PURE__ */ v(SectionTable, {
        ...props,
        ...state,
        onHover: this.onSectionHover
      })));
    }
  };

  // viz.tsx
  function urlFromLink([target, index]) {
    let url = `#${target}=${index}`;
    return url;
  }
  function linkFromHash(hash) {
    hash = hash.substring(1);
    if (!hash)
      return null;
    const parts = hash.split("=");
    const target = parts[0];
    if (target !== "section" && target !== "function" && target !== "data") {
      return null;
    }
    return [target, parseInt(parts[1])];
  }
  function go(link) {
    window.location.hash = urlFromLink(link);
  }
  function Link(props) {
    return /* @__PURE__ */ v("a", {
      title: props.title,
      href: urlFromLink(props.target)
    }, props.children);
  }
  function FunctionRef(props) {
    return /* @__PURE__ */ v(Link, {
      title: `function ${props.index}`,
      target: ["function", props.index]
    }, props.module.functionNames.get(props.index) ?? `function ${props.index}`);
  }
  function GlobalRef(props) {
    const sec = props.module.sections.find((sec2) => sec2.kind === "global" /* global */);
    return /* @__PURE__ */ v(Link, {
      title: `global ${props.index}`,
      target: ["section", sec.index]
    }, props.module.globalNames.get(props.index) ?? `global ${props.index}`);
  }
  function Screen(props) {
    return /* @__PURE__ */ v(d, null, /* @__PURE__ */ v("header", null, /* @__PURE__ */ v("h1", null, /* @__PURE__ */ v("a", {
      href: "#"
    }, "weave"), " > ", props.title)), /* @__PURE__ */ v("main", null, props.children));
  }
  function FunctionType(props) {
    return /* @__PURE__ */ v("code", null, funcTypeToString(props.type));
  }
  function NamesSection(props) {
    const sec = props.module.names;
    return /* @__PURE__ */ v(Screen, {
      title: '"name" section'
    }, /* @__PURE__ */ v("p", null, "Names for objects found in the file, typically for debugging purposes."), /* @__PURE__ */ v("table", null, /* @__PURE__ */ v("tr", null, /* @__PURE__ */ v("th", {
      className: "right"
    }, "module name"), /* @__PURE__ */ v("td", null, sec.moduleName ?? /* @__PURE__ */ v("i", null, "none"))), /* @__PURE__ */ v("tr", null, /* @__PURE__ */ v("th", {
      className: "right"
    }, "local names"), /* @__PURE__ */ v("td", null, sec.localNames ? sec.localNames.size : /* @__PURE__ */ v("i", null, "none"))), /* @__PURE__ */ v("tr", null, /* @__PURE__ */ v("th", {
      className: "right"
    }, "function names"), /* @__PURE__ */ v("td", null, sec.functionNames ? sec.functionNames.size : /* @__PURE__ */ v("i", null, "none"))), /* @__PURE__ */ v("tr", null, /* @__PURE__ */ v("th", {
      className: "right"
    }, "global names"), /* @__PURE__ */ v("td", null, sec.globalNames ? sec.globalNames.size : /* @__PURE__ */ v("i", null, "none"))), /* @__PURE__ */ v("tr", null, /* @__PURE__ */ v("th", {
      className: "right"
    }, "data names"), /* @__PURE__ */ v("td", null, sec.dataNames ? sec.dataNames.size : /* @__PURE__ */ v("i", null, "none")))));
  }
  function ProducersSection(props) {
    return /* @__PURE__ */ v(Screen, {
      title: '"producers" section'
    }, /* @__PURE__ */ v("p", null, /* @__PURE__ */ v("a", {
      href: "https://github.com/WebAssembly/tool-conventions/blob/main/ProducersSection.md"
    }, "Tools used"), " ", "to produce the module."), /* @__PURE__ */ v("table", null, props.module.producers.map((field) => /* @__PURE__ */ v("tr", null, /* @__PURE__ */ v("td", null, field.name), /* @__PURE__ */ v("td", null, field.values.map(({ name, version }) => /* @__PURE__ */ v("div", null, name, " ", version)))))));
  }
  function TypeSection(props) {
    const columns = [
      { name: "index", className: "right", data: (row) => row.index },
      {
        name: "type",
        cellClass: "break-all",
        data: (type2) => /* @__PURE__ */ v(FunctionType, {
          type: type2
        })
      }
    ];
    return /* @__PURE__ */ v(Screen, {
      title: '"type" section'
    }, /* @__PURE__ */ v("p", null, "One entry per distinct function type used in the module."), /* @__PURE__ */ v(Table, {
      columns
    }, props.module.types.map((t3, i3) => ({ ...t3, index: i3 }))));
  }
  function InlineEdit(props) {
    const [editing, setEditing] = m2(false);
    const input = h2(null);
    y2(() => {
      if (editing)
        input.current.focus();
    }, [editing]);
    const commit = (ev) => {
      if (!input.current)
        return;
      props.onEdit(input.current?.value ?? "");
      setEditing(false);
      ev.preventDefault();
      return false;
    };
    if (editing) {
      return /* @__PURE__ */ v("form", {
        className: "inline-edit",
        onSubmit: commit
      }, /* @__PURE__ */ v("input", {
        ref: input,
        size: 1,
        type: "text",
        className: "inline-edit",
        onfocusout: commit,
        value: props.children
      }));
    } else {
      return /* @__PURE__ */ v("span", {
        onClick: () => setEditing(true)
      }, props.children, " ", /* @__PURE__ */ v("button", {
        className: "inline-edit"
      }, "\u270E"));
    }
  }
  function MemorySection(props) {
    const columns = [
      { name: "index", className: "right", data: (limits) => limits.index },
      { name: "limits", data: (limits) => limitsToString(limits) }
    ];
    return /* @__PURE__ */ v(Screen, {
      title: '"memory" section'
    }, /* @__PURE__ */ v("p", null, "Definition of memory. Currently limited to one entry."), /* @__PURE__ */ v(Table, {
      columns
    }, props.module.memories));
  }
  function GlobalSection(props) {
    const [edited, setEdited] = m2(0);
    return /* @__PURE__ */ v(Screen, {
      title: '"globals" section'
    }, /* @__PURE__ */ v("p", null, "Global variables, accessible to both the host environment and Wasm."), /* @__PURE__ */ v("table", null, /* @__PURE__ */ v("thead", null, /* @__PURE__ */ v("tr", null, /* @__PURE__ */ v("th", {
      className: "right"
    }, "index"), /* @__PURE__ */ v("th", null, "name"), /* @__PURE__ */ v("th", null, "type"), /* @__PURE__ */ v("th", null, "init"))), /* @__PURE__ */ v("tbody", null, props.module.globals.map((global) => {
      return /* @__PURE__ */ v("tr", null, /* @__PURE__ */ v("td", {
        className: "right"
      }, global.index), /* @__PURE__ */ v("td", {
        className: "break-all flex-container"
      }, /* @__PURE__ */ v(InlineEdit, {
        onEdit: (name) => {
          props.module.globalNames.set(global.index, name);
          setEdited(edited + 1);
        }
      }, props.module.globalNames.get(global.index) ?? "")), /* @__PURE__ */ v("td", null, global.type.mut ? "var" : "const", " ", global.type.valType), /* @__PURE__ */ v("td", null, /* @__PURE__ */ v(Instructions, {
        module: props.module,
        instrs: global.init
      })));
    }))));
  }
  function FunctionSection(props) {
    const columns = [
      { name: "func", className: "right", data: (row) => row.index },
      {
        name: "type",
        data: (row) => /* @__PURE__ */ v("code", null, funcTypeToString(props.module.types[row.typeidx]))
      }
    ];
    return /* @__PURE__ */ v(Screen, {
      title: '"function" section'
    }, /* @__PURE__ */ v("p", null, "Associates functions with their types."), /* @__PURE__ */ v(Table, {
      columns,
      onClick: (row) => props.onClick(row.index)
    }, props.module.functions));
  }
  function TableSection(props) {
    const columns = [
      { name: "index", className: "right", data: (table) => table.index },
      { name: "limits", data: (table) => limitsToString(table.limits) },
      { name: "type", data: (table) => table.element }
    ];
    return /* @__PURE__ */ v(Screen, {
      title: '"table" section'
    }, /* @__PURE__ */ v("p", null, "Collections of opaque references. (Wasm 1.0 only allowed a single table.)"), /* @__PURE__ */ v(Table, {
      columns
    }, props.module.tables));
  }
  function ElementSection(props) {
    const columns = [
      { name: "index", className: "right", data: (elem) => elem.index },
      { name: "type", data: (elem) => elem.type },
      {
        name: "init",
        data: (elem) => `${elem.init.length} entries`
      },
      {
        name: "mode",
        data: (elem) => {
          if (elem.mode === "active" /* active */) {
            return /* @__PURE__ */ v("div", null, "active table=", elem.table, /* @__PURE__ */ v("br", null), "offset:", /* @__PURE__ */ v(Instructions, {
              module: props.module,
              instrs: elem.offset
            }));
          } else {
            return elem.mode;
          }
        }
      }
    ];
    return /* @__PURE__ */ v(Screen, {
      title: '"element" section'
    }, /* @__PURE__ */ v("p", null, "Initializers for tables."), /* @__PURE__ */ v(Table, {
      columns
    }, props.module.elements));
  }
  var Weave = class extends _ {
    constructor() {
      super(...arguments);
      this.state = {};
      this.onHashChange = () => {
        const link = linkFromHash(document.location.hash);
        if (!link) {
          this.setState({ section: void 0, func: void 0, data: void 0 });
          return;
        }
        const [target, index] = link;
        if (target === "section") {
          const section = this.props.module.sections.find((sec) => sec.index === index);
          if (section) {
            this.setState({ section, func: void 0 });
          }
        } else if (target === "function") {
          const importedCount = this.props.module.imports.filter((imp) => imp.desc.kind === "typeidx" /* typeidx */).length;
          if (index < importedCount) {
            const section = this.props.module.sections.find((sec) => sec.kind === "import" /* import */);
            if (section) {
              this.setState({ section, func: void 0, data: void 0 });
            }
          } else {
            const func = this.props.module.functions[index - importedCount];
            if (func) {
              this.setState({ section: void 0, func, data: void 0 });
            }
          }
        } else if (target === "data") {
          this.setState({
            section: void 0,
            func: void 0,
            data: this.props.module.data[index]
          });
        }
      };
      this.onSectionClick = (section) => {
        go(["section", section.index]);
      };
      this.onFuncClick = (index) => {
        go(["function", index]);
      };
      this.onDataClick = (data) => {
        go(["data", data.index]);
      };
    }
    componentDidMount() {
      window.onhashchange = this.onHashChange;
      this.onHashChange();
    }
    render() {
      const { module } = this.props;
      if (this.state.section) {
        switch (this.state.section.kind) {
          case "type" /* type */:
            return /* @__PURE__ */ v(TypeSection, {
              module
            });
          case "import" /* import */:
            return /* @__PURE__ */ v(Imports, {
              module
            });
          case "function" /* function */:
            return /* @__PURE__ */ v(FunctionSection, {
              module,
              onClick: this.onFuncClick
            });
          case "table" /* table */:
            return /* @__PURE__ */ v(TableSection, {
              module
            });
          case "global" /* global */:
            return /* @__PURE__ */ v(GlobalSection, {
              module
            });
          case "memory" /* memory */:
            return /* @__PURE__ */ v(MemorySection, {
              module
            });
          case "export" /* export */:
            return /* @__PURE__ */ v(Exports, {
              module
            });
          case "element" /* element */:
            return /* @__PURE__ */ v(ElementSection, {
              module
            });
          case "code" /* code */:
            return /* @__PURE__ */ v(CodeSection, {
              module,
              onClick: this.onFuncClick,
              functionNames: module.functionNames
            }, module.functions);
          case "data" /* data */:
            return /* @__PURE__ */ v(DataSection, {
              module,
              data: module.data,
              onClick: this.onDataClick
            });
          case "custom" /* custom */:
            if (this.state.section.name === "name") {
              return /* @__PURE__ */ v(NamesSection, {
                module
              });
            } else if (this.state.section.name === "producers") {
              return /* @__PURE__ */ v(ProducersSection, {
                module
              });
            } else {
              return /* @__PURE__ */ v(Screen, {
                title: "custom section"
              }, /* @__PURE__ */ v("p", null, "No view yet for ", /* @__PURE__ */ v("code", null, this.state.section.name), ". Showing raw dump."), /* @__PURE__ */ v(HexView, {
                data: module.customSectionData.get(this.state.section.index)
              }));
            }
          default:
            return /* @__PURE__ */ v("div", null, "TODO: no viewer implemented for '", this.state.section.kind, "' section yet");
        }
      } else if (this.state.func) {
        return /* @__PURE__ */ v(Function, {
          key: this.state.func.index,
          module: this.props.module,
          func: this.state.func,
          name: module.functionNames.get(this.state.func.index)
        });
      } else if (this.state.data) {
        return /* @__PURE__ */ v(DataHex, {
          key: this.state.data.index,
          module: this.props.module,
          data: this.state.data
        });
      } else {
        return /* @__PURE__ */ v(Sections, {
          module: this.props.module,
          sections: module.sections,
          onClick: this.onSectionClick
        });
      }
    }
  };
  var App = class extends _ {
    load(buffer) {
      const module = load(buffer);
      this.setState({ module });
    }
    addDragHandlers() {
      window.ondragenter = (ev) => {
        document.body.style.opacity = "0.5";
        ev.preventDefault();
      };
      window.ondragleave = (ev) => {
        if (ev.relatedTarget) {
          return;
        }
        document.body.style.opacity = "";
        ev.preventDefault();
      };
      window.ondragover = (ev) => {
        ev.preventDefault();
      };
      window.ondrop = async (ev) => {
        document.body.style.opacity = "";
        if (ev.dataTransfer?.items.length !== 1)
          return;
        const file = ev.dataTransfer.items[0].getAsFile();
        if (!file)
          return;
        ev.preventDefault();
        this.load(await file.arrayBuffer());
      };
    }
    async componentDidMount() {
      this.addDragHandlers();
      if (document.location.search) {
        const name = document.location.search.substring(1);
        const wasmBytes = await (await fetch(name)).arrayBuffer();
        this.load(wasmBytes);
      }
    }
    render() {
      if (this.state.module) {
        return /* @__PURE__ */ v(Weave, {
          module: this.state.module
        });
      }
      return /* @__PURE__ */ v(d, null, /* @__PURE__ */ v("header", null, /* @__PURE__ */ v("h1", null, "weave")), /* @__PURE__ */ v("main", null, /* @__PURE__ */ v("p", null, "Weave is a viewer for WebAssembly ", /* @__PURE__ */ v("code", null, ".wasm"), " files, like an interactive ", /* @__PURE__ */ v("code", null, "objdump"), "."), /* @__PURE__ */ v("p", null, "Load a file by drag'n'drop'ing a ", /* @__PURE__ */ v("code", null, ".wasm"), " file onto this page.")));
    }
  };
  function load(wasmBytes) {
    const sections = read2(wasmBytes);
    const module = {
      bytes: wasmBytes,
      toolchain: "Unknown",
      sections: sections.map((sec, index) => ({ ...sec, index })),
      types: [],
      imports: [],
      tables: [],
      exports: [],
      functions: [],
      data: [],
      elements: [],
      globals: [],
      memories: [],
      customSectionData: /* @__PURE__ */ new Map(),
      functionNames: /* @__PURE__ */ new Map(),
      globalNames: /* @__PURE__ */ new Map()
    };
    window["module"] = module;
    let importedFunctionCount = 0;
    let importedGlobalCount = 0;
    for (const section of module.sections) {
      switch (section.kind) {
        case "custom" /* custom */: {
          const reader = getSectionReader(wasmBytes, section);
          const custom = readCustomSection(reader);
          switch (custom.name) {
            case "name":
              section.name = "name";
              const names = readNameSection(reader);
              module.names = names;
              if (names.functionNames) {
                for (const [idx, name] of names.functionNames) {
                  if (module.functionNames.has(idx)) {
                    continue;
                  }
                  module.functionNames.set(idx, name);
                }
              }
              if (names.globalNames) {
                module.globalNames = names.globalNames;
              }
              break;
            case "producers":
              section.name = "producers";
              const producers = readProducersSection(reader);
              const lang = producers.find((p3) => p3.name == "language");
              if (lang) {
                switch (lang.values[0].name) {
                  case "Go":
                    module.toolchain = "Go";
                    break;
                  case "Rust":
                    module.toolchain = "Rust";
                    break;
                }
              }
              module.producers = producers;
              break;
            default: {
              const view = new DataView(reader.view.buffer, reader.view.byteOffset + reader.ofs, reader.view.byteLength - reader.ofs);
              section.name = `custom: '${custom.name}'`;
              module.customSectionData.set(section.index, view);
              break;
            }
          }
          break;
        }
        case "type" /* type */:
          module.types = readTypeSection(getSectionReader(wasmBytes, section)).map((t3, i3) => {
            return { ...t3, index: i3 };
          });
          break;
        case "import" /* import */:
          module.imports = readImportSection(getSectionReader(wasmBytes, section)).map((imp) => {
            switch (imp.desc.kind) {
              case "typeidx" /* typeidx */:
                module.functionNames.set(importedFunctionCount, imp.name);
                return { ...imp, index: importedFunctionCount++ };
              case "global" /* global */:
                importedGlobalCount++;
              default:
                return { ...imp, index: "todo" };
            }
          });
          break;
        case "function" /* function */:
          module.functions = readFunctionSection(getSectionReader(wasmBytes, section)).map((typeidx, i3) => {
            return {
              index: importedFunctionCount + i3,
              typeidx,
              ofs: 0,
              len: 0
            };
          });
          break;
        case "table" /* table */:
          module.tables = readTableSection(getSectionReader(wasmBytes, section)).map((table, i3) => ({ ...table, index: i3 }));
          break;
        case "global" /* global */:
          module.globals = readGlobalSection(getSectionReader(wasmBytes, section)).map((global, i3) => ({ ...global, index: importedGlobalCount + i3 }));
          break;
        case "memory" /* memory */:
          module.memories = readMemorySection(getSectionReader(wasmBytes, section)).map((memory, i3) => ({ ...memory, index: i3 }));
          break;
        case "export" /* export */:
          module.exports = readExportSection(getSectionReader(wasmBytes, section));
          for (const exp of module.exports) {
            if (exp.desc.kind == "funcidx" /* funcidx */) {
              module.functionNames.set(exp.desc.index, exp.name);
            }
          }
          break;
        case "element" /* element */:
          module.elements = readElementSection(getSectionReader(wasmBytes, section)).map((elem, i3) => ({ ...elem, index: i3 }));
          break;
        case "code" /* code */:
          read(getSectionReader(wasmBytes, section)).forEach((func, i3) => {
            module.functions[i3].ofs = func.ofs;
            module.functions[i3].len = func.len;
          });
          break;
        case "data" /* data */:
          module.data = readDataSection(getSectionReader(wasmBytes, section)).map((data, index) => ({ ...data, index }));
          break;
      }
    }
    return module;
  }
  function main() {
    S(/* @__PURE__ */ v(App, null), document.body);
  }
  main();
})();
//# sourceMappingURL=bundle.js.map
