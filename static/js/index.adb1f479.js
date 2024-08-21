(()=>{"use strict";var e={253:function(e,t,r){let n;var a,i,o,l,s=r("162"),u=r("649"),d=r("412");(a=o||(o={})).Get="get",a.Set="set",a.Delete="delete";class c{has(e,t){var r;return!!(this.observedProperties.has(e)&&(null===(r=this.observedProperties.get(e))||void 0===r?void 0:r.has(t)))}get(e,t){var r;return this.has(e,t)?null===(r=this.observedProperties.get(e))||void 0===r?void 0:r.get(t):void 0}add(e,t,r){var n,a,i,o;!this.observedProperties.has(e)&&this.observedProperties.set(e,new Map),!(null===(n=this.observedProperties.get(e))||void 0===n?void 0:n.has(t))&&(null===(o=this.observedProperties.get(e))||void 0===o||o.set(t,[])),null===(i=this.observedProperties.get(e))||void 0===i||null===(a=i.get(t))||void 0===a||a.push(r)}delete(e,t){if(this.observedProperties.has(e)){let r=this.observedProperties.get(e);(null==r?void 0:r.has(t))&&r.delete(t)}}clear(){this.observedProperties.clear()}constructor(){(0,d._)(this,"observedProperties",new Map)}}let f=[];function p(e){let{type:t,target:r,initial:n=!1,...a}=e;if(r._plugin)for(let e of r._plugin){let r=e[t];r&&(e.all||a.leaf||t===o.Delete)&&r.call(e,a)}if(r.parent&&p({type:t,target:r.parent,...a}),!!n)for(let e of f){let r=e[t];r&&(e.all||a.leaf||t===o.Delete)&&r.call(e,a)}}let b=(0,r("509").U)("epic-state","red"),h=e=>"object"==typeof e&&null!==e,g=e=>{let t=Object.getOwnPropertyDescriptors(e),r={};for(let[e,{get:n}]of Object.entries(t))"function"==typeof n&&(r[e]=n);return r},v=(e,t)=>{let r=Object.getOwnPropertyDescriptor(e,t);return!!r&&"function"==typeof r.set},y=(e,t)=>new Proxy(e,t),w=(e,t)=>h(e)&&!t.has(e)&&(Array.isArray(e)||!(Symbol.iterator in e))&&!(e instanceof WeakMap)&&!(e instanceof WeakSet)&&!(e instanceof Error)&&!(e instanceof Number)&&!(e instanceof Date)&&!(e instanceof String)&&!(e instanceof RegExp)&&!(e instanceof ArrayBuffer),m=e=>e instanceof Map||e instanceof Set,O=e=>Array.isArray(e)?[]:Object.create(Object.getPrototypeOf(e));new WeakMap;let j={updates:[],scheduler:void 0},P=e=>{j.updates.unshift(e),void 0===j.scheduler&&(j.scheduler=k(x))},S={didTimeout:!1,timeRemaining:()=>99999};function k(e){if("undefined"==typeof window&&!1!==globalThis.stateDisableBatching||!0===globalThis.stateDisableBatching){e(S);return}return window.requestIdleCallback?window.requestIdleCallback(e):(window.requestIdleCallback=window.requestIdleCallback||function(e,t){let r=Date.now();return setTimeout(()=>{e({didTimeout:!1,timeRemaining:()=>Math.max(0,50-(Date.now()-r))})},1),0},window.cancelIdleCallback=window.cancelIdleCallback||function(e){clearTimeout(e)},k(e))}function x(e){if(0===j.updates.length){b("Trying to batch empty updates");return}let t=!1,r=500;for(;j.updates.length&&!t&&r>0;){r-=1;let n=j.updates.shift();n&&(p(n),j.updates=j.updates.filter(e=>e.property!==n.property||e.parent!==n.parent)),t=1>e.timeRemaining()}0===r&&console.error("Ran out of tries at process."),j.updates.length&&k(x),j.scheduler=void 0}let D=new Map;(i=l||(l={}))[i.New=0]="New",i[i.Clean=1]="Clean",i[i.Dirty=2]="Dirty";let M=new Map,R=()=>void 0!==n,T=(e,t)=>{if(!R())return;!M.has(e)&&M.set(e,new Map);let r=M.get(e);r.has(t)?r.get(t).add(n):r.set(t,new Set([n]))},C=(e,t)=>{if(!M.has(e))return;let r=M.get(e);if(!!(null==r?void 0:r.has(t)))for(let e of r.get(t))e.state=2},A=new Map,z=new WeakSet;var I=r("975");!function(e){let t="function"==typeof e?e("initialize"):e;f.push(t)}(e=>{"initialize"!==e&&b("connect plugin cannot be configured","warning");let t=new c;return{set:e=>{let{property:r,parent:n,value:a,previousValue:i}=e;if(a===i)return;let o=t.get(n,r);t.has(n,r)&&t.delete(n,r);let l=new Set;if(o)for(let e of o)!l.has(e.type)&&(e.rerender(),l.add(e.type));(0,u.Lt)()},get:e=>{let{property:r,parent:n}=e;if(!u.Th.current)return;let{component:a,type:i}=u.Th.current;if(!(null==a?void 0:a.rerender)){b("Cannot rerender epic-jsx component","warning");return}if(t.has(n,r)){let e=t.get(n,r);!(null==e?void 0:e.some(e=>e.type===i))&&(null==e||e.push({rerender:a.rerender,type:i}))}else!t.has(n,r)&&t.add(n,r,{rerender:a.rerender,type:i})},delete:()=>{}}});let N=function e(){var t,r;let a=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{},i=arguments.length>1?arguments[1]:void 0,l=arguments.length>2?arguments[2]:void 0,s=!0;!h(a)&&b("Only objects can be made observable with state()","error"),!i&&Object.hasOwn(a,"parent")&&b('"parent" property is reserved on state objects to reference the parent',"warning"),!l&&Object.hasOwn(a,"root")&&b('"root" property is reserved on state objects to reference the root',"warning"),!function(e){let t=g(e);if(!Object.keys(t).length)return;for(let[a,i]of Object.entries(t)){function r(){if(1===r.state&&D.has(r))return D.get(r);n=r;let e=i();return n=void 0,r.state=1,D.set(r,e),e}r.state=0,Object.defineProperty(e,a,{get:r,enumerable:!0,configurable:!0})};}(a);let u=[],d=O(a),c=y(d,{get(e,t,r){if("parent"===t)return i;if("root"===t)return l;if("plugin"===t)return;if("_plugin"===t)return u;if("addPlugin"===t)return e=>u.push("function"==typeof e?e("initialize",c):e);let n=Reflect.get(e,t,r);return!s&&"function"!=typeof n&&(p({type:o.Get,target:r,initial:!0,property:t,parent:r??l,leaf:"object"!=typeof n,value:n}),T(l??r,t)),n},set(t,r,n,a){if("parent"===r||"root"===r||!s&&"plugin"===r)return b(`"${r}" is reserved an cannot be changed`,"warning"),!1;let u=Reflect.get(t,r,a);if(n===u)return!0;let d=n;if(n instanceof Promise)n.then(e=>{n.status="fulfilled",n.value=e}).catch(e=>{n.status="rejected",n.reason=e});else{if(s&&"function"==typeof n&&n.requiresInitialization){let{data:t,after:r}=n(e);d=t,"function"==typeof r&&r(d)}else!A.has(n)&&w(n,z)?d=e(n,a,l??a):m(n)&&(d=n instanceof Map?function(e,t,r,n){let a={data:Array.from(t||[]),has:e=>a.data.some(t=>t[0]===e),set(e,t){let r=a.data.find(t=>t[0]===e);return r?r[1]=t:a.data.push([e,t]),a},get(e){var t;return null===(t=a.data.find(t=>t[0]===e))||void 0===t?void 0:t[1]},delete(e){let t=a.data.findIndex(t=>t[0]===e);return -1!==t&&(a.data.splice(t,1),!0)},clear(){a.data.splice(0)},get size(){return a.data.length},toJSON:()=>new Map(a.data),forEach(e){for(let t of a.data)e(t[1],t[0],a)},keys:()=>a.data.map(e=>e[0]).values(),values:()=>a.data.map(e=>e[1]).values(),entries:()=>new Map(a.data).entries(),get[Symbol.toStringTag](){return"Map"},[Symbol.iterator]:()=>a.entries()},i=e(a,r,n);return Object.defineProperties(i,{data:{enumerable:!1},size:{enumerable:!1},toJSON:{enumerable:!1}}),Object.seal(i),i}(e,n,i,l??a):function(e,t,r,n){let a={data:Array.from(new Set(t)),has:e=>-1!==a.data.indexOf(e),add(t){let r=!1;return"object"==typeof t&&null!==t&&(r=-1!==a.data.indexOf(e(t,a))),-1===a.data.indexOf(t)&&!r&&a.data.push(t),a},delete(e){let t=a.data.indexOf(e);return -1!==t&&(a.data.splice(t,1),!0)},clear(){a.data.splice(0)},get size(){return a.data.length},forEach(e){for(let t of a.data)e(t,a)},get[Symbol.toStringTag](){return"Set"},toJSON:()=>new Set(a.data),[Symbol.iterator]:()=>a.data[Symbol.iterator](),values:()=>a.data.values(),keys:()=>a.data.values(),entries:()=>new Set(a.data).entries()},i=e(a,r,n);return Object.defineProperties(i,{data:{enumerable:!1},size:{enumerable:!1},toJSON:{enumerable:!1}}),Object.seal(i),i}(e,n,i,l??a));!z.has(d)&&A.get(d)}return s||"object"!=typeof n||"object"!=typeof u||Array.isArray(n)?(void 0!==u||v(t,r)?Reflect.set(t,r,d,a):Object.defineProperty(t,r,{value:d,writable:!0,configurable:!0}),!s&&(C(l??a,r),P({type:o.Set,target:a,initial:!0,property:r,parent:a??l,value:n,previousValue:u,leaf:"object"!=typeof n})),!0):(!function(e,t){for(let r of Reflect.ownKeys(t))e[r]=t[r];for(let r of Reflect.ownKeys(e))!(r in t)&&delete e[r]}(u,n),!0)},deleteProperty(e,t){let r=Reflect.get(e,t),n=Reflect.deleteProperty(e,t);return n&&P({type:o.Delete,target:e,initial:!0,property:t,parent:c??l,previousValue:r,leaf:"object"!=typeof r}),n}}),f=[d];for(let e of(A.set(c,f),Reflect.ownKeys(a))){let t=Object.getOwnPropertyDescriptor(a,e);"value"in t&&(c[e]=a[e],delete t.value,delete t.writable),Object.defineProperty(d,e,t)}return t=c,u=(r=a.plugin)?(Array.isArray(r)?r:[r]).map(e=>e("initialize",t)):[],s=!1,c}({count:1,get double(){return 2*N.count},increment:()=>{N.count+=1}});(0,u.sY)((0,s.tZ)(I.q2,{title:"epic-state Demo",npm:"epic-state",github:"tobua/epic-state",children:(0,s.BX)("div",{style:{display:"flex",flexDirection:"column",gap:10},children:[(0,s.tZ)(function(){return(0,s.BX)("button",{type:"button",style:{outline:"none",border:"none",padding:20,background:"#FF002E",color:"white",fontSize:"200%",borderRadius:20,cursor:"pointer"},onClick:N.increment,children:["Increment ",N.count," ",N.double]})},{}),(0,s.BX)("p",{children:["Uses ",(0,s.tZ)("span",{style:{fontWeight:"bold"},children:"epic-jsx"})," for rendering."]})]})}))}},t={};function r(n){var a=t[n];if(void 0!==a)return a.exports;var i=t[n]={exports:{}};return e[n](i,i.exports,r),i.exports}r.m=e,r.d=function(e,t){for(var n in t)r.o(t,n)&&!r.o(e,n)&&Object.defineProperty(e,n,{enumerable:!0,get:t[n]})},r.g=function(){if("object"==typeof globalThis)return globalThis;try{return this||Function("return this")()}catch(e){if("object"==typeof window)return window}}(),r.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},(()=>{var e=[];r.O=function(t,n,a,i){if(n){i=i||0;for(var o=e.length;o>0&&e[o-1][2]>i;o--)e[o]=e[o-1];e[o]=[n,a,i];return}for(var l=1/0,o=0;o<e.length;o++){for(var n=e[o][0],a=e[o][1],i=e[o][2],s=!0,u=0;u<n.length;u++)(!1&i||l>=i)&&Object.keys(r.O).every(function(e){return r.O[e](n[u])})?n.splice(u--,1):(s=!1,i<l&&(l=i));if(s){e.splice(o--,1);var d=a();void 0!==d&&(t=d)}}return t}})(),r.p="/epic-state/",r.rv=function(){return"1.0.0-beta.5"},(()=>{var e={980:0};r.O.j=function(t){return 0===e[t]};var t=function(t,n){var a=n[0],i=n[1],o=n[2],l,s,u=0;if(a.some(function(t){return 0!==e[t]})){for(l in i)r.o(i,l)&&(r.m[l]=i[l]);if(o)var d=o(r)}for(t&&t(n);u<a.length;u++)s=a[u],r.o(e,s)&&e[s]&&e[s][0](),e[s]=0;return r.O(d)},n=self.webpackChunkdemo_epic=self.webpackChunkdemo_epic||[];n.forEach(t.bind(null,0)),n.push=t.bind(null,n.push.bind(n))})(),r.ruid="bundler=rspack@1.0.0-beta.5";var n=r.O(void 0,["788"],function(){return r("253")});n=r.O(n)})();