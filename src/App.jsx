import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import { initializeApp, getApps } from "firebase/app";
import {
  getAuth, onAuthStateChanged,
  signInWithEmailAndPassword, signOut,
} from "firebase/auth";

/* ── Firebase init ─────────────────────────────────────────── */
const _fcfg = {
  apiKey:     import.meta.env.VITE_FIREBASE_API_KEY     || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId:  import.meta.env.VITE_FIREBASE_PROJECT_ID  || "",
};
const _fbApp = _fcfg.apiKey
  ? (getApps().length ? getApps()[0] : initializeApp(_fcfg))
  : null;
const auth = _fbApp ? getAuth(_fbApp) : null;

/* ── API client ────────────────────────────────────────────── */
const BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
async function apiFetch(path, options = {}) {
  const user  = auth?.currentUser;
  const token = user ? await user.getIdToken() : null;
  const res   = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}
const api = {
  getOrderStats:  ()      => apiFetch("/orders/stats"),
  getOrders:      ()      => apiFetch("/orders"),
  getProducts:    ()      => apiFetch("/products"),
  getRevenue:     ()      => apiFetch("/analytics/revenue"),
  getCategories:  ()      => apiFetch("/analytics/categories"),
};

/* ── Design tokens ─────────────────────────────────────────── */
const T = {
  light: {
    bg:"#F5F3EE",bgDeep:"#EDE9E1",surface:"#FFFFFF",surfaceAlt:"#FAFAF8",
    border:"rgba(0,0,0,0.07)",borderMid:"rgba(0,0,0,0.11)",borderStrong:"rgba(0,0,0,0.18)",
    text:"#1C1A16",textSub:"#5C5849",textMuted:"#9A9488",textFaint:"#C2BDB3",
    accent:"#C1440E",accentGlow:"rgba(193,68,14,0.10)",
    success:"#1A7A4A",successBg:"#E6F5ED",
    warning:"#9A5700",warningBg:"#FFF3E0",
    danger:"#B71C1C",dangerBg:"#FFEBEE",
    info:"#1565C0",infoBg:"#E3F2FD",
    neutral:"#5C5849",neutralBg:"#EEECE7",
    cs1:"#C1440E",cs2:"#1565C0",cs3:"#1A7A4A",
    cGrid:"rgba(0,0,0,0.05)",
    shadow:"0 1px 2px rgba(0,0,0,0.04),0 4px 14px rgba(0,0,0,0.07)",
    shadowHover:"0 2px 4px rgba(0,0,0,0.06),0 8px 24px rgba(0,0,0,0.11)",
    navBg:"rgba(245,243,238,0.92)",
    pie:["#C1440E","#1565C0","#1A7A4A","#9A5700","#6D3B8A","#00727A"],
  },
  dark: {
    bg:"#0D0C0A",bgDeep:"#070706",surface:"#161410",surfaceAlt:"#1E1C18",
    border:"rgba(255,255,255,0.06)",borderMid:"rgba(255,255,255,0.09)",borderStrong:"rgba(255,255,255,0.16)",
    text:"#F0EDE6",textSub:"#A8A298",textMuted:"#706A60",textFaint:"#3A3830",
    accent:"#F4622A",accentGlow:"rgba(244,98,42,0.15)",
    success:"#4CAF6E",successBg:"rgba(76,175,110,0.12)",
    warning:"#FFB74D",warningBg:"rgba(255,183,77,0.12)",
    danger:"#EF5350",dangerBg:"rgba(239,83,80,0.12)",
    info:"#64B5F6",infoBg:"rgba(100,181,246,0.12)",
    neutral:"#A8A298",neutralBg:"rgba(168,162,152,0.10)",
    cs1:"#F4622A",cs2:"#64B5F6",cs3:"#4CAF6E",
    cGrid:"rgba(255,255,255,0.04)",
    shadow:"0 1px 2px rgba(0,0,0,0.35),0 4px 14px rgba(0,0,0,0.45)",
    shadowHover:"0 2px 6px rgba(0,0,0,0.5),0 10px 28px rgba(0,0,0,0.6)",
    navBg:"rgba(13,12,10,0.92)",
    pie:["#F4622A","#64B5F6","#4CAF6E","#FFB74D","#CE93D8","#4DD0E1"],
  },
};

/* ── Mock data ─────────────────────────────────────────────── */
const ri  = (a,b) => Math.round(Math.random()*(b-a)+a);
const rf  = (a,b) => Math.random()*(b-a)+a;
const clamp = (v,a,b) => Math.max(a,Math.min(b,v));
const HOURS   = Array.from({length:24},(_,i)=>`${String(i).padStart(2,"0")}:00`);
const DAYS    = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const MONTHS  = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const CATS    = ["Electronics","Apparel","Home & Living","Beauty","Sports","Books"];
const PRODUCTS_SEED = [
  {id:1,name:"AirMax Pro V3",     cat:"Electronics",  emoji:"🎧",price:299},
  {id:2,name:"Stride Runner X",   cat:"Sports",       emoji:"👟",price:189},
  {id:3,name:"Glow Ritual Set",   cat:"Beauty",       emoji:"💄",price:94 },
  {id:4,name:"Linen Day Blazer",  cat:"Apparel",      emoji:"👗",price:218},
  {id:5,name:"Apex Mechanical",   cat:"Electronics",  emoji:"⌨️",price:165},
  {id:6,name:"Terracotta Planter",cat:"Home & Living",emoji:"🌿",price:58 },
  {id:7,name:"Zenith Smartwatch", cat:"Electronics",  emoji:"⌚",price:349},
  {id:8,name:"PowerBlock 52",     cat:"Sports",       emoji:"🏋️",price:429},
];
const CUSTOMERS = ["Priya S.","Marcus W.","Yuki T.","Aisha K.","Leon B.","Chloe R.","Raj M.","Nina P."];
const STATUSES  = ["Delivered","Processing","Shipped","Cancelled","Refunded"];
const SMETA     = {
  Delivered:{key:"success"},Processing:{key:"info"},
  Shipped:{key:"warning"},Cancelled:{key:"danger"},Refunded:{key:"neutral"},
};
const mkHourly  = () => HOURS.map((h,i)=>({h,revenue:ri(800,4800)+Math.sin(i/3.5)*600,orders:ri(12,85),visitors:ri(200,1400)}));
const mkWeekly  = () => DAYS.map(d=>({d,revenue:ri(12000,32000),returns:ri(400,2000),orders:ri(80,320)}));
const mkMonthly = () => MONTHS.map(m=>({m,revenue:ri(60000,200000),orders:ri(400,2000)}));
const mkCats    = () => CATS.map(name=>({name,value:ri(8,28),orders:ri(40,340)}));
const mkProds   = () => PRODUCTS_SEED.map(p=>({...p,sold:ri(60,680),revenue:ri(2000,24000),stock:ri(2,120),trend:rf(-20,40),rating:rf(3.5,5.0).toFixed(1)})).sort((a,b)=>b.revenue-a.revenue);
const mkOrders  = () => Array.from({length:10},(_,i)=>{
  const s=STATUSES[ri(0,STATUSES.length-1)];
  const p=PRODUCTS_SEED[ri(0,PRODUCTS_SEED.length-1)];
  return {id:`#${10200+i}`,customer:CUSTOMERS[i%CUSTOMERS.length],product:p.name,emoji:p.emoji,amount:ri(29,520),qty:ri(1,4),status:s,ago:`${ri(1,55)}m ago`};
});
const mkActivity = () => [
  {icon:"🛒",title:"New order from Priya S.",   sub:"AirMax Pro V3 · $299",        ago:"1m ago" },
  {icon:"⭐",title:"5‑star review received",     sub:"Stride Runner X",              ago:"3m ago" },
  {icon:"⚠️",title:"Low stock: Glow Ritual Set",sub:"Only 4 units left",            ago:"7m ago" },
  {icon:"🛒",title:"Order shipped — Marcus W.",  sub:"Apex Mechanical · $165",       ago:"11m ago"},
  {icon:"↩️",title:"Return requested",           sub:"Linen Day Blazer · #10186",    ago:"18m ago"},
  {icon:"💬",title:'"Best purchase ever!"',      sub:"Terracotta Planter · ⭐⭐⭐⭐⭐", ago:"24m ago"},
  {icon:"⚡",title:"Flash sale triggered",       sub:"Electronics — 20% off",        ago:"31m ago"},
  {icon:"🛒",title:"New order from Yuki T.",     sub:"Zenith Smartwatch · $349",     ago:"38m ago"},
];

/* ── Formatters ─────────────────────────────────────────────── */
const fmtD = v=>`$${Math.round(v).toLocaleString()}`;
const fmtN = v=>Math.round(v).toLocaleString();
const fmtP = v=>`${v>=0?"+":""}${v.toFixed(1)}%`;

/* ── Small components ───────────────────────────────────────── */
const LivePulse = ({t}) => {
  const [on,setOn]=useState(true);
  useEffect(()=>{const id=setInterval(()=>setOn(x=>!x),900);return()=>clearInterval(id);},[]);
  return (
    <span style={{display:"inline-flex",alignItems:"center",gap:5}}>
      <span style={{width:7,height:7,borderRadius:"50%",background:on?t.success:"transparent",border:`1.5px solid ${t.success}`,transition:"background 0.35s",boxShadow:on?`0 0 5px ${t.success}`:"none"}}/>
      <span style={{fontSize:10,fontWeight:700,color:t.success,letterSpacing:"0.07em"}}>LIVE</span>
    </span>
  );
};

const Toggle = ({dark,onToggle,t}) => (
  <button onClick={onToggle} style={{width:44,height:22,borderRadius:11,background:dark?t.accent:t.bgDeep,border:`1px solid ${t.borderMid}`,cursor:"pointer",position:"relative",transition:"background 0.28s",flexShrink:0}}>
    <span style={{position:"absolute",top:3,left:dark?23:3,width:14,height:14,borderRadius:"50%",background:dark?"#fff":t.textSub,transition:"left 0.22s",fontSize:8,display:"flex",alignItems:"center",justifyContent:"center"}}>{dark?"🌙":"☀️"}</span>
  </button>
);

const Badge = ({status,t}) => {
  const k=(SMETA[status]||{key:"neutral"}).key;
  return <span style={{background:t[`${k}Bg`],color:t[k],fontSize:10,fontWeight:700,letterSpacing:"0.06em",textTransform:"uppercase",padding:"3px 8px",borderRadius:20,border:`1px solid ${t[k]}22`,whiteSpace:"nowrap"}}>{status}</span>;
};

const TrendChip = ({val,t}) => {
  const up=val>=0;
  return <span style={{fontSize:11,fontWeight:700,color:up?t.success:t.danger,background:up?t.successBg:t.dangerBg,padding:"2px 7px",borderRadius:20,whiteSpace:"nowrap"}}>{up?"▲":"▼"} {Math.abs(val).toFixed(1)}%</span>;
};

const Card = ({children,t,style={}}) => (
  <div style={{background:t.surface,border:`1px solid ${t.border}`,borderRadius:16,boxShadow:t.shadow,overflow:"hidden",...style}}>{children}</div>
);

const CHead = ({title,sub,right,t}) => (
  <div style={{padding:"18px 20px 0",display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12}}>
    <div>
      <div style={{fontSize:13,fontWeight:700,color:t.text}}>{title}</div>
      {sub&&<div style={{fontSize:11,color:t.textMuted,marginTop:2}}>{sub}</div>}
    </div>
    {right&&<div style={{flexShrink:0}}>{right}</div>}
  </div>
);

const CBody = ({children,style={}}) => (
  <div style={{padding:"14px 20px 18px",...style}}>{children}</div>
);

const ChartTip = ({active,payload,label,t}) => {
  if(!active||!payload?.length) return null;
  return (
    <div style={{background:t.surfaceAlt,border:`1px solid ${t.borderMid}`,borderRadius:10,padding:"10px 14px",boxShadow:t.shadow,fontSize:12}}>
      <div style={{color:t.textMuted,marginBottom:5,fontWeight:600}}>{label}</div>
      {payload.map((p,i)=>(
        <div key={i} style={{display:"flex",gap:7,alignItems:"center",marginTop:2}}>
          <span style={{width:8,height:8,borderRadius:2,background:p.color,display:"inline-block"}}/>
          <span style={{color:t.textSub}}>{p.name}:</span>
          <span style={{color:t.text,fontWeight:700}}>{["revenue","Revenue"].includes(p.name)?fmtD(p.value):fmtN(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

const KPI = ({label,value,sub,subUp,icon,spark,sparkKey="revenue",t}) => (
  <Card t={t}>
    <div style={{padding:"16px 18px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
        <span style={{fontSize:10,fontWeight:700,color:t.textMuted,letterSpacing:"0.07em",textTransform:"uppercase"}}>{label}</span>
        <span style={{fontSize:17,width:32,height:32,background:t.accentGlow,borderRadius:9,display:"flex",alignItems:"center",justifyContent:"center"}}>{icon}</span>
      </div>
      <div style={{fontSize:28,fontWeight:800,color:t.text,letterSpacing:"-0.04em",lineHeight:1,fontFamily:"'Syne',sans-serif",marginBottom:5}}>{value}</div>
      {sub&&<div style={{fontSize:11,fontWeight:600,color:subUp?t.success:t.danger}}>{sub}</div>}
      {spark&&(
        <div style={{height:38,marginTop:8,marginLeft:-4,marginRight:-4}}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={spark} margin={{top:2,right:2,bottom:0,left:2}}>
              <defs>
                <linearGradient id={`sg_${label.replace(/\s/g,"")}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={t.cs1} stopOpacity={0.28}/>
                  <stop offset="100%" stopColor={t.cs1} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey={sparkKey} stroke={t.cs1} strokeWidth={2} fill={`url(#sg_${label.replace(/\s/g,"")})`} dot={false} isAnimationActive={false}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  </Card>
);

/* ── Login screen ───────────────────────────────────────────── */
const LoginScreen = ({t}) => {
  const [email,   setEmail]    = useState("");
  const [password,setPassword] = useState("");
  const [loading, setLoading]  = useState(false);
  const [error,   setError]    = useState("");

  const handleLogin = async e => {
    e.preventDefault();
    if (!auth) { setError("Firebase not configured. Check your .env file."); return; }
    setError(""); setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch(err) {
      setError(
        err.code==="auth/invalid-credential" ? "Invalid email or password." :
        err.code==="auth/too-many-requests"  ? "Too many attempts. Try later." :
        err.message || "Login failed."
      );
    } finally { setLoading(false); }
  };

  return (
    <div style={{minHeight:"100vh",background:t.bg,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Plus Jakarta Sans',system-ui,sans-serif"}}>
      <div style={{width:"100%",maxWidth:400,background:t.surface,border:`1px solid ${t.border}`,borderRadius:20,padding:"36px 32px",boxShadow:t.shadowHover}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:28}}>
          <div style={{width:34,height:34,borderRadius:9,background:t.accent,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:900,color:"#fff",fontFamily:"'Syne',sans-serif"}}>N</div>
          <div>
            <div style={{fontSize:15,fontWeight:900,color:t.text,fontFamily:"'Syne',sans-serif"}}>Nexus Commerce</div>
            <div style={{fontSize:10,color:t.textMuted,marginTop:1}}>Sign in to continue</div>
          </div>
        </div>
        {!_fcfg.apiKey && (
          <div style={{background:t.warningBg,color:t.warning,padding:"10px 12px",borderRadius:8,fontSize:12,fontWeight:600,marginBottom:16}}>
            ⚠️ Firebase API key missing. Add VITE_FIREBASE_API_KEY to your .env file.
          </div>
        )}
        <form onSubmit={handleLogin} style={{display:"flex",flexDirection:"column",gap:14}}>
          <div>
            <label style={{fontSize:11,fontWeight:700,color:t.textMuted,letterSpacing:"0.06em",textTransform:"uppercase",display:"block",marginBottom:6}}>Email</label>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" required
              style={{width:"100%",padding:"10px 13px",borderRadius:9,fontSize:13,background:t.surfaceAlt,border:`1px solid ${t.borderMid}`,color:t.text,outline:"none",fontFamily:"inherit"}}/>
          </div>
          <div>
            <label style={{fontSize:11,fontWeight:700,color:t.textMuted,letterSpacing:"0.06em",textTransform:"uppercase",display:"block",marginBottom:6}}>Password</label>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" required
              style={{width:"100%",padding:"10px 13px",borderRadius:9,fontSize:13,background:t.surfaceAlt,border:`1px solid ${t.borderMid}`,color:t.text,outline:"none",fontFamily:"inherit"}}/>
          </div>
          {error&&<div style={{background:t.dangerBg,color:t.danger,border:`1px solid ${t.danger}22`,borderRadius:8,padding:"9px 12px",fontSize:12,fontWeight:600}}>{error}</div>}
          <button type="submit" disabled={loading} style={{marginTop:4,padding:"11px",borderRadius:9,fontSize:13,fontWeight:700,background:t.accent,color:"#fff",border:"none",cursor:"pointer"}}>
            {loading?"Signing in…":"Sign In →"}
          </button>
        </form>
        <p style={{fontSize:11,color:t.textFaint,textAlign:"center",marginTop:20}}>Protected by Firebase Authentication</p>
      </div>
    </div>
  );
};

/* ── Main App ───────────────────────────────────────────────── */
export default function App() {
  const [dark, setDark] = useState(false);
  const [tab,  setTab]  = useState("overview");
  const t = dark ? T.dark : T.light;

  /* Auth */
  const [user,        setUser]        = useState(undefined);
  const [authLoading, setAuthLoading] = useState(true);

  /* KPIs */
  const [rev,  setRev]  = useState(142608);
  const [ords, setOrds] = useState(3142);
  const [vis,  setVis]  = useState(18540);
  const [conv, setConv] = useState(3.48);
  const [aov,  setAov]  = useState(89.2);
  const [ts,   setTs]   = useState(new Date());

  /* Chart data */
  const [hourly,  setHourly]  = useState(mkHourly);
  const [weekly,  setWeekly]  = useState(mkWeekly);
  const [monthly]             = useState(mkMonthly);
  const [cats,    setCats]    = useState(mkCats);
  const [prods,   setProds]   = useState(mkProds);
  const [orders,  setOrders]  = useState(mkOrders);
  const activity              = useMemo(mkActivity,[]);

  /* Toast */
  const [toast,   setToast]   = useState(null);
  const [apiErr,  setApiErr]  = useState("");
  const toastRef = useRef();

  /* Auth listener */
  useEffect(()=>{
    if (!auth) { setAuthLoading(false); return; }
    const unsub = onAuthStateChanged(auth, u=>{ setUser(u); setAuthLoading(false); });
    return ()=>unsub();
  },[]);

  /* Load real data from backend */
  const loadData = useCallback(async()=>{
    if (!user) return;
    try {
      const [stats,apiProds,apiOrds,rev7,cats7] = await Promise.all([
        api.getOrderStats(), api.getProducts(), api.getOrders(),
        api.getRevenue(),    api.getCategories(),
      ]);
      if (stats?.revenue) setRev(stats.revenue);
      if (stats?.total)   setOrds(stats.total);
      if (apiProds?.length) setProds(apiProds.map(p=>({
        id:p._id,name:p.name,cat:p.category,emoji:p.emoji||"📦",
        price:p.price||0,sold:p.sold||0,revenue:p.revenue||0,
        stock:p.stock||0,trend:p.trend||0,rating:p.rating||"—",
      })));
      if (apiOrds?.length) setOrders(apiOrds.map((o,i)=>({
        id:o._id?`#${o._id.slice(-5).toUpperCase()}`:`#${10200+i}`,
        customer:o.customer||"Unknown",product:o.product||"—",
        emoji:o.emoji||"🛒",amount:o.amount||0,qty:o.qty||1,
        status:o.status||"Processing",
        ago:o.createdAt?`${Math.round((Date.now()-new Date(o.createdAt))/60000)}m ago`:"—",
      })));
      if (rev7?.length) setWeekly(rev7.map(r=>({d:r._id||"—",revenue:r.revenue||0,orders:r.orders||0,returns:0})));
      if (cats7?.length) setCats(cats7.map(c=>({name:c._id||"Other",value:c.value||c.share||ri(8,28),orders:c.count||ri(40,340)})));
      setApiErr("");
    } catch(e) {
      setApiErr("Backend offline — showing simulated data.");
    }
  },[user]);

  useEffect(()=>{ loadData(); const id=setInterval(loadData,30000); return()=>clearInterval(id); },[loadData]);

  /* 2.5s live tick */
  useEffect(()=>{
    const id=setInterval(()=>{
      setRev(r=>r+ri(60,420)); setOrds(o=>o+ri(0,3));
      setVis(v=>v+ri(8,80)); setConv(c=>clamp(c+rf(-0.07,0.07),1.5,7));
      setAov(a=>clamp(a+rf(-1.2,1.2),40,200)); setTs(new Date());
      setHourly(d=>{const n=[...d],i=n.length-1;n[i]={...n[i],revenue:Math.max(0,n[i].revenue+ri(-60,200)),orders:Math.max(0,n[i].orders+ri(-1,4)),visitors:Math.max(0,n[i].visitors+ri(-10,60))};return n;});
      if(Math.random()<0.22){
        const p=PRODUCTS_SEED[ri(0,PRODUCTS_SEED.length-1)];
        const c=CUSTOMERS[ri(0,CUSTOMERS.length-1)];
        clearTimeout(toastRef.current);
        setToast({msg:`New order from ${c}`,sub:`${p.name} · $${p.price}`});
        toastRef.current=setTimeout(()=>setToast(null),3800);
      }
    },2500);
    return()=>clearInterval(id);
  },[]);

  const spark = useMemo(()=>hourly.slice(-16),[hourly]);
  const TT    = props=><ChartTip {...props} t={t}/>;
  const G4  = {display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14};
  const G2  = {display:"grid",gridTemplateColumns:"1fr 1fr",gap:14};
  const G21 = {display:"grid",gridTemplateColumns:"2fr 1fr",gap:14};
  const TABS = ["overview","products","orders","analytics"];

  /* Loading state */
  if (authLoading) return (
    <div style={{minHeight:"100vh",background:t.bg,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"sans-serif"}}>
      <div style={{textAlign:"center"}}>
        <div style={{width:40,height:40,borderRadius:10,background:t.accent,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,fontWeight:900,color:"#fff",margin:"0 auto 14px"}}>N</div>
        <div style={{fontSize:12,color:t.textMuted}}>Loading…</div>
      </div>
    </div>
  );

  /* Not logged in — show login OR dashboard without auth if Firebase not configured */
  if (!user) return <LoginScreen t={t}/>;

  return (
    <div style={{minHeight:"100vh",background:t.bg,fontFamily:"'Plus Jakarta Sans',system-ui,sans-serif",color:t.text,transition:"background 0.25s,color 0.25s"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:5px;height:5px}
        ::-webkit-scrollbar-thumb{background:${t.borderStrong};border-radius:4px}
        ::-webkit-scrollbar-track{background:transparent}
        .tr:hover{background:${t.surfaceAlt}!important}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        .fu{animation:fadeUp .3s ease both}
        @keyframes toastIn{0%{opacity:0;transform:translateX(14px)}10%{opacity:1;transform:none}85%{opacity:1}100%{opacity:0}}
        .toast{animation:toastIn 3.8s ease forwards}
        button{cursor:pointer;border:none;outline:none;background:transparent}
      `}</style>

      {/* NAV */}
      <nav style={{position:"sticky",top:0,zIndex:200,background:t.navBg,backdropFilter:"blur(18px) saturate(180%)",borderBottom:`1px solid ${t.border}`,height:56,display:"flex",alignItems:"center",padding:"0 26px",gap:20,justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:9,flexShrink:0}}>
          <div style={{width:28,height:28,borderRadius:7,background:t.accent,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:900,color:"#fff",fontFamily:"'Syne',sans-serif"}}>N</div>
          <span style={{fontSize:14,fontWeight:900,letterSpacing:"-0.03em",color:t.text,fontFamily:"'Syne',sans-serif"}}>Nexus</span>
          <span style={{fontSize:8,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",background:t.accent,color:"#fff",padding:"2px 5px",borderRadius:4}}>Commerce</span>
        </div>
        <div style={{display:"flex",gap:2,flex:1,justifyContent:"center"}}>
          {TABS.map(tb=>(
            <button key={tb} onClick={()=>setTab(tb)} style={{padding:"5px 13px",borderRadius:7,fontSize:12,fontWeight:600,color:tab===tb?t.accent:t.textSub,background:tab===tb?t.accentGlow:"transparent",borderBottom:tab===tb?`2px solid ${t.accent}`:"2px solid transparent",transition:"all 0.14s",textTransform:"capitalize"}}>{tb}</button>
          ))}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:12,flexShrink:0}}>
          <LivePulse t={t}/>
          <span style={{fontSize:10,color:t.textMuted}}>{ts.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit",second:"2-digit"})}</span>
          <Toggle dark={dark} onToggle={()=>setDark(d=>!d)} t={t}/>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <div style={{width:28,height:28,borderRadius:"50%",background:`linear-gradient(135deg,${t.accent},${dark?"#FF9A6C":"#8B2500"})`,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:11,fontWeight:800}}>
              {user.email?.[0]?.toUpperCase()||"U"}
            </div>
            <button onClick={()=>signOut(auth)} style={{fontSize:10,fontWeight:700,color:t.textMuted,padding:"3px 8px",borderRadius:6,border:`1px solid ${t.borderMid}`,letterSpacing:"0.04em",textTransform:"uppercase"}}>Sign out</button>
          </div>
        </div>
      </nav>

      {/* API error banner */}
      {apiErr&&<div style={{background:t.warningBg,borderBottom:`1px solid ${t.warning}33`,padding:"8px 26px",fontSize:11,color:t.warning,fontWeight:600,display:"flex",gap:8,alignItems:"center"}}>⚠️ {apiErr}<button onClick={loadData} style={{marginLeft:"auto",fontSize:10,color:t.warning,fontWeight:700,textDecoration:"underline"}}>Retry</button></div>}

      {/* Toast */}
      {toast&&<div className="toast" style={{position:"fixed",top:66,right:22,zIndex:999,background:t.surface,border:`1px solid ${t.borderMid}`,borderRadius:12,padding:"11px 14px",maxWidth:270,boxShadow:t.shadowHover,display:"flex",gap:9,alignItems:"flex-start"}}><span style={{fontSize:17}}>🛒</span><div><div style={{fontSize:12,fontWeight:700,color:t.text}}>{toast.msg}</div><div style={{fontSize:11,color:t.textMuted,marginTop:2}}>{toast.sub}</div></div><div style={{width:6,height:6,borderRadius:"50%",background:t.success,marginTop:4,flexShrink:0}}/></div>}

      <main style={{padding:"20px 26px 44px",maxWidth:1440,margin:"0 auto"}}>

        {/* OVERVIEW */}
        {tab==="overview"&&(
          <div className="fu">
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:16}}>
              <div>
                <h1 style={{fontSize:20,fontWeight:900,letterSpacing:"-0.04em",color:t.text,fontFamily:"'Syne',sans-serif"}}>Store Overview</h1>
                <p style={{fontSize:11,color:t.textMuted,marginTop:2}}>Signed in as <strong>{user.email}</strong> · Live · ticks every 2.5s</p>
              </div>
              <div style={{display:"flex",gap:6}}>
                {["today","week","month"].map(p=>(
                  <button key={p} style={{padding:"4px 10px",fontSize:10,fontWeight:700,borderRadius:6,border:`1px solid ${t.borderMid}`,letterSpacing:"0.05em",textTransform:"uppercase",color:t.textMuted}}>{p}</button>
                ))}
              </div>
            </div>
            <div style={{...G4,marginBottom:14}}>
              <KPI t={t} label="Total Revenue"   icon="💰" value={fmtD(rev)} sub="+18.4% vs yesterday" subUp spark={spark} sparkKey="revenue"/>
              <KPI t={t} label="Total Orders"    icon="🛒" value={fmtN(ords)} sub="+6.2% vs yesterday" subUp spark={spark} sparkKey="orders"/>
              <KPI t={t} label="Conversion Rate" icon="📈" value={`${conv.toFixed(2)}%`} sub={fmtP(conv-3.1)+" this week"} subUp={conv>=3.1}/>
              <KPI t={t} label="Avg Order Value" icon="🎯" value={`$${aov.toFixed(2)}`} sub="-1.8% vs last week" subUp={false}/>
            </div>
            <div style={{...G21,marginBottom:14}}>
              <Card t={t}>
                <CHead t={t} title="Hourly Revenue" sub="Live — updates in real time" right={<span style={{fontSize:20,fontWeight:900,letterSpacing:"-0.04em",color:t.accent,fontFamily:"'Syne',sans-serif"}}>{fmtD(rev)}</span>}/>
                <CBody>
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={hourly} margin={{top:4,right:4,bottom:0,left:-20}}>
                      <defs><linearGradient id="ag1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={t.cs1} stopOpacity={0.22}/><stop offset="100%" stopColor={t.cs1} stopOpacity={0}/></linearGradient></defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={t.cGrid} vertical={false}/>
                      <XAxis dataKey="h" tick={{fill:t.textFaint,fontSize:10}} axisLine={false} tickLine={false} interval={3}/>
                      <YAxis tick={{fill:t.textFaint,fontSize:10}} axisLine={false} tickLine={false} tickFormatter={v=>`$${(v/1000).toFixed(0)}k`}/>
                      <Tooltip content={TT}/>
                      <Area type="monotone" dataKey="revenue" name="revenue" stroke={t.cs1} strokeWidth={2.5} fill="url(#ag1)" dot={false} isAnimationActive={false}/>
                    </AreaChart>
                  </ResponsiveContainer>
                </CBody>
              </Card>
              <Card t={t}>
                <CHead t={t} title="Sales by Category" sub="Revenue share — this month"/>
                <CBody>
                  <ResponsiveContainer width="100%" height={138}>
                    <PieChart>
                      <Pie data={cats} dataKey="value" cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={3}>
                        {cats.map((_,i)=><Cell key={i} fill={t.pie[i%t.pie.length]}/>)}
                      </Pie>
                      <Tooltip formatter={v=>[`${v}%`,""]} contentStyle={{background:t.surfaceAlt,border:`1px solid ${t.borderMid}`,borderRadius:10,fontSize:12}}/>
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{display:"flex",flexDirection:"column",gap:5,marginTop:6}}>
                    {cats.map((c,i)=>(
                      <div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",fontSize:12}}>
                        <div style={{display:"flex",alignItems:"center",gap:6}}>
                          <span style={{width:8,height:8,borderRadius:2,background:t.pie[i%t.pie.length],display:"inline-block"}}/>
                          <span style={{color:t.textSub}}>{c.name}</span>
                        </div>
                        <span style={{fontWeight:700,color:t.text}}>{c.value}%</span>
                      </div>
                    ))}
                  </div>
                </CBody>
              </Card>
            </div>
            <div style={{...G21}}>
              <Card t={t}>
                <CHead t={t} title="Weekly Revenue vs Returns" sub="This calendar week"/>
                <CBody>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={weekly} margin={{top:4,right:4,bottom:0,left:-20}} barGap={4} barCategoryGap="30%">
                      <CartesianGrid strokeDasharray="3 3" stroke={t.cGrid} vertical={false}/>
                      <XAxis dataKey="d" tick={{fill:t.textFaint,fontSize:10}} axisLine={false} tickLine={false}/>
                      <YAxis tick={{fill:t.textFaint,fontSize:10}} axisLine={false} tickLine={false} tickFormatter={v=>`$${(v/1000).toFixed(0)}k`}/>
                      <Tooltip content={TT}/>
                      <Bar dataKey="revenue" name="Revenue" fill={t.cs2} radius={[4,4,0,0]}/>
                      <Bar dataKey="returns" name="Returns" fill={t.danger} radius={[4,4,0,0]} opacity={0.65}/>
                    </BarChart>
                  </ResponsiveContainer>
                  <div style={{display:"flex",gap:16,marginTop:8,fontSize:11,color:t.textMuted}}>
                    {[["Revenue",t.cs2],["Returns",t.danger]].map(([lbl,c])=>(
                      <span key={lbl} style={{display:"flex",alignItems:"center",gap:5}}><span style={{width:9,height:9,borderRadius:2,background:c,display:"inline-block"}}/>{lbl}</span>
                    ))}
                  </div>
                </CBody>
              </Card>
              <Card t={t}>
                <CHead t={t} title="Live Activity" sub="Real-time store events"/>
                <CBody style={{padding:"10px 14px 14px"}}>
                  {activity.map((ev,i)=>(
                    <div key={i} style={{display:"flex",gap:9,alignItems:"flex-start",padding:"7px 9px",borderRadius:9,marginBottom:1,background:i===0?t.accentGlow:"transparent"}}>
                      <span style={{fontSize:15,lineHeight:"20px",minWidth:20,textAlign:"center"}}>{ev.icon}</span>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:12,fontWeight:600,color:t.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{ev.title}</div>
                        <div style={{fontSize:11,color:t.textMuted,marginTop:1}}>{ev.sub}</div>
                      </div>
                      <span style={{fontSize:10,color:t.textFaint,whiteSpace:"nowrap",marginTop:2}}>{ev.ago}</span>
                    </div>
                  ))}
                </CBody>
              </Card>
            </div>
          </div>
        )}

        {/* PRODUCTS */}
        {tab==="products"&&(
          <div className="fu">
            <h1 style={{fontSize:20,fontWeight:900,letterSpacing:"-0.04em",color:t.text,fontFamily:"'Syne',sans-serif",marginBottom:4}}>Products</h1>
            <p style={{fontSize:11,color:t.textMuted,marginBottom:16}}>Performance · Inventory · Trends</p>
            <div style={{...G4,marginBottom:14}}>
              {[{label:"Total SKUs",val:"248",sub:"12 added this month",col:t.text},{label:"Active",val:"231",sub:"93.1% of catalogue",col:t.success},{label:"Low Stock",val:"17",sub:"Need reorder soon",col:t.warning},{label:"Out of Stock",val:"8",sub:"↑ 3 from last week",col:t.danger}].map(m=>(
                <Card key={m.label} t={t}><div style={{padding:"14px 16px"}}><div style={{fontSize:10,fontWeight:700,color:t.textMuted,letterSpacing:"0.07em",textTransform:"uppercase",marginBottom:7}}>{m.label}</div><div style={{fontSize:28,fontWeight:900,color:m.col,letterSpacing:"-0.04em",fontFamily:"'Syne',sans-serif"}}>{m.val}</div><div style={{fontSize:11,color:t.textMuted,marginTop:4}}>{m.sub}</div></div></Card>
              ))}
            </div>
            <Card t={t}>
              <CHead t={t} title="Top Performing Products" sub="Sorted by revenue"/>
              <div style={{overflowX:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
                  <thead><tr style={{borderBottom:`1px solid ${t.border}`}}>{["#","Product","Category","Price","Units Sold","Revenue","Stock","Rating","Trend"].map(h=><th key={h} style={{textAlign:"left",padding:"9px 14px",fontSize:9,fontWeight:700,color:t.textMuted,letterSpacing:"0.08em",textTransform:"uppercase",whiteSpace:"nowrap"}}>{h}</th>)}</tr></thead>
                  <tbody>
                    {prods.map((p,i)=>(
                      <tr key={p.id||i} className="tr" style={{background:"transparent",borderBottom:`1px solid ${t.border}`}}>
                        <td style={{padding:"12px 14px",color:t.textFaint,fontWeight:700}}>{i+1}</td>
                        <td style={{padding:"12px 14px"}}><div style={{display:"flex",alignItems:"center",gap:9}}><span style={{fontSize:17,width:32,height:32,flexShrink:0,background:t.surfaceAlt,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",border:`1px solid ${t.border}`}}>{p.emoji}</span><span style={{fontWeight:700,color:t.text,whiteSpace:"nowrap"}}>{p.name}</span></div></td>
                        <td style={{padding:"12px 14px",color:t.textSub,whiteSpace:"nowrap"}}>{p.cat||p.category}</td>
                        <td style={{padding:"12px 14px",fontWeight:600,color:t.text}}>${p.price}</td>
                        <td style={{padding:"12px 14px",fontWeight:700,color:t.text}}>{fmtN(p.sold)}</td>
                        <td style={{padding:"12px 14px",fontWeight:800,color:t.accent,fontFamily:"'Syne',sans-serif"}}>{fmtD(p.revenue)}</td>
                        <td style={{padding:"12px 14px"}}><span style={{fontWeight:700,color:p.stock<10?t.danger:p.stock<25?t.warning:t.success}}>{p.stock}</span></td>
                        <td style={{padding:"12px 14px",color:t.warning,fontWeight:600}}>★ {p.rating}</td>
                        <td style={{padding:"12px 14px"}}><TrendChip val={p.trend} t={t}/></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* ORDERS */}
        {tab==="orders"&&(
          <div className="fu">
            <h1 style={{fontSize:20,fontWeight:900,letterSpacing:"-0.04em",color:t.text,fontFamily:"'Syne',sans-serif",marginBottom:4}}>Orders</h1>
            <p style={{fontSize:11,color:t.textMuted,marginBottom:16}}>Fulfillment · Status · History</p>
            <div style={{...G4,marginBottom:14}}>
              {[{label:"New",val:"143",col:t.info,sub:"+22 today"},{label:"Processing",val:"67",col:t.warning,sub:"Avg 2.4h lead"},{label:"Shipped",val:"318",col:t.success,sub:"On schedule"},{label:"Cancelled",val:"14",col:t.danger,sub:"1.2% rate"}].map(m=>(
                <Card key={m.label} t={t}><div style={{padding:"14px 16px"}}><div style={{fontSize:10,fontWeight:700,color:t.textMuted,letterSpacing:"0.07em",textTransform:"uppercase",marginBottom:7}}>{m.label}</div><div style={{fontSize:28,fontWeight:900,color:m.col,letterSpacing:"-0.04em",fontFamily:"'Syne',sans-serif"}}>{m.val}</div><div style={{fontSize:11,color:t.textMuted,marginTop:4}}>{m.sub}</div></div></Card>
              ))}
            </div>
            <Card t={t}>
              <CHead t={t} title="Recent Orders" sub="Latest transactions · synced from MongoDB"/>
              <div style={{overflowX:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
                  <thead><tr style={{borderBottom:`1px solid ${t.border}`}}>{["Order","Customer","Product","Qty","Amount","Status","Time"].map(h=><th key={h} style={{textAlign:"left",padding:"9px 14px",fontSize:9,fontWeight:700,color:t.textMuted,letterSpacing:"0.08em",textTransform:"uppercase"}}>{h}</th>)}</tr></thead>
                  <tbody>
                    {orders.map((o,i)=>(
                      <tr key={i} className="tr" style={{background:"transparent",borderBottom:`1px solid ${t.border}`}}>
                        <td style={{padding:"12px 14px",fontFamily:"monospace",fontWeight:700,color:t.accent,fontSize:12}}>{o.id}</td>
                        <td style={{padding:"12px 14px",fontWeight:600,color:t.text,whiteSpace:"nowrap"}}>{o.customer}</td>
                        <td style={{padding:"12px 14px"}}><span style={{display:"flex",alignItems:"center",gap:6}}><span style={{fontSize:15}}>{o.emoji}</span><span style={{color:t.textSub,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",maxWidth:130}}>{o.product}</span></span></td>
                        <td style={{padding:"12px 14px",color:t.textSub,textAlign:"center"}}>{o.qty}</td>
                        <td style={{padding:"12px 14px",fontWeight:800,color:t.text}}>${o.amount}</td>
                        <td style={{padding:"12px 14px"}}><Badge status={o.status} t={t}/></td>
                        <td style={{padding:"12px 14px",fontSize:11,color:t.textFaint}}>{o.ago}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* ANALYTICS */}
        {tab==="analytics"&&(
          <div className="fu">
            <h1 style={{fontSize:20,fontWeight:900,letterSpacing:"-0.04em",color:t.text,fontFamily:"'Syne',sans-serif",marginBottom:4}}>Analytics</h1>
            <p style={{fontSize:11,color:t.textMuted,marginBottom:16}}>Behaviour · Engagement · Trends</p>
            <div style={{...G4,marginBottom:14}}>
              {[{label:"Page Views",val:fmtN(vis*5),sub:"+11.3% today",col:t.info},{label:"Unique Visitors",val:fmtN(vis),sub:"+8.9% vs yesterday",col:t.success},{label:"Bounce Rate",val:"41.2%",sub:"−3.1% this week",col:t.success},{label:"Cart Abandon",val:"68.5%",sub:"+2.4% this week",col:t.danger}].map(m=>(
                <Card key={m.label} t={t}><div style={{padding:"14px 16px"}}><div style={{fontSize:10,fontWeight:700,color:t.textMuted,letterSpacing:"0.07em",textTransform:"uppercase",marginBottom:7}}>{m.label}</div><div style={{fontSize:28,fontWeight:900,color:m.col,letterSpacing:"-0.04em",fontFamily:"'Syne',sans-serif"}}>{m.val}</div><div style={{fontSize:11,color:t.textMuted,marginTop:4}}>{m.sub}</div></div></Card>
              ))}
            </div>
            <div style={{...G2,marginBottom:14}}>
              <Card t={t}>
                <CHead t={t} title="Monthly Revenue" sub="Last 12 months"/>
                <CBody>
                  <ResponsiveContainer width="100%" height={195}>
                    <AreaChart data={monthly} margin={{top:4,right:4,bottom:0,left:-20}}>
                      <defs><linearGradient id="ag3" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={t.cs3} stopOpacity={0.2}/><stop offset="100%" stopColor={t.cs3} stopOpacity={0}/></linearGradient></defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={t.cGrid} vertical={false}/>
                      <XAxis dataKey="m" tick={{fill:t.textFaint,fontSize:10}} axisLine={false} tickLine={false}/>
                      <YAxis tick={{fill:t.textFaint,fontSize:10}} axisLine={false} tickLine={false} tickFormatter={v=>`$${(v/1000).toFixed(0)}k`}/>
                      <Tooltip content={TT}/>
                      <Area type="monotone" dataKey="revenue" name="revenue" stroke={t.cs3} strokeWidth={2.5} fill="url(#ag3)" dot={false}/>
                    </AreaChart>
                  </ResponsiveContainer>
                </CBody>
              </Card>
              <Card t={t}>
                <CHead t={t} title="Hourly Orders" sub="Today's order volume — live"/>
                <CBody>
                  <ResponsiveContainer width="100%" height={195}>
                    <LineChart data={hourly} margin={{top:4,right:4,bottom:0,left:-20}}>
                      <CartesianGrid strokeDasharray="3 3" stroke={t.cGrid} vertical={false}/>
                      <XAxis dataKey="h" tick={{fill:t.textFaint,fontSize:10}} axisLine={false} tickLine={false} interval={3}/>
                      <YAxis tick={{fill:t.textFaint,fontSize:10}} axisLine={false} tickLine={false}/>
                      <Tooltip content={TT}/>
                      <Line type="monotone" dataKey="orders" name="orders" stroke={t.cs2} strokeWidth={2.5} dot={false} isAnimationActive={false}/>
                    </LineChart>
                  </ResponsiveContainer>
                </CBody>
              </Card>
            </div>
            <Card t={t}>
              <CHead t={t} title="Category Performance" sub="Sales share and order volume"/>
              <CBody>
                <div style={{display:"flex",gap:16,alignItems:"flex-start",flexWrap:"wrap"}}>
                  <div style={{flex:"0 0 300px"}}>
                    <ResponsiveContainer width="100%" height={210}>
                      <BarChart data={cats} layout="vertical" margin={{top:0,right:8,bottom:0,left:8}}>
                        <CartesianGrid strokeDasharray="3 3" stroke={t.cGrid} horizontal={false}/>
                        <XAxis type="number" tick={{fill:t.textFaint,fontSize:10}} axisLine={false} tickLine={false} tickFormatter={v=>`${v}%`}/>
                        <YAxis type="category" dataKey="name" tick={{fill:t.textSub,fontSize:11}} axisLine={false} tickLine={false} width={92}/>
                        <Tooltip content={TT}/>
                        <Bar dataKey="value" name="Share" radius={[0,5,5,0]}>{cats.map((_,i)=><Cell key={i} fill={t.pie[i%t.pie.length]}/>)}</Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div style={{flex:1,display:"flex",flexDirection:"column",gap:7,paddingTop:2,minWidth:200}}>
                    {cats.map((c,i)=>(
                      <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 13px",borderRadius:9,background:t.surfaceAlt,border:`1px solid ${t.border}`}}>
                        <span style={{width:9,height:9,borderRadius:3,flexShrink:0,background:t.pie[i%t.pie.length]}}/>
                        <span style={{flex:1,fontSize:12,fontWeight:600,color:t.text}}>{c.name}</span>
                        <span style={{fontSize:11,color:t.textMuted}}>{c.orders} orders</span>
                        <span style={{fontSize:12,fontWeight:800,color:t.pie[i%t.pie.length]}}>{c.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CBody>
            </Card>
          </div>
        )}
      </main>

      <footer style={{borderTop:`1px solid ${t.border}`,padding:"11px 26px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <span style={{fontSize:10,color:t.textFaint}}>Nexus Commerce · Real-time · MongoDB + Firebase</span>
        <span style={{fontSize:10,color:t.textFaint,display:"flex",alignItems:"center",gap:5}}><LivePulse t={t}/> Connected as {user.email}</span>
      </footer>
    </div>
  );
}

