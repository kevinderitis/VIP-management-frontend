import { create } from 'zustand'

export type CleanerLanguage = 'en' | 'my'

const STORAGE_KEY = 'cleaner-language'

const readStoredLanguage = (): CleanerLanguage => {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === 'my' ? 'my' : 'en'
  } catch {
    return 'en'
  }
}

type LanguageState = {
  language: CleanerLanguage
  setLanguage: (language: CleanerLanguage) => void
}

export const useCleanerLanguageStore = create<LanguageState>((set) => ({
  language: readStoredLanguage(),
  setLanguage: (language) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, language)
    } catch {
      // Language still applies for this session when storage is unavailable.
    }
    set({ language })
  },
}))

const en = {
  menu: 'Menu',
  language: 'Language',
  english: 'English',
  burmese: 'မြန်မာ',
  logOut: 'Log out',
  cleaning: 'Cleaning',
  myList: '🧹 My list',
  doneCount: 'Done today: {count}',
  roomDone: '{name} done ✓',
  openMessenger: 'OPEN MESSENGER CHAT',
  chatLinkMissing: 'Chat link not set yet.',
  started: 'STARTED',
  toDo: 'TO DO',
  start: 'START',
  cleaningNow: 'Cleaning now… tap the green button when done.',
  done: 'DONE',
  giveBack: 'Give back',
  delegate: 'Delegate',
  delegateTitle: 'Delegate task',
  delegateHint: 'Choose the cleaner who will take this task.',
  delegateConfirm: 'Confirm delegation',
  delegateSending: 'SENDING…',
  delegateFailed: 'Could not delegate the task',
  noOtherCleaners: 'No other cleaners are available.',
  listEmpty: 'Your list is empty',
  listEmptyHint: 'Take a task below to add it to your list.',
  withCleaner: '· with {name}',
  take: 'TAKE',
  nothingToTake: 'Nothing to take right now. Good job 👏',
  room: 'Room',
  finalCheck: 'final check',
  finalCheckHint: 'Mark the items that are working, then confirm the room is ready.',
  acOk: 'AC ok',
  lightOk: 'Light ok',
  sending: 'SENDING…',
  cancel: 'Cancel',
  cleanerProfile: 'Cleaner profile',
  shiftSummary: 'Shift summary',
  shiftSummaryDescription:
    'A simplified profile with credentials context, completed work, and time history.',
  cleaner: 'Cleaner',
  completedTasks: 'Completed tasks',
  loginAccess: 'Login access',
  cleaningHistory: 'Cleaning history',
  completed: 'Completed',
  noHistory: 'No cleaning history is available yet.',
} as const

export type CleanerTranslationKey = keyof typeof en

const my: Record<CleanerTranslationKey, string> = {
  menu: 'မီနူး',
  language: 'ဘာသာစကား',
  english: 'English',
  burmese: 'မြန်မာ',
  logOut: 'အကောင့်မှ ထွက်ရန်',
  cleaning: 'သန့်ရှင်းရေး',
  myList: '🧹 ကျွန်ုပ်၏ စာရင်း',
  doneCount: 'ယနေ့ ပြီးစီး: {count}',
  roomDone: '{name} ပြီးပါပြီ ✓',
  openMessenger: 'MESSENGER ချက်တ် ဖွင့်ရန်',
  chatLinkMissing: 'ချက်တ်လင့်ခ် မသတ်မှတ်ရသေးပါ။',
  started: 'စတင်ပြီး',
  toDo: 'လုပ်ရန်',
  start: 'စတင်ရန်',
  cleaningNow: 'ယခု သန့်ရှင်းရေးလုပ်နေသည်… ပြီးပါက အစိမ်းရောင်ခလုတ်ကို နှိပ်ပါ။',
  done: 'ပြီးပါပြီ',
  giveBack: 'ပြန်အပ်ရန်',
  delegate: 'လွှဲပြောင်းရန်',
  delegateTitle: 'တာဝန် လွှဲပြောင်းရန်',
  delegateHint: 'ဤတာဝန်ကို ယူမည့် သန့်ရှင်းရေးဝန်ထမ်းကို ရွေးချယ်ပါ။',
  delegateConfirm: 'လွှဲပြောင်းမှု အတည်ပြုရန်',
  delegateSending: 'ပို့နေသည်…',
  delegateFailed: 'တာဝန် မလွှဲပြောင်းနိုင်ပါ',
  noOtherCleaners: 'အခြား သန့်ရှင်းရေးဝန်ထမ်း မရှိပါ။',
  listEmpty: 'သင့်စာရင်း ဗလာဖြစ်နေသည်',
  listEmptyHint: 'သင့်စာရင်းထဲ ထည့်ရန် အောက်မှ တာဝန်တစ်ခုကို ယူပါ။',
  withCleaner: '· {name} နှင့်အတူ',
  take: 'ယူရန်',
  nothingToTake: 'ယခု ယူရန် တာဝန် မရှိပါ။ ကောင်းသောအလုပ် 👏',
  room: 'အခန်း',
  finalCheck: 'နောက်ဆုံး စစ်ဆေးမှု',
  finalCheckHint: 'အလုပ်လုပ်နေသော အရာများကို အမှတ်ခြစ်ပြီး အခန်း အသင့်ဖြစ်ကြောင်း အတည်ပြုပါ။',
  acOk: 'AC ကောင်းမွန်သည်',
  lightOk: 'မီးလုံး ကောင်းမွန်သည်',
  sending: 'ပို့နေသည်…',
  cancel: 'ပယ်ဖျက်ရန်',
  cleanerProfile: 'သန့်ရှင်းရေးဝန်ထမ်း ပရိုဖိုင်',
  shiftSummary: 'အလုပ်ဆိုင်း အကျဉ်းချုပ်',
  shiftSummaryDescription:
    'အကောင့်အချက်အလက်၊ ပြီးစီးခဲ့သောအလုပ်နှင့် အချိန်မှတ်တမ်း ပါဝင်သော ရိုးရှင်းသည့် ပရိုဖိုင်။',
  cleaner: 'သန့်ရှင်းရေးဝန်ထမ်း',
  completedTasks: 'ပြီးစီးသော တာဝန်များ',
  loginAccess: 'အကောင့်အမည်',
  cleaningHistory: 'သန့်ရှင်းရေး မှတ်တမ်း',
  completed: 'ပြီးစီး',
  noHistory: 'သန့်ရှင်းရေး မှတ်တမ်း မရှိသေးပါ။',
}

const dictionaries: Record<CleanerLanguage, Record<CleanerTranslationKey, string>> = {
  en,
  my,
}

export const useCleanerI18n = () => {
  const language = useCleanerLanguageStore((state) => state.language)
  const setLanguage = useCleanerLanguageStore((state) => state.setLanguage)

  const t = (key: CleanerTranslationKey, values?: Record<string, string | number>) => {
    let text = dictionaries[language][key] ?? en[key]
    if (values) {
      for (const [name, value] of Object.entries(values)) {
        text = text.replaceAll(`{${name}}`, String(value))
      }
    }
    return text
  }

  return { language, setLanguage, t }
}
