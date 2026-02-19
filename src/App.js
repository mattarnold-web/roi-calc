import { useState, useCallback } from "react";

const B = {
  black:"#0D0D0D", green:"#158158", greenLight:"#1AAA6E",
  greenBright:"#22C97A", greenDark:"#0D6B48", white:"#FFFFFF",
  offWhite:"#F5F5F5", cardBg:"#F8F8F8", gray:"#888888",
  darkGray:"#444444", greenBg:"#EBF5F0", red:"#D94F4F",
  redBg:"#FDF2F2", amber:"#D4A017", amberBg:"#FFFBEB",
  disabledGray:"#CCCCCC", disabledBg:"#F5F5F5",
};

const USE_CASES = [
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

// ─── PDF EXPORT (uses jsPDF loaded from CDN) ───

function loadJsPDF() {
  return new Promise((resolve, reject) => {
    if (window.jspdf) { resolve(window.jspdf); return; }
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.2/jspdf.umd.min.js";
    s.onload = () => resolve(window.jspdf);
    s.onerror = () => reject(new Error("Failed to load jsPDF"));
    document.head.appendChild(s);
  });
}

async function generatePDF(allCatResults, customerName, enabled, enabledCats, catValues, catScenarios, thresholds, showPilot) {
  const lib = await loadJsPDF();
  const doc = new lib.jsPDF({ orientation:"landscape", unit:"pt", format:"letter" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const margin = 48;
  const green = [21,129,88];
  const black = [13,13,13];
  const gray = [136,136,136];
  const white = [255,255,255];
  const greenBg = [235,245,240];

  // Helper: draw a filled rect
  const rect = (x,y,w,h,color) => { doc.setFillColor(...color); doc.rect(x,y,w,h,"F"); };
  // Helper: draw text
  const txt = (text,x,y,opts={}) => {
    doc.setFontSize(opts.size||10);
    doc.setTextColor(...(opts.color||black));
    if(opts.bold) doc.setFont("helvetica","bold"); else doc.setFont("helvetica","normal");
    if(opts.align) doc.text(text,x,y,{align:opts.align}); else doc.text(text,x,y);
  };

  // Build use case map for cost calc
  const useCaseMap = {};
  allCatResults.forEach(r => {
    if(!useCaseMap[r.useCase.id]) useCaseMap[r.useCase.id] = {useCase:r.useCase, cats:[], maxCost:0};
    useCaseMap[r.useCase.id].cats.push(r);
    useCaseMap[r.useCase.id].maxCost = Math.max(useCaseMap[r.useCase.id].maxCost, r.augmentCost);
  });
  const grandTotal = allCatResults.reduce((s,r) => s+r.results.totalBenefit, 0);
  const grandCost = Object.values(useCaseMap).reduce((s,p) => s+p.maxCost, 0);
  const grandNet = grandTotal - grandCost;
  const grandROI = grandCost > 0 ? ((grandTotal-grandCost)/grandCost)*100 : 0;
  const grandPayback = grandCost > 0 ? grandCost/(grandTotal/12) : 0;
  const grandFTE = allCatResults.reduce((s,r) => s+(r.results.fteEquivalent||0), 0);
  const grandHours = allCatResults.reduce((s,r) => s+(r.results.hoursRecovered||0), 0);
  const useCaseCount = Object.keys(useCaseMap).length;
  const SLabels = ["Conservative","Midpoint","Optimistic"];

  // ═══════════════════════════════════════════
  // PAGE 1: TITLE PAGE
  // ═══════════════════════════════════════════
  rect(0,0,W,H,black);
  // Green accent bar
  rect(0, H*0.42, W, 6, green);
  // Logo
  rect(margin, margin, 36, 36, green);
  txt("A", margin+12, margin+26, {size:18, color:white, bold:true});
  txt("AUGMENT CODE", margin+48, margin+24, {size:12, color:white, bold:true});
  // Title block
  txt("Business Value & ROI", margin, H*0.35, {size:36, color:white, bold:true});
  if(customerName) {
    txt("Prepared for", margin, H*0.50, {size:12, color:gray});
    txt(customerName, margin, H*0.56, {size:28, color:[34,201,122], bold:true});
  } else {
    txt("Platform ROI Analysis", margin, H*0.52, {size:20, color:[34,201,122], bold:true});
  }
  // Key stats on title page
  const statsY = H*0.68;
  const statsW = (W - margin*2 - 30*3) / 4;
  [{l:"Total Annual Benefit",v:"$"+Math.round(grandTotal).toLocaleString()},
   {l:"Combined ROI",v:Math.round(grandROI)+"%"},
   {l:"Payback Period",v:grandPayback.toFixed(1)+" months"},
   {l:"FTEs Recovered",v:grandFTE.toFixed(1)}
  ].forEach((s,i) => {
    const sx = margin + i*(statsW+10);
    rect(sx, statsY, statsW, 56, [30,30,30]);
    rect(sx, statsY, statsW, 3, green);
    txt(s.l, sx+10, statsY+20, {size:8, color:gray});
    txt(s.v, sx+10, statsY+42, {size:18, color:white, bold:true});
  });
  // Footer
  txt("PRIVILEGED & CONFIDENTIAL", W-margin, H-36, {size:7, color:gray, align:"right"});
  txt("Illustrative estimates based on Augment Code pilot data and industry benchmarks.", margin, H-36, {size:7, color:gray});

  // ═══════════════════════════════════════════
  // PAGE 2: EXECUTIVE SUMMARY
  // ═══════════════════════════════════════════
  doc.addPage();
  rect(0,0,W,80,black);
  rect(0,80,W,4,green);
  txt("COMBINED ROI SUMMARY", margin, 35, {size:8, color:[34,201,122], bold:true});
  txt(customerName ? customerName+" \u00d7 Augment Code" : "Full Platform ROI Summary", margin, 58, {size:20, color:white, bold:true});
  txt(useCaseCount+" use case"+(useCaseCount>1?"s":"")+", "+allCatResults.length+" evaluation categor"+(allCatResults.length===1?"y":"ies"), margin, 72, {size:9, color:gray});

  // Summary KPI boxes
  let sy = 104;
  const kpiW = (W - margin*2 - 30) / 4;
  [{l:"Total Annual Benefit",v:"$"+Math.round(grandTotal).toLocaleString()},
   {l:"Combined ROI",v:Math.round(grandROI)+"%"},
   {l:"Payback Period",v:grandPayback.toFixed(1)+" mo"},
   {l:"Net Annual Return",v:"$"+Math.round(grandNet).toLocaleString()}
  ].forEach((s,i) => {
    const sx = margin + i*(kpiW+10);
    rect(sx, sy, kpiW, 50, greenBg);
    doc.setDrawColor(...green); doc.setLineWidth(1.5); doc.rect(sx,sy,kpiW,50,"S");
    txt(s.l, sx+8, sy+16, {size:7, color:green, bold:true});
    txt(s.v, sx+8, sy+38, {size:16, color:black, bold:true});
  });

  // Per-category table
  sy += 70;
  txt("PER-CATEGORY BREAKDOWN", margin, sy, {size:8, color:green, bold:true});
  sy += 14;
  // Table header
  const cols = [margin, margin+140, margin+260, margin+360, margin+460, margin+530, margin+600];
  const headers = ["Use Case","Category","Scenario","Total Benefit","ROI","FTEs","Payback"];
  rect(cols[0]-4, sy-10, W-margin*2+8, 16, greenBg);
  headers.forEach((h,i) => txt(h, cols[i], sy, {size:7, color:green, bold:true}));
  sy += 14;

  allCatResults.forEach((r,idx) => {
    if(sy > H-60) { doc.addPage(); sy = margin; }
    if(idx%2===0) rect(cols[0]-4, sy-10, W-margin*2+8, 16, [250,250,250]);
    txt(r.useCase.label, cols[0], sy, {size:8, color:black, bold:true});
    txt(r.categoryLabel, cols[1], sy, {size:8, color:gray});
    txt(SLabels[r.scenarioIdx], cols[2], sy, {size:8, color:gray});
    txt("$"+Math.round(r.results.totalBenefit).toLocaleString(), cols[3], sy, {size:9, color:black, bold:true});
    txt(Math.round(r.results.roi)+"%", cols[4], sy, {size:9, color:green, bold:true});
    txt((r.results.fteEquivalent||0).toFixed(1), cols[5], sy, {size:8, color:black});
    txt(r.results.payback.toFixed(1)+" mo", cols[6], sy, {size:8, color:black});
    sy += 18;
  });

  // Totals row
  sy += 4;
  rect(cols[0]-4, sy-10, W-margin*2+8, 18, greenBg);
  txt("TOTAL ("+useCaseCount+" use cases, "+allCatResults.length+" categories)", cols[0], sy, {size:9, color:green, bold:true});
  txt("$"+Math.round(grandTotal).toLocaleString(), cols[3], sy, {size:10, color:green, bold:true});
  txt(Math.round(grandROI)+"%", cols[4], sy, {size:10, color:green, bold:true});
  txt(grandFTE.toFixed(1), cols[5], sy, {size:9, color:green, bold:true});
  txt(grandPayback.toFixed(1)+" mo", cols[6], sy, {size:9, color:green, bold:true});

  // Additional KPIs
  sy += 36;
  [{l:"Engineering Hours Recovered",v:Math.round(grandHours).toLocaleString()+" hrs/yr"},
   {l:"FTE Capacity Recovered",v:grandFTE.toFixed(1)+" FTEs"},
   {l:"Platform Investment",v:"$"+Math.round(grandCost).toLocaleString()+"/yr"},
  ].forEach((s,i) => {
    const sx = margin + i*((W-margin*2)/3);
    txt(s.l, sx, sy, {size:7, color:gray});
    txt(s.v, sx, sy+14, {size:12, color:black, bold:true});
  });

  // Exec narrative
  sy += 40;
  if(sy < H-80) {
    rect(margin-4, sy-4, W-margin*2+8, 50, black);
    txt("EXECUTIVE NARRATIVE", margin+4, sy+10, {size:7, color:[34,201,122], bold:true});
    const narrative = "Across "+useCaseCount+" active Augment Code use case"+(useCaseCount>1?"s":"")+" and "+allCatResults.length+" evaluation categor"+(allCatResults.length===1?"y":"ies")+", the platform delivers $"+Math.round(grandTotal).toLocaleString()+" in annual benefit against a $"+Math.round(grandCost).toLocaleString()+" investment \u2014 a "+Math.round(grandROI)+"% combined ROI with a payback period of "+grandPayback.toFixed(1)+" months, recovering "+grandFTE.toFixed(1)+" FTEs of engineering capacity annually.";
    const lines = doc.splitTextToSize(narrative, W-margin*2-16);
    doc.setFontSize(8); doc.setTextColor(200,200,200); doc.setFont("helvetica","normal");
    doc.text(lines, margin+4, sy+24);
  }

  // Footer
  rect(0, H-24, W, 24, [245,245,245]);
  txt("* Illustrative estimates based on Augment Code pilot data and industry benchmarks.", margin, H-10, {size:6, color:gray});
  txt("PRIVILEGED & CONFIDENTIAL \u00b7 AUGMENT CODE", W-margin, H-10, {size:6, color:gray, align:"right"});

  // ═══════════════════════════════════════════
  // PAGES 3+: ONE PAGE PER ENABLED USE CASE
  // ═══════════════════════════════════════════
  USE_CASES.filter(p => enabled[p.id]).forEach(useCase => {
    doc.addPage();
    const cats = enabledCats[useCase.id] || [];
    // Compute results for each category
    const catResults = cats.map(catId => {
      const cat = useCase.evalCategories.find(c => c.id === catId);
      const vals = catValues[useCase.id]?.[catId] || {};
      const si = catScenarios[useCase.id]?.[catId] ?? 1;
      const pct = useCase.savingsRange[si];
      const results = useCase.compute(vals, pct, catId);
      return {cat, catId, vals, scenarioIdx:si, pct, results, augmentCost:vals.augmentCost||180000};
    });
    const ucBenefit = catResults.reduce((s,r) => s+r.results.totalBenefit, 0);
    const ucCost = Math.max(...catResults.map(r => r.augmentCost), 0);
    const ucROI = ucCost > 0 ? ((ucBenefit-ucCost)/ucCost)*100 : 0;
    const ucFTE = catResults.reduce((s,r) => s+(r.results.fteEquivalent||0), 0);
    const roiMultiple = ucCost > 0 ? (ucBenefit/ucCost).toFixed(1) : "0";

    // Header
    rect(0,0,W,80,black);
    rect(0,80,W,4,green);
    txt("AUTOMATION USE CASE "+useCase.number+" \u00b7 "+cats.length+" CATEGOR"+(cats.length===1?"Y":"IES")+" ACTIVE", margin, 30, {size:8, color:[34,201,122], bold:true});
    txt(useCase.label, margin, 52, {size:20, color:white, bold:true});
    txt(useCase.tagline, margin, 68, {size:9, color:[26,170,110]});

    // ROI badges in header
    const badgeX = W - margin - 180;
    rect(badgeX, 16, 80, 48, [30,30,30]);
    txt("Combined Benefit", badgeX+6, 30, {size:6, color:gray});
    txt("$"+Math.round(ucBenefit).toLocaleString(), badgeX+6, 48, {size:12, color:white, bold:true});
    rect(badgeX+88, 16, 80, 48, green);
    txt("Combined ROI", badgeX+94, 30, {size:6, color:[200,255,200]});
    txt(roiMultiple+"\u00d7", badgeX+94, 50, {size:18, color:white, bold:true});

    let py = 100;

    // Category details
    catResults.forEach(cr => {
      if(py > H-120) { doc.addPage(); py = margin; }
      txt(cr.cat.label.toUpperCase(), margin, py, {size:8, color:green, bold:true});
      txt(cr.cat.desc, margin+160, py, {size:7, color:gray});
      py += 14;

      // Inputs summary
      cr.cat.inputs.forEach(inp => {
        const val = cr.vals[inp.key] ?? inp.default;
        const dv = inp.unit==="$"?"$"+val.toLocaleString():inp.unit==="%"?val+"%":inp.unit==="$/hr"?"$"+val+"/hr":inp.unit==="hrs"?val+" hrs":inp.unit==="wks"?val+" wks":val.toLocaleString();
        txt(inp.label+":", margin+8, py, {size:7, color:gray});
        txt(dv, margin+260, py, {size:8, color:black, bold:true});
        py += 12;
      });

      // Scenario
      txt("Scenario: "+SLabels[cr.scenarioIdx]+" ("+Math.round(cr.pct*100)+"%)", margin+8, py, {size:7, color:green, bold:true});
      py += 16;

      // Results in a row
      const metrics = useCase.metrics.filter(m => {
        const v = cr.results[m.key];
        return v !== undefined && v !== null && v !== 0;
      });
      const mw = Math.min(120, (W-margin*2)/metrics.length - 8);
      metrics.forEach((m,i) => {
        const mx = margin + i*(mw+8);
        const v = cr.results[m.key];
        const fv = m.format==="dollar"?"$"+Math.round(v).toLocaleString():m.format==="percent"?Math.round(v)+"%":m.format==="hours"?Math.round(v).toLocaleString()+" hrs":m.format==="fte"?v.toFixed(1)+" FTEs":String(v);
        if(m.highlight) rect(mx, py-8, mw, 28, greenBg);
        else rect(mx, py-8, mw, 28, [248,248,248]);
        txt(m.label, mx+4, py, {size:6, color:m.highlight?green:gray});
        txt(fv, mx+4, py+14, {size:10, color:m.highlight?green:black, bold:true});
      });
      py += 36;
    });

    // Benchmarks
    if(py < H-80) {
      rect(margin-4, py, W-margin*2+8, 46, black);
      txt("VALIDATED PILOT OUTCOMES", margin+4, py+14, {size:7, color:[34,201,122], bold:true});
      useCase.benchmarks.forEach((b,i) => {
        const bx = margin + 8 + i*((W-margin*2-16)/4);
        txt(b.stat, bx, py+28, {size:11, color:[34,201,122], bold:true});
        txt(b.label, bx, py+38, {size:6, color:gray});
      });
      py += 56;
    }

    // Pilot thresholds (if enabled and present)
    if(showPilot && useCase.successThresholds && py < H-60) {
      const ucThresholds = thresholds[useCase.id] || {};
      txt("PILOT SUCCESS THRESHOLDS", margin, py+6, {size:7, color:green, bold:true});
      py += 18;
      useCase.successThresholds.forEach(t => {
        const val = ucThresholds[t.key] ?? 0;
        const met = val >= t.target;
        const statusColor = met ? green : val >= t.target*0.75 ? [212,160,23] : gray;
        txt(t.label, margin+8, py, {size:7, color:black});
        txt(val+t.unit+" / "+t.target+t.unit, margin+350, py, {size:8, color:statusColor, bold:true});
        txt(met?"\u2713 Met":"Below Target", margin+460, py, {size:7, color:statusColor, bold:true});
        py += 14;
      });
    }

    // Footer
    rect(0, H-24, W, 24, [245,245,245]);
    txt("* Illustrative estimates based on Augment Code pilot data and industry benchmarks.", margin, H-10, {size:6, color:gray});
    txt("PRIVILEGED & CONFIDENTIAL \u00b7 AUGMENT CODE", W-margin, H-10, {size:6, color:gray, align:"right"});
  });

  // Save
  const filename = customerName ? customerName.replace(/[^a-zA-Z0-9]/g,"_")+"_Augment_ROI.pdf" : "Augment_Code_ROI_Analysis.pdf";
  doc.save(filename);
}

// ─── HELPERS ───

const fmt=(val,format)=>{
  if(val===undefined||val===null||isNaN(val)) return "\u2014";
  if(format==="dollar") return "$"+Math.round(val).toLocaleString();
  if(format==="percent") return Math.round(val)+"%";
  if(format==="hours") return Math.round(val).toLocaleString()+" hrs";
  if(format==="fte") return val.toFixed(1)+" FTEs";
  return String(val);
};

const SL=["Conservative","Midpoint","Optimistic"];

function Slider({input,value,onChange}){
  const pct=((value-input.min)/(input.max-input.min))*100;
  const dv=input.unit==="$"?"$"+value.toLocaleString():input.unit==="%"?value+"%":input.unit==="$/hr"?"$"+value+"/hr":input.unit==="hrs"?value+" hrs":input.unit==="wks"?value+" wks":value.toLocaleString();
  return(
    <div style={{marginBottom:14}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:4}}>
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

function MetricCard({metric,value}){
  const f=fmt(value,metric.format);
  if(metric.highlight){
    const neg=metric.format==="percent"&&value<0;
    return(
      <div style={{background:neg?B.redBg:B.greenBg,border:`2px solid ${neg?B.red:B.green}`,borderRadius:4,padding:"12px 14px"}}>
        <div style={{fontSize:8,color:B.green,textTransform:"uppercase",letterSpacing:"0.1em",fontWeight:700,marginBottom:4}}>{metric.label}</div>
        <div style={{fontSize:20,fontWeight:700,color:neg?B.red:B.greenDark,lineHeight:1}}>{f}</div>
      </div>
    );
  }
  return(
    <div style={{background:B.cardBg,border:"1px solid #E8E8E8",borderLeft:`3px solid ${B.green}`,borderRadius:4,padding:"10px 12px"}}>
      <div style={{fontSize:8,color:B.gray,textTransform:"uppercase",letterSpacing:"0.1em",fontWeight:500,marginBottom:3}}>{metric.label}</div>
      <div style={{fontSize:16,fontWeight:700,color:B.black,lineHeight:1}}>{f}</div>
    </div>
  );
}

function ThresholdMeter({threshold,value,onChange}){
  const max=threshold.isAbsolute?threshold.max:100;
  const pct=(value/max)*100;
  const targetPct=(threshold.target/max)*100;
  const met=value>=threshold.target;
  const untouched=value===0;
  const color=untouched?B.disabledGray:met?B.green:value>=(threshold.target*0.75)?B.amber:B.red;
  const bgColor=untouched?B.disabledBg:met?B.greenBg:value>=(threshold.target*0.75)?B.amberBg:B.redBg;
  return(
    <div style={{background:bgColor,border:`1px solid ${color}33`,borderLeft:`3px solid ${color}`,borderRadius:4,padding:"12px 14px",marginBottom:8,opacity:untouched?0.6:1}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:5}}>
        <div>
          <div style={{fontSize:10,fontWeight:700,color:untouched?B.gray:B.black,marginBottom:1}}>{threshold.label}</div>
          <div style={{fontSize:9,color:B.gray}}>{threshold.desc}</div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:6,flexShrink:0,marginLeft:10}}>
          <span style={{fontSize:9,color:B.gray}}>Target: <strong style={{color:B.darkGray}}>{threshold.target}{threshold.unit}</strong></span>
          <span style={{fontSize:14,fontWeight:700,color}}>{value}{threshold.unit}</span>
          <span style={{fontSize:12}}>{untouched?"\u25cb":met?"\u2713":"\u25cb"}</span>
        </div>
      </div>
      <div style={{position:"relative",height:5,background:"rgba(0,0,0,0.08)",borderRadius:3}}>
        <div style={{position:"absolute",top:0,left:0,bottom:0,width:Math.min(100,pct)+"%",background:color,borderRadius:3,transition:"width 0.1s"}}/>
        <div style={{position:"absolute",top:-2,left:targetPct+"%",width:2,height:9,background:B.darkGray,borderRadius:1,transform:"translateX(-50%)"}}/>
        <input type="range" min={0} max={max} step={1} value={value}
          onChange={e=>onChange(threshold.key,parseFloat(e.target.value))}
          style={{position:"absolute",top:-8,left:0,width:"100%",height:20,WebkitAppearance:"none",appearance:"none",background:"transparent",outline:"none",cursor:"pointer",margin:0}}/>
      </div>
      <div style={{display:"flex",justifyContent:"flex-end",marginTop:3}}>
        <span style={{fontSize:8,color,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em"}}>{untouched?"Not Evaluated":met?"\u2713 Threshold Met":"Below Target"}</span>
      </div>
    </div>
  );
}

// ─── CATEGORY PANEL (one per enabled category) ───

function CategoryPanel({useCase,cat,vals,onChange,scenarioIdx,setScenarioIdx,onRemove,isOnly}){
  const pct=useCase.savingsRange[scenarioIdx];
  const results=useCase.compute(vals,pct,cat.id);
  return(
    <div style={{background:B.white,border:"1px solid #E8E8E8",borderTop:`3px solid ${B.green}`,borderRadius:4,padding:"16px 18px",marginBottom:14}}>
      {/* Category header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <div>
          <div style={{fontSize:11,fontWeight:700,color:B.greenDark}}>{cat.label}</div>
          <div style={{fontSize:9,color:B.gray}}>{cat.desc}</div>
        </div>
        {!isOnly&&<button onClick={onRemove} style={{background:"transparent",border:`1px solid ${B.red}`,borderRadius:3,padding:"3px 8px",cursor:"pointer",color:B.red,fontSize:8,fontWeight:700,textTransform:"uppercase"}}>Remove</button>}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
        {/* LEFT: inputs + scenario */}
        <div>
          <div style={{fontSize:9,color:B.green,letterSpacing:"0.1em",textTransform:"uppercase",fontWeight:700,marginBottom:10}}>Inputs</div>
          {cat.inputs.map(inp=>(
            <Slider key={inp.key} input={inp} value={vals[inp.key]??inp.default} onChange={onChange}/>
          ))}
          {/* Scenario mini-selector */}
          <div style={{marginTop:8,padding:"10px 12px",background:B.offWhite,borderRadius:4}}>
            <div style={{fontSize:8,color:B.green,letterSpacing:"0.1em",textTransform:"uppercase",fontWeight:700,marginBottom:6}}>{useCase.savingsLabel} \u2014 Scenario</div>
            <div style={{display:"flex",gap:4}}>
              {SL.map((label,i)=>(
                <button key={label} onClick={()=>setScenarioIdx(i)} style={{
                  flex:1,padding:"6px 4px",borderRadius:3,
                  border:`1px solid ${scenarioIdx===i?B.green:"#E0E0E0"}`,
                  background:scenarioIdx===i?B.greenBg:B.white,
                  color:scenarioIdx===i?B.greenDark:B.gray,
                  fontWeight:700,fontSize:8,cursor:"pointer",textAlign:"center",
                }}>
                  <div style={{textTransform:"uppercase",letterSpacing:"0.04em"}}>{label}</div>
                  <div style={{fontSize:12,color:scenarioIdx===i?B.green:B.darkGray}}>{Math.round(useCase.savingsRange[i]*100)}%</div>
                </button>
              ))}
            </div>
          </div>
        </div>
        {/* RIGHT: results */}
        <div>
          <div style={{fontSize:9,color:B.green,letterSpacing:"0.1em",textTransform:"uppercase",fontWeight:700,marginBottom:10}}>Results \u2014 {cat.label}</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            {useCase.metrics.map(m=><MetricCard key={m.key} metric={m} value={results[m.key]}/>)}
          </div>
          <div style={{marginTop:10,padding:"8px 10px",background:results.totalBenefit>(vals.augmentCost||180000)?B.greenBg:B.redBg,border:`1px solid ${results.totalBenefit>(vals.augmentCost||180000)?B.green:B.red}`,borderRadius:4,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span style={{fontSize:9,color:B.darkGray,textTransform:"uppercase"}}>Net Benefit</span>
            <span style={{fontSize:14,fontWeight:700,color:results.totalBenefit>(vals.augmentCost||180000)?B.greenDark:B.red}}>${Math.round(results.totalBenefit-(vals.augmentCost||180000)).toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── USE CASE TAB (multi-category) ───

function UseCaseTab({useCase,enabledCats,catValues,catScenarios,onValueChange,onScenarioChange,onToggleCat,thresholds,onThresholdChange,showPilot,onTogglePilot}){
  // Compute results for each enabled category
  const catResults=enabledCats.map(catId=>{
    const cat=useCase.evalCategories.find(c=>c.id===catId);
    const vals=catValues[catId]||{};
    const si=catScenarios[catId]??1;
    const pct=useCase.savingsRange[si];
    const results=useCase.compute(vals,pct,catId);
    return {cat,catId,vals,scenarioIdx:si,pct,results};
  });
  // Combined totals across all enabled categories
  const combinedBenefit=catResults.reduce((s,r)=>s+r.results.totalBenefit,0);
  const combinedCost=Math.max(...catResults.map(r=>r.vals.augmentCost||180000),0);
  const combinedROI=combinedCost>0?((combinedBenefit-combinedCost)/combinedCost)*100:0;
  const combinedHours=catResults.reduce((s,r)=>s+(r.results.hoursRecovered||0),0);
  const combinedFTE=combinedHours/2080;
  const roiMultiple=combinedCost>0?(combinedBenefit/combinedCost).toFixed(1):"0";
  // Threshold results
  const thresholdResults=useCase.successThresholds
    ?useCase.successThresholds.map(t=>({...t,value:thresholds[t.key]??0,met:(thresholds[t.key]??0)>=t.target}))
    :[];
  const metCount=thresholdResults.filter(t=>t.met).length;
  // Available categories not yet enabled
  const availableCats=useCase.evalCategories.filter(c=>!enabledCats.includes(c.id));

  return(
    <div>
      {/* Use Case header */}
      <div style={{background:B.black,padding:"20px 32px 18px",borderBottom:`4px solid ${B.green}`}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",flexWrap:"wrap",gap:14}}>
          <div style={{flex:1}}>
            <div style={{fontSize:9,color:B.greenBright,letterSpacing:"0.14em",textTransform:"uppercase",fontWeight:700,marginBottom:4}}>AUTOMATION USE CASE {useCase.number} \u00b7 {enabledCats.length} CATEGOR{enabledCats.length===1?"Y":"IES"} ACTIVE</div>
            <h2 style={{fontSize:20,fontWeight:700,color:B.white,marginBottom:4,lineHeight:1.2}}>{useCase.label}</h2>
            <p style={{fontSize:11,color:B.greenLight,fontWeight:500,marginBottom:5}}>{useCase.tagline}</p>
            <p style={{fontSize:10,color:B.gray,lineHeight:1.7,maxWidth:560}}>{useCase.description}</p>
          </div>
          <div style={{display:"flex",gap:8,flexShrink:0}}>
            {useCase.successThresholds&&showPilot&&(
              <div style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:4,padding:"10px 14px",textAlign:"center"}}>
                <div style={{fontSize:9,color:"rgba(255,255,255,0.5)",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:2}}>Pilot Success</div>
                <div style={{fontSize:20,fontWeight:700,color:metCount===thresholdResults.length?B.greenBright:B.amber,lineHeight:1}}>{metCount}/{thresholdResults.length}</div>
              </div>
            )}
            <div style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:4,padding:"10px 14px",textAlign:"center"}}>
              <div style={{fontSize:9,color:"rgba(255,255,255,0.5)",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:2}}>Combined Benefit</div>
              <div style={{fontSize:16,fontWeight:700,color:B.greenBright,lineHeight:1}}>${Math.round(combinedBenefit).toLocaleString()}</div>
            </div>
            <div style={{background:B.green,borderRadius:4,padding:"10px 16px",textAlign:"center"}}>
              <div style={{fontSize:9,color:"rgba(255,255,255,0.65)",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:2}}>Combined ROI</div>
              <div style={{fontSize:26,fontWeight:700,color:B.white,lineHeight:1}}>{roiMultiple}\u00d7</div>
              <div style={{fontSize:9,color:"rgba(255,255,255,0.5)",marginTop:2}}>{enabledCats.length} cat{enabledCats.length>1?"s":""}</div>
            </div>
          </div>
        </div>
      </div>
      {/* Category selector bar */}
      <div style={{padding:"12px 32px",background:B.offWhite,borderBottom:"1px solid #E8E8E8",display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
        <span style={{fontSize:9,color:B.green,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",marginRight:4}}>Active Categories:</span>
        {enabledCats.map(catId=>{
          const cat=useCase.evalCategories.find(c=>c.id===catId);
          return cat?(
            <span key={catId} style={{display:"inline-flex",alignItems:"center",gap:4,background:B.greenBg,border:`1px solid ${B.green}`,borderRadius:3,padding:"4px 10px",fontSize:9,fontWeight:600,color:B.greenDark}}>
              {cat.label}
              {enabledCats.length>1&&<button onClick={()=>onToggleCat(catId)} style={{background:"none",border:"none",cursor:"pointer",color:B.red,fontSize:10,fontWeight:700,marginLeft:2,padding:0}}>\u00d7</button>}
            </span>
          ):null;
        })}
        {availableCats.length>0&&(
          <div style={{position:"relative",display:"inline-block"}}>
            <select
              onChange={e=>{if(e.target.value)onToggleCat(e.target.value);e.target.value="";}}
              value=""
              style={{background:B.white,border:`1px dashed ${B.green}`,borderRadius:3,padding:"4px 8px",fontSize:9,fontWeight:600,color:B.green,cursor:"pointer",appearance:"auto"}}>
              <option value="">+ Add Category</option>
              {availableCats.map(c=><option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </div>
        )}
      </div>

      {/* Category panels */}
      <div style={{padding:"16px 32px"}}>
        {catResults.map(({cat,catId,vals,scenarioIdx})=>(
          <CategoryPanel
            key={catId}
            useCase={useCase}
            cat={cat}
            vals={vals}
            onChange={(key,val)=>onValueChange(catId,key,val)}
            scenarioIdx={scenarioIdx}
            setScenarioIdx={idx=>onScenarioChange(catId,idx)}
            onRemove={()=>onToggleCat(catId)}
            isOnly={enabledCats.length===1}
          />
        ))}
        {/* Combined Use Case Summary (when multiple categories) */}
        {enabledCats.length>1&&(
          <div style={{background:B.white,border:"1px solid #E8E8E8",borderTop:`3px solid ${B.green}`,borderRadius:4,padding:"16px 18px",marginBottom:14}}>
            <div style={{fontSize:9,color:B.green,letterSpacing:"0.1em",textTransform:"uppercase",fontWeight:700,marginBottom:10}}>Combined Use Case Summary ({enabledCats.length} categories)</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
              {[
                {label:"Combined Annual Benefit",value:"$"+Math.round(combinedBenefit).toLocaleString(),hl:true},
                {label:"Combined ROI",value:Math.round(combinedROI)+"%",hl:true},
                {label:"Hours Recovered",value:Math.round(combinedHours).toLocaleString()+" hrs"},
                {label:"FTE Equivalent",value:combinedFTE.toFixed(1)+" FTEs"},
              ].map(s=>(
                <div key={s.label} style={{background:s.hl?B.greenBg:B.cardBg,border:s.hl?`2px solid ${B.green}`:"1px solid #E8E8E8",borderRadius:4,padding:"10px 12px",textAlign:"center"}}>
                  <div style={{fontSize:8,color:s.hl?B.green:B.gray,textTransform:"uppercase",letterSpacing:"0.08em",fontWeight:700,marginBottom:3}}>{s.label}</div>
                  <div style={{fontSize:s.hl?18:14,fontWeight:700,color:s.hl?B.greenDark:B.black}}>{s.value}</div>
                </div>
              ))}
            </div>
            {/* Per-category breakdown */}
            <div style={{marginTop:12}}>
              {catResults.map(r=>{
                const share=combinedBenefit>0?(r.results.totalBenefit/combinedBenefit)*100:0;
                return(
                  <div key={r.catId} style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
                    <span style={{fontSize:9,fontWeight:600,color:B.darkGray,minWidth:140}}>{r.cat.label}</span>
                    <div style={{flex:1,height:5,background:B.offWhite,borderRadius:3,overflow:"hidden"}}>
                      <div style={{height:"100%",width:share+"%",background:B.green,borderRadius:3}}/>
                    </div>
                    <span style={{fontSize:9,fontWeight:700,color:B.black,minWidth:80,textAlign:"right"}}>${Math.round(r.results.totalBenefit).toLocaleString()} ({share.toFixed(0)}%)</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Benchmarks */}
        <div style={{background:B.black,borderRadius:4,padding:"14px 16px",marginBottom:14}}>
          <div style={{fontSize:9,color:B.greenBright,letterSpacing:"0.1em",textTransform:"uppercase",fontWeight:700,marginBottom:8}}>Validated Pilot Outcomes</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>
            {useCase.benchmarks.map((b,i)=>(
              <div key={i} style={{background:"rgba(255,255,255,0.04)",borderLeft:`2px solid ${B.green}`,borderRadius:2,padding:"7px 9px"}}>
                <div style={{fontSize:13,fontWeight:700,color:B.greenBright,marginBottom:1}}>{b.stat}</div>
                <div style={{fontSize:9,color:B.gray,lineHeight:1.4}}>{b.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Executive Summary */}
        <div style={{background:B.black,borderRadius:4,padding:"14px 16px",marginBottom:14}}>
          <div style={{fontSize:9,color:B.greenBright,letterSpacing:"0.1em",textTransform:"uppercase",fontWeight:700,marginBottom:6}}>Executive Summary</div>
          <p style={{fontSize:10,color:"#CCCCCC",lineHeight:1.9}}>
            Across <span style={{color:B.greenBright,fontWeight:700}}>{enabledCats.length} evaluation categor{enabledCats.length===1?"y":"ies"}</span> ({catResults.map(r=>r.cat.label).join(", ")}), this use case delivers <span style={{color:B.white,fontWeight:700}}>${Math.round(combinedBenefit).toLocaleString()}</span> in combined annual benefit, recovering <span style={{color:B.white,fontWeight:700}}>{combinedFTE.toFixed(1)} FTEs</span> of engineering capacity \u2014 a <span style={{color:B.greenBright,fontWeight:700}}>{Math.round(combinedROI)}% ROI</span> against a <span style={{color:B.white,fontWeight:700}}>${(combinedCost).toLocaleString()}</span> investment.
          </p>
        </div>
        {/* Success Thresholds with toggle */}
        {useCase.successThresholds&&(
          <div style={{background:B.white,border:"1px solid #E8E8E8",borderTop:`3px solid ${B.green}`,borderRadius:4,padding:"16px 18px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                <div style={{fontSize:9,color:B.green,letterSpacing:"0.1em",textTransform:"uppercase",fontWeight:700}}>Pilot Success Thresholds</div>
                {/* Toggle switch */}
                <button onClick={onTogglePilot} style={{
                  display:"inline-flex",alignItems:"center",gap:6,
                  background:showPilot?B.greenBg:B.offWhite,
                  border:`1px solid ${showPilot?B.green:B.disabledGray}`,
                  borderRadius:12,padding:"3px 10px",cursor:"pointer",
                  fontSize:8,fontWeight:600,
                  color:showPilot?B.greenDark:B.gray,
                  transition:"all 0.15s",
                }}>
                  <span style={{
                    display:"inline-block",width:20,height:12,borderRadius:6,
                    background:showPilot?B.green:B.disabledGray,
                    position:"relative",transition:"background 0.15s",
                  }}>
                    <span style={{
                      position:"absolute",top:2,left:showPilot?10:2,
                      width:8,height:8,borderRadius:4,background:B.white,
                      transition:"left 0.15s",boxShadow:"0 1px 2px rgba(0,0,0,0.2)",
                    }}/>
                  </span>
                  {showPilot?"Pilot Enabled":"Pilot Disabled"}
                </button>
              </div>
              {showPilot&&<div style={{fontSize:9,color:B.gray}}>Drag sliders to your achieved results</div>}
            </div>
            {showPilot?(
              <>
                <p style={{fontSize:10,color:B.gray,marginBottom:12,lineHeight:1.5}}>Track actual pilot outcomes against success targets.</p>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                  {thresholdResults.map(t=>(
                    <ThresholdMeter key={t.key} threshold={t} value={thresholds[t.key]??0}
                      onChange={(key,val)=>onThresholdChange(useCase.id,key,val)}/>
                  ))}
                </div>
                <div style={{marginTop:10,padding:"8px 12px",background:metCount===thresholdResults.length?B.greenBg:B.amberBg,border:`1px solid ${metCount===thresholdResults.length?B.green:B.amber}`,borderRadius:4,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span style={{fontSize:9,color:B.darkGray}}>Pilot success score</span>
                  <span style={{fontSize:13,fontWeight:700,color:metCount===thresholdResults.length?B.greenDark:B.amber}}>{metCount} of {thresholdResults.length} thresholds met {metCount===thresholdResults.length?"\u2713":"\u2014 in progress"}</span>
                </div>
              </>
            ):(
              <p style={{fontSize:10,color:B.gray,marginTop:4}}>Pilot evaluation is currently disabled for this use case. Toggle on to track pilot outcomes.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function DisabledTab({useCase,onEnable}){
  return(
    <div style={{padding:"60px 32px",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:16,minHeight:300}}>
      <div style={{width:48,height:48,borderRadius:8,background:B.offWhite,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,color:B.gray}}>\u25cc</div>
      <div style={{textAlign:"center"}}>
        <div style={{fontSize:14,fontWeight:700,color:B.darkGray,marginBottom:4}}>{useCase.label} is excluded</div>
        <div style={{fontSize:11,color:B.gray}}>This use case is not included in the Summary or PDF export.</div>
      </div>
      <button onClick={onEnable} style={{background:B.green,border:"none",borderRadius:4,padding:"9px 20px",cursor:"pointer",color:B.white,fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em"}}>
        + Include This Use Case
      </button>
    </div>
  );
}

// ─── SUMMARY TAB (per-category breakdown) ───

function SummaryTab({allCatResults,customerName,enabled,enabledCats,catValues,catScenarios,thresholds,showPilot}){
  if(allCatResults.length===0) return(
    <div style={{padding:"60px 32px",textAlign:"center"}}>
      <div style={{fontSize:14,color:B.gray,marginBottom:8}}>No use cases are currently included.</div>
      <div style={{fontSize:11,color:B.gray}}>Enable at least one use case tab to see the summary.</div>
    </div>
  );
  const useCaseMap={};
  allCatResults.forEach(r=>{
    if(!useCaseMap[r.useCase.id]) useCaseMap[r.useCase.id]={useCase:r.useCase,cats:[],maxCost:0};
    useCaseMap[r.useCase.id].cats.push(r);
    useCaseMap[r.useCase.id].maxCost=Math.max(useCaseMap[r.useCase.id].maxCost,r.augmentCost);
  });
  const grandTotal=allCatResults.reduce((s,r)=>s+r.results.totalBenefit,0);
  const grandCost=Object.values(useCaseMap).reduce((s,p)=>s+p.maxCost,0);
  const grandNet=grandTotal-grandCost;
  const grandROI=grandCost>0?((grandTotal-grandCost)/grandCost)*100:0;
  const grandPayback=grandCost>0?grandCost/(grandTotal/12):0;
  const grandFTE=allCatResults.reduce((s,r)=>s+(r.results.fteEquivalent||0),0);
  const grandHours=allCatResults.reduce((s,r)=>s+(r.results.hoursRecovered||0),0);
  const useCaseCount=Object.keys(useCaseMap).length;

  return(
    <div>
      <div style={{background:B.black,padding:"20px 32px 18px",borderBottom:`4px solid ${B.green}`}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",flexWrap:"wrap",gap:14}}>
          <div style={{flex:1}}>
            <div style={{fontSize:9,color:B.greenBright,letterSpacing:"0.14em",textTransform:"uppercase",fontWeight:700,marginBottom:4}}>COMBINED ROI SUMMARY</div>
            <h2 style={{fontSize:20,fontWeight:700,color:B.white,marginBottom:4}}>{customerName?customerName+" \u00d7 Augment Code":"Full Platform ROI Summary"}</h2>
            <p style={{fontSize:10,color:B.gray,lineHeight:1.7,maxWidth:560}}>Consolidated view across {useCaseCount} use case{useCaseCount>1?"s":""}, {allCatResults.length} evaluation categor{allCatResults.length===1?"y":"ies"}.</p>
          </div>
          <div style={{display:"flex",gap:8}}>
            {[{label:"Total Benefit",value:"$"+Math.round(grandTotal).toLocaleString()},{label:"Combined ROI",value:Math.round(grandROI)+"%"},{label:"Payback",value:grandPayback.toFixed(1)+" mo"}].map(s=>(
              <div key={s.label} style={{background:B.green,borderRadius:4,padding:"10px 14px",textAlign:"center",minWidth:80}}>
                <div style={{fontSize:9,color:"rgba(255,255,255,0.65)",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:2}}>{s.label}</div>
                <div style={{fontSize:s.value.length>8?14:18,fontWeight:700,color:B.white,lineHeight:1}}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div style={{padding:"18px 32px"}}>
        {/* Export PDF button */}
        <div style={{textAlign:"right",marginBottom:16}}>
          <button onClick={()=>generatePDF(allCatResults,customerName,enabled,enabledCats,catValues,catScenarios,thresholds,showPilot)}
            style={{background:B.green,color:"white",border:"none",padding:"10px 24px",borderRadius:6,fontSize:11,fontWeight:700,cursor:"pointer",letterSpacing:"0.04em",textTransform:"uppercase",display:"inline-flex",alignItems:"center",gap:6}}>
            <span style={{fontSize:14}}>\u2193</span> Export to PDF
          </button>
        </div>
        {/* Per-category breakdown table */}
        <div style={{background:B.white,border:"1px solid #E8E8E8",borderTop:`3px solid ${B.green}`,borderRadius:4,padding:"16px 18px",marginBottom:16}}>
          <div style={{fontSize:9,color:B.green,letterSpacing:"0.1em",textTransform:"uppercase",fontWeight:700,marginBottom:10}}>Per-Category Breakdown</div>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead>
              <tr style={{borderBottom:`2px solid ${B.green}`}}>
                {["Use Case","Category","Scenario","Total Benefit","ROI","FTEs","Payback"].map(h=>(
                  <th key={h} style={{fontSize:8,color:B.green,textTransform:"uppercase",letterSpacing:"0.06em",fontWeight:700,padding:"0 6px 6px 0",textAlign:"left"}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {allCatResults.map((r,i)=>(
                <tr key={r.useCase.id+"-"+r.catId} style={{borderBottom:"1px solid #F0F0F0",background:i%2===0?B.white:B.cardBg}}>
                  <td style={{padding:"8px 6px 8px 0",fontWeight:700,fontSize:10,color:B.black}}>
                    <div style={{display:"flex",alignItems:"center",gap:4}}>
                      <span style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:15,height:15,borderRadius:2,background:B.green,fontSize:7,fontWeight:700,color:B.white,flexShrink:0}}>{r.useCase.number}</span>
                      {r.useCase.label}
                    </div>
                  </td>
                  <td style={{padding:"8px 6px 8px 0",fontSize:9,color:B.gray}}>{r.categoryLabel}</td>
                  <td style={{padding:"8px 6px 8px 0",fontSize:9,color:B.gray}}>{SL[r.scenarioIdx]}</td>
                  <td style={{padding:"8px 6px 8px 0",fontSize:11,fontWeight:700,color:B.greenDark}}>${Math.round(r.results.totalBenefit).toLocaleString()}</td>
                  <td style={{padding:"8px 6px 8px 0"}}><span style={{fontSize:10,fontWeight:700,color:B.green,background:B.greenBg,padding:"2px 6px",borderRadius:3}}>{Math.round(r.results.roi)}%</span></td>
                  <td style={{padding:"8px 6px 8px 0",fontSize:10,color:B.darkGray}}>{(r.results.fteEquivalent||0).toFixed(1)}</td>
                  <td style={{padding:"8px 6px 8px 0",fontSize:10,color:B.darkGray}}>{r.results.payback.toFixed(1)} mo</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{borderTop:`2px solid ${B.green}`,background:B.greenBg}}>
                <td colSpan={3} style={{padding:"8px 6px 8px 0",fontSize:11,fontWeight:700,color:B.greenDark}}>TOTAL ({useCaseCount} use cases, {allCatResults.length} categories)</td>
                <td style={{padding:"8px 6px 8px 0",fontSize:12,fontWeight:700,color:B.greenDark}}>${Math.round(grandTotal).toLocaleString()}</td>
                <td style={{padding:"8px 6px 8px 0"}}><span style={{fontSize:12,fontWeight:700,color:B.white,background:B.green,padding:"2px 7px",borderRadius:3}}>{Math.round(grandROI)}%</span></td>
                <td style={{padding:"8px 6px 8px 0",fontSize:10,fontWeight:700,color:B.greenDark}}>{grandFTE.toFixed(1)}</td>
                <td style={{padding:"8px 6px 8px 0",fontSize:10,fontWeight:700,color:B.greenDark}}>{grandPayback.toFixed(1)} mo</td>
              </tr>
            </tfoot>
          </table>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>
          {/* Distribution */}
          <div style={{background:B.white,border:"1px solid #E8E8E8",borderTop:`3px solid ${B.green}`,borderRadius:4,padding:"14px 16px"}}>
            <div style={{fontSize:9,color:B.green,letterSpacing:"0.1em",textTransform:"uppercase",fontWeight:700,marginBottom:10}}>Benefit Distribution</div>
            {allCatResults.map(r=>{
              const share=grandTotal>0?(r.results.totalBenefit/grandTotal)*100:0;
              return(
                <div key={r.useCase.id+"-"+r.catId} style={{marginBottom:10}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                    <span style={{fontSize:9,color:B.darkGray,fontWeight:600}}>{r.useCase.label} \u2014 {r.categoryLabel}</span>
                    <span style={{fontSize:9,fontWeight:700,color:B.black}}>${Math.round(r.results.totalBenefit).toLocaleString()} ({share.toFixed(0)}%)</span>
                  </div>
                  <div style={{height:4,background:B.offWhite,borderRadius:3,overflow:"hidden"}}>
                    <div style={{height:"100%",width:share+"%",background:B.green,borderRadius:3}}/>
                  </div>
                </div>
              );
            })}
          </div>
          {/* KPIs */}
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {[
              {label:"Total Annual Benefit",value:"$"+Math.round(grandTotal).toLocaleString(),sub:"across all categories"},
              {label:"Engineering Hours Recovered",value:Math.round(grandHours).toLocaleString()+" hrs",sub:"per year"},
              {label:"FTE Capacity Recovered",value:grandFTE.toFixed(1)+" FTEs",sub:"equivalent headcount"},
              {label:"Net Annual Return",value:"$"+Math.round(grandNet).toLocaleString(),sub:"benefit minus platform cost"},
            ].map(s=>(
              <div key={s.label} style={{background:B.cardBg,border:"1px solid #E8E8E8",borderLeft:`3px solid ${B.green}`,borderRadius:4,padding:"9px 12px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div>
                  <div style={{fontSize:9,color:B.gray,textTransform:"uppercase",letterSpacing:"0.06em",fontWeight:500}}>{s.label}</div>
                  <div style={{fontSize:9,color:B.gray,marginTop:1}}>{s.sub}</div>
                </div>
                <div style={{fontSize:15,fontWeight:700,color:B.greenDark}}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Exec narrative */}
        <div style={{background:B.black,borderRadius:4,padding:"14px 16px"}}>
          <div style={{fontSize:9,color:B.greenBright,letterSpacing:"0.1em",textTransform:"uppercase",fontWeight:700,marginBottom:6}}>Combined Executive Narrative</div>
          <p style={{fontSize:10,color:"#CCCCCC",lineHeight:1.9,maxWidth:800}}>
            Across {useCaseCount} active Augment Code use case{useCaseCount>1?"s":""} and {allCatResults.length} evaluation categor{allCatResults.length===1?"y":"ies"}, the platform delivers <span style={{color:B.white,fontWeight:700}}>${Math.round(grandTotal).toLocaleString()}</span> in annual benefit against a <span style={{color:B.white,fontWeight:700}}>${Math.round(grandCost).toLocaleString()}</span> investment \u2014 a <span style={{color:B.greenBright,fontWeight:700}}>{Math.round(grandROI)}% combined ROI</span> with a payback period of <span style={{color:B.greenBright,fontWeight:700}}>{grandPayback.toFixed(1)} months</span>, recovering <span style={{color:B.white,fontWeight:700}}>{grandFTE.toFixed(1)} FTEs</span> of engineering capacity annually.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN APP ───

export default function App(){
  const [activeTab,setActiveTab]=useState("code-review");
  const [customerName,setCustomerName]=useState("");
  const [editingName,setEditingName]=useState(false);
  const [enabled,setEnabled]=useState({"code-review":true,"unit-test":true,"build-failure":true,"interactive":true});
  const [showPilot,setShowPilot]=useState({"code-review":true,"unit-test":true,"build-failure":true,"interactive":true});

  const [enabledCats,setEnabledCats]=useState({
    "code-review":["throughput"],
    "unit-test":["velocity"],
    "build-failure":["mttr"],
    "interactive":["productivity"],
  });

  const [catScenarios,setCatScenarios]=useState(()=>{
    const s={};
    USE_CASES.forEach(p=>{s[p.id]={};p.evalCategories.forEach(c=>{s[p.id][c.id]=1;});});
    return s;
  });

  const [catValues,setCatValues]=useState(()=>{
    const init={};
    USE_CASES.forEach(p=>{
      init[p.id]={};
      p.evalCategories.forEach(cat=>{
        init[p.id][cat.id]={};
        cat.inputs.forEach(inp=>{init[p.id][cat.id][inp.key]=inp.default;});
      });
    });
    return init;
  });

  const [thresholds,setThresholds]=useState(()=>{
    const t={};
    USE_CASES.forEach(p=>{if(p.successThresholds){t[p.id]={};p.successThresholds.forEach(s=>{t[p.id][s.key]=0;});}});
    return t;
  });

  const handleValueChange=useCallback((useCaseId,catId,key,val)=>{
    setCatValues(prev=>({
      ...prev,
      [useCaseId]:{...prev[useCaseId],[catId]:{...prev[useCaseId]?.[catId],[key]:val}}
    }));
  },[]);

  const handleScenarioChange=useCallback((useCaseId,catId,idx)=>{
    setCatScenarios(prev=>({
      ...prev,
      [useCaseId]:{...prev[useCaseId],[catId]:idx}
    }));
  },[]);

  const handleToggleCat=useCallback((useCaseId,catId)=>{
    setEnabledCats(prev=>{
      const current=prev[useCaseId]||[];
      if(current.includes(catId)){
        if(current.length<=1) return prev;
        return {...prev,[useCaseId]:current.filter(c=>c!==catId)};
      } else {
        return {...prev,[useCaseId]:[...current,catId]};
      }
    });
  },[]);

  const handleThresholdChange=useCallback((useCaseId,key,val)=>{
    setThresholds(prev=>({...prev,[useCaseId]:{...prev[useCaseId],[key]:val}}));
  },[]);

  const handleTogglePilot=useCallback((useCaseId)=>{
    setShowPilot(prev=>({...prev,[useCaseId]:!prev[useCaseId]}));
  },[]);

  const allCatResults=[];
  USE_CASES.filter(p=>enabled[p.id]).forEach(useCase=>{
    const cats=enabledCats[useCase.id]||[];
    cats.forEach(catId=>{
      const cat=useCase.evalCategories.find(c=>c.id===catId);
      if(!cat) return;
      const vals=catValues[useCase.id]?.[catId]||{};
      const si=catScenarios[useCase.id]?.[catId]??1;
      const pct=useCase.savingsRange[si];
      const results=useCase.compute(vals,pct,catId);
      allCatResults.push({
        useCase,catId,cat,
        categoryLabel:cat.label,
        scenarioIdx:si,
        results,
        augmentCost:vals.augmentCost||180000,
        thresholds:thresholds[useCase.id]||{},
      });
    });
  });

  const activeUseCase=USE_CASES.find(p=>p.id===activeTab);

  const tabLabel=(p)=>{
    const isEn=enabled[p.id];
    const catCount=(enabledCats[p.id]||[]).length;
    return(
      <button key={p.id} onClick={()=>setActiveTab(p.id)} style={{
        background:"transparent",border:"none",
        borderBottom:activeTab===p.id?`3px solid ${B.green}`:"3px solid transparent",
        padding:"10px 14px 8px",cursor:"pointer",
        color:activeTab===p.id?B.green:isEn?B.gray:"#CCCCCC",
        fontWeight:activeTab===p.id?700:500,
        fontSize:10,letterSpacing:"0.06em",textTransform:"uppercase",
        transition:"all 0.15s",display:"flex",alignItems:"center",gap:5,
        textDecoration:isEn?"none":"line-through",opacity:isEn?1:0.5,
      }}>
        <span style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:15,height:15,borderRadius:2,background:activeTab===p.id&&isEn?B.green:isEn?"transparent":"#E0E0E0",border:`1px solid ${activeTab===p.id&&isEn?B.green:isEn?B.gray:"#CCC"}`,fontSize:7,fontWeight:700,color:activeTab===p.id&&isEn?B.white:isEn?B.gray:"#AAA"}}>
          {p.number}
        </span>
        {p.label}
        {isEn&&catCount>1&&<span style={{fontSize:8,color:B.greenBright,background:B.greenDark,borderRadius:8,padding:"1px 5px",marginLeft:2}}>{catCount}</span>}
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
        input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:14px;height:14px;border-radius:50%;background:${B.green};cursor:pointer;border:2px solid ${B.white};box-shadow:0 1px 4px rgba(0,0,0,0.2)}
        input[type=range]::-webkit-slider-thumb:hover{transform:scale(1.2)}
        input[type=range]::-moz-range-thumb{width:14px;height:14px;border-radius:50%;background:${B.green};cursor:pointer;border:2px solid ${B.white}}
        button,input[type=text],select{font-family:'Roboto Mono',monospace}
      `}</style>

      {/* HEADER */}
      <div style={{background:B.black,padding:"0 32px",display:"flex",alignItems:"center",justifyContent:"space-between",height:50}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{width:24,height:24,borderRadius:4,background:B.green,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:B.white}}>A</div>
          <span style={{fontSize:10,fontWeight:700,color:B.white,letterSpacing:"0.1em",textTransform:"uppercase"}}>augment code</span>
          <span style={{color:B.darkGray,margin:"0 4px"}}>\u00b7</span>
          {editingName?(
            <input type="text" value={customerName} onChange={e=>setCustomerName(e.target.value)}
              onBlur={()=>setEditingName(false)} onKeyDown={e=>e.key==="Enter"&&setEditingName(false)}
              autoFocus placeholder="Customer name\u2026"
              style={{background:"transparent",border:"none",borderBottom:`1px solid ${B.green}`,color:B.white,fontSize:10,outline:"none",width:180}}/>
          ):(
            <span onClick={()=>setEditingName(true)} style={{fontSize:10,color:customerName?B.greenLight:B.gray,cursor:"pointer",borderBottom:`1px dashed ${B.darkGray}`}}>
              {customerName||"Click to add customer name"}
            </span>
          )}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:9,color:B.gray,letterSpacing:"0.08em",textTransform:"uppercase"}}>{allCatResults.length} categories across {Object.keys(enabled).filter(k=>enabled[k]).length} use cases</span>
        </div>
      </div>
      {/* TABS */}
      <div style={{background:B.offWhite,borderBottom:"1px solid #E0E0E0",padding:"0 32px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{display:"flex"}}>
          {USE_CASES.map(p=>tabLabel(p))}
          <button onClick={()=>setActiveTab("summary")} style={{
            background:"transparent",border:"none",
            borderBottom:activeTab==="summary"?`3px solid ${B.green}`:"3px solid transparent",
            padding:"10px 14px 8px",cursor:"pointer",
            color:activeTab==="summary"?B.green:B.gray,
            fontWeight:activeTab==="summary"?700:500,
            fontSize:10,letterSpacing:"0.06em",textTransform:"uppercase",
            display:"flex",alignItems:"center",gap:5,
          }}>
            <span style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:15,height:15,borderRadius:2,background:activeTab==="summary"?B.green:"transparent",border:`1px solid ${activeTab==="summary"?B.green:B.gray}`,fontSize:8,fontWeight:700,color:activeTab==="summary"?B.white:B.gray}}>\u03a3</span>
            Summary
          </button>
        </div>
        {activeUseCase&&(
          <button onClick={()=>{
            const next=!enabled[activeUseCase.id];
            setEnabled(prev=>({...prev,[activeUseCase.id]:next}));
          }} style={{
            background:"transparent",border:`1px solid ${enabled[activeUseCase.id]?B.red:B.green}`,
            borderRadius:4,padding:"4px 10px",cursor:"pointer",
            color:enabled[activeUseCase.id]?B.red:B.green,
            fontSize:9,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.06em",
          }}>
            {enabled[activeUseCase.id]?"\u2715 Exclude":"+ Include"}
          </button>
        )}
      </div>

      {/* CONTENT */}
      {activeTab==="summary"?(
        <SummaryTab allCatResults={allCatResults} customerName={customerName} enabled={enabled} enabledCats={enabledCats} catValues={catValues} catScenarios={catScenarios} thresholds={thresholds} showPilot={Object.values(showPilot).some(v=>v)}/>
      ):activeUseCase?(
        enabled[activeUseCase.id]?(
          <UseCaseTab
            useCase={activeUseCase}
            enabledCats={enabledCats[activeUseCase.id]||[]}
            catValues={catValues[activeUseCase.id]||{}}
            catScenarios={catScenarios[activeUseCase.id]||{}}
            onValueChange={(catId,key,val)=>handleValueChange(activeUseCase.id,catId,key,val)}
            onScenarioChange={(catId,idx)=>handleScenarioChange(activeUseCase.id,catId,idx)}
            onToggleCat={catId=>handleToggleCat(activeUseCase.id,catId)}
            thresholds={thresholds[activeUseCase.id]||{}}
            onThresholdChange={handleThresholdChange}
            showPilot={showPilot[activeUseCase.id]??true}
            onTogglePilot={()=>handleTogglePilot(activeUseCase.id)}
          />
        ):(
          <DisabledTab useCase={activeUseCase} onEnable={()=>setEnabled(prev=>({...prev,[activeUseCase.id]:true}))}/>
        )
      ):null}

      {/* FOOTER */}
      <div style={{borderTop:"1px solid #E8E8E8",padding:"8px 32px",display:"flex",justifyContent:"space-between",alignItems:"center",background:B.offWhite}}>
        <span style={{fontSize:9,color:B.gray}}>* Illustrative estimates based on Augment Code pilot data and industry benchmarks.</span>
        <span style={{fontSize:9,color:B.gray,letterSpacing:"0.06em",textTransform:"uppercase"}}>PRIVILEGED & CONFIDENTIAL \u00b7 augment code</span>
      </div>
    </div>
  );
}
