import { useState, useMemo } from "react";

const INDIAN_STATES = ["Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal","Delhi","Jammu & Kashmir","Ladakh","Puducherry","Chandigarh","Dadra & Nagar Haveli","Daman & Diu","Lakshadweep","Andaman & Nicobar Islands"];

const DEFAULT_COSTS = { procurement:24.22, transportMilling:0.57, milling:3.69, packaging:0.84, fortification:0.28, transportDist:0.50 };

const ALL_COSTS = [
  { key:"procurement",      label:"Procurement",                   grainAdd:false, flourAdd:false },
  { key:"transportMilling", label:"Transport for milling",         grainAdd:true,  flourAdd:false },
  { key:"milling",          label:"Milling (cleaning & grinding)", grainAdd:true,  flourAdd:false },
  { key:"packaging",        label:"Packaging",                     grainAdd:true,  flourAdd:false },
  { key:"fortification",    label:"Fortification costs",           grainAdd:true,  flourAdd:true  },
  { key:"transportDist",    label:"Transport for distribution",    grainAdd:true,  flourAdd:false },
];

const MILLS = [
  { id:"chakki", label:"20 MT/D", sub:"Commercial chakki mill" },
  { id:"hybrid", label:"60 MT/D", sub:"Hybrid roller–chakki line" },
  { id:"modern", label:"130–520 MT/D", sub:"Modern atta mill" },
];

const QUALITY_ROWS = [
  { aspect:"FSSAI product compliance", chakki:"Most mills do not meet FSSAI requirements — additional support needed", hybrid:"Partial compliance — some mills meet FSSAI standards", modern:"Fully compliant by default — state-of-the-art standard" },
  { aspect:"Mill compliance", chakki:"Milling practices need support to meet FSSAI requirements", hybrid:"Partial compliance — some upgrades required", modern:"Fully compliant by default" },
  { aspect:"Laboratory infrastructure", chakki:"No labs on site — a shared cluster lab could serve a group of mills", hybrid:"Existing labs need upgrading and additional labs required", modern:"Newly equipped, fully functional labs" },
  { aspect:"Milling infrastructure", chakki:"Weighing and dosing require manual monitoring by staff", hybrid:"Weighing and dosing need manual monitoring plus impact detacher", modern:"Automated, integrated systems — minimal manual involvement" },
  { aspect:"Product shelf life", chakki:"Up to 2 months (if stored correctly)", hybrid:"Up to 3 months (if stored correctly)", modern:"Up to 6 months (if stored correctly)" },
  { aspect:"Transportation & distribution reach", chakki:"Regional only — cannot serve the whole state", hybrid:"Regional only — limited state-wide reach", modern:"Can serve the entire state with centralised control" },
];

const OPS_ROWS = [
  { aspect:"Location advantage", chakki:"Good for inbound logistics and grain management in growing areas", hybrid:"Widely distributed across the state — less location advantage", modern:"Can be located near growing areas for major cost and logistics savings" },
  { aspect:"Centralised procurement", chakki:"Grain must be pooled first then redistributed — adds complexity", hybrid:"Redistribution required — centralised pooling necessary", modern:"Direct procurement possible — centralised pooling can be avoided entirely" },
  { aspect:"Personnel & supervision", chakki:"High risk of lapses — extensive staff monitoring required", hybrid:"High level of supervision needed", modern:"Automated systems reduce manual involvement significantly" },
  { aspect:"Local distribution", chakki:"Mills can be directed to distribute locally", hybrid:"Monitoring and tracking must be robust", modern:"Can be regionalised with good tracking systems" },
  { aspect:"Remote distribution", chakki:"Not economically feasible for distant areas", hybrid:"Feasible in bulk", modern:"System can be designed to serve remote areas" },
  { aspect:"Quality control & traceability", chakki:"Hard to trace issues if many mills are involved", hybrid:"Outward tracking possible but raw material traceability is difficult", modern:"Full traceability systems can be implemented, including farm-level sourcing" },
];

const MILL_NOTES = {
  chakki:"Small-scale chakki mills are widely distributed and support local employment, but require the most investment in compliance, lab infrastructure, and quality oversight. Best suited for highly localised distribution.",
  hybrid:"A middle-ground option — more capacity than chakki mills with some existing infrastructure. Requires targeted upgrades to meet FSSAI standards and scale distribution effectively.",
  modern:"Modern mills offer the highest quality, longest shelf life, and widest distribution reach. They are the most capital-intensive but require the least ongoing oversight and are best suited for state-wide programs.",
};

const SCORE = {
  chakki:{ compliance:1, infrastructure:1, shelfLife:1, reach:1, automation:1 },
  hybrid:{ compliance:2, infrastructure:2, shelfLife:2, reach:2, automation:2 },
  modern:{ compliance:3, infrastructure:3, shelfLife:3, reach:3, automation:3 },
};

const C = { red:"#dc6059", yellow:"#ffdc8b", teal:"#0097a7", redLight:"#fdf1f0", redMid:"#f5b8b5", tealLight:"#e0f5f7", tealMid:"#4ec4cf", yellowLight:"#fffbf0", yellowMid:"#ffe9a0", dark:"#1a2e30", mid:"#4a6366", light:"#8aa5a8", border:"#dde8e9", bg:"#f7fafa", sand:"#ddd8cb" };
const PIE_COLORS = [C.red, C.teal, C.yellow, "#e8927c","#33b5c2","#a0d8de","#f5c842","#6dd6a0"];

const fmt2 = n => Number(n).toFixed(2);
const fmtBig = n => {
  if (!n||n===0) return "₹0.00";
  if (n>=1e7) return `₹${(n/1e7).toFixed(2)} Cr`;
  if (n>=1e5) return `₹${(n/1e5).toFixed(2)} L`;
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
};

const globalStyle = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Inter', -apple-system, sans-serif; background: ${C.bg}; color: ${C.dark}; min-height: 100vh; }
  input, select { font-family: inherit; font-size: 13px; padding: 9px 12px; border: 1.5px solid ${C.border}; border-radius: 8px; outline: none; background: #fff; color: ${C.dark}; width: 100%; transition: border-color 0.15s, box-shadow 0.15s; }
  input:focus, select:focus { border-color: ${C.teal}; box-shadow: 0 0 0 3px rgba(0,151,167,0.12); }
  input::placeholder { color: ${C.light}; }
  button { font-family: inherit; cursor: pointer; }
`;

function PieChart({ data }) {
  const size=200, cx=100, cy=100, r=78, ir=40;
  const total = data.reduce((s,d)=>s+(d.value||0),0);
  if (!total) return (
    <div style={{textAlign:"center",padding:"2.5rem 0"}}>
      <div style={{width:48,height:48,borderRadius:"50%",border:`2px dashed ${C.border}`,margin:"0 auto 10px",display:"flex",alignItems:"center",justifyContent:"center"}}>
        <span style={{fontSize:20}}>🌾</span>
      </div>
      <p style={{fontSize:12,color:C.light}}>Enter volume data above<br/>to see cost breakdown</p>
    </div>
  );
  if (data.length===1) return (
    <svg viewBox={`0 0 ${size} ${size}`} width="100%" style={{maxWidth:200,display:"block",margin:"0 auto"}}>
      <circle cx={cx} cy={cy} r={r} fill={PIE_COLORS[0]}/>
      <circle cx={cx} cy={cy} r={ir} fill="#fff"/>
      <text x={cx} y={cy-6} textAnchor="middle" dominantBaseline="middle" fontSize="11" fill={PIE_COLORS[0]} fontWeight="600">100%</text>
      <text x={cx} y={cy+10} textAnchor="middle" dominantBaseline="middle" fontSize="9" fill={PIE_COLORS[0]}>{data[0].label}</text>
    </svg>
  );
  let cum=-Math.PI/2;
  const slices=data.map((d,i)=>{
    const pct=d.value/total,a1=cum,a2=cum+pct*2*Math.PI; cum=a2;
    const x1=cx+r*Math.cos(a1),y1=cy+r*Math.sin(a1),x2=cx+r*Math.cos(a2),y2=cy+r*Math.sin(a2);
    const xi1=cx+ir*Math.cos(a1),yi1=cy+ir*Math.sin(a1),xi2=cx+ir*Math.cos(a2),yi2=cy+ir*Math.sin(a2);
    const large=pct>0.5?1:0,mid=(a1+a2)/2;
    return {path:`M${xi1} ${yi1}L${x1} ${y1}A${r} ${r} 0 ${large} 1 ${x2} ${y2}L${xi2} ${yi2}A${ir} ${ir} 0 ${large} 0 ${xi1} ${yi1}Z`,color:PIE_COLORS[i%PIE_COLORS.length],pct:Math.round(pct*100),lx:cx+(r+20)*Math.cos(mid),ly:cy+(r+20)*Math.sin(mid)};
  });
  return (
    <svg viewBox={`0 0 ${size} ${size}`} width="100%" style={{maxWidth:200,display:"block",margin:"0 auto"}}>
      {slices.map((s,i)=>(
        <g key={i}><path d={s.path} fill={s.color}/>
          {s.pct>7&&<text x={s.lx} y={s.ly} textAnchor="middle" dominantBaseline="middle" fontSize="9.5" fill={s.color} fontWeight="600">{s.pct}%</text>}
        </g>
      ))}
    </svg>
  );
}

function Label({ children }) {
  return <label style={{fontSize:11,fontWeight:600,color:C.mid,marginBottom:5,display:"block",textTransform:"uppercase",letterSpacing:"0.05em"}}>{children}</label>;
}

function SectionTitle({ children, sub }) {
  return (
    <div style={{marginBottom:14}}>
      <p style={{fontSize:15,fontWeight:600,color:C.dark,margin:"0 0 2px"}}>{children}</p>
      {sub&&<p style={{fontSize:12,color:C.light,margin:0}}>{sub}</p>}
    </div>
  );
}

function ScoreDots({ val }) {
  return (
    <div style={{display:"flex",gap:3,justifyContent:"center"}}>
      {[1,2,3].map(i=>(
        <div key={i} style={{width:8,height:8,borderRadius:"50%",background:i<=val?C.teal:C.border}}/>
      ))}
    </div>
  );
}

const HOW_TO = [
  { icon:"📋", title:"Fill in the inputs", points:[
    "Select the state and what you currently supply — wheat grain or wheat flour",
    "Enter either total beneficiaries + monthly kg per person, or your total monthly consumption — whichever you know",
    "Default costs are based on a Haryana case study and can be edited to reflect your context",
  ]},
  { icon:"📊", title:"Interpret the results", points:[
    "The headline figure shows your additional cost — what you would actually be adding on top of existing operations",
    "For wheat grain suppliers, this covers transport, milling, packaging, fortification and distribution",
    "For wheat flour suppliers, the additional cost is fortification only — milling and packaging are already accounted for",
    "The pie chart breaks down where those additional costs come from",
  ]},
  { icon:"✏️", title:"Edit or add costs", points:[
    "Click 'Edit costs' to enter your own unit costs for any category",
    "Use '+ Add cost category' to include costs specific to your context (e.g. storage, last-mile delivery)",
    "All changes update the totals automatically",
  ]},
];

function MillTab() {
  const [selectedMill, setSelectedMill] = useState("modern");
  const mill = MILLS.find(m=>m.id===selectedMill);
  const score = SCORE[selectedMill];
  const cellStyle = (id) => ({
    padding:"10px 12px", fontSize:12, color: id===selectedMill ? C.dark : C.mid,
    background: id===selectedMill ? C.tealLight : "transparent",
    fontWeight: id===selectedMill ? 500 : 400,
    borderBottom:`1px solid ${C.border}`, verticalAlign:"top", lineHeight:1.6,
  });
  return (
    <div>
      <div style={{background:"#fff",border:`1px solid ${C.border}`,borderRadius:14,padding:"1.25rem 1.5rem",marginBottom:"1rem",boxShadow:"0 1px 4px rgba(0,151,167,0.06)"}}>
        <p style={{fontSize:13,color:C.mid,margin:"0 0 14px",lineHeight:1.7}}>Select a mill type to explore its suitability for your fortified atta program. Information is drawn from the <em>Wheat Flour Supply Chain Analysis</em>, Food Fortification Initiative (FFI), Haryana, 2016.</p>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
          {MILLS.map(m=>(
            <button key={m.id} onClick={()=>setSelectedMill(m.id)}
              style={{padding:"14px 10px",borderRadius:10,border:`2px solid ${selectedMill===m.id?C.teal:C.border}`,background:selectedMill===m.id?C.tealLight:"#fff",cursor:"pointer",textAlign:"center"}}>
              <p style={{fontSize:15,fontWeight:600,color:selectedMill===m.id?C.teal:C.dark,margin:"0 0 3px"}}>{m.label}</p>
              <p style={{fontSize:11,color:C.mid,margin:0}}>{m.sub}</p>
            </button>
          ))}
        </div>
      </div>
      <div style={{background:C.tealLight,border:`1px solid ${C.tealMid}`,borderRadius:12,padding:"1rem 1.25rem",marginBottom:"1rem"}}>
        <p style={{fontSize:13,fontWeight:600,color:C.teal,margin:"0 0 6px"}}>{mill.label} — {mill.sub}</p>
        <p style={{fontSize:13,color:"#2a5f66",lineHeight:1.7,margin:"0 0 14px"}}>{MILL_NOTES[selectedMill]}</p>
        <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:8}}>
          {[["Compliance","compliance"],["Infrastructure","infrastructure"],["Shelf life","shelfLife"],["Distribution","reach"],["Automation","automation"]].map(([label,key])=>(
            <div key={key} style={{background:"#fff",borderRadius:8,padding:"8px 6px",textAlign:"center",border:`1px solid ${C.border}`}}>
              <p style={{fontSize:10,color:C.mid,margin:"0 0 6px",fontWeight:500}}>{label}</p>
              <ScoreDots val={score[key]}/>
            </div>
          ))}
        </div>
        <p style={{fontSize:10,color:C.light,margin:"8px 0 0"}}>● ● ● High &nbsp;·&nbsp; ● ● ○ Medium &nbsp;·&nbsp; ● ○ ○ Low</p>
      </div>
      <div style={{background:"#fff",border:`1px solid ${C.border}`,borderRadius:14,padding:"1.25rem 1.5rem",marginBottom:"1rem",boxShadow:"0 1px 4px rgba(0,151,167,0.06)"}}>
        <SectionTitle sub="Product quality and regulatory compliance">Quality & specifications</SectionTitle>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
            <thead>
              <tr style={{borderBottom:`1.5px solid ${C.border}`}}>
                <th style={{textAlign:"left",padding:"8px 12px 8px 0",color:C.light,fontWeight:500,minWidth:140}}>Consideration</th>
                {MILLS.map(m=>(
                  <th key={m.id} style={{textAlign:"left",padding:"8px 12px",fontWeight:600,fontSize:11,minWidth:160}}>
                    <span style={{padding:"3px 10px",borderRadius:20,background:selectedMill===m.id?C.tealLight:"#f5f8f8",color:selectedMill===m.id?C.teal:C.mid,border:`1px solid ${selectedMill===m.id?C.tealMid:C.border}`}}>{m.label}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {QUALITY_ROWS.map((row,i)=>(
                <tr key={i}>
                  <td style={{padding:"10px 12px 10px 0",color:C.dark,fontWeight:500,fontSize:12,borderBottom:`1px solid ${C.border}`,verticalAlign:"top"}}>{row.aspect}</td>
                  <td style={cellStyle("chakki")}>{row.chakki}</td>
                  <td style={cellStyle("hybrid")}>{row.hybrid}</td>
                  <td style={cellStyle("modern")}>{row.modern}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div style={{background:"#fff",border:`1px solid ${C.border}`,borderRadius:14,padding:"1.25rem 1.5rem",boxShadow:"0 1px 4px rgba(0,151,167,0.06)"}}>
        <SectionTitle sub="Procurement, distribution and operational considerations">Operational aspects</SectionTitle>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
            <thead>
              <tr style={{borderBottom:`1.5px solid ${C.border}`}}>
                <th style={{textAlign:"left",padding:"8px 12px 8px 0",color:C.light,fontWeight:500,minWidth:140}}>Consideration</th>
                {MILLS.map(m=>(
                  <th key={m.id} style={{textAlign:"left",padding:"8px 12px",fontWeight:600,fontSize:11,minWidth:160}}>
                    <span style={{padding:"3px 10px",borderRadius:20,background:selectedMill===m.id?C.tealLight:"#f5f8f8",color:selectedMill===m.id?C.teal:C.mid,border:`1px solid ${selectedMill===m.id?C.tealMid:C.border}`}}>{m.label}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {OPS_ROWS.map((row,i)=>(
                <tr key={i}>
                  <td style={{padding:"10px 12px 10px 0",color:C.dark,fontWeight:500,fontSize:12,borderBottom:`1px solid ${C.border}`,verticalAlign:"top"}}>{row.aspect}</td>
                  <td style={cellStyle("chakki")}>{row.chakki}</td>
                  <td style={cellStyle("hybrid")}>{row.hybrid}</td>
                  <td style={cellStyle("modern")}>{row.modern}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState("calculator");
  const [geoName, setGeoName] = useState("");
  const [supplyType, setSupplyType] = useState("Wheat Grain");
  const [population, setPopulation] = useState("");
  const [kgPerBenef, setKgPerBenef] = useState("");
  const [totalMonthlyKg, setTotalMonthlyKg] = useState("");
  const [customMode, setCustomMode] = useState(false);
  const [customCosts, setCustomCosts] = useState({...DEFAULT_COSTS});
  const [extraCats, setExtraCats] = useState([]);
  const [newLabel, setNewLabel] = useState("");
  const [newCost, setNewCost] = useState("");
  const [guideOpen, setGuideOpen] = useState(false);

  const costs = customMode ? customCosts : DEFAULT_COSTS;
  const isGrain = supplyType === "Wheat Grain";

  const handleReset = () => { setCustomCosts({...DEFAULT_COSTS}); setExtraCats([]); };

  const addCategory = () => {
    if (!newLabel.trim()) return;
    setExtraCats(p=>[...p, { id:Date.now(), label:newLabel.trim(), cost:parseFloat(newCost)||0 }]);
    setNewLabel(""); setNewCost("");
  };

  const removeExtra = id => setExtraCats(p=>p.filter(e=>e.id!==id));
  const updateExtra = (id,val) => setExtraCats(p=>p.map(e=>e.id===id?{...e,cost:parseFloat(val)||0}:e));

  const targetVol = useMemo(()=>{
    const tm=parseFloat(totalMonthlyKg);
    if (tm) return tm*12;
    const p=parseFloat(population), k=parseFloat(kgPerBenef);
    if (p&&k) return p*k*12;
    return 0;
  },[population,kgPerBenef,totalMonthlyKg]);

  const derivedPerCapita = useMemo(()=>{
    const tm=parseFloat(totalMonthlyKg), p=parseFloat(population);
    if (tm&&p) return (tm/p).toFixed(2);
    return null;
  },[totalMonthlyKg,population]);

  const visibleCosts = ALL_COSTS.filter(c=>isGrain?true:c.flourAdd);
  const additionalKeys = ALL_COSTS.filter(c=>isGrain?c.grainAdd:c.flourAdd).map(c=>c.key);
  const extraUnitTotal = extraCats.reduce((s,e)=>s+e.cost,0);

  // Additional cost = what they are actually adding
  const additionalUnitTotal = additionalKeys.reduce((s,k)=>s+(parseFloat(costs[k])||0),0) + extraUnitTotal;
  const additionalTotal = additionalUnitTotal * targetVol;

  // Full unit total (for context only)
  const fullUnitTotal = ALL_COSTS.reduce((s,c)=>s+(parseFloat(costs[c.key])||0),0) + extraUnitTotal;
  const fullTotalCost = fullUnitTotal * targetVol;

  const pieData = [
    ...additionalKeys.map(k=>({ label:ALL_COSTS.find(c=>c.key===k)?.label||k, value:(parseFloat(costs[k])||0)*targetVol })),
    ...extraCats.map(e=>({ label:e.label, value:e.cost*targetVol }))
  ].filter(d=>d.value>0);

  const volMT = targetVol>0 ? (targetVol/1000).toFixed(2)+" MT" : null;
  const costPerKg = additionalUnitTotal;
  const cardShadow = "0 1px 4px rgba(0,151,167,0.06)";

  const tabs = [
    { id:"calculator", label:"💰 Budget calculator" },
  ];

  return (
    <>
      <style>{globalStyle}</style>

      <div style={{background:`linear-gradient(135deg, ${C.red} 0%, #c94d46 100%)`,padding:"2rem 2rem 0"}}>
        <div style={{maxWidth:920,margin:"0 auto"}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
            <span style={{fontSize:28}}>🌾</span>
            <h1 style={{fontSize:24,fontWeight:600,color:"#fff",margin:0}}>Fortified atta budget calculator</h1>
          </div>
          <p style={{fontSize:14,color:"rgba(255,255,255,0.8)",margin:"0 0 1.25rem"}}>Estimate what it would cost to add fortification to your existing atta distribution program.</p>
          <div style={{display:"flex",gap:4}}>
            {tabs.map(t=>(
              <button key={t.id} onClick={()=>setActiveTab(t.id)}
                style={{padding:"10px 20px",fontSize:13,fontWeight:500,border:"none",borderRadius:"8px 8px 0 0",cursor:"pointer",
                  background:activeTab===t.id?"#f7fafa":"rgba(255,255,255,0.15)",
                  color:activeTab===t.id?C.dark:"rgba(255,255,255,0.85)"}}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{maxWidth:920,margin:"0 auto",padding:"1.5rem 1.5rem 3rem"}}>
        {activeTab==="calculator" && (          <>
            {/* How to use */}
            <div style={{background:"#fff",border:`1px solid ${C.border}`,borderRadius:14,marginBottom:"1rem",boxShadow:cardShadow,overflow:"hidden"}}>
              <button onClick={()=>setGuideOpen(o=>!o)} style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"1rem 1.5rem",background:"none",border:"none",textAlign:"left"}}>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <div style={{width:6,height:20,background:C.yellow,borderRadius:3}}/>
                  <span style={{fontSize:13,fontWeight:600,color:C.dark,textTransform:"uppercase",letterSpacing:"0.06em"}}>How to use this calculator</span>
                </div>
                <span style={{fontSize:18,color:C.light}}>{guideOpen?"−":"+"}</span>
              </button>
              {guideOpen&&(
                <div style={{padding:"0 1.5rem 1.25rem",borderTop:`1px solid ${C.border}`}}>
                  <p style={{fontSize:13,color:C.mid,margin:"1rem 0 1.25rem",lineHeight:1.7}}>This tool helps program managers and stakeholders estimate the additional annual cost of introducing fortified atta into an existing food distribution program.</p>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:12}}>
                    {HOW_TO.map((h,i)=>(
                      <div key={i} style={{background:C.bg,borderRadius:10,padding:"1rem 1.1rem",border:`1px solid ${C.border}`}}>
                        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                          <span style={{fontSize:18}}>{h.icon}</span>
                          <span style={{fontSize:13,fontWeight:600,color:C.dark}}>{h.title}</span>
                        </div>
                        <ul style={{paddingLeft:16,margin:0}}>
                          {h.points.map((pt,j)=>(
                            <li key={j} style={{fontSize:12,color:C.mid,lineHeight:1.65,marginBottom:4}}>{pt}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Inputs */}
            <div style={{background:"#fff",border:`1px solid ${C.border}`,borderRadius:14,padding:"1.25rem 1.5rem",marginBottom:"1rem",boxShadow:cardShadow}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
                <div style={{width:6,height:20,background:C.teal,borderRadius:3}}/>
                <p style={{fontSize:13,fontWeight:600,color:C.teal,margin:0,textTransform:"uppercase",letterSpacing:"0.06em"}}>Input parameters</p>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:14,marginBottom:14}}>
                <div>
                  <Label>Geography name</Label>
                  <select value={geoName} onChange={e=>setGeoName(e.target.value)}>
                    <option value="">Select a state…</option>
                    {INDIAN_STATES.map(s=><option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <Label>Currently supply</Label>
                  <select value={supplyType} onChange={e=>setSupplyType(e.target.value)}>
                    <option>Wheat Grain</option>
                    <option>Wheat Flour</option>
                  </select>
                </div>
              </div>

              {/* Volume inputs */}
              <div style={{background:C.bg,borderRadius:10,padding:"12px 14px",border:`1px solid ${C.border}`}}>
                <p style={{fontSize:11,fontWeight:600,color:C.mid,textTransform:"uppercase",letterSpacing:"0.05em",margin:"0 0 10px"}}>Volume — fill in whichever you know</p>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:12,alignItems:"end"}}>
                  <div>
                    <Label>Total beneficiaries</Label>
                    <input type="number" placeholder="e.g. 50,000" value={population} onChange={e=>setPopulation(e.target.value)}/>
                  </div>
                  <div>
                    <Label>Kg / beneficiary (monthly)</Label>
                    <input type="number" placeholder="e.g. 5" value={kgPerBenef} onChange={e=>setKgPerBenef(e.target.value)}/>
                  </div>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"center",paddingBottom:2}}>
                    <span style={{fontSize:13,color:C.light,fontWeight:500}}>— or —</span>
                  </div>
                  <div>
                    <Label>Total monthly consumption (kg)</Label>
                    <input type="number" placeholder="e.g. 250,000" value={totalMonthlyKg} onChange={e=>setTotalMonthlyKg(e.target.value)}/>
                    {derivedPerCapita&&population&&<p style={{fontSize:11,color:C.teal,margin:"4px 0 0"}}>≈ {derivedPerCapita} kg / beneficiary / month</p>}
                  </div>
                </div>
              </div>
            </div>

            {/* Summary cards */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1.3fr",gap:12,marginBottom:"1rem"}}>
              <div style={{background:"#fff",border:`1px solid ${C.border}`,borderRadius:12,padding:"1.1rem 1.25rem",boxShadow:cardShadow}}>
                <p style={{fontSize:11,fontWeight:600,color:C.mid,textTransform:"uppercase",letterSpacing:"0.05em",margin:"0 0 6px"}}>Target volume / year</p>
                <p style={{fontSize:26,fontWeight:600,color:C.dark,margin:0,lineHeight:1.1}}>{volMT||"—"}</p>
                {volMT&&<p style={{fontSize:11,color:C.light,margin:"3px 0 0"}}>{targetVol.toLocaleString("en-IN")} kg</p>}
              </div>
              <div style={{background:"#fff",border:`1px solid ${C.border}`,borderRadius:12,padding:"1.1rem 1.25rem",boxShadow:cardShadow}}>
                <p style={{fontSize:11,fontWeight:600,color:C.mid,textTransform:"uppercase",letterSpacing:"0.05em",margin:"0 0 6px"}}>Additional cost / kg</p>
                <p style={{fontSize:26,fontWeight:600,color:C.dark,margin:0,lineHeight:1.1}}>₹{fmt2(costPerKg)}<span style={{fontSize:13,fontWeight:400,color:C.light}}> /kg</span></p>
                <p style={{fontSize:11,color:C.light,margin:"3px 0 0"}}>{isGrain?"Grain → fortified atta":"Flour → fortified atta"}</p>
              </div>
              <div style={{background:`linear-gradient(135deg, ${C.teal} 0%, #007b8a 100%)`,borderRadius:12,padding:"1.1rem 1.25rem",position:"relative",overflow:"hidden"}}>
                <div style={{position:"absolute",right:-16,top:-16,width:80,height:80,borderRadius:"50%",background:"rgba(255,255,255,0.08)"}}/>
                <div style={{position:"absolute",right:20,bottom:-20,width:60,height:60,borderRadius:"50%",background:"rgba(255,255,255,0.06)"}}/>
                <p style={{fontSize:11,fontWeight:600,color:"rgba(255,255,255,0.75)",textTransform:"uppercase",letterSpacing:"0.05em",margin:"0 0 4px"}}>Additional annual cost</p>
                <p style={{fontSize:26,fontWeight:600,color:"#fff",margin:0,lineHeight:1.1}}>{fmtBig(additionalTotal)}</p>
                {targetVol>0&&(
                  <p style={{fontSize:11,color:"rgba(255,255,255,0.6)",margin:"4px 0 0"}}>Full program cost: {fmtBig(fullTotalCost)}</p>
                )}
                <p style={{fontSize:11,color:"rgba(255,255,255,0.65)",margin:"3px 0 0"}}>{geoName||"—"}</p>
              </div>
            </div>

            {/* Context bubble */}
            {targetVol>0&&(
              <div style={{background:C.sand,borderRadius:10,padding:"10px 16px",marginBottom:"1rem",border:`1px solid #c9c4b8`}}>
                <p style={{fontSize:12,color:"#4a4438",lineHeight:1.65,margin:0}}>
                  <strong>💡 {isGrain?"Wheat grain suppliers":"Wheat flour suppliers"}:</strong>{" "}
                  {isGrain
                    ? `Your additional cost covers transport, milling, packaging, fortification, and distribution — everything needed to transition to fortified atta. Your full program cost including procurement is ${fmtBig(fullTotalCost)}.`
                    : `Since you already supply wheat flour, your only additional cost is fortification. Milling, packaging, and procurement are already part of your existing operations.`}
                </p>
              </div>
            )}

            {/* Breakdown + Additional */}
            <div style={{display:"grid",gridTemplateColumns:"1.6fr 1fr",gap:12,marginBottom:"1rem",alignItems:"start"}}>
              <div style={{background:"#fff",border:`1px solid ${C.border}`,borderRadius:14,padding:"1.25rem 1.5rem",boxShadow:cardShadow}}>
                <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:14}}>
                  <SectionTitle sub={isGrain?"Costs added by transitioning to fortified atta":"Fortification cost only — existing costs not shown"}>
                    Additional cost breakdown
                  </SectionTitle>
                  <button onClick={()=>{ if(!customMode) setCustomCosts({...DEFAULT_COSTS}); setCustomMode(!customMode); }}
                    style={{fontSize:12,padding:"7px 14px",background:customMode?C.tealLight:"#f5f8f8",color:customMode?C.teal:C.mid,border:`1.5px solid ${customMode?C.teal:C.border}`,borderRadius:8,fontWeight:500,flexShrink:0,marginLeft:8}}>
                    {customMode?"✓ Custom on":"Edit costs"}
                  </button>
                </div>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
                  <thead>
                    <tr style={{borderBottom:`1.5px solid ${C.border}`}}>
                      <th style={{textAlign:"left",padding:"6px 0",color:C.light,fontWeight:500,fontSize:12}}>Category</th>
                      <th style={{textAlign:"right",padding:"6px 8px",color:C.light,fontWeight:500,fontSize:12}}>₹/kg</th>
                      <th style={{textAlign:"right",padding:"6px 0",color:C.light,fontWeight:500,fontSize:12}}>Annual total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleCosts.map(({key,label})=>{
                      const uc=parseFloat(costs[key])||0;
                      return (
                        <tr key={key} style={{borderBottom:`1px solid ${C.border}`,background:C.yellowLight}}>
                          <td style={{padding:"8px 0"}}>
                            <div style={{display:"flex",alignItems:"center",gap:7}}>
                              <span style={{fontSize:9,padding:"2px 6px",borderRadius:10,background:C.yellow,color:"#7a5c00",fontWeight:600}}>+</span>
                              <span style={{color:C.dark}}>{label}</span>
                            </div>
                          </td>
                          <td style={{textAlign:"right",padding:"8px 8px"}}>
                            {customMode
                              ? <input type="number" value={customCosts[key]} onChange={e=>setCustomCosts(p=>({...p,[key]:e.target.value}))} step="0.01" style={{width:80,textAlign:"right",padding:"4px 6px",fontSize:12}}/>
                              : <span style={{color:C.mid,fontWeight:500}}>{fmt2(uc)}</span>}
                          </td>
                          <td style={{textAlign:"right",padding:"8px 0",color:C.mid}}>{fmtBig(uc*targetVol)}</td>
                        </tr>
                      );
                    })}
                    {extraCats.map(e=>(
                      <tr key={e.id} style={{borderBottom:`1px solid ${C.border}`,background:C.yellowLight}}>
                        <td style={{padding:"8px 0"}}>
                          <div style={{display:"flex",alignItems:"center",gap:7}}>
                            <span style={{fontSize:9,padding:"2px 6px",borderRadius:10,background:C.yellow,color:"#7a5c00",fontWeight:600}}>+</span>
                            <span style={{color:C.dark}}>{e.label}</span>
                            <button onClick={()=>removeExtra(e.id)} style={{fontSize:11,color:C.light,background:"none",border:"none",padding:"0 2px",lineHeight:1,marginLeft:2}}>✕</button>
                          </div>
                        </td>
                        <td style={{textAlign:"right",padding:"8px 8px"}}>
                          <input type="number" value={e.cost} onChange={ev=>updateExtra(e.id,ev.target.value)} step="0.01" style={{width:80,textAlign:"right",padding:"4px 6px",fontSize:12}}/>
                        </td>
                        <td style={{textAlign:"right",padding:"8px 0",color:C.mid}}>{fmtBig(e.cost*targetVol)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{borderTop:`2px solid ${C.border}`}}>
                      <td style={{padding:"10px 0",fontWeight:600,color:C.red}}>Additional total</td>
                      <td style={{textAlign:"right",padding:"10px 8px",fontWeight:600,color:C.red}}>₹{fmt2(additionalUnitTotal)}</td>
                      <td style={{textAlign:"right",padding:"10px 0",fontWeight:600,color:C.red}}>{fmtBig(additionalTotal)}</td>
                    </tr>
                  </tfoot>
                </table>
                <div style={{marginTop:12,padding:"10px 12px",background:C.bg,borderRadius:8,border:`1px dashed ${C.border}`}}>
                  <p style={{fontSize:11,fontWeight:600,color:C.mid,textTransform:"uppercase",letterSpacing:"0.05em",margin:"0 0 8px"}}>+ Add cost category</p>
                  <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
                    <input placeholder="Category name (e.g. Storage costs)" value={newLabel} onChange={e=>setNewLabel(e.target.value)} style={{flex:"2 1 140px",fontSize:12,padding:"7px 10px"}}/>
                    <input type="number" placeholder="₹/kg" value={newCost} onChange={e=>setNewCost(e.target.value)} step="0.01" style={{flex:"1 1 70px",fontSize:12,padding:"7px 10px"}}/>
                    <button onClick={addCategory} style={{fontSize:12,padding:"7px 14px",background:C.teal,color:"#fff",border:"none",borderRadius:8,fontWeight:500,flexShrink:0}}>Add</button>
                  </div>
                </div>
                {(customMode||extraCats.length>0)&&(
                  <button onClick={handleReset} style={{marginTop:10,fontSize:12,padding:"6px 12px",background:C.redLight,color:C.red,border:`1px solid ${C.redMid}`,borderRadius:7,fontWeight:500}}>Reset to defaults</button>
                )}
              </div>

              <div style={{background:"#fff",border:`1px solid ${C.border}`,borderRadius:14,padding:"1.25rem 1.5rem",boxShadow:cardShadow}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4,flexWrap:"wrap"}}>
                  <p style={{fontSize:15,fontWeight:600,color:C.dark,margin:0}}>Cost breakdown</p>
                  <span style={{fontSize:11,padding:"3px 10px",borderRadius:20,background:isGrain?C.yellowLight:C.tealLight,color:isGrain?"#7a5c00":C.teal,fontWeight:600,border:`1px solid ${isGrain?C.yellowMid:C.tealMid}`}}>{supplyType}</span>
                </div>
                <p style={{fontSize:12,color:C.light,margin:"0 0 14px"}}>{isGrain?"Where your additional costs come from":"Fortification is your only additional cost"}</p>
                <PieChart data={pieData}/>
                {pieData.length>0&&(
                  <div style={{marginTop:14}}>
                    {pieData.map((d,i)=>(
                      <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"5px 0",borderBottom:`1px solid ${C.border}`}}>
                        <div style={{display:"flex",alignItems:"center",gap:7}}>
                          <span style={{width:9,height:9,borderRadius:"50%",background:PIE_COLORS[i%PIE_COLORS.length],display:"inline-block",flexShrink:0}}/>
                          <span style={{fontSize:12,color:C.mid}}>{d.label}</span>
                        </div>
                        <span style={{fontSize:12,fontWeight:600,color:C.dark}}>{fmtBig(d.value)}</span>
                      </div>
                    ))}
                    <div style={{display:"flex",justifyContent:"space-between",padding:"8px 0 0"}}>
                      <span style={{fontSize:13,fontWeight:600,color:C.teal}}>Additional total</span>
                      <span style={{fontSize:13,fontWeight:600,color:C.teal}}>{fmtBig(additionalTotal)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Reference */}
            <div style={{background:"#fff",border:`1px solid ${C.border}`,borderRadius:14,padding:"1.25rem 1.5rem",boxShadow:cardShadow}}>
              <SectionTitle sub="Default unit costs (₹/kg)">Default costs reference</SectionTitle>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                <thead>
                  <tr style={{borderBottom:`1.5px solid ${C.border}`}}>
                    <th style={{textAlign:"left",padding:"5px 0",color:C.light,fontWeight:500}}>Category</th>
                    <th style={{textAlign:"right",padding:"5px 0",color:C.light,fontWeight:500}}>₹/kg</th>
                  </tr>
                </thead>
                <tbody>
                  {ALL_COSTS.map(({key,label})=>(
                    <tr key={key} style={{borderBottom:`1px solid ${C.border}`}}>
                      <td style={{padding:"6px 0",color:C.mid}}>{label}</td>
                      <td style={{textAlign:"right",padding:"6px 0",color:C.dark,fontWeight:500}}>{fmt2(DEFAULT_COSTS[key])}</td>
                    </tr>
                  ))}
                  <tr style={{borderTop:`2px solid ${C.border}`}}>
                    <td style={{padding:"8px 0",fontWeight:600,color:C.dark}}>Total</td>
                    <td style={{textAlign:"right",padding:"8px 0",fontWeight:600,color:C.red}}>₹{fmt2(Object.values(DEFAULT_COSTS).reduce((s,v)=>s+v,0))}</td>
                  </tr>
                </tbody>
              </table>
              <div style={{marginTop:14,padding:"10px 14px",background:C.yellowLight,borderRadius:8,border:`1px solid ${C.yellowMid}`}}>
                <p style={{fontSize:12,color:"#7a5c00",margin:0,lineHeight:1.6}}>
                  <strong>Note:</strong> Default costs are sourced from the <em>Wheat Flour Supply Chain Analysis</em> by the Food Fortification Initiative (FFI), State of Haryana, India, December 2016. They are a starting point — costs will vary by state and context. Use <em>Edit costs</em> to enter figures that reflect your program.
                </p>
              </div>
            </div>
          </>
        )}

      </div>
    </>
  );
}