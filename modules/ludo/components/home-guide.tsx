"use client"

import { BookOpenIcon, CircleHelpIcon, GlobeIcon, InfoIcon } from "lucide-react"

import { JsonLd } from "@/components/seo/json-ld"
import { useI18n, type TranslationKey } from "@/lib/i18n"

const RULE_KEYS = [
  "guide.rules.track",
  "ludo.rules.leaveBase",
  "ludo.rules.bonus",
  "ludo.rules.block",
  "ludo.rules.capture",
  "ludo.rules.finish",
] as const satisfies readonly TranslationKey[]

const ONLINE_STEPS = [
  "guide.online.step1",
  "guide.online.step2",
  "guide.online.step3",
  "guide.online.step4",
] as const satisfies readonly TranslationKey[]

const FAQ = [
  { q: "guide.faq.free.q", a: "guide.faq.free.a" },
  { q: "guide.faq.mobile.q", a: "guide.faq.mobile.a" },
  { q: "guide.faq.players.q", a: "guide.faq.players.a" },
  { q: "guide.faq.saved.q", a: "guide.faq.saved.a" },
] as const satisfies readonly { q: TranslationKey; a: TranslationKey }[]

function GuideCard({ icon: Icon, title, children }: { icon: typeof InfoIcon; title: string; children: React.ReactNode }) {
  return (
    <section className="game-panel flex flex-col gap-3 rounded-3xl p-5">
      <h2 className="flex items-center gap-2 text-lg font-bold">
        <Icon className="size-5 text-primary" aria-hidden="true" />
        {title}
      </h2>
      {children}
    </section>
  )
}

/**
 * Giới thiệu, luật, cách chơi online và FAQ dưới menu (cuộn xuống mới thấy).
 * Nội dung có sẵn trong HTML render server để công cụ tìm kiếm đọc được; FAQ kèm JSON-LD FAQPage.
 */
export function HomeGuide() {
  const { t } = useI18n()

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map(({ q, a }) => ({
      "@type": "Question",
      name: t(q),
      acceptedAnswer: { "@type": "Answer", text: t(a) },
    })),
  }

  return (
    <div className="grid gap-4 pb-8 text-sm leading-relaxed text-muted-foreground md:grid-cols-2">
      <GuideCard icon={InfoIcon} title={t("guide.about.title")}>
        <p>{t("guide.about.body")}</p>
      </GuideCard>

      <GuideCard icon={GlobeIcon} title={t("guide.online.title")}>
        <ol className="flex list-decimal flex-col gap-1.5 pl-5 marker:font-bold marker:text-primary">
          {ONLINE_STEPS.map((key) => (
            <li key={key}>{t(key)}</li>
          ))}
        </ol>
      </GuideCard>

      <GuideCard icon={BookOpenIcon} title={t("guide.rules.title")}>
        <ul className="flex list-disc flex-col gap-1.5 pl-5 marker:text-primary">
          {RULE_KEYS.map((key) => (
            <li key={key}>{t(key)}</li>
          ))}
        </ul>
      </GuideCard>

      <GuideCard icon={CircleHelpIcon} title={t("guide.faq.title")}>
        <div className="flex flex-col gap-2">
          {FAQ.map(({ q, a }) => (
            <details key={q} className="group rounded-xl bg-black/15 px-3 py-2">
              <summary className="cursor-pointer font-semibold text-foreground marker:text-primary">{t(q)}</summary>
              <p className="mt-1">{t(a)}</p>
            </details>
          ))}
        </div>
      </GuideCard>

      <JsonLd data={faqJsonLd} />
    </div>
  )
}
