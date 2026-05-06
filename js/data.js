// data.js - Internationalization data for the Ratio Learning Applet
// Contains only the text content that's actually used in the ratio app

const highlightColor1 = "#FFD700";
const highlightColor2 = "#70ACC7";
const highlightColor3 = "#F28283";
const highlightColor4 = "#00FF7F";
const highlightColor5 = '#8A2BE2';

const questionTextSize = '24gc';

const question = [
  { dividend: 96, divisor: 3 },
  { dividend: 96, divisor: 6 },
  // { dividend: 74, divisor: 5 },
  // { dividend: 13, divisor: 2 },
  // { dividend: 125, divisor: 5 }
];
if (typeof window !== 'undefined') { window.question = question; }

const AppData = {
  // Current language setting
  currentLanguage: "en",

  // Text content by language
  translations: {
    en: {
      appInfo: {
          title: "Ratio - Komodo Distance Comparison"
      },
      messages: {
          pageStatesCleared: "Page states have been cleared. Reload the page to start fresh?",
          nextButtonPage2: "Dispatched page change event to page 2",
          previousButtonPage1: "Dispatched page change event to page 1"
      },
      
      buttons: {
          next: "»",
          previous: "«",
          startOver: "Start Over"
      },
      
      common: {
          questionText: "Asep has 12 chickens, each chicken consumes 3 bowls of food a day. How many bowls of food should Asep provide each day?",
          questionIcon: "Q",
          labels: {
              dropHere: "Drop here"
          },
          informationAnalysis: {
              header: "INFORMATION ANALYSIS",
              facts: "Facts",
              values: "Value",
              toFind: "To Find"
          },
          conceptSummary: {
              header: "CONCEPT SUMMARY",
              given: "Given",
              toFind: "To Find",
              keyConcepts: "Key Concepts",
              importantFormulae: "Calculations"
          }
      },
      
      components: {
          informationAnalysis: {
              headerText: "INFORMATION ANALYSIS",
              factsTitle: "Facts",
              valueTitle: "Value",
              toFindTitle: "To Find"
          },
          conceptSummary: {
              headerText: "CONCEPT SUMMARY",
              givenTitle: "Given",
              toFindTitle: "To Find",
              keyConceptsTitle: "Key Concepts",
              importantFormulaeTitle: "Calculations"
          }
      },
      
      pages: {
        page1: {
          startButton: "Start",
          instruction: "Tap 'Start' Button",
          headerWhatIs: "What is",
          headerSolveUsing: "Solve using Tiered Division…"
        },
        page2: {
          divInstruction: "Guided mode: follow the hints and fill in each step. Same dark theme styling.",
          instructionDefault: "Follow the instructions/ use multiplication table and fill in each step.",
          instructionTapContinue: "Tap » to start again",
          instructionTapNextChallenge: "Tap » to solve the next division challenge."
        }
      },
      division: {
        chooseFirstDigit: "Choose the first digit in the dividend.",
        chooseNextDigit: "The number {value} is less than {divisor}. Choose the next digit.",
        selectThenFind: "The number {value} is >= {divisor}.<br><br>Now find how many times {divisor} goes into {value}.<br><br> Use the multiplication table/ Digit panel to fill the highlighted quotient digit",
        multiplicationTableFor: "Multiplication Table for {divisor}",
        howManyTimes: "How many times does {divisor} go into {value}?",
        stepDescriptionDivide: "{value} ÷ {divisor} = {quotient}",
        bringDownHint: "Bring down the next digit from the dividend.<br><br>Click the highlighted digit in the dividend row (or drag from the digit panel into the bring-down cell).",
        bringDownDescription: "Bring down {digit}",
        hintProduct: "{quotient} × {divisor} = ?<br><br>Use the digit panel to fill in the product (quotient × divisor).",
        writeDigit: "Write {digit}",
        hintDifference: "{current} - {subtract} = ?<br><br>Use the digit panel to fill in the difference (remainder after subtraction).",
        hintRemainder: "The remainder is ?<br><br>Use the digit panel to fill in the remainder.",
        writeRemainderDigit: "Write remainder digit {digit}",
        selectStartingDescription: "Select starting digits from dividend",
        completeIntro: "Using Long Division, we see that {dividend} ÷ {divisor} gives ",
        completeQuotientPart: "a quotient of {quotient}",
        completeAnd: " and ",
        completeNoRemainderPart: "leaves no remainder.",
        completeRemainderPart: "leaves a remainder of {remainder}."
      },
      tutor: {
        // ===== startingDigit (chooseDividendDigits) =====
        startingDigit: {
          correct: "Good — {value} is at least {divisor}, so we can start dividing.",
          incorrect: {
            notEnoughDigits: "{value} is less than {divisor}. We need to include the next digit too.",
            tooManyDigits:   "{value} is enough on its own — we don't need to take more digits.",
            generic:         "That selection won't let us divide. Try again."
          },
          points: {
            confirm:    "Right — {value} is the smallest part of {dividend} that's at least {divisor}.",
            transition: "Now find how many times {divisor} fits into {value}.",
            askMtable:  "Look at the multiplication table for {divisor}."
          },
          nextHint: { retry:  "Try selecting digits until the value is at least {divisor}.",
                      transition: "Now choose the first quotient digit." },
          reco: "Start with the smallest part of {dividend} that's ≥ {divisor}."
        },
        // ===== quotient (chooseQuotientDigit) =====
        quotient: {
          correct: "Great! {accepted} × {divisor} = {product}.",
          incorrect: {
            tooHigh: "{accepted} × {divisor} = {productAccepted}, which is more than {value}.",
            tooLow:  "{accepted} × {divisor} = {productAccepted}, but a bigger digit still fits.",
            zero:    "0 × {divisor} = 0 — but we have {value} to work with.",
            generic: "That's not the right quotient digit yet."
          },
          points: {
            reframe:    "We want a digit that, times {divisor}, is at most {value}.",
            encourage:  "You're close — try a {direction} number.",
            askMtable:  "Look at the row for {divisor} in the multiplication table.",
            confirm:    "Yes — {divisor} fits into {value} exactly {accepted} times."
          },
          nextHint: { retry:      "Try again: how many times does {divisor} go into {value}?",
                      transition: "Now multiply {accepted} × {divisor} and write that below {value}." },
          reco: "{expected} × {divisor} = {expectedProduct}, exactly fits {value}."
        },
        // ===== product (setPartialProduct) =====
        product: {
          correct: "Right — {accepted} × {divisor} = {accepted}.",
          incorrect: {
            tooHigh: "{accepted} is more than {expected}.",
            tooLow:  "{accepted} is less than {expected}.",
            generic: "That's not {quotient} × {divisor}."
          },
          points: {
            confirm:    "Good multiplication.",
            transition: "Now subtract {expected} from {value}."
          },
          nextHint: { retry:      "What is {quotient} × {divisor}?",
                      transition: "Now do the subtraction." },
          reco: "{quotient} × {divisor} = {expected}."
        },
        // ===== subtract (setSubtractionResult) =====
        subtract: {
          correct: "Right — {value} − {minuend} = {expected}.",
          incorrect: {
            tooHigh:  "{accepted} is too big — we need {value} − {minuend}.",
            tooLow:   "{accepted} is too small — recheck the subtraction.",
            signFlip: "Looks like the order got flipped. We're subtracting {minuend} from {value}.",
            generic:  "That's not {value} − {minuend}."
          },
          points: {
            confirm:    "Subtraction is correct.",
            transition: "Now bring down the next digit."
          },
          nextHint: { retry:      "What is {value} − {minuend}?",
                      transition: "Now bring down the next digit of the dividend." },
          reco: "{value} − {minuend} = {expected}."
        },
        // ===== bringDown (bringDownDigit) =====
        bringDown: {
          correct: "Good — bringing down {digit} gives us {value}.",
          incorrect: { generic: "Pick the next digit from the dividend." },
          points:   { confirm:    "Now we have {value} to divide by {divisor}.",
                      transition: "Find how many times {divisor} fits into {value}." },
          nextHint: { transition: "Choose the next quotient digit." },
          reco: "Bring down the {digit}."
        },
        // ===== remainder (setRemainder) =====
        remainder: {
          correct: {
            zero:    "Perfect — there's no remainder. {dividend} ÷ {divisor} is exactly {quotient}.",
            nonZero: "Right — the remainder is {expected}. {dividend} ÷ {divisor} = {quotient} remainder {expected}."
          },
          incorrect: {
            tooHigh: "{accepted} is bigger than the value left over.",
            tooLow:  "{accepted} is smaller than the value left over.",
            generic: "That's not the right remainder."
          },
          points:   { celebrate:   "We're done!",
                      reflect:     "Long division is built from these four steps repeated." },
          nextHint: { transition:  "Tap » to try another problem." },
          reco: "The remainder is {expected}."
        },
        // ===== complete (terminal) =====
        complete: {
          success: "You solved {dividend} ÷ {divisor} = {quotient}{remainderText}. Great job!",
          remainderText: { zero: "", nonZero: " remainder {remainder}" },
          points: { celebrate: "Brilliant!", encourage: "Want to try another?" }
        },
        // ===== start (Page 1) =====
        start: {
          correct: "Let's solve {dividend} ÷ {divisor}.",
          points:  { transition: "Pick the first digit of the dividend to start." },
          nextHint: { transition: "Choose where to start dividing." },
          reco: "Tap Start to begin."
        },
        // ===== nav =====
        nav: {
          next: {
            midBank:      "Nice work! Let's try {nextDividend} ÷ {nextDivisor}.",
            lastQuestion: "You finished all the problems! Let's go back and start over."
          },
          previous: "Going back to the start screen."
        }
      },
    },
    id: {
      appInfo: {
          title: "Rasio - Perbandingan Jarak Komodo"
      },
      messages: {
          pageStatesCleared: "Status halaman telah dihapus. Muat ulang halaman untuk memulai dari awal?",
          nextButtonPage2: "Mengirimkan event perubahan halaman ke halaman 2",
          previousButtonPage1: "Mengirimkan event perubahan halaman ke halaman 1"
      },
      
      buttons: {
          next: "»",
          previous: "«",
          startOver: "Mulai Lagi"
      },
      
      common: {
          questionText: "Asep memiliki 12 ayam, setiap ayam mengonsumsi 3 mangkuk makanan sehari. Berapa banyak mangkuk makanan yang harus disediakan Asep setiap hari?",
          questionIcon: "Q",
          labels: {
              dropHere: "Letakkan di sini"
          },
          informationAnalysis: {
              header: "ANALISIS INFORMASI",
              facts: "Fakta",
              values: "Nilai",
              toFind: "Yang Dicari"
          },
          conceptSummary: {
              header: "RINGKASAN KONSEP",
              given: "Diketahui",
              toFind: "Yang Dicari",
              keyConcepts: "Konsep Kunci",
              importantFormulae: "Perhitungan"
          }
      },
      
      components: {
          informationAnalysis: {
              headerText: "ANALISIS INFORMASI",
              factsTitle: "Fakta",
              valueTitle: "Nilai",
              toFindTitle: "Yang Dicari"
          },
          conceptSummary: {
              headerText: "RINGKASAN KONSEP",
              givenTitle: "Diketahui",
              toFindTitle: "Yang Dicari",
              keyConceptsTitle: "Konsep Kunci",
              importantFormulaeTitle: "Perhitungan"
          }
      },
      
      pages: {
        page1: {
          startButton: "Mulai",
          instruction: "Ketuk tombol 'Mulai'",
          headerWhatIs: "Berapa",
          headerSolveUsing: "Selesaikan dengan Pembagian Bersusun Panjang…"
        },
        page2: {
          divInstruction: "Mode panduan: ikuti petunjuk dan isi setiap langkah. Gaya tema gelap yang sama.",
          instructionDefault: "Ikuti petunjuk/ gunakan tabel perkalian dan isi setiap langkah.",
          instructionTapContinue: "Ketuk » untuk mulai lagi",
          instructionTapNextChallenge: "Ketuk » untuk tantangan pembagian berikutnya."
        }
      },
      division: {
        chooseFirstDigit: "Pilih angka pertama pada bilangan yang dibagi",
        chooseNextDigit: "Angka {value} lebih kecil dari {divisor}. Pilih angka berikutnya.",
        selectThenFind: "Angka {value} >= {divisor}.<br><br>Sekarang cari berapa kali {divisor} masuk ke {value}.<br><br>Lihat tabel perkalian dan ketuk tombol angka dibawah yang tepat untuk mengisi angka hasil bagi yang disorot.",
        multiplicationTableFor: "Tabel Perkalian untuk {divisor}",
        howManyTimes: "Berapa kali {divisor} masuk ke {value}?",
        stepDescriptionDivide: "{value} ÷ {divisor} = {quotient}",
        bringDownHint: "Turunkan angka berikutnya dari bilangan yang dibagi.<br><br>Ketuk angka yang disorot di baris bilangan yang dibagi.",
        bringDownDescription: "Turunkan {digit}",
        hintProduct: "{quotient} × {divisor} = ?<br><br>Gunakan panel angka untuk mengisi hasil (hasil bagi × pembagi).",
        writeDigit: "Tulis {digit}",
        hintDifference: "{current} - {subtract} = ?<br><br>Gunakan tombol angka dibawah untuk mengisi selisih (sisa setelah pengurangan).",
        hintRemainder: "Sisanya adalah ?<br><br>Gunakan panel angka untuk mengisi sisa.",
        writeRemainderDigit: "Tulis angka sisa {digit}",
        selectStartingDescription: "Pilih digit awal dari dividen",
        completeIntro: "Dengan Pembagian Bersusun Panjang, kita melihat bahwa {dividend} ÷ {divisor} memberikan ",
        completeQuotientPart: "hasil bagi {quotient}",
        completeAnd: " dan ",
        completeNoRemainderPart: "tidak ada sisa.",
        completeRemainderPart: "sisa {remainder}."
      },
      tutor: {
        startingDigit: {
          correct: "Bagus — {value} setidaknya {divisor}, jadi kita bisa mulai membagi.",
          incorrect: {
            notEnoughDigits: "{value} kurang dari {divisor}. Kita perlu menyertakan digit berikutnya.",
            tooManyDigits:   "{value} sudah cukup — kita tidak perlu mengambil digit lebih.",
            generic:         "Pilihan itu tidak akan membantu kita membagi. Coba lagi."
          },
          points: {
            confirm:    "Benar — {value} adalah bagian terkecil dari {dividend} yang setidaknya {divisor}.",
            transition: "Sekarang cari berapa kali {divisor} masuk ke {value}.",
            askMtable:  "Lihat tabel perkalian untuk {divisor}."
          },
          nextHint: { retry: "Pilih digit hingga nilainya setidaknya {divisor}.",
                      transition: "Sekarang pilih digit hasil bagi pertama." },
          reco: "Mulai dengan bagian terkecil dari {dividend} yang ≥ {divisor}."
        },
        quotient: {
          correct: "Bagus! {accepted} × {divisor} = {product}.",
          incorrect: {
            tooHigh: "{accepted} × {divisor} = {productAccepted}, lebih dari {value}.",
            tooLow:  "{accepted} × {divisor} = {productAccepted}, tetapi digit yang lebih besar masih muat.",
            zero:    "0 × {divisor} = 0 — tetapi kita punya {value} untuk diolah.",
            generic: "Itu belum digit hasil bagi yang tepat."
          },
          points: {
            reframe:    "Kita ingin digit yang, dikali {divisor}, paling banyak {value}.",
            encourage:  "Kamu hampir tepat — coba angka yang lebih {direction}.",
            askMtable:  "Lihat baris {divisor} di tabel perkalian.",
            confirm:    "Ya — {divisor} masuk ke {value} tepat {accepted} kali."
          },
          nextHint: { retry:      "Coba lagi: berapa kali {divisor} masuk ke {value}?",
                      transition: "Sekarang kalikan {accepted} × {divisor} dan tulis di bawah {value}." },
          reco: "{expected} × {divisor} = {expectedProduct}, tepat memenuhi {value}."
        },
        product: {
          correct: "Benar — {accepted} × {divisor} = {accepted}.",
          incorrect: {
            tooHigh: "{accepted} lebih dari {expected}.",
            tooLow:  "{accepted} kurang dari {expected}.",
            generic: "Itu bukan {quotient} × {divisor}."
          },
          points:   { confirm: "Perkalian benar.",
                      transition: "Sekarang kurangi {expected} dari {value}." },
          nextHint: { retry: "Berapa {quotient} × {divisor}?",
                      transition: "Sekarang lakukan pengurangan." },
          reco: "{quotient} × {divisor} = {expected}."
        },
        subtract: {
          correct: "Benar — {value} − {minuend} = {expected}.",
          incorrect: {
            tooHigh:  "{accepted} terlalu besar — kita perlu {value} − {minuend}.",
            tooLow:   "{accepted} terlalu kecil — periksa pengurangan lagi.",
            signFlip: "Sepertinya urutannya terbalik. Kita mengurangi {minuend} dari {value}.",
            generic:  "Itu bukan {value} − {minuend}."
          },
          points:   { confirm: "Pengurangan benar.",
                      transition: "Sekarang turunkan digit berikutnya." },
          nextHint: { retry: "Berapa {value} − {minuend}?",
                      transition: "Sekarang turunkan digit berikutnya dari yang dibagi." },
          reco: "{value} − {minuend} = {expected}."
        },
        bringDown: {
          correct: "Bagus — menurunkan {digit} memberi kita {value}.",
          incorrect: { generic: "Pilih digit berikutnya dari yang dibagi." },
          points:   { confirm:    "Sekarang kita punya {value} untuk dibagi {divisor}.",
                      transition: "Cari berapa kali {divisor} masuk ke {value}." },
          nextHint: { transition: "Pilih digit hasil bagi berikutnya." },
          reco: "Turunkan {digit}."
        },
        remainder: {
          correct: {
            zero:    "Sempurna — tidak ada sisa. {dividend} ÷ {divisor} tepat {quotient}.",
            nonZero: "Benar — sisanya {expected}. {dividend} ÷ {divisor} = {quotient} sisa {expected}."
          },
          incorrect: {
            tooHigh: "{accepted} lebih besar dari yang tersisa.",
            tooLow:  "{accepted} lebih kecil dari yang tersisa.",
            generic: "Itu bukan sisa yang tepat."
          },
          points:   { celebrate: "Selesai!",
                      reflect:   "Pembagian bersusun dibangun dari empat langkah ini berulang." },
          nextHint: { transition: "Ketuk » untuk mencoba soal lain." },
          reco: "Sisanya {expected}."
        },
        complete: {
          success: "Kamu menyelesaikan {dividend} ÷ {divisor} = {quotient}{remainderText}. Kerja bagus!",
          remainderText: { zero: "", nonZero: " sisa {remainder}" },
          points: { celebrate: "Hebat!", encourage: "Mau coba yang lain?" }
        },
        start: {
          correct: "Mari selesaikan {dividend} ÷ {divisor}.",
          points:  { transition: "Pilih digit pertama dari yang dibagi untuk mulai." },
          nextHint: { transition: "Pilih dari mana akan mulai membagi." },
          reco: "Ketuk Mulai untuk memulai."
        },
        nav: {
          next: {
            midBank:      "Kerja bagus! Mari coba {nextDividend} ÷ {nextDivisor}.",
            lastQuestion: "Kamu selesai semua soal! Mari kembali dan mulai lagi."
          },
          previous: "Kembali ke layar awal."
        }
      }
    }
}
};

// Simple i18n utility functions
const i18n = {
  // Get translated text
  t: (key, params = {}) => {
    const lang = AppData.currentLanguage;
    const translation = AppData.translations[lang];

    // Navigate through nested object using dot notation
    const keys = key.split(".");
    let value = translation;
    let found = true;

    for (const k of keys) {
      if (value && typeof value === "object" && k in value) {
        value = value[k];
      } else {
        found = false;
        break;
      }
    }

    // If not found in current language, try English fallback
    if (!found) {
      value = AppData.translations.en;
      for (const fallbackKey of keys) {
        if (value && typeof value === "object" && fallbackKey in value) {
          value = value[fallbackKey];
        } else {
          return `[Missing: ${key}]`;
        }
      }
    }

    // If value is undefined or null, return missing message
    if (value === undefined || value === null) {
      return `[Missing: ${key}]`;
    }

    // Replace parameters in string
    if (typeof value === "string") {
      return value.replace(/\{(\w+)\}/g, (match, param) => {
        return params.hasOwnProperty(param) ? params[param] : match;
      });
    }

    // Return value as-is (could be array, object, number, boolean, etc.)
    return value;
  },

  // Set the current language
  setLanguage: (langCode) => {
    console.log(`🌐 Attempting to set language to: ${langCode}`);
    console.log(`🌐 Available languages:`, Object.keys(AppData.translations));
    console.log(`🌐 Current language before change:`, AppData.currentLanguage);

    if (AppData.translations[langCode]) {
      AppData.currentLanguage = langCode;
      console.log(`✅ Language successfully set to: ${langCode}`);
      console.log(`🌐 Current language after change:`, AppData.currentLanguage);
      return true;
    } else {
      console.warn(
        `❌ Language '${langCode}' not supported. Available languages:`,
        Object.keys(AppData.translations)
      );
      return false;
    }
  },

  // Get the current language
  getCurrentLanguage: () => {
    return AppData.currentLanguage;
  },

  // Initialize language system (placeholder for compatibility)
  initLanguage: () => {
    console.log("🌐 i18n system initialized");
    return true;
  },

  // Helper function to get page data
  getPageData: (pageNumber) => {
    const lang = AppData.currentLanguage;
    const translation = AppData.translations[lang];

    if (translation.pages && translation.pages[`page${pageNumber}`]) {
      return translation.pages[`page${pageNumber}`];
    }

    // Fallback to English
    const enTranslation = AppData.translations.en;
    if (enTranslation.pages && enTranslation.pages[`page${pageNumber}`]) {
      return enTranslation.pages[`page${pageNumber}`];
    }

    return null;
  },
};

// Make i18n globally available
window.i18n = i18n;
