const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// 1. MARQUEE SECTION: Rich royal indigo background, taller
html = html.replace(
  'class="py-6 bg-navy-dark text-white border-y border-navy-primary/40 overflow-hidden relative"',
  'class="py-10 text-white border-y border-indigo-600/50 overflow-hidden relative" style="background: linear-gradient(135deg, #1e1b4b 0%, #1e3a8a 50%, #312e81 100%); min-height:148px"'
);

// 2. MARQUEE: Square/tall product cards — white glass instead of dark
html = html.replace(
  /class="inline-flex items-center gap-3 bg-slate-900\/90 border border-slate-700\/80 px-4 py-2\.5 rounded-2xl cursor-pointer hover:border-cyan-accent transition shadow-md"/g,
  'class="inline-flex flex-col items-center justify-center gap-2 bg-white/10 border border-white/25 px-5 py-4 rounded-xl cursor-pointer hover:border-yellow-400 hover:bg-white/20 transition shadow-lg backdrop-blur-sm" style="min-width:115px;min-height:115px"'
);

// Make marquee images bigger
html = html.replace(
  /class="h-10 w-10 object-contain bg-white rounded-lg p-1"/g,
  'class="h-14 w-14 object-contain bg-white rounded-xl p-1.5 mx-auto shadow-sm"'
);

// Marquee text — center align
html = html.replace(/<div class="font-bold text-xs text-white">Philips BiPAP Auto Machine<\/div>/g, '<div class="font-bold text-xs text-white text-center leading-tight">Philips BiPAP</div>');
html = html.replace(/<div class="font-bold text-xs text-white">ResMed Lumis 100 VPAP S<\/div>/g, '<div class="font-bold text-xs text-white text-center leading-tight">ResMed VPAP S</div>');
html = html.replace(/<div class="font-bold text-xs text-white">BPL Oxy 5 Neo Dual Concentrator<\/div>/g, '<div class="font-bold text-xs text-white text-center leading-tight">BPL Oxy 5 Neo</div>');
html = html.replace(/<div class="font-bold text-xs text-white">Oxymed BiPAP ST I Series P1<\/div>/g, '<div class="font-bold text-xs text-white text-center leading-tight">Oxymed BiPAP ST</div>');
html = html.replace(/<div class="font-bold text-xs text-white">5-Function Motorized ICU Bed<\/div>/g, '<div class="font-bold text-xs text-white text-center leading-tight">ICU Bed 5-Func</div>');

// Marquee price — gold color, centered
html = html.replace(/class="text-\[11px\] text-cyan-accent font-black"/g, 'class="text-[11px] text-yellow-300 font-black text-center"');

// Remove now-unnecessary <div> wrapper inside marquee cards (they were stacked: img + div)
// The <div> was needed for text but now cards are flex-col, so wrap text in a centered div
html = html.replace(
  /(<div class="inline-flex flex-col[^>]+>)\s*(<img[^>]+>)\s*<div>/g,
  '$1$2<div class="text-center">'
);

// 3. CONTACT SECTION: Replace pitch-black bg with rich deep royal blue-indigo gradient
html = html.replace(
  'class="py-16 px-4 bg-slate-900 text-white border-t border-slate-800 relative overflow-hidden"',
  'class="py-16 px-4 text-white border-t border-indigo-700/40 relative overflow-hidden" style="background: linear-gradient(135deg, #1e3a8a 0%, #1e1b4b 50%, #0f172a 100%)"'
);

// 4. CONTACT SECTION: Dark info cards → royal blue glass
html = html.replace(
  /class="flex items-center gap-3\.5 p-4 bg-slate-800\/90 rounded-2xl border border-slate-700\/80 shadow-sm"/g,
  'class="flex items-center gap-3.5 p-4 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 shadow-md hover:bg-white/15 transition"'
);

// 5. Contact section subtitle/body text — lighter blue instead of slate-400
html = html.replace(
  'class="text-slate-400">Amberpet, Hyderabad, Telangana, India</div>',
  'class="text-blue-200">Amberpet, Hyderabad, Telangana, India</div>'
);
html = html.replace(
  'class="text-slate-400 font-mono">36BHGPK3813B1ZS',
  'class="text-blue-200 font-mono">36BHGPK3813B1ZS'
);
html = html.replace(
  'class="text-slate-400 text-xs sm:text-sm leading-relaxed"',
  'class="text-blue-100 text-xs sm:text-sm leading-relaxed"'
);
html = html.replace(
  'class="text-slate-300 font-semibold">+91 98765 43210 (24/7 B2B Assistance)</div>',
  'class="text-green-200 font-semibold">+91 98765 43210 (24/7 B2B Assistance)</div>'
);

// 6. Statutory compliance card in footer - lighter
html = html.replace(
  'class="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-4 space-y-2.5"',
  'class="bg-white/5 border border-slate-500/40 rounded-2xl p-4 space-y-2.5"'
);

// 7. Marquee section label color
html = html.replace(
  '>Continuous Stock Broadcast</span>',
  '>Live • Continuous Stock Broadcast</span>'
);

// 8. Admin dark card — slightly reduced brightness (make gradient softer)
// Change admin-dark-card in styles.css to slightly muted navy
// (will handle in CSS step)

fs.writeFileSync('index.html', html);
console.log('HTML visual fixes applied successfully');
