import { useState, useMemo } from "react";

const INDIAN_STATES = ["Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal","Delhi","Jammu & Kashmir","Ladakh","Puducherry","Chandigarh","Dadra & Nagar Haveli","Daman & Diu","Lakshadweep","Andaman & Nicobar Islands"];

const DEFAULTS = {
  State:    { procurement:24.22, transportMilling:0.57, milling:3.69, packaging:0.84, fortification:0.28, transportDist:0.50 },
  District: { procurement:24.22, transportMilling:0.43, milling:3.97, packaging:0.84, fortification:0.28, transportDist:0.36 },
  Block:    { procurement:24.22, transportMilling:0.85, milling:4.32, packaging:2.31, fortification:0.28, transportDist:0.78 },
};

const ALL_COSTS = [
  { key:"procurement",      label:"Procurement",                   grainAdd:false, flourAdd:false },
  { key:"transportMilling", label:"Transport for milling",         grainAdd:true,  flourAdd:false },
  { key:"milling",          label:"Milling (cleaning & grinding)", grainAdd:true,  flourAdd:false },
  { key:"packaging",        label:"Packaging",                     grainAdd:true,  flourAdd:false },
  { key:"fortification",    label:"Fortification costs",           grainAdd:true,  flourAdd:true  },
  { key:"transportDist",    label:"Transport for distribution",    grainAdd:true,  flourAdd:false },
];

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
      <p style={{fontSize:12,color:C.light}}>Enter population &amp; kg/beneficiary<br/>to see cost breakdown</p>
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

const HOW_TO = [
  {
    icon:"📋", title:"Fill in the inputs",
    points:[
      "Select the state and geography level (State, District, or Block)",
      "Choose the commodity currently being supplied — wheat grain or wheat flour",
      "Enter the total number of beneficiaries and their monthly kg allocation",
    ]
  },
  {
    icon:"📊", title:"Interpret the results",
    points:[
      "The top cards show target annual volume, cost per kg, and total program cost",
      "The cost breakdown table lists every cost category",
      "Rows highlighted in yellow are additional costs introduced by switching to fortified atta",
      "These additional costs are also shown in the pie chart on the right",
    ]
  },
  {
    icon:"✏️", title:"Edit or add costs",
    points:[
      "Default costs come from an FFI case study in Haryana — use them as a starting point",
      "Click 'Edit costs' to enter your own unit costs for any category",
      "Use '+ Add cost category' to include costs specific to your context (e.g. storage)",
      "All changes update the total automatically",
    ]
  },
];

export default function App() {
  const [geoName, setGeoName] = useState("");
  const [geoLevel, setGeoLevel] = useState("State");
  const [supplyType, setSupplyType] = useState("Wheat Grain");
  const [population, setPopulation] = useState("");
  const [kgPerBenef, setKgPerBenef] = useState("");
  const [customMode, setCustomMode] = useState(false);
  const [customCosts, setCustomCosts] = useState({...DEFAULTS["State"]});
  const [extraCats, setExtraCats] = useState([]);
  const [newLabel, setNewLabel] = useState("");
  const [newCost, setNewCost] = useState("");
  const [guideOpen, setGuideOpen] = useState(false);

  const costs = customMode ? customCosts : DEFAULTS[geoLevel];
  const isGrain = supplyType === "Wheat Grain";

  const handleLevelChange = lvl => { setGeoLevel(lvl); if (!customMode) setCustomCosts({...DEFAULTS[lvl]}); };
  const handleReset = () => { setCustomCosts({...DEFAULTS[geoLevel]}); setExtraCats([]); };

  const addCategory = () => {
    if (!newLabel.trim()) return;
    setExtraCats(p=>[...p, { id:Date.now(), label:newLabel.trim(), cost:parseFloat(newCost)||0 }]);
    setNewLabel(""); setNewCost("");
  };

  const removeExtra = id => setExtraCats(p=>p.filter(e=>e.id!==id));
  const updateExtra = (id,val) => setExtraCats(p=>p.map(e=>e.id===id?{...e,cost:parseFloat(val)||0}:e));

  const targetVol = useMemo(()=>{
    const p=parseFloat(population),k=parseFloat(kgPerBenef);
    return (!p||!k)?0:p*k*12;
  },[population,kgPerBenef]);

  const additionalKeys = ALL_COSTS.filter(c=>isGrain?c.grainAdd:c.flourAdd).map(c=>c.key);
  const extraUnitTotal = extraCats.reduce((s,e)=>s+e.cost,0);
  const baseUnitTotal = ALL_COSTS.reduce((s,c)=>s+(parseFloat(costs[c.key])||0),0);
  const unitTotal = baseUnitTotal + extraUnitTotal;
  const totalCost = unitTotal * targetVol;

  const additionalUnitTotal = additionalKeys.reduce((s,k)=>s+(parseFloat(costs[k])||0),0) + extraUnitTotal;
  const additionalTotal = additionalUnitTotal * targetVol;

  const flourFortCost = (parseFloat(costs["fortification"])||0) * targetVol;

  const pieData = [
    ...additionalKeys.map(k=>({ label:ALL_COSTS.find(c=>c.key===k)?.label||k, value:(parseFloat(costs[k])||0)*targetVol })),
    ...extraCats.map(e=>({ label:e.label, value:e.cost*targetVol }))
  ].filter(d=>d.value>0);

  const volMT = targetVol > 0 ? (targetVol/1000).toFixed(2) : null;
  const cardShadow = "0 1px 4px rgba(0,151,167,0.06)";

  const bubbleText = isGrain
    ? `This total covers all costs including procurement and distribution costs you may already be incurring. Your net additional cost for switching to fortified atta is ${fmtBig(additionalTotal)}.`
    : `This total includes milling, packaging, and other costs you already incur. Your net additional cost for adding fortification is ${fmtBig(flourFortCost)}.`;

  return (
    <>
      <style>{globalStyle}</style>

      {/* Header */}
      <div style={{background:`linear-gradient(135deg, ${C.red} 0%, #c94d46 100%)`,padding:"2rem 2rem 1.75rem"}}>
        <div style={{maxWidth:920,margin:"0 auto"}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
            <span style={{fontSize:28}}>🌾</span>
            <h1 style={{fontSize:24,fontWeight:600,color:"#fff",margin:0}}>Fortified atta budget calculator</h1>
          </div>
          <p style={{fontSize:14,color:"rgba(255,255,255,0.8)",margin:0}}>Estimate annual program costs for fortified atta distribution by geography and scale.</p>
        </div>
      </div>

      <div style={{maxWidth:920,margin:"0 auto",padding:"1.5rem 1.5rem 3rem"}}>

        {/* How to use */}
        <div style={{background:"#fff",border:`1px solid ${C.border}`,borderRadius:14,marginBottom:"1rem",boxShadow:cardShadow,overflow:"hidden"}}>
          <button onClick={()=>setGuideOpen(o=>!o)} style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"1rem 1.5rem",background:"none",border:"none",textAlign:"left"}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:6,height:20,background:C.yellow,borderRadius:3}}/>
              <span style={{fontSize:13,fontWeight:600,color:C.dark,textTransform:"uppercase",letterSpacing:"0.06em"}}>How to use this calculator</span>
            </div>
            <span style={{fontSize:18,color:C.light,lineHeight:1}}>{guideOpen?"−":"+"}</span>
          </button>
          {guideOpen&&(
            <div style={{padding:"0 1.5rem 1.25rem",borderTop:`1px solid ${C.border}`}}>
              <p style={{fontSize:13,color:C.mid,margin:"1rem 0 1.25rem",lineHeight:1.7}}>This tool helps program managers and stakeholders estimate the annual cost of introducing fortified atta into an existing food distribution program.</p>
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
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(155px,1fr))",gap:14}}>
            <div><Label>Geography name</Label><select value={geoName} onChange={e=>setGeoName(e.target.value)}><option value="">Select a state…</option>{INDIAN_STATES.map(s=><option key={s}>{s}</option>)}</select></div>
            <div><Label>Geography level</Label><select value={geoLevel} onChange={e=>handleLevelChange(e.target.value)}><option>State</option><option>District</option><option>Block</option></select></div>
            <div><Label>Currently supply</Label><select value={supplyType} onChange={e=>setSupplyType(e.target.value)}><option>Wheat Grain</option><option>Wheat Flour</option></select></div>
            <div><Label>Population size</Label><input type="number" placeholder="Total beneficiaries" value={population} onChange={e=>setPopulation(e.target.value)}/></div>
            <div><Label>Kg / beneficiary (monthly)</Label><input type="number" placeholder="Amount in kg" value={kgPerBenef} onChange={e=>setKgPerBenef(e.target.value)}/></div>
          </div>
        </div>

        {/* Summary cards */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1.3fr",gap:12,marginBottom:"1rem"}}>
          <div style={{background:"#fff",border:`1px solid ${C.border}`,borderRadius:12,padding:"1.1rem 1.25rem",boxShadow:cardShadow}}>
            <p style={{fontSize:11,fontWeight:600,color:C.mid,textTransform:"uppercase",letterSpacing:"0.05em",margin:"0 0 6px"}}>Target volume / year</p>
            <p style={{fontSize:26,fontWeight:600,color:C.dark,margin:0,lineHeight:1.1}}>{volMT ? `${volMT} MT` : "—"}</p>
            {volMT&&<p style={{fontSize:11,color:C.light,margin:"3px 0 0"}}>{targetVol.toLocaleString("en-IN")} kg</p>}
          </div>
          <div style={{background:"#fff",border:`1px solid ${C.border}`,borderRadius:12,padding:"1.1rem 1.25rem",boxShadow:cardShadow}}>
            <p style={{fontSize:11,fontWeight:600,color:C.mid,textTransform:"uppercase",letterSpacing:"0.05em",margin:"0 0 6px"}}>Cost / kg</p>
            <p style={{fontSize:26,fontWeight:600,color:C.dark,margin:0,lineHeight:1.1}}>₹{fmt2(unitTotal)}<span style={{fontSize:13,fontWeight:400,color:C.light}}> /kg</span></p>
            <p style={{fontSize:11,color:C.light,margin:"3px 0 0"}}>{geoLevel} level</p>
          </div>
          <div style={{background:`linear-gradient(135deg, ${C.teal} 0%, #007b8a 100%)`,borderRadius:12,padding:"1.1rem 1.25rem",position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",right:-16,top:-16,width:80,height:80,borderRadius:"50%",background:"rgba(255,255,255,0.08)"}}/>
            <div style={{position:"absolute",right:20,bottom:-20,width:60,height:60,borderRadius:"50%",background:"rgba(255,255,255,0.06)"}}/>
            <p style={{fontSize:11,fontWeight:600,color:"rgba(255,255,255,0.75)",textTransform:"uppercase",letterSpacing:"0.05em",margin:"0 0 6px"}}>Total program cost</p>
            <p style={{fontSize:26,fontWeight:600,color:"#fff",margin:0,lineHeight:1.1}}>{fmtBig(totalCost)}</p>
            <p style={{fontSize:11,color:"rgba(255,255,255,0.65)",margin:"3px 0 0"}}>{geoName||"—"} · {geoLevel}</p>
          </div>
        </div>

        {/* Context bubble */}
        {targetVol > 0 && (
          <div style={{background:C.sand,borderRadius:10,padding:"10px 16px",marginBottom:"1rem",border:`1px solid #c9c4b8`}}>
            <p style={{fontSize:12,color:"#4a4438",lineHeight:1.65,margin:0}}>
              <strong>💡 Note for {isGrain?"wheat grain":"wheat flour"} suppliers:</strong> {bubbleText}
            </p>
          </div>
        )}

        {/* Breakdown + Additional */}
        <div style={{display:"grid",gridTemplateColumns:"1.6fr 1fr",gap:12,marginBottom:"1rem",alignItems:"start"}}>
          <div style={{background:"#fff",border:`1px solid ${C.border}`,borderRadius:14,padding:"1.25rem 1.5rem",boxShadow:cardShadow}}>
            <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:14}}>
              <SectionTitle sub="Unit costs and total annual costs">Cost breakdown</SectionTitle>
              <button onClick={()=>{ if(!customMode) setCustomCosts({...DEFAULTS[geoLevel]}); setCustomMode(!customMode); }}
                style={{fontSize:12,padding:"7px 14px",background:customMode?C.tealLight:"#f5f8f8",color:customMode?C.teal:C.mid,border:`1.5px solid ${customMode?C.teal:C.border}`,borderRadius:8,fontWeight:500,flexShrink:0,marginLeft:8}}>
                {customMode?"✓ Custom on":"Edit costs"}
              </button>
            </div>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
              <thead>
                <tr style={{borderBottom:`1.5px solid ${C.border}`}}>
                  <th style={{textAlign:"left",padding:"6px 0",color:C.light,fontWeight:500,fontSize:12}}>Category</th>
                  <th style={{textAlign:"right",padding:"6px 8px",color:C.light,fontWeight:500,fontSize:12}}>₹/kg</th>
                  <th style={{textAlign:"right",padding:"6px 0",color:C.light,fontWeight:500,fontSize:12}}>Total</th>
                </tr>
              </thead>
              <tbody>
                {ALL_COSTS.map(({key,label,grainAdd,flourAdd})=>{
                  const uc=parseFloat(costs[key])||0;
                  const isAdd=isGrain?grainAdd:flourAdd;
                  return (
                    <tr key={key} style={{borderBottom:`1px solid ${C.border}`,background:isAdd?C.yellowLight:"transparent"}}>
                      <td style={{padding:"8px 0"}}>
                        <div style={{display:"flex",alignItems:"center",gap:7}}>
                          {isAdd?<span style={{fontSize:9,padding:"2px 6px",borderRadius:10,background:C.yellow,color:"#7a5c00",fontWeight:600}}>+</span>:<span style={{width:14,display:"inline-block"}}/>}
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
                  <td style={{padding:"10px 0",fontWeight:600,color:C.red}}>Total</td>
                  <td style={{textAlign:"right",padding:"10px 8px",fontWeight:600,color:C.red}}>₹{fmt2(unitTotal)}</td>
                  <td style={{textAlign:"right",padding:"10px 0",fontWeight:600,color:C.red}}>{fmtBig(totalCost)}</td>
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
              <button onClick={handleReset} style={{marginTop:10,fontSize:12,padding:"6px 12px",background:C.redLight,color:C.red,border:`1px solid ${C.redMid}`,borderRadius:7,fontWeight:500}}>
                Reset to defaults
              </button>
            )}
          </div>

          <div style={{background:"#fff",border:`1px solid ${C.border}`,borderRadius:14,padding:"1.25rem 1.5rem",boxShadow:cardShadow}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4,flexWrap:"wrap"}}>
              <p style={{fontSize:15,fontWeight:600,color:C.dark,margin:0}}>Additional costs</p>
              <span style={{fontSize:11,padding:"3px 10px",borderRadius:20,background:isGrain?C.yellowLight:C.tealLight,color:isGrain?"#7a5c00":C.teal,fontWeight:600,border:`1px solid ${isGrain?C.yellowMid:C.tealMid}`}}>{supplyType}</span>
            </div>
            <p style={{fontSize:12,color:C.light,margin:"0 0 14px"}}>
              {isGrain?"Distribution costs beyond procurement":"Fortification only — flour already milled & packaged"}
            </p>
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
          <SectionTitle sub="Default unit costs (₹/kg) across geography levels">Default costs reference</SectionTitle>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
            <thead>
              <tr style={{borderBottom:`1.5px solid ${C.border}`}}>
                <th style={{textAlign:"left",padding:"5px 0",color:C.light,fontWeight:500}}>Category</th>
                {["State","District","Block"].map(l=>(
                  <th key={l} style={{textAlign:"right",padding:"5px 10px",fontWeight:600,fontSize:11}}>
                    <span style={{padding:"3px 10px",borderRadius:20,background:C.tealLight,color:C.teal}}>{l}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ALL_COSTS.map(({key,label})=>(
                <tr key={key} style={{borderBottom:`1px solid ${C.border}`}}>
                  <td style={{padding:"6px 0",color:C.mid}}>{label}</td>
                  {["State","District","Block"].map(l=><td key={l} style={{textAlign:"right",padding:"6px 10px",color:C.dark,fontWeight:500}}>{fmt2(DEFAULTS[l][key])}</td>)}
                </tr>
              ))}
              <tr style={{borderTop:`2px solid ${C.border}`}}>
                <td style={{padding:"8px 0",fontWeight:600,color:C.dark}}>Total</td>
                {["State","District","Block"].map(l=><td key={l} style={{textAlign:"right",padding:"8px 10px",fontWeight:600,color:C.red}}>₹{fmt2(Object.values(DEFAULTS[l]).reduce((s,v)=>s+v,0))}</td>)}
              </tr>
            </tbody>
          </table>
          <div style={{marginTop:14,padding:"10px 14px",background:C.yellowLight,borderRadius:8,border:`1px solid ${C.yellowMid}`}}>
            <p style={{fontSize:12,color:"#7a5c00",margin:0,lineHeight:1.6}}>
              <strong>Note:</strong> Default costs are sourced from the <em>Wheat Flour Supply Chain Analysis</em> by the Food Fortification Initiative (FFI), State of Haryana, India, December 2016. They are provided as a starting point — use <em>Edit costs</em> to enter your own unit costs, and <em>Add cost category</em> to include any additional costs specific to your context.
            </p>
          </div>
        </div>

      </div>
    </>
  );
}