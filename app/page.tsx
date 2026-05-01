"use client";

import {
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  RefreshCw,
  Settings,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Cell, Pie, PieChart } from "recharts";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  CATEGORIES,
  RANGE_OPTIONS,
  SESSION_STORAGE_KEY,
  type RangeValue,
} from "@/lib/constants";

type Session = {
  roomId: string;
  userName: string;
  members: string[];
};

type RecordItem = {
  id: string;
  roomId: string;
  paidBy: string;
  category: string;
  createdAt: string;
};

type LandingMode = "create" | "join";
type ScreenMode = "action" | "stats";
type Locale = "en" | "zh-Hant";
type ThemeMode = "light" | "dark";
type FullRoomState = {
  roomId: string;
  members: string[];
} | null;
type CategoryPreference = {
  name: string;
  visible: boolean;
};

const LANGUAGE_STORAGE_KEY = "couple-tracker-language";
const CATEGORY_SETTINGS_STORAGE_KEY = "couple-tracker-category-settings";
const THEME_STORAGE_KEY = "couple-tracker-theme";
const MAX_CUSTOM_RANGE_DAYS = 366;
const MAX_ACCOUNT_MEMBERS = 2;
const SAVE_NOTICE_DURATION_MS = 750;
const ALL_CATEGORIES = [...CATEGORIES, "Baby", "Parking"];
const DEFAULT_VISIBLE_CATEGORIES = [
  "Meal",
  "Entertainment",
  "Groceries",
  "Transport",
  "Snacks",
];
const DEFAULT_CATEGORY_ORDER = [
  ...DEFAULT_VISIBLE_CATEGORIES,
  "Baby",
  "Parking",
];
const CATEGORY_PIE_COLORS: Record<string, string> = {
  Meal: "#06b6d4",
  Entertainment: "#6366f1",
  Groceries: "#10b981",
  Transport: "#3b82f6",
  Snacks: "#84cc16",
  Baby: "#ec4899",
  Parking: "#f59e0b",
};

function getDefaultCategoryPreferences(): CategoryPreference[] {
  const visibleSet = new Set(DEFAULT_VISIBLE_CATEGORIES);
  const orderedNames = [
    ...new Set([...DEFAULT_CATEGORY_ORDER, ...ALL_CATEGORIES]),
  ];

  return orderedNames.map((name) => ({
    name,
    visible: visibleSet.has(name),
  }));
}

function getInitialCategoryPreferences(): CategoryPreference[] {
  if (typeof window === "undefined") {
    return getDefaultCategoryPreferences();
  }

  const defaults = getDefaultCategoryPreferences();
  const raw = localStorage.getItem(CATEGORY_SETTINGS_STORAGE_KEY);
  if (!raw) {
    return defaults;
  }

  try {
    const parsed = JSON.parse(raw) as CategoryPreference[];
    if (!Array.isArray(parsed)) {
      return defaults;
    }

    const parsedMap = new Map(
      parsed
        .filter((item) => item && typeof item.name === "string")
        .map((item) => [item.name, Boolean(item.visible)]),
    );

    return defaults
      .sort((a, b) => {
        const aIndex = parsed.findIndex((item) => item.name === a.name);
        const bIndex = parsed.findIndex((item) => item.name === b.name);
        const safeA = aIndex === -1 ? Number.MAX_SAFE_INTEGER : aIndex;
        const safeB = bIndex === -1 ? Number.MAX_SAFE_INTEGER : bIndex;
        return safeA - safeB;
      })
      .map((item) => ({
        name: item.name,
        visible: parsedMap.get(item.name) ?? item.visible,
      }));
  } catch {
    return defaults;
  }
}

const RANGE_LABELS: Record<RangeValue, Record<Locale, string>> = {
  all: {
    en: "All Time",
    "zh-Hant": "全部時間",
  },
  "1d": {
    en: "Last 1 Day",
    "zh-Hant": "最近 1 天",
  },
  "7d": {
    en: "Last 7 Days",
    "zh-Hant": "最近 7 天",
  },
  "30d": {
    en: "Last 30 Days",
    "zh-Hant": "最近 30 天",
  },
};

const COPY = {
  en: {
    title: "Who's Next to Pay?",
    subtitle: "Track turns, not money.",
    createRoom: "Create Account",
    joinRoom: "Connect Account",
    yourName: "Your Name",
    roomId: "Account ID",
    pasteRoomId: "Paste account ID here",
    wait: "Please wait...",
    chooseExistingMember: "Choose an existing account member",
    roomFullMessage:
      "This account already has two people. Continue as one of them or create a new account.",
    createNewRoomInstead: "Create a New Account Instead",
    hello: (name: string) => `Hello, ${name}`,
    logPayment: "Log Payment",
    stats: "Stats",
    whoPaid: "Who Paid?",
    whoPaidHint: "Select the payer, then tap a category.",
    me: "me",
    statsTitle: "Stats",
    statsHint: "Compare payment turns in a preset or custom range.",
    categoryBreakdown: "Category Breakdown",
    categoryBreakdownHint: "Percentage of records by category.",
    recordsUnit: "records",
    categoryFilter: "Category",
    allCategories: "All Categories",
    customDates: "Custom Range",
    customDatesHint: "Choose up to 1 year.",
    startDate: "Start Date",
    endDate: "End Date",
    customRangeShowing: (startDate: string, endDate: string) =>
      `Showing ${startDate} to ${endDate}.`,
    customRangeNeedBoth: "Please choose both start and end dates.",
    customRangeOrder: "Start date must be before end date.",
    customRangeTooLong: "Date range cannot exceed 1 year.",
    noRecordsInRange: "No records yet in this range.",
    recentRecords: "Recent Records",
    recentRecordsHint: "Remove mistakes if needed.",
    noRecords: "No records yet.",
    refresh: "Refresh",
    refreshed: "Updated",
    paidFor: (payer: string, category: string) =>
      `${payer} paid for ${category}`,
    turns: (count: number) => `${count} turns`,
    darkMode: "Dark Mode",
    themeLight: "Light",
    themeDark: "Dark",
    savedMarked: "Recorded",
    savedRecord: (category: string) => `Category: ${category}`,
    leaveRoom: "Unbind Account",
    settings: "Settings",
    language: "Language",
    categorySettings: "Categories",
    categorySettingsHint: "Drag to reorder. Toggle to show or hide.",
    showCategory: "Show",
    hideCategory: "Hide",
    moveCategoryUp: "Move up",
    moveCategoryDown: "Move down",
    resetCategories: "Reset Categories",
    noVisibleCategories: "No categories are visible. Turn at least one on.",
    availableSeats: (available: number, total: number) =>
      `Available Seats: ${available}/${total}`,
    accountIdShareHint:
      "Share your Account ID with your partner so both of you can share records with each other.",
    unbindWarning:
      "Save your Account ID before unbinding. Without Account ID, recovery is not possible.",
    unbindConfirmNow: "Click once more to unbind account immediately.",
    displayNameRequired: "Please enter your display name.",
    joinInputRequired: "Please enter both display name and account ID.",
    languageEnglish: "EN",
    languageTraditionalChinese: "繁中",
  },
  "zh-Hant": {
    title: "下一個輪到誰付？",
    subtitle: "只記錄輪流，不記金額。",
    createRoom: "建立帳號",
    joinRoom: "連接帳號",
    yourName: "你的名字",
    roomId: "帳號 ID",
    pasteRoomId: "貼上帳號 ID",
    wait: "請稍候...",
    chooseExistingMember: "選擇現有帳號成員",
    roomFullMessage:
      "這個帳號已有兩位成員，你可以選擇其中一位身份，或建立新帳號。",
    createNewRoomInstead: "改為建立新帳號",
    hello: (name: string) => `你好，${name}`,
    logPayment: "記錄付款",
    stats: "統計",
    whoPaid: "誰付款了？",
    whoPaidHint: "先選擇付款人，再點選類別。",
    me: "我",
    statsTitle: "統計",
    statsHint: "比較預設或自訂日期範圍內的付款次數。",
    categoryBreakdown: "分類分佈",
    categoryBreakdownHint: "各分類記錄百分比。",
    recordsUnit: "筆",
    categoryFilter: "分類",
    allCategories: "全部分類",
    customDates: "自訂範圍",
    customDatesHint: "最多可選一年。",
    startDate: "開始日期",
    endDate: "結束日期",
    customRangeShowing: (startDate: string, endDate: string) =>
      `顯示 ${startDate} 至 ${endDate}。`,
    customRangeNeedBoth: "請選擇開始和結束日期。",
    customRangeOrder: "開始日期必須早於結束日期。",
    customRangeTooLong: "日期範圍不可超過一年。",
    noRecordsInRange: "這個範圍內還沒有記錄。",
    recentRecords: "最近記錄",
    recentRecordsHint: "如有記錯可以刪除。",
    noRecords: "還沒有記錄。",
    refresh: "重新整理",
    refreshed: "已更新",
    paidFor: (payer: string, category: string) => `${payer} 支付了 ${category}`,
    turns: (count: number) => `${count} 次`,
    darkMode: "深色模式",
    themeLight: "淺色",
    themeDark: "深色",
    savedMarked: "已記錄",
    savedRecord: (category: string) => `分類：${category}`,
    leaveRoom: "解除帳號綁定",
    settings: "設定",
    language: "語言",
    categorySettings: "分類設定",
    categorySettingsHint: "可拖曳排序，並切換顯示或隱藏。",
    showCategory: "顯示",
    hideCategory: "隱藏",
    moveCategoryUp: "上移",
    moveCategoryDown: "下移",
    resetCategories: "重設分類",
    noVisibleCategories: "目前沒有顯示的分類，請至少開啟一項。",
    availableSeats: (available: number, total: number) =>
      `可用名額：${available}/${total}`,
    accountIdShareHint: "將帳號 ID 分享給伴侶，雙方即可互相共享記錄。",
    unbindWarning: "建議先保存帳號 ID。沒有帳號 ID 將無法找回。",
    unbindConfirmNow: "再按一次即可立即解除帳號綁定。",
    displayNameRequired: "請輸入你的名稱。",
    joinInputRequired: "請輸入名稱和帳號 ID。",
    languageEnglish: "EN",
    languageTraditionalChinese: "繁中",
  },
} as const;

const CATEGORY_CONFIG: Record<
  string,
  { emoji: string; className: string; labelZh: string }
> = {
  Meal: {
    emoji: "🍽️",
    labelZh: "餐飲",
    className:
      "border border-cyan-200 bg-cyan-50 text-cyan-900 hover:bg-cyan-100",
  },
  Groceries: {
    emoji: "🛒",
    labelZh: "日用品",
    className:
      "border border-emerald-200 bg-emerald-50 text-emerald-900 hover:bg-emerald-100",
  },
  Snacks: {
    emoji: "🍿",
    labelZh: "零食",
    className:
      "border border-lime-200 bg-lime-50 text-lime-900 hover:bg-lime-100",
  },
  Transport: {
    emoji: "🚗",
    labelZh: "交通",
    className:
      "border border-blue-200 bg-blue-50 text-blue-900 hover:bg-blue-100",
  },
  Entertainment: {
    emoji: "🎬",
    labelZh: "娛樂",
    className:
      "border border-indigo-200 bg-indigo-50 text-indigo-900 hover:bg-indigo-100",
  },
  Baby: {
    emoji: "🍼",
    labelZh: "嬰兒",
    className:
      "border border-pink-200 bg-pink-50 text-pink-900 hover:bg-pink-100",
  },
  Parking: {
    emoji: "🅿️",
    labelZh: "停車",
    className:
      "border border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-100",
  },
};

function formatDate(input: string, locale: Locale): string {
  return new Date(input).toLocaleString(
    locale === "zh-Hant" ? "zh-HK" : "en-HK",
    {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    },
  );
}

function getCategoryLabel(category: string, locale: Locale): string {
  const config = CATEGORY_CONFIG[category];
  if (!config) {
    return category;
  }

  return locale === "zh-Hant" ? config.labelZh : category;
}

function getInitialSession(): Session | null {
  if (typeof window === "undefined") {
    return null;
  }

  const value = localStorage.getItem(SESSION_STORAGE_KEY);
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as Session;
    if (!parsed.roomId || !parsed.userName) return null;
    if (!Array.isArray(parsed.members) || parsed.members.length === 0) {
      parsed.members = [parsed.userName];
    }
    return parsed;
  } catch {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    return null;
  }
}

function getInitialLocale(): Locale {
  if (typeof window === "undefined") {
    return "en";
  }

  const value = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  return value === "zh-Hant" ? "zh-Hant" : "en";
}

function getInitialTheme(): ThemeMode {
  if (typeof window === "undefined") {
    return "light";
  }

  const value = localStorage.getItem(THEME_STORAGE_KEY);
  return value === "dark" ? "dark" : "light";
}

function toDateInputValue(date: Date): string {
  const offset = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

function getDateDaysDifference(startDate: string, endDate: string): number {
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  return (end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000);
}

function LanguageToggle({
  locale,
  onChange,
}: {
  locale: Locale;
  onChange: (nextLocale: Locale) => void;
}) {
  const options: Locale[] = ["en", "zh-Hant"];

  return (
    <div className="inline-flex rounded-full bg-white/80 p-1 shadow-sm ring-1 ring-slate-200">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
            locale === option
              ? "bg-sky-600 text-white"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          {option === "en" ? "EN" : "繁中"}
        </button>
      ))}
    </div>
  );
}

export default function Home() {
  const today = useMemo(() => toDateInputValue(new Date()), []);
  const [hydrated, setHydrated] = useState(false);
  const [storedSession, setStoredSession] = useState<Session | null>(null);
  const [storedLocale, setStoredLocale] = useState<Locale>("en");
  const [themeMode, setThemeMode] = useState<ThemeMode>("light");

  const [sessionOverride, setSessionOverride] = useState<
    Session | null | undefined
  >(undefined);
  const [localeOverride, setLocaleOverride] = useState<Locale | undefined>(
    undefined,
  );
  const [landingMode, setLandingMode] = useState<LandingMode>("create");
  const [screen, setScreen] = useState<ScreenMode>("action");
  const [userNameInput, setUserNameInput] = useState("");
  const [roomIdInput, setRoomIdInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [range, setRange] = useState<RangeValue>("7d");
  const [statsCategoryFilter, setStatsCategoryFilter] = useState<string | null>(
    null,
  );
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [categoryFilterOpen, setCategoryFilterOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [unbindArmed, setUnbindArmed] = useState(false);
  const [draggingCategory, setDraggingCategory] = useState<string | null>(null);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [recordLocked, setRecordLocked] = useState(false);
  const [savedCategory, setSavedCategory] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshed, setRefreshed] = useState(false);
  const [pullY, setPullY] = useState(0);
  const pullStartYRef = useRef(0);
  const pullingRef = useRef(false);
  const [categoryPreferences, setCategoryPreferences] = useState<
    CategoryPreference[]
  >(getDefaultCategoryPreferences());
  const [selectedPayer, setSelectedPayer] = useState<string | null>(null);
  const [fullRoomState, setFullRoomState] = useState<FullRoomState>(null);
  const recordInFlightRef = useRef(false);
  const saveNoticeTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setStoredSession(getInitialSession());
      setStoredLocale(getInitialLocale());
      setThemeMode(getInitialTheme());
      setCategoryPreferences(getInitialCategoryPreferences());
      setHydrated(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }
    localStorage.setItem(
      CATEGORY_SETTINGS_STORAGE_KEY,
      JSON.stringify(categoryPreferences),
    );
  }, [categoryPreferences, hydrated]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    localStorage.setItem(THEME_STORAGE_KEY, themeMode);
    document.documentElement.setAttribute("data-theme", themeMode);

    const nextThemeColor = themeMode === "dark" ? "#0f172a" : "#0ea5e9";
    let themeColorMeta = document.querySelector<HTMLMetaElement>(
      'meta[name="theme-color"]',
    );
    if (!themeColorMeta) {
      themeColorMeta = document.createElement("meta");
      themeColorMeta.name = "theme-color";
      document.head.appendChild(themeColorMeta);
    }
    themeColorMeta.content = nextThemeColor;
  }, [hydrated, themeMode]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const mediaQuery = window.matchMedia("(pointer: coarse)");
    const updateTouchMode = () => {
      setIsTouchDevice(mediaQuery.matches || "ontouchstart" in window);
    };

    updateTouchMode();
    mediaQuery.addEventListener("change", updateTouchMode);
    return () => mediaQuery.removeEventListener("change", updateTouchMode);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const shouldLockBackgroundScroll = settingsOpen || datePickerOpen;
    if (!shouldLockBackgroundScroll) {
      return;
    }

    const scrollY = window.scrollY;
    const originalBodyOverflow = document.body.style.overflow;
    const originalBodyPosition = document.body.style.position;
    const originalBodyTop = document.body.style.top;
    const originalBodyLeft = document.body.style.left;
    const originalBodyRight = document.body.style.right;
    const originalBodyWidth = document.body.style.width;
    const originalHtmlOverflow = document.documentElement.style.overflow;

    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.width = "100%";

    return () => {
      document.documentElement.style.overflow = originalHtmlOverflow;
      document.body.style.overflow = originalBodyOverflow;
      document.body.style.position = originalBodyPosition;
      document.body.style.top = originalBodyTop;
      document.body.style.left = originalBodyLeft;
      document.body.style.right = originalBodyRight;
      document.body.style.width = originalBodyWidth;
      window.scrollTo(0, scrollY);
    };
  }, [datePickerOpen, settingsOpen]);

  useEffect(() => {
    return () => {
      if (saveNoticeTimerRef.current) {
        window.clearTimeout(saveNoticeTimerRef.current);
      }
    };
  }, []);

  const locale = localeOverride ?? storedLocale;
  const copy = COPY[locale];

  const session =
    sessionOverride === undefined ? storedSession : sessionOverride;

  const customRangeError = useMemo(() => {
    if (!customStartDate && !customEndDate) {
      return null;
    }

    if (!customStartDate || !customEndDate) {
      return copy.customRangeNeedBoth;
    }

    if (customStartDate > customEndDate) {
      return copy.customRangeOrder;
    }

    if (
      getDateDaysDifference(customStartDate, customEndDate) >
      MAX_CUSTOM_RANGE_DAYS
    ) {
      return copy.customRangeTooLong;
    }

    return null;
  }, [
    copy.customRangeNeedBoth,
    copy.customRangeOrder,
    copy.customRangeTooLong,
    customEndDate,
    customStartDate,
  ]);

  const hasCustomRange =
    Boolean(customStartDate) && Boolean(customEndDate) && !customRangeError;
  const customRangeButtonLabel = hasCustomRange
    ? `${customStartDate} -> ${customEndDate}`
    : copy.customDates;
  const statsCategoryButtonLabel = statsCategoryFilter
    ? getCategoryLabel(statsCategoryFilter, locale)
    : copy.allCategories;

  useEffect(() => {
    if (!session?.roomId) {
      return;
    }

    if (customStartDate || customEndDate) {
      if (customRangeError || !hasCustomRange) {
        return;
      }
    }

    let cancelled = false;

    const run = async () => {
      try {
        const recordsQuery = new URLSearchParams({
          roomId: session.roomId,
          range,
        });

        if (hasCustomRange) {
          recordsQuery.set("startDate", customStartDate);
          recordsQuery.set("endDate", customEndDate);
        }

        const [recordsRes, membersRes] = await Promise.all([
          fetch(`/api/records?${recordsQuery.toString()}`, {
            cache: "no-store",
          }),
          fetch(`/api/rooms?roomId=${encodeURIComponent(session.roomId)}`, {
            cache: "no-store",
          }),
        ]);

        if (!recordsRes.ok) {
          const body = (await recordsRes.json()) as { error?: string };
          throw new Error(body.error ?? "Could not load records.");
        }

        const recordsBody = (await recordsRes.json()) as {
          records: RecordItem[];
        };

        if (membersRes.ok) {
          const membersBody = (await membersRes.json()) as {
            members: string[];
          };

          if (!cancelled && membersBody.members.length > 0) {
            const currentMembers = session.members ?? [];
            const newMembers = membersBody.members;
            const membersChanged =
              newMembers.length !== currentMembers.length ||
              newMembers.some((m, i) => m !== currentMembers[i]);
            if (membersChanged) {
              const updatedSession = { ...session, members: newMembers };
              localStorage.setItem(
                SESSION_STORAGE_KEY,
                JSON.stringify(updatedSession),
              );
              setSessionOverride(updatedSession);
            }
          }
        }

        if (!cancelled) {
          setRecords(recordsBody.records);
          setRefreshing(false);
          setRefreshed(true);
          setErrorMessage((current) =>
            current === customRangeError ? null : current,
          );
        }
      } catch (error) {
        if (!cancelled) {
          setRefreshing(false);
          setErrorMessage(
            error instanceof Error ? error.message : "Failed to load records.",
          );
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [
    customEndDate,
    customRangeError,
    customStartDate,
    hasCustomRange,
    range,
    refreshKey,
    session,
  ]);

  const filteredStatsRecords = useMemo(() => {
    if (!statsCategoryFilter) {
      return records;
    }

    return records.filter((record) => record.category === statsCategoryFilter);
  }, [records, statsCategoryFilter]);

  const tally = useMemo(() => {
    const map = new Map<string, number>();

    for (const record of filteredStatsRecords) {
      map.set(record.paidBy, (map.get(record.paidBy) ?? 0) + 1);
    }

    return [...map.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [filteredStatsRecords]);

  const categoryBreakdown = useMemo(() => {
    const total = filteredStatsRecords.length;
    const map = new Map<string, number>();

    for (const record of filteredStatsRecords) {
      map.set(record.category, (map.get(record.category) ?? 0) + 1);
    }

    const items = [...map.entries()]
      .map(([category, count]) => ({
        category,
        count,
        percentage: total === 0 ? 0 : Math.round((count / total) * 100),
        color: CATEGORY_PIE_COLORS[category] ?? "#94a3b8",
      }))
      .sort((a, b) => b.count - a.count);

    return {
      total,
      items,
    };
  }, [filteredStatsRecords]);

  const categoryPieAnimationKey = useMemo(
    () =>
      [
        screen,
        range,
        hasCustomRange ? `${customStartDate}-${customEndDate}` : "preset",
        statsCategoryFilter ?? "all-categories",
        ...categoryBreakdown.items.map(
          (item) => `${item.category}:${item.count}`,
        ),
      ].join("|"),
    [
      categoryBreakdown.items,
      customEndDate,
      customStartDate,
      hasCustomRange,
      range,
      screen,
      statsCategoryFilter,
    ],
  );

  const loadRecords = async () => {
    if (!session?.roomId) {
      return;
    }

    try {
      const query = new URLSearchParams({
        roomId: session.roomId,
        range,
      });

      if (hasCustomRange) {
        query.set("startDate", customStartDate);
        query.set("endDate", customEndDate);
      }

      const response = await fetch(`/api/records?${query.toString()}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        throw new Error(body.error ?? "Could not load records.");
      }

      const body = (await response.json()) as { records: RecordItem[] };
      setRecords(body.records);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to load records.",
      );
    }
  };

  const updateLocale = (nextLocale: Locale) => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLocale);
    setLocaleOverride(nextLocale);
  };

  const createRoom = async () => {
    const userName = userNameInput.trim();

    if (!userName) {
      setErrorMessage(copy.displayNameRequired);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "create", userName }),
      });

      const body = (await response.json()) as {
        roomId?: string;
        members?: string[];
        error?: string;
      };

      if (!response.ok || !body.roomId) {
        throw new Error(body.error ?? "Unable to create account.");
      }

      const nextSession = {
        roomId: body.roomId,
        userName,
        members: body.members ?? [userName],
      };

      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(nextSession));
      setSessionOverride(nextSession);
      setSelectedPayer(userName);
      setFullRoomState(null);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to create account.",
      );
    } finally {
      setLoading(false);
    }
  };

  const joinRoom = async (nameOverride?: string) => {
    const userName = (nameOverride ?? userNameInput).trim();
    const roomId = roomIdInput.trim();

    if (!userName || !roomId) {
      setErrorMessage(copy.joinInputRequired);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "join", roomId, userName }),
      });

      const body = (await response.json()) as {
        roomId?: string;
        members?: string[];
        code?: string;
        error?: string;
      };

      if (response.status === 409 && body.code === "ROOM_FULL") {
        setFullRoomState({
          roomId,
          members: body.members ?? [],
        });
        setErrorMessage(copy.roomFullMessage);
        return;
      }

      if (!response.ok || !body.roomId) {
        throw new Error(body.error ?? "Unable to connect account.");
      }

      const nextSession = {
        roomId: body.roomId,
        userName,
        members: body.members ?? [userName],
      };

      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(nextSession));
      setSessionOverride(nextSession);
      setSelectedPayer(userName);
      setUserNameInput(userName);
      setFullRoomState(null);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to connect account.",
      );
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    setSessionOverride(null);
    setRecords([]);
    setRoomIdInput("");
    setUserNameInput("");
    setSelectedPayer(null);
    setFullRoomState(null);
    setCustomStartDate("");
    setCustomEndDate("");
    setSettingsOpen(false);
    setUnbindArmed(false);
  };

  const handleUnbindAccount = () => {
    if (!unbindArmed) {
      setUnbindArmed(true);
      return;
    }
    logout();
  };

  const copyRoomId = () => {
    if (!session?.roomId) return;
    navigator.clipboard.writeText(session.roomId).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const activeSelectedPayer = selectedPayer ?? session?.userName ?? null;

  const PTR_THRESHOLD = 72; // px to pull before triggering refresh

  const triggerRefresh = () => {
    if (refreshing) return;
    setRefreshed(false);
    setRefreshing(true);
    setRefreshKey((k) => k + 1);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY > 0) return;
    pullStartYRef.current = e.touches[0].clientY;
    pullingRef.current = true;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!pullingRef.current) return;
    const dy = e.touches[0].clientY - pullStartYRef.current;
    if (dy <= 0) {
      setPullY(0);
      return;
    }
    // Dampen the pull with sqrt for natural resistance
    setPullY(Math.min(PTR_THRESHOLD * 1.5, Math.sqrt(dy) * 8));
  };

  const handleTouchEnd = () => {
    if (!pullingRef.current) return;
    pullingRef.current = false;
    if (pullY >= PTR_THRESHOLD) {
      triggerRefresh();
    }
    setPullY(0);
  };

  const addRecord = async (category: string) => {
    if (!session || recordInFlightRef.current || recordLocked) {
      return;
    }

    recordInFlightRef.current = true;
    // Show loading overlay immediately — no pre-timer
    setRecordLocked(true);

    const payer = activeSelectedPayer ?? session.userName;
    let saved = false;

    setLoading(true);
    try {
      const response = await fetch("/api/records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId: session.roomId,
          paidBy: payer,
          category,
        }),
      });

      const body = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(body.error ?? "Could not save record.");
      }

      await loadRecords();
      saved = true;
      setErrorMessage(null);
      // Switch overlay to tick phase; lock held until animation completes
      setSavedCategory(category);
      if (saveNoticeTimerRef.current) {
        window.clearTimeout(saveNoticeTimerRef.current);
      }
      saveNoticeTimerRef.current = window.setTimeout(() => {
        setSavedCategory(null);
        setRecordLocked(false);
        saveNoticeTimerRef.current = null;
      }, SAVE_NOTICE_DURATION_MS);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to create record.",
      );
    } finally {
      if (!saved) {
        // Error path: release lock immediately
        setRecordLocked(false);
      }
      recordInFlightRef.current = false;
      setLoading(false);
    }
  };

  const deleteRecord = async (id: string) => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/records?id=${encodeURIComponent(id)}`,
        {
          method: "DELETE",
        },
      );

      const body = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(body.error ?? "Could not delete record.");
      }

      await loadRecords();
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to delete record.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePresetRangeSelect = (nextRange: RangeValue) => {
    setRange(nextRange);
    setCustomStartDate("");
    setCustomEndDate("");
    setErrorMessage(null);
  };

  const members = session?.members?.length
    ? session.members
    : session
      ? [session.userName]
      : [];
  const whoPaidMembers =
    session && members.includes(session.userName)
      ? [
          session.userName,
          ...members.filter((member) => member !== session.userName),
        ]
      : members;
  const visibleCategories = categoryPreferences
    .filter((item) => item.visible)
    .map((item) => item.name);
  const availableSeats = Math.max(0, MAX_ACCOUNT_MEMBERS - members.length);
  const isAccountFull = availableSeats === 0;

  const handleCategoryVisibilityToggle = (name: string) => {
    setCategoryPreferences((current) =>
      current.map((item) =>
        item.name === name ? { ...item, visible: !item.visible } : item,
      ),
    );
  };

  const handleCategoryDrop = (targetName: string) => {
    if (!draggingCategory || draggingCategory === targetName) {
      return;
    }

    setCategoryPreferences((current) => {
      const fromIndex = current.findIndex(
        (item) => item.name === draggingCategory,
      );
      const toIndex = current.findIndex((item) => item.name === targetName);
      if (fromIndex === -1 || toIndex === -1) {
        return current;
      }

      const next = [...current];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });

    setDraggingCategory(null);
  };

  const moveCategory = (name: string, direction: -1 | 1) => {
    setCategoryPreferences((current) => {
      const index = current.findIndex((item) => item.name === name);
      const targetIndex = index + direction;
      if (index === -1 || targetIndex < 0 || targetIndex >= current.length) {
        return current;
      }

      const next = [...current];
      const [moved] = next.splice(index, 1);
      next.splice(targetIndex, 0, moved);
      return next;
    });
  };

  const resetCategoryPreferences = () => {
    setDraggingCategory(null);
    setCategoryPreferences(getDefaultCategoryPreferences());
  };

  if (!hydrated) {
    return null;
  }

  if (!session) {
    return (
      <main
        className={`app-shell mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-6 p-5 ${
          themeMode === "dark" ? "theme-dark" : ""
        }`}
      >
        <div className="flex justify-end">
          <LanguageToggle locale={locale} onChange={updateLocale} />
        </div>

        <div className="text-center">
          <h1 className="bg-gradient-to-r from-sky-700 via-cyan-600 to-emerald-600 bg-clip-text text-3xl font-bold text-transparent">
            {copy.title}
          </h1>
          <p className="mt-2 text-sm text-slate-500">{copy.subtitle}</p>
        </div>

        <Card className="border-0 bg-white/85 shadow-lg backdrop-blur">
          <CardContent className="space-y-4 pt-6">
            <div className="grid grid-cols-2 rounded-2xl bg-slate-100 p-1">
              <Button
                variant={landingMode === "create" ? "default" : "ghost"}
                onClick={() => {
                  setLandingMode("create");
                  setFullRoomState(null);
                  setErrorMessage(null);
                }}
              >
                {copy.createRoom}
              </Button>
              <Button
                variant={landingMode === "join" ? "default" : "ghost"}
                onClick={() => {
                  setLandingMode("join");
                  setErrorMessage(null);
                }}
              >
                {copy.joinRoom}
              </Button>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                {copy.yourName}
              </label>
              <Input
                placeholder="Alex"
                value={userNameInput}
                onChange={(event) => {
                  setUserNameInput(event.target.value);
                  setFullRoomState(null);
                }}
              />
            </div>

            {landingMode === "join" ? (
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  {copy.roomId}
                </label>
                <Input
                  placeholder={copy.pasteRoomId}
                  value={roomIdInput}
                  onChange={(event) => {
                    setRoomIdInput(event.target.value.trim());
                    setFullRoomState(null);
                  }}
                />
              </div>
            ) : null}

            <Button
              className="w-full"
              size="lg"
              onClick={
                landingMode === "create" ? createRoom : () => void joinRoom()
              }
              disabled={loading}
            >
              {loading
                ? copy.wait
                : landingMode === "create"
                  ? copy.createRoom
                  : copy.joinRoom}
            </Button>

            {fullRoomState ? (
              <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-medium text-slate-700">
                  {copy.chooseExistingMember}
                </p>
                <div className="flex flex-wrap gap-2">
                  {fullRoomState.members.map((member) => (
                    <Button
                      key={member}
                      variant="outline"
                      onClick={() => void joinRoom(member)}
                      disabled={loading}
                    >
                      {member}
                    </Button>
                  ))}
                </div>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setLandingMode("create");
                    setRoomIdInput("");
                    setFullRoomState(null);
                    setErrorMessage(null);
                  }}
                >
                  {copy.createNewRoomInstead}
                </Button>
              </div>
            ) : null}

            {errorMessage ? (
              <p className="rounded-xl bg-slate-100 px-3 py-2 text-sm text-slate-700">
                {errorMessage}
              </p>
            ) : null}
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main
      className={`app-shell mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-4 p-4 pb-8 sm:p-6 ${
        themeMode === "dark" ? "theme-dark" : ""
      }`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull-to-refresh indicator */}
      {pullY > 0 && (
        <div
          className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center"
          style={{
            transform: `translateY(${pullY - 44}px)`,
            transition: "none",
          }}
        >
          <div
            className={`flex h-11 w-11 items-center justify-center rounded-full shadow-md ${themeMode === "dark" ? "bg-slate-800" : "bg-white"}`}
          >
            <RefreshCw
              className={`h-5 w-5 transition-transform ${themeMode === "dark" ? "text-sky-400" : "text-sky-500"}`}
              style={{
                transform: `rotate(${(pullY / PTR_THRESHOLD) * 360}deg)`,
              }}
            />
          </div>
        </div>
      )}
      {/* Refreshing spinner */}
      {refreshing && (
        <div className="pointer-events-none fixed inset-x-0 top-3 z-50 flex justify-center">
          <div
            className={`flex h-11 w-11 items-center justify-center rounded-full shadow-md ${themeMode === "dark" ? "bg-slate-800" : "bg-white"}`}
          >
            <RefreshCw
              className={`h-5 w-5 animate-spin ${themeMode === "dark" ? "text-sky-400" : "text-sky-500"}`}
            />
          </div>
        </div>
      )}
      {/* Refreshed toast */}
      {refreshed && !refreshing && (
        <div
          className="pointer-events-none fixed inset-x-0 top-3 z-50 flex justify-center"
          onAnimationEnd={() => setRefreshed(false)}
        >
          <div
            className={`flex items-center gap-2 rounded-full px-4 py-2 shadow-md text-sm font-semibold ${themeMode === "dark" ? "bg-slate-800 text-emerald-400" : "bg-white text-emerald-600"}`}
            style={{ animation: "ptr-toast 1.8s ease forwards" }}
          >
            <Check className="h-4 w-4" />
            {copy.refreshed}
          </div>
        </div>
      )}
      <Card className="overflow-hidden border-0 shadow-md">
        <CardHeader className="space-y-3 bg-gradient-to-r from-sky-100 via-cyan-50 to-emerald-100 pb-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="text-2xl text-slate-800">
              {copy.hello(session.userName)}
            </CardTitle>
            <button
              type="button"
              onClick={() => {
                setUnbindArmed(false);
                setSettingsOpen(true);
              }}
              className="inline-flex items-center rounded-xl bg-white/80 p-2 text-slate-700 transition-colors hover:bg-white"
              aria-label={copy.settings}
            >
              <Settings className="h-4 w-4" />
            </button>
          </div>
          <div
            className={`grid grid-cols-2 gap-2 rounded-2xl p-1 ${
              themeMode === "dark" ? "bg-slate-800/90" : "bg-white/70"
            }`}
          >
            <Button
              variant={screen === "action" ? "default" : "ghost"}
              onClick={() => setScreen("action")}
              className={
                themeMode === "dark"
                  ? screen === "action"
                    ? "bg-sky-500 text-white hover:bg-sky-500"
                    : "bg-slate-700 text-slate-100 hover:bg-slate-600"
                  : ""
              }
            >
              {copy.logPayment}
            </Button>
            <Button
              variant={screen === "stats" ? "default" : "ghost"}
              onClick={() => setScreen("stats")}
              className={
                themeMode === "dark"
                  ? screen === "stats"
                    ? "bg-sky-500 text-white hover:bg-sky-500"
                    : "bg-slate-700 text-slate-100 hover:bg-slate-600"
                  : ""
              }
            >
              {copy.stats}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {screen === "action" ? (
        <Card>
          <CardHeader>
            <CardTitle>{copy.whoPaid}</CardTitle>
            <CardDescription>{copy.whoPaidHint}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex flex-wrap gap-2">
              {whoPaidMembers.map((member) => (
                <button
                  key={member}
                  onClick={() => setSelectedPayer(member)}
                  className={`rounded-2xl px-4 py-2 text-sm font-semibold transition-all active:scale-95 ${
                    activeSelectedPayer === member
                      ? "bg-sky-600 text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {member === session.userName
                    ? `${member} (${copy.me})`
                    : member}
                </button>
              ))}
            </div>

            {visibleCategories.length === 0 ? (
              <p className="rounded-xl bg-slate-100 px-3 py-2 text-sm text-slate-600">
                {copy.noVisibleCategories}
              </p>
            ) : null}

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {visibleCategories.map((category) => {
                const config = CATEGORY_CONFIG[category] ?? {
                  emoji: "💳",
                  labelZh: category,
                  className:
                    "border border-slate-200 bg-slate-100 text-slate-900 hover:bg-slate-200",
                };

                return (
                  <button
                    key={category}
                    disabled={loading || recordLocked}
                    onClick={() => addRecord(category)}
                    className={`flex h-20 flex-col items-center justify-center gap-1 rounded-2xl text-sm font-semibold transition-all active:scale-95 disabled:opacity-50 ${
                      themeMode === "dark"
                        ? "border border-slate-600 bg-slate-800 text-slate-100 hover:bg-slate-700"
                        : config.className
                    }`}
                  >
                    <span className="text-xl">{config.emoji}</span>
                    <span>{getCategoryLabel(category, locale)}</span>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{copy.statsTitle}</CardTitle>
            <CardDescription>{copy.statsHint}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <div className="shrink-0">
                <button
                  type="button"
                  onClick={() => setCategoryFilterOpen(true)}
                  className={`inline-flex h-9 items-center rounded-lg border px-3 text-sm transition-colors ${
                    statsCategoryFilter
                      ? "border-emerald-400 bg-emerald-50 font-medium text-emerald-800"
                      : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  <span className="max-w-[180px] truncate">
                    {statsCategoryButtonLabel}
                  </span>
                </button>
              </div>
              {RANGE_OPTIONS.map((option) => (
                <Button
                  key={option.value}
                  size="sm"
                  className="shrink-0"
                  variant={
                    range === option.value && !hasCustomRange
                      ? "default"
                      : "outline"
                  }
                  onClick={() => handlePresetRangeSelect(option.value)}
                >
                  {RANGE_LABELS[option.value][locale]}
                </Button>
              ))}
              <div className="shrink-0">
                <button
                  type="button"
                  onClick={() => setDatePickerOpen(true)}
                  className={`inline-flex h-9 items-center rounded-lg border px-3 text-sm transition-colors ${
                    hasCustomRange
                      ? "border-sky-400 bg-sky-50 font-medium text-sky-800"
                      : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  <span className="max-w-[180px] truncate">
                    {customRangeButtonLabel}
                  </span>
                </button>
              </div>
            </div>

            {tally.length === 0 ? (
              <p className="py-4 text-center text-sm text-slate-500">
                {copy.noRecordsInRange}
              </p>
            ) : (
              <div className="space-y-4">
                <div className="space-y-3">
                  {tally.map((item, index) => {
                    const medals = ["🥇", "🥈", "🥉"];
                    const medal = medals[index] ?? "🏅";
                    const max = tally[0].count;
                    const pct = Math.round((item.count / max) * 100);

                    return (
                      <div key={item.name} className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-800">
                            {medal} {item.name}
                          </span>
                          <Badge variant="secondary">
                            {copy.turns(item.count)}
                          </Badge>
                        </div>
                        <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                          <div
                            key={`${screen}-${range}-${customStartDate}-${customEndDate}-${item.name}-${item.count}`}
                            className="animate-stats-bar h-full origin-left rounded-full bg-gradient-to-r from-sky-500 to-emerald-400"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-3">
                  <div className="mb-2">
                    <p className="text-sm font-semibold text-slate-700">
                      {copy.categoryBreakdown}
                    </p>
                    <p className="text-xs text-slate-500">
                      {copy.categoryBreakdownHint}
                    </p>
                  </div>

                  <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
                    <div
                      className="relative h-44 w-44 shrink-0"
                      aria-label={copy.categoryBreakdown}
                    >
                      <PieChart
                        key={categoryPieAnimationKey}
                        width={176}
                        height={176}
                      >
                        <Pie
                          data={categoryBreakdown.items}
                          dataKey="count"
                          nameKey="category"
                          cx={88}
                          cy={88}
                          innerRadius={50}
                          outerRadius={72}
                          stroke="none"
                          isAnimationActive
                          animationBegin={80}
                          animationDuration={1200}
                          animationEasing="ease-out"
                        >
                          {categoryBreakdown.items.map((item) => (
                            <Cell key={item.category} fill={item.color} />
                          ))}
                        </Pie>
                      </PieChart>

                      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                        <div
                          className={`flex h-24 w-24 flex-col items-center justify-center rounded-full ${
                            themeMode === "dark" ? "bg-slate-900" : "bg-white"
                          }`}
                        >
                          <span className="text-lg font-bold text-slate-800">
                            {categoryBreakdown.total}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            {copy.recordsUnit}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="w-full space-y-2">
                      {categoryBreakdown.items.map((item) => {
                        return (
                          <div
                            key={item.category}
                            className="flex items-center justify-between rounded-lg bg-slate-50 px-2.5 py-2"
                          >
                            <div className="flex items-center gap-2 text-sm text-slate-700">
                              <span
                                className="h-2.5 w-2.5 rounded-full"
                                style={{ backgroundColor: item.color }}
                              />
                              <span>
                                {CATEGORY_CONFIG[item.category]?.emoji ?? "💳"}
                              </span>
                              <span>
                                {getCategoryLabel(item.category, locale)}
                              </span>
                            </div>
                            <span className="text-sm font-semibold text-slate-700">
                              {item.percentage}%
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{copy.recentRecords}</CardTitle>
          <CardDescription>{copy.recentRecordsHint}</CardDescription>
        </CardHeader>
        <CardContent>
          {records.length === 0 ? (
            <p className="py-4 text-center text-sm text-slate-500">
              {copy.noRecords}
            </p>
          ) : (
            <div className="space-y-2">
              {records.map((record) => {
                const config = CATEGORY_CONFIG[record.category] ?? {
                  emoji: "💳",
                  labelZh: record.category,
                  className: "",
                };

                return (
                  <div
                    key={record.id}
                    className="flex items-center justify-between gap-2 rounded-2xl border border-slate-100 bg-white px-3 py-2.5"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{config.emoji}</span>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">
                          {copy.paidFor(
                            record.paidBy,
                            getCategoryLabel(record.category, locale),
                          )}
                        </p>
                        <p className="text-xs text-slate-400">
                          {formatDate(record.createdAt, locale)}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteRecord(record.id)}
                      aria-label="Delete record"
                      className="shrink-0 text-slate-300 hover:bg-slate-100 hover:text-slate-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {errorMessage ? (
        <p className="rounded-xl bg-slate-100 px-3 py-2 text-sm text-slate-700">
          {errorMessage}
        </p>
      ) : null}

      {recordLocked ? (
        <div
          className={`fixed inset-0 z-[70] flex items-center justify-center p-4 ${
            themeMode === "dark" ? "bg-slate-950/55" : "bg-slate-900/25"
          }`}
        >
          <div
            className={`w-full max-w-xs rounded-3xl px-6 py-7 text-center shadow-2xl backdrop-blur-sm ${
              themeMode === "dark"
                ? "border border-emerald-500/40 bg-slate-900/95"
                : "border border-emerald-200 bg-white/95"
            }`}
          >
            {savedCategory ? (
              <>
                <div className="relative mx-auto mb-3 flex h-16 w-16 items-center justify-center">
                  <span
                    className={`absolute h-16 w-16 rounded-full animate-ping ${
                      themeMode === "dark"
                        ? "bg-emerald-400/45"
                        : "bg-emerald-300/70"
                    }`}
                  />
                  <span className="animate-tick-pop relative inline-flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg">
                    <Check className="h-7 w-7 text-white" />
                  </span>
                </div>
                <p
                  className={`text-base font-bold ${
                    themeMode === "dark"
                      ? "text-emerald-200"
                      : "text-emerald-800"
                  }`}
                >
                  {copy.savedMarked}
                </p>
                <p
                  className={`mt-1 text-sm ${
                    themeMode === "dark"
                      ? "text-emerald-100"
                      : "text-emerald-700"
                  }`}
                >
                  {copy.savedRecord(getCategoryLabel(savedCategory, locale))}
                </p>
              </>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <span
                  className={`inline-block h-12 w-12 animate-spin rounded-full border-4 border-current border-t-transparent ${
                    themeMode === "dark"
                      ? "text-emerald-400"
                      : "text-emerald-500"
                  }`}
                />
                <p
                  className={`text-sm font-semibold ${
                    themeMode === "dark" ? "text-slate-300" : "text-slate-600"
                  }`}
                >
                  {locale === "zh-Hant" ? "儲存中…" : "Saving…"}
                </p>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {categoryFilterOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/35 p-4 sm:items-center"
          onClick={() => setCategoryFilterOpen(false)}
        >
          <div
            className="my-6 w-full max-w-sm max-h-[calc(100vh-3rem)] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-700">
                {copy.categoryFilter}
              </p>
              <button
                type="button"
                className="rounded-md px-2 py-1 text-slate-500 hover:bg-slate-100"
                onClick={() => setCategoryFilterOpen(false)}
                aria-label={copy.categoryFilter}
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  setStatsCategoryFilter(null);
                  setCategoryFilterOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-sm ${
                  statsCategoryFilter === null
                    ? "border-sky-400 bg-sky-50 text-sky-800"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                <span>{copy.allCategories}</span>
                {statsCategoryFilter === null ? (
                  <Check className="h-4 w-4" />
                ) : null}
              </button>

              {visibleCategories.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => {
                    setStatsCategoryFilter(category);
                    setCategoryFilterOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-sm ${
                    statsCategoryFilter === category
                      ? "border-sky-400 bg-sky-50 text-sky-800"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span>{CATEGORY_CONFIG[category]?.emoji ?? "💳"}</span>
                    <span>{getCategoryLabel(category, locale)}</span>
                  </span>
                  {statsCategoryFilter === category ? (
                    <Check className="h-4 w-4" />
                  ) : null}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {datePickerOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/35 p-4 sm:items-center"
          onClick={() => setDatePickerOpen(false)}
        >
          <div
            className="my-6 w-full max-w-sm max-h-[calc(100vh-3rem)] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-700">
                {copy.customDates}
              </p>
              <button
                type="button"
                className="rounded-md px-2 py-1 text-slate-500 hover:bg-slate-100"
                onClick={() => setDatePickerOpen(false)}
                aria-label={copy.customDates}
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500">{copy.customDatesHint}</p>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600">
                  {copy.startDate}
                </label>
                <Input
                  type="date"
                  value={customStartDate}
                  max={customEndDate || today}
                  onChange={(event) => {
                    setCustomStartDate(event.target.value);
                    setErrorMessage(null);
                  }}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600">
                  {copy.endDate}
                </label>
                <Input
                  type="date"
                  value={customEndDate}
                  min={customStartDate || undefined}
                  max={today}
                  onChange={(event) => {
                    setCustomEndDate(event.target.value);
                    setErrorMessage(null);
                  }}
                />
              </div>
            </div>

            {(customStartDate || customEndDate) && (
              <button
                type="button"
                onClick={() => {
                  setCustomStartDate("");
                  setCustomEndDate("");
                  setErrorMessage(null);
                }}
                className="mt-3 text-xs text-slate-400 hover:text-slate-600"
              >
                {locale === "zh-Hant" ? "清除日期" : "Clear dates"}
              </button>
            )}

            {customRangeError ? (
              <p className="mt-3 text-sm text-slate-600">{customRangeError}</p>
            ) : hasCustomRange ? (
              <p className="mt-3 text-sm text-sky-700">
                {copy.customRangeShowing(customStartDate, customEndDate)}
              </p>
            ) : null}

            {hasCustomRange && (
              <button
                type="button"
                onClick={() => setDatePickerOpen(false)}
                className="mt-3 w-full rounded-lg bg-sky-600 py-1.5 text-sm font-semibold text-white hover:bg-sky-700"
              >
                {locale === "zh-Hant" ? "套用" : "Apply"}
              </button>
            )}
          </div>
        </div>
      ) : null}

      {settingsOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-hidden bg-slate-900/35 px-4 pt-5 pb-4 sm:items-center sm:pt-4"
          onClick={() => {
            setSettingsOpen(false);
            setUnbindArmed(false);
          }}
        >
          <div
            className="w-full max-w-sm max-h-[calc(100vh-2rem)] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-700">
                {copy.settings}
              </p>
              <button
                type="button"
                className="rounded-md px-2 py-1 text-slate-500 hover:bg-slate-100"
                onClick={() => {
                  setSettingsOpen(false);
                  setUnbindArmed(false);
                }}
                aria-label={copy.settings}
              >
                ✕
              </button>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-semibold text-slate-600">
                {copy.roomId}
              </p>
              {!isAccountFull ? (
                <>
                  <p className="mt-1 text-xs text-slate-500">
                    {copy.availableSeats(availableSeats, MAX_ACCOUNT_MEMBERS)}
                  </p>
                  <p className="text-xs text-slate-500">
                    {copy.accountIdShareHint}
                  </p>
                </>
              ) : null}
              <div className="mt-2 relative">
                <Input
                  readOnly
                  value={session.roomId}
                  onFocus={(event) => event.currentTarget.select()}
                  onClick={(event) => event.currentTarget.select()}
                  className="pr-12 font-mono text-sm tracking-[0.08em] text-slate-700"
                  aria-label={copy.roomId}
                />
                <button
                  type="button"
                  onClick={copyRoomId}
                  className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  title={copy.roomId}
                >
                  {copied ? (
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            </div>

            <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold text-slate-600">
                  {copy.language}
                </p>
                <LanguageToggle locale={locale} onChange={updateLocale} />
              </div>
            </div>

            <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold text-slate-600">
                  {copy.darkMode}
                </p>
                <div className="inline-flex rounded-full bg-white p-1 shadow-sm ring-1 ring-slate-200">
                  <button
                    type="button"
                    onClick={() => setThemeMode("light")}
                    className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                      themeMode === "light"
                        ? "bg-sky-600 text-white"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {copy.themeLight}
                  </button>
                  <button
                    type="button"
                    onClick={() => setThemeMode("dark")}
                    className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                      themeMode === "dark"
                        ? "bg-sky-600 text-white"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {copy.themeDark}
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-slate-600">
                    {copy.categorySettings}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {copy.categorySettingsHint}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={resetCategoryPreferences}
                  className="shrink-0 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600 hover:bg-slate-100"
                >
                  {copy.resetCategories}
                </button>
              </div>

              <div className="mt-2 space-y-2">
                {categoryPreferences.map((item, index) => (
                  <div
                    key={item.name}
                    draggable={!isTouchDevice}
                    onDragStart={() => {
                      if (!isTouchDevice) {
                        setDraggingCategory(item.name);
                      }
                    }}
                    onDragEnd={() => setDraggingCategory(null)}
                    onDragOver={(event) => {
                      if (!isTouchDevice) {
                        event.preventDefault();
                      }
                    }}
                    onDrop={() => {
                      if (!isTouchDevice) {
                        handleCategoryDrop(item.name);
                      }
                    }}
                    className={`select-none flex items-center justify-between rounded-lg border bg-white px-2.5 py-2 text-xs transition-colors ${
                      draggingCategory === item.name
                        ? "border-sky-300"
                        : "border-slate-200"
                    }`}
                  >
                    <div className="flex items-center gap-2 text-slate-700">
                      {!isTouchDevice ? (
                        <span className="cursor-grab text-slate-400">⋮⋮</span>
                      ) : null}
                      <span>{CATEGORY_CONFIG[item.name]?.emoji ?? "💳"}</span>
                      <span>{getCategoryLabel(item.name, locale)}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => moveCategory(item.name, -1)}
                          disabled={index === 0}
                          className="rounded-md border border-slate-200 bg-white p-1 text-slate-500 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                          aria-label={copy.moveCategoryUp}
                          title={copy.moveCategoryUp}
                        >
                          <ChevronUp className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveCategory(item.name, 1)}
                          disabled={index === categoryPreferences.length - 1}
                          className="rounded-md border border-slate-200 bg-white p-1 text-slate-500 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                          aria-label={copy.moveCategoryDown}
                          title={copy.moveCategoryDown}
                        >
                          <ChevronDown className="h-3 w-3" />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          handleCategoryVisibilityToggle(item.name)
                        }
                        className={`rounded-md px-2 py-1 ${
                          item.visible
                            ? "bg-sky-100 text-sky-800"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {item.visible ? copy.hideCategory : copy.showCategory}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {unbindArmed ? (
              <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                <p>{copy.unbindWarning}</p>
                <p className="mt-1 font-semibold">{copy.unbindConfirmNow}</p>
              </div>
            ) : null}

            <Button
              onClick={handleUnbindAccount}
              disabled={loading}
              className={`mt-3 w-full text-white ${
                unbindArmed
                  ? "bg-rose-700 hover:bg-rose-800"
                  : "bg-rose-600 hover:bg-rose-700"
              }`}
            >
              {copy.leaveRoom}
            </Button>
          </div>
        </div>
      ) : null}
    </main>
  );
}
