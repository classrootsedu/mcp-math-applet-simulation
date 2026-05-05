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
