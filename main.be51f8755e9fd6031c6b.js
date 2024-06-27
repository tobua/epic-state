!function(){var e={787:function(e){function t(e,t=100,r={}){let n,i,o,a,l;if("function"!=typeof e)throw TypeError(`Expected the first parameter to be a function, got \`${typeof e}\`.`);if(t<0)throw RangeError("`wait` must not be negative.");let{immediate:s}="boolean"==typeof r?{immediate:r}:r;function c(){let t=n,r=i;return n=void 0,i=void 0,l=e.apply(t,r)}function u(){let e=Date.now()-a;e<t&&e>=0?o=setTimeout(u,t-e):(o=void 0,!s&&(l=c()))}let f=function(...e){if(n&&this!==n)throw Error("Debounced method called with different contexts.");n=this,i=e,a=Date.now();let r=s&&!o;return!o&&(o=setTimeout(u,t)),r&&(l=c()),l};return f.clear=()=>{o&&(clearTimeout(o),o=void 0)},f.flush=()=>{o&&f.trigger()},f.trigger=()=>{l=c(),f.clear()},f}e.exports.debounce=t,e.exports=t},795:function(e,t,r){"use strict";var n=r("441"),i=r("406"),o=r("953");(0,i.BA)(o.$);let a=(0,i.SB)({count:1});(0,n.sY)((0,n.tZ)(function(){return(0,n.BX)("button",{style:{outline:"none",border:"none",padding:20,background:"#FF002E",color:"white",fontSize:"200%",borderRadius:20,cursor:"pointer"},onClick:()=>{a.count+=1},children:["Increment ",a.count]})},{}))},441:function(e,t,r){"use strict";r.d(t,{BX:function(){return x},Lt:function(){return T},Th:function(){return a},sY:function(){return S},tZ:function(){return E}});var n=r("32"),i=r("957"),o=Object.defineProperty,a={context:void 0,effects:[],current:void 0},l=["a","canvas","audio","iframe","video"],s=e=>!(!n.t.includes(e)||l.includes(e))&&!0,c=["width","height","border","margin","padding","top","right","bottom","left","gap","rowGap","columnGap"],u=e=>e.startsWith("on"),f=e=>"children"!==e&&!u(e),d=(e,t)=>r=>e[r]!==t[r],p=(e,t)=>e=>!(e in t);function g(e,t={},r={}){Object.keys(t).filter(u).filter(e=>!(e in r)||d(t,r)(e)).forEach(r=>{let n=r.toLowerCase().substring(2);e.removeEventListener(n,t[r])}),Object.keys(t).filter(f).filter(p(t,r)).forEach(t=>{e[t]=""}),Object.keys(r).filter(f).filter(d(t,r)).forEach(t=>{if("ref"===t){r[t].current=e;return}if("value"===t){e.value=r[t];return}"function"==typeof e.setAttribute?"style"===t?Object.assign(e.style,function(e){let t={};for(let r in e)if(Object.hasOwn(e,r)){let n=e[r];"number"==typeof n&&function(e){return c.some(t=>e.startsWith(t))}(r)?t[r]=`${n}px`:t[r]=n}return t}(r[t])):e.setAttribute(t,r[t]):e[t]=r[t]}),Object.keys(r).filter(u).filter(d(t,r)).forEach(t=>{let n=t.toLowerCase().substring(2);e.addEventListener(n,r[t])})}function h(e){if(!e)return;let{parent:t}=e,r=500;for(;!t.native&&t.parent&&r>0;)r-=1,t=t.parent;0===r&&console.error("Ran out of tries at commitWork."),1===e.change&&e.native?t.native.appendChild(e.native):0===e.change&&e.native?g(e.native,e.previous.props,e.props):2===e.change&&!function e(t,r){t.native?(r.removeChild(t.native),t.change=void 0):t.child&&(t.change=void 0,t.child.change=2,e(t.child,r))}(e,t.native),e.afterListeners&&(e.afterListeners.forEach(t=>t.call(e.component)),e.afterListeners=[]),h(e.child),h(e.sibling)}var b=(0,i.U)("epic-jsx","blue");function y(e,t,r,n=!0){if("TEXT_ELEMENT"===e.type||!n&&"function"==typeof e.type)return t;if(e.native&&t.push(e.native),e.child){let n=y(e.child,r?t:[],r,!1);!r&&n.length&&(t.length>0?t.push(n):t.push(...n))}return!n&&e.sibling&&y(e.sibling,t,r,!1),t}function v(e){return window.requestIdleCallback?window.requestIdleCallback(e):(window.requestIdleCallback=window.requestIdleCallback||function(e,t){let r=Date.now();return setTimeout(()=>{e({didTimeout:!1,timeRemaining:()=>Math.max(0,50-(Date.now()-r))})},1),0},window.cancelIdleCallback=window.cancelIdleCallback||function(e){clearTimeout(e)},v(e))}function m(e,t,r=[]){var n;let i;let o=0,a=null===(n=t.previous)||void 0===n?void 0:n.child,l=500;for(;(o<r.length||a)&&l>0;){let n;l-=1;let s=r[o],c=(null==s?void 0:s.type)===(null==a?void 0:a.type);c&&a&&(n={type:a.type,props:(null==s?void 0:s.props)??(null==a?void 0:a.props),native:a.native,parent:t,previous:a,hooks:a.hooks,change:0}),s&&c&&!a&&(n={type:s.type,props:s.props,native:void 0,parent:t,previous:void 0,hooks:"function"==typeof s.type?a.hooks:void 0,change:1}),s&&!c&&(n={type:s.type,props:s.props,native:void 0,parent:t,previous:void 0,hooks:"function"==typeof s.type?[]:void 0,change:1}),a&&!c&&(a.change=2,e.deletions.push(a));let u=a;a&&(a=a.sibling),0===o?t.child=n:s&&(i.sibling=n),i=n,(o+=1)>r.length&&(!function e(t,r){r.change=2,t.deletions.push(r),r&&r.sibling&&e(t,r.sibling)}(e,a??u),a=void 0)}0===l&&console.error("Ran out of tries at reconcileChildren.",r)}function w(e,t){if(!t.current&&0===t.pending.length){b("Trying to process an empty queue");return}!t.current&&(t.current=t.pending.shift(),t.rendered.push(t.current));let r=!1,n=500;for(;t.current&&!r&&n>0;)n-=1,t.current=function(e,t){if(t.type instanceof Function)!function(e,t){if("function"!=typeof t.type)return;void 0===t.hooks&&(t.hooks=[]),t.hooks.length=0,a.context=e,t.afterListeners=[],t.component={id:"123",root:t,context:e,rerender:()=>(function(e,t){e.pending.push({native:t.native,props:t.props,type:t.type,previous:t,parent:t.parent})})(e,t),get refs(){return y(t,[],!0)},get refsNested(){return y(t,[],!1)},refsByTag:e=>(function e(t,r,n,i=!0){return"TEXT_ELEMENT"!==t.type&&(i||"function"!=typeof t.type)?(t.native&&t.native.tagName&&t.native.tagName.toLowerCase()===n.toLowerCase()&&r.push(t.native),!i&&t.sibling&&e(t.sibling,r,n,!1),t.child&&e(t.child,r,n,!1),r):r})(t,[],e),after(e){t.afterListeners.push(e)}},a.current=t;let r=[t.type.call(t.component,t.props)];a.current=void 0,a.context=void 0,m(e,t,r.flat())}(e,t);else{var r,n,i;r=e,(n=t).native||(n.native=function(e){let t;if(e.type)return g(t="TEXT_ELEMENT"===e.type?document.createTextNode(""):s(e.type)?document.createElementNS("http://www.w3.org/2000/svg",e.type):document.createElement(e.type),{},e.props),t}(n)),m(r,n,null===(i=n.props)||void 0===i?void 0:i.children.flat())}if(t.child)return t.child;let o=t,l=500;for(;o&&l>0;){if(l-=1,o.sibling)return o.sibling;o=o.parent}0===l&&console.error("Ran out of tries at render.")}(t,t.current),!t.current&&t.pending.length&&(t.current=t.pending.shift(),t.rendered.push(t.current)),r=1>e.timeRemaining();0===n&&console.error("Ran out of tries at process."),!t.current&&t.rendered.length&&(t.rendered.forEach(e=>{var r,n;return r=t,n=e,void(r.deletions.forEach(h),r.deletions.length=0,h(n.child),a.effects.length&&(a.effects.forEach(e=>e()),a.effects.length=0))}),t.rendered.length=0),(t.current||t.pending.length)&&v(e=>w(e,t))}((e,t)=>{for(var r in t)o(e,r,{get:t[r],enumerable:!0})})({},{createElement:()=>O,jsx:()=>E,jsxDEV:()=>j,jsxs:()=>x});function O(e,t,...r){return(null==t?void 0:t.children)&&(r=Array.isArray(t.children)?t.children:[t.children],delete t.children),r=r.filter(e=>null!=e&&!1!==e&&""!==e),{type:e,props:{...t,children:r.map(e=>{var t;return"object"==typeof e?e:{type:"TEXT_ELEMENT",props:{nodeValue:"boolean"==typeof(t=e)?"":t,children:[]}}})}}}var j=O,E=O,x=O,P=new Map,k=e=>{if(!P.has(e))return;let t=P.get(e);return(t.pending.length||t.rendered.length)&&w({timeRemaining:()=>10,didTimeout:!1},t),t},T=()=>{let e=[...P.values()];return e.forEach(e=>{(e.pending.length||e.rendered.length)&&w({timeRemaining:()=>10,didTimeout:!1},e)}),e},M=e=>{if(!e){b("Trying to unmount empty container","warning");return}for(;e.firstChild;)e.removeChild(e.firstChild);let t=k(e);t.root=void 0,t.deletions=[],t.current=void 0,t.dependencies=new Map,t.pending=[],t.rendered=[],P.delete(e)};function S(e,t){!t&&(t=document.body),P.has(t)&&M(t);let r={native:t,props:{children:[e]},previous:void 0,unmount:()=>M(t)},n={root:r,deletions:[],current:void 0,dependencies:new Map,pending:[r],rendered:[]};return P.set(t,n),n.deletions=[],v(e=>w(e,n)),n}},957:function(e,t,r){"use strict";r.d(t,{U:function(){return u}});var n=r("787"),i={black:"\x1b[30m",red:"\x1b[31m",green:"\x1b[32m",yellow:"\x1b[33m",blue:"\x1b[34m",magenta:"\x1b[35m",cyan:"\x1b[36m",white:"\x1b[37m",gray:"\x1b[90m",grey:"\x1b[90m",redBright:"\x1b[91m",greenBright:"\x1b[92m",yellowBright:"\x1b[93m",blueBright:"\x1b[94m",magentaBright:"\x1b[95m",cyanBright:"\x1b[96m",whiteBright:"\x1b[97m",darkOrange:"\x1b[38;5;208m",orange:"\x1b[38;5;214m"},o=e=>`\x1b[1m${e}\x1b[0m`,a=(e,t)=>`${i[e]}${t}\x1b[0m`,l=(e,t)=>{let r=a(t.color,o(t.name)),n=[".","!","?","\n"].includes("string"==typeof e?e.slice(-1):".")?"":".",i=t.newLine?"\n":"";if("error"===t.type){if(console.error(`${r} ${a("red",o("Error"))} ${e}${n}${i}`),"undefined"!=typeof process)process.exit(0);else throw Error(e);return}if("warning"===t.type){console.warn(`${r} ${a("darkOrange","Warning")} ${e}${n}${i}`);return}console.log(`${r} ${e}${n}${i}`)},s=new Map,c=(e,t)=>{let{count:r}=s.get(t.group),n=t.groupMessage;r<2&&(n=e),r>1&&"function"==typeof n&&(n=n(r)),s.delete(t.group),l(n,t)},u=(e,t="gray",r=!1)=>(!e&&console.error(`${a("gray",o("logua"))} ${a("red",o("Error"))} No name provided to create(name, color = 'gray', newLine = false).`),function(i,o){let a={name:e,color:t,type:o&&"string"!=typeof o?o.type:o,newLine:r};if("object"==typeof o&&Object.assign(a,o),"object"==typeof o&&o.group){s.has(o.group)?s.get(o.group).count+=1:s.set(o.group,{handler:n(c,o.timeout||50),count:1}),s.get(o.group).handler(i,a);return}l(i,a)})},32:function(e,t,r){"use strict";r.d(t,{t:function(){return n}});let n=["a","altGlyph","altGlyphDef","altGlyphItem","animate","animateColor","animateMotion","animateTransform","animation","audio","canvas","circle","clipPath","color-profile","cursor","defs","desc","discard","ellipse","feBlend","feColorMatrix","feComponentTransfer","feComposite","feConvolveMatrix","feDiffuseLighting","feDisplacementMap","feDistantLight","feDropShadow","feFlood","feFuncA","feFuncB","feFuncG","feFuncR","feGaussianBlur","feImage","feMerge","feMergeNode","feMorphology","feOffset","fePointLight","feSpecularLighting","feSpotLight","feTile","feTurbulence","filter","font","font-face","font-face-format","font-face-name","font-face-src","font-face-uri","foreignObject","g","glyph","glyphRef","handler","hkern","iframe","image","line","linearGradient","listener","marker","mask","metadata","missing-glyph","mpath","path","pattern","polygon","polyline","prefetch","radialGradient","rect","script","set","solidColor","stop","style","svg","switch","symbol","tbreak","text","textArea","textPath","title","tref","tspan","unknown","use","video","view","vkern"]},406:function(e,t,r){"use strict";r.d(t,{BA:function(){return b},SB:function(){return function e(t={},r,f){let p=!0;!a(t)&&o("Only objects can be made observable with state()","error"),!r&&Object.hasOwn(t,"parent")&&o('"parent" property is reserved on state objects to reference the parent',"warning"),!f&&Object.hasOwn(t,"root")&&o('"root" property is reserved on state objects to reference the root',"warning");let g=function(e){if(!e.plugin)return;let t=Array.isArray(e.plugin)?e.plugin:[e.plugin];return e.plugin=t.map(t=>t("initialize",e)),e.plugin}(t);!function(e){let t=l(e);Object.keys(t).length?(Object.entries(t).forEach(([t,r])=>{function i(){if(1===i.state&&y.has(i))return y.get(i);n=i;let e=r();return n=void 0,i.state=1,y.set(i,e),e}i.state=0,Object.defineProperty(e,t,{get:i,enumerable:!0,configurable:!0})}),e):e}(t);let b=P.get(t);if(b)return b;let v=k[0],m=new Set,T=(e,t=++k[0])=>{v!==t&&(v=t,m.forEach(r=>r(e,t)))},M=k[1],S=e=>(t,r)=>{let n=[...t];n[1]=[e,...n[1]],T(n,r)},R=new Map,C=(e,t)=>{if(m.size){let r=t[3](S(e));R.set(e,[t,r])}else R.set(e,[t])},L=e=>{let t=R.get(e);if(t){var r;R.delete(e),null===(r=t[1])||void 0===r||r.call(t)}},$=d(t),A=s($,{deleteProperty(e,t){let r=Reflect.get(e,t);L(t);let n=Reflect.deleteProperty(e,t);return n&&(T(["delete",[t],r]),h({type:"delete",target:e,initial:!0},t,A??f)),n},get(e,t,n){if("parent"===t)return r;if("root"===t)return f;if("plugin"===t)return;if("_plugin"===t)return g;let i=Reflect.get(e,t,n);return!p&&"function"!=typeof i&&(T(["get",[t],i]),"object"!=typeof i&&h({type:"get",target:n,initial:!0},t,n??f,i),w(f??n,t)),i},set(t,n,l,s){if("parent"===n||"root"===n||!p&&"plugin"===n)return o(`"${n}" is reserved an cannot be changed`,"warning"),!1;let d=Reflect.has(t,n),g=Reflect.get(t,n,s);if(d&&(Object.is(g,l)||P.has(l)&&Object.is(g,P.get(l))))return!0;L(n),a(l)&&(l=(0,i.o5)(l)||l);let b=l;if(l instanceof Promise)l.then(e=>{l.status="fulfilled",l.value=e,T(["resolve",[n],e])}).catch(e=>{l.status="rejected",l.reason=e,T(["reject",[n],e])});else{if(p&&"function"==typeof l&&l.requiresInitialization){let{data:t,after:r}=l(e);b=e(t,s,f??s),"function"==typeof r&&r(b)}else!j.has(l)&&c(l,E)?b=e(l,s,f??s):u(l)&&(b=l instanceof Map?function(e,t,r,n){let i={data:Array.from(t||[]),has:e=>i.data.some(t=>t[0]===e),set(e,t){let r=i.data.find(t=>t[0]===e);return r?r[1]=t:i.data.push([e,t]),i},get(e){var t;return null===(t=i.data.find(t=>t[0]===e))||void 0===t?void 0:t[1]},delete(e){let t=i.data.findIndex(t=>t[0]===e);return -1!==t&&(i.data.splice(t,1),!0)},clear(){i.data.splice(0)},get size(){return i.data.length},toJSON:()=>new Map(i.data),forEach(e){i.data.forEach(t=>{e(t[1],t[0],i)})},keys:()=>i.data.map(e=>e[0]).values(),values:()=>i.data.map(e=>e[1]).values(),entries:()=>new Map(i.data).entries(),get[Symbol.toStringTag](){return"Map"},[Symbol.iterator]:()=>i.entries()},o=e(i,r,n);return Object.defineProperties(o,{data:{enumerable:!1},size:{enumerable:!1},toJSON:{enumerable:!1}}),Object.seal(o),o}(e,l,r,f??s):function(e,t,r,n){let i={data:Array.from(new Set(t)),has:e=>-1!==i.data.indexOf(e),add(t){let r=!1;return"object"==typeof t&&null!==t&&(r=-1!==i.data.indexOf(e(t,i))),-1===i.data.indexOf(t)&&!r&&i.data.push(t),i},delete(e){let t=i.data.indexOf(e);return -1!==t&&(i.data.splice(t,1),!0)},clear(){i.data.splice(0)},get size(){return i.data.length},forEach(e){i.data.forEach(t=>{e(t,t,i)})},get[Symbol.toStringTag](){return"Set"},toJSON:()=>new Set(i.data),[Symbol.iterator]:()=>i.data[Symbol.iterator](),values:()=>i.data.values(),keys:()=>i.data.values(),entries:()=>new Set(i.data).entries()},o=e(i,r,n);return Object.defineProperties(o,{data:{enumerable:!1},size:{enumerable:!1},toJSON:{enumerable:!1}}),Object.seal(o),o}(e,l,r,f??s));let t=!E.has(b)&&j.get(b);t&&C(n,t)}return Reflect.set(t,n,b,s),!p&&(T(["set",[n],l,g]),h({type:"set",target:s,initial:!0},n,s??f,l,g),O(f??s,n)),!0}});P.set(t,A);let D=[$,(e=++k[1])=>(M!==e&&!m.size&&(M=e,R.forEach(([t])=>{let r=t[1](e);r>v&&(v=r)})),v),x,e=>(m.add(e),1===m.size&&R.forEach(([e,t],r)=>{let n=e[3](S(r));R.set(r,[e,n])}),()=>{m.delete(e),0===m.size&&R.forEach(([e,t],r)=>{t&&(t(),R.set(r,[e]))})})];return j.set(A,D),Reflect.ownKeys(t).forEach(e=>{let r=Object.getOwnPropertyDescriptor(t,e);"value"in r&&(A[e]=t[e],delete r.value,delete r.writable),Object.defineProperty($,e,r)}),p=!1,A}}});var n,i=r("593"),o=(0,r("957").U)("epic-state","red"),a=e=>"object"==typeof e&&null!==e,l=e=>{let t=Object.getOwnPropertyDescriptors(e),r={};return Object.entries(t).forEach(([e,{get:t}])=>{"function"==typeof t&&(r[e]=t)}),r},s=(e,t)=>new Proxy(e,t),c=(e,t)=>a(e)&&!t.has(e)&&(Array.isArray(e)||!(Symbol.iterator in e))&&!(e instanceof WeakMap)&&!(e instanceof WeakSet)&&!(e instanceof Error)&&!(e instanceof Number)&&!(e instanceof Date)&&!(e instanceof String)&&!(e instanceof RegExp)&&!(e instanceof ArrayBuffer),u=e=>e instanceof Map||e instanceof Set,f=e=>{switch(e.status){case"fulfilled":return e.value;case"rejected":throw e.reason;default:throw e}},d=e=>Array.isArray(e)?[]:Object.create(Object.getPrototypeOf(e)),p=new WeakMap,g=[];function h({type:e,target:t,initial:r=!1},...n){t._plugin&&t._plugin.forEach(t=>{t[e]&&t[e].call(this,...n)}),t.parent&&h({type:e,target:t.parent},...n),r&&g.forEach(t=>{t[e]&&t[e].call(this,...n)})}function b(e){return g.push(e),function(){let t=g.filter(t=>e!==t);g.splice(0,g.length,...t)}}var y=new Map,v=new Map,m=()=>void 0!==n,w=(e,t)=>{if(!m())return;!v.has(e)&&v.set(e,new Map);let r=v.get(e);r.has(t)?r.get(t).add(n):r.set(t,new Set([n]))},O=(e,t)=>{if(!v.has(e))return;let r=v.get(e);if(!!r.has(t))r.get(t).forEach(e=>{e.state=2})},j=new Map,E=new WeakSet,x=(e,t,r=f)=>{let n=p.get(e);if((null==n?void 0:n[0])===t)return n[1];let o=Array.isArray(e)?[]:Object.create(Object.getPrototypeOf(e));return(0,i.jc)(o,!0),p.set(e,[t,o]),Reflect.ownKeys(e).forEach(t=>{if(Object.getOwnPropertyDescriptor(o,t))return;let n=Reflect.get(e,t),a={value:n,enumerable:!0,configurable:!0};if(E.has(n))(0,i.jc)(n,!1);else if(n instanceof Promise)delete a.value,a.get=()=>r(n);else if(j.has(n)){let[e,t]=j.get(n);a.value=x(e,t(),r)}Object.defineProperty(o,t,a)}),Object.preventExtensions(o)},P=new WeakMap,k=[1,1]},953:function(e,t,r){"use strict";r.d(t,{$:function(){return f}});var n=r("441"),i=r("957"),o=Object.defineProperty,a=(e,t,r)=>t in e?o(e,t,{enumerable:!0,configurable:!0,writable:!0,value:r}):e[t]=r,l=(e,t,r)=>(a(e,"symbol"!=typeof t?t+"":t,r),r),s=class{constructor(){l(this,"observedProperties",new Map)}has(e,t){var r;return this.observedProperties.has(e)&&(null===(r=this.observedProperties.get(e))||void 0===r?void 0:r.has(t))||!1}get(e,t){var r;return this.has(e,t)?null===(r=this.observedProperties.get(e))||void 0===r?void 0:r.get(t):void 0}add(e,t,r){var n,i,o,a;!this.observedProperties.has(e)&&this.observedProperties.set(e,new Map),!(null===(n=this.observedProperties.get(e))||void 0===n?void 0:n.has(t))&&(null===(a=this.observedProperties.get(e))||void 0===a||a.set(t,[])),null===(o=this.observedProperties.get(e))||void 0===o||null===(i=o.get(t))||void 0===i||i.push(r)}delete(e,t){if(this.observedProperties.has(e)){let r=this.observedProperties.get(e);r.has(t)&&r.delete(t)}}clear(){this.observedProperties.clear()}},c=(0,i.U)("epic-state","red"),u=new s,f={set:(e,t,r,i)=>{if(r===i)return;let o=u.get(t,e);u.has(t,e)&&u.delete(t,e),null==o||o.forEach(e=>e()),(0,n.Lt)()},get:(e,t)=>{if(!n.Th.current)return;let{component:r}=n.Th.current;if(!r||!r.rerender){c("Cannot rerender epic-jsx component","warning");return}if(u.has(t,e)){let n=u.get(t,e);null==n||n.push(r.rerender)}else u.add(t,e,r.rerender)}}},593:function(e,t,r){"use strict";r.d(t,{jc:function(){return y},o5:function(){return b}});let n=Symbol(),i=Symbol(),o=(e,t)=>new Proxy(e,t),a=Object.getPrototypeOf,l=new WeakMap,s=e=>e&&(l.has(e)?l.get(e):a(e)===Object.prototype||a(e)===Array.prototype),c=e=>"object"==typeof e&&null!==e,u=e=>Object.values(Object.getOwnPropertyDescriptors(e)).some(e=>!e.configurable&&!e.writable),f=e=>{if(Array.isArray(e))return Array.from(e);let t=Object.getOwnPropertyDescriptors(e);return Object.values(t).forEach(e=>{e.configurable=!0}),Object.create(a(e),t)},d=(e,t)=>{let r={f:t},o=!1,a=(t,n)=>{if(!o){let i=r.a.get(e);if(!i&&(i={},r.a.set(e,i)),"w"===t)i.w=!0;else{let e=i[t];!e&&(e=new Set,i[t]=e),e.add(n)}}},l=()=>{o=!0,r.a.delete(e)},s={get:(t,n)=>n===i?e:(a("k",n),g(Reflect.get(t,n),r.a,r.c,r.t)),has:(e,t)=>t===n?(l(),!0):(a("h",t),Reflect.has(e,t)),getOwnPropertyDescriptor:(e,t)=>(a("o",t),Reflect.getOwnPropertyDescriptor(e,t)),ownKeys:e=>(a("w"),Reflect.ownKeys(e))};return t&&(s.set=s.deleteProperty=()=>!1),[s,r]},p=e=>e[i]||e,g=(e,t,r,n)=>{if(!s(e))return e;let i=n&&n.get(e);if(!i){let t=p(e);i=u(t)?[t,f(t)]:[t],null==n||n.set(e,i)}let[a,l]=i,c=r&&r.get(a);return(!c||!!l!==c[1].f)&&((c=d(a,!!l))[1].p=o(l||a,c[0]),r&&r.set(a,c)),c[1].a=t,c[1].c=r,c[1].t=n,c[1].p},h=(e,t)=>{let r=Reflect.ownKeys(e),n=Reflect.ownKeys(t);return r.length!==n.length||r.some((e,t)=>e!==n[t])},b=e=>s(e)&&e[i]||null,y=(e,t=!0)=>{l.set(e,t)}}},t={};function r(n){var i=t[n];if(void 0!==i)return i.exports;var o=t[n]={exports:{}};return e[n](o,o.exports,r),o.exports}r.d=function(e,t){for(var n in t)r.o(t,n)&&!r.o(e,n)&&Object.defineProperty(e,n,{enumerable:!0,get:t[n]})},r.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},r("795")}();