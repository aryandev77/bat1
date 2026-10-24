// Interface language support. English is the default; Hindi is translated below.
// To add a language: add it to LANGS and create a dictionary like HI.
export const LANGS = { en: "English", hi: "हिन्दी" };
let lang = localStorage.getItem("bat.lang") || "en";
export const getLang = () => lang;
export const setLang = (l) => { lang = l in LANGS ? l : "en"; localStorage.setItem("bat.lang", lang); document.documentElement.lang = lang; };

const HI = {
  "Chats": "चैट", "Search": "खोजें", "Notes": "नोट्स", "Settings": "सेटिंग्स", "Back": "वापस", "Cancel": "रद्द करें", "Done": "हो गया", "Save": "सेव करें", "Send": "भेजें", "Clear": "साफ़ करें",
  "Welcome to BAT": "BAT में आपका स्वागत है", "Sign in to chat with your circle": "अपने लोगों से चैट करने के लिए साइन इन करें", "Log In": "लॉग इन",
  "Create new account": "नया खाता बनाएँ", "Forgot password?": "पासवर्ड भूल गए?", "Create your account": "अपना खाता बनाएँ",
  "Pick an ID. Friends find you by it.": "एक ID चुनें। दोस्त आपको इसी से ढूँढेंगे।", "Register": "रजिस्टर करें", "I already have an account": "मेरा खाता पहले से है",
  "Reset your password": "पासवर्ड रीसेट करें", "Enter your ID and your 4-digit code": "अपनी ID और 4 अंकों का कोड डालें", "Reset password": "पासवर्ड रीसेट करें", "Back to log in": "लॉग इन पर वापस",
  "ID (username)": "ID (यूज़रनेम)", "Name (optional)": "नाम (वैकल्पिक)", "Password": "पासवर्ड", "Confirm password": "पासवर्ड की पुष्टि करें", "New password": "नया पासवर्ड",
  "4-digit recovery code": "4 अंकों का रिकवरी कोड", "Show password": "पासवर्ड दिखाएँ", "Your recovery code": "आपका रिकवरी कोड",
  "If you forget your password, this code gets you back in. Write it down now. It is shown only once.": "पासवर्ड भूलने पर यही कोड आपको वापस अंदर लाएगा। इसे अभी लिख लें। यह सिर्फ़ एक बार दिखता है।",
  "I wrote it down": "मैंने लिख लिया",
  "No chats yet. Search an ID to start.": "अभी कोई चैट नहीं। शुरू करने के लिए किसी की ID खोजें।", "No messages yet": "अभी कोई संदेश नहीं", "Archived": "आर्काइव", "No archived chats.": "कोई आर्काइव चैट नहीं।", "Locked chat": "लॉक की हुई चैट",
  "Search by ID (username)": "ID (यूज़रनेम) से खोजें", "Recent searches": "हाल की खोजें", "Search by someone's ID.": "किसी की ID से खोजें।", "No one found.": "कोई नहीं मिला।", "My code": "मेरा कोड", "Scan code": "कोड स्कैन करें",
  "Type a message": "संदेश लिखें", "Message": "संदेश", "Attach": "जोड़ें", "Voice message": "वॉइस संदेश", "Open profile": "प्रोफ़ाइल खोलें",
  "Copy": "कॉपी", "Edit": "बदलें", "Delete": "हटाएँ", "Edit message": "संदेश बदलें", "View profile": "प्रोफ़ाइल देखें",
  "Pin chat": "चैट पिन करें", "Unpin chat": "चैट अनपिन करें", "Archive chat": "चैट आर्काइव करें", "Unarchive chat": "आर्काइव से निकालें", "Block": "ब्लॉक करें", "Unblock": "अनब्लॉक करें",
  "Lock chat": "चैट लॉक करें", "Unlock chat": "चैट अनलॉक करें", "Pin message": "संदेश पिन करें", "Unpin message": "संदेश अनपिन करें", "You blocked this person.": "आपने इस व्यक्ति को ब्लॉक किया है।",
  "Pinned message": "पिन किया संदेश", "typing…": "टाइप कर रहे हैं…", "active": "सक्रिय", "edited ·": "बदला गया ·",
  "Profile": "प्रोफ़ाइल", "Edit profile": "प्रोफ़ाइल बदलें", "Joined": "जुड़े",
  "Change photo": "फ़ोटो बदलें", "Remove photo": "फ़ोटो हटाएँ", "Name": "नाम", "Bio": "बायो", "Your ID": "आपकी ID", "Change ID": "ID बदलें", "Links on your profile": "प्रोफ़ाइल पर लिंक", "Save links": "लिंक सेव करें",
  "You can change your ID once every 17 days. Friends find you by it.": "आप अपनी ID हर 17 दिन में एक बार बदल सकते हैं। दोस्त आपको इसी से ढूँढते हैं।",
  "Photo updated.": "फ़ोटो बदल गई।", "Saved.": "सेव हो गया।", "Links saved.": "लिंक सेव हो गए।",
  "Account": "खाता", "Preferences": "पसंद", "Support": "सहायता", "Photo, name, ID, bio": "फ़ोटो, नाम, ID, बायो", "Password, recovery code": "पासवर्ड, रिकवरी कोड",
  "Privacy & Security": "गोपनीयता और सुरक्षा", "Active status, how your data is handled": "सक्रिय स्थिति, आपका डेटा कैसे संभाला जाता है", "Appearance": "रूप-रंग",
  "Language": "भाषा", "Notifications": "सूचनाएँ", "Message alerts": "संदेश अलर्ट", "Data & Storage": "डेटा और स्टोरेज", "Photos, files and voice you shared or received": "आपकी भेजी या मिली फ़ोटो, फ़ाइलें और आवाज़ें",
  "Help & feedback": "सहायता और फ़ीडबैक", "Policy, terms, help, feedback": "नीति, शर्तें, मदद, फ़ीडबैक", "About BAT": "BAT के बारे में", "About the creator": "निर्माता के बारे में", "Log out": "लॉग आउट",
  "Show when I'm active": "मेरी सक्रिय स्थिति दिखाएँ", "If you turn this off, you also won't see when others are active or typing.": "इसे बंद करने पर आप भी दूसरों की सक्रिय या टाइपिंग स्थिति नहीं देख पाएँगे।",
  "Chat lock PIN": "चैट लॉक PIN", "Set a PIN to lock chats": "चैट लॉक करने के लिए PIN बनाएँ", "Change your PIN": "अपना PIN बदलें",
  "Default": "डिफ़ॉल्ट", "Pure black": "गहरा काला", "Dark": "डार्क", "Soft charcoal": "हल्का चारकोल", "Light": "लाइट", "Bright and clean": "उजला और साफ़",
  "Privacy policy": "गोपनीयता नीति", "Terms": "शर्तें", "Help": "मदद", "Forgot password, contact": "पासवर्ड भूलना, संपर्क", "Feedback": "फ़ीडबैक", "Tell us what to improve": "बताइए क्या सुधारें",
  "Read feedback": "फ़ीडबैक पढ़ें", "Admin only": "सिर्फ़ एडमिन", "What should we improve? Bugs, ideas, anything.": "हम क्या सुधारें? गड़बड़ी, आइडिया, कुछ भी।",
  "Thank you. Your feedback was sent.": "धन्यवाद। आपका फ़ीडबैक भेज दिया गया।", "No feedback yet.": "अभी कोई फ़ीडबैक नहीं।",
  "Change password": "पासवर्ड बदलें", "Current password": "मौजूदा पासवर्ड", "Update password": "पासवर्ड अपडेट करें", "Confirm with your password": "अपने पासवर्ड से पुष्टि करें",
  "Your password, to confirm": "पुष्टि के लिए आपका पासवर्ड", "Get a new recovery code": "नया रिकवरी कोड पाएँ", "Delete account": "खाता हटाएँ", "Password changed.": "पासवर्ड बदल गया।",
  "Here, your notes come to life": "यहाँ आपके नोट्स ज़िंदा हो उठते हैं", "Browse": "देखें", "Write": "लिखें", "Newer": "नए", "Older": "पुराने", "Tap to edit": "बदलने के लिए छुएँ",
  "Browse your notes": "अपने नोट्स देखें", "Note": "नोट", "Write something…": "कुछ लिखें…", "Empty note": "खाली नोट", "Write a note, or keep a link for later.": "नोट लिखें, या बाद के लिए कोई लिंक रख लें।", "Delete note": "नोट हटाएँ",
  "All": "सभी", "Photos": "फ़ोटो", "Files": "फ़ाइलें", "Voice": "आवाज़",
  "Nothing here yet. Photos, files and voice messages you share or receive will appear here.": "यहाँ अभी कुछ नहीं। आपकी भेजी या मिली फ़ोटो, फ़ाइलें और वॉइस संदेश यहाँ दिखेंगे।",
  "Media from locked chats isn't shown.": "लॉक की हुई चैट का मीडिया यहाँ नहीं दिखता।",
  "Scan a code": "कोड स्कैन करें", "Copy my link": "मेरा लिंक कॉपी करें", "Copied": "कॉपी हो गया",
  "Friends can scan this code to open your profile and message you.": "दोस्त इस कोड को स्कैन करके आपकी प्रोफ़ाइल खोल सकते हैं और संदेश भेज सकते हैं।",
  "Point the camera at a BAT code.": "कैमरा BAT कोड की ओर रखें।", "Enter your PIN to open this chat.": "यह चैट खोलने के लिए अपना PIN डालें।", "Unlock": "अनलॉक करें",
  "PIN": "PIN", "New PIN (4 to 8 digits)": "नया PIN (4 से 8 अंक)", "Current PIN": "मौजूदा PIN", "Language": "भाषा",
};
const RULES = [
  [/^active (\d+)m ago$/, (m) => `${m[1]} मिनट पहले सक्रिय`], [/^active (\d+)h ago$/, (m) => `${m[1]} घंटे पहले सक्रिय`], [/^active (\d+)d ago$/, (m) => `${m[1]} दिन पहले सक्रिय`],
  [/^(\d+) chats?$/, (m) => `${m[1]} चैट`], [/^(\d+) items? · (.+)$/, (m) => `${m[1]} आइटम · ${m[2]}`],
  [/^You can change your ID again on (.+)\.$/, (m) => `आप अपनी ID दोबारा ${m[1]} को बदल सकते हैं।`],
];
const tr = (s) => {
  if (lang === "en") return s;
  const k = s.trim(); if (!k) return s;
  let v = HI[k];
  if (!v) for (const [re, f] of RULES) { const m = re.exec(k); if (m) { v = f(m); break; } }
  return v ? s.replace(k, v) : s;
};
const SKIP = "[data-u], textarea, .msgs, .paper, .sheet, .ptext, .cover small";
const fixText = (n) => { if (n.parentElement && !n.parentElement.closest(SKIP)) { const v = tr(n.nodeValue); if (v !== n.nodeValue) n.nodeValue = v; } };
function walk(root) {
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT), nodes = [];
  while (w.nextNode()) nodes.push(w.currentNode);
  nodes.forEach(fixText);
  const els = root.matches && root.matches("[placeholder],[aria-label],[title]") ? [root] : [];
  root.querySelectorAll && els.push(...root.querySelectorAll("[placeholder],[aria-label],[title]"));
  for (const el of els) if (!el.closest(SKIP)) for (const a of ["placeholder", "aria-label", "title"]) {
    const cur = el.getAttribute(a); if (cur) { const v = tr(cur); if (v !== cur) el.setAttribute(a, v); }
  }
}
export function startTranslator(root) {
  document.documentElement.lang = lang;
  new MutationObserver((muts) => {
    if (lang === "en") return;
    for (const m of muts) {
      m.addedNodes.forEach((n) => (n.nodeType === 1 ? walk(n) : n.nodeType === 3 && fixText(n)));
      if (m.type === "characterData") fixText(m.target);
    }
  }).observe(root, { childList: true, subtree: true, characterData: true });
}
