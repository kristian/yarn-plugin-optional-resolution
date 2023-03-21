/* eslint-disable */
//prettier-ignore
module.exports = {
name: "@yarnpkg/plugin-optional-resolution",
factory: function (require) {
var plugin=(()=>{var f=Object.defineProperty;var D=Object.getOwnPropertyDescriptor;var O=Object.getOwnPropertyNames;var W=Object.prototype.hasOwnProperty;var m=(e=>typeof require<"u"?require:typeof Proxy<"u"?new Proxy(e,{get:(t,o)=>(typeof require<"u"?require:t)[o]}):e)(function(e){if(typeof require<"u")return require.apply(this,arguments);throw new Error('Dynamic require of "'+e+'" is not supported')});var C=(e,t)=>{for(var o in t)f(e,o,{get:t[o],enumerable:!0})},j=(e,t,o,n)=>{if(t&&typeof t=="object"||typeof t=="function")for(let s of O(t))!W.call(e,s)&&s!==o&&f(e,s,{get:()=>t[s],enumerable:!(n=D(t,s))||n.enumerable});return e};var A=e=>j(f({},"__esModule",{value:!0}),e);var x={};C(x,{default:()=>U,dummyPkgDist:()=>l,isDummyPkg:()=>k});var H=m("@yarnpkg/core"),d=m("semver");var y=e=>{var n,s;let t=Array.from(e.manifest.getForScope("dependencies").values()),o=new Map;for(let[i,c]of(n=e.manifest.dependenciesMeta)==null?void 0:n.entries())if((s=c.get(null))!=null&&s.optional){let r=H.structUtils.parseIdent(i);o.set(i,t.find(a=>a.scope===r.scope&&a.name===r.name).range)}return o},p,I={validateWorkspace:e=>{if(!p)p=new Map(Array.from(y(e).entries()).map(([t,o])=>[t,new Set([o])]));else for(let[t,o]of y(e))p.set(t,p.has(t)?new Set([o,...p.get(t)]):new Set([o]))},wrapNetworkRequest:async(e,t)=>{let o=p?void 0:process.argv.includes("--optional")||process.argv.includes("-O"),n,s,i=t.target.toString(),c=[t.configuration.get("npmRegistryServer"),...Array.from(t.configuration.get("npmScopes").values()).map(r=>r.get("npmRegistryServer"))].find(r=>r&&i.startsWith(r));if(c){i=i.substring(c.length+(c.endsWith("/")?0:1));let r=i.indexOf("?");r>-1&&(i=i.substring(0,r)),i.indexOf("/")<=-1&&(n=decodeURIComponent(i),p&&p.has(n)?s=Array.from(p.get(n)):o?s=["0.0.0"]:n=void 0)}return s?async()=>{let r=a=>Object.fromEntries(a.map(g=>[(0,d.minVersion)(g),{name:n,dist:l}]));try{let a=await e(),g=JSON.parse(a.body.toString()),S=Object.keys(g.versions),u=s.filter(v=>!(0,d.minSatisfying)(S,v));return u.length?(Object.assign(g.versions,r(u)),{body:JSON.stringify(g)}):a}catch(a){if(a.name!=="HTTPError"||a.response.statusCode!==404)throw a;let g=r(s);return{body:JSON.stringify({name:n,["dist-tags"]:{latest:`${(0,d.rsort)(Object.keys(g))[0]}`},versions:g})}}}:e}},h=I;var P=m("@yarnpkg/core");var R={beforeWorkspacePacking:async(e,t)=>{let{project:o}=e;if(!t.optionalDependencies)return;let n=!1;for(let s of e.manifest.getForScope("dependencies").values()){let i=P.structUtils.stringifyIdent(s);await o.restoreInstallState();let c=Array.from(o.storedPackages.values()).find(r=>r.identHash===s.identHash);c&&k(decodeURIComponent(c.reference))&&(n=!0,delete t.optionalDependencies[i],delete e.manifest.raw.optionalDependencies[i],e.manifest.dependencies.delete(s.identHash))}n&&(t.optionalDependencies.length||(delete t.optionalDependencies,delete e.manifest.raw.optionalDependencies),await o.configuration.triggerHook(s=>s.beforeWorkspacePacking,e,t))}},b=R;var l={shasum:"8835645b033793d09c5afb90ccee155b73b728f3",tarball:"https://registry.npmjs.org/optional-pkg/-/optional-pkg-1.0.0.tgz"},k=e=>/\/optional-pkg\/-\/optional-pkg-.*\.tgz$/.test(e),N={hooks:{...h,...b}},U=N;return A(x);})();
return plugin;
}
};