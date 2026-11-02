// Xuất favicon, icon PWA và ảnh chia sẻ (Open Graph) từ app/icon.svg.
// Chạy lại khi đổi icon: `npm run brand:assets`. Kết quả là file tĩnh, được commit cùng code.
import { mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

import sharp from "sharp"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const out = (file) => path.join(root, file)

const iconSvg = await readFile(out("app/icon.svg"), "utf8")

/** Nội dung bên trong thẻ <svg> của icon, bỏ comment và ô nền bo góc (dòng <rect> đầu tiên). */
const iconBody = iconSvg
  .replace(/^[\s\S]*?<svg[^>]*>/, "")
  .replace(/<\/svg>\s*$/, "")
  .replace(/<!--[\s\S]*?-->/g, "")
  .replace(/<rect width="512" height="512"[^>]*\/>/, "")

const BACKGROUND = "#1e1b4b"

/** Icon có nền phủ kín (không bo góc) và co nội dung lại `scale` quanh tâm, cho apple-icon / maskable. */
function fullBleedIcon(scale) {
  const offset = (512 * (1 - scale)) / 2
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="${BACKGROUND}"/>
  <g transform="translate(${offset} ${offset}) scale(${scale})">${iconBody}</g>
</svg>`
}

const png = (svg, size) => sharp(Buffer.from(svg), { density: 384 }).resize(size, size).png().toBuffer()

/** Gói nhiều PNG vào một file .ico (định dạng ICO cho phép nhúng thẳng PNG). */
function buildIco(images) {
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0)
  header.writeUInt16LE(1, 2)
  header.writeUInt16LE(images.length, 4)

  let offset = 6 + images.length * 16
  const entries = images.map(({ size, data }) => {
    const entry = Buffer.alloc(16)
    entry.writeUInt8(size >= 256 ? 0 : size, 0)
    entry.writeUInt8(size >= 256 ? 0 : size, 1)
    entry.writeUInt16LE(1, 4)
    entry.writeUInt16LE(32, 6)
    entry.writeUInt32LE(data.length, 8)
    entry.writeUInt32LE(offset, 12)
    offset += data.length
    return entry
  })
  return Buffer.concat([header, ...entries, ...images.map(({ data }) => data)])
}

/** Ảnh chia sẻ 1200x630: icon nghiêng bên trái, tên game và mô tả bên phải. */
function openGraphSvg() {
  const chips = ["Miễn phí", "Không cần tải", "4 người online"]
  let chipX = 564
  const chipNodes = chips
    .map((label) => {
      // Ước lượng bề rộng chữ (~13px/ký tự ở cỡ 22) vì SVG không đo được chữ trước khi vẽ.
      const width = label.length * 13 + 40
      const node = `<g transform="translate(${chipX} 474)">
        <rect width="${width}" height="48" rx="24" fill="#ffffff" fill-opacity="0.1" stroke="#ffffff" stroke-opacity="0.18"/>
        <text x="${width / 2}" y="32" text-anchor="middle" font-family="Segoe UI" font-weight="700" font-size="22" fill="#e0e7ff">${label}</text>
      </g>`
      chipX += width + 14
      return node
    })
    .join("")

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <radialGradient id="glow-top" cx="0.5" cy="-0.1" r="0.8">
      <stop offset="0" stop-color="#4338ca" stop-opacity="0.85"/>
      <stop offset="1" stop-color="#4338ca" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="glow-bottom" cx="0.5" cy="1.15" r="0.7">
      <stop offset="0" stop-color="#9d174d" stop-opacity="0.6"/>
      <stop offset="1" stop-color="#9d174d" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="title" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fff7c2"/>
      <stop offset="0.45" stop-color="#facc15"/>
      <stop offset="1" stop-color="#f97316"/>
    </linearGradient>
    <pattern id="dots" width="22" height="22" patternUnits="userSpaceOnUse">
      <circle cx="1" cy="1" r="1" fill="#ffffff" fill-opacity="0.06"/>
    </pattern>
  </defs>
  <rect width="1200" height="630" fill="#14123a"/>
  <rect width="1200" height="630" fill="url(#glow-top)"/>
  <rect width="1200" height="630" fill="url(#glow-bottom)"/>
  <rect width="1200" height="630" fill="url(#dots)"/>

  <g transform="translate(70 95) rotate(-6 220 220)">
    <rect x="12" y="24" width="440" height="440" rx="96" fill="#000000" fill-opacity="0.35"/>
    <svg width="440" height="440" viewBox="0 0 512 512">${iconSvg.replace(/^[\s\S]*?<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "")}</svg>
  </g>

  <text x="560" y="250" font-family="Segoe UI" font-weight="900" font-size="104" fill="#3b1d0a" fill-opacity="0.55" transform="translate(0 6)">Cờ Cá Ngựa</text>
  <text x="560" y="250" font-family="Segoe UI" font-weight="900" font-size="104" fill="url(#title)">Cờ Cá Ngựa</text>
  <text x="564" y="320" font-family="Segoe UI" font-weight="800" font-size="52" fill="#ffffff">Online</text>
  <text x="564" y="396" font-family="Segoe UI" font-weight="600" font-size="28" fill="#c7d2fe">Chơi với bot hoặc bạn bè, 2–4 người một bàn.</text>
  <text x="564" y="436" font-family="Segoe UI" font-weight="600" font-size="28" fill="#c7d2fe">Mở trình duyệt là chơi ngay.</text>
  ${chipNodes}
</svg>`
}

await mkdir(out("public/icons"), { recursive: true })

const icoSizes = [16, 32, 48]
const icoImages = await Promise.all(icoSizes.map(async (size) => ({ size, data: await png(iconSvg, size) })))
await writeFile(out("app/favicon.ico"), buildIco(icoImages))

// Apple tự bo góc icon, nên dùng nền phủ kín; Android "maskable" cần chừa vùng an toàn ~10% mỗi cạnh.
await writeFile(out("app/apple-icon.png"), await png(fullBleedIcon(0.9), 180))
await writeFile(out("public/icons/icon-192.png"), await png(iconSvg, 192))
await writeFile(out("public/icons/icon-512.png"), await png(iconSvg, 512))
await writeFile(out("public/icons/icon-maskable-512.png"), await png(fullBleedIcon(0.8), 512))

await writeFile(
  out("app/opengraph-image.png"),
  await sharp(Buffer.from(openGraphSvg())).png({ compressionLevel: 9, palette: false }).toBuffer()
)

console.log("Brand assets generated: favicon.ico, apple-icon.png, icons/*.png, opengraph-image.png")
