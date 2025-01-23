(()=>{"use strict";var e={253:function(e,t,r){let n;var i,a=r(162),o=r(649),l=r(412),s=((i={}).Get="get",i.Set="set",i.Delete="delete",i);class u{has(e,t){var r;return!!(this.observedProperties.has(e)&&(null===(r=this.observedProperties.get(e))||void 0===r?void 0:r.has(t)))}get(e,t){var r;return this.has(e,t)?null===(r=this.observedProperties.get(e))||void 0===r?void 0:r.get(t):void 0}add(e,t,r){var n,i,a,o;this.observedProperties.has(e)||this.observedProperties.set(e,new Map),(null===(n=this.observedProperties.get(e))||void 0===n?void 0:n.has(t))||null===(o=this.observedProperties.get(e))||void 0===o||o.set(t,[]),null===(a=this.observedProperties.get(e))||void 0===a||null===(i=a.get(t))||void 0===i||i.push(r)}delete(e,t){if(this.observedProperties.has(e)){let r=this.observedProperties.get(e);(null==r?void 0:r.has(t))&&r.delete(t)}}clear(){this.observedProperties.clear()}constructor(){(0,l._)(this,"observedProperties",new Map)}}let d=[];function c(e){let{type:t,target:r,initial:n=!1,...i}=e;if(r._plugin)for(let e of r._plugin){let r=e[t];r&&(e.all||i.leaf||t===s.Delete)&&r.call(e,i)}if(r.parent&&c({type:t,target:r.parent,...i}),n)for(let e of d){let r=e[t];r&&(e.all||i.leaf||t===s.Delete)&&r.call(e,i)}}let f=(0,r(509).U)("epic-state","red"),p=e=>"object"==typeof e&&null!==e,h=e=>{let t=Object.getOwnPropertyDescriptors(e),r={};for(let[e,{get:n}]of Object.entries(t))"function"==typeof n&&(r[e]=n);return r},b=(e,t)=>{let r=Object.getOwnPropertyDescriptor(e,t);return!!r&&"function"==typeof r.set},g=(e,t)=>new Proxy(e,t),v=(e,t)=>p(e)&&!t.has(e)&&(Array.isArray(e)||!(Symbol.iterator in e))&&!(e instanceof WeakMap)&&!(e instanceof WeakSet)&&!(e instanceof Error)&&!(e instanceof Number)&&!(e instanceof Date)&&!(e instanceof String)&&!(e instanceof RegExp)&&!(e instanceof ArrayBuffer),y=e=>e instanceof Map||e instanceof Set,w=e=>Array.isArray(e)?[]:Object.create(Object.getPrototypeOf(e));new WeakMap;let m={updates:[],scheduler:void 0},O=e=>{m.updates.unshift(e),void 0===m.scheduler&&(m.scheduler=P(S))},j={didTimeout:!1,timeRemaining:()=>99999};function P(e){if("undefined"==typeof window&&!1!==globalThis.stateDisableBatching||!0===globalThis.stateDisableBatching){e(j);return}return window.requestIdleCallback?window.requestIdleCallback(e):(window.requestIdleCallback=window.requestIdleCallback||function(e,t){let r=Date.now();return setTimeout(()=>{e({didTimeout:!1,timeRemaining:()=>Math.max(0,50-(Date.now()-r))})},1),0},window.cancelIdleCallback=window.cancelIdleCallback||function(e){clearTimeout(e)},P(e))}function S(e){if(0===m.updates.length){f("Trying to batch empty updates");return}let t=!1,r=500;for(;m.updates.length>0&&!t&&r>0;){r-=1;let n=m.updates.shift();n&&(c(n),m.updates=m.updates.filter(e=>e.property!==n.property||e.parent!==n.parent)),t=1>e.timeRemaining()}0===r&&f("Ran out of tries at process.","warning"),m.updates.length>0&&P(S),m.scheduler=void 0}let k=new Map,T=new Map,x=()=>void 0!==n,M=(e,t)=>{if(!x())return;T.has(e)||T.set(e,new Map);let r=T.get(e);r.has(t)?r.get(t).add(n):r.set(t,new Set([n]))},D=(e,t)=>{if(!T.has(e))return;let r=T.get(e);if(null==r?void 0:r.has(t))for(let e of r.get(t))e.state=2},R=new Map,C=new WeakSet,A=new Map;function z(){var e,t,r;let i=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{},a=arguments.length>1?arguments[1]:void 0,l=arguments.length>2?arguments[2]:void 0;if((null===(e=o.Th.current)||void 0===e?void 0:e.id)&&A.has(o.Th.current.id))return A.get(o.Th.current.id);let u=!0;p(i)||f("Only objects can be made observable with state()","error"),!a&&Object.hasOwn(i,"parent")&&f('"parent" property is reserved on state objects to reference the parent',"warning"),!l&&Object.hasOwn(i,"root")&&f('"root" property is reserved on state objects to reference the root',"warning"),function(e){let t=h(e);if(0!==Object.keys(t).length)for(let[i,a]of Object.entries(t)){function r(){if(1===r.state&&k.has(r))return k.get(r);n=r;let e=a();return n=void 0,r.state=1,k.set(r,e),e}r.state=0,Object.defineProperty(e,i,{get:r,enumerable:!0,configurable:!0})}}(i);let d=[],m=w(i),j=g(m,{get(e,t,r){if("parent"===t)return a;if("root"===t)return l;if("plugin"===t)return;if("_plugin"===t)return d;if("addPlugin"===t)return e=>d.push("function"==typeof e?e("initialize",j):e);let n=Reflect.get(e,t,r);return u||"function"==typeof n||(c({type:s.Get,target:r,initial:!0,property:t,parent:r??l,leaf:"object"!=typeof n,value:n}),M(l??r,t)),n},set(e,t,r,n){if("parent"===t||"root"===t||!u&&"plugin"===t)return f(`"${t}" is reserved an cannot be changed`,"warning"),!1;let i=Reflect.get(e,t,n);if(r===i)return!0;let o=r;if(r instanceof Promise)r.then(e=>{r.status="fulfilled",r.value=e}).catch(e=>{r.status="rejected",r.reason=e});else{if(u&&"function"==typeof r&&r.requiresInitialization){let{data:e,after:t}=r(z);o=e,"function"==typeof t&&t(o)}else!R.has(r)&&v(r,C)?o=z(r,n,l??n):y(r)&&(o=r instanceof Map?function(e,t,r,n){let i={data:Array.from(t||[]),has:e=>i.data.some(t=>t[0]===e),set(e,t){let r=i.data.find(t=>t[0]===e);return r?r[1]=t:i.data.push([e,t]),i},get(e){var t;return null===(t=i.data.find(t=>t[0]===e))||void 0===t?void 0:t[1]},delete(e){let t=i.data.findIndex(t=>t[0]===e);return -1!==t&&(i.data.splice(t,1),!0)},clear(){i.data.splice(0)},get size(){return i.data.length},toJSON:()=>new Map(i.data),forEach(e){for(let t of i.data)e(t[1],t[0],i)},keys:()=>i.data.map(e=>e[0]).values(),values:()=>i.data.map(e=>e[1]).values(),entries:()=>new Map(i.data).entries(),get[Symbol.toStringTag](){return"Map"},[Symbol.iterator]:()=>i.entries()},a=e(i,r,n);return Object.defineProperties(a,{data:{enumerable:!1},size:{enumerable:!1},toJSON:{enumerable:!1}}),Object.seal(a),a}(z,r,a,l??n):function(e,t,r,n){let i={data:Array.from(new Set(t)),has:e=>-1!==i.data.indexOf(e),add(t){let r=!1;return"object"==typeof t&&null!==t&&(r=-1!==i.data.indexOf(e(t,i))),-1!==i.data.indexOf(t)||r||i.data.push(t),i},delete(e){let t=i.data.indexOf(e);return -1!==t&&(i.data.splice(t,1),!0)},clear(){i.data.splice(0)},get size(){return i.data.length},forEach(e){for(let t of i.data)e(t,i)},get[Symbol.toStringTag](){return"Set"},toJSON:()=>new Set(i.data),[Symbol.iterator]:()=>i.data[Symbol.iterator](),values:()=>i.data.values(),keys:()=>i.data.values(),entries:()=>new Set(i.data).entries()},a=e(i,r,n);return Object.defineProperties(a,{data:{enumerable:!1},size:{enumerable:!1},toJSON:{enumerable:!1}}),Object.seal(a),a}(z,r,a,l??n));C.has(o)||R.get(o)}return u||"object"!=typeof r||"object"!=typeof i||Array.isArray(r)?(void 0!==i||b(e,t)?Reflect.set(e,t,o,n):Object.defineProperty(e,t,{value:o,writable:!0,configurable:!0}),u||(D(l??n,t),O({type:s.Set,target:n,initial:!0,property:t,parent:n??l,value:r,previousValue:i,leaf:"object"!=typeof r}))):!function(e,t){for(let r of Reflect.ownKeys(t))e[r]=t[r];for(let r of Reflect.ownKeys(e))r in t||delete e[r]}(i,r),!0},deleteProperty(e,t){let r=Reflect.get(e,t),n=Reflect.deleteProperty(e,t);return n&&O({type:s.Delete,target:e,initial:!0,property:t,parent:j??l,previousValue:r,leaf:"object"!=typeof r}),n}}),P=[m];for(let e of(R.set(j,P),(null===(t=o.Th.current)||void 0===t?void 0:t.id)&&A.set(o.Th.current.id,j),Reflect.ownKeys(i))){let t=Object.getOwnPropertyDescriptor(i,e);"value"in t&&(j[e]=i[e],delete t.value,delete t.writable),Object.defineProperty(m,e,t)}return d=(r=i.plugin)?(Array.isArray(r)?r:[r]).map(e=>e("initialize",j)):[],u=!1,j}var I=r(975);!function(e){let t="function"==typeof e?e("initialize"):e;d.push(t)}(e=>{"initialize"!==e&&f("connect plugin cannot be configured","warning");let t=new u;return{set:e=>{let{property:r,parent:n,value:i,previousValue:a}=e;if(i===a)return;let l=t.get(n,r);t.has(n,r)&&t.delete(n,r);let s=new Set;if(l)for(let e of l)s.has(e.type)||(e.rerender(),s.add(e.type));(0,o.Lt)()},get:e=>{let{property:r,parent:n}=e;if(!o.Th.current)return;let{component:i,type:a}=o.Th.current;if(!(null==i?void 0:i.rerender)){f("Cannot rerender epic-jsx component","warning");return}if(t.has(n,r)){let e=t.get(n,r);(null==e?void 0:e.some(e=>e.type===a))||null==e||e.push({rerender:i.rerender,type:a})}else t.has(n,r)||t.add(n,r,{rerender:i.rerender,type:a})},delete:()=>{}}});let Z=e=>{let{children:t,onClick:r}=e;return(0,a.tZ)("button",{type:"button",style:{outline:"none",border:"none",padding:20,background:"#FF002E",color:"white",fontSize:"200%",borderRadius:20,cursor:"pointer"},onClick:r,children:t})};function B(e){let{initial:t}=e;return this.state=z({count:t}),(0,a.tZ)(Z,{onClick:()=>{this.state.count+=1},children:this.state.count})}let q=z({count:1,get double(){return 2*q.count},increment:()=>{q.count+=1}});(0,o.sY)((0,a.tZ)(I.q2,{title:"epic-state Demo",npm:"epic-state",github:"tobua/epic-state",children:(0,a.BX)("div",{style:{display:"flex",flexDirection:"column",gap:10},children:[(0,a.tZ)(function(){return(0,a.BX)(o.HY,{children:[(0,a.BX)(Z,{onClick:q.increment,children:["Increment ",q.count," ",q.double]}),(0,a.tZ)("p",{children:"Shared component state"}),(0,a.tZ)(B,{initial:1}),(0,a.tZ)(B,{initial:2})]})},{}),(0,a.BX)("p",{children:["Uses ",(0,a.tZ)("span",{style:{fontWeight:"bold"},children:"epic-jsx"})," for rendering."]})]})}))}},t={};function r(n){var i=t[n];if(void 0!==i)return i.exports;var a=t[n]={exports:{}};return e[n](a,a.exports,r),a.exports}r.m=e,r.d=function(e,t){for(var n in t)r.o(t,n)&&!r.o(e,n)&&Object.defineProperty(e,n,{enumerable:!0,get:t[n]})},r.g=function(){if("object"==typeof globalThis)return globalThis;try{return this||Function("return this")()}catch(e){if("object"==typeof window)return window}}(),r.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},(()=>{var e=[];r.O=function(t,n,i,a){if(n){a=a||0;for(var o=e.length;o>0&&e[o-1][2]>a;o--)e[o]=e[o-1];e[o]=[n,i,a];return}for(var l=1/0,o=0;o<e.length;o++){for(var n=e[o][0],i=e[o][1],a=e[o][2],s=!0,u=0;u<n.length;u++)(!1&a||l>=a)&&Object.keys(r.O).every(function(e){return r.O[e](n[u])})?n.splice(u--,1):(s=!1,a<l&&(l=a));if(s){e.splice(o--,1);var d=i();void 0!==d&&(t=d)}}return t}})(),r.p="/epic-state/",r.rv=function(){return"1.2.2"},(()=>{var e={980:0};r.O.j=function(t){return 0===e[t]};var t=function(t,n){var i,a,o=n[0],l=n[1],s=n[2],u=0;if(o.some(function(t){return 0!==e[t]})){for(i in l)r.o(l,i)&&(r.m[i]=l[i]);if(s)var d=s(r)}for(t&&t(n);u<o.length;u++)a=o[u],r.o(e,a)&&e[a]&&e[a][0](),e[a]=0;return r.O(d)},n=self.webpackChunkdemo_epic=self.webpackChunkdemo_epic||[];n.forEach(t.bind(null,0)),n.push=t.bind(null,n.push.bind(n))})(),r.ruid="bundler=rspack@1.2.2";var n=r.O(void 0,["788"],function(){return r(253)});n=r.O(n)})();