import fs from "fs";
import path from "path";

const outDir = path.join(process.cwd(), "public", "products");
fs.mkdirSync(outDir, { recursive: true });

const items = [
  {
    file: "smartphone.svg",
    bg1: "#0B192C",
    bg2: "#1E3A5F",
    accent: "#F97316",
    label: "5G AMOLED",
    shape: `<rect x="145" y="55" width="110" height="190" rx="18" fill="#0F172A" stroke="#94A3B8" stroke-width="4"/><rect x="153" y="68" width="94" height="162" rx="10" fill="url(#screen)"/><circle cx="200" cy="62" r="2.5" fill="#475569"/><rect x="180" y="236" width="40" height="3" rx="1.5" fill="#64748B"/>`,
  },
  {
    file: "charger.svg",
    bg1: "#0F172A",
    bg2: "#1E3A5F",
    accent: "#10B981",
    label: "65W GaN",
    shape: `<rect x="140" y="90" width="120" height="110" rx="16" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="3"/><rect x="165" y="65" width="14" height="25" rx="3" fill="#94A3B8"/><rect x="221" y="65" width="14" height="25" rx="3" fill="#94A3B8"/><rect x="172" y="130" width="56" height="14" rx="4" fill="#0B192C"/><rect x="172" y="156" width="56" height="14" rx="4" fill="#10B981"/>`,
  },
  {
    file: "laptop.svg",
    bg1: "#0B192C",
    bg2: "#172554",
    accent: "#38BDF8",
    label: "PRO SERIES",
    shape: `<rect x="95" y="75" width="210" height="130" rx="10" fill="#1E293B" stroke="#94A3B8" stroke-width="3"/><rect x="105" y="85" width="190" height="110" rx="4" fill="url(#screen)"/><path d="M75 210 H325 L340 226 H60 Z" fill="#CBD5E1"/><rect x="175" y="213" width="50" height="4" rx="2" fill="#64748B"/>`,
  },
  {
    file: "ups.svg",
    bg1: "#0F172A",
    bg2: "#1E3A5F",
    accent: "#10B981",
    label: "1200VA AVR",
    shape: `<rect x="145" y="65" width="110" height="170" rx="10" fill="#1E293B" stroke="#64748B" stroke-width="3"/><rect x="165" y="88" width="70" height="32" rx="6" fill="#0B192C"/><circle cx="200" cy="104" r="7" fill="#10B981"/><line x1="165" y1="150" x2="235" y2="150" stroke="#475569" stroke-width="4"/><line x1="165" y1="170" x2="235" y2="170" stroke="#475569" stroke-width="4"/><line x1="165" y1="190" x2="235" y2="190" stroke="#475569" stroke-width="4"/>`,
  },
  {
    file: "cosmetic.svg",
    bg1: "#064E3B",
    bg2: "#0B192C",
    accent: "#F59E0B",
    label: "100% NATUREL",
    shape: `<rect x="125" y="115" width="70" height="95" rx="12" fill="#FEF3C7" stroke="#F59E0B" stroke-width="3"/><rect x="142" y="95" width="36" height="20" rx="4" fill="#0B192C"/><rect x="215" y="135" width="60" height="75" rx="30" fill="#FDE68A" stroke="#F59E0B" stroke-width="3"/><rect x="225" y="120" width="40" height="18" rx="4" fill="#065F46"/>`,
  },
  {
    file: "coffee.svg",
    bg1: "#1E1B4B",
    bg2: "#0B192C",
    accent: "#F97316",
    label: "OUEST CAMEROUN",
    shape: `<path d="M140 75 H260 L270 225 H130 Z" fill="#78350F" stroke="#F59E0B" stroke-width="3"/><rect x="155" y="115" width="90" height="60" rx="8" fill="#FEF3C7"/><circle cx="200" cy="145" r="14" fill="#78350F"/><rect x="155" y="65" width="90" height="14" rx="4" fill="#B45309"/>`,
  },
  {
    file: "spice.svg",
    bg1: "#0B192C",
    bg2: "#064E3B",
    accent: "#10B981",
    label: "PENJA IGP",
    shape: `<rect x="150" y="95" width="100" height="125" rx="18" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="3"/><rect x="165" y="72" width="70" height="23" rx="6" fill="#0B192C"/><rect x="165" y="130" width="70" height="55" rx="6" fill="#10B981" opacity="0.2"/><circle cx="200" cy="157" r="18" fill="#065F46"/>`,
  },
  {
    file: "shirt.svg",
    bg1: "#0F172A",
    bg2: "#1E3A5F",
    accent: "#F97316",
    label: "COLLECTION NDOP",
    shape: `<path d="M145 75 L180 65 L200 85 L220 65 L255 75 L290 120 L265 140 L245 118 V225 H155 V118 L135 140 L110 120 Z" fill="#F8FAFC" stroke="#94A3B8" stroke-width="3"/><line x1="200" y1="85" x2="200" y2="225" stroke="#CBD5E1" stroke-width="2"/><rect x="212" y="125" width="22" height="24" rx="3" fill="#0B192C"/>`,
  },
  {
    file: "home.svg",
    bg1: "#1E3A5F",
    bg2: "#0B192C",
    accent: "#38BDF8",
    label: "PERCALE 220",
    shape: `<rect x="105" y="105" width="190" height="110" rx="12" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="3"/><rect x="120" y="90" width="72" height="40" rx="8" fill="#E2E8F0" stroke="#94A3B8" stroke-width="2"/><rect x="208" y="90" width="72" height="40" rx="8" fill="#E2E8F0" stroke="#94A3B8" stroke-width="2"/><rect x="105" y="150" width="190" height="65" rx="10" fill="#1E3A5F" opacity="0.85"/>`,
  },
  {
    file: "fan.svg",
    bg1: "#0B192C",
    bg2: "#065F46",
    accent: "#10B981",
    label: "SOLAIRE 16\"",
    shape: `<circle cx="200" cy="125" r="56" fill="none" stroke="#F8FAFC" stroke-width="4"/><circle cx="200" cy="125" r="14" fill="#10B981"/><path d="M200 111 C215 80 235 90 212 122 Z" fill="#CBD5E1"/><path d="M214 125 C245 140 235 160 203 137 Z" fill="#CBD5E1"/><path d="M186 125 C155 110 165 90 197 113 Z" fill="#CBD5E1"/><rect x="194" y="181" width="12" height="42" fill="#94A3B8"/><rect x="160" y="220" width="80" height="12" rx="6" fill="#F8FAFC"/>`,
  },
  {
    file: "generator.svg",
    bg1: "#0F172A",
    bg2: "#1E293B",
    accent: "#F97316",
    label: "5.5 KVA PRO",
    shape: `<rect x="105" y="95" width="190" height="115" rx="12" fill="#F97316" stroke="#F8FAFC" stroke-width="3"/><rect x="125" y="115" width="85" height="55" rx="6" fill="#0B192C"/><circle cx="250" cy="142" r="20" fill="#1E293B" stroke="#F8FAFC" stroke-width="3"/><rect x="120" y="210" width="24" height="14" rx="4" fill="#475569"/><rect x="256" y="210" width="24" height="14" rx="4" fill="#475569"/>`,
  },
  {
    file: "earbuds.svg",
    bg1: "#0B192C",
    bg2: "#1E3A5F",
    accent: "#F97316",
    label: "ANC -35dB",
    shape: `<rect x="145" y="95" width="110" height="110" rx="28" fill="#F8FAFC" stroke="#94A3B8" stroke-width="3"/><line x1="145" y1="138" x2="255" y2="138" stroke="#CBD5E1" stroke-width="3"/><circle cx="200" cy="162" r="5" fill="#10B981"/>`,
  },
  {
    file: "shoes.svg",
    bg1: "#0B192C",
    bg2: "#1E293B",
    accent: "#F97316",
    label: "CUIR & SPORT",
    shape: `<path d="M90 190 Q110 130 165 145 L230 175 Q290 175 305 205 H90 Z" fill="#F8FAFC" stroke="#94A3B8" stroke-width="3"/><rect x="85" y="205" width="225" height="16" rx="6" fill="#0B192C"/>`,
  },
  {
    file: "bag.svg",
    bg1: "#1E3A5F",
    bg2: "#0B192C",
    accent: "#10B981",
    label: "MAROQUINERIE",
    shape: `<rect x="125" y="105" width="150" height="120" rx="14" fill="#78350F" stroke="#F59E0B" stroke-width="3"/><path d="M165 105 C165 70 235 70 235 105" fill="none" stroke="#F59E0B" stroke-width="6"/><rect x="185" y="145" width="30" height="22" rx="4" fill="#FDE68A"/>`,
  },
  {
    file: "baby.svg",
    bg1: "#0F172A",
    bg2: "#1E3A5F",
    accent: "#38BDF8",
    label: "PUÉRICULTURE",
    shape: `<circle cx="200" cy="150" r="55" fill="#E0F2FE" stroke="#38BDF8" stroke-width="3"/><circle cx="182" cy="140" r="6" fill="#0B192C"/><circle cx="218" cy="140" r="6" fill="#0B192C"/><path d="M182 168 Q200 182 218 168" fill="none" stroke="#0B192C" stroke-width="3" stroke-linecap="round"/>`,
  },
  {
    file: "sport.svg",
    bg1: "#064E3B",
    bg2: "#0B192C",
    accent: "#10B981",
    label: "FITNESS PRO",
    shape: `<rect x="115" y="142" width="170" height="16" rx="4" fill="#CBD5E1"/><rect x="95" y="110" width="24" height="80" rx="6" fill="#0B192C" stroke="#10B981" stroke-width="3"/><rect x="281" y="110" width="24" height="80" rx="6" fill="#0B192C" stroke="#10B981" stroke-width="3"/>`,
  },
  {
    file: "car.svg",
    bg1: "#0B192C",
    bg2: "#1E3A5F",
    accent: "#F97316",
    label: "AUTO 12V",
    shape: `<rect x="125" y="105" width="150" height="105" rx="12" fill="#1E293B" stroke="#94A3B8" stroke-width="3"/><rect x="145" y="88" width="24" height="17" rx="3" fill="#EF4444"/><rect x="231" y="88" width="24" height="17" rx="3" fill="#0B192C" stroke="#94A3B8" stroke-width="2"/><text x="200" y="168" font-family="sans-serif" font-size="24" font-weight="800" fill="#F97316" text-anchor="middle">12V</text>`,
  },
  {
    file: "printer.svg",
    bg1: "#0F172A",
    bg2: "#1E3A5F",
    accent: "#38BDF8",
    label: "BUREAU PRO",
    shape: `<rect x="110" y="115" width="180" height="90" rx="10" fill="#F8FAFC" stroke="#94A3B8" stroke-width="3"/><rect x="140" y="80" width="120" height="35" rx="4" fill="#E2E8F0"/><rect x="140" y="185" width="120" height="45" rx="4" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="2"/>`,
  },
];

for (const item of items) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="400" height="300">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${item.bg1}"/>
      <stop offset="100%" stop-color="${item.bg2}"/>
    </linearGradient>
    <linearGradient id="screen" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1E3A5F"/>
      <stop offset="100%" stop-color="#0EA5E9"/>
    </linearGradient>
  </defs>
  <rect width="400" height="300" fill="url(#bg)"/>
  <circle cx="340" cy="45" r="80" fill="${item.accent}" opacity="0.12"/>
  <circle cx="55" cy="260" r="70" fill="#FFFFFF" opacity="0.05"/>
  ${item.shape}
  <rect x="24" y="24" width="120" height="24" rx="12" fill="${item.accent}" opacity="0.92"/>
  <text x="84" y="40" font-family="system-ui, sans-serif" font-size="11" font-weight="700" fill="#FFFFFF" text-anchor="middle">${item.label}</text>
</svg>`;
  fs.writeFileSync(path.join(outDir, item.file), svg, "utf8");
}

console.log(`Generated ${items.length} product SVGs in public/products/`);

