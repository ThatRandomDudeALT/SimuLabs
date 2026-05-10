import { useState, useEffect, useRef } from 'react';

// --- CHEMICAL DATABASE ---
const ACIDS = {
  HCl: { name: "Hydrochloric Acid (HCl)", strength: "strong", basicity: 1, molarMass: 36.5 },
  HNO3: { name: "Nitric Acid (HNO₃)", strength: "strong", basicity: 1, molarMass: 63.0 },
  H2SO4: { name: "Tetraoxosulphate(VI) Acid (H₂SO₄)", strength: "strong", basicity: 2, molarMass: 98.0 },
  CH3COOH: { name: "Ethanoic Acid (CH₃COOH)", strength: "weak", basicity: 1, molarMass: 60.0 },
  H2C2O4: { name: "Ethanedioic Acid (H₂C₂O₄ / Oxalic)", strength: "weak", basicity: 2, molarMass: 90.0 },
  H3PO4: { name: "Trioxophosphate(V) Acid (H₃PO₄)", strength: "weak", basicity: 3, molarMass: 98.0 },
};

const BASES = {
  NaOH: { name: "Sodium Hydroxide (NaOH)", strength: "strong", acidity: 1, molarMass: 40.0 },
  KOH: { name: "Potassium Hydroxide (KOH)", strength: "strong", acidity: 1, molarMass: 56.1 },
  CaOH2: { name: "Calcium Hydroxide (Ca(OH)₂)", strength: "strong", acidity: 2, molarMass: 74.1 },
  NH3: { name: "Aqueous Ammonia (NH₃)", strength: "weak", acidity: 1, molarMass: 17.0 },
  Na2CO3: { name: "Sodium Trioxocarbonate(IV) (Na₂CO₃)", strength: "weak", acidity: 2, molarMass: 106.0 },
  NaHCO3: { name: "Sodium Hydrogentrioxocarbonate(IV) (NaHCO₃)", strength: "weak", acidity: 1, molarMass: 84.0 },
};

const INDICATORS = {
  Phenolphthalein: { name: "Phenolphthalein", range: [8.2, 10.0], desc: "Pink in base, colorless in acid." },
  MethylOrange: { name: "Methyl Orange", range: [3.1, 4.4], desc: "Red in acid, yellow in base." },
  BromothymolBlue: { name: "Bromothymol Blue", range: [6.0, 7.6], desc: "Yellow in acid, blue in base." },
  Litmus: { name: "Litmus Solution", range: [5.0, 8.0], desc: "Red in acid, blue in base." },
};

// --- EXPANDED QUALITATIVE ANALYSIS DATABASE ---
const REAGENTS_LIST = {
  NaOH: { name: "Sodium Hydroxide (NaOH)", modes: ["dropwise", "excess"] },
  NH3: { name: "Aqueous Ammonia (NH₃)", modes: ["dropwise", "excess"] },
  BaCl2: { name: "Barium Chloride (BaCl₂)", modes: ["standard"] },
  HCl: { name: "Dilute Hydrochloric Acid (HCl)", modes: ["standard"] },
  AgNO3: { name: "Silver Nitrate (AgNO₃) + HNO₃", modes: ["standard"] },
  FeCl3: { name: "Iron(III) Chloride (FeCl₃)", modes: ["standard"] }
};

const QUAL_SALTS = [
  {
    id: "FeSO4",
    name: "Salt Sample A",
    formula: "FeSO₄",
    color: "rgba(167, 243, 208, 0.4)", // Pale green
    tests: {
      "NaOH-dropwise": { observation: "Dirty-green gelatinous precipitate forms.", inference: "Fe²⁺ present", color: "rgba(16, 185, 129, 0.75)", state: "precipitate" },
      "NaOH-excess": { observation: "Dirty-green precipitate remains insoluble in excess.", inference: "Fe²⁺ confirmed", color: "rgba(16, 185, 129, 0.8)", state: "precipitate" },
      "NH3-dropwise": { observation: "Dirty-green precipitate forms.", inference: "Fe²⁺ present", color: "rgba(16, 185, 129, 0.75)", state: "precipitate" },
      "NH3-excess": { observation: "Dirty-green precipitate remains insoluble in excess.", inference: "Fe²⁺ confirmed", color: "rgba(16, 185, 129, 0.8)", state: "precipitate" },
      "BaCl2-standard": { observation: "White precipitate forms instantly.", inference: "SO₄²⁻, SO₃²⁻, or CO₃²⁻ present", color: "rgba(241, 245, 249, 0.9)", state: "precipitate" },
      "HCl-standard": { observation: "No gas evolved. White precipitate remains completely insoluble.", inference: "SO₄²⁻ confirmed", color: "rgba(241, 245, 249, 0.85)", state: "precipitate" },
      "AgNO3-standard": { observation: "No visible reaction.", inference: "Cl⁻ absent", color: "rgba(167, 243, 208, 0.4)", state: "clear" },
      "FeCl3-standard": { observation: "No visible reaction.", inference: "No complex formed", color: "rgba(167, 243, 208, 0.4)", state: "clear" }
    }
  },
  {
    id: "CuSO4",
    name: "Salt Sample B",
    formula: "CuSO₄",
    color: "rgba(147, 197, 253, 0.45)", // Pale blue
    tests: {
      "NaOH-dropwise": { observation: "Pale blue gelatinous precipitate forms.", inference: "Cu²⁺ present", color: "rgba(59, 130, 246, 0.85)", state: "precipitate" },
      "NaOH-excess": { observation: "Pale blue precipitate remains insoluble in excess.", inference: "Cu²⁺ confirmed", color: "rgba(59, 130, 246, 0.9)", state: "precipitate" },
      "NH3-dropwise": { observation: "Pale blue precipitate forms.", inference: "Cu²⁺ present", color: "rgba(59, 130, 246, 0.85)", state: "precipitate" },
      "NH3-excess": { observation: "Precipitate dissolves to form a deep royal blue solution.", inference: "Cu²⁺ confirmed as complex ion", color: "rgba(30, 58, 138, 0.9)", state: "clear" },
      "BaCl2-standard": { observation: "White precipitate forms.", inference: "SO₄²⁻, SO₃²⁻, or CO₃²⁻ present", color: "rgba(241, 245, 249, 0.9)", state: "precipitate" },
      "HCl-standard": { observation: "No reaction. White precipitate is insoluble.", inference: "SO₄²⁻ confirmed", color: "rgba(241, 245, 249, 0.85)", state: "precipitate" },
      "AgNO3-standard": { observation: "No visible reaction.", inference: "Cl⁻ absent", color: "rgba(147, 197, 253, 0.45)", state: "clear" },
      "FeCl3-standard": { observation: "No visible reaction.", inference: "No reaction", color: "rgba(147, 197, 253, 0.45)", state: "clear" }
    }
  },
  {
    id: "ZnCl2",
    name: "Salt Sample C",
    formula: "ZnCl₂",
    color: "rgba(255, 255, 255, 0.15)", // Colorless
    tests: {
      "NaOH-dropwise": { observation: "White gelatinous precipitate forms.", inference: "Al³⁺, Pb²⁺, or Zn²⁺ present", color: "rgba(248, 250, 252, 0.8)", state: "precipitate" },
      "NaOH-excess": { observation: "White precipitate dissolves completely to form a colorless solution.", inference: "Al³⁺, Pb²⁺, or Zn²⁺ present", color: "rgba(255, 255, 255, 0.15)", state: "clear" },
      "NH3-dropwise": { observation: "White gelatinous precipitate forms.", inference: "Al³⁺, Pb²⁺, or Zn²⁺ present", color: "rgba(248, 250, 252, 0.8)", state: "precipitate" },
      "NH3-excess": { observation: "White precipitate dissolves completely to form a colorless solution.", inference: "Zn²⁺ confirmed", color: "rgba(255, 255, 255, 0.15)", state: "clear" },
      "BaCl2-standard": { observation: "No precipitate forms.", inference: "SO₄²⁻, SO₃²⁻, CO₃²⁻ absent", color: "rgba(255, 255, 255, 0.15)", state: "clear" },
      "HCl-standard": { observation: "No gas evolved.", inference: "Acid added", color: "rgba(255, 255, 255, 0.15)", state: "clear" },
      "AgNO3-standard": { observation: "Clingy, white curdy precipitate forms.", inference: "Cl⁻ present", color: "rgba(226, 232, 240, 0.9)", state: "precipitate" },
      "FeCl3-standard": { observation: "No visible reaction.", inference: "No reaction", color: "rgba(255, 255, 255, 0.15)", state: "clear" }
    }
  },
  {
    id: "Na2CO3",
    name: "Salt Sample D",
    formula: "Na₂CO₃",
    color: "rgba(255, 255, 255, 0.15)", // Colorless
    tests: {
      "NaOH-dropwise": { observation: "No visible change.", inference: "Na⁺ present or Group 1 metal", color: "rgba(255, 255, 255, 0.15)", state: "clear" },
      "NaOH-excess": { observation: "No visible change.", inference: "Group 1 metal confirmed", color: "rgba(255, 255, 255, 0.15)", state: "clear" },
      "NH3-dropwise": { observation: "No visible change.", inference: "No transition metals", color: "rgba(255, 255, 255, 0.15)", state: "clear" },
      "NH3-excess": { observation: "No visible change.", inference: "Cation remains unprecipitated", color: "rgba(255, 255, 255, 0.15)", state: "clear" },
      "BaCl2-standard": { observation: "White precipitate forms.", inference: "SO₄²⁻, SO₃²⁻, or CO₃²⁻ present", color: "rgba(241, 245, 249, 0.9)", state: "precipitate" },
      "HCl-standard": { observation: "Rapid effervescence! A colorless, odorless gas evolved which turns lime water milky.", inference: "Gas is CO₂; CO₃²⁻ confirmed", color: "rgba(255, 255, 255, 0.15)", state: "bubbles" },
      "AgNO3-standard": { observation: "Pale yellow/white precipitate forms.", inference: "Anion reaction", color: "rgba(254, 243, 199, 0.8)", state: "precipitate" },
      "FeCl3-standard": { observation: "No visible reaction.", inference: "No reaction", color: "rgba(255, 255, 255, 0.15)", state: "clear" }
    }
  },
  {
    id: "FeCl3",
    name: "Salt Sample E",
    formula: "FeCl₃",
    color: "rgba(217, 119, 6, 0.35)", // Yellowish-brown
    tests: {
      "NaOH-dropwise": { observation: "Reddish-brown gelatinous precipitate forms.", inference: "Fe³⁺ present", color: "rgba(146, 64, 14, 0.85)", state: "precipitate" },
      "NaOH-excess": { observation: "Reddish-brown precipitate remains insoluble in excess.", inference: "Fe³⁺ confirmed", color: "rgba(146, 64, 14, 0.9)", state: "precipitate" },
      "NH3-dropwise": { observation: "Reddish-brown gelatinous precipitate forms.", inference: "Fe³⁺ present", color: "rgba(146, 64, 14, 0.85)", state: "precipitate" },
      "NH3-excess": { observation: "Reddish-brown precipitate remains insoluble in excess.", inference: "Fe³⁺ confirmed", color: "rgba(146, 64, 14, 0.9)", state: "precipitate" },
      "BaCl2-standard": { observation: "No precipitate forms.", inference: "SO₄²⁻, CO₃²⁻ absent", color: "rgba(217, 119, 6, 0.35)", state: "clear" },
      "HCl-standard": { observation: "No reaction.", inference: "Acid added", color: "rgba(217, 119, 6, 0.35)", state: "clear" },
      "AgNO3-standard": { observation: "Clingy white precipitate forms.", inference: "Cl⁻ present", color: "rgba(241, 245, 249, 0.85)", state: "precipitate" },
      "FeCl3-standard": { observation: "No visible reaction.", inference: "No reaction", color: "rgba(217, 119, 6, 0.35)", state: "clear" }
    }
  }
];

export default function App() {
  // Navigation: 'lab', 'solver', 'gas', 'qual'
  const [activeTab, setActiveTab] = useState('lab');

  // --- TITRATION STATES ---
  const [selectedAcid, setSelectedAcid] = useState('HCl');
  const [selectedBase, setSelectedBase] = useState('NaOH');
  const [selectedIndicator, setSelectedIndicator] = useState('Phenolphthalein');
  const [acidMolarity, setAcidMolarity] = useState(0.1); 
  const [baseMolarity, setBaseMolarity] = useState(0.1);
  const [acidVolume, setAcidVolume] = useState(20.0);
  const [baseAdded, setBaseAdded] = useState(0); 
  const [isDripping, setIsDripping] = useState(false);
  const [titreLogs, setTitreLogs] = useState([]); 
  const [chartData, setChartData] = useState([]); 
  const [flashScreen, setFlashScreen] = useState(false);

  // --- GAS LAWS STATES ---
  const [gasLaw, setGasLaw] = useState('ideal'); 
  const [gasP, setGasP] = useState(1.0); 
  const [gasV, setGasV] = useState(22.4); 
  const [gasT, setGasT] = useState(273.15); 
  const [gasN, setGasN] = useState(1.0); 
  const [gasTargetVar, setGasTargetVar] = useState('V'); 
  const [gasSolverInput, setGasSolverInput] = useState({
    P1: 1.0, V1: 2.0, T1: 298, P2: 2.0, V2: 0, T2: 298
  });
  const [gasSolverResult, setGasSolverResult] = useState(null);

  // --- QUALITATIVE ANALYSIS STATES ---
  const [currentSaltIdx, setCurrentSaltIdx] = useState(0);
  const [selectedReagent, setSelectedReagent] = useState("NaOH");
  const [selectedMode, setSelectedMode] = useState("dropwise");
  const [addedReagents, setAddedReagents] = useState([]); // List of processed interactions (e.g. "NaOH-dropwise")
  const [tubeColor, setTubeColor] = useState("rgba(167, 243, 208, 0.4)");
  const [tubeState, setTubeState] = useState("clear"); // clear, precipitate, bubbles
  const [qualLogs, setQualLogs] = useState([]); // Array of { test, observation, inference }

  const activeSalt = QUAL_SALTS[currentSaltIdx];

  // Sound Synth Ref & Kinetic Gas Refs
  const audioCtxRef = useRef(null);
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);

  const acid = ACIDS[selectedAcid];
  const base = BASES[selectedBase];
  const hPlusRatio = acid.basicity;
  const ohMinusRatio = base.acidity;
  const equivalencePoint = (acidMolarity * acidVolume * hPlusRatio) / (baseMolarity * ohMinusRatio);

  const calculatePHValue = (addedVolume, currentAcid, currentBase, eqPoint) => {
    const isAcidStrong = currentAcid.strength === 'strong';
    const isBaseStrong = currentBase.strength === 'strong';

    let k = 1.4;
    let basePH = 13.0;
    let startPH = 1.0;

    if (!isAcidStrong && isBaseStrong) {
      k = 0.8;
      startPH = 3.5;
      basePH = 13.0;
    } else if (isAcidStrong && !isBaseStrong) {
      k = 0.8;
      startPH = 1.0;
      basePH = 9.0;
    } else if (!isAcidStrong && !isBaseStrong) {
      k = 0.4;
      startPH = 3.5;
      basePH = 9.0;
    }

    return startPH + ((basePH - startPH) / (1 + Math.exp(-k * (addedVolume - eqPoint))));
  };

  const pH = parseFloat(calculatePHValue(baseAdded, acid, base, equivalencePoint).toFixed(2));

  const playDripSound = () => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.1);

      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch {
      // Safely silent if blocked
    }
  };

  // Main Titration loop
  useEffect(() => {
    let interval;
    if (isDripping) {
      interval = setInterval(() => {
        setBaseAdded((prev) => {
          const nextVal = prev + 0.1;
          
          if (Math.round(nextVal * 10) % 2 === 0) {
            playDripSound();
          }

          const oldPH = calculatePHValue(prev, acid, base, equivalencePoint);
          const newPH = calculatePHValue(nextVal, acid, base, equivalencePoint);
          if (oldPH < 7 && newPH >= 7) {
            setFlashScreen(true);
            setTimeout(() => setFlashScreen(false), 500);
          }

          setChartData((prevChart) => {
            const alreadyLogged = prevChart.some(point => Math.abs(point.vol - nextVal) < 0.15);
            if (!alreadyLogged && nextVal <= 50) {
              return [...prevChart, { vol: nextVal, pH: parseFloat(newPH.toFixed(2)) }].sort((a, b) => a.vol - b.vol);
            }
            return prevChart;
          });

          if (nextVal >= 50) {
            setIsDripping(false);
            return 50;
          }
          return nextVal;
        });
      }, 30);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isDripping, acid, base, equivalencePoint]);

 
  // --- KINETIC GAS PARTICLES SIMULATOR ENGINE ---
  useEffect(() => {
    if (activeTab !== 'gas' || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationId;

    if (particlesRef.current.length === 0) {
      const pArr = [];
      for (let i = 0; i < 40; i++) {
        pArr.push({
          x: Math.random() * 200 + 20,
          y: Math.random() * 60 + 10,
          vx: (Math.random() - 0.5) * 2,
          vy: (Math.random() - 0.5) * 2,
          radius: 3
        });
      }
      particlesRef.current = pArr;
    }

    const render = () => {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const currentWidth = Math.max(40, (gasV / 100) * canvas.width);
      const speedMultiplier = Math.max(0.2, gasT / 273.15);

      particlesRef.current.forEach((p) => {
        p.x += p.vx * speedMultiplier;
        p.y += p.vy * speedMultiplier;

        if (p.x - p.radius < 0) {
          p.x = p.radius;
          p.vx *= -1;
        }
        if (p.x + p.radius > currentWidth) {
          p.x = currentWidth - p.radius;
          p.vx *= -1;
        }
        if (p.y - p.radius < 0) {
          p.y = p.radius;
          p.vy *= -1;
        }
        if (p.y + p.radius > canvas.height) {
          p.y = canvas.height - p.radius;
          p.vy *= -1;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = gasT > 373.15 ? '#f43f5e' : '#22d3ee';
        ctx.shadowColor = gasT > 373.15 ? '#f43f5e' : '#22d3ee';
        ctx.shadowBlur = gasT > 373.15 ? 8 : 2;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      ctx.beginPath();
      ctx.moveTo(currentWidth, 0);
      ctx.lineTo(currentWidth, canvas.height);
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 4;
      ctx.stroke();

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [activeTab, gasV, gasT]);

  // Handle Dynamic Gas Law Parameter Interaction
  const handleGasChange = (type, val) => {
    const R = 0.0821; 
    if (gasLaw === 'boyle') {
      if (type === 'P') {
        setGasP(val);
        setGasV(parseFloat((22.4 / val).toFixed(2)));
      } else if (type === 'V') {
        setGasV(val);
        setGasP(parseFloat((22.4 / val).toFixed(2)));
      }
    } else if (gasLaw === 'charles') {
      const constant = 22.4 / 273.15;
      if (type === 'T') {
        setGasT(val);
        setGasV(parseFloat((val * constant).toFixed(2)));
      } else if (type === 'V') {
        setGasV(val);
        setGasT(parseFloat((val / constant).toFixed(2)));
      }
    } else if (gasLaw === 'ideal') {
      if (type === 'P') {
        setGasP(val);
        setGasV(parseFloat(((gasN * R * gasT) / val).toFixed(2)));
      } else if (type === 'T') {
        setGasT(val);
        setGasV(parseFloat(((gasN * R * val) / gasP).toFixed(2)));
      } else if (type === 'n') {
        setGasN(val);
        setGasV(parseFloat(((val * R * gasT) / gasP).toFixed(2)));
      } else if (type === 'V') {
        setGasV(val);
        setGasP(parseFloat(((gasN * R * gasT) / val).toFixed(2)));
      }
    }
  };

  // Gas Solver Calculator
  const solveGasEquation = () => {
    const { P1, V1, T1, P2, V2, T2 } = gasSolverInput;
    let computedValue;
    let steps;

    if (gasTargetVar === 'V') {
      computedValue = (P1 * V1 * T2) / (T1 * P2);
      steps = [
        "Equation: (P1 * V1) / T1 = (P2 * V2) / T2",
        "Make V2 subject: V2 = (P1 * V1 * T2) / (P2 * T1)",
        `Substitute: V2 = (${P1} * ${V1} * ${T2}) / (${P2} * ${T1})`,
        `Result: V2 = ${computedValue.toFixed(3)} L`
      ];
    } else if (gasTargetVar === 'P') {
      computedValue = (P1 * V1 * T2) / (T1 * V2);
      steps = [
        "Equation: (P1 * V1) / T1 = (P2 * V2) / T2",
        "Make P2 subject: P2 = (P1 * V1 * T2) / (V2 * T1)",
        `Substitute: P2 = (${P1} * ${V1} * ${T2}) / (${V2} * ${T1})`,
        `Result: P2 = ${computedValue.toFixed(3)} atm`
      ];
    } else {
      computedValue = (P2 * V2 * T1) / (P1 * V1);
      steps = [
        "Equation: (P1 * V1) / T1 = (P2 * V2) / T2",
        "Make T2 subject: T2 = (P2 * V2 * T1) / (P1 * V1)",
        `Substitute: T2 = (${P2} * ${V2} * ${T1}) / (${P1} * ${V1})`,
        `Result: T2 = ${computedValue.toFixed(2)} K (${(computedValue - 273.15).toFixed(2)} °C)`
      ];
    }

    setGasSolverResult({ value: computedValue.toFixed(3), steps });
  };

  // --- QUALITATIVE ADD REAGENT DRIP ACTION ---
  const handleQualReagentAction = () => {
    const combinedKey = `${selectedReagent}-${selectedMode}`;
    
    // Prevent duplicated steps
    if (addedReagents.includes(combinedKey)) return;

    // Check dependency rules: "HCl" requires "BaCl2" already in tube
    if (selectedReagent === "HCl" && !addedReagents.some(r => r.startsWith("BaCl2"))) {
      alert("WASSCE Practical Safety Warning: You must add Barium Chloride (BaCl₂) to confirm the precipitate before adding hydrochloric acid.");
      return;
    }

    // Check dependency rules: "excess" requires "dropwise" added first
    if (selectedMode === "excess" && !addedReagents.includes(`${selectedReagent}-dropwise`)) {
      alert("Scientific Procedure: You should add this reagent dropwise first to observe initial precipitate formation, then in excess.");
      return;
    }

    const reaction = activeSalt.tests[combinedKey];
    if (reaction) {
      setTubeColor(reaction.color);
      setTubeState(reaction.state);
      setAddedReagents([...addedReagents, combinedKey]);

      const logLabel = REAGENTS_LIST[selectedReagent].name + (selectedMode !== "standard" ? ` (${selectedMode})` : "");
      const newLog = {
        test: `Add ${logLabel} to the salt sample solution.`,
        observation: reaction.observation,
        inference: reaction.inference
      };
      setQualLogs([...qualLogs, newLog]);
    }
  };

  const getIndicatorColor = () => {
    if (selectedIndicator === 'Phenolphthalein') {
      if (pH < 8.2) return 'rgba(255, 255, 255, 0.15)'; 
      const alpha = Math.min(0.2 + (pH - 8.2) * 0.15, 0.85);
      return `rgba(236, 72, 153, ${alpha})`; 
    }
    if (selectedIndicator === 'MethylOrange') {
      if (pH < 3.1) return 'rgba(239, 68, 68, 0.6)'; 
      if (pH >= 3.1 && pH < 4.4) return 'rgba(245, 158, 11, 0.6)'; 
      return 'rgba(251, 191, 36, 0.5)'; 
    }
    if (selectedIndicator === 'BromothymolBlue') {
      if (pH < 6.0) return 'rgba(234, 179, 8, 0.5)'; 
      if (pH >= 6.0 && pH <= 7.6) return 'rgba(34, 197, 94, 0.5)'; 
      return 'rgba(59, 130, 246, 0.6)'; 
    }
    if (selectedIndicator === 'Litmus') {
      if (pH < 5.0) return 'rgba(239, 68, 68, 0.5)'; 
      if (pH >= 5.0 && pH <= 8.0) return 'rgba(168, 85, 247, 0.5)'; 
      return 'rgba(59, 130, 246, 0.6)'; 
    }
    return 'rgba(255, 255, 255, 0.15)';
  };

  const recordTrial = () => {
    const newLog = {
      trial: titreLogs.length + 1,
      final: baseAdded.toFixed(2),
      initial: "0.00",
      used: baseAdded.toFixed(2),
    };
    setTitreLogs([...titreLogs, newLog]);
  };

  const handleReset = () => {
    setBaseAdded(0);
    setIsDripping(false);
    setChartData([]);
  };

  const getAverageTitre = () => {
    if (titreLogs.length < 2) return 0;
    const trialsToAverage = titreLogs.slice(1, 4);
    const sum = trialsToAverage.reduce((acc, curr) => acc + parseFloat(curr.used), 0);
    return (sum / trialsToAverage.length).toFixed(2);
  };

  // WASSCE SOLVER MODULE STATES
  const [solverVa, setSolverVa] = useState(25.0);
  const [solverVb, setSolverVb] = useState(24.5);
  const [solverCb, setSolverCb] = useState(0.1);
  const [solverResult, setSolverResult] = useState(null);

  const calculateSolver = () => {
    const nA = acid.basicity;
    const nB = base.acidity;
    const computedCa = (solverCb * solverVb * nA) / (solverVa * nB);
    const massConc = computedCa * acid.molarMass;

    setSolverResult({
      molarConc: computedCa.toFixed(4),
      massConc: massConc.toFixed(3),
      nA,
      nB
    });
  };

  return (
    <div className={`min-h-screen bg-slate-950 text-slate-100 p-6 flex flex-col items-center font-sans transition-all duration-300 ${
      flashScreen ? 'bg-pink-900/35 scale-[1.005]' : ''
    }`}>
      
      {/* Header */}
      <header className="w-full max-w-7xl mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-800 pb-4 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              SimuLab™ NNSS OJO STEM GROUP
            </h1>
            <span className="bg-cyan-500/10 text-cyan-400 text-xs px-2.5 py-0.5 rounded-full border border-cyan-500/20 font-bold">SHITTA</span>
          </div>
          <p className="text-slate-400 text-xs sm:text-sm">Made by the students of NNSS Ojo</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={() => setActiveTab('lab')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${activeTab === 'lab' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-900 text-slate-400 hover:text-white'}`}
          >
            Titration Bench
          </button>
          <button 
            onClick={() => { setActiveTab('solver'); calculateSolver(); }}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${activeTab === 'solver' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-900 text-slate-400 hover:text-white'}`}
          >
            Titration Solver
          </button>
          <button 
            onClick={() => { setActiveTab('gas'); solveGasEquation(); }}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${activeTab === 'gas' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-900 text-slate-400 hover:text-white'}`}
          >
            Gas Laws Sandbox
          </button>
          <button 
            onClick={() => setActiveTab('qual')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${activeTab === 'qual' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-900 text-slate-400 hover:text-white'}`}
          >
            Qualitative Bench
          </button>
        </div>
      </header>

      {/* TITRATION LAB BENCH */}
      {activeTab === 'lab' && (
        <>
          {/* Main Configuration Deck */}
          <section className="w-full max-w-7xl bg-slate-900/40 border border-slate-800 rounded-2xl p-5 mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Acid Select */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Acid in Pipette (Beaker)</label>
              <select 
                value={selectedAcid} 
                onChange={(e) => { setSelectedAcid(e.target.value); handleReset(); }}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none transition cursor-pointer"
              >
                {Object.keys(ACIDS).map((key) => (
                  <option key={key} value={key}>{ACIDS[key].name}</option>
                ))}
              </select>
              <div className="flex gap-2 mt-2">
                <div className="w-1/2">
                  <span className="text-[9px] text-slate-500">Conc (M)</span>
                  <input 
                    type="number" 
                    step="0.01" 
                    value={acidMolarity} 
                    onChange={(e) => { setAcidMolarity(parseFloat(e.target.value) || 0.1); handleReset(); }}
                    className="w-full bg-slate-950 border border-slate-800/80 rounded px-2 py-1 text-xs text-emerald-400 font-mono mt-1"
                  />
                </div>
                <div className="w-1/2">
                  <span className="text-[9px] text-slate-500">Vol (cm³)</span>
                  <input 
                    type="number" 
                    value={acidVolume} 
                    onChange={(e) => { setAcidVolume(parseFloat(e.target.value) || 20.0); handleReset(); }}
                    className="w-full bg-slate-950 border border-slate-800/80 rounded px-2 py-1 text-xs text-emerald-400 font-mono mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Base Select */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Base in Burette</label>
              <select 
                value={selectedBase} 
                onChange={(e) => { setSelectedBase(e.target.value); handleReset(); }}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none transition cursor-pointer"
              >
                {Object.keys(BASES).map((key) => (
                  <option key={key} value={key}>{BASES[key].name}</option>
                ))}
              </select>
              <div className="mt-2">
                <span className="text-[9px] text-slate-500">Base Conc (mol/dm³)</span>
                <input 
                  type="number" 
                  step="0.01" 
                  value={baseMolarity} 
                  onChange={(e) => { setBaseMolarity(parseFloat(e.target.value) || 0.1); handleReset(); }}
                  className="w-full bg-slate-950 border border-slate-800/80 rounded px-2 py-1 text-xs text-emerald-400 font-mono mt-1"
                />
              </div>
            </div>

            {/* Indicator Select */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Chemical Indicator</label>
              <select 
                value={selectedIndicator} 
                onChange={(e) => setSelectedIndicator(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none transition cursor-pointer"
              >
                {Object.keys(INDICATORS).map((key) => (
                  <option key={key} value={key}>{INDICATORS[key].name}</option>
                ))}
              </select>
              <p className="text-[10px] text-slate-400 mt-2 italic">
                {INDICATORS[selectedIndicator].desc}
              </p>
            </div>

            {/* Target Information Card */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/60 flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Target Equivalence (Vb)</span>
              <div className="text-2xl font-black font-mono text-cyan-400">
                {equivalencePoint.toFixed(2)} <span className="text-xs">cm³</span>
              </div>
              <div className="text-[10px] text-slate-500 leading-tight">
                Calculated dynamically from concentration ratio: {acid.basicity}H⁺ to {base.acidity}OH⁻
              </div>
            </div>
          </section>

          {/* Main Workspace */}
          <main className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column: Virtual Lab Bench & Apparatus (4 cols) */}
            <section className="lg:col-span-4 bg-slate-900/50 border border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-between min-h-[480px]">
              <h3 className="text-md font-bold text-slate-300 self-start">Lab Bench Setup</h3>
              
              <div className="relative w-full flex flex-col items-center justify-center py-4">
                {/* The 50 cm³ WASSCE Burette */}
                <div className="relative w-10 h-44 bg-slate-800/70 border-2 border-slate-700 rounded-b flex flex-col justify-end items-center">
                  <div className="absolute top-1 text-[8px] text-slate-400 font-mono">0.00</div>
                  <div className="absolute bottom-1 text-[8px] text-slate-400 font-mono">50.00 cm³</div>
                  <div 
                    className="w-full bg-cyan-500/25 transition-all duration-100"
                    style={{ height: `${((50 - baseAdded) / 50) * 100}%` }}
                  />
                  <div className="absolute -bottom-3 w-5 h-5 bg-slate-700 rounded-full border border-slate-600 flex items-center justify-center z-10">
                    <div className={`w-1 h-3 bg-emerald-400 rounded transition-transform ${isDripping ? 'rotate-90' : 'rotate-0'}`} />
                  </div>
                </div>

                {/* Falling Drips */}
                <div className="h-10 w-1 relative flex justify-center">
                  {isDripping && (
                    <div className="w-1.5 h-1.5 bg-cyan-400/80 rounded-full absolute top-1 animate-ping" />
                  )}
                </div>

                {/* Pipetted Acid in Erlenmeyer Flask */}
                <div className="relative w-28 h-28 flex flex-col justify-end items-center">
                  <div className="absolute inset-0 border-2 border-t-0 border-slate-600 rounded-b-2xl bg-slate-900/40">
                    <div className="absolute -top-4 left-9 right-9 h-4 border-2 border-b-0 border-slate-600 rounded-t-md" />
                  </div>
                  <div 
                    className="w-[85%] mb-1 rounded-b-xl transition-all duration-300"
                    style={{ 
                      height: `${35 + (baseAdded * 0.8)}%`, 
                      backgroundColor: getIndicatorColor()
                    }}
                  />
                </div>
              </div>

              {/* Precision Controls */}
              <div className="w-full space-y-3 bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-semibold">Burette Volume</span>
                  <span className="font-mono text-cyan-400 font-bold">{baseAdded.toFixed(2)} cm³</span>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsDripping(!isDripping)}
                    disabled={baseAdded >= 50}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                      isDripping 
                        ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30' 
                        : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md'
                    }`}
                  >
                    {isDripping ? 'Close Tap' : 'Open Tap'}
                  </button>
                  
                  <button
                    onClick={recordTrial}
                    disabled={baseAdded === 0}
                    className="px-3 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg text-xs font-bold text-white transition disabled:opacity-50"
                  >
                    Record
                  </button>
                  
                  <button
                    onClick={handleReset}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-bold text-slate-300 transition"
                  >
                    Refill
                  </button>
                </div>
              </div>
            </section>

            {/* Center Column: Real-time SVG Chart Curve (4 cols) */}
            <section className="lg:col-span-4 bg-slate-900/50 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-bold text-slate-300">pH Titration Curve</h3>
                <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">Real-time Plot</span>
              </div>

              <div className="bg-slate-950 rounded-xl border border-slate-900 p-4 flex items-center justify-center h-64 relative">
                <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <line x1="0" y1="50" x2="100" y2="50" stroke="#1e293b" strokeDasharray="2" strokeWidth="0.5" />
                  <line x1="50" y1="0" x2="50" y2="100" stroke="#1e293b" strokeDasharray="2" strokeWidth="0.5" />
                  
                  {chartData.length > 1 && (
                    <path
                      d={chartData.map((d, i) => {
                        const x = (d.vol / 50) * 100;
                        const y = 100 - ((d.pH / 14) * 100);
                        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                      }).join(' ')}
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="2"
                    />
                  )}
                </svg>

                <span className="absolute top-2 left-2 text-[8px] text-slate-600 font-mono">pH 14</span>
                <span className="absolute bottom-2 left-2 text-[8px] text-slate-600 font-mono">pH 0</span>
                <span className="absolute bottom-2 right-2 text-[8px] text-slate-600 font-mono">50 cm³</span>
                <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[8px] text-slate-600 font-mono">Volume Base added -{'>'}</span>
              </div>

              <div className="text-[10px] text-slate-500 italic leading-tight mt-2">
                *Observe the sharp mathematical inflection point (jump in curvature) precisely at the equivalence threshold.*
              </div>
            </section>

            {/* Right Column: WASSCE Lab Notebook, Concordancy and Telemetry (4 cols) */}
            <section className="lg:col-span-4 flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-900/50 border border-slate-800 p-3 rounded-xl">
                  <span className="text-[10px] text-slate-500 font-bold block">pH Value</span>
                  <span className="text-2xl font-black font-mono text-emerald-400">{pH}</span>
                </div>

                <div className="bg-slate-900/50 border border-slate-800 p-3 rounded-xl">
                  <span className="text-[10px] text-slate-500 font-bold block">Indic. State</span>
                  <span className="text-xs font-bold text-slate-200 block truncate mt-1">
                    {pH >= INDICATORS[selectedIndicator].range[0] ? 'Alkaline' : 'Acidic'}
                  </span>
                </div>
              </div>

              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-xs font-bold text-slate-300">WASSCE Report Card</h3>
                    {titreLogs.length > 0 && (
                      <button onClick={handleReset} className="text-[9px] text-rose-400 hover:underline">
                        Reset Logs
                      </button>
                    )}
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-[10px] font-mono">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-500">
                          <th className="pb-1">Burette Reading (cm³)</th>
                          <th className="pb-1">Rough</th>
                          <th className="pb-1 text-center">Trial 1</th>
                          <th className="pb-1 text-center">Trial 2</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-slate-900">
                          <td className="py-1.5 text-slate-400">Final</td>
                          <td className="py-1.5">{titreLogs[0] ? titreLogs[0].used : '—'}</td>
                          <td className="py-1.5 text-center">{titreLogs[1] ? titreLogs[1].used : '—'}</td>
                          <td className="py-1.5 text-center">{titreLogs[2] ? titreLogs[2].used : '—'}</td>
                        </tr>
                        <tr className="border-b border-slate-900">
                          <td className="py-1.5 text-slate-400">Initial</td>
                          <td className="py-1.5">{titreLogs[0] ? "0.00" : '—'}</td>
                          <td className="py-1.5 text-center">{titreLogs[1] ? "0.00" : '—'}</td>
                          <td className="py-1.5 text-center">{titreLogs[2] ? "0.00" : '—'}</td>
                        </tr>
                        <tr className="text-cyan-400 font-bold border-t border-slate-800/80">
                          <td className="py-1.5 text-slate-200">Volume Used</td>
                          <td className="py-1.5">{titreLogs[0] ? titreLogs[0].used : '—'}</td>
                          <td className="py-1.5 text-center">{titreLogs[1] ? titreLogs[1].used : '—'}</td>
                          <td className="py-1.5 text-center">{titreLogs[2] ? titreLogs[2].used : '—'}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {titreLogs.length >= 3 && (
                    <div className="mt-3 p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                      <span className="text-[10px] font-bold text-emerald-400 block">Concordant Mean Titre:</span>
                      <span className="text-lg font-black font-mono text-white">{getAverageTitre()} cm³</span>
                    </div>
                  )}
                </div>

                <div className="mt-3 pt-3 border-t border-slate-800/80 text-[9px] text-slate-500 leading-tight">
                  💡 <strong>Concordancy Rule:</strong> WASSCE requires Trial 1 and 2 to be within <strong>±0.20 cm³</strong> to compute your average titre value!
                </div>
              </div>
            </section>
          </main>
        </>
      )}

      {/* TITRATION SOLVER */}
      {activeTab === 'solver' && (
        <section className="w-full max-w-4xl bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-slate-200 mb-2">Interactive Titration Tutor</h2>
          <p className="text-xs text-slate-400 mb-6 leading-relaxed">
            Fill in the parameters from your volumetric analysis. This solver maps the exact steps required in standard exams.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Volume of Acid (Va in cm³)</label>
              <input 
                type="number" 
                value={solverVa} 
                onChange={(e) => setSolverVa(parseFloat(e.target.value) || 25.0)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-emerald-400 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Average Titre Base (Vb in cm³)</label>
              <input 
                type="number" 
                value={solverVb} 
                onChange={(e) => setSolverVb(parseFloat(e.target.value) || 24.5)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-emerald-400 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Conc. of Base (Cb in mol/dm³)</label>
              <input 
                type="number" 
                step="0.001"
                value={solverCb} 
                onChange={(e) => setSolverCb(parseFloat(e.target.value) || 0.1)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-emerald-400 font-mono"
              />
            </div>
          </div>

          <button 
            onClick={calculateSolver}
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 py-3 rounded-xl font-bold text-sm transition shadow-lg"
          >
            Solve Reaction Step-by-Step
          </button>

          {solverResult && (
            <div className="mt-8 space-y-6 border-t border-slate-800 pt-6">
              <h3 className="text-md font-bold text-slate-300 font-mono">Graded Calculation Steps</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-500 font-bold block uppercase">Molar Concentration (Ca)</span>
                  <span className="text-3xl font-black font-mono text-cyan-400">{solverResult.molarConc} <span className="text-xs text-slate-400">mol/dm³</span></span>
                </div>
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-500 font-bold block uppercase">Mass Concentration (g/dm³)</span>
                  <span className="text-3xl font-black font-mono text-emerald-400">{solverResult.massConc} <span className="text-xs text-slate-400">g/dm³</span></span>
                </div>
              </div>

              <div className="bg-slate-950/80 p-5 rounded-xl border border-slate-800 space-y-4 text-xs leading-relaxed text-slate-300">
                <div>
                  <strong className="text-white block mb-1">Step 1: The Mole Ratio</strong>
                  From the balanced chemical equation, the mole ratio of Acid (nA) to Base (nB) is:
                  <div className="font-mono text-cyan-400 mt-1">nA : nB = {solverResult.nA} : {solverResult.nB}</div>
                </div>

                <div>
                  <strong className="text-white block mb-1">Step 2: Molar Concentration of Unknown Acid (Ca)</strong>
                  Applying the volumetric equation:
                  <div className="font-mono text-cyan-400 my-1 bg-slate-900 p-2 rounded text-center">Ca = (Cb * Vb * nA) / (Va * nB)</div>
                  Substituting values:
                  <div className="font-mono text-slate-400 mt-1">
                    Ca = ({solverCb} * {solverVb} * {solverResult.nA}) / ({solverVa} * {solverResult.nB}) = <strong className="text-cyan-400">{solverResult.molarConc} mol/dm³</strong>
                  </div>
                </div>

                <div>
                  <strong className="text-white block mb-1">Step 3: Mass Concentration</strong>
                  Converting molar concentration to mass concentration using the molar mass of {acid.name} ({acid.molarMass} g/mol):
                  <div className="font-mono text-cyan-400 my-1 bg-slate-900 p-2 rounded text-center">Mass Concentration = Molar Concentration * Molar Mass</div>
                  Substituting values:
                  <div className="font-mono text-slate-400 mt-1">
                    Mass Concentration = {solverResult.molarConc} * {acid.molarMass} = <strong className="text-emerald-400">{solverResult.massConc} g/dm³</strong>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {/* GAS LAWS SUITE */}
      {activeTab === 'gas' && (
        <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Gas Laws Lab Simulator Controls (5 cols) */}
          <section className="lg:col-span-5 bg-slate-900/50 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-200 mb-2">Gas Laws Sandbox</h2>
              <div className="flex gap-2 mb-4 bg-slate-950 p-1 rounded-xl border border-slate-800/60">
                <button 
                  onClick={() => { setGasLaw('boyle'); setGasP(1.0); setGasV(22.4); }} 
                  className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition ${gasLaw === 'boyle' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}
                >
                  Boyle's Law (P vs V)
                </button>
                <button 
                  onClick={() => { setGasLaw('charles'); setGasT(273.15); setGasV(22.4); }} 
                  className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition ${gasLaw === 'charles' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}
                >
                  Charles's Law (T vs V)
                </button>
                <button 
                  onClick={() => { setGasLaw('ideal'); setGasP(1.0); setGasV(22.4); setGasT(273.15); setGasN(1.0); }} 
                  className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition ${gasLaw === 'ideal' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}
                >
                  Ideal Gas (PV=nRT)
                </button>
              </div>

              {/* Dynamic Interactive Sliders */}
              <div className="space-y-4">
                {/* Pressure Slider */}
                {(gasLaw === 'boyle' || gasLaw === 'ideal') && (
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400">Pressure (P)</span>
                      <span className="font-mono text-cyan-400 font-bold">{gasP.toFixed(2)} atm</span>
                    </div>
                    <input 
                      type="range" min="0.5" max="5.0" step="0.1" 
                      value={gasP} 
                      onChange={(e) => handleGasChange('P', parseFloat(e.target.value))}
                      className="w-full accent-cyan-400 cursor-pointer"
                    />
                  </div>
                )}

                {/* Temperature Slider */}
                {(gasLaw === 'charles' || gasLaw === 'ideal') && (
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400">Temperature (T)</span>
                      <span className="font-mono text-cyan-400 font-bold">{gasT.toFixed(2)} K ({(gasT - 273.15).toFixed(1)} °C)</span>
                    </div>
                    <input 
                      type="range" min="150" max="600" step="5" 
                      value={gasT} 
                      onChange={(e) => handleGasChange('T', parseFloat(e.target.value))}
                      className="w-full accent-cyan-400 cursor-pointer"
                    />
                  </div>
                )}

                {/* Moles Slider (For Ideal) */}
                {gasLaw === 'ideal' && (
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400">Amount of Gas (n)</span>
                      <span className="font-mono text-cyan-400 font-bold">{gasN.toFixed(2)} mol</span>
                    </div>
                    <input 
                      type="range" min="0.2" max="3.0" step="0.1" 
                      value={gasN} 
                      onChange={(e) => handleGasChange('n', parseFloat(e.target.value))}
                      className="w-full accent-cyan-400 cursor-pointer"
                    />
                  </div>
                )}

                {/* Dependent Volume readout/slider */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400">Volume Result (V)</span>
                    <span className="font-mono text-emerald-400 font-bold">{gasV.toFixed(2)} Liters</span>
                  </div>
                  <input 
                    type="range" min="2" max="100" step="0.5" 
                    value={gasV} 
                    onChange={(e) => handleGasChange('V', parseFloat(e.target.value))}
                    className="w-full accent-emerald-400 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Kinetic Gas Chamber Canvas */}
            <div className="mt-6 bg-slate-950 rounded-xl p-4 border border-slate-800/80">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wide block mb-3">Kinetic Molecular Theory Simulator</span>
              <div className="relative w-full h-24 bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
                <canvas 
                  ref={canvasRef} 
                  width={300} 
                  height={96} 
                  className="w-full h-full block"
                />
              </div>
              <p className="text-[9px] text-slate-400 mt-2 leading-snug">
                <strong>Real-time Physics:</strong> Raising temperature excites the particles (increases velocity), while decreasing volume limits space—showing you how macroscopic pressure emerges from microscopic collisions!
              </p>
            </div>
          </section>

          {/* Gas Solver & Formula Step-by-Step (7 cols) */}
          <section className="lg:col-span-7 bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-slate-200 mb-2">Step-by-Step Gas Laws Solver</h2>
            <p className="text-xs text-slate-400 mb-6 leading-relaxed">
              Calculate changing gas conditions using the Combined Gas Law: <strong>(P1 * V1) / T1 = (P2 * V2) / T2</strong>. Select your unknown target variable to solve.
            </p>

            <div className="flex gap-2 mb-6 bg-slate-950 p-1 rounded-xl border border-slate-800/60 max-w-sm">
              <button 
                onClick={() => setGasTargetVar('V')} 
                className={`flex-1 py-1 rounded-lg text-xs font-bold transition ${gasTargetVar === 'V' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}
              >
                Solve Volume (V2)
              </button>
              <button 
                onClick={() => setGasTargetVar('P')} 
                className={`flex-1 py-1 rounded-lg text-xs font-bold transition ${gasTargetVar === 'P' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}
              >
                Solve Pressure (P2)
              </button>
              <button 
                onClick={() => setGasTargetVar('T')} 
                className={`flex-1 py-1 rounded-lg text-xs font-bold transition ${gasTargetVar === 'T' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}
              >
                Solve Temperature (T2)
              </button>
            </div>

            {/* Variable Input Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-[10px] text-slate-400 uppercase tracking-wide mb-1">Initial Press. (P1 atm)</label>
                <input 
                  type="number" step="0.1" value={gasSolverInput.P1}
                  onChange={(e) => setGasSolverInput({...gasSolverInput, P1: parseFloat(e.target.value) || 0})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-emerald-400 font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 uppercase tracking-wide mb-1">Initial Vol (V1 Liters)</label>
                <input 
                  type="number" step="0.1" value={gasSolverInput.V1}
                  onChange={(e) => setGasSolverInput({...gasSolverInput, V1: parseFloat(e.target.value) || 0})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-emerald-400 font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 uppercase tracking-wide mb-1">Initial Temp (T1 Kelvin)</label>
                <input 
                  type="number" step="1" value={gasSolverInput.T1}
                  onChange={(e) => setGasSolverInput({...gasSolverInput, T1: parseFloat(e.target.value) || 0})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-emerald-400 font-mono"
                />
              </div>

              {gasTargetVar !== 'P' && (
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase tracking-wide mb-1">Final Press. (P2 atm)</label>
                  <input 
                    type="number" step="0.1" value={gasSolverInput.P2}
                    onChange={(e) => setGasSolverInput({...gasSolverInput, P2: parseFloat(e.target.value) || 0})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-emerald-400 font-mono"
                  />
                </div>
              )}
              {gasTargetVar !== 'V' && (
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase tracking-wide mb-1">Final Vol (V2 Liters)</label>
                  <input 
                    type="number" step="0.1" value={gasSolverInput.V2}
                    onChange={(e) => setGasSolverInput({...gasSolverInput, V2: parseFloat(e.target.value) || 0})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-emerald-400 font-mono"
                />
                </div>
              )}
              {gasTargetVar !== 'T' && (
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase tracking-wide mb-1">Final Temp (T2 Kelvin)</label>
                  <input 
                    type="number" step="1" value={gasSolverInput.T2}
                    onChange={(e) => setGasSolverInput({...gasSolverInput, T2: parseFloat(e.target.value) || 0})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-emerald-400 font-mono"
                  />
                </div>
              )}
            </div>

            <button 
              onClick={solveGasEquation}
              className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 py-3 rounded-xl font-bold text-xs sm:text-sm transition shadow-lg shadow-cyan-500/10 mb-6"
            >
              Solve Combined Gas Law
            </button>

            {gasSolverResult && (
              <div className="space-y-4 border-t border-slate-800 pt-5">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-500 font-bold block uppercase">Calculated Target ({gasTargetVar === 'T' ? 'T2' : gasTargetVar === 'P' ? 'P2' : 'V2'})</span>
                  <span className="text-3xl font-black font-mono text-cyan-400">
                    {gasSolverResult.value} <span className="text-xs text-slate-400">{gasTargetVar === 'T' ? 'Kelvin' : gasTargetVar === 'P' ? 'atm' : 'Liters'}</span>
                  </span>
                </div>

                <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-2 text-xs text-slate-300 font-mono leading-relaxed">
                  <strong className="text-white block font-sans mb-1">Worked Out Steps:</strong>
                  {gasSolverResult.steps.map((step, idx) => (
                    <div key={idx} className="border-b border-slate-900/40 pb-1.5 last:border-0 last:pb-0">
                      {step}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>
      )}

      {/* QUALITATIVE ANALYSIS BENCH */}
      {activeTab === 'qual' && (
        <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Sample Tray & Droppers (4 cols) */}
          <section className="lg:col-span-4 bg-slate-900/50 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between min-h-[480px]">
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-slate-300">Reagent Shelf</h3>
                <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">WASSCE Spec</span>
              </div>

              {/* Sample Selector */}
              <div className="mb-6">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Select Unknown Sample</label>
                <div className="grid grid-cols-2 gap-2">
                  {QUAL_SALTS.map((salt, idx) => (
                    <button
                      key={salt.id}
                      onClick={() => {
                        setCurrentSaltIdx(idx);
                        setTubeColor(salt.color);
                        setTubeState("clear");
                        setAddedReagents([]);
                        setQualLogs([]);
                      }}
                      className={`py-2 px-3 rounded-lg text-xs font-semibold border transition text-center ${
                        currentSaltIdx === idx
                          ? "bg-emerald-500 border-emerald-400 text-slate-950 font-bold shadow-md"
                          : "bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700"
                      }`}
                    >
                      {salt.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Coordinated Pipetting System */}
              <div className="space-y-4 bg-slate-950 p-4 rounded-xl border border-slate-800/60">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Dynamic Dropper Setup</span>
                
                {/* 1. Choose Reagent Dropdown */}
<div>
  <label className="block text-[9px] text-slate-500 uppercase mb-1">Reagent Bottle</label>
  <select 
    value={selectedReagent} 
    onChange={(e) => {
      const newReagent = e.target.value;
      setSelectedReagent(newReagent);

      // Instantly enforce a valid mode for the newly selected reagent in one render pass
      const rConfig = REAGENTS_LIST[newReagent];
      if (rConfig && !rConfig.modes.includes(selectedMode)) {
        setSelectedMode(rConfig.modes[0]);
      }
    }}
    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none cursor-pointer"
  >
    {Object.keys(REAGENTS_LIST).map((key) => (
      <option key={key} value={key}>{REAGENTS_LIST[key].name}</option>
    ))}
  </select>
</div>
                {/* 2. Choose Mode Dropdown (Changes dynamically based on available modes) */}
                <div>
                  <label className="block text-[9px] text-slate-500 uppercase mb-1">Addition Mode</label>
                  <select 
                    value={selectedMode} 
                    onChange={(e) => setSelectedMode(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none cursor-pointer disabled:opacity-45"
                    disabled={REAGENTS_LIST[selectedReagent].modes.length === 1}
                  >
                    {REAGENTS_LIST[selectedReagent].modes.map((m) => (
                      <option key={m} value={m}>
                        {m === "standard" && "Standard Add (Full Volume)"}
                        {m === "dropwise" && "Add Dropwise (Few Drops)"}
                        {m === "excess" && "Add in Excess"}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 3. Drop action button */}
                <button
                  onClick={handleQualReagentAction}
                  disabled={addedReagents.includes(`${selectedReagent}-${selectedMode}`)}
                  className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg text-xs font-bold transition shadow-md disabled:opacity-40"
                >
                  🧪 Dispense Reagent to Tube
                </button>
              </div>
            </div>

            <button
              onClick={() => {
                setTubeColor(activeSalt.color);
                setTubeState("clear");
                setAddedReagents([]);
                setQualLogs([]);
              }}
              className="mt-6 w-full py-2 bg-slate-850 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-400 hover:text-white rounded-xl transition"
            >
              Wash & Clear Test Tube
            </button>
          </section>

          {/* Center Column: Interactive Test Tube Tube Graphics (4 cols) */}
          <section className="lg:col-span-4 bg-slate-900/50 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between items-center min-h-[480px]">
            <h3 className="text-md font-bold text-slate-300 self-start">Reaction Chamber</h3>

            {/* Test Tube Assembly */}
            <div className="relative w-24 h-72 border-4 border-slate-700/80 rounded-b-full flex flex-col justify-end items-center bg-slate-950/20 shadow-inner overflow-hidden">
              
              {/* BUBBLE ENGINE EFFECT (For Gas evolution) */}
              {tubeState === "bubbles" && (
                <div className="absolute inset-0 z-10 pointer-events-none">
                  <div className="absolute bottom-4 left-1/4 w-1 h-1 bg-white/40 rounded-full animate-ping" />
                  <div className="absolute bottom-12 left-1/2 w-1.5 h-1.5 bg-white/50 rounded-full animate-ping" />
                  <div className="absolute bottom-8 right-1/3 w-1 h-1 bg-white/40 rounded-full animate-ping" />
                  <div className="absolute bottom-16 left-1/3 w-2 h-2 bg-white/30 rounded-full animate-ping" />
                </div>
              )}

              {/* Liquid Column */}
              <div 
                className="w-full h-1/2 transition-all duration-500 relative flex items-end justify-center"
                style={{ backgroundColor: tubeColor }}
              >
                {/* Precipitate settling visual */}
                {tubeState === "precipitate" && (
                  <div 
                    className="w-full h-2/3 transition-all duration-300 rounded-b-full blur-[1px]"
                    style={{ 
                      background: `linear-gradient(to top, ${tubeColor} 80%, rgba(255,255,255,0.1))` 
                    }}
                  />
                )}
              </div>
            </div>

            {/* Display Plate */}
            <div className="w-full text-center bg-slate-950/80 p-3.5 rounded-xl border border-slate-800/80">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">State Readout</span>
              <span className="text-xs font-bold text-slate-200 capitalize">
                {tubeState === "clear" && "Clear Solution"}
                {tubeState === "precipitate" && "Heavy Precipitate Settling"}
                {tubeState === "bubbles" && "Vigorous Effervescence"}
              </span>
            </div>
          </section>

          {/* Right Column: Lab Manual Notebook Table (4 cols) */}
          <section className="lg:col-span-4 bg-slate-900/50 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-300 mb-3">WASSCE Qualitative Manual</h3>

              <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
                {qualLogs.length === 0 ? (
                  <div className="h-44 flex flex-col items-center justify-center text-center border-2 border-dashed border-slate-800 rounded-xl p-4">
                    <span className="text-lg">🧪</span>
                    <p className="text-[10px] text-slate-500 mt-2 font-mono">
                      No experiments conducted yet. Choose a reagent and addition mode from the dropper setup on the left to run tests.
                    </p>
                  </div>
                ) : (
                  qualLogs.map((log, idx) => (
                    <div key={idx} className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-[10px] leading-relaxed space-y-2 animate-fadeIn">
                      <div>
                        <span className="text-slate-500 font-bold uppercase text-[9px] block">Test</span>
                        <span className="text-slate-300">{log.test}</span>
                      </div>
                      <div className="border-t border-slate-900/60 pt-1">
                        <span className="text-emerald-500 font-bold uppercase text-[9px] block">Observation</span>
                        <span className="text-slate-300">{log.observation}</span>
                      </div>
                      <div className="border-t border-slate-900/60 pt-1">
                        <span className="text-cyan-400 font-bold uppercase text-[9px] block">Inference</span>
                        <span className="text-slate-100 font-bold">{log.inference}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="text-[10px] text-slate-500 italic mt-4 pt-3 border-t border-slate-800/80 leading-tight">
              💡 <strong>Exam Tip:</strong>Make sure you write legibly
            </div>
          </section>
        </div>
      )}
    </div>
  );
}