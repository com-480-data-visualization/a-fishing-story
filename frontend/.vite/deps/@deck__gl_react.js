import { r as __toESM } from "./chunk-BoAXSpZd.js";
import { t as require_react } from "./react.js";
import { D as applyStyles, E as Widget, N as LinearInterpolator, P as GlobeViewport, R as View, T as Deck, Z as WebMercatorViewport, g as Layer, n as FlyToInterpolator, yt as defaultLogger, z as deepEqual } from "./dist-CIPsRTkp.js";
import "./webgl-device-DlhmycHz.js";
//#region node_modules/@deck.gl/react/dist/utils/use-isomorphic-layout-effect.js
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var useIsomorphicLayoutEffect = typeof window !== "undefined" ? import_react.useLayoutEffect : import_react.useEffect;
//#endregion
//#region node_modules/@deck.gl/react/dist/utils/inherits-from.js
function inheritsFrom(Type, ParentType) {
	while (Type) {
		if (Type === ParentType) return true;
		Type = Object.getPrototypeOf(Type);
	}
	return false;
}
//#endregion
//#region node_modules/@deck.gl/react/dist/utils/evaluate-children.js
var MAP_STYLE = {
	position: "absolute",
	zIndex: -1
};
function evaluateChildren(children, childProps) {
	if (typeof children === "function") return children(childProps);
	if (Array.isArray(children)) return children.map((child) => evaluateChildren(child, childProps));
	if (isComponent(children)) {
		if (isReactMap(children)) {
			childProps.style = MAP_STYLE;
			return (0, import_react.cloneElement)(children, childProps);
		}
		if (needsDeckGLViewProps(children)) return (0, import_react.cloneElement)(children, childProps);
	}
	return children;
}
function isComponent(child) {
	return child && typeof child === "object" && "type" in child || false;
}
function isReactMap(child) {
	return child.props?.mapStyle;
}
function needsDeckGLViewProps(child) {
	const componentClass = child.type;
	return componentClass && componentClass.deckGLViewProps;
}
//#endregion
//#region node_modules/@deck.gl/react/dist/utils/extract-jsx-layers.js
function wrapInView(node) {
	if (typeof node === "function") return (0, import_react.createElement)(View, {}, node);
	if (Array.isArray(node)) return node.map(wrapInView);
	if (isComponent(node)) {
		if (node.type === import_react.Fragment) return wrapInView(node.props.children);
		if (inheritsFrom(node.type, View)) return node;
	}
	return node;
}
function extractJSXLayers({ children, layers = [], views = null }) {
	const reactChildren = [];
	const jsxLayers = [];
	const jsxViews = {};
	import_react.Children.forEach(wrapInView(children), (reactElement) => {
		if (isComponent(reactElement)) {
			const ElementType = reactElement.type;
			if (inheritsFrom(ElementType, Layer)) {
				const layer = createLayer(ElementType, reactElement.props);
				jsxLayers.push(layer);
			} else reactChildren.push(reactElement);
			if (inheritsFrom(ElementType, View) && ElementType !== View && reactElement.props.id) {
				const view = new ElementType(reactElement.props);
				jsxViews[view.id] = view;
			}
		} else if (reactElement) reactChildren.push(reactElement);
	});
	if (Object.keys(jsxViews).length > 0) {
		if (Array.isArray(views)) views.forEach((view) => {
			jsxViews[view.id] = view;
		});
		else if (views) jsxViews[views.id] = views;
		views = Object.values(jsxViews);
	}
	layers = jsxLayers.length > 0 ? [...jsxLayers, ...layers] : layers;
	return {
		layers,
		children: reactChildren,
		views
	};
}
function createLayer(LayerType, reactProps) {
	const props = {};
	const defaultProps = LayerType.defaultProps || {};
	for (const key in reactProps) if (defaultProps[key] !== reactProps[key]) props[key] = reactProps[key];
	return new LayerType(props);
}
//#endregion
//#region node_modules/@deck.gl/react/dist/utils/deckgl-context.js
var DeckGlContext = (0, import_react.createContext)();
//#endregion
//#region node_modules/@deck.gl/react/dist/utils/position-children-under-views.js
function positionChildrenUnderViews({ children, deck, ContextProvider = DeckGlContext.Provider }) {
	const { viewManager } = deck || {};
	if (!viewManager || !viewManager.views.length) return [];
	const views = {};
	const defaultViewId = viewManager.views[0].id;
	for (const child of children) {
		let viewId = defaultViewId;
		let viewChildren = child;
		if (isComponent(child) && inheritsFrom(child.type, View)) {
			viewId = child.props.id || defaultViewId;
			viewChildren = child.props.children;
		}
		const viewport = viewManager.getViewport(viewId);
		const viewState = viewManager.getViewState(viewId);
		if (viewport) {
			viewState.padding = viewport.padding;
			const { x, y, width, height } = viewport;
			viewChildren = evaluateChildren(viewChildren, {
				x,
				y,
				width,
				height,
				viewport,
				viewState
			});
			if (!views[viewId]) views[viewId] = {
				viewport,
				children: []
			};
			views[viewId].children.push(viewChildren);
		}
	}
	return Object.keys(views).map((viewId) => {
		const { viewport, children: viewChildren } = views[viewId];
		const { x, y, width, height } = viewport;
		const style = {
			position: "absolute",
			left: x,
			top: y,
			width,
			height
		};
		const key = `view-${viewId}`;
		const viewElement = (0, import_react.createElement)("div", {
			key,
			id: key,
			style
		}, ...viewChildren);
		const contextValue = {
			deck,
			viewport,
			container: deck.canvas.offsetParent,
			eventManager: deck.eventManager,
			onViewStateChange: (params) => {
				params.viewId = viewId;
				deck._onViewStateChange(params);
			},
			widgets: []
		};
		return (0, import_react.createElement)(ContextProvider, {
			key: `view-${viewId}-context`,
			value: contextValue
		}, viewElement);
	});
}
//#endregion
//#region node_modules/@deck.gl/react/dist/utils/extract-styles.js
var CANVAS_ONLY_STYLES = { mixBlendMode: null };
function extractStyles({ width, height, style }) {
	const containerStyle = {
		position: "absolute",
		zIndex: 0,
		left: 0,
		top: 0,
		width,
		height
	};
	const canvasStyle = {
		left: 0,
		top: 0
	};
	if (style) for (const key in style) if (key in CANVAS_ONLY_STYLES) canvasStyle[key] = style[key];
	else containerStyle[key] = style[key];
	return {
		containerStyle,
		canvasStyle
	};
}
//#endregion
//#region node_modules/@deck.gl/react/dist/deckgl.js
function getRefHandles(thisRef) {
	return {
		get deck() {
			return thisRef.deck;
		},
		pickObject: (opts) => thisRef.deck.pickObject(opts),
		pickMultipleObjects: (opts) => thisRef.deck.pickMultipleObjects(opts),
		pickObjects: (opts) => thisRef.deck.pickObjects(opts)
	};
}
function redrawDeck(thisRef) {
	if (thisRef.redrawReason) {
		thisRef.deck._drawLayers(thisRef.redrawReason);
		thisRef.redrawReason = null;
	}
}
function createDeckInstance(thisRef, DeckClass, props) {
	const deck = new DeckClass({
		...props,
		_customRender: props.deviceProps?.adapters?.[0]?.type === "webgpu" ? void 0 : (redrawReason) => {
			thisRef.redrawReason = redrawReason;
			const viewports = deck.getViewports();
			if (thisRef.lastRenderedViewports !== viewports) thisRef.forceUpdate();
			else redrawDeck(thisRef);
		}
	});
	return deck;
}
function DeckGLWithRef(props, ref) {
	const [version, setVersion] = (0, import_react.useState)(0);
	const thisRef = (0, import_react.useRef)({
		control: null,
		version,
		forceUpdate: () => setVersion((v) => v + 1)
	}).current;
	const containerRef = (0, import_react.useRef)(null);
	const canvasRef = (0, import_react.useRef)(null);
	const jsxProps = (0, import_react.useMemo)(() => extractJSXLayers(props), [
		props.layers,
		props.views,
		props.children
	]);
	let inRender = true;
	const handleViewStateChange = (params) => {
		if (inRender && props.viewState) {
			thisRef.viewStateUpdateRequested = params;
			return null;
		}
		thisRef.viewStateUpdateRequested = null;
		return props.onViewStateChange?.(params);
	};
	const handleInteractionStateChange = (params) => {
		if (inRender) thisRef.interactionStateUpdateRequested = params;
		else {
			thisRef.interactionStateUpdateRequested = null;
			props.onInteractionStateChange?.(params);
		}
	};
	const deckProps = (0, import_react.useMemo)(() => {
		const forwardProps = {
			widgets: [],
			...props,
			style: null,
			width: "100%",
			height: "100%",
			parent: containerRef.current,
			canvas: canvasRef.current,
			layers: jsxProps.layers,
			views: jsxProps.views,
			onViewStateChange: handleViewStateChange,
			onInteractionStateChange: handleInteractionStateChange
		};
		delete forwardProps._customRender;
		if (thisRef.deck) thisRef.deck.setProps(forwardProps);
		return forwardProps;
	}, [props]);
	(0, import_react.useEffect)(() => {
		thisRef.deck = createDeckInstance(thisRef, props.Deck || Deck, {
			...deckProps,
			parent: containerRef.current,
			canvas: canvasRef.current
		});
		return () => thisRef.deck?.finalize();
	}, []);
	useIsomorphicLayoutEffect(() => {
		redrawDeck(thisRef);
		const { viewStateUpdateRequested, interactionStateUpdateRequested } = thisRef;
		if (viewStateUpdateRequested) handleViewStateChange(viewStateUpdateRequested);
		if (interactionStateUpdateRequested) handleInteractionStateChange(interactionStateUpdateRequested);
		if (thisRef.deck?.isInitialized) thisRef.deck.redraw("Initial render");
	});
	(0, import_react.useImperativeHandle)(ref, () => getRefHandles(thisRef), []);
	const currentViewports = thisRef.deck && thisRef.deck.isInitialized ? thisRef.deck.getViewports() : void 0;
	const { ContextProvider, width = "100%", height = "100%", id, style } = props;
	const { containerStyle, canvasStyle } = (0, import_react.useMemo)(() => extractStyles({
		width,
		height,
		style
	}), [
		width,
		height,
		style
	]);
	if (!thisRef.viewStateUpdateRequested && thisRef.lastRenderedViewports === currentViewports || thisRef.version !== version) {
		thisRef.lastRenderedViewports = currentViewports;
		thisRef.version = version;
		const childrenUnderViews = positionChildrenUnderViews({
			children: jsxProps.children,
			deck: thisRef.deck,
			ContextProvider
		});
		const canvas = (0, import_react.createElement)("canvas", {
			key: "canvas",
			id: id || "deckgl-overlay",
			ref: canvasRef,
			style: canvasStyle
		});
		thisRef.control = (0, import_react.createElement)("div", {
			id: `${id || "deckgl"}-wrapper`,
			ref: containerRef,
			style: containerStyle
		}, [canvas, childrenUnderViews]);
	}
	inRender = false;
	return thisRef.control;
}
var DeckGL = import_react.forwardRef(DeckGLWithRef), n, l$1, u$2, i$2, r$1, o$2, e$1, f$2, c$1, s$1, a$1, p$1 = {}, v$1 = [], y$1 = /acit|ex(?:s|g|n|p|$)|rph|grid|ows|mnc|ntw|ine[ch]|zoo|^ord|itera/i, d$1 = Array.isArray;
function w$1(n, l) {
	for (var u in l) n[u] = l[u];
	return n;
}
function g(n) {
	n && n.parentNode && n.parentNode.removeChild(n);
}
function _(l, u, t) {
	var i, r, o, e = {};
	for (o in u) "key" == o ? i = u[o] : "ref" == o ? r = u[o] : e[o] = u[o];
	if (arguments.length > 2 && (e.children = arguments.length > 3 ? n.call(arguments, 2) : t), "function" == typeof l && null != l.defaultProps) for (o in l.defaultProps) void 0 === e[o] && (e[o] = l.defaultProps[o]);
	return m$1(l, e, i, r, null);
}
function m$1(n, t, i, r, o) {
	var e = {
		type: n,
		props: t,
		key: i,
		ref: r,
		__k: null,
		__: null,
		__b: 0,
		__e: null,
		__c: null,
		constructor: void 0,
		__v: null == o ? ++u$2 : o,
		__i: -1,
		__u: 0
	};
	return null == o && null != l$1.vnode && l$1.vnode(e), e;
}
function k$1(n) {
	return n.children;
}
function x(n, l) {
	this.props = n, this.context = l;
}
function S(n, l) {
	if (null == l) return n.__ ? S(n.__, n.__i + 1) : null;
	for (var u; l < n.__k.length; l++) if (null != (u = n.__k[l]) && null != u.__e) return u.__e;
	return "function" == typeof n.type ? S(n) : null;
}
function C$1(n) {
	if (n.__P && n.__d) {
		var u = n.__v, t = u.__e, i = [], r = [], o = w$1({}, u);
		o.__v = u.__v + 1, l$1.vnode && l$1.vnode(o), z$1(n.__P, o, u, n.__n, n.__P.namespaceURI, 32 & u.__u ? [t] : null, i, null == t ? S(u) : t, !!(32 & u.__u), r), o.__v = u.__v, o.__.__k[o.__i] = o, V(i, o, r), u.__e = u.__ = null, o.__e != t && M(o);
	}
}
function M(n) {
	if (null != (n = n.__) && null != n.__c) return n.__e = n.__c.base = null, n.__k.some(function(l) {
		if (null != l && null != l.__e) return n.__e = n.__c.base = l.__e;
	}), M(n);
}
function $(n) {
	(!n.__d && (n.__d = !0) && i$2.push(n) && !I.__r++ || r$1 != l$1.debounceRendering) && ((r$1 = l$1.debounceRendering) || o$2)(I);
}
function I() {
	try {
		for (var n, l = 1; i$2.length;) i$2.length > l && i$2.sort(e$1), n = i$2.shift(), l = i$2.length, C$1(n);
	} finally {
		i$2.length = I.__r = 0;
	}
}
function P(n, l, u, t, i, r, o, e, f, c, s) {
	var a, h, y, d, w, g, _, m = t && t.__k || v$1, b = l.length;
	for (f = A$1(u, l, m, f, b), a = 0; a < b; a++) null != (y = u.__k[a]) && (h = -1 != y.__i && m[y.__i] || p$1, y.__i = a, g = z$1(n, y, h, i, r, o, e, f, c, s), d = y.__e, y.ref && h.ref != y.ref && (h.ref && D$1(h.ref, null, y), s.push(y.ref, y.__c || d, y)), null == w && null != d && (w = d), (_ = !!(4 & y.__u)) || h.__k === y.__k ? f = H(y, f, n, _) : "function" == typeof y.type && void 0 !== g ? f = g : d && (f = d.nextSibling), y.__u &= -7);
	return u.__e = w, f;
}
function A$1(n, l, u, t, i) {
	var r, o, e, f, c, s = u.length, a = s, h = 0;
	for (n.__k = new Array(i), r = 0; r < i; r++) null != (o = l[r]) && "boolean" != typeof o && "function" != typeof o ? ("string" == typeof o || "number" == typeof o || "bigint" == typeof o || o.constructor == String ? o = n.__k[r] = m$1(null, o, null, null, null) : d$1(o) ? o = n.__k[r] = m$1(k$1, { children: o }, null, null, null) : void 0 === o.constructor && o.__b > 0 ? o = n.__k[r] = m$1(o.type, o.props, o.key, o.ref ? o.ref : null, o.__v) : n.__k[r] = o, f = r + h, o.__ = n, o.__b = n.__b + 1, e = null, -1 != (c = o.__i = T$1(o, u, f, a)) && (a--, (e = u[c]) && (e.__u |= 2)), null == e || null == e.__v ? (-1 == c && (i > s ? h-- : i < s && h++), "function" != typeof o.type && (o.__u |= 4)) : c != f && (c == f - 1 ? h-- : c == f + 1 ? h++ : (c > f ? h-- : h++, o.__u |= 4))) : n.__k[r] = null;
	if (a) for (r = 0; r < s; r++) null != (e = u[r]) && 0 == (2 & e.__u) && (e.__e == t && (t = S(e)), E(e, e));
	return t;
}
function H(n, l, u, t) {
	var i, r;
	if ("function" == typeof n.type) {
		for (i = n.__k, r = 0; i && r < i.length; r++) i[r] && (i[r].__ = n, l = H(i[r], l, u, t));
		return l;
	}
	n.__e != l && (t && (l && n.type && !l.parentNode && (l = S(n)), u.insertBefore(n.__e, l || null)), l = n.__e);
	do
		l = l && l.nextSibling;
	while (null != l && 8 == l.nodeType);
	return l;
}
function T$1(n, l, u, t) {
	var i, r, o, e = n.key, f = n.type, c = l[u], s = null != c && 0 == (2 & c.__u);
	if (null === c && null == e || s && e == c.key && f == c.type) return u;
	if (t > (s ? 1 : 0)) {
		for (i = u - 1, r = u + 1; i >= 0 || r < l.length;) if (null != (c = l[o = i >= 0 ? i-- : r++]) && 0 == (2 & c.__u) && e == c.key && f == c.type) return o;
	}
	return -1;
}
function j$1(n, l, u) {
	"-" == l[0] ? n.setProperty(l, null == u ? "" : u) : n[l] = null == u ? "" : "number" != typeof u || y$1.test(l) ? u : u + "px";
}
function F(n, l, u, t, i) {
	var r, o;
	n: if ("style" == l) if ("string" == typeof u) n.style.cssText = u;
	else {
		if ("string" == typeof t && (n.style.cssText = t = ""), t) for (l in t) u && l in u || j$1(n.style, l, "");
		if (u) for (l in u) t && u[l] == t[l] || j$1(n.style, l, u[l]);
	}
	else if ("o" == l[0] && "n" == l[1]) r = l != (l = l.replace(f$2, "$1")), o = l.toLowerCase(), l = o in n || "onFocusOut" == l || "onFocusIn" == l ? o.slice(2) : l.slice(2), n.l || (n.l = {}), n.l[l + r] = u, u ? t ? u.u = t.u : (u.u = c$1, n.addEventListener(l, r ? a$1 : s$1, r)) : n.removeEventListener(l, r ? a$1 : s$1, r);
	else {
		if ("http://www.w3.org/2000/svg" == i) l = l.replace(/xlink(H|:h)/, "h").replace(/sName$/, "s");
		else if ("width" != l && "height" != l && "href" != l && "list" != l && "form" != l && "tabIndex" != l && "download" != l && "rowSpan" != l && "colSpan" != l && "role" != l && "popover" != l && l in n) try {
			n[l] = null == u ? "" : u;
			break n;
		} catch (n) {}
		"function" == typeof u || (null == u || !1 === u && "-" != l[4] ? n.removeAttribute(l) : n.setAttribute(l, "popover" == l && 1 == u ? "" : u));
	}
}
function O(n) {
	return function(u) {
		if (this.l) {
			var t = this.l[u.type + n];
			if (null == u.t) u.t = c$1++;
			else if (u.t < t.u) return;
			return t(l$1.event ? l$1.event(u) : u);
		}
	};
}
function z$1(n, u, t, i, r, o, e, f, c, s) {
	var a, h, p, y, _, m, b, S, C, M, $, I, A, H, L, T = u.type;
	if (void 0 !== u.constructor) return null;
	128 & t.__u && (c = !!(32 & t.__u), o = [f = u.__e = t.__e]), (a = l$1.__b) && a(u);
	n: if ("function" == typeof T) try {
		if (S = u.props, C = T.prototype && T.prototype.render, M = (a = T.contextType) && i[a.__c], $ = a ? M ? M.props.value : a.__ : i, t.__c ? b = (h = u.__c = t.__c).__ = h.__E : (C ? u.__c = h = new T(S, $) : (u.__c = h = new x(S, $), h.constructor = T, h.render = G), M && M.sub(h), h.state || (h.state = {}), h.__n = i, p = h.__d = !0, h.__h = [], h._sb = []), C && null == h.__s && (h.__s = h.state), C && null != T.getDerivedStateFromProps && (h.__s == h.state && (h.__s = w$1({}, h.__s)), w$1(h.__s, T.getDerivedStateFromProps(S, h.__s))), y = h.props, _ = h.state, h.__v = u, p) C && null == T.getDerivedStateFromProps && null != h.componentWillMount && h.componentWillMount(), C && null != h.componentDidMount && h.__h.push(h.componentDidMount);
		else {
			if (C && null == T.getDerivedStateFromProps && S !== y && null != h.componentWillReceiveProps && h.componentWillReceiveProps(S, $), u.__v == t.__v || !h.__e && null != h.shouldComponentUpdate && !1 === h.shouldComponentUpdate(S, h.__s, $)) {
				u.__v != t.__v && (h.props = S, h.state = h.__s, h.__d = !1), u.__e = t.__e, u.__k = t.__k, u.__k.some(function(n) {
					n && (n.__ = u);
				}), v$1.push.apply(h.__h, h._sb), h._sb = [], h.__h.length && e.push(h);
				break n;
			}
			null != h.componentWillUpdate && h.componentWillUpdate(S, h.__s, $), C && null != h.componentDidUpdate && h.__h.push(function() {
				h.componentDidUpdate(y, _, m);
			});
		}
		if (h.context = $, h.props = S, h.__P = n, h.__e = !1, I = l$1.__r, A = 0, C) h.state = h.__s, h.__d = !1, I && I(u), a = h.render(h.props, h.state, h.context), v$1.push.apply(h.__h, h._sb), h._sb = [];
		else do
			h.__d = !1, I && I(u), a = h.render(h.props, h.state, h.context), h.state = h.__s;
		while (h.__d && ++A < 25);
		h.state = h.__s, null != h.getChildContext && (i = w$1(w$1({}, i), h.getChildContext())), C && !p && null != h.getSnapshotBeforeUpdate && (m = h.getSnapshotBeforeUpdate(y, _)), H = null != a && a.type === k$1 && null == a.key ? q(a.props.children) : a, f = P(n, d$1(H) ? H : [H], u, t, i, r, o, e, f, c, s), h.base = u.__e, u.__u &= -161, h.__h.length && e.push(h), b && (h.__E = h.__ = null);
	} catch (n) {
		if (u.__v = null, c || null != o) if (n.then) {
			for (u.__u |= c ? 160 : 128; f && 8 == f.nodeType && f.nextSibling;) f = f.nextSibling;
			o[o.indexOf(f)] = null, u.__e = f;
		} else {
			for (L = o.length; L--;) g(o[L]);
			N(u);
		}
		else u.__e = t.__e, u.__k = t.__k, n.then || N(u);
		l$1.__e(n, u, t);
	}
	else null == o && u.__v == t.__v ? (u.__k = t.__k, u.__e = t.__e) : f = u.__e = B$1(t.__e, u, t, i, r, o, e, c, s);
	return (a = l$1.diffed) && a(u), 128 & u.__u ? void 0 : f;
}
function N(n) {
	n && (n.__c && (n.__c.__e = !0), n.__k && n.__k.some(N));
}
function V(n, u, t) {
	for (var i = 0; i < t.length; i++) D$1(t[i], t[++i], t[++i]);
	l$1.__c && l$1.__c(u, n), n.some(function(u) {
		try {
			n = u.__h, u.__h = [], n.some(function(n) {
				n.call(u);
			});
		} catch (n) {
			l$1.__e(n, u.__v);
		}
	});
}
function q(n) {
	return "object" != typeof n || null == n || n.__b > 0 ? n : d$1(n) ? n.map(q) : w$1({}, n);
}
function B$1(u, t, i, r, o, e, f, c, s) {
	var a, h, v, y, w, _, m, b = i.props || p$1, k = t.props, x = t.type;
	if ("svg" == x ? o = "http://www.w3.org/2000/svg" : "math" == x ? o = "http://www.w3.org/1998/Math/MathML" : o || (o = "http://www.w3.org/1999/xhtml"), null != e) {
		for (a = 0; a < e.length; a++) if ((w = e[a]) && "setAttribute" in w == !!x && (x ? w.localName == x : 3 == w.nodeType)) {
			u = w, e[a] = null;
			break;
		}
	}
	if (null == u) {
		if (null == x) return document.createTextNode(k);
		u = document.createElementNS(o, x, k.is && k), c && (l$1.__m && l$1.__m(t, e), c = !1), e = null;
	}
	if (null == x) b === k || c && u.data == k || (u.data = k);
	else {
		if (e = e && n.call(u.childNodes), !c && null != e) for (b = {}, a = 0; a < u.attributes.length; a++) b[(w = u.attributes[a]).name] = w.value;
		for (a in b) w = b[a], "dangerouslySetInnerHTML" == a ? v = w : "children" == a || a in k || "value" == a && "defaultValue" in k || "checked" == a && "defaultChecked" in k || F(u, a, null, w, o);
		for (a in k) w = k[a], "children" == a ? y = w : "dangerouslySetInnerHTML" == a ? h = w : "value" == a ? _ = w : "checked" == a ? m = w : c && "function" != typeof w || b[a] === w || F(u, a, w, b[a], o);
		if (h) c || v && (h.__html == v.__html || h.__html == u.innerHTML) || (u.innerHTML = h.__html), t.__k = [];
		else if (v && (u.innerHTML = ""), P("template" == t.type ? u.content : u, d$1(y) ? y : [y], t, i, r, "foreignObject" == x ? "http://www.w3.org/1999/xhtml" : o, e, f, e ? e[0] : i.__k && S(i, 0), c, s), null != e) for (a = e.length; a--;) g(e[a]);
		c || (a = "value", "progress" == x && null == _ ? u.removeAttribute("value") : null != _ && (_ !== u[a] || "progress" == x && !_ || "option" == x && _ != b[a]) && F(u, a, _, b[a], o), a = "checked", null != m && m != u[a] && F(u, a, m, b[a], o));
	}
	return u;
}
function D$1(n, u, t) {
	try {
		if ("function" == typeof n) {
			var i = "function" == typeof n.__u;
			i && n.__u(), i && null == u || (n.__u = n(u));
		} else n.current = u;
	} catch (n) {
		l$1.__e(n, t);
	}
}
function E(n, u, t) {
	var i, r;
	if (l$1.unmount && l$1.unmount(n), (i = n.ref) && (i.current && i.current != n.__e || D$1(i, null, u)), null != (i = n.__c)) {
		if (i.componentWillUnmount) try {
			i.componentWillUnmount();
		} catch (n) {
			l$1.__e(n, u);
		}
		i.base = i.__P = null;
	}
	if (i = n.__k) for (r = 0; r < i.length; r++) i[r] && E(i[r], u, t || "function" != typeof n.type);
	t || g(n.__e), n.__c = n.__ = n.__e = void 0;
}
function G(n, l, u) {
	return this.constructor(n, u);
}
function J(u, t, i) {
	var r, o, e, f;
	t == document && (t = document.documentElement), l$1.__ && l$1.__(u, t), o = (r = "function" == typeof i) ? null : i && i.__k || t.__k, e = [], f = [], z$1(t, u = (!r && i || t).__k = _(k$1, null, [u]), o || p$1, p$1, t.namespaceURI, !r && i ? [i] : o ? null : t.firstChild ? n.call(t.childNodes) : null, e, !r && i ? i : o ? o.__e : t.firstChild, r, f), V(e, u, f);
}
n = v$1.slice, l$1 = { __e: function(n, l, u, t) {
	for (var i, r, o; l = l.__;) if ((i = l.__c) && !i.__) try {
		if ((r = i.constructor) && null != r.getDerivedStateFromError && (i.setState(r.getDerivedStateFromError(n)), o = i.__d), null != i.componentDidCatch && (i.componentDidCatch(n, t || {}), o = i.__d), o) return i.__E = i;
	} catch (l) {
		n = l;
	}
	throw n;
} }, u$2 = 0, x.prototype.setState = function(n, l) {
	var u = null != this.__s && this.__s != this.state ? this.__s : this.__s = w$1({}, this.state);
	"function" == typeof n && (n = n(w$1({}, u), this.props)), n && w$1(u, n), null != n && this.__v && (l && this._sb.push(l), $(this));
}, x.prototype.forceUpdate = function(n) {
	this.__v && (this.__e = !0, n && this.__h.push(n), $(this));
}, x.prototype.render = k$1, i$2 = [], o$2 = "function" == typeof Promise ? Promise.prototype.then.bind(Promise.resolve()) : setTimeout, e$1 = function(n, l) {
	return n.__v.__b - l.__v.__b;
}, I.__r = 0, f$2 = /(PointerCapture)$|Capture$/i, c$1 = 0, s$1 = O(!1), a$1 = O(!0);
//#endregion
//#region node_modules/preact/jsx-runtime/dist/jsxRuntime.module.js
var f$1 = 0;
Array.isArray;
function u$1(e, t, n, o, i, u) {
	t || (t = {});
	var a, c, p = t;
	if ("ref" in p) for (c in p = {}, t) "ref" == c ? a = t[c] : p[c] = t[c];
	var l = {
		type: e,
		props: p,
		key: n,
		ref: a,
		__k: null,
		__: null,
		__b: 0,
		__e: null,
		__c: null,
		constructor: void 0,
		__v: --f$1,
		__i: -1,
		__u: 0,
		__source: i,
		__self: u
	};
	if ("function" == typeof e && (a = e.defaultProps)) for (c in a) void 0 === p[c] && (p[c] = a[c]);
	return l$1.vnode && l$1.vnode(l), l;
}
//#endregion
//#region node_modules/@deck.gl/widgets/dist/lib/components/button-group.js
/** Renders a group of buttons with Widget CSS */
var ButtonGroup = (props) => {
	const { children, orientation = "horizontal" } = props;
	return u$1("div", {
		className: `deck-widget-button-group ${orientation}`,
		children
	});
};
//#endregion
//#region node_modules/@deck.gl/widgets/dist/lib/components/grouped-icon-button.js
/** Renders an icon button as part of a ButtonGroup */
var GroupedIconButton = (props) => {
	const { className = "", label, onClick, children } = props;
	return u$1("button", {
		className: `deck-widget-icon-button ${className}`,
		type: "button",
		onClick,
		title: label,
		children: children ? children : u$1("div", { className: "deck-widget-icon" })
	});
};
//#endregion
//#region node_modules/@deck.gl/widgets/dist/zoom-widget.js
var ZoomWidget$1 = class extends Widget {
	constructor(props = {}) {
		super(props);
		this.className = "deck-widget-zoom";
		this.placement = "top-left";
		this.viewports = {};
		this.setProps(this.props);
	}
	setProps(props) {
		this.placement = props.placement ?? this.placement;
		this.viewId = props.viewId ?? this.viewId;
		super.setProps(props);
	}
	onRenderHTML(rootElement) {
		J(u$1(ButtonGroup, {
			orientation: this.props.orientation,
			children: [u$1(GroupedIconButton, {
				onClick: () => this.handleZoomIn(),
				label: this.props.zoomInLabel,
				className: "deck-widget-zoom-in"
			}), u$1(GroupedIconButton, {
				onClick: () => this.handleZoomOut(),
				label: this.props.zoomOutLabel,
				className: "deck-widget-zoom-out"
			})]
		}), rootElement);
	}
	onViewportChange(viewport) {
		this.viewports[viewport.id] = viewport;
	}
	handleZoom(viewport, nextZoom) {
		const viewId = this.viewId || viewport?.id || "default-view";
		const nextViewState = {
			...viewport,
			zoom: nextZoom
		};
		if (this.props.transitionDuration > 0) {
			nextViewState.transitionDuration = this.props.transitionDuration;
			nextViewState.transitionInterpolator = "latitude" in nextViewState ? new FlyToInterpolator() : new LinearInterpolator({ transitionProps: ["zoom"] });
		}
		this.setViewState(viewId, nextViewState);
	}
	handleZoomIn() {
		for (const viewport of Object.values(this.viewports)) this.handleZoom(viewport, viewport.zoom + 1);
	}
	handleZoomOut() {
		for (const viewport of Object.values(this.viewports)) this.handleZoom(viewport, viewport.zoom - 1);
	}
	/** @todo - move to deck or widget manager */
	setViewState(viewId, viewState) {
		this.deck._onViewStateChange({
			viewId,
			viewState,
			interactionState: {}
		});
	}
};
ZoomWidget$1.defaultProps = {
	...Widget.defaultProps,
	id: "zoom",
	placement: "top-left",
	orientation: "vertical",
	transitionDuration: 200,
	zoomInLabel: "Zoom In",
	zoomOutLabel: "Zoom Out",
	viewId: null
};
//#endregion
//#region node_modules/@deck.gl/widgets/dist/lib/components/icon-button.js
/** Renders a button component with widget CSS */
var IconButton = (props) => {
	const { className = "", label, onClick, children } = props;
	return u$1("div", {
		className: "deck-widget-button",
		children: u$1("button", {
			className: `deck-widget-icon-button ${className}`,
			type: "button",
			onClick,
			title: label,
			children: children ? children : u$1("div", { className: "deck-widget-icon" })
		})
	});
};
//#endregion
//#region node_modules/@deck.gl/widgets/dist/reset-view-widget.js
/**
* A button widget that resets the view state of deck to an initial state.
*/
var ResetViewWidget$1 = class extends Widget {
	constructor(props = {}) {
		super(props);
		this.className = "deck-widget-reset-view";
		this.placement = "top-left";
		this.setProps(this.props);
	}
	setProps(props) {
		this.placement = props.placement ?? this.placement;
		this.viewId = props.viewId ?? this.viewId;
		super.setProps(props);
	}
	onRenderHTML(rootElement) {
		J(u$1(IconButton, {
			className: "deck-widget-reset-focus",
			label: this.props.label,
			onClick: this.handleClick.bind(this)
		}), rootElement);
	}
	handleClick() {
		const initialViewState = this.props.initialViewState || this.deck?.props.initialViewState;
		this.setViewState(initialViewState);
	}
	setViewState(viewState) {
		const viewId = this.props.viewId || "default-view";
		const nextViewState = { ...viewId !== "default-view" ? viewState?.[viewId] : viewState };
		this.deck._onViewStateChange({
			viewId,
			viewState: nextViewState,
			interactionState: {}
		});
	}
};
ResetViewWidget$1.defaultProps = {
	...Widget.defaultProps,
	id: "reset-view",
	placement: "top-left",
	label: "Reset View",
	initialViewState: void 0,
	viewId: null
};
//#endregion
//#region node_modules/@deck.gl/widgets/dist/compass-widget.js
var CompassWidget$1 = class extends Widget {
	constructor(props = {}) {
		super(props);
		this.className = "deck-widget-compass";
		this.placement = "top-left";
		this.viewports = {};
		this.setProps(this.props);
	}
	setProps(props) {
		this.placement = props.placement ?? this.placement;
		this.viewId = props.viewId ?? this.viewId;
		super.setProps(props);
	}
	onRenderHTML(rootElement) {
		const viewId = this.viewId || Object.values(this.viewports)[0]?.id || "default-view";
		const widgetViewport = this.viewports[viewId];
		const [rz, rx] = this.getRotation(widgetViewport);
		J(u$1("div", {
			className: "deck-widget-button",
			style: { perspective: 100 },
			children: u$1("button", {
				type: "button",
				onClick: () => {
					for (const viewport of Object.values(this.viewports)) this.handleCompassReset(viewport);
				},
				title: this.props.label,
				style: { transform: `rotateX(${rx}deg)` },
				children: u$1("svg", {
					fill: "none",
					width: "100%",
					height: "100%",
					viewBox: "0 0 26 26",
					children: u$1("g", {
						transform: `rotate(${rz},13,13)`,
						children: [u$1("path", {
							d: "M10 13.0001L12.9999 5L15.9997 13.0001H10Z",
							fill: "var(--icon-compass-north-color, rgb(240, 92, 68))"
						}), u$1("path", {
							d: "M16.0002 12.9999L13.0004 21L10.0005 12.9999H16.0002Z",
							fill: "var(--icon-compass-south-color, rgb(204, 204, 204))"
						})]
					})
				})
			})
		}), rootElement);
	}
	onViewportChange(viewport) {
		if (!viewport.equals(this.viewports[viewport.id])) {
			this.viewports[viewport.id] = viewport;
			this.updateHTML();
		}
	}
	getRotation(viewport) {
		if (viewport instanceof WebMercatorViewport) return [-viewport.bearing, viewport.pitch];
		else if (viewport instanceof GlobeViewport) return [0, Math.max(-80, Math.min(80, viewport.latitude))];
		return [0, 0];
	}
	handleCompassReset(viewport) {
		const viewId = this.viewId || viewport.id || "default-view";
		if (viewport instanceof WebMercatorViewport) {
			const nextViewState = {
				...viewport,
				bearing: 0,
				...this.getRotation(viewport)[0] === 0 ? { pitch: 0 } : {},
				transitionDuration: this.props.transitionDuration,
				transitionInterpolator: new FlyToInterpolator()
			};
			this.deck._onViewStateChange({
				viewId,
				viewState: nextViewState,
				interactionState: {}
			});
		}
	}
};
CompassWidget$1.defaultProps = {
	...Widget.defaultProps,
	id: "compass",
	placement: "top-left",
	viewId: null,
	label: "Reset Compass",
	transitionDuration: 200
};
//#endregion
//#region node_modules/@deck.gl/widgets/dist/scale-widget.js
/**
* A scale widget that displays a Google Maps–like scale indicator.
* Instead of text inside a div, this widget renders an SVG that contains a horizontal line
* with two vertical tick marks (extending upward from the line only) and a pretty distance label
* positioned to the left of the line. The horizontal line’s length is computed from a “nice”
* candidate distance (e.g. 200, 500, 1000 m, etc.) so that its pixel width is between 100 and 200.
*/
var ScaleWidget$1 = class extends Widget {
	constructor(props = {}) {
		super(props);
		this.className = "deck-widget-scale";
		this.placement = "bottom-left";
		this.scaleWidth = 10;
		this.scaleValue = 0;
		this.scaleText = "";
		this.setProps(this.props);
	}
	setProps(props) {
		this.placement = props.placement ?? this.placement;
		this.viewId = props.viewId ?? this.viewId;
		super.setProps(props);
	}
	onRenderHTML(rootElement) {
		const lineOffsetX = 50;
		const svgWidth = lineOffsetX + this.scaleWidth;
		const tickHeight = 10;
		J(u$1("svg", {
			className: "deck-widget-scale",
			width: svgWidth,
			height: 30,
			style: {
				overflow: "visible",
				background: "transparent"
			},
			onClick: this.handleClick.bind(this),
			children: [
				u$1("text", {
					x: lineOffsetX + 5,
					y: "10",
					textAnchor: "end",
					alignmentBaseline: "middle",
					style: {
						fontSize: "16px",
						fill: "black",
						fontWeight: "bold",
						fontFamily: "sans-serif"
					},
					children: this.scaleText
				}),
				u$1("line", {
					x1: lineOffsetX,
					y1: "15",
					x2: lineOffsetX + this.scaleWidth,
					y2: "15",
					stroke: "black",
					strokeWidth: "6"
				}),
				u$1("line", {
					x1: lineOffsetX,
					y1: "15",
					x2: lineOffsetX,
					y2: 15 - tickHeight,
					stroke: "black",
					strokeWidth: "6"
				}),
				u$1("line", {
					x1: lineOffsetX + this.scaleWidth,
					y1: "15",
					x2: lineOffsetX + this.scaleWidth,
					y2: 15 - tickHeight,
					stroke: "black",
					strokeWidth: "6"
				})
			]
		}), rootElement);
	}
	onViewportChange(viewport) {
		if (!("latitude" in viewport)) return;
		const { latitude, zoom } = viewport;
		const { candidate, candidatePixels } = computeScaleCandidate(getMetersPerPixel(latitude, zoom));
		this.scaleValue = candidate;
		this.scaleWidth = candidatePixels;
		if (candidate >= 1e3) this.scaleText = `${(candidate / 1e3).toFixed(1)} km`;
		else this.scaleText = `${candidate} m`;
		this.updateHTML();
	}
	handleClick() {}
};
ScaleWidget$1.defaultProps = {
	...Widget.defaultProps,
	id: "scale",
	placement: "bottom-left",
	label: "Scale",
	viewId: null
};
/**
* Compute the meters per pixel at a given latitude and zoom level.
*
* @param latitude - The current latitude.
* @param zoom - The current zoom level.
* @returns The number of meters per pixel.
*/
function getMetersPerPixel(latitude, zoom) {
	return 40075016.686 * Math.cos(latitude * Math.PI / 180) / Math.pow(2, zoom + 8);
}
/**
* Compute a "nice" scale candidate such that the scale bar width in pixels is between 100 and 200.
* The candidate distance (in meters) will be one of a set of round numbers (100, 200, 500, 1000, 2000, 5000, etc.).
*
* @param metersPerPixel - The number of meters per pixel at the current zoom/latitude.
* @returns An object containing the candidate distance and its width in pixels.
*/
function computeScaleCandidate(metersPerPixel) {
	const minPixels = 100;
	const maxPixels = 200;
	const targetDistance = (minPixels + maxPixels) / 2 * metersPerPixel;
	const exponent = Math.floor(Math.log10(targetDistance));
	const base = Math.pow(10, exponent);
	const multipliers = [
		1,
		2,
		5
	];
	let candidate = multipliers[0] * base;
	let candidatePixels = candidate / metersPerPixel;
	for (let i = 0; i < multipliers.length; i++) {
		const currentCandidate = multipliers[i] * base;
		const currentPixels = currentCandidate / metersPerPixel;
		if (currentPixels >= minPixels && currentPixels <= maxPixels) {
			candidate = currentCandidate;
			candidatePixels = currentPixels;
			break;
		}
		if (currentPixels > maxPixels) {
			candidate = i > 0 ? multipliers[i - 1] * base : currentCandidate;
			candidatePixels = candidate / metersPerPixel;
			break;
		}
		if (i === multipliers.length - 1 && currentPixels < minPixels) {
			candidate = multipliers[0] * base * 10;
			candidatePixels = candidate / metersPerPixel;
		}
	}
	return {
		candidate,
		candidatePixels
	};
}
//#endregion
//#region node_modules/preact/hooks/dist/hooks.module.js
var t, r, u, i, o = 0, f = [], c = l$1, e = c.__b, a = c.__r, v = c.diffed, l = c.__c, m = c.unmount, s = c.__;
function p(n, t) {
	c.__h && c.__h(r, n, o || t), o = 0;
	var u = r.__H || (r.__H = {
		__: [],
		__h: []
	});
	return n >= u.__.length && u.__.push({}), u.__[n];
}
function d(n) {
	return o = 1, h(D, n);
}
function h(n, u, i) {
	var o = p(t++, 2);
	if (o.t = n, !o.__c && (o.__ = [i ? i(u) : D(void 0, u), function(n) {
		var t = o.__N ? o.__N[0] : o.__[0], r = o.t(t, n);
		t !== r && (o.__N = [r, o.__[1]], o.__c.setState({}));
	}], o.__c = r, !r.__f)) {
		var f = function(n, t, r) {
			if (!o.__c.__H) return !0;
			var u = o.__c.__H.__.filter(function(n) {
				return n.__c;
			});
			if (u.every(function(n) {
				return !n.__N;
			})) return !c || c.call(this, n, t, r);
			var i = o.__c.props !== n;
			return u.some(function(n) {
				if (n.__N) {
					var t = n.__[0];
					n.__ = n.__N, n.__N = void 0, t !== n.__[0] && (i = !0);
				}
			}), c && c.call(this, n, t, r) || i;
		};
		r.__f = !0;
		var c = r.shouldComponentUpdate, e = r.componentWillUpdate;
		r.componentWillUpdate = function(n, t, r) {
			if (this.__e) {
				var u = c;
				c = void 0, f(n, t, r), c = u;
			}
			e && e.call(this, n, t, r);
		}, r.shouldComponentUpdate = f;
	}
	return o.__N || o.__;
}
function y(n, u) {
	var i = p(t++, 3);
	!c.__s && C(i.__H, u) && (i.__ = n, i.u = u, r.__H.__h.push(i));
}
function A(n) {
	return o = 5, T(function() {
		return { current: n };
	}, []);
}
function T(n, r) {
	var u = p(t++, 7);
	return C(u.__H, r) && (u.__ = n(), u.__H = r, u.__h = n), u.__;
}
function j() {
	for (var n; n = f.shift();) {
		var t = n.__H;
		if (n.__P && t) try {
			t.__h.some(z), t.__h.some(B), t.__h = [];
		} catch (r) {
			t.__h = [], c.__e(r, n.__v);
		}
	}
}
c.__b = function(n) {
	r = null, e && e(n);
}, c.__ = function(n, t) {
	n && t.__k && t.__k.__m && (n.__m = t.__k.__m), s && s(n, t);
}, c.__r = function(n) {
	a && a(n), t = 0;
	var i = (r = n.__c).__H;
	i && (u === r ? (i.__h = [], r.__h = [], i.__.some(function(n) {
		n.__N && (n.__ = n.__N), n.u = n.__N = void 0;
	})) : (i.__h.some(z), i.__h.some(B), i.__h = [], t = 0)), u = r;
}, c.diffed = function(n) {
	v && v(n);
	var t = n.__c;
	t && t.__H && (t.__H.__h.length && (1 !== f.push(t) && i === c.requestAnimationFrame || ((i = c.requestAnimationFrame) || w)(j)), t.__H.__.some(function(n) {
		n.u && (n.__H = n.u), n.u = void 0;
	})), u = r = null;
}, c.__c = function(n, t) {
	t.some(function(n) {
		try {
			n.__h.some(z), n.__h = n.__h.filter(function(n) {
				return !n.__ || B(n);
			});
		} catch (r) {
			t.some(function(n) {
				n.__h && (n.__h = []);
			}), t = [], c.__e(r, n.__v);
		}
	}), l && l(n, t);
}, c.unmount = function(n) {
	m && m(n);
	var t, r = n.__c;
	r && r.__H && (r.__H.__.some(function(n) {
		try {
			z(n);
		} catch (n) {
			t = n;
		}
	}), r.__H = void 0, t && c.__e(t, r.__v));
};
var k = "function" == typeof requestAnimationFrame;
function w(n) {
	var t, r = function() {
		clearTimeout(u), k && cancelAnimationFrame(t), setTimeout(n);
	}, u = setTimeout(r, 35);
	k && (t = requestAnimationFrame(r));
}
function z(n) {
	var t = r, u = n.__c;
	"function" == typeof u && (n.__c = void 0, u()), r = t;
}
function B(n) {
	var t = r;
	n.__c = n.__(), r = t;
}
function C(n, t) {
	return !n || n.length !== t.length || t.some(function(t, r) {
		return t !== n[r];
	});
}
function D(n, t) {
	return "function" == typeof t ? t(n) : t;
}
//#endregion
//#region node_modules/@deck.gl/widgets/dist/lib/components/dropdown-menu.js
function getMenuItemValue(item) {
	return typeof item === "string" ? item : item.value;
}
function getMenuItemLabel(item) {
	return typeof item === "string" ? item : item.label;
}
function getMenuItemIcon(item) {
	return typeof item === "string" ? void 0 : item.icon;
}
var DropdownMenu = (props) => {
	const [isOpen, setIsOpen] = d(false);
	const dropdownRef = A(null);
	const toggleDropdown = () => setIsOpen(!isOpen);
	const handleClickOutside = (event) => {
		if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setIsOpen(false);
	};
	y(() => {
		document.addEventListener("mousedown", handleClickOutside);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, []);
	const handleSelect = (item) => {
		props.onSelect(getMenuItemValue(item));
		setIsOpen(false);
	};
	if (props.menuItems.length === 0) return null;
	return u$1("div", {
		className: "deck-widget-dropdown-container",
		ref: dropdownRef,
		style: props.style,
		children: [u$1("button", {
			className: "deck-widget-dropdown-button",
			onClick: toggleDropdown,
			children: u$1("span", { className: `deck-widget-dropdown-icon ${isOpen ? "open" : ""}` })
		}), isOpen && u$1("ul", {
			className: "deck-widget-dropdown-menu",
			children: props.menuItems.map((item) => {
				const icon = getMenuItemIcon(item);
				return u$1("li", {
					className: "deck-widget-dropdown-item",
					onClick: () => handleSelect(item),
					children: [icon && u$1("span", {
						className: "deck-widget-dropdown-item-icon",
						style: {
							maskImage: `url("${icon}")`,
							WebkitMaskImage: `url("${icon}")`
						}
					}), getMenuItemLabel(item)]
				}, getMenuItemValue(item));
			})
		})]
	});
};
//#endregion
//#region node_modules/@deck.gl/widgets/dist/lib/geocode/geocoder-history.js
var CURRENT_LOCATION$1 = "current";
var LOCAL_STORAGE_KEY = "deck-geocoder-history";
/**
* An internal, experimental helper class for storing a list of locations in local storage.
* @todo Remove the UI related state.
*/
var GeocoderHistory = class {
	constructor(props) {
		this.addressText = "";
		this.errorText = "";
		this.addressHistory = [];
		this.props = {
			maxEntries: 5,
			...props
		};
		this.addressHistory = this.loadPreviousAddresses();
	}
	/** PErform geocoding */
	async geocode(geocoder, address, apiKey) {
		this.errorText = "";
		this.addressText = address;
		try {
			const coordinates = await geocoder.geocode(address, apiKey);
			if (coordinates) {
				this.storeAddress(this.addressText);
				return coordinates;
			}
			this.errorText = "Invalid address";
		} catch (error) {
			this.errorText = `${error.message}`;
		}
		return null;
	}
	loadPreviousAddresses() {
		try {
			const stored = window.localStorage.getItem(LOCAL_STORAGE_KEY);
			const list = stored && JSON.parse(stored);
			return Array.isArray(list) ? list.filter((v) => typeof v === "string") : [];
		} catch {}
		return [];
	}
	storeAddress(address) {
		const cleaned = address.trim();
		if (!cleaned || cleaned === CURRENT_LOCATION$1) return;
		this.addressHistory = [cleaned, ...this.addressHistory.filter((a) => a !== cleaned)].slice(0, this.props.maxEntries);
		try {
			window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(this.addressHistory));
		} catch {}
	}
};
//#endregion
//#region node_modules/@deck.gl/widgets/dist/lib/geocode/geocoders.js
var GOOGLE_URL = "https://maps.googleapis.com/maps/api/geocode/json";
var MAPBOX_URL = "https://api.mapbox.com/geocoding/v5/mapbox.places";
var OPENCAGE_API_URL = "https://api.opencagedata.com/geocode/v1/json";
/**
* A geocoder that uses the google geocoding service
* @note Requires an API key from Google
* @see https://developers.google.com/maps/documentation/geocoding/get-api-key
*/
var GoogleGeocoder = {
	name: "google",
	requiresApiKey: true,
	async geocode(address, apiKey) {
		const json = await fetchJson(`${GOOGLE_URL}?address=${encodeURIComponent(address)}&key=${apiKey}`);
		switch (json.status) {
			case "OK":
				const loc = json.results.length > 0 && json.results[0].geometry.location;
				return loc ? {
					longitude: loc.lng,
					latitude: loc.lat
				} : null;
			default: throw new Error(`Google Geocoder failed: ${json.status}`);
		}
	}
};
/**
* A geocoder that uses the google geocoding service
* @note Requires an API key from Mapbox
* @see https://docs.mapbox.com/api/search/geocoding/
*/
var MapboxGeocoder = {
	name: "google",
	requiresApiKey: true,
	async geocode(address, apiKey) {
		const json = await fetchJson(`${MAPBOX_URL}/${encodeURIComponent(address)}.json?access_token=${apiKey}`);
		if (Array.isArray(json.features) && json.features.length > 0) {
			const center = json.features[0].center;
			if (Array.isArray(center) && center.length >= 2) return {
				longitude: center[0],
				latitude: center[1]
			};
		}
		return null;
	}
};
/**
* A geocoder that uses the google geocoding service
* @note Requires an API key from OpenCageData
* @see https://opencagedata.com/api
*/
var OpenCageGeocoder = {
	name: "opencage",
	requiresApiKey: true,
	async geocode(address, key) {
		const data = await fetchJson(`${OPENCAGE_API_URL}?q=${encodeURIComponent(address)}&key=${key}`);
		if (Array.isArray(data.results) && data.results.length > 0) {
			const geometry = data.results[0].geometry;
			return {
				longitude: geometry.lng,
				latitude: geometry.lat
			};
		}
		return null;
	}
};
/**
* A geocoder adapter that wraps the browser's geolocation API. Always returns the user's current location.
* @note Not technically a geocoder, but a geolocation service that provides a source of locations.
* @note The user must allow location access for this to work.
*/
var CurrentLocationGeocoder = {
	name: "current",
	requiresApiKey: false,
	async geocode() {
		if (!navigator.geolocation) throw new Error("Geolocation not supported");
		return new Promise((resolve, reject) => {
			navigator.geolocation.getCurrentPosition(
				/** @see https://developer.mozilla.org/docs/Web/API/GeolocationPosition */
				(position) => {
					const { longitude, latitude } = position.coords;
					resolve({
						longitude,
						latitude
					});
				},
				/** @see https://developer.mozilla.org/docs/Web/API/GeolocationPositionError */
				(error) => reject(new Error(error.message))
			);
		});
	}
};
/** Fetch JSON, catching HTTP errors */
async function fetchJson(url) {
	let response;
	try {
		response = await fetch(url);
	} catch (error) {
		throw new Error(`CORS error? ${error}. ${url}: `);
	}
	if (!response.ok) throw new Error(`${response.statusText}. ${url}: `);
	const data = await response.json();
	if (!data) throw new Error(`No data returned. ${url}`);
	return data;
}
/**
* Parse a coordinate string.
* Supports comma- or semicolon-separated values.
* Heuristically determines which value is longitude and which is latitude.
*/
var CoordinatesGeocoder = {
	name: "coordinates",
	requiresApiKey: false,
	placeholderLocation: `-122.45, 37.8 or 37°48'N, 122°27'W`,
	async geocode(address) {
		return parseCoordinates(address) || null;
	}
};
/**
* Parse an input string for coordinates.
* Supports comma- or semicolon-separated values.
* Heuristically determines which value is longitude and which is latitude.
*/
function parseCoordinates(input) {
	input = input.trim();
	const parts = input.split(/[,;]/).map((p) => p.trim());
	if (parts.length < 2) return null;
	const first = parseCoordinatePart(parts[0]);
	const second = parseCoordinatePart(parts[1]);
	if (first === null || second === null) return null;
	if (Math.abs(first) > 90 && Math.abs(second) <= 90) return {
		longitude: first,
		latitude: second
	};
	else if (Math.abs(second) > 90 && Math.abs(first) <= 90) return {
		longitude: second,
		latitude: first
	};
	return {
		latitude: first,
		longitude: second
	};
}
/**
* Parse a single coordinate part (which may be in decimal or DMS format).
*/
function parseCoordinatePart(s) {
	s = s.trim();
	if (s.includes("°") || s.includes("'") || s.includes("\"")) {
		const value = dmsToDecimal(s);
		return isNaN(value) ? null : value;
	}
	let sign = 1;
	if (/[SW]/i.test(s)) sign = -1;
	s = s.replace(/[NSEW]/gi, "");
	const value = parseFloat(s);
	return isNaN(value) ? null : sign * value;
}
/** Convert a DMS string (e.g. "37°48'00\"N") to decimal degrees. */
function dmsToDecimal(s) {
	const match = s.match(/(\d+)[°d]\s*(\d+)?['′m]?\s*(\d+(?:\.\d+)?)?[\"″s]?\s*([NSEW])?/i);
	if (!match) return NaN;
	const degrees = parseFloat(match[1]) || 0;
	const minutes = parseFloat(match[2]) || 0;
	const seconds = parseFloat(match[3]) || 0;
	const direction = match[4] || "";
	let dec = degrees + minutes / 60 + seconds / 3600;
	if (/[SW]/i.test(direction)) dec = -dec;
	return dec;
}
//#endregion
//#region node_modules/@deck.gl/widgets/dist/geocoder-widget.js
var CURRENT_LOCATION = "current";
var CURRENT_LOCATION_ITEM = {
	label: "Current location",
	value: CURRENT_LOCATION,
	icon: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 -960 960 960'%3E%3Cpath d='M480-480q33 0 56.5-23.5T560-560q0-33-23.5-56.5T480-640q-33 0-56.5 23.5T400-560q0 33 23.5 56.5T480-480Zm0 294q122-112 181-203.5T720-552q0-109-69.5-178.5T480-800q-101 0-170.5 69.5T240-552q0 71 59 162.5T480-186Zm0 106Q319-217 239.5-334.5T160-552q0-150 96.5-239T480-880q127 0 223.5 89T800-552q0 100-79.5 217.5T480-80Z'/%3E%3C/svg%3E`
};
/**
* A widget that display a text box that lets user type in a location
* and a button that moves the view to that location.
* @todo For now only supports coordinates, Could be extended with location service integrations.
*/
var GeocoderWidget$1 = class extends Widget {
	constructor(props = {}) {
		super(props);
		this.className = "deck-widget-geocoder";
		this.placement = "top-left";
		this.geocodeHistory = new GeocoderHistory({});
		this.addressText = "";
		this.geocoder = CoordinatesGeocoder;
		this.isGettingLocation = false;
		this.setInput = (text) => {
			this.addressText = text;
		};
		this.handleKeyPress = (e) => {
			if (e.key === "Enter") this.handleSubmit();
		};
		this.handleSelect = (value) => {
			if (value === CURRENT_LOCATION) this.getCurrentLocation();
			else {
				this.setInput(value);
				this.handleSubmit();
			}
		};
		/** Sync wrapper for async geocode() */
		this.handleSubmit = () => {
			this.geocode(this.addressText);
		};
		/** Get current location via browser geolocation API */
		this.getCurrentLocation = async () => {
			this.isGettingLocation = true;
			if (this.rootElement) this.updateHTML();
			try {
				const coordinates = await CurrentLocationGeocoder.geocode();
				if (coordinates) this.setViewState(coordinates);
			} catch (error) {
				this.geocodeHistory.errorText = error instanceof Error ? error.message : "Location error";
			} finally {
				this.isGettingLocation = false;
				if (this.rootElement) this.updateHTML();
			}
		};
		/** Perform geocoding */
		this.geocode = async (address) => {
			const coordinates = await this.geocodeHistory.geocode(this.geocoder, this.addressText, this.props.apiKey);
			if (this.rootElement) this.updateHTML();
			if (coordinates) this.setViewState(coordinates);
		};
		this.viewports = {};
		this.setProps(this.props);
	}
	setProps(props) {
		this.placement = props.placement ?? this.placement;
		this.viewId = props.viewId ?? this.viewId;
		this.geocoder = getGeocoder(this.props);
		if (this.geocoder.requiresApiKey && !this.props.apiKey) throw new Error(`API key is required for the ${this.geocoder.name} geocoder`);
		super.setProps(props);
	}
	onRenderHTML(rootElement) {
		const menuItems = this.props._geolocation ? [CURRENT_LOCATION_ITEM, ...this.geocodeHistory.addressHistory] : [...this.geocodeHistory.addressHistory];
		J(u$1("div", {
			className: "deck-widget-geocoder",
			children: [
				u$1("input", {
					className: "deck-widget-geocoder-input",
					type: "text",
					placeholder: this.isGettingLocation ? "Finding your location..." : this.geocoder.placeholderLocation ?? "Enter address or location",
					value: this.geocodeHistory.addressText,
					onInput: (e) => this.setInput(e.target?.value || ""),
					onKeyPress: this.handleKeyPress
				}),
				u$1(DropdownMenu, {
					menuItems,
					onSelect: this.handleSelect
				}),
				this.geocodeHistory.errorText && u$1("div", {
					className: "deck-widget-geocoder-error",
					children: this.geocodeHistory.errorText
				})
			]
		}), rootElement);
	}
	setViewState(viewState) {
		const viewId = this.props.viewId || viewState?.id || "default-view";
		const nextViewState = {
			...this.viewports[viewId] || {},
			...viewState
		};
		if (this.props.transitionDuration > 0) {
			nextViewState.transitionDuration = this.props.transitionDuration;
			nextViewState.transitionInterpolator = "latitude" in nextViewState ? new FlyToInterpolator() : new LinearInterpolator();
		}
		this.deck._onViewStateChange({
			viewId,
			viewState: nextViewState,
			interactionState: {}
		});
	}
	onViewportChange(viewport) {
		this.viewports[viewport.id] = viewport;
	}
};
GeocoderWidget$1.defaultProps = {
	...Widget.defaultProps,
	id: "geocoder",
	viewId: null,
	placement: "top-left",
	label: "Geocoder",
	transitionDuration: 200,
	geocoder: "coordinates",
	customGeocoder: CoordinatesGeocoder,
	apiKey: "",
	_geolocation: false
};
function getGeocoder(props) {
	switch (props.geocoder) {
		case "google": return GoogleGeocoder;
		case "mapbox": return MapboxGeocoder;
		case "opencage": return OpenCageGeocoder;
		case "coordinates": return CoordinatesGeocoder;
		case "custom":
			if (!props.customGeocoder) throw new Error("Custom geocoder is not defined");
			return props.customGeocoder;
		default: throw new Error(`Unknown geocoder: ${props.geocoder}`);
	}
}
//#endregion
//#region node_modules/@deck.gl/widgets/dist/fullscreen-widget.js
var FullscreenWidget$1 = class extends Widget {
	constructor(props = {}) {
		super(props);
		this.className = "deck-widget-fullscreen";
		this.placement = "top-left";
		this.fullscreen = false;
		this.setProps(this.props);
	}
	onAdd() {
		document.addEventListener("fullscreenchange", this.onFullscreenChange.bind(this));
	}
	onRemove() {
		document.removeEventListener("fullscreenchange", this.onFullscreenChange.bind(this));
	}
	onRenderHTML(rootElement) {
		J(u$1(IconButton, {
			onClick: () => {
				this.handleClick().catch((err) => defaultLogger.error(err)());
			},
			label: this.fullscreen ? this.props.exitLabel : this.props.enterLabel,
			className: this.fullscreen ? "deck-widget-fullscreen-exit" : "deck-widget-fullscreen-enter"
		}), rootElement);
	}
	setProps(props) {
		this.placement = props.placement ?? this.placement;
		this.viewId = props.viewId ?? this.viewId;
		super.setProps(props);
	}
	getContainer() {
		return this.props.container || this.deck?.getCanvas()?.parentElement;
	}
	onFullscreenChange() {
		if (this.fullscreen !== (document.fullscreenElement === this.getContainer())) this.fullscreen = !this.fullscreen;
		this.updateHTML();
	}
	async handleClick() {
		if (this.fullscreen) await this.exitFullscreen();
		else await this.requestFullscreen();
		this.updateHTML();
	}
	async requestFullscreen() {
		const container = this.getContainer();
		if (container?.requestFullscreen) await container.requestFullscreen({ navigationUI: "hide" });
		else this.togglePseudoFullscreen();
	}
	async exitFullscreen() {
		if (document.exitFullscreen) await document.exitFullscreen();
		else this.togglePseudoFullscreen();
	}
	togglePseudoFullscreen() {
		this.getContainer()?.classList.toggle("deck-pseudo-fullscreen");
	}
};
FullscreenWidget$1.defaultProps = {
	...Widget.defaultProps,
	id: "fullscreen",
	placement: "top-left",
	viewId: null,
	enterLabel: "Enter Fullscreen",
	exitLabel: "Exit Fullscreen",
	container: void 0
};
//#endregion
//#region node_modules/@deck.gl/widgets/dist/splitter-widget.js
/**
* A draggable splitter widget that appears as a vertical or horizontal line
* across the deck.gl canvas. It positions itself based on the split percentage
* of the first view and provides callbacks when dragged.
*/
var SplitterWidget$1 = class extends Widget {
	constructor(props) {
		super(props);
		this.className = "deck-widget-splitter";
		this.placement = "fill";
	}
	setProps(props) {
		super.setProps(props);
	}
	onRenderHTML(rootElement) {
		rootElement.style.position = "absolute";
		rootElement.style.top = "0";
		rootElement.style.left = "0";
		rootElement.style.width = "100%";
		rootElement.style.height = "100%";
		rootElement.style.margin = "0px";
		J(u$1(Splitter, {
			orientation: this.props.orientation,
			initialSplit: this.props.initialSplit,
			onChange: this.props.onChange,
			onDragStart: this.props.onDragStart,
			onDragEnd: this.props.onDragEnd
		}), rootElement);
	}
};
SplitterWidget$1.defaultProps = {
	...Widget.defaultProps,
	id: "splitter-widget",
	viewId1: "",
	viewId2: "",
	orientation: "vertical",
	initialSplit: .5,
	onChange: () => {},
	onDragStart: () => {},
	onDragEnd: () => {}
};
/**
* A functional component that renders a draggable splitter line.
* It computes its position based on the provided split percentage and
* updates it during mouse drag events.
*/
function Splitter({ orientation, initialSplit, onChange, onDragStart, onDragEnd }) {
	const [split, setSplit] = d(initialSplit);
	const dragging = A(false);
	const containerRef = A(null);
	const handleDragStart = (event) => {
		dragging.current = true;
		onDragStart?.();
		document.addEventListener("mousemove", handleDragging);
		document.addEventListener("mouseup", handleDragEnd);
		event.preventDefault();
	};
	const handleDragging = (event) => {
		if (!dragging.current || !containerRef.current) return;
		const rect = containerRef.current.getBoundingClientRect();
		let newSplit;
		if (orientation === "vertical") newSplit = (event.clientX - rect.left) / rect.width;
		else newSplit = (event.clientY - rect.top) / rect.height;
		newSplit = Math.min(Math.max(newSplit, .05), .95);
		setSplit(newSplit);
		onChange?.(newSplit);
	};
	const handleDragEnd = (event) => {
		if (!dragging.current) return;
		dragging.current = false;
		onDragEnd?.();
		document.removeEventListener("mousemove", handleDragging);
		document.removeEventListener("mouseup", handleDragEnd);
	};
	return u$1("div", {
		ref: containerRef,
		style: {
			position: "absolute",
			top: 0,
			left: 0,
			right: 0,
			bottom: 0
		},
		children: u$1("div", {
			style: orientation === "vertical" ? {
				position: "absolute",
				top: 0,
				bottom: 0,
				left: `${split * 100}%`,
				width: "4px",
				cursor: "col-resize",
				background: "#ccc",
				zIndex: 10,
				pointerEvents: "auto",
				boxShadow: "inset -1px 0 0 white, inset 1px 0 0 white"
			} : {
				position: "absolute",
				left: 0,
				right: 0,
				top: `${split * 100}%`,
				height: "4px",
				cursor: "row-resize",
				background: "#ccc",
				zIndex: 10,
				pointerEvents: "auto",
				boxShadow: "inset -1px 0 0 white, inset 1px 0 0 white"
			},
			onMouseDown: handleDragStart
		})
	});
}
//#endregion
//#region node_modules/@deck.gl/widgets/dist/info-widget.js
var InfoWidget$1 = class extends Widget {
	constructor(props) {
		super(props);
		this.className = "deck-widget-info";
		this.placement = "fill";
		this.setProps(this.props);
	}
	setProps(props) {
		this.viewId = props.viewId ?? this.viewId;
		super.setProps(props);
	}
	onCreateRootElement() {
		const element = super.onCreateRootElement();
		Object.entries({
			margin: "0px",
			top: "0px",
			left: "0px",
			position: "absolute"
		}).forEach(([key, value]) => element.style.setProperty(key, value));
		return element;
	}
	onViewportChange(viewport) {
		this.viewport = viewport;
		this.updateHTML();
	}
	onHover(info) {
		if (this.props.mode === "hover" && this.props.getTooltip) {
			const tooltip = this.props.getTooltip(info, this);
			this.setProps({
				visible: tooltip !== null,
				...tooltip,
				style: {
					zIndex: "1",
					...tooltip?.style
				}
			});
		}
	}
	onClick(info) {
		if (this.props.mode === "click" && this.props.getTooltip) {
			const tooltip = this.props.getTooltip(info, this);
			this.setProps({
				visible: tooltip !== null,
				...tooltip
			});
			return tooltip !== null;
		}
		return this.props.onClick?.(this, info) || false;
	}
	onAdd({ deck, viewId }) {
		this.deck = deck;
		if (!viewId) this.viewport = deck.getViewports()[0];
		else this.viewport = deck.getViewports().find((viewport) => viewport.id === viewId);
	}
	onRenderHTML(rootElement) {
		if (!this.viewport) return;
		const [longitude, latitude] = this.props.position;
		const [x, y] = this.viewport.project([longitude, latitude]);
		const minOffset = this.props.minOffset || 0;
		const gap = 10;
		const arrowHeight = 8;
		const arrowWidth = 16;
		const isAbove = y > this.viewport.height / 2;
		const background = this.props.style && this.props.style.background || "rgba(255,255,255,0.9)";
		J(this.props.visible ? u$1("div", {
			className: "popup-container",
			style: {
				position: "absolute",
				left: 0,
				top: 0
			},
			children: [u$1("div", {
				className: "popup-content",
				style: {
					background,
					padding: "10px",
					position: "relative",
					...this.props.style
				},
				children: this.props.text
			}), u$1("div", {
				className: "popup-arrow",
				style: {
					position: "absolute",
					width: "0px",
					height: "0px"
				}
			})]
		}) : null, rootElement);
		requestAnimationFrame(() => {
			if (!this.props.visible || !rootElement.firstChild || !this.viewport) return;
			const container = rootElement.firstChild;
			const contentEl = container.querySelector(".popup-content");
			const arrowEl = container.querySelector(".popup-arrow");
			if (!contentEl || !arrowEl) return;
			const contentRect = contentEl.getBoundingClientRect();
			const popupWidth = contentRect.width;
			const popupHeight = contentRect.height;
			let computedLeft = x - popupWidth / 2;
			let computedTop;
			if (isAbove) computedTop = y - gap - arrowHeight - popupHeight;
			else computedTop = y + gap + arrowHeight;
			if (computedLeft < minOffset) computedLeft = minOffset;
			if (computedLeft + popupWidth > this.viewport.width - minOffset) computedLeft = this.viewport.width - minOffset - popupWidth;
			if (isAbove) {
				if (computedTop < minOffset) computedTop = minOffset;
			} else if (computedTop + popupHeight + arrowHeight > this.viewport.height - minOffset) computedTop = this.viewport.height - minOffset - popupHeight - arrowHeight;
			container.style.left = `${computedLeft}px`;
			container.style.top = `${computedTop}px`;
			container.style.transform = "";
			let arrowLeft = x - computedLeft - arrowWidth / 2;
			arrowLeft = Math.max(arrowLeft, 0);
			arrowLeft = Math.min(arrowLeft, popupWidth - arrowWidth);
			if (isAbove) {
				arrowEl.style.left = `${arrowLeft}px`;
				arrowEl.style.bottom = `-${arrowHeight}px`;
				arrowEl.style.top = "";
				arrowEl.style.borderLeft = `${arrowWidth / 2}px solid transparent`;
				arrowEl.style.borderRight = `${arrowWidth / 2}px solid transparent`;
				arrowEl.style.borderTop = `${arrowHeight}px solid ${background}`;
				arrowEl.style.borderBottom = "";
			} else {
				arrowEl.style.left = `${arrowLeft}px`;
				arrowEl.style.top = `-${arrowHeight}px`;
				arrowEl.style.bottom = "";
				arrowEl.style.borderLeft = `${arrowWidth / 2}px solid transparent`;
				arrowEl.style.borderRight = `${arrowWidth / 2}px solid transparent`;
				arrowEl.style.borderBottom = `${arrowHeight}px solid ${background}`;
				arrowEl.style.borderTop = "";
			}
		});
	}
};
InfoWidget$1.defaultProps = {
	...Widget.defaultProps,
	id: "info",
	position: [0, 0],
	text: "",
	visible: false,
	minOffset: 0,
	viewId: null,
	mode: "hover",
	getTooltip: void 0,
	onClick: void 0
};
//#endregion
//#region node_modules/@deck.gl/widgets/dist/lib/components/simple-menu.js
var MENU_STYLE = {
	position: "absolute",
	top: "100%",
	left: 0,
	background: "white",
	border: "1px solid #ccc",
	borderRadius: "4px",
	marginTop: "var(--menu-gap, 4px)",
	zIndex: 100
};
var MENU_ITEM_STYLE = {
	background: "white",
	border: "none",
	padding: "4px",
	cursor: "pointer",
	pointerEvents: "auto"
};
/** Renders a simple dropdown menu at an arbitrary position */
var SimpleMenu = (props) => {
	const { menuItems, onItemSelected, position, style } = props;
	return u$1("div", {
		style: {
			...MENU_STYLE,
			...style,
			left: `${position.x}px`,
			top: `${position.y}px`
		},
		children: menuItems.map(({ key, label }) => u$1("button", {
			style: {
				...MENU_ITEM_STYLE,
				display: "block"
			},
			onClick: (_) => onItemSelected(key),
			children: label
		}, key))
	});
};
//#endregion
//#region node_modules/@deck.gl/widgets/dist/context-menu-widget.js
/** The standard, modern way is to use event.button === 2, where button is the standardized property (0 = left, 1 = middle, 2 = right). */
var MOUSE_BUTTON_RIGHT = 2;
/** A name for the legacy MouseEvent.which value that corresponds to the right-mouse button. In older browsers, the check is: if (event.which === 3) */
var MOUSE_WHICH_RIGHT = 3;
var ContextMenuWidget$1 = class extends Widget {
	constructor(props) {
		super(props);
		this.className = "deck-widget-context-menu";
		this.placement = "fill";
		this.pickInfo = null;
		this.pickInfo = null;
		this.setProps(this.props);
	}
	onAdd({ deck }) {
		const element = document.createElement("div");
		element.classList.add("deck-widget", "deck-widget-context-menu");
		Object.entries({
			margin: "0px",
			top: "0px",
			left: "0px",
			position: "absolute",
			pointerEvents: "auto"
		}).forEach(([key, value]) => element.style.setProperty(key, value));
		deck.getCanvas()?.addEventListener("click", () => this.hide());
		deck.getCanvas()?.addEventListener("contextmenu", (event) => this.handleContextMenu(event));
		return element;
	}
	onRenderHTML(rootElement) {
		const { visible, position, menuItems } = this.props;
		J(visible && menuItems.length ? u$1(SimpleMenu, {
			menuItems,
			onItemSelected: (key) => this.props.onMenuItemSelected(key, this.pickInfo),
			position,
			style: { pointerEvents: "auto" }
		}) : null, rootElement);
	}
	handleContextMenu(srcEvent) {
		if (srcEvent && (srcEvent.button === MOUSE_BUTTON_RIGHT || srcEvent.which === MOUSE_WHICH_RIGHT)) {
			this.pickInfo = this.deck?.pickObject({
				x: srcEvent.clientX,
				y: srcEvent.clientY
			}) || null;
			const menuItems = this.pickInfo && this.props.getMenuItems?.(this.pickInfo, this) || [];
			const visible = menuItems.length > 0;
			this.setProps({
				visible,
				position: {
					x: srcEvent.clientX,
					y: srcEvent.clientY
				},
				menuItems
			});
			this.updateHTML();
			srcEvent.preventDefault();
			return visible;
		}
		return false;
	}
	hide() {
		this.setProps({ visible: false });
	}
};
ContextMenuWidget$1.defaultProps = {
	...Widget.defaultProps,
	id: "context",
	viewId: null,
	visible: false,
	position: {
		x: 0,
		y: 0
	},
	getMenuItems: void 0,
	menuItems: [],
	onMenuItemSelected: (key, pickInfo) => console.log("Context menu item selected:", key, pickInfo)
};
//#endregion
//#region node_modules/@deck.gl/widgets/dist/screenshot-widget.js
/**
* A button widget that captures a screenshot of the current canvas and downloads it as a (png) file.
* @note only captures canvas contents, not HTML DOM or CSS styles
*/
var ScreenshotWidget$1 = class extends Widget {
	constructor(props = {}) {
		super(props);
		this.className = "deck-widget-screenshot";
		this.placement = "top-left";
		this.setProps(this.props);
	}
	setProps(props) {
		this.placement = props.placement ?? this.placement;
		this.viewId = props.viewId ?? this.viewId;
		super.setProps(props);
	}
	onRenderHTML(rootElement) {
		J(u$1(IconButton, {
			className: "deck-widget-camera",
			label: this.props.label,
			onClick: this.handleClick.bind(this)
		}), rootElement);
	}
	handleClick() {
		if (this.props.onCapture) {
			this.props.onCapture(this);
			return;
		}
		const dataURL = this.captureScreenToDataURL(this.props.imageFormat);
		if (dataURL) this.downloadDataURL(dataURL, this.props.filename);
	}
	/** @note only captures canvas contents, not HTML DOM or CSS styles */
	captureScreenToDataURL(imageFormat) {
		return (this.deck?.getCanvas())?.toDataURL(imageFormat);
	}
	/** Download a data URL */
	downloadDataURL(dataURL, filename) {
		const link = document.createElement("a");
		link.href = dataURL;
		link.download = filename;
		link.click();
	}
};
ScreenshotWidget$1.defaultProps = {
	...Widget.defaultProps,
	id: "screenshot",
	placement: "top-left",
	viewId: null,
	label: "Screenshot",
	filename: "screenshot.png",
	imageFormat: "image/png",
	onCapture: void 0
};
//#endregion
//#region node_modules/@deck.gl/widgets/dist/themes.js
var LightGlassTheme = {
	"--widget-margin": "12px",
	"--button-size": "28px",
	"--button-corner-radius": "8px",
	"--button-background": "rgba(255, 255, 255, 0.6)",
	"--button-stroke": "rgba(255, 255, 255, 0.3)",
	"--button-inner-stroke": "1px solid rgba(255, 255, 255, 0.6)",
	"--button-shadow": "0px 0px 8px 0px rgba(0, 0, 0, 0.25), 0px 0px 8px 0px rgba(0, 0, 0, 0.1) inset",
	"--button-backdrop-filter": "blur(4px)",
	"--button-icon-idle": "rgba(97, 97, 102, 1)",
	"--button-icon-hover": "rgba(24, 24, 26, 1)",
	"--button-text": "rgb(24, 24, 26, 1)",
	"--icon-compass-north-color": "rgb(240, 92, 68)",
	"--icon-compass-south-color": "rgb(204, 204, 204)",
	"--menu-gap": "4px",
	"--menu-background": "rgba(255, 255, 255, 0.6)",
	"--menu-backdrop-filter": "blur(4px)",
	"--menu-border": "1px solid rgba(255, 255, 255, 0.6)",
	"--menu-shadow": "0px 0px 8px 0px rgba(0, 0, 0, 0.25), 0px 0px 8px 0px rgba(0, 0, 0, 0.1) inset",
	"--menu-text": "rgb(24, 24, 26, 1)",
	"--menu-item-hover": "rgba(0, 0, 0, 0.08)"
};
var DarkGlassTheme = {
	"--widget-margin": "12px",
	"--button-size": "28px",
	"--button-corner-radius": "8px",
	"--button-background": "rgba(18, 18, 20, 0.75)",
	"--button-stroke": "rgba(18, 18, 20, 0.30)",
	"--button-inner-stroke": "1px solid rgba(18, 18, 20, 0.75)",
	"--button-shadow": "0px 0px 8px 0px rgba(0, 0, 0, 0.25), 0px 0px 8px 0px rgba(0, 0, 0, 0.1) inset",
	"--button-backdrop-filter": "blur(4px)",
	"--button-icon-idle": "rgba(158, 157, 168, 1)",
	"--button-icon-hover": "rgba(215, 214, 229, 1)",
	"--button-text": "rgb(215, 214, 229, 1)",
	"--icon-compass-north-color": "rgb(240, 92, 68)",
	"--icon-compass-south-color": "rgb(200, 199, 209)",
	"--menu-gap": "4px",
	"--menu-background": "rgba(18, 18, 20, 0.75)",
	"--menu-backdrop-filter": "blur(4px)",
	"--menu-border": "1px solid rgba(18, 18, 20, 0.75)",
	"--menu-shadow": "0px 0px 8px 0px rgba(0, 0, 0, 0.25), 0px 0px 8px 0px rgba(0, 0, 0, 0.1) inset",
	"--menu-text": "rgb(215, 214, 229, 1)",
	"--menu-item-hover": "rgba(255, 255, 255, 0.1)"
};
//#endregion
//#region node_modules/@deck.gl/widgets/dist/theme-widget.js
var ThemeWidget$1 = class extends Widget {
	constructor(props = {}) {
		super(props);
		this.className = "deck-widget-theme";
		this.placement = "top-left";
		this.themeMode = "dark";
		this.themeMode = this._getInitialThemeMode();
		this.setProps(this.props);
	}
	setProps(props) {
		const { lightModeTheme, darkModeTheme } = this.props;
		this.placement = props.placement ?? this.placement;
		this.viewId = props.viewId ?? this.viewId;
		super.setProps(props);
		switch (this.themeMode) {
			case "light":
				if (props.lightModeTheme && !deepEqual(props.lightModeTheme, lightModeTheme, 1)) this._setThemeMode("light");
				break;
			case "dark":
				if (props.darkModeTheme && !deepEqual(props.darkModeTheme, darkModeTheme, 1)) this._setThemeMode("dark");
				break;
			default: defaultLogger.warn(`Invalid theme mode ${this.themeMode}`)();
		}
	}
	onRenderHTML(rootElement) {
		const { lightModeLabel, darkModeLabel } = this.props;
		J(u$1(IconButton, {
			onClick: this._handleClick.bind(this),
			label: this.themeMode === "dark" ? darkModeLabel : lightModeLabel,
			className: this.themeMode === "dark" ? "deck-widget-moon" : "deck-widget-sun"
		}), rootElement);
	}
	onAdd() {
		this._setThemeMode(this.themeMode);
	}
	_handleClick() {
		const newThemeMode = this.themeMode === "dark" ? "light" : "dark";
		this._setThemeMode(newThemeMode);
	}
	_setThemeMode(themeMode) {
		this.themeMode = themeMode;
		const container = this.rootElement?.closest(".deck-widget-container");
		if (container) {
			const themeStyle = themeMode === "dark" ? this.props.darkModeTheme : this.props.lightModeTheme;
			applyStyles(container, themeStyle);
			const label = this.themeMode === "dark" ? this.props.darkModeLabel : this.props.lightModeLabel;
			defaultLogger.log(1, `Switched theme to ${label}`, themeStyle)();
			this.updateHTML();
		}
	}
	/** Read browser preference */
	_getInitialThemeMode() {
		const { initialThemeMode } = this.props;
		return initialThemeMode === "auto" ? window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light" : initialThemeMode;
	}
};
ThemeWidget$1.defaultProps = {
	...Widget.defaultProps,
	id: "theme",
	placement: "top-left",
	viewId: null,
	lightModeLabel: "Light Mode",
	lightModeTheme: LightGlassTheme,
	darkModeLabel: "Dark Mode",
	darkModeTheme: DarkGlassTheme,
	initialThemeMode: "auto"
};
//#endregion
//#region node_modules/@deck.gl/widgets/dist/loading-widget.js
/**
* A non-interactive widget that shows a loading spinner if any layers are loading data
*/
var LoadingWidget$1 = class extends Widget {
	constructor(props = {}) {
		super(props);
		this.className = "deck-widget-loading";
		this.placement = "top-left";
		this.loading = true;
		this.setProps(this.props);
	}
	setProps(props) {
		this.placement = props.placement ?? this.placement;
		this.viewId = props.viewId ?? this.viewId;
		super.setProps(props);
	}
	onRenderHTML(rootElement) {
		J(this.loading && u$1(IconButton, {
			className: "deck-widget-spinner",
			label: this.props.label,
			onClick: this.handleClick.bind(this)
		}), rootElement);
	}
	onRedraw({ layers }) {
		const loading = layers.some((layer) => !layer.isLoaded);
		if (loading !== this.loading) {
			this.loading = loading;
			this.updateHTML();
		}
	}
	handleClick() {}
};
LoadingWidget$1.defaultProps = {
	...Widget.defaultProps,
	id: "loading",
	placement: "top-left",
	viewId: null,
	label: "Loading layer data"
};
//#endregion
//#region node_modules/@deck.gl/react/dist/utils/use-widget.js
function useWidget(WidgetClass, props) {
	const { widgets, deck } = (0, import_react.useContext)(DeckGlContext);
	(0, import_react.useEffect)(() => {
		const internalWidgets = deck?.props.widgets;
		if (widgets?.length && internalWidgets?.length && !deepEqual(internalWidgets, widgets, 1)) defaultLogger.warn("\"widgets\" prop will be ignored because React widgets are in use.")();
		return () => {
			const index = widgets?.indexOf(widget);
			if (index && index !== -1) {
				widgets?.splice(index, 1);
				deck?.setProps({ widgets });
			}
		};
	}, []);
	const widget = (0, import_react.useMemo)(() => new WidgetClass(props), [WidgetClass]);
	widgets?.push(widget);
	widget.setProps(props);
	(0, import_react.useEffect)(() => {
		deck?.setProps({ widgets });
	}, [widgets]);
	return widget;
}
//#endregion
//#region node_modules/@deck.gl/react/dist/widgets/compass-widget.js
var CompassWidget = (props = {}) => {
	useWidget(CompassWidget$1, props);
	return null;
};
//#endregion
//#region node_modules/@deck.gl/react/dist/widgets/fullscreen-widget.js
var FullscreenWidget = (props = {}) => {
	useWidget(FullscreenWidget$1, props);
	return null;
};
//#endregion
//#region node_modules/@deck.gl/react/dist/widgets/zoom-widget.js
var ZoomWidget = (props = {}) => {
	useWidget(ZoomWidget$1, props);
	return null;
};
//#endregion
//#region node_modules/@deck.gl/react/dist/widgets/geocoder-widget.js
/**
* React wrapper for the GeocoderWidget.
*/
var GeocoderWidget = (props = {}) => {
	useWidget(GeocoderWidget$1, props);
	return null;
};
//#endregion
//#region node_modules/@deck.gl/react/dist/widgets/info-widget.js
/**
* React wrapper for the InfoWidget.
*/
var InfoWidget = (props) => {
	useWidget(InfoWidget$1, props);
	return null;
};
//#endregion
//#region node_modules/@deck.gl/react/dist/widgets/context-menu-widget.js
/**
* React wrapper for the ContextMenuWidget.
*/
var ContextMenuWidget = (props) => {
	useWidget(ContextMenuWidget$1, props);
	return null;
};
//#endregion
//#region node_modules/@deck.gl/react/dist/widgets/loading-widget.js
/**
* React wrapper for the LoadingWidget.
*/
var LoadingWidget = (props = {}) => {
	useWidget(LoadingWidget$1, props);
	return null;
};
//#endregion
//#region node_modules/@deck.gl/react/dist/widgets/reset-view-widget.js
/**
* React wrapper for the ResetViewWidget.
*/
var ResetViewWidget = (props = {}) => {
	useWidget(ResetViewWidget$1, props);
	return null;
};
//#endregion
//#region node_modules/@deck.gl/react/dist/widgets/scale-widget.js
/**
* React wrapper for the ScaleWidget.
*/
var ScaleWidget = (props = {}) => {
	useWidget(ScaleWidget$1, props);
	return null;
};
//#endregion
//#region node_modules/@deck.gl/react/dist/widgets/screenshot-widget.js
/**
* React wrapper for the ScreenshotWidget.
*/
var ScreenshotWidget = (props = {}) => {
	useWidget(ScreenshotWidget$1, props);
	return null;
};
//#endregion
//#region node_modules/@deck.gl/react/dist/widgets/splitter-widget.js
/**
* React wrapper for the SplitterWidget.
*/
var SplitterWidget = (props) => {
	useWidget(SplitterWidget$1, props);
	return null;
};
//#endregion
//#region node_modules/@deck.gl/react/dist/widgets/theme-widget.js
/**
* React wrapper for the ThemeWidget.
*/
var ThemeWidget = (props = {}) => {
	useWidget(ThemeWidget$1, props);
	return null;
};
//#endregion
export { CompassWidget, DeckGL, DeckGL as default, FullscreenWidget, ZoomWidget, ContextMenuWidget as _ContextMenuWidget, GeocoderWidget as _GeocoderWidget, InfoWidget as _InfoWidget, LoadingWidget as _LoadingWidget, ResetViewWidget as _ResetViewWidget, ScaleWidget as _ScaleWidget, ScreenshotWidget as _ScreenshotWidget, SplitterWidget as _SplitterWidget, ThemeWidget as _ThemeWidget, useWidget };

//# sourceMappingURL=@deck__gl_react.js.map