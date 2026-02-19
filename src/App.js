import { useState, useCallback } from "react";

// ─── BRAND ────────────────────────────────────────────────────────────────────

const B = {
  black:"#0D0D0D", green:"#158158", greenLight:"#1AAA6E",
  greenBright:"#22C97A", greenDark:"#0D6B48", white:"#FFFFFF",
  offWhite:"#F5F5F5", cardBg:"#F8F8F8", gray:"#888888",
  darkGray:"#444444", greenBg:"#EBF5F0", red:"#D94F4F",
  redBg:"#FDF2F2", amber:"#D4A017", amberBg:"#FFFBEB",
};

// ─── PLAYS ───────────────────────────────────────────────────────────────────

const PLAYS = [
  {
    id:"code-review", label:"Code Review", number:"01",
    tagline:"Recover senior engineering time. Ship faster. Catch more bugs.",
    description:"Augment's Context Engine acts as a codebase-aware reviewer on every PR \u2014 cutting repetitive review work by 30\u201350%, flagging real bugs, and accelerating merge cycles across your entire org.",
    savingsRange:[0.30,0.40,0.50], savingsLabel:"Review time recovered",
    evalCategories:[
      {
        id:"throughput", label:"Review Throughput",
        desc:"Focus on PR volume, cycle time, and merge velocity",
        inputs:[
          {key:"devs",label:"Engineers in review",default:50,min:1,max:5000,step:1,unit:""},
          {key:"prsPerMonth",label:"PRs per month (org-wide)",default:300,min:10,max:50000,step:10,unit:""},
          {key:"hoursPerWeek",label:"Hours/week per engineer on review",default:5,min:0.5,max:40,step:0.5,unit:"hrs"},
          {key:"hourlyCost",label:"Fully loaded engineer cost",default:120,min:50,max:400,step:5,unit:"$/hr"},
          {key:"augmentCost",label:"Estimated annual Augment cost",default:180000,min:10000,max:5000000,step:5000,unit:"$"},
        ],
      },
      {
        id:"quality", label:"Quality & Risk",
        desc:"Focus on bug prevention, incidents, and change failure rate",
        inputs:[
          {key:"devs",label:"Engineers in review",default:50,min:1,max:5000,step:1,unit:""},
          {key:"hoursPerWeek",label:"Hours/week per engineer on review",default:5,min:0.5,max:40,step:0.5,unit:"hrs"},
          {key:"reworkRate",label:"% PRs requiring major rework cycles",default:20,min:0,max:80,step:1,unit:"%"},
          {key:"incidentValue",label:"Annual value of avoided incidents",default:150000,min:0,max:5000000,step:10000,unit:"$"},
          {key:"hourlyCost",label:"Fully loaded engineer cost",default:120,min:50,max:400,step:5,unit:"$/hr"},
          {key:"augmentCost",label:"Estimated annual Augment cost",default:180000,min:10000,max:5000000,step:5000,unit:"$"},
        ],
      },
      {
        id:"capacity", label:"Senior Time Recapture",
        desc:"Focus on reviewer hours freed and FTE capacity model",
        inputs:[
          {key:"seniorDevs",label:"Senior engineers doing review",default:15,min:1,max:1000,step:1,unit:""},
          {key:"seniorHoursPerWeek",label:"Hours/week seniors spend on review",default:8,min:1,max:40,step:0.5,unit:"hrs"},
          {key:"seniorHourlyCost",label:"Senior engineer fully loaded cost",default:160,min:80,max:500,step:5,unit:"$/hr"},
          {key:"hourlyCost",label:"Avg engineer cost (all reviewers)",default:120,min:50,max:400,step:5,unit:"$/hr"},
          {key:"devs",label:"Total engineers in review",default:50,min:1,max:5000,step:1,unit:""},
          {key:"augmentCost",label:"Estimated annual Augment cost",default:180000,min:10000,max:5000000,step:5000,unit:"$"},
        ],
      },
    ],
    compute:(v, pct, catId) => {
      let timeSavings=0, reworkSavings=0, incidentValue=v.incidentValue||0;
      if(catId==="capacity"){
        timeSavings = (v.seniorDevs||15)*(v.seniorHoursPerWeek||8)*52*(v.seniorHourlyCost||160)*pct;
      } else {
        timeSavings = (v.devs||50)*(v.hoursPerWeek||5)*52*(v.hourlyCost||120)*pct;
      }
      if(catId==="quality"){
        reworkSavings=((v.prsPerMonth||300)*12)*(( v.reworkRate||20)/100)*0.25*2*(v.hourlyCost||120)*0.30;
      }
      const totalBenefit=timeSavings+reworkSavings+incidentValue;
      const cost=v.augmentCost||180000;
      const roi=((totalBenefit-cost)/cost)*100;
      const payback=cost/(totalBenefit/12);
      const hoursRecovered = catId==="capacity"
        ? (v.seniorDevs||15)*(v.seniorHoursPerWeek||8)*52*pct
        : (v.devs||50)*(v.hoursPerWeek||5)*52*pct;
      return {timeSavings,reworkSavings,incidentValue,totalBenefit,roi,payback,hoursRecovered,fteEquivalent:hoursRecovered/2080};
    },
    metrics:[
      {key:"timeSavings",label:"Review time savings",format:"dollar"},
      {key:"reworkSavings",label:"Rework cycle savings",format:"dollar"},
      {key:"hoursRecovered",label:"Eng hours recovered/yr",format:"hours"},
      {key:"fteEquivalent",label:"FTE capacity recovered",format:"fte"},
      {key:"totalBenefit",label:"Total annual benefit",format:"dollar",highlight:true},
      {key:"roi",label:"Return on investment",format:"percent",highlight:true},
    ],
    benchmarks:[
      {stat:"55\u201370%",label:"Comment address rate (industry-leading)"},
      {stat:"30\u201350%",label:"Reduction in senior review time"},
      {stat:"40%\u2193",label:"Faster time-to-first-review"},
      {stat:"~90%",label:"Bug detection rate"},
    ],
    successThresholds:[
      {key:"ttfr",label:"% Faster Time-to-First-Review",target:40,unit:"%",desc:"Target: \u226540% reduction in TTF-review"},
      {key:"commentRate",label:"Augment Comment Address Rate",target:55,unit:"%",desc:"Target: \u226555% of comments actioned by devs"},
      {key:"prCoverage",label:"% Eligible PRs Receiving Augment Review",target:70,unit:"%",desc:"Target: \u226570% adoption across pilot PRs"},
      {key:"seniorTimeFreed",label:"Senior Time Freed (hrs/week self-reported)",target:3,unit:"hrs",desc:"Target: \u22653 hrs/week per senior reviewer",isAbsolute:true,max:20},
    ],
  },
  {
    id:"unit-test", label:"Unit Test Automation", number:"02",
    tagline:"Give engineers back their week. Ship with confidence.",
    description:"Engineers spend ~10% of their week writing and maintaining unit tests. Augment generates codebase-aware tests, boosts coverage, and auto-fixes CI failures \u2014 removing grunt work without sacrificing quality.",
    savingsRange:[0.30,0.50,0.70], savingsLabel:"Test time automated",
    evalCategories:[
      {
        id:"velocity", label:"Developer Velocity",
        desc:"Focus on time savings and developer hours reclaimed",
        inputs:[
          {key:"devs",label:"Engineers writing/maintaining tests",default:80,min:1,max:5000,step:1,unit:""},
          {key:"testTimePct",label:"% of week spent on unit tests",default:10,min:1,max:30,step:1,unit:"%"},
          {key:"hourlyCost",label:"Fully loaded engineer cost",default:120,min:50,max:400,step:5,unit:"$/hr"},
          {key:"incidentValue",label:"Annual value of avoided defects",default:150000,min:0,max:5000000,step:10000,unit:"$"},
          {key:"augmentCost",label:"Estimated annual Augment cost",default:250000,min:10000,max:5000000,step:5000,unit:"$"},
        ],
      },
      {
        id:"coverage", label:"Coverage Expansion",
        desc:"Focus on coverage % gains and test quality",
        inputs:[
          {key:"devs",label:"Engineers writing/maintaining tests",default:80,min:1,max:5000,step:1,unit:""},
          {key:"currentCoverage",label:"Current avg unit test coverage",default:60,min:0,max:100,step:1,unit:"%"},
          {key:"criticalServices",label:"# of critical services in scope",default:5,min:1,max:100,step:1,unit:""},
          {key:"hourlyCost",label:"Fully loaded engineer cost",default:120,min:50,max:400,step:5,unit:"$/hr"},
          {key:"incidentValue",label:"Annual value of avoided defects",default:150000,min:0,max:5000000,step:10000,unit:"$"},
          {key:"augmentCost",label:"Estimated annual Augment cost",default:250000,min:10000,max:5000000,step:5000,unit:"$"},
        ],
      },
      {
        id:"ci-stability", label:"CI Stability",
        desc:"Focus on CI failure reduction and time-to-green",
        inputs:[
          {key:"ciFailuresPerWeek",label:"Test-related CI failures per week",default:30,min:0,max:500,step:1,unit:""},
          {key:"mttrPerCIFailure",label:"Avg hours to remediate a CI failure",default:1.5,min:0.25,max:8,step:0.25,unit:"hrs"},
          {key:"peoplePerCIFailure",label:"Avg engineers pulled in per failure",default:1.5,min:1,max:10,step:0.5,unit:""},
          {key:"hourlyCost",label:"Fully loaded engineer cost",default:120,min:50,max:400,step:5,unit:"$/hr"},
          {key:"augmentCost",label:"Estimated annual Augment cost",default:250000,min:10000,max:5000000,step:5000,unit:"$"},
        ],
      },
    ],
    compute:(v, pct, catId) => {
      let timeSavings=0, ciSavings=0, incidentValue=v.incidentValue||0;
      if(catId==="ci-stability"){
        const annualFailures=(v.ciFailuresPerWeek||30)*52;
        const currentCost=annualFailures*(v.mttrPerCIFailure||1.5)*(v.peoplePerCIFailure||1.5)*(v.hourlyCost||120);
        ciSavings=currentCost*pct;
        timeSavings=0; incidentValue=0;
      } else {
        const weeklyHours=(v.devs||80)*40*((v.testTimePct||10)/100);
        timeSavings=weeklyHours*52*(v.hourlyCost||120)*pct;
        if(catId!=="coverage") ciSavings=(v.ciFailuresPerWeek||30)*52*1.5*(v.hourlyCost||120)*0.4;
      }
      const totalBenefit=timeSavings+ciSavings+incidentValue;
      const cost=v.augmentCost||250000;
      const roi=((totalBenefit-cost)/cost)*100;
      const payback=cost/(totalBenefit/12);
      const hoursRecovered=catId==="ci-stability"
        ? (v.ciFailuresPerWeek||30)*52*(v.mttrPerCIFailure||1.5)*(v.peoplePerCIFailure||1.5)*pct
        : (v.devs||80)*40*((v.testTimePct||10)/100)*52*pct;
      return {timeSavings,ciSavings,incidentValue,totalBenefit,roi,payback,hoursRecovered,fteEquivalent:hoursRecovered/2080};
    },
    metrics:[
      {key:"timeSavings",label:"Test authoring savings",format:"dollar"},
      {key:"ciSavings",label:"CI triage savings",format:"dollar"},
      {key:"hoursRecovered",label:"Eng hours recovered/yr",format:"hours"},
      {key:"fteEquivalent",label:"FTE capacity recovered",format:"fte"},
      {key:"totalBenefit",label:"Total annual benefit",format:"dollar",highlight:true},
      {key:"roi",label:"Return on investment",format:"percent",highlight:true},
    ],
    benchmarks:[
      {stat:"~10%",label:"Of dev week spent on unit tests"},
      {stat:"30\u201350%",label:"Reduction in test-related CI failures"},
      {stat:"\u226580%",label:"Generated test correctness target"},
      {stat:"3\u20135\u00d7",label:"ROI with time + defect avoidance"},
    ],
    successThresholds:[
      {key:"timeReduction",label:"% Reduction in Test-Writing Time (pilot modules)",target:50,unit:"%",desc:"Target: \u226550% reduction on pilot-scope modules"},
      {key:"coverageGain",label:"Coverage Gain on Pilot Targets (pts)",target:20,unit:"pts",desc:"Target: \u2265+20 pts coverage on pilot services",isAbsolute:true,max:40},
      {key:"testCorrectness",label:"% Generated Tests Considered Correct / Usable",target:80,unit:"%",desc:"Target: \u226580% correctness as judged by devs or CI"},
    ],
  },
  {
    id:"build-failure", label:"Build Failure Analyzer", number:"03",
    tagline:"From red to green in minutes, not hours.",
    description:"Augment correlates code changes, tests, logs, and ownership into a coherent triage story \u2014 diagnosing failures, routing to the right engineer, and proposing fixes before the team opens Slack.",
    savingsRange:[0.50,0.70,0.80], savingsLabel:"MTTR reduction",
    evalCategories:[
      {
        id:"mttr", label:"MTTR Reduction",
        desc:"Focus on time-to-green and remediation speed",
        inputs:[
          {key:"failuresPerWeek",label:"Build failures per week",default:50,min:1,max:5000,step:1,unit:""},
          {key:"mttrHours",label:"Current MTTR per failure (hours)",default:3,min:0.25,max:24,step:0.25,unit:"hrs"},
          {key:"peoplePerFailure",label:"Avg engineers per failure",default:2,min:1,max:20,step:0.5,unit:""},
          {key:"hourlyCost",label:"Blended hourly cost (dev + SRE)",default:130,min:50,max:400,step:5,unit:"$/hr"},
          {key:"augmentCost",label:"Estimated annual Augment cost",default:200000,min:10000,max:5000000,step:5000,unit:"$"},
        ],
      },
      {
        id:"triage", label:"Triage Automation",
        desc:"Focus on auto-classification, routing, and ownership clarity",
        inputs:[
          {key:"failuresPerWeek",label:"Build failures per week",default:50,min:1,max:5000,step:1,unit:""},
          {key:"triageHoursPerFailure",label:"Hours spent triaging per failure (pre-fix)",default:1.5,min:0.25,max:8,step:0.25,unit:"hrs"},
          {key:"triagePeople",label:"People involved in triage per failure",default:2,min:1,max:10,step:0.5,unit:""},
          {key:"hourlyCost",label:"Blended hourly cost (dev + SRE)",default:130,min:50,max:400,step:5,unit:"$/hr"},
          {key:"augmentCost",label:"Estimated annual Augment cost",default:200000,min:10000,max:5000000,step:5000,unit:"$"},
        ],
      },
      {
        id:"reliability", label:"Pipeline Reliability",
        desc:"Focus on trunk lock, release velocity, and blocked developer cost",
        inputs:[
          {key:"trunkLockHours",label:"Avg trunk lock duration per week (hrs)",default:4,min:0,max:40,step:0.5,unit:"hrs"},
          {key:"devsBlocked",label:"Devs blocked during trunk lock",default:50,min:1,max:2000,step:1,unit:""},
          {key:"hourlyCost",label:"Blended hourly cost",default:130,min:50,max:400,step:5,unit:"$/hr"},
          {key:"releaseDelayValue",label:"Annual value of avoided release delays",default:200000,min:0,max:5000000,step:10000,unit:"$"},
          {key:"augmentCost",label:"Estimated annual Augment cost",default:200000,min:10000,max:5000000,step:5000,unit:"$"},
        ],
      },
    ],
    compute:(v, pct, catId) => {
      let timeSavings=0, trunkLockSavings=0, releaseValue=0;
      if(catId==="triage"){
        const annual=(v.failuresPerWeek||50)*52;
        const currentCost=annual*(v.triageHoursPerFailure||1.5)*(v.triagePeople||2)*(v.hourlyCost||130);
        timeSavings=currentCost*pct;
      } else if(catId==="reliability"){
        trunkLockSavings=(v.trunkLockHours||4)*52*(v.devsBlocked||50)*(v.hourlyCost||130)*0.5*0.6;
        releaseValue=v.releaseDelayValue||200000;
      } else {
        const annual=(v.failuresPerWeek||50)*52;
        timeSavings=annual*(v.mttrHours||3)*(v.peoplePerFailure||2)*(v.hourlyCost||130)*pct;
        trunkLockSavings=0;
      }
      const totalBenefit=timeSavings+trunkLockSavings+releaseValue;
      const cost=v.augmentCost||200000;
      const roi=((totalBenefit-cost)/cost)*100;
      const payback=cost/(totalBenefit/12);
      const hoursRecovered=catId==="triage"
        ?(v.failuresPerWeek||50)*52*(v.triageHoursPerFailure||1.5)*(v.triagePeople||2)*pct
        :catId==="reliability"?(v.trunkLockHours||4)*52*(v.devsBlocked||50)*0.5*0.6
        :(v.failuresPerWeek||50)*52*(v.mttrHours||3)*(v.peoplePerFailure||2)*pct;
      const newMttr=catId==="mttr"?(v.mttrHours||3)*(1-pct):null;
      return {timeSavings,trunkLockSavings,releaseValue,totalBenefit,roi,payback,hoursRecovered,fteEquivalent:hoursRecovered/2080,newMttr};
    },
    metrics:[
      {key:"timeSavings",label:"Triage / MTTR savings",format:"dollar"},
      {key:"trunkLockSavings",label:"Trunk lock savings",format:"dollar"},
      {key:"hoursRecovered",label:"Eng hours recovered/yr",format:"hours"},
      {key:"fteEquivalent",label:"FTE capacity recovered",format:"fte"},
      {key:"totalBenefit",label:"Total annual benefit",format:"dollar",highlight:true},
      {key:"roi",label:"Return on investment",format:"percent",highlight:true},
    ],
    benchmarks:[
      {stat:"60\u201380%",label:"MTTR reduction \u2014 hours to minutes"},
      {stat:"65%",label:"Reduction in CI firefighting"},
      {stat:"~10\u00d7",label:"ROI on platform automation"},
      {stat:"2.5%",label:"Dev time lost to flaky tests (recoverable)"},
    ],
    successThresholds:[
      {key:"triageReduction",label:"% Reduction in Average Triage Time",target:60,unit:"%",desc:"Target: \u226560% reduction in time to identify cause"},
      {key:"mttrReduction",label:"% Faster MTTR (Red-to-Green)",target:70,unit:"%",desc:"Target: \u226570% faster mean time to remediation"},
      {key:"autoClassified",label:"% of Failures Auto-Classified / Routed",target:65,unit:"%",desc:"Target: \u226565% of failures classified without manual triage"},
    ],
  },
  {
    id:"interactive", label:"Interactive (IDE + CLI)", number:"04",
    tagline:"Every developer. Every day. Measurable productivity at scale.",
    description:"Augment's IDE and interactive CLI give every engineer a context-aware coding partner \u2014 saving hours on boilerplate, onboarding, and code navigation while consolidating your existing tool sprawl into one unified platform.",
    savingsRange:[0.60,0.80,1.00], savingsLabel:"Productivity uplift captured",
    evalCategories:[
      {
        id:"productivity", label:"Individual Productivity",
        desc:"Focus on hours saved per developer per week",
        inputs:[
          {key:"devs",label:"Active interactive users (IDE/CLI)",default:100,min:1,max:10000,step:1,unit:""},
          {key:"hrsSavedPerWeek",label:"Hours saved per dev per week",default:3,min:0.5,max:15,step:0.5,unit:"hrs"},
          {key:"hourlyCost",label:"Fully loaded engineer cost",default:120,min:50,max:400,step:5,unit:"$/hr"},
          {key:"augmentCost",label:"Estimated annual Augment cost",default:240000,min:10000,max:5000000,step:5000,unit:"$"},
        ],
      },
      {
        id:"onboarding", label:"Team Onboarding",
        desc:"Focus on ramp time savings for new hires and transfers",
        inputs:[
          {key:"devs",label:"Active interactive users (IDE/CLI)",default:100,min:1,max:10000,step:1,unit:""},
          {key:"hrsSavedPerWeek",label:"Hours saved per dev per week",default:3,min:0.5,max:15,step:0.5,unit:"hrs"},
          {key:"onboardingWeeksSaved",label:"Onboarding weeks saved per new hire",default:2,min:0,max:12,step:0.5,unit:"wks"},
          {key:"newDevsPerYear",label:"New hires / major transfers per year",default:20,min:0,max:500,step:1,unit:""},
          {key:"hourlyCost",label:"Fully loaded engineer cost",default:120,min:50,max:400,step:5,unit:"$/hr"},
          {key:"augmentCost",label:"Estimated annual Augment cost",default:240000,min:10000,max:5000000,step:5000,unit:"$"},
        ],
      },
      {
        id:"consolidation", label:"Tool Consolidation",
        desc:"Focus on retired tool spend and cost savings",
        inputs:[
          {key:"devs",label:"Active interactive users (IDE/CLI)",default:100,min:1,max:10000,step:1,unit:""},
          {key:"hrsSavedPerWeek",label:"Hours saved per dev per week",default:3,min:0.5,max:15,step:0.5,unit:"hrs"},
          {key:"hourlyCost",label:"Fully loaded engineer cost",default:120,min:50,max:400,step:5,unit:"$/hr"},
          {key:"retiredToolSpend",label:"Annual retired tool spend (Copilot, etc.)",default:60000,min:0,max:2000000,step:5000,unit:"$"},
          {key:"augmentCost",label:"Estimated annual Augment cost",default:240000,min:10000,max:5000000,step:5000,unit:"$"},
        ],
      },
    ],
    compute:(v, pct, catId) => {
      const annualHours=(v.devs||100)*(v.hrsSavedPerWeek||3)*52;
      const productivityValue=annualHours*pct*(v.hourlyCost||120);
      const onboardingValue=catId==="onboarding"
        ?(v.onboardingWeeksSaved||2)*40*(v.newDevsPerYear||20)*(v.hourlyCost||120):0;
      const toolValue=catId==="consolidation"?(v.retiredToolSpend||60000):0;
      const totalBenefit=productivityValue+onboardingValue+toolValue;
      const cost=v.augmentCost||240000;
      const roi=((totalBenefit-cost)/cost)*100;
      const payback=cost/(totalBenefit/12);
      const hoursRecovered=annualHours*pct;
      return {productivityValue,onboardingValue,toolValue,totalBenefit,roi,payback,hoursRecovered,fteEquivalent:hoursRecovered/2080};
    },
    metrics:[
      {key:"productivityValue",label:"Productivity value",format:"dollar"},
      {key:"onboardingValue",label:"Onboarding savings",format:"dollar"},
      {key:"toolValue",label:"Tool consolidation savings",format:"dollar"},
      {key:"fteEquivalent",label:"FTE capacity recovered",format:"fte"},
      {key:"totalBenefit",label:"Total annual benefit",format:"dollar",highlight:true},
      {key:"roi",label:"Return on investment",format:"percent",highlight:true},
    ],
    benchmarks:[
      {stat:"1\u20135+ hrs",label:"Saved per dev per week in pilots"},
      {stat:"60K+",label:"Annual hours saved at 100-dev scale"},
      {stat:"~10\u00d7",label:"Platform-level ROI in internal decks"},
      {stat:"$3M+",label:"Productivity value at scale"},
    ],
    successThresholds:null,
  },
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────

const fmt=(val,format)=>{
  if(val===undefined||val===null||isNaN(val)) return "\u2014";
  if(format==="dollar") return "$"+Math.round(val).toLocaleString();
  if(format==="percent") return Math.round(val)+"%";
  if(format==="hours") return Math.round(val).toLocaleString()+" hrs";
  if(format==="hours_val") return val<1?Math.round(val*60)+" min":val.toFixed(1)+" hrs";
  if(format==="fte") return val.toFixed(1)+" FTEs";
  return String(val);
};

const SL=["Conservative","Midpoint","Optimistic"];

// ─── SLIDER ───────────────────────────────────────────────────────────────────

function Slider({input,value,onChange}){
  const pct=((value-input.min)/(input.max-input.min))*100;
  const dv=input.unit==="$"?"$"+value.toLocaleString()
    :input.unit==="%"?value+"%"
    :input.unit==="$/hr"?"$"+value+"/hr"
    :input.unit==="hrs"?value+" hrs"
    :input.unit==="wks"?value+" wks"
    :value.toLocaleString();
  return(
    <div style={{marginBottom:16}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:5}}>
        <label style={{fontSize:10,color:B.gray,letterSpacing:"0.05em",textTransform:"uppercase",fontWeight:500}}>{input.label}</label>
        <span style={{fontSize:13,fontWeight:700,color:B.green}}>{dv}</span>
      </div>
      <div style={{position:"relative",height:4}}>
        <div style={{position:"absolute",inset:0,background:B.offWhite,borderRadius:2}}/>
        <div style={{position:"absolute",top:0,left:0,bottom:0,width:pct+"%",background:B.green,borderRadius:2,transition:"width 0.08s"}}/>
        <input type="range" min={input.min} max={input.max} step={input.step} value={value}
          onChange={e=>onChange(input.key,parseFloat(e.target.value))}
          style={{position:"absolute",top:-8,left:0,width:"100%",height:20,WebkitAppearance:"none",appearance:"none",background:"transparent",outline:"none",cursor:"pointer",margin:0}}/>
      </div>
    </div>
  );
}

// ─── METRIC CARD ─────────────────────────────────────────────────────────────

function MetricCard({metric,value}){
  const f=fmt(value,metric.format);
  if(metric.highlight){
    const neg=metric.format==="percent"&&value<0;
    return(
      <div style={{background:neg?B.redBg:B.greenBg,border:`2px solid ${neg?B.red:B.green}`,borderRadius:4,padding:"14px 16px"}}>
        <div style={{fontSize:8,color:B.green,textTransform:"uppercase",letterSpacing:"0.1em",fontWeight:700,marginBottom:5}}>{metric.label}</div>
        <div style={{fontSize:24,fontWeight:700,color:neg?B.red:B.greenDark,lineHeight:1}}>{f}</div>
      </div>
    );
  }
  return(
    <div style={{background:B.cardBg,border:"1px solid #E8E8E8",borderLeft:`3px solid ${B.green}`,borderRadius:4,padding:"12px 14px"}}>
      <div style={{fontSize:8,color:B.gray,textTransform:"uppercase",letterSpacing:"0.1em",fontWeight:500,marginBottom:4}}>{metric.label}</div>
      <div style={{fontSize:18,fontWeight:700,color:B.black,lineHeight:1}}>{f}</div>
    </div>
  );
}

// ─── THRESHOLD METER ─────────────────────────────────────────────────────────

function ThresholdMeter({threshold,value,onChange}){
  const max=threshold.isAbsolute?threshold.max:100;
  const pct=(value/max)*100;
  const targetPct=(threshold.target/max)*100;
  const met=value>=threshold.target;
  const color=met?B.green:value>=(threshold.target*0.75)?B.amber:B.red;
  const bgColor=met?B.greenBg:value>=(threshold.target*0.75)?B.amberBg:B.redBg;
  return(
    <div style={{background:bgColor,border:`1px solid ${color}33`,borderLeft:`3px solid ${color}`,borderRadius:4,padding:"14px 16px",marginBottom:10}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:6}}>
        <div>
          <div style={{fontSize:10,fontWeight:700,color:B.black,marginBottom:2}}>{threshold.label}</div>
          <div style={{fontSize:9,color:B.gray}}>{threshold.desc}</div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0,marginLeft:12}}>
          <span style={{fontSize:9,color:B.gray}}>Target: <strong style={{color:B.darkGray}}>{threshold.target}{threshold.unit}</strong></span>
          <span style={{fontSize:16,fontWeight:700,color}}>{value}{threshold.unit}</span>
          <span style={{fontSize:14}}>{met?"\u2713":"\u25CB"}</span>
        </div>
      </div>
      <div style={{position:"relative",height:6,background:"rgba(0,0,0,0.08)",borderRadius:3}}>
        <div style={{position:"absolute",top:0,left:0,bottom:0,width:Math.min(100,pct)+"%",background:color,borderRadius:3,transition:"width 0.1s"}}/>
        <div style={{position:"absolute",top:-2,left:targetPct+"%",width:2,height:10,background:B.darkGray,borderRadius:1,transform:"translateX(-50%)"}}/>
        <input type="range" min={0} max={max} step={threshold.isAbsolute?1:1} value={value}
          onChange={e=>onChange(threshold.key,parseFloat(e.target.value))}
          style={{position:"absolute",top:-8,left:0,width:"100%",height:20,WebkitAppearance:"none",appearance:"none",background:"transparent",outline:"none",cursor:"pointer",margin:0}}/>
      </div>
      <div style={{display:"flex",justifyContent:"flex-end",marginTop:4}}>
        <span style={{fontSize:8,color,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em"}}>{met?"\u2713 Threshold Met":"Below Target"}</span>
      </div>
    </div>
  );
}

// ─── EVAL CATEGORY DROPDOWN ───────────────────────────────────────────────────

function EvalCategorySelector({play,selectedCat,onSelect}){
  const [open,setOpen]=useState(false);
  const current=play.evalCategories.find(c=>c.id===selectedCat)||play.evalCategories[0];
  return(
    <div style={{position:"relative",marginBottom:16}}>
      <div style={{fontSize:9,color:B.green,letterSpacing:"0.12em",textTransform:"uppercase",fontWeight:700,marginBottom:6}}>Evaluation Category</div>
      <button onClick={()=>setOpen(!open)} style={{
        width:"100%",background:B.white,border:`1px solid ${B.green}`,borderRadius:4,
        padding:"10px 14px",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",
        textAlign:"left",
      }}>
        <div>
          <div style={{fontSize:11,fontWeight:700,color:B.black}}>{current.label}</div>
          <div style={{fontSize:10,color:B.gray,marginTop:2}}>{current.desc}</div>
        </div>
        <span style={{fontSize:10,color:B.green,marginLeft:8,flexShrink:0}}>{open?"\u25B2":"\u25BC"}</span>
      </button>
      {open&&(
        <div style={{position:"absolute",top:"100%",left:0,right:0,background:B.white,border:`1px solid ${B.green}`,borderTop:"none",borderRadius:"0 0 4px 4px",zIndex:100,boxShadow:"0 4px 12px rgba(0,0,0,0.1)"}}>
          {play.evalCategories.map((cat,i)=>(
            <button key={cat.id} onClick={()=>{onSelect(cat.id);setOpen(false);}} style={{
              width:"100%",background:selectedCat===cat.id?B.greenBg:B.white,
              border:"none",borderBottom:i<play.evalCategories.length-1?"1px solid #F0F0F0":"none",
              padding:"10px 14px",cursor:"pointer",textAlign:"left",display:"block",
            }}>
              <div style={{fontSize:11,fontWeight:700,color:selectedCat===cat.id?B.greenDark:B.black}}>{cat.label}</div>
              <div style={{fontSize:10,color:B.gray,marginTop:2}}>{cat.desc}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── PLAY TAB ─────────────────────────────────────────────────────────────────

function PlayTab({play,vals,onChange,scenarioIdx,setScenarioIdx,selectedCat,setSelectedCat,thresholds,onThresholdChange}){
  const pct=play.savingsRange[scenarioIdx];
  const results=play.compute(vals,pct,selectedCat);
  const roiMultiple=(results.totalBenefit/(vals.augmentCost||180000)).toFixed(1);
  const currentCat=play.evalCategories.find(c=>c.id===selectedCat)||play.evalCategories[0];
  const thresholdResults=play.successThresholds
    ?play.successThresholds.map(t=>({...t,value:thresholds[t.key]??t.target,met:(thresholds[t.key]??0)>=t.target}))
    :[];
  const metCount=thresholdResults.filter(t=>t.met).length;
  return(
    <div>
      {/* Play header */}
      <div style={{background:B.black,padding:"22px 32px 20px",borderBottom:`4px solid ${B.green}`}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",flexWrap:"wrap",gap:16}}>
          <div style={{flex:1}}>
            <div style={{fontSize:9,color:B.greenBright,letterSpacing:"0.14em",textTransform:"uppercase",fontWeight:700,marginBottom:5}}>AUTOMATION PLAY {play.number} \u00b7 {currentCat.label}</div>
            <h2 style={{fontSize:20,fontWeight:700,color:B.white,marginBottom:5,lineHeight:1.2}}>{play.label}</h2>
            <p style={{fontSize:12,color:B.greenLight,fontWeight:500,marginBottom:6}}>{play.tagline}</p>
            <p style={{fontSize:10,color:B.gray,lineHeight:1.7,maxWidth:580}}>{play.description}</p>
          </div>
          <div style={{display:"flex",gap:10,flexShrink:0}}>
            {play.successThresholds&&(
              <div style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:4,padding:"12px 16px",textAlign:"center"}}>
                <div style={{fontSize:9,color:"rgba(255,255,255,0.5)",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:3}}>Pilot Success</div>
                <div style={{fontSize:22,fontWeight:700,color:metCount===thresholdResults.length?B.greenBright:B.amber,lineHeight:1}}>{metCount}/{thresholdResults.length}</div>
                <div style={{fontSize:9,color:"rgba(255,255,255,0.5)",marginTop:2}}>thresholds met</div>
              </div>
            )}
            <div style={{background:B.green,borderRadius:4,padding:"12px 20px",textAlign:"center"}}>
              <div style={{fontSize:9,color:"rgba(255,255,255,0.65)",letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:3}}>ROI Multiple</div>
              <div style={{fontSize:32,fontWeight:700,color:B.white,lineHeight:1}}>{roiMultiple}\u00d7</div>
              <div style={{fontSize:9,color:"rgba(255,255,255,0.65)",marginTop:2,textTransform:"uppercase",letterSpacing:"0.08em"}}>{SL[scenarioIdx]}</div>
            </div>
          </div>
        </div>
      </div>
      {/* Main grid */}
      <div style={{padding:"20px 32px",display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
        {/* LEFT */}
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <div style={{background:B.white,border:"1px solid #E8E8E8",borderTop:`3px solid ${B.green}`,borderRadius:4,padding:"18px 20px"}}>
            <EvalCategorySelector play={play} selectedCat={selectedCat} onSelect={cat=>{setSelectedCat(cat);}} />
            <div style={{borderTop:"1px solid #F0F0F0",paddingTop:14,marginTop:2}}>
              <div style={{fontSize:9,color:B.green,letterSpacing:"0.12em",textTransform:"uppercase",fontWeight:700,marginBottom:14}}>Input Your Numbers</div>
              {currentCat.inputs.map(inp=>(
                <Slider key={inp.key} input={inp} value={vals[inp.key]??inp.default} onChange={onChange}/>
              ))}
            </div>
          </div>
          {/* Scenario */}
          <div style={{background:B.white,border:"1px solid #E8E8E8",borderRadius:4,padding:"14px 16px"}}>
            <div style={{fontSize:9,color:B.green,letterSpacing:"0.12em",textTransform:"uppercase",fontWeight:700,marginBottom:10}}>{play.savingsLabel} \u2014 Scenario</div>
            <div style={{display:"flex",gap:8}}>
              {SL.map((label,i)=>(
                <button key={label} onClick={()=>setScenarioIdx(i)} style={{
                  flex:1,padding:"9px 6px",borderRadius:4,
                  border:`1px solid ${scenarioIdx===i?B.green:"#E0E0E0"}`,
                  background:scenarioIdx===i?B.greenBg:B.white,
                  color:scenarioIdx===i?B.greenDark:B.gray,
                  fontWeight:700,fontSize:9,cursor:"pointer",transition:"all 0.15s",textAlign:"center",
                }}>
                  <div style={{textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:2}}>{label}</div>
                  <div style={{fontSize:14,color:scenarioIdx===i?B.green:B.darkGray}}>{Math.round(play.savingsRange[i]*100)}%</div>
                </button>
              ))}
            </div>
          </div>
          {/* Benchmarks */}
          <div style={{background:B.black,borderRadius:4,padding:"14px 16px"}}>
            <div style={{fontSize:9,color:B.greenBright,letterSpacing:"0.12em",textTransform:"uppercase",fontWeight:700,marginBottom:10}}>Validated Pilot Outcomes</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              {play.benchmarks.map((b,i)=>(
                <div key={i} style={{background:"rgba(255,255,255,0.04)",borderLeft:`2px solid ${B.green}`,borderRadius:2,padding:"8px 10px"}}>
                  <div style={{fontSize:14,fontWeight:700,color:B.greenBright,marginBottom:2}}>{b.stat}</div>
                  <div style={{fontSize:9,color:B.gray,lineHeight:1.4}}>{b.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* RIGHT */}
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          {/* Metrics */}
          <div style={{background:B.white,border:"1px solid #E8E8E8",borderTop:`3px solid ${B.green}`,borderRadius:4,padding:"16px 18px"}}>
            <div style={{fontSize:9,color:B.green,letterSpacing:"0.12em",textTransform:"uppercase",fontWeight:700,marginBottom:12}}>Impact Summary</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              {play.metrics.map(m=><MetricCard key={m.key} metric={m} value={results[m.key]}/>)}
            </div>
          </div>
          {/* Benefit vs Cost */}
          <div style={{background:B.white,border:"1px solid #E8E8E8",borderRadius:4,padding:"16px 18px"}}>
            <div style={{fontSize:9,color:B.green,letterSpacing:"0.12em",textTransform:"uppercase",fontWeight:700,marginBottom:12}}>Benefit vs. Investment</div>
            {[{label:"Total Annual Benefit",value:results.totalBenefit,color:B.green},{label:"Annual Augment Cost",value:vals.augmentCost||180000,color:B.gray}].map(bar=>(
              <div key={bar.label} style={{marginBottom:10}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                  <span style={{fontSize:9,color:B.darkGray,textTransform:"uppercase",letterSpacing:"0.04em"}}>{bar.label}</span>
                  <span style={{fontSize:11,fontWeight:700,color:B.black}}>${DS}{Math.round(bar.value).toLocaleString()}</span>
                </div>
                <div style={{height:5,background:B.offWhite,borderRadius:2,overflow:"hidden"}}>
                  <div style={{height:"100%",width:`${Math.min(100,(bar.value/Math.max(results.totalBenefit,vals.augmentCost||180000))*100)}%`,background:bar.color,borderRadius:2,transition:"width 0.35s ease"}}/>
                </div>
              </div>
            ))}
            <div style={{marginTop:8,padding:"9px 12px",background:results.totalBenefit>(vals.augmentCost||180000)?B.greenBg:B.redBg,border:`1px solid ${results.totalBenefit>(vals.augmentCost||180000)?B.green:B.red}`,borderRadius:4,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{fontSize:9,color:B.darkGray,textTransform:"uppercase",letterSpacing:"0.06em"}}>Net Annual Benefit</span>
              <span style={{fontSize:16,fontWeight:700,color:results.totalBenefit>(vals.augmentCost||180000)?B.greenDark:B.red}}>${DS}{Math.round(results.totalBenefit-(vals.augmentCost||180000)).toLocaleString()}</span>
            </div>
          </div>
          {/* Exec summary */}
          <div style={{background:B.black,borderRadius:4,padding:"14px 16px"}}>
            <div style={{fontSize:9,color:B.greenBright,letterSpacing:"0.12em",textTransform:"uppercase",fontWeight:700,marginBottom:8}}>Executive Summary</div>
            <p style={{fontSize:10,color:"#CCCCCC",lineHeight:1.9}}>
              Using the <span style={{color:B.greenBright,fontWeight:700}}>{currentCat.label}</span> lens at the <span style={{color:B.greenBright,fontWeight:700}}>{SL[scenarioIdx].toLowerCase()}</span> scenario ({Math.round(pct*100)}% {play.savingsLabel.toLowerCase()}), Augment delivers <span style={{color:B.white,fontWeight:700}}>${DS}{Math.round(results.totalBenefit).toLocaleString()}</span> in annual benefit against a <span style={{color:B.white,fontWeight:700}}>${DS}{(vals.augmentCost||180000).toLocaleString()}</span> investment \u2014 a <span style={{color:B.greenBright,fontWeight:700}}>{Math.round(results.roi)}% ROI</span> with payback in <span style={{color:B.greenBright,fontWeight:700}}>{results.payback.toFixed(1)} months</span>. Recovering <span style={{color:B.white,fontWeight:700}}>{results.fteEquivalent.toFixed(1)} FTEs</span> of engineering capacity per year.
            </p>
          </div>
        </div>
      </div>
      {/* Success Thresholds */}
      {play.successThresholds&&(
        <div style={{padding:"0 32px 28px"}}>
          <div style={{background:B.white,border:"1px solid #E8E8E8",borderTop:`3px solid ${B.green}`,borderRadius:4,padding:"18px 20px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
              <div style={{fontSize:9,color:B.green,letterSpacing:"0.12em",textTransform:"uppercase",fontWeight:700}}>Pilot Success Thresholds</div>
              <div style={{fontSize:9,color:B.gray}}>Drag each slider to your actual achieved result</div>
            </div>
            <p style={{fontSize:10,color:B.gray,marginBottom:14,lineHeight:1.6}}>Track actual pilot outcomes against success targets. The marker on each bar shows the minimum threshold \u2014 slide to your achieved result to see pass/fail status.</p>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              {thresholdResults.map(t=>(
                <ThresholdMeter key={t.key} threshold={t} value={thresholds[t.key]??0}
                  onChange={(key,val)=>onThresholdChange(play.id,key,val)}/>
              ))}
            </div>
            <div style={{marginTop:12,padding:"10px 14px",background:metCount===thresholdResults.length?B.greenBg:B.amberBg,border:`1px solid ${metCount===thresholdResults.length?B.green:B.amber}`,borderRadius:4,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{fontSize:10,color:B.darkGray}}>Pilot success score</span>
              <span style={{fontSize:14,fontWeight:700,color:metCount===thresholdResults.length?B.greenDark:B.amber}}>{metCount} of {thresholdResults.length} thresholds met {metCount===thresholdResults.length?"\u2713":"\u2014 in progress"}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── DISABLED TAB ─────────────────────────────────────────────────────────────

function DisabledTab({play,onEnable}){
  return(
    <div style={{padding:"60px 32px",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:16,minHeight:300}}>
      <div style={{width:48,height:48,borderRadius:8,background:B.offWhite,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,color:B.gray}}>\u25CC</div>
      <div style={{textAlign:"center"}}>
        <div style={{fontSize:14,fontWeight:700,color:B.darkGray,marginBottom:4}}>{play.label} is excluded</div>
        <div style={{fontSize:11,color:B.gray}}>This play is not included in the Summary or PDF export.</div>
      </div>
      <button onClick={onEnable} style={{background:B.green,border:"none",borderRadius:4,padding:"9px 20px",cursor:"pointer",color:B.white,fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em"}}>
        + Include This Play
      </button>
    </div>
  );
}

// ─── SUMMARY TAB ─────────────────────────────────────────────────────────────

function SummaryTab({allResults,customerName}){
  if(allResults.length===0) return(
    <div style={{padding:"60px 32px",textAlign:"center"}}>
      <div style={{fontSize:14,color:B.gray,marginBottom:8}}>No plays are currently included.</div>
      <div style={{fontSize:11,color:B.gray}}>Enable at least one play tab to see the summary.</div>
    </div>
  );
  const grandTotal=allResults.reduce((s,r)=>s+r.results.totalBenefit,0);
  const grandCost=allResults.reduce((s,r)=>s+r.augmentCost,0);
  const grandNet=grandTotal-grandCost;
  const grandROI=((grandTotal-grandCost)/grandCost)*100;
  const grandPayback=grandCost/(grandTotal/12);
  const grandFTE=allResults.reduce((s,r)=>s+(r.results.fteEquivalent||0),0);
  const grandHours=allResults.reduce((s,r)=>s+(r.results.hoursRecovered||0),0);
  return(
    <div>
      <div style={{background:B.black,padding:"22px 32px 20px",borderBottom:`4px solid ${B.green}`}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",flexWrap:"wrap",gap:16}}>
          <div style={{flex:1}}>
            <div style={{fontSize:9,color:B.greenBright,letterSpacing:"0.14em",textTransform:"uppercase",fontWeight:700,marginBottom:5}}>COMBINED ROI SUMMARY</div>
            <h2 style={{fontSize:20,fontWeight:700,color:B.white,marginBottom:5}}>{customerName?customerName+" \u00d7 Augment Code":"Full Platform ROI Summary"}</h2>
            <p style={{fontSize:10,color:B.gray,lineHeight:1.7,maxWidth:560}}>Consolidated view across {allResults.length} active automation play{allResults.length>1?"s":""}. Each play contributes independently.</p>
          </div>
          <div style={{display:"flex",gap:10}}>
            {[{label:"Total Annual Benefit",value:"$"+Math.round(grandTotal).toLocaleString()},{label:"Combined ROI",value:Math.round(grandROI)+"%"},{label:"Payback Period",value:grandPayback.toFixed(1)+" mo"}].map(s=>(
              <div key={s.label} style={{background:B.green,borderRadius:4,padding:"10px 16px",textAlign:"center",minWidth:90}}>
                <div style={{fontSize:9,color:"rgba(255,255,255,0.65)",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:3}}>{s.label}</div>
                <div style={{fontSize:s.value.length>8?16:20,fontWeight:700,color:B.white,lineHeight:1}}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div style={{padding:"20px 32px"}}>
        {/* Table */}
        <div style={{background:B.white,border:"1px solid #E8E8E8",borderTop:`3px solid ${B.green}`,borderRadius:4,padding:"18px 20px",marginBottom:18}}>
          <div style={{fontSize:9,color:B.green,letterSpacing:"0.12em",textTransform:"uppercase",fontWeight:700,marginBottom:12}}>Per-Play Breakdown</div>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead>
              <tr style={{borderBottom:`2px solid ${B.green}`}}>
                {["Play","Category","Scenario","Total Benefit","Cost","Net Benefit","ROI","FTEs","Payback"].map(h=>(
                  <th key={h} style={{fontSize:8,color:B.green,textTransform:"uppercase",letterSpacing:"0.08em",fontWeight:700,padding:"0 8px 8px 0",textAlign:"left"}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {allResults.map((r,i)=>(
                <tr key={r.play.id} style={{borderBottom:"1px solid #F0F0F0",background:i%2===0?B.white:B.cardBg}}>
                  <td style={{padding:"10px 8px 10px 0",fontWeight:700,fontSize:11,color:B.black}}>
                    <div style={{display:"flex",alignItems:"center",gap:6}}>
                      <span style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:17,height:17,borderRadius:2,background:B.green,fontSize:7,fontWeight:700,color:B.white,flexShrink:0}}>{r.play.number}</span>
                      {r.play.label}
                    </div>
                  </td>
                  <td style={{padding:"10px 8px 10px 0",fontSize:9,color:B.gray}}>{r.categoryLabel}</td>
                  <td style={{padding:"10px 8px 10px 0",fontSize:9,color:B.gray}}>{SL[r.scenarioIdx]}</td>
                  <td style={{padding:"10px 8px 10px 0",fontSize:11,fontWeight:700,color:B.greenDark}}>${DS}{Math.round(r.results.totalBenefit).toLocaleString()}</td>
                  <td style={{padding:"10px 8px 10px 0",fontSize:11,color:B.darkGray}}>${DS}{Math.round(r.augmentCost).toLocaleString()}</td>
                  <td style={{padding:"10px 8px 10px 0",fontSize:11,fontWeight:700,color:r.results.totalBenefit>r.augmentCost?B.greenDark:B.red}}>${DS}{Math.round(r.results.totalBenefit-r.augmentCost).toLocaleString()}</td>
                  <td style={{padding:"10px 8px 10px 0"}}><span style={{fontSize:11,fontWeight:700,color:B.green,background:B.greenBg,padding:"2px 7px",borderRadius:3}}>{Math.round(r.results.roi)}%</span></td>
                  <td style={{padding:"10px 8px 10px 0",fontSize:11,color:B.darkGray}}>{(r.results.fteEquivalent||0).toFixed(1)}</td>
                  <td style={{padding:"10px 8px 10px 0",fontSize:11,color:B.darkGray}}>{r.results.payback.toFixed(1)} mo</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{borderTop:`2px solid ${B.green}`,background:B.greenBg}}>
                <td colSpan={3} style={{padding:"10px 8px 10px 0",fontSize:11,fontWeight:700,color:B.greenDark}}>TOTAL ({allResults.length} plays)</td>
                <td style={{padding:"10px 8px 10px 0",fontSize:13,fontWeight:700,color:B.greenDark}}>${DS}{Math.round(grandTotal).toLocaleString()}</td>
                <td style={{padding:"10px 8px 10px 0",fontSize:11,color:B.darkGray}}>${DS}{Math.round(grandCost).toLocaleString()}</td>
                <td style={{padding:"10px 8px 10px 0",fontSize:13,fontWeight:700,color:B.greenDark}}>${DS}{Math.round(grandNet).toLocaleString()}</td>
                <td style={{padding:"10px 8px 10px 0"}}><span style={{fontSize:13,fontWeight:700,color:B.white,background:B.green,padding:"3px 9px",borderRadius:3}}>{Math.round(grandROI)}%</span></td>
                <td style={{padding:"10px 8px 10px 0",fontSize:11,fontWeight:700,color:B.greenDark}}>{grandFTE.toFixed(1)}</td>
                <td style={{padding:"10px 8px 10px 0",fontSize:11,fontWeight:700,color:B.greenDark}}>{grandPayback.toFixed(1)} mo</td>
              </tr>
            </tfoot>
          </table>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18,marginBottom:18}}>
          {/* Distribution */}
          <div style={{background:B.white,border:"1px solid #E8E8E8",borderTop:`3px solid ${B.green}`,borderRadius:4,padding:"16px 18px"}}>
            <div style={{fontSize:9,color:B.green,letterSpacing:"0.12em",textTransform:"uppercase",fontWeight:700,marginBottom:12}}>Benefit Distribution by Play</div>
            {allResults.map(r=>{
              const share=grandTotal>0?(r.results.totalBenefit/grandTotal)*100:0;
              return(
                <div key={r.play.id} style={{marginBottom:12}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                    <span style={{fontSize:10,color:B.darkGray,fontWeight:600}}>{r.play.label}</span>
                    <span style={{fontSize:10,fontWeight:700,color:B.black}}>${DS}{Math.round(r.results.totalBenefit).toLocaleString()} <span style={{color:B.gray,fontWeight:400,fontSize:9}}>({share.toFixed(0)}%)</span></span>
                  </div>
                  <div style={{height:5,background:B.offWhite,borderRadius:3,overflow:"hidden"}}>
                    <div style={{height:"100%",width:share+"%",background:B.green,borderRadius:3,transition:"width 0.5s ease"}}/>
                  </div>
                </div>
              );
            })}
          </div>
          {/* KPIs */}
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {[
              {label:"Total Annual Benefit",value:"$"+Math.round(grandTotal).toLocaleString(),sub:"across active plays"},
              {label:"Engineering Hours Recovered",value:Math.round(grandHours).toLocaleString()+" hrs",sub:"per year"},
              {label:"FTE Capacity Recovered",value:grandFTE.toFixed(1)+" FTEs",sub:"equivalent headcount"},
              {label:"Net Annual Return",value:"$"+Math.round(grandNet).toLocaleString(),sub:"benefit minus platform cost"},
            ].map(s=>(
              <div key={s.label} style={{background:B.cardBg,border:"1px solid #E8E8E8",borderLeft:`3px solid ${B.green}`,borderRadius:4,padding:"10px 14px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div>
                  <div style={{fontSize:9,color:B.gray,textTransform:"uppercase",letterSpacing:"0.08em",fontWeight:500}}>{s.label}</div>
                  <div style={{fontSize:9,color:B.gray,marginTop:1}}>{s.sub}</div>
                </div>
                <div style={{fontSize:16,fontWeight:700,color:B.greenDark}}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>
        {/* Exec narrative */}
        <div style={{background:B.black,borderRadius:4,padding:"16px 18px"}}>
          <div style={{fontSize:9,color:B.greenBright,letterSpacing:"0.12em",textTransform:"uppercase",fontWeight:700,marginBottom:8}}>Combined Executive Narrative</div>
          <p style={{fontSize:10,color:"#CCCCCC",lineHeight:1.9,maxWidth:800}}>
            Across {allResults.length} active Augment Code automation play{allResults.length>1?"s":""} ({allResults.map(r=>r.play.label).join(", ")}), the platform delivers a combined <span style={{color:B.white,fontWeight:700}}>${DS}{Math.round(grandTotal).toLocaleString()}</span> in annual benefit against a <span style={{color:B.white,fontWeight:700}}>${DS}{Math.round(grandCost).toLocaleString()}</span> platform investment \u2014 a <span style={{color:B.greenBright,fontWeight:700}}>{Math.round(grandROI)}% combined ROI</span> with a payback period of <span style={{color:B.greenBright,fontWeight:700}}>{grandPayback.toFixed(1)} months</span>, recovering the equivalent of <span style={{color:B.white,fontWeight:700}}>{grandFTE.toFixed(1)} FTEs</span> of engineering capacity annually.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── PDF EXPORT ───────────────────────────────────────────────────────────────

function exportToPDF(allResults,customerName){
  const w=window.open("","_blank");
  if(!w){alert("Please allow popups to export PDF.");return;}
  const grandTotal=allResults.reduce((s,r)=>s+r.results.totalBenefit,0);
  const grandCost=allResults.reduce((s,r)=>s+r.augmentCost,0);
  const grandROI=((grandTotal-grandCost)/grandCost)*100;
  const grandPayback=grandCost/(grandTotal/12);
  const grandFTE=allResults.reduce((s,r)=>s+(r.results.fteEquivalent||0),0);
  const today=new Date().toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"});

  const thresholdHTML=(r)=>{
    if(!r.play.successThresholds||!r.thresholds) return "";
    const items=r.play.successThresholds.map(t=>{
      const val=r.thresholds[t.key]??0;
      const met=val>=t.target;
      const color=met?"#158158":val>=(t.target*0.75)?"#D4A017":"#D94F4F";
      return `<div style="background:${met?"#EBF5F0":"#FFFBEB"};border-left:3px solid ${color};border-radius:3px;padding:8px 10px;margin-bottom:6px;display:flex;justify-content:space-between;align-items:center">
        <div><div style="font-size:9px;font-weight:700;color:#0D0D0D">${t.label}</div><div style="font-size:8px;color:#888;margin-top:1px">${t.desc}</div></div>
        <div style="text-align:right;flex-shrink:0;margin-left:12px"><div style="font-size:11px;font-weight:700;color:${color}">${val}${t.unit}</div><div style="font-size:8px;color:${color}">${met?"\u2713 Met":"Target: "+t.target+t.unit}</div></div>
      </div>`;
    }).join("");
    return `<div style="margin-top:14px"><div style="font-size:8px;color:#158158;text-transform:uppercase;letter-spacing:0.1em;font-weight:700;margin-bottom:8px">Pilot Success Thresholds</div>${items}</div>`;
  };

  const playPage=(r)=>`
  <div class="page">
    <div class="ph"><div><div class="ey">AUTOMATION PLAY ${r.play.number} \u00b7 ${r.categoryLabel}</div><div class="pt">${r.play.label}</div><div style="font-size:10px;color:#1AAA6E;font-weight:500;margin-top:3px">${r.play.tagline}</div></div>
    <div style="background:#158158;border-radius:4px;padding:10px 18px;text-align:center;flex-shrink:0"><div style="font-size:8px;color:rgba(255,255,255,0.6);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:2px">ROI Multiple</div><div style="font-size:26px;font-weight:700;color:#fff;line-height:1">${(r.results.totalBenefit/r.augmentCost).toFixed(1)}\u00d7</div><div style="font-size:8px;color:rgba(255,255,255,0.6);margin-top:2px">${SL[r.scenarioIdx]}</div></div></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:18px">
      <div>
        <div class="sl">Impact Summary</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px">
          ${r.play.metrics.map(m=>{const f=fmt(r.results[m.key],m.format);return m.highlight?`<div style="background:#EBF5F0;border:2px solid #158158;border-radius:3px;padding:10px 12px"><div style="font-size:7px;color:#158158;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:4px">${m.label}</div><div style="font-size:20px;font-weight:700;color:#0D6B48">${f}</div></div>`:`<div style="background:#F8F8F8;border:1px solid #E8E8E8;border-left:3px solid #158158;border-radius:3px;padding:9px 11px"><div style="font-size:7px;color:#888;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:3px">${m.label}</div><div style="font-size:15px;font-weight:700;color:#0D0D0D">${f}</div></div>`;}).join("")}
        </div>
        <div class="sl">Benefit vs. Investment</div>
        <div style="display:flex;justify-content:space-between;font-size:9px;color:#444;margin-bottom:3px"><span>Total Annual Benefit</span><span style="font-weight:700">$${Math.round(r.results.totalBenefit).toLocaleString()}</span></div>
        <div style="height:5px;background:#F5F5F5;border-radius:2px;overflow:hidden;margin-bottom:6px"><div style="height:100%;width:100%;background:#158158;border-radius:2px"></div></div>
        <div style="display:flex;justify-content:space-between;font-size:9px;color:#444;margin-bottom:3px"><span>Annual Augment Cost</span><span style="font-weight:700">$${Math.round(r.augmentCost).toLocaleString()}</span></div>
        <div style="height:5px;background:#F5F5F5;border-radius:2px;overflow:hidden;margin-bottom:8px"><div style="height:100%;width:${Math.round((r.augmentCost/r.results.totalBenefit)*100)}%;background:#888;border-radius:2px"></div></div>
        <div style="background:#EBF5F0;border:1px solid #158158;border-radius:3px;padding:8px 12px;display:flex;justify-content:space-between;align-items:center"><span style="font-size:9px;color:#444;text-transform:uppercase;letter-spacing:0.05em">Net Annual Benefit</span><span style="font-size:14px;font-weight:700;color:#0D6B48">$${Math.round(r.results.totalBenefit-r.augmentCost).toLocaleString()}</span></div>
        ${thresholdHTML(r)}
      </div>
      <div>
        <div class="sl">Validated Pilot Outcomes</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:14px">
          ${r.play.benchmarks.map(b=>`<div style="background:#0D0D0D;border-left:2px solid #158158;border-radius:2px;padding:7px 9px"><div style="font-size:13px;font-weight:700;color:#22C97A;margin-bottom:2px">${b.stat}</div><div style="font-size:8px;color:#888;line-height:1.4">${b.label}</div></div>`).join("")}
        </div>
        <div style="background:#0D0D0D;border-radius:3px;padding:12px 14px">
          <div style="font-size:8px;color:#22C97A;text-transform:uppercase;letter-spacing:0.1em;font-weight:700;margin-bottom:7px">Executive Summary</div>
          <p style="font-size:9px;color:#CCCCCC;line-height:1.9">Using the <strong style="color:#fff">${r.categoryLabel}</strong> lens at the <strong style="color:#22C97A">${SL[r.scenarioIdx].toLowerCase()}</strong> scenario, Augment delivers <strong style="color:#fff">$${Math.round(r.results.totalBenefit).toLocaleString()}</strong> in annual benefit against a <strong style="color:#fff">$${Math.round(r.augmentCost).toLocaleString()}</strong> investment \u2014 a <strong style="color:#22C97A">${Math.round(r.results.roi)}% ROI</strong> with payback in <strong style="color:#22C97A">${r.results.payback.toFixed(1)} months</strong>. Equivalent to recovering <strong style="color:#fff">${(r.results.fteEquivalent||0).toFixed(1)} FTEs</strong> of engineering capacity per year.</p>
        </div>
      </div>
    </div>
    <div class="pf">PRIVILEGED &amp; CONFIDENTIAL \u00b7 augment code \u00b7 ${today}</div>
  </div>`;

  const html=`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Augment Code ROI \u2014 ${customerName||"Customer"}</title>
  <style>
  @import url('https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@400;500;700&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}body{font-family:'Roboto Mono',monospace;background:#fff;color:#0D0D0D;font-size:11px}
  .page{width:100%;min-height:100vh;padding:32px 36px 20px;page-break-after:always;display:flex;flex-direction:column;gap:16px}
  .tp{background:#0D0D0D;color:#fff;display:flex;flex-direction:column;justify-content:space-between;min-height:100vh;padding:56px 56px 36px;page-break-after:always}
  .ph{background:#0D0D0D;color:#fff;padding:18px 20px 16px;border-bottom:4px solid #158158;border-radius:4px;display:flex;justify-content:space-between;align-items:flex-end;gap:14px}
  .ey{font-size:8px;color:#22C97A;letter-spacing:0.14em;text-transform:uppercase;font-weight:700;margin-bottom:4px}
  .pt{font-size:18px;font-weight:700;color:#fff}
  .sl{font-size:8px;color:#158158;letter-spacing:0.12em;text-transform:uppercase;font-weight:700;margin-bottom:8px}
  .pf{font-size:8px;color:#888;text-align:right;margin-top:auto;padding-top:12px;border-top:1px solid #E8E8E8}
  table{width:100%;border-collapse:collapse;font-size:9px}
  th{font-size:7px;color:#158158;text-transform:uppercase;letter-spacing:0.08em;font-weight:700;padding:0 7px 7px 0;text-align:left;border-bottom:2px solid #158158}
  td{padding:8px 7px 8px 0;border-bottom:1px solid #F0F0F0}
  .pbtn{position:fixed;bottom:20px;right:20px;background:#158158;color:#fff;border:none;border-radius:4px;padding:11px 18px;font-family:'Roboto Mono',monospace;font-size:11px;font-weight:700;cursor:pointer;text-transform:uppercase;letter-spacing:0.06em;z-index:9999}
  @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}.page,.tp{page-break-after:always}.pbtn{display:none}}
  </style></head><body>
  <button class="pbtn" onclick="window.print()">\u2B07 Save as PDF</button>
  <div class="tp">
    <div>
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:40px"><div style="width:36px;height:36px;background:#158158;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:700;color:#fff">A</div><span style="font-size:13px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase">augment code</span></div>
      <div style="width:56px;height:4px;background:#158158;margin-bottom:36px"></div>
      <div style="font-size:32px;font-weight:700;line-height:1.2;margin-bottom:10px">ROI Business Case</div>
      <div style="font-size:13px;color:#888;margin-bottom:5px">Prepared for</div>
      <div style="font-size:18px;color:#22C97A;font-weight:500;margin-bottom:36px">${customerName||"Your Company"}</div>
      <div style="display:flex;gap:20px;flex-wrap:wrap">
        ${[{l:"Total Annual Benefit",v:"$"+Math.round(grandTotal).toLocaleString()},{l:"Combined ROI",v:Math.round(grandROI)+"%"},{l:"Payback Period",v:grandPayback.toFixed(1)+" months"},{l:"FTEs Recovered",v:grandFTE.toFixed(1)+" FTEs"}].map(s=>`<div style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-top:3px solid #158158;border-radius:4px;padding:14px 18px"><div style="font-size:22px;font-weight:700;color:#22C97A;margin-bottom:4px">${s.v}</div><div style="font-size:8px;color:#888;text-transform:uppercase;letter-spacing:0.08em">${s.l}</div></div>`).join("")}
      </div>
    </div>
    <div style="font-size:9px;color:#444"><div>PRIVILEGED &amp; CONFIDENTIAL</div><div style="margin-top:4px">${today}</div></div>
  </div>
  <div class="page">
    <div class="ph"><div><div class="ey">COMBINED ROI SUMMARY</div><div class="pt">${customerName?customerName+" \u00d7 Augment Code":"Full Platform Summary"}</div></div>
    <div style="display:flex;gap:8px">${[{l:"Total Benefit",v:"$"+Math.round(grandTotal).toLocaleString()},{l:"Combined ROI",v:Math.round(grandROI)+"%"},{l:"Payback",v:grandPayback.toFixed(1)+" mo"}].map(s=>`<div style="background:#158158;border-radius:3px;padding:10px 14px;text-align:center"><div style="font-size:8px;color:rgba(255,255,255,0.6);text-transform:uppercase;letter-spacing:0.07em;margin-bottom:2px">${s.l}</div><div style="font-size:16px;font-weight:700;color:#fff">${s.v}</div></div>`).join("")}</div></div>
    <div class="sl">Per-Play Breakdown</div>
    <table><thead><tr>${["Play","Category","Scenario","Total Benefit","Cost","Net Benefit","ROI","FTEs","Payback"].map(h=>`<th>${h}</th>`).join("")}</tr></thead>
    <tbody>
      ${allResults.map((r,i)=>`<tr style="background:${i%2===0?"#fff":"#F8F8F8"}"><td><strong>${r.play.label}</strong></td><td style="color:#888">${r.categoryLabel}</td><td style="color:#888">${SL[r.scenarioIdx]}</td><td style="color:#0D6B48;font-weight:700">$${Math.round(r.results.totalBenefit).toLocaleString()}</td><td>$${Math.round(r.augmentCost).toLocaleString()}</td><td style="color:#0D6B48;font-weight:700">$${Math.round(r.results.totalBenefit-r.augmentCost).toLocaleString()}</td><td><span style="background:#EBF5F0;color:#158158;font-weight:700;padding:2px 6px;border-radius:2px">${Math.round(r.results.roi)}%</span></td><td>${(r.results.fteEquivalent||0).toFixed(1)}</td><td>${r.results.payback.toFixed(1)} mo</td></tr>`).join("")}
      <tr style="background:#EBF5F0;font-weight:700;border-top:2px solid #158158"><td colspan="3">TOTAL</td><td style="color:#0D6B48">$${Math.round(grandTotal).toLocaleString()}</td><td>$${Math.round(grandCost).toLocaleString()}</td><td style="color:#0D6B48">$${Math.round(grandTotal-grandCost).toLocaleString()}</td><td><span style="background:#158158;color:#fff;font-weight:700;padding:2px 7px;border-radius:2px">${Math.round(grandROI)}%</span></td><td>${grandFTE.toFixed(1)}</td><td>${grandPayback.toFixed(1)} mo</td></tr>
    </tbody></table>
    <div style="background:#0D0D0D;border-radius:4px;padding:14px 16px;margin-top:4px">
      <div style="font-size:8px;color:#22C97A;text-transform:uppercase;letter-spacing:0.1em;font-weight:700;margin-bottom:7px">Combined Executive Narrative</div>
      <p style="font-size:9px;color:#CCCCCC;line-height:1.9">Across ${allResults.length} active Augment Code automation plays (${allResults.map(r=>r.play.label).join(", ")}), the platform delivers a combined <strong style="color:#fff">$${Math.round(grandTotal).toLocaleString()}</strong> in annual benefit against a <strong style="color:#fff">$${Math.round(grandCost).toLocaleString()}</strong> investment \u2014 a <strong style="color:#22C97A">${Math.round(grandROI)}% combined ROI</strong> with a payback period of <strong style="color:#22C97A">${grandPayback.toFixed(1)} months</strong>, recovering the equivalent of <strong style="color:#fff">${grandFTE.toFixed(1)} FTEs</strong> of engineering capacity annually.</p>
    </div>
    <div class="pf">PRIVILEGED &amp; CONFIDENTIAL \u00b7 augment code \u00b7 ${today}</div>
  </div>
  ${allResults.map(playPage).join("")}
  </body></html>`;
  w.document.write(html);w.document.close();
  setTimeout(()=>w.print(),800);
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────

export default function App(){
  const [activeTab,setActiveTab]=useState("code-review");
  const [customerName,setCustomerName]=useState("");
  const [editingName,setEditingName]=useState(false);
  const [enabled,setEnabled]=useState({"code-review":true,"unit-test":true,"build-failure":true,"interactive":true});
  const [scenarios,setScenarios]=useState({"code-review":1,"unit-test":1,"build-failure":1,"interactive":1});
  const [evalCats,setEvalCats]=useState({"code-review":"throughput","unit-test":"velocity","build-failure":"mttr","interactive":"productivity"});
  const [thresholds,setThresholds]=useState(()=>{
    const t={};
    PLAYS.forEach(p=>{if(p.successThresholds){t[p.id]={};p.successThresholds.forEach(s=>{t[p.id][s.key]=0;});}});
    return t;
  });
  const [values,setValues]=useState(()=>{
    const init={};
    PLAYS.forEach(p=>{
      init[p.id]={};
      p.evalCategories.forEach(cat=>{cat.inputs.forEach(inp=>{if(!(inp.key in init[p.id]))init[p.id][inp.key]=inp.default;});});
    });
    return init;
  });
  const handleChange=useCallback((playId,key,val)=>{
    setValues(prev=>({...prev,[playId]:{...prev[playId],[key]:val}}));
  },[]);
  const handleThresholdChange=useCallback((playId,key,val)=>{
    setThresholds(prev=>({...prev,[playId]:{...prev[playId],[key]:val}}));
  },[]);
  const allResults=PLAYS.filter(p=>enabled[p.id]).map(play=>{
    const si=scenarios[play.id];
    const catId=evalCats[play.id];
    const pct=play.savingsRange[si];
    const vals=values[play.id];
    const cat=play.evalCategories.find(c=>c.id===catId)||play.evalCategories[0];
    return{play,scenarioIdx:si,results:play.compute(vals,pct,catId),augmentCost:vals.augmentCost||180000,categoryLabel:cat.label,thresholds:thresholds[play.id]||{}};
  });
  const activePlay=PLAYS.find(p=>p.id===activeTab);
  const tabLabel=(p)=>{
    const isEn=enabled[p.id];
    return(
      <button key={p.id} onClick={()=>setActiveTab(p.id)} style={{
        background:"transparent",border:"none",
        borderBottom:activeTab===p.id?`3px solid ${B.green}`:"3px solid transparent",
        padding:"12px 18px 9px",cursor:"pointer",
        color:activeTab===p.id?B.green:isEn?B.gray:"#CCCCCC",
        fontWeight:activeTab===p.id?700:500,
        fontSize:10,letterSpacing:"0.06em",textTransform:"uppercase",
        transition:"all 0.15s",display:"flex",alignItems:"center",gap:6,
        textDecoration:isEn?"none":"line-through",opacity:isEn?1:0.5,
      }}>
        <span style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:16,height:16,borderRadius:2,background:activeTab===p.id&&isEn?B.green:isEn?"transparent":"#E0E0E0",border:`1px solid ${activeTab===p.id&&isEn?B.green:isEn?B.gray:"#CCC"}`,fontSize:7,fontWeight:700,color:activeTab===p.id&&isEn?B.white:isEn?B.gray:"#AAA"}}>
          {p.number}
        </span>
        {p.label}
        {!isEn&&<span style={{fontSize:7,color:"#AAA",marginLeft:2,fontStyle:"italic"}}>off</span>}
      </button>
    );
  };

  return(
    <div style={{minHeight:"100vh",background:B.white,color:B.black,fontFamily:"'Roboto Mono',monospace"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@400;500;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        input[type=range]{-webkit-appearance:none;appearance:none}
        input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:14px;height:14px;border-radius:50%;background:${B.green};cursor:pointer;border:2px solid ${B.white};box-shadow:0 1px 4px rgba(0,0,0,0.2);transition:transform 0.1s}
        input[type=range]::-webkit-slider-thumb:hover{transform:scale(1.25)}
        input[type=range]::-moz-range-thumb{width:14px;height:14px;border-radius:50%;background:${B.green};cursor:pointer;border:2px solid ${B.white}}
        button{font-family:'Roboto Mono',monospace}
        input[type=text]{font-family:'Roboto Mono',monospace}
        select{font-family:'Roboto Mono',monospace}
      `}</style>
      {/* HEADER */}
      <div style={{background:B.black,padding:"0 32px",display:"flex",alignItems:"center",justifyContent:"space-between",height:52}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:26,height:26,borderRadius:4,background:B.green,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:B.white}}>A</div>
          <span style={{fontSize:11,fontWeight:700,color:B.white,letterSpacing:"0.12em",textTransform:"uppercase"}}>augment code</span>
          <span style={{color:B.darkGray,margin:"0 6px"}}>\u00b7</span>
          {editingName?(
            <input type="text" value={customerName} onChange={e=>setCustomerName(e.target.value)}
              onBlur={()=>setEditingName(false)} onKeyDown={e=>e.key==="Enter"&&setEditingName(false)}
              autoFocus placeholder="Enter customer name\u2026"
              style={{background:"transparent",border:"none",borderBottom:`1px solid ${B.green}`,color:B.white,fontSize:11,outline:"none",width:200}}/>
          ):(
            <span onClick={()=>setEditingName(true)} style={{fontSize:11,color:customerName?B.greenLight:B.gray,cursor:"pointer",borderBottom:`1px dashed ${B.darkGray}`}}>
              {customerName||"Click to add customer name"}
            </span>
          )}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:9,color:B.gray,letterSpacing:"0.1em",textTransform:"uppercase"}}>{allResults.length} of {PLAYS.length} plays active</span>
          <button onClick={()=>exportToPDF(allResults,customerName)}
            style={{background:B.green,border:"none",borderRadius:4,padding:"7px 14px",cursor:"pointer",color:B.white,fontSize:10,fontWeight:700,letterSpacing:"0.06em",textTransform:"uppercase",display:"flex",alignItems:"center",gap:6}}>
            \u2B07 Export PDF
          </button>
        </div>
      </div>
      {/* TABS */}
      <div style={{background:B.offWhite,borderBottom:"1px solid #E0E0E0",padding:"0 32px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{display:"flex"}}>
          {PLAYS.map(p=>tabLabel(p))}
          <button onClick={()=>setActiveTab("summary")} style={{
            background:"transparent",border:"none",
            borderBottom:activeTab==="summary"?`3px solid ${B.green}`:"3px solid transparent",
            padding:"12px 18px 9px",cursor:"pointer",
            color:activeTab==="summary"?B.green:B.gray,
            fontWeight:activeTab==="summary"?700:500,
            fontSize:10,letterSpacing:"0.06em",textTransform:"uppercase",
            transition:"all 0.15s",display:"flex",alignItems:"center",gap:6,
          }}>
            <span style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:16,height:16,borderRadius:2,background:activeTab==="summary"?B.green:"transparent",border:`1px solid ${activeTab==="summary"?B.green:B.gray}`,fontSize:8,fontWeight:700,color:activeTab==="summary"?B.white:B.gray}}>\u03A3</span>
            Summary
          </button>
        </div>
        {/* Enable/disable toggle for active play */}
        {activePlay&&(
          <button onClick={()=>{
            const next=!enabled[activePlay.id];
            setEnabled(prev=>({...prev,[activePlay.id]:next}));
            if(!next&&activeTab===activePlay.id) setActiveTab(activePlay.id);
          }} style={{
            background:"transparent",border:`1px solid ${enabled[activePlay.id]?B.red:B.green}`,
            borderRadius:4,padding:"5px 12px",cursor:"pointer",
            color:enabled[activePlay.id]?B.red:B.green,
            fontSize:9,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.06em",
            transition:"all 0.15s",
          }}>
            {enabled[activePlay.id]?"\u2715 Exclude from Summary":"+ Include in Summary"}
          </button>
        )}
      </div>
      {/* CONTENT */}
      {activeTab==="summary"?(
        <SummaryTab allResults={allResults} customerName={customerName}/>
      ):activePlay?(
        enabled[activePlay.id]?(
          <PlayTab
            play={activePlay}
            vals={values[activePlay.id]}
            onChange={(key,val)=>handleChange(activePlay.id,key,val)}
            scenarioIdx={scenarios[activePlay.id]}
            setScenarioIdx={idx=>setScenarios(prev=>({...prev,[activePlay.id]:idx}))}
            selectedCat={evalCats[activePlay.id]}
            setSelectedCat={cat=>setEvalCats(prev=>({...prev,[activePlay.id]:cat}))}
            thresholds={thresholds[activePlay.id]||{}}
            onThresholdChange={handleThresholdChange}
          />
        ):(
          <DisabledTab play={activePlay} onEnable={()=>setEnabled(prev=>({...prev,[activePlay.id]:true}))}/>
        )
      ):null}
      {/* FOOTER */}
      <div style={{borderTop:"1px solid #E8E8E8",padding:"10px 32px",display:"flex",justifyContent:"space-between",alignItems:"center",background:B.offWhite}}>
        <span style={{fontSize:9,color:B.gray}}>* Illustrative estimates based on Augment Code pilot data and industry benchmarks.</span>
        <span style={{fontSize:9,color:B.gray,letterSpacing:"0.08em",textTransform:"uppercase"}}>PRIVILEGED &amp; CONFIDENTIAL \u00b7 augment code</span>
      </div>
    </div>
  );
}
