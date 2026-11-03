"use client"

import { createContext, useContext, useEffect, useMemo, useState } from "react"

import { DEFAULT_LOCALE, locales, type Locale } from "@/lib/locale"

export { locales, type Locale }

const STORAGE_KEY = "base-game.locale"

const en = {
  "language.label": "Language",
  "language.en": "English",
  "language.vi": "Tiếng Việt",
  "app.name": "Ludo",
  "app.tagline": "Roll the dice, race your horses to the finish, and be the first to win! 2–4 players, bots or friends.",
  "menu.chooseMode": "Choose a mode",
  "menu.offline.title": "Play on this device",
  "menu.offline.description": "Against bots, or pass the device between friends. No internet needed.",
  "menu.online.title": "Play online",
  "menu.online.description": "Create a room, share the code and play with up to 4 friends.",
  "menu.back": "Back",
  "menu.howToPlay": "How to play",
  "menu.exit": "Exit",
  "menu.exitConfirmTitle": "Leave this game?",
  "menu.exitConfirm": "The current game is not saved and will be lost.",
  "menu.keepPlaying": "Keep playing",
  "guide.about.title": "What is Ludo online?",
  "guide.about.body": "Ludo is a classic race board game for 2–4 players: roll the dice, bring your four horses out of the stable and race them around the board to the finish. Here you can play it free in your browser — against smart bots, with friends on the same device, or in an online room with a 6-character invite code and live chat.",
  "guide.rules.title": "Rules",
  "guide.rules.track": "Each player moves their tokens clockwise around the board, then up their own colored home column to the finish.",
  "guide.online.title": "Play online with friends",
  "guide.online.step1": "Choose “Play online” and enter your name.",
  "guide.online.step2": "Create a room, then share the 6-character code or the invite link.",
  "guide.online.step3": "Friends join as spectators and pick a free seat. The host can fill empty seats with bots.",
  "guide.online.step4": "The host presses Start. Chat with the table while you play.",
  "guide.faq.title": "FAQ",
  "guide.faq.free.q": "Is it free?",
  "guide.faq.free.a": "Yes. The game is completely free, with no download and no sign-up.",
  "guide.faq.mobile.q": "Can I play on my phone?",
  "guide.faq.mobile.a": "Yes. The game runs in any modern browser on phones, tablets and computers.",
  "guide.faq.players.q": "How many people can play?",
  "guide.faq.players.a": "2 to 4 players per table. Online rooms have 4 seats; anyone else can watch and chat.",
  "guide.faq.saved.q": "What happens if I reload the page?",
  "guide.faq.saved.a": "Games on this device are saved in your browser and continue after a reload. Your win/loss record is saved too.",
  "stats.title": "Your record",
  "stats.played": "Games",
  "stats.wins": "Wins",
  "stats.winRate": "Win rate",
  "stats.bestStreak": "Best streak",
  "stats.currentStreak": "On a {count}-game winning streak!",
  "stats.recent": "Recent games",
  "stats.ranking": "Finishing order",
  "stats.empty": "No finished games yet. Go play one!",
  "stats.result.win": "Win",
  "stats.result.loss": "Loss",
  "stats.result.friendly": "Friendly",
  "stats.mode.offline": "On this device",
  "stats.mode.online": "Online",
  "stats.note": "Saved on this browser only.",
  "stats.clear": "Clear history",
  "stats.clearConfirmTitle": "Clear all game history?",
  "stats.clearConfirm": "Your stats on this browser will be reset to zero.",
  "stats.cancel": "Cancel",
  "ludo.title": "Ludo",
  "ludo.boardLabel": "Ludo board",
  "ludo.color.red": "Red",
  "ludo.color.green": "Green",
  "ludo.color.yellow": "Yellow",
  "ludo.color.blue": "Blue",
  "ludo.seat.human": "Human",
  "ludo.seat.bot": "Bot",
  "ludo.seat.off": "Off",
  "ludo.setup.title": "New game",
  "ludo.setup.description": "Choose who plays each color. Humans take turns on this device.",
  "ludo.setup.needTwoPlayers": "At least 2 players are needed.",
  "ludo.setup.start": "Start game",
  "ludo.rules.title": "How to play",
  "ludo.rules.leaveBase": "Roll a 6 to bring a token out of its base.",
  "ludo.rules.bonus": "Rolling a 6, capturing, or reaching home gives another roll. Three 6s in a row lose the turn.",
  "ludo.rules.block":
    "No jumping and no sharing: a token can't pass any other token (yours or an opponent's), and each square holds only one token. If a token is blocked, move another one; if none can move, you lose the turn.",
  "ludo.rules.capture":
    "Land exactly on an opponent to send it back to base. Start and star squares are safe: you can't stop on an opponent there, except when bringing a token out onto your own start, which captures it.",
  "ludo.rules.finish": "You need the exact roll to reach home. Get all 4 tokens home first to win.",
  "ludo.status.turn": "{player}'s turn",
  "ludo.status.roll": "Roll the dice",
  "ludo.status.choose": "Choose a token to move",
  "ludo.status.botThinking": "Bot is playing...",
  "ludo.status.noMoves": "{player} had no moves.",
  "ludo.status.threeSixes": "{player} rolled three 6s and lost the turn.",
  "ludo.rollDice": "Roll dice",
  "ludo.tokensHome": "{count}/{total} home",
  "ludo.tokenLabel": "{player} token {index}",
  "ludo.mute": "Mute",
  "ludo.unmute": "Unmute",
  "ludo.newGame": "New game",
  "ludo.playAgain": "Play again",
  "ludo.changeSetup": "Change players",
  "ludo.gameOver.title": "Game over",
  "ludo.gameOver.winner": "{player} wins!",
  "ludo.seat.notPlaying": "Not playing",
  "ludo.online.title": "Ludo online",
  "ludo.online.description": "Create a room and share the code. Everyone joins as a spectator, then picks a free seat.",
  "ludo.online.yourName": "Your name",
  "ludo.online.namePlaceholder": "e.g. Minh",
  "ludo.online.enterNameTitle": "Enter your name to join",
  "ludo.online.createRoom": "Create room",
  "ludo.online.or": "or",
  "ludo.online.roomCode": "Room code",
  "ludo.online.roomCodePlaceholder": "ABC123",
  "ludo.online.joinRoom": "Join",
  "ludo.online.connecting": "Connecting...",
  "ludo.online.notConfiguredTitle": "Online mode is not set up",
  "ludo.online.notConfigured":
    "Firebase is not configured. Fill in the NEXT_PUBLIC_FIREBASE_* variables in .env.local and restart the dev server.",
  "ludo.online.connectFailed": "Could not connect to the room. Please try again.",
  "ludo.online.roomNotFound": "Room not found. It may have been closed.",
  "ludo.online.kicked": "You were removed from this room by the host.",
  "ludo.online.backToEntry": "Back to menu",
  "ludo.online.actionFailed": "Action failed. Please try again.",
  "ludo.online.seatTaken": "Someone took that seat first.",
  "ludo.online.sit": "Take seat",
  "ludo.online.standUp": "Leave seat",
  "ludo.online.kick": "Kick",
  "ludo.online.you": "{name} (you)",
  "ludo.online.host": "Host",
  "ludo.online.emptySeat": "Empty seat",
  "ludo.online.waitingForPlayer": "Waiting for a player",
  "ludo.online.botStandIn": "Bot is playing until someone sits",
  "ludo.online.botSeat": "Played by the host's device",
  "ludo.online.addBot": "Add bot",
  "ludo.online.removeBot": "Remove bot",
  "ludo.online.copyLink": "Copy invite link",
  "ludo.online.linkCopied": "Invite link copied.",
  "ludo.online.seatedAs": "Playing as {color}",
  "ludo.online.spectating": "Spectating",
  "ludo.online.endGame": "End game",
  "ludo.online.leaveRoom": "Leave room",
  "ludo.online.leaveConfirm": "Your seat will be freed and a bot plays it until someone sits down.",
  "ludo.online.spectators": "Spectators ({count})",
  "ludo.online.noSpectators": "No one is watching.",
  "ludo.online.waitingForHost": "Waiting for the host to start the game...",
  "ludo.online.backToLobby": "Back to lobby",
  "ludo.board.menu": "Board settings",
  "ludo.board.loading": "Setting up the board…",
  "ludo.board.graphics": "Graphics",
  "ludo.board.graphics.3d": "3D board",
  "ludo.board.graphics.2d": "2D board",
  "ludo.board.style": "Board style",
  "ludo.board.style.walnut": "Walnut",
  "ludo.board.style.lacquer": "Vietnamese lacquer",
  "ludo.board.style.marble": "Marble",
  "ludo.board.piece": "Pieces",
  "ludo.board.piece.horse": "Horse",
  "ludo.board.piece.seahorse": "Seahorse",
  "ludo.board.view": "Camera",
  "ludo.board.view.angled": "From your seat",
  "ludo.board.view.top": "Top down",
  "ludo.graphics.unsupported": "This device cannot show the 3D board",
  "ludo.graphics.fellBack": "The 3D board stopped working, switched to 2D.",
  "ludo.chat.title": "Room chat",
  "ludo.chat.open": "Open chat",
  "ludo.chat.close": "Close chat",
  "ludo.chat.unread": "Open chat, {count} unread",
  "ludo.chat.placeholder": "Say something...",
  "ludo.chat.send": "Send",
  "ludo.chat.empty": "No messages yet. Say hi to the table!",
  "ludo.chat.sendFailed": "Message could not be sent.",
} as const

export type TranslationKey = keyof typeof en
type TranslationDictionary = Record<TranslationKey, string>

const vi: TranslationDictionary = {
  "language.label": "Ngôn ngữ",
  "language.en": "English",
  "language.vi": "Tiếng Việt",
  "app.name": "Cờ Cá Ngựa",
  "app.tagline": "Tung xúc xắc, đưa cả 4 chú ngựa về đích và giành chiến thắng! 2–4 người, chơi với bot hoặc bạn bè.",
  "menu.chooseMode": "Chọn chế độ chơi",
  "menu.offline.title": "Chơi trên máy",
  "menu.offline.description": "Đấu với bot hoặc chuyền máy cho bạn bè. Không cần mạng.",
  "menu.online.title": "Chơi online",
  "menu.online.description": "Tạo phòng, gửi mã cho bạn bè, tối đa 4 người một bàn.",
  "menu.back": "Quay lại",
  "menu.howToPlay": "Luật chơi",
  "menu.exit": "Thoát",
  "menu.exitConfirmTitle": "Thoát ván đang chơi?",
  "menu.exitConfirm": "Ván này không được lưu, thoát là mất.",
  "menu.keepPlaying": "Chơi tiếp",
  "guide.about.title": "Cờ cá ngựa online là gì?",
  "guide.about.body": "Cờ cá ngựa (Ludo) là trò chơi bàn cờ đua cho 2–4 người: gieo xúc xắc, đưa 4 chú ngựa ra khỏi chuồng và đua một vòng quanh bàn cờ về đích. Ở đây bạn chơi miễn phí ngay trên trình duyệt: đấu với bot, chơi chung một máy với bạn bè, hoặc tạo phòng online bằng mã 6 ký tự và chat với cả bàn.",
  "guide.rules.title": "Luật chơi cờ cá ngựa",
  "guide.rules.track": "Mỗi người đi quân theo chiều kim đồng hồ quanh bàn cờ, rồi lên dãy ô cùng màu của mình để về đích.",
  "guide.online.title": "Cách chơi online với bạn bè",
  "guide.online.step1": "Chọn “Chơi online” và nhập tên của bạn.",
  "guide.online.step2": "Tạo phòng, rồi gửi mã 6 ký tự hoặc link mời cho bạn bè.",
  "guide.online.step3": "Bạn bè vào phòng sẽ là người xem và chọn ghế còn trống. Chủ phòng có thể thêm bot vào ghế trống.",
  "guide.online.step4": "Chủ phòng bấm Bắt đầu. Vừa chơi vừa chat với cả bàn.",
  "guide.faq.title": "Câu hỏi thường gặp",
  "guide.faq.free.q": "Chơi có mất phí không?",
  "guide.faq.free.a": "Không. Game hoàn toàn miễn phí, không cần tải về và không cần đăng ký tài khoản.",
  "guide.faq.mobile.q": "Chơi trên điện thoại được không?",
  "guide.faq.mobile.a": "Được. Game chạy trên trình duyệt của điện thoại, máy tính bảng và máy tính.",
  "guide.faq.players.q": "Một bàn chơi được mấy người?",
  "guide.faq.players.a": "Từ 2 đến 4 người. Phòng online có 4 ghế, những người còn lại có thể vào xem và chat.",
  "guide.faq.saved.q": "Tải lại trang có mất ván không?",
  "guide.faq.saved.a": "Không. Ván chơi trên máy được lưu trong trình duyệt và tiếp tục sau khi tải lại trang. Lịch sử thắng thua cũng được lưu.",
  "stats.title": "Thành tích",
  "stats.played": "Ván đã chơi",
  "stats.wins": "Thắng",
  "stats.winRate": "Tỉ lệ thắng",
  "stats.bestStreak": "Chuỗi thắng dài nhất",
  "stats.currentStreak": "Đang thắng liền {count} ván!",
  "stats.recent": "Ván gần đây",
  "stats.ranking": "Thứ tự về đích",
  "stats.empty": "Chưa có ván nào kết thúc. Chơi một ván đi!",
  "stats.result.win": "Thắng",
  "stats.result.loss": "Thua",
  "stats.result.friendly": "Giao hữu",
  "stats.mode.offline": "Trên máy",
  "stats.mode.online": "Online",
  "stats.note": "Chỉ lưu trên trình duyệt này.",
  "stats.clear": "Xoá lịch sử",
  "stats.clearConfirmTitle": "Xoá toàn bộ lịch sử ván?",
  "stats.clearConfirm": "Thống kê trên trình duyệt này sẽ về 0.",
  "stats.cancel": "Huỷ",
  "ludo.title": "Ludo",
  "ludo.boardLabel": "Bàn cờ Ludo",
  "ludo.color.red": "Đỏ",
  "ludo.color.green": "Xanh lá",
  "ludo.color.yellow": "Vàng",
  "ludo.color.blue": "Xanh dương",
  "ludo.seat.human": "Người",
  "ludo.seat.bot": "Bot",
  "ludo.seat.off": "Tắt",
  "ludo.setup.title": "Ván mới",
  "ludo.setup.description": "Chọn ai chơi mỗi màu. Người chơi thay phiên trên cùng thiết bị.",
  "ludo.setup.needTwoPlayers": "Cần ít nhất 2 người chơi.",
  "ludo.setup.start": "Bắt đầu",
  "ludo.rules.title": "Cách chơi",
  "ludo.rules.leaveBase": "Tung được 6 mới đưa quân ra khỏi chuồng.",
  "ludo.rules.bonus": "Tung 6, đá quân hoặc về đích được tung thêm. Ba lần 6 liên tiếp sẽ mất lượt.",
  "ludo.rules.block":
    "Bị cản: không được đi vượt qua quân khác (của mình hay đối thủ), và mỗi ô chỉ đứng được một quân. Quân bị cản thì chọn quân khác để đi; không quân nào đi được thì mất lượt.",
  "ludo.rules.capture":
    "Đi đúng vào ô có quân đối thủ thì đá quân đó về chuồng. Ô xuất phát và ô ngôi sao là ô an toàn: không được dừng ở đó nếu đã có quân đối thủ, riêng khi ra quân thì quân đối thủ đứng ở ô xuất phát của mình bị đá.",
  "ludo.rules.finish": "Phải tung đúng số để về đích. Ai đưa đủ 4 quân về trước sẽ thắng.",
  "ludo.status.turn": "Lượt của {player}",
  "ludo.status.roll": "Tung xúc xắc",
  "ludo.status.choose": "Chọn quân để đi",
  "ludo.status.botThinking": "Bot đang đi...",
  "ludo.status.noMoves": "{player} không có nước đi.",
  "ludo.status.threeSixes": "{player} tung ba lần 6 nên mất lượt.",
  "ludo.rollDice": "Tung xúc xắc",
  "ludo.tokensHome": "{count}/{total} về đích",
  "ludo.tokenLabel": "Quân {player} số {index}",
  "ludo.mute": "Tắt tiếng",
  "ludo.unmute": "Bật tiếng",
  "ludo.newGame": "Ván mới",
  "ludo.playAgain": "Chơi lại",
  "ludo.changeSetup": "Đổi người chơi",
  "ludo.gameOver.title": "Kết thúc",
  "ludo.gameOver.winner": "{player} thắng!",
  "ludo.seat.notPlaying": "Không chơi",
  "ludo.online.title": "Ludo online",
  "ludo.online.description": "Tạo phòng rồi gửi mã cho bạn bè. Ai vào phòng cũng là người xem, sau đó chọn ghế còn trống.",
  "ludo.online.yourName": "Tên của bạn",
  "ludo.online.namePlaceholder": "VD: Minh",
  "ludo.online.enterNameTitle": "Nhập tên để vào phòng",
  "ludo.online.createRoom": "Tạo phòng",
  "ludo.online.or": "hoặc",
  "ludo.online.roomCode": "Mã phòng",
  "ludo.online.roomCodePlaceholder": "ABC123",
  "ludo.online.joinRoom": "Vào phòng",
  "ludo.online.connecting": "Đang kết nối...",
  "ludo.online.notConfiguredTitle": "Chưa cài đặt chế độ online",
  "ludo.online.notConfigured":
    "Chưa cấu hình Firebase. Điền các biến NEXT_PUBLIC_FIREBASE_* vào .env.local rồi chạy lại dev server.",
  "ludo.online.connectFailed": "Không kết nối được tới phòng. Vui lòng thử lại.",
  "ludo.online.roomNotFound": "Không tìm thấy phòng. Có thể phòng đã đóng.",
  "ludo.online.kicked": "Bạn đã bị chủ phòng mời ra khỏi phòng.",
  "ludo.online.backToEntry": "Về menu",
  "ludo.online.actionFailed": "Thao tác thất bại. Vui lòng thử lại.",
  "ludo.online.seatTaken": "Ghế này vừa có người ngồi.",
  "ludo.online.sit": "Ngồi vào",
  "ludo.online.standUp": "Rời ghế",
  "ludo.online.kick": "Kick",
  "ludo.online.you": "{name} (bạn)",
  "ludo.online.host": "Chủ phòng",
  "ludo.online.emptySeat": "Ghế trống",
  "ludo.online.waitingForPlayer": "Đang chờ người chơi",
  "ludo.online.botStandIn": "Bot đánh tạm đến khi có người ngồi",
  "ludo.online.botSeat": "Máy chủ phòng đánh thay",
  "ludo.online.addBot": "Thêm bot",
  "ludo.online.removeBot": "Bỏ bot",
  "ludo.online.copyLink": "Sao chép link mời",
  "ludo.online.linkCopied": "Đã sao chép link mời.",
  "ludo.online.seatedAs": "Bạn chơi màu {color}",
  "ludo.online.spectating": "Đang xem",
  "ludo.online.endGame": "Kết thúc ván",
  "ludo.online.leaveRoom": "Rời phòng",
  "ludo.online.leaveConfirm": "Ghế của bạn sẽ trống, bot đánh thay đến khi có người ngồi vào.",
  "ludo.online.spectators": "Người xem ({count})",
  "ludo.online.noSpectators": "Chưa có ai đang xem.",
  "ludo.online.waitingForHost": "Đang chờ chủ phòng bắt đầu ván...",
  "ludo.online.backToLobby": "Về phòng chờ",
  "ludo.board.menu": "Cài đặt bàn cờ",
  "ludo.board.loading": "Đang dựng bàn cờ…",
  "ludo.board.graphics": "Đồ hoạ",
  "ludo.board.graphics.3d": "Bàn 3D",
  "ludo.board.graphics.2d": "Bàn 2D",
  "ludo.board.style": "Phong cách",
  "ludo.board.style.walnut": "Gỗ óc chó",
  "ludo.board.style.lacquer": "Sơn mài",
  "ludo.board.style.marble": "Cẩm thạch",
  "ludo.board.piece": "Quân cờ",
  "ludo.board.piece.horse": "Ngựa",
  "ludo.board.piece.seahorse": "Cá ngựa",
  "ludo.board.view": "Góc nhìn",
  "ludo.board.view.angled": "Từ chỗ ngồi",
  "ludo.board.view.top": "Từ trên xuống",
  "ludo.graphics.unsupported": "Thiết bị không hiển thị được bàn 3D",
  "ludo.graphics.fellBack": "Bàn 3D gặp lỗi, đã chuyển sang 2D.",
  "ludo.chat.title": "Chat phòng",
  "ludo.chat.open": "Mở chat",
  "ludo.chat.close": "Đóng chat",
  "ludo.chat.unread": "Mở chat, {count} tin chưa đọc",
  "ludo.chat.placeholder": "Nhắn gì đó...",
  "ludo.chat.send": "Gửi",
  "ludo.chat.empty": "Chưa có tin nào. Chào cả bàn một câu đi!",
  "ludo.chat.sendFailed": "Không gửi được tin nhắn.",
}

const dictionaries: Record<Locale, TranslationDictionary> = { en, vi }
const localeTags: Record<Locale, string> = { en: "en-US", vi: "vi-VN" }

function isLocale(value: string | null | undefined): value is Locale {
  return locales.includes(value as Locale)
}

function preferredLocale(): Locale {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    if (isLocale(saved)) return saved
  } catch {}

  const browserLocale = window.navigator.language.toLowerCase().split("-")[0]
  return isLocale(browserLocale) ? browserLocale : "en"
}

interface I18nContextValue {
  locale: Locale
  localeTag: string
  setLocale: (locale: Locale) => void
  t: (key: TranslationKey, values?: Record<string, string | number>) => string
  formatNumber: (value: number) => string
}

const I18nContext = createContext<I18nContextValue | null>(null)

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE)

  useEffect(() => {
    const timer = window.setTimeout(() => setLocaleState(preferredLocale()), 0)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    document.documentElement.lang = localeTags[locale]
  }, [locale])

  const value = useMemo<I18nContextValue>(() => {
    const setLocale = (nextLocale: Locale) => {
      setLocaleState(nextLocale)
      try {
        window.localStorage.setItem(STORAGE_KEY, nextLocale)
      } catch {}
    }

    const t = (key: TranslationKey, values: Record<string, string | number> = {}) =>
      dictionaries[locale][key].replace(/\{(\w+)\}/g, (match, name: string) =>
        values[name] === undefined ? match : String(values[name])
      )

    return {
      locale,
      localeTag: localeTags[locale],
      setLocale,
      t,
      formatNumber: (number) => number.toLocaleString(localeTags[locale]),
    }
  }, [locale])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext)
  if (!context) throw new Error("useI18n must be used within I18nProvider")
  return context
}

export { isLocale }
