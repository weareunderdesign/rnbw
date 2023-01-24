(() => {
  var e = {
    599: (e) => {
      (window.svgIcon = {
        configFileName: "svg-icon.config.json",
        config: { size: 24, name: "logos/logo", src: "./" },
        rootDirectory: "./",
      }),
        (function () {
          if (!window.jQuery) {
            let e = document.createElement("SCRIPT");
            (e.src =
              "https://ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.min.js"),
              (e.type = "text/javascript"),
              document.getElementsByTagName("head")[0].appendChild(e);
          }
          let r = function (e) {
            window.jQuery
              ? e()
              : window.setTimeout(function () {
                r(e);
              }, 20);
          };
          r(() => {
            (async () => {
              let r = window.location.href;
              const n = await t(r);
              n && (window.svgIcon.config = n),
                (function (t) {
                  !(function (t, r) {
                    var n,
                      i,
                      o = "createElement",
                      s = "getElementsByTagName",
                      a = "length",
                      c = "style",
                      u = "title",
                      f = "undefined",
                      l = "setAttribute",
                      d = "getAttribute",
                      h = null,
                      v = "__svgInject",
                      p = "--inject-",
                      m = new RegExp(p + "\\d+", "g"),
                      g = "LOAD_FAIL",
                      w = "SVG_INVALID",
                      y = ["src", "alt", "onload", "onerror"],
                      b = r[o]("a"),
                      x = typeof SVGRect != f,
                      A = {
                        useCache: !0,
                        copyAttributes: !0,
                        makeIdsUnique: !0,
                      },
                      j = {
                        clipPath: ["clip-path"],
                        "color-profile": h,
                        cursor: h,
                        filter: h,
                        linearGradient: ["fill", "stroke"],
                        marker: [
                          "marker",
                          "marker-end",
                          "marker-mid",
                          "marker-start",
                        ],
                        mask: h,
                        pattern: ["fill", "stroke"],
                        radialGradient: ["fill", "stroke"],
                      },
                      E = 1;
                    function I(e) {
                      return (n = n || new XMLSerializer()).serializeToString(
                        e
                      );
                    }
                    function C(e, t) {
                      var r,
                        n,
                        i,
                        o,
                        u = p + E++,
                        f = /url\("?#([a-zA-Z][\w:.-]*)"?\)/g,
                        v = e.querySelectorAll("[id]"),
                        m = t ? [] : h,
                        g = {},
                        w = [],
                        y = !1;
                      if (v[a]) {
                        for (i = 0; i < v[a]; i++)
                          (n = v[i].localName) in j && (g[n] = 1);
                        for (n in g)
                          (j[n] || [n]).forEach(function (e) {
                            w.indexOf(e) < 0 && w.push(e);
                          });
                        w[a] && w.push(c);
                        var b,
                          x,
                          A,
                          I = e[s]("*"),
                          C = e;
                        for (i = -1; C != h;) {
                          if (C.localName == c)
                            (A =
                              (x = C.textContent) &&
                              x.replace(f, function (e, t) {
                                return m && (m[t] = 1), "url(#" + t + u + ")";
                              })) !== x && (C.textContent = A);
                          else if (C.hasAttributes()) {
                            for (o = 0; o < w[a]; o++)
                              (b = w[o]),
                                (A =
                                  (x = C[d](b)) &&
                                  x.replace(f, function (e, t) {
                                    return (
                                      m && (m[t] = 1), "url(#" + t + u + ")"
                                    );
                                  })) !== x && C[l](b, A);
                            ["xlink:href", "href"].forEach(function (e) {
                              var t = C[d](e);
                              /^\s*#/.test(t) &&
                                ((t = t.trim()),
                                  C[l](e, t + u),
                                  m && (m[t.substring(1)] = 1));
                            });
                          }
                          C = I[++i];
                        }
                        for (i = 0; i < v[a]; i++)
                          (r = v[i]),
                            (m && !m[r.id]) || ((r.id += u), (y = !0));
                      }
                      return y;
                    }
                    function S(e, t, n, i) {
                      if (t) {
                        t[l]("data-inject-url", n);
                        var s = e.parentNode;
                        if (s) {
                          i.copyAttributes &&
                            (function (e, t) {
                              for (
                                var n, i, s, c = e.attributes, f = 0;
                                f < c[a];
                                f++
                              )
                                if (
                                  ((i = (n = c[f]).name), -1 == y.indexOf(i))
                                )
                                  if (((s = n.value), i == u)) {
                                    var d,
                                      h = t.firstElementChild;
                                    h && h.localName.toLowerCase() == u
                                      ? (d = h)
                                      : ((d = r[o + "NS"](
                                        "http://www.w3.org/2000/svg",
                                        u
                                      )),
                                        t.insertBefore(d, h)),
                                      (d.textContent = s);
                                  } else t[l](i, s);
                            })(e, t);
                          var c = i.beforeInject,
                            f = (c && c(e, t)) || t;
                          s.replaceChild(f, e), (e[v] = 1), L(e);
                          var d = i.afterInject;
                          d && d(e, f);
                        }
                      } else G(e, i);
                    }
                    function k() {
                      for (var e = {}, t = arguments, r = 0; r < t[a]; r++) {
                        var n = t[r];
                        for (var i in n) n.hasOwnProperty(i) && (e[i] = n[i]);
                      }
                      return e;
                    }
                    function N(e, t) {
                      if (t) {
                        var n;
                        try {
                          n = (function (e) {
                            return (i = i || new DOMParser()).parseFromString(
                              e,
                              "text/xml"
                            );
                          })(e);
                        } catch (e) {
                          return h;
                        }
                        return n[s]("parsererror")[a] ? h : n.documentElement;
                      }
                      var o = r.createElement("div");
                      return (o.innerHTML = e), o.firstElementChild;
                    }
                    function L(e) {
                      e.removeAttribute("onload");
                    }
                    function T(e) {
                      console.error("SVGInject: " + e);
                    }
                    function z(e, t, r) {
                      (e[v] = 2), r.onFail ? r.onFail(e, t) : T(t);
                    }
                    function G(e, t) {
                      L(e), z(e, w, t);
                    }
                    function M(e, t) {
                      L(e), z(e, "SVG_NOT_SUPPORTED", t);
                    }
                    function O(e, t) {
                      z(e, g, t);
                    }
                    function D(e) {
                      (e.onload = h), (e.onerror = h);
                    }
                    function P(e) {
                      T("no img element");
                    }
                    var V = (function e(n, i) {
                      var u = k(A, i),
                        l = {};
                      function y(e, t) {
                        t = k(u, t);
                        var r = function (r) {
                          var n = function () {
                            var e = t.onAllFinish;
                            e && e(), r && r();
                          };
                          if (e && typeof e[a] != f) {
                            var i = 0,
                              o = e[a];
                            if (0 == o) n();
                            else
                              for (
                                var s = function () {
                                  ++i == o && n();
                                },
                                c = 0;
                                c < o;
                                c++
                              )
                                j(e[c], t, s);
                          } else j(e, t, n);
                        };
                        return typeof Promise == f ? r() : new Promise(r);
                      }
                      function j(e, t, r) {
                        if (e) {
                          var n = e[v];
                          if (n) Array.isArray(n) ? n.push(r) : r();
                          else {
                            if ((D(e), !x)) return M(e, t), void r();
                            var i = t.beforeLoad,
                              o = (i && i(e)) || e[d]("src");
                            if (!o) return "" === o && O(e, t), void r();
                            var s = [];
                            e[v] = s;
                            var a = function () {
                              r(),
                                s.forEach(function (e) {
                                  e();
                                });
                            },
                              c = (function (e) {
                                return (b.href = e), b.href;
                              })(o),
                              u = t.useCache,
                              y = t.makeIdsUnique,
                              A = function (e) {
                                u &&
                                  (l[c].forEach(function (t) {
                                    t(e);
                                  }),
                                    (l[c] = e));
                              };
                            if (u) {
                              var j,
                                k = function (r) {
                                  if (r === g) O(e, t);
                                  else if (r === w) G(e, t);
                                  else {
                                    var n,
                                      i = r[0],
                                      o = r[1],
                                      s = r[2];
                                    y &&
                                      (i === h
                                        ? ((i = C((n = N(o, !1)), !1)),
                                          (r[0] = i),
                                          (r[2] = i && I(n)))
                                        : i &&
                                        (o = (function (e) {
                                          return e.replace(m, p + E++);
                                        })(s))),
                                      (n = n || N(o, !1)),
                                      S(e, n, c, t);
                                  }
                                  a();
                                };
                              if (typeof (j = l[c]) != f)
                                return void (j.isCallbackQueue
                                  ? j.push(k)
                                  : k(j));
                              ((j = []).isCallbackQueue = !0), (l[c] = j);
                            }
                            !(function (r, n, i) {
                              if (r) {
                                var o = new XMLHttpRequest();
                                (o.onreadystatechange = function () {
                                  if (4 == o.readyState) {
                                    var r = o.status;
                                    200 == r
                                      ? (function (r, n) {
                                        var i =
                                          r instanceof Document
                                            ? r.documentElement
                                            : N(n, !0),
                                          o = t.afterLoad;
                                        if (o) {
                                          var s = o(i, n) || i;
                                          if (s) {
                                            var f = "string" == typeof s;
                                            (n = f ? s : I(i)),
                                              (i = f ? N(s, !0) : s);
                                          }
                                        }
                                        if (i instanceof SVGElement) {
                                          var l = h;
                                          if ((y && (l = C(i, !1)), u)) {
                                            var d = l && I(i);
                                            A([l, n, d]);
                                          }
                                          S(e, i, c, t);
                                        } else G(e, t), A(w);
                                        a();
                                      })(
                                        o.responseXML,
                                        o.responseText.trim()
                                      )
                                      : (400 <= r || 0 == r) &&
                                      (O(e, t), A(g), a());
                                  }
                                }),
                                  o.open("GET", r, !0),
                                  o.send();
                              }
                            })(c);
                          }
                        } else P();
                      }
                      return (
                        x &&
                        (function (e) {
                          var t = r[s]("head")[0];
                          if (t) {
                            var n = r[o](c);
                            (n.type = "text/css"),
                              n.appendChild(r.createTextNode(e)),
                              t.appendChild(n);
                          }
                        })('img[onload^="' + n + '("]{visibility:hidden;}'),
                        (y.setOptions = function (e) {
                          u = k(u, e);
                        }),
                        (y.create = e),
                        (y.err = function (e, t) {
                          e
                            ? 2 != e[v] &&
                            (D(e),
                              x ? (L(e), O(e, u)) : M(e, u),
                              t && (L(e), (e.src = t)))
                            : P();
                        }),
                        (t[n] = y)
                      );
                    })("SVGInject");
                    "object" == typeof e.exports && (e.exports = V);
                  })(window, document);
                  class r extends HTMLElement {
                    constructor() {
                      super();
                    }
                    get size() {
                      return this.hasAttribute("size")
                        ? +this.getAttribute("size")
                        : t?.size;
                    }
                    get src() {
                      return this.hasAttribute("src")
                        ? "" == this.getAttribute("src")
                          ? t?.src
                          : this.getAttribute("src").replace(/\/$/, "")
                        : t?.src;
                    }
                    get color() {
                      return this.hasAttribute("color")
                        ? this.getAttribute("color")
                        : $(this).css("color");
                    }
                    get name() {
                      return this.innerHTML
                        ? this.innerHTML.replace(/\s+/g, "")
                        : t?.name;
                    }
                    connectedCallback() {
                      let e = this.color;
                      var t = new MutationObserver(function (t) {
                        t.forEach(function (t) {
                          if (t.addedNodes.length) {
                            let r = t.addedNodes[0].childNodes;
                            for (let t = 0; t < r.length; t++)
                              r[t].style && (r[t].style.fill = e);
                          }
                        });
                      });
                      const r = new Image(this.size, this.size);
                      ".svg" == this.src?.slice(-4)
                        ? (r.src = this.src)
                        : (r.src = `${window.svgIcon.rootDirectory}/${this.src}/${this.name}.svg`),
                        SVGInject(r),
                        this.attachShadow({ mode: "open" }).appendChild(r),
                        t.observe(this.shadowRoot, { childList: !0 });
                    }
                  }
                  customElements.define("svg-icon", r);
                })(window.svgIcon.config);
            })();
          });
        })();
      const t = async (e) => {
        let r = e.split("/");
        r.pop();
        let n = r.join("/");
        if ("" == n) return null;
        let i,
          o = `${n}/${window.svgIcon.configFileName}`;
        return (
          $.ajax({
            url: o,
            async: !1,
            success: function (e) {
              (window.svgIcon.rootDirectory = n), (i = e);
            },
            error: function () {
              i = null;
            },
          }),
          i || t(n)
        );
      };
    },
  },
    t = {};
  !(function r(n) {
    var i = t[n];
    if (void 0 !== i) return i.exports;
    var o = (t[n] = { exports: {} });
    return e[n](o, o.exports, r), o.exports;
  })(599);
})();