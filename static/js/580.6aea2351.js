(self.webpackChunkdemo_epic=self.webpackChunkdemo_epic||[]).push([["580"],{975:function(e,t,n){"use strict";n.d(t,{q2:()=>d});let r=n.p+"static/image/github.df059a84.png";var i=n(570);function o({title:e}){return"string"==typeof e?(0,i.tZ)("h1",{children:e}):e}window.innerWidth;var l={fontFamily:"sans-serif",maxWidth:window.innerWidth<750?"95vw":"75vw",margin:"0 auto"},a={display:"flex"},s={display:"flex",flex:1,justifyContent:"flex-end",alignItems:"center",flexWrap:"wrap"},c=e=>({width:30,height:30,marginLeft:10*!e,display:"block"});function d({title:e="Demo",npm:t,github:n,icons:d,children:p}){return(0,i.BX)("div",{style:l,children:[(0,i.BX)("header",{style:a,children:[(0,i.tZ)(o,{title:e}),(0,i.BX)("nav",{style:s,children:[d,t&&(0,i.tZ)("a",{href:`https://npmjs.com/${t}`,children:(0,i.tZ)("img",{alt:"npm Link",style:c(!0),src:"data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPHN2ZyB2ZXJzaW9uPSIxLjEiIGlkPSJucG0iIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCIgeT0iMHB4IgoJIHZpZXdCb3g9IjAgMCA3ODAgMjUwIiBzdHlsZT0iZW5hYmxlLWJhY2tncm91bmQ6bmV3IDAgMCA3ODAgMjUwOyIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSI+CjxzdHlsZSB0eXBlPSJ0ZXh0L2NzcyI+Cgkuc3Qwe2ZpbGw6I0MxMjEyNzt9Cjwvc3R5bGU+CjxwYXRoIGNsYXNzPSJzdDAiIGQ9Ik0yNDAsMjUwaDEwMHYtNTBoMTAwVjBIMjQwVjI1MHogTTM0MCw1MGg1MHYxMDBoLTUwVjUweiBNNDgwLDB2MjAwaDEwMFY1MGg1MHYxNTBoNTBWNTBoNTB2MTUwaDUwVjBINDgwegoJIE0wLDIwMGgxMDBWNTBoNTB2MTUwaDUwVjBIMFYyMDB6Ii8+Cjwvc3ZnPgo="})}),n&&(0,i.tZ)("a",{href:`https://github.com/${n}`,children:(0,i.tZ)("img",{alt:"github Link",style:c(!1),src:r})})]})]}),p]})}},386:function(e){function t(e,n=100,r={}){let i,o,l,a,s;if("function"!=typeof e)throw TypeError(`Expected the first parameter to be a function, got \`${typeof e}\`.`);if(n<0)throw RangeError("`wait` must not be negative.");let{immediate:c}="boolean"==typeof r?{immediate:r}:r;function d(){let t=i,n=o;return i=void 0,o=void 0,s=e.apply(t,n)}function p(){let e=Date.now()-a;e<n&&e>=0?l=setTimeout(p,n-e):(l=void 0,c||(s=d()))}let u=function(...e){if(i&&this!==i&&Object.getPrototypeOf(this)===Object.getPrototypeOf(i))throw Error("Debounced method called with different contexts of the same prototype.");i=this,o=e,a=Date.now();let t=c&&!l;return l||(l=setTimeout(p,n)),t&&(s=d()),s};return Object.defineProperty(u,"isPending",{get:()=>void 0!==l}),u.clear=()=>{l&&(clearTimeout(l),l=void 0)},u.flush=()=>{l&&u.trigger()},u.trigger=()=>{s=d(),u.clear()},u}e.exports.debounce=t,e.exports=t},518:function(e,t,n){"use strict";n.d(t,{Th:()=>x,sY:()=>B,HY:()=>k,Lt:()=>T});let r=(0,n(509).U)("epic-jsx","blue");function i(e){return window.requestIdleCallback?window.requestIdleCallback(e):(window.requestIdleCallback=window.requestIdleCallback||function(e,t){let n=Date.now();return setTimeout(()=>{e({didTimeout:!1,timeRemaining:()=>Math.max(0,50-(Date.now()-n))})},1),0},window.cancelIdleCallback=window.cancelIdleCallback||function(e){clearTimeout(e)},i(e))}let o=["accentHeight","alignmentBaseline","arabicForm","baselineShift","clipPath","clipRule","colorInterpolation","colorInterpolationFilters","colorProfile","colorRendering","dominantBaseline","enableBackground","fillOpacity","fillRule","floodColor","floodOpacity","fontFamily","fontSize","fontSizeAdjust","fontStretch","fontStyle","fontVariant","fontWeight","glyphOrientationHorizontal","glyphOrientationVertical","imageRendering","letterSpacing","lightingColor","markerEnd","markerMid","markerStart","paintOrder","pointerEvents","shapeRendering","stopColor","stopOpacity","strokeDasharray","strokeDashoffset","strokeLinecap","strokeLinejoin","strokeMiterlimit","strokeOpacity","strokeWidth","textAnchor","textDecoration","textRendering","unicodeBidi","wordSpacing","writingMode"],l=["width","height","minWidth","maxWidth","minHeight","maxHeight","border","margin","padding","top","right","bottom","left","gap","rowGap","columnGap"];var a,s=((a={})[a.Update=0]="Update",a[a.Add=1]="Add",a[a.Delete=2]="Delete",a);let c=e=>e.startsWith("on"),d=e=>"children"!==e&&!c(e),p=(e,t)=>n=>e[n]!==t[n],u=(e,t)=>e=>!(e in t),g=new Map;function f(e){let t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{},n=arguments.length>2&&void 0!==arguments[2]?arguments[2]:{};Object.keys(t).filter(c).filter(e=>!(e in n)||p(t,n)(e)).forEach(t=>{var n;let r=t.toLowerCase().substring(2),i=null==(n=g.get(e))?void 0:n.get(r);i&&e.removeEventListener(r,i)}),Object.keys(t).filter(d).filter(u(t,n)).forEach(t=>{e[t]=""}),Object.keys(n).filter(d).filter(p(t,n)).forEach(t=>{if("ref"===t&&"object"==typeof n[t]){n[t].current=e;return}if("ref"!==t||"string"!=typeof n[t]){if("value"===t){e.value=n[t];return}"function"==typeof e.setAttribute?"style"===t?Object.assign(e.style,function(e){let t={};for(let n in e)if(Object.hasOwn(e,n)){let r=e[n];"number"==typeof r&&function(e){return l.some(t=>e.startsWith(t))}(n)?t[n]=`${r}px`:t[n]=r}return t}(n[t])):e.setAttribute(t,n[t]):e[t]=n[t]}}),Object.keys(n).filter(c).filter(p(t,n)).forEach(t=>{var r;let i=t.toLowerCase().substring(2);e.addEventListener(i,n[t]),g.has(e)||g.set(e,new Map),null==(r=g.get(e))||r.set(i,n[t])})}function h(e,t){var n,i,o,l,a,c,d;if(!e)return;(null==(n=e.component)?void 0:n.root)&&(t=null==(i=e.component)?void 0:i.root.component);let p=function(e){let t=e.parent,n=500;for(;!(null==t?void 0:t.native)&&(null==t?void 0:t.parent)&&n>0;)n-=1,t=t.parent;return 0===n&&r("Ran out of tries finding native parent.","warning"),t}(e);e.change===s.Add&&e.native?null==p||null==(o=p.native)||o.appendChild(e.native):e.change===s.Update&&e.native?f(e.native,null==(l=e.previous)?void 0:l.props,e.props):e.change===s.Delete&&p&&(e.native&&g.has(e.native)&&g.delete(e.native),p.native&&function e(t,n){if(t.native){try{n.isConnected&&t.native.isConnected?n.removeChild(t.native):t.native.isConnected?r("Trying to remove a node from a parent that's no longer in the DOM","warning"):r("Trying to remove a node that's no longer in the DOM","warning")}catch(e){r("Failed to remove node from the DOM","warning")}t.change=void 0}else t.child&&(t.change=void 0,t.child.change=s.Delete,e(t.child,n))}(e,p.native)),a=t,(null==(c=e.props)?void 0:c.id)&&e.native&&a&&a.ref.addRef(e.props.id,{tag:e.native.tagName.toLowerCase(),native:e.native}),(null==(d=e.props)?void 0:d.ref)&&e.native&&a&&a.ref.addRef(e.props.ref,{tag:e.native.tagName.toLowerCase(),native:e.native}),e.child&&h(e.child,t),e.sibling&&h(e.sibling,t)}function m(e,t){var n;let i,o=arguments.length>2&&void 0!==arguments[2]?arguments[2]:[],l=0,a=null==(n=t.previous)?void 0:n.child,c=500;for(;(l<o.length||a)&&c>0;){let n;c-=1;let r=o[l],d=null!==r&&null!==a&&(null==r?void 0:r.type)===(null==a?void 0:a.type);a&&!d&&function e(t,n){n.change!==s.Delete&&(n.change=s.Delete,t.deletions.push(n),n.child&&e(t,n.child),n.sibling&&e(t,n.sibling))}(e,a),d&&a?n=v(t,a,r):r&&(n=y(t,r,a));let p=a;a&&(a=a.sibling),0===l?t.child=n:r&&i&&(i.sibling=n),i=n,(l+=1)>o.length&&(!function e(t,n){n&&(n.change=s.Delete,t.deletions.push(n),(null==n?void 0:n.sibling)&&e(t,n.sibling))}(e,a??p),a=void 0)}0===c&&r("Ran out of tries at reconcileChildren.","warning")}let v=(e,t,n)=>({type:t.type,props:null==n?void 0:n.props,native:t.native,parent:e,previous:t,hooks:t.hooks,svg:t.svg||"svg"===t.type,change:s.Update}),y=(e,t,n)=>({type:t.type,props:t.props,native:void 0,parent:e,previous:void 0,hooks:"function"==typeof t.type?n?n.hooks:[]:void 0,svg:e.svg||"svg"===t.type,change:s.Add});function w(e,t){if(!t.current&&0===t.pending.length)return void r("Trying to process an empty queue");!t.current&&(t.current=t.pending.shift(),t.current&&t.rendered.push(t.current)),t.afterListeners=[];let n=!1,l=5e3;for(;t.current&&!n&&l>0;)l-=1,t.current=function(e,t){if(t.type instanceof Function)!function(e,t){let n;if("function"!=typeof t.type)return;void 0===t.hooks&&(t.hooks=[]);let i=!t.id;if(t.hooks.length=0,x.context=e,!t.id){var o;t.id=(null==(o=t.previous)?void 0:o.id)??Math.floor(1e6*Math.random())}t.component={id:t.id,root:t,context:e,rerender:()=>{t.sibling=void 0,t.previous=t,e.pending.push(t)},ref:function(){let e=new Map,t=[];return new Proxy({byTag:e=>t.filter(t=>t.tag===e),addRef:(n,r)=>{e.set(n,r),t.push(r)},clear:()=>{e.clear(),t.length=0},hasRef:t=>e.has(t)},{get:(n,i)=>i in n?n[i]:e.has(i)?e.get(i):"size"===i?t.length:(r(`Attempted to access unregistered ref with id="${i}"`,"warning"),{tag:"div",native:document.createElement("div")})})}(),each(n){e.afterListeners.push(()=>n.call(t.component))},once(n){i&&e.afterListeners.push(()=>n.call(t.component))},after(n){r("this.after() lifecycle is deprecated, use this.once() or this.each()","warning"),i&&e.afterListeners.push(()=>n.call(t.component))},plugin(e){for(let t of e)if(t)throw n=t,Error("plugin")},state:void 0},x.current=t,Array.isArray(t.props.children)&&0===t.props.children.length&&delete t.props.children;let l=[];try{l=[t.type.call(t.component,t.props)]}catch(e){"plugin"===e.message&&n&&(l=[n])}x.current=void 0,x.context=void 0,m(e,t,l.flat())}(e,t);else{var n;t.native||(t.native=function(e){let t;if(e.type)return Object.hasOwn(e.props,"className")&&(Object.hasOwn(e.props,"class")?e.props.class=`${e.props.class} ${e.props.className}`:e.props.class=e.props.className,e.props.className=void 0),"TEXT_ELEMENT"===e.type?t=document.createTextNode(""):e.svg?(!function(e){for(let t in e)o.includes(t)&&(e[t.replace(/([a-z])([A-Z])/g,"$1-$2").toLowerCase()]=e[t],delete e[t])}(e.props),t=document.createElementNS("http://www.w3.org/2000/svg",e.type)):t=document.createElement(e.type),f(t,{},e.props),t}(t)),m(e,t,null==(n=t.props)?void 0:n.children.flat())}if(t.child)return t.child;let i=t,l=500;for(;i&&l>0;){if(l-=1,i.sibling)return i.sibling;i=i.parent}0===l&&r("Ran out of tries at render.","warning")}(t,t.current),!t.current&&t.pending.length>0&&(t.current=t.pending.shift(),t.current&&t.rendered.push(t.current)),n=1>e.timeRemaining();if(0===l&&r("Ran out of tries at process.","warning"),!t.current&&t.rendered.length>0){for(let e of t.rendered){for(let e of t.deletions)h(e);if(t.deletions.length=0,e.child&&h(e.child),x.effects.length>0){for(let e of x.effects)e();x.effects.length=0}}if(t.afterListeners){for(let e of t.afterListeners)e.call(null);t.afterListeners=[]}t.rendered.length=0}(t.current||t.pending.length>0)&&i(e=>w(e,t))}let b=e=>w({timeRemaining:()=>99999,didTimeout:!1},e),x={context:void 0,effects:[],current:void 0},M=new Map,k=void 0,j=function(){let e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:document.body;if(!M.has(e))return;let t=M.get(e);return t&&(t.pending.length>0||t.rendered.length>0)&&b(t),t},T=()=>{let e=[...M.values()];for(let t of e)(t.pending.length>0||t.rendered.length>0)&&b(t);return e},L=e=>{if(!e)return void r("Trying to unmount empty container","warning");e.innerHTML="",j(e)&&M.delete(e)};function B(e,t){t||(t=document.body),M.has(t)?L(t):t.innerHTML="";let n={native:t,props:{children:[e]},previous:void 0,unmount:()=>L(t)},r={root:n,deletions:[],current:void 0,dependencies:new Map,pending:[n],rendered:[],afterListeners:[]};return M.set(t,r),r.deletions=[],i(e=>w(e,r)),r}},570:function(e,t,n){"use strict";function r(e,t){for(var n=arguments.length,r=Array(n>2?n-2:0),i=2;i<n;i++)r[i-2]=arguments[i];let o=r;return(null==t?void 0:t.children)&&(o=Array.isArray(t.children)?t.children:[t.children],t.children=void 0),Array.isArray(r[0])&&1===r[0].length&&"string"==typeof r[0][0]?o=r[0]:Array.isArray(r[0])&&r[0].length>1&&(o=r[0]),{type:e,props:{...t,children:o.filter(e=>null!=e&&!1!==e&&""!==e).map(e=>"object"==typeof e?e:{type:"TEXT_ELEMENT",props:{nodeValue:"boolean"==typeof e?"":e,children:[]}})}}}n.d(t,{BX:()=>o,tZ:()=>i});let i=r,o=r},412:function(e,t,n){"use strict";function r(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}n.d(t,{_:()=>r})},509:function(e,t,n){"use strict";n.d(t,{U:()=>d});var r=n(386),i={black:"\x1b[30m",red:"\x1b[31m",green:"\x1b[32m",yellow:"\x1b[33m",blue:"\x1b[34m",magenta:"\x1b[35m",cyan:"\x1b[36m",white:"\x1b[37m",gray:"\x1b[90m",grey:"\x1b[90m",redBright:"\x1b[91m",greenBright:"\x1b[92m",yellowBright:"\x1b[93m",blueBright:"\x1b[94m",magentaBright:"\x1b[95m",cyanBright:"\x1b[96m",whiteBright:"\x1b[97m",darkOrange:"\x1b[38;5;208m",orange:"\x1b[38;5;214m"},o=e=>`\x1b[1m${e}\x1b[0m`,l=(e,t)=>`${i[e]}${t}\x1b[0m`,a=(e,t)=>{let n=l(t.color,o(t.name)),r=[".","!","?","\n"].includes("string"==typeof e?e.slice(-1):".")?"":".",i=t.newLine?"\n":"";if("error"===t.type){if(console.error(`${n} ${l("red",o("Error"))} ${e}${r}${i}`),"undefined"!=typeof process)process.exit(0);else throw Error(e);return}if("warning"===t.type)return void console.warn(`${n} ${l("darkOrange","Warning")} ${e}${r}${i}`);console.log(`${n} ${e}${r}${i}`)},s=new Map,c=(e,t)=>{let{count:n}=s.get(t.group),r=t.groupMessage;n<2&&(r=e),n>1&&"function"==typeof r&&(r=r(n)),s.delete(t.group),a(r,t)},d=(e,t="gray",n=!1)=>(e||console.error(`${l("gray",o("logua"))} ${l("red",o("Error"))} No name provided to create(name, color = 'gray', newLine = false).`),function(i,o){let l={name:e,color:t,type:o&&"string"!=typeof o?o.type:o,newLine:n};if("object"==typeof o&&Object.assign(l,o),"object"==typeof o&&o.group){s.has(o.group)?s.get(o.group).count+=1:s.set(o.group,{handler:r(c,o.timeout||50),count:1}),s.get(o.group).handler(i,l);return}a(i,l)})}}]);