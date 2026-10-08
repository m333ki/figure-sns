import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6">
      <div className="mb-6 flex items-center gap-2">
        <Link
          href="/"
          aria-label="トップページへ戻る"
          className="flex h-8 w-8 items-center justify-center rounded-full text-muted transition hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <ChevronLeft size={18} />
        </Link>
        <h1 className="text-lg font-bold text-foreground">利用規約</h1>
      </div>

      <div className="space-y-6 text-sm leading-relaxed text-muted">
        <p>
          この利用規約（以下「本規約」）は、Figgy（以下「本サービス」）の利用条件を定めるものです。ユーザーの皆さまには、本規約に同意の上、本サービスをご利用いただきます。
        </p>

        <Section title="1. 適用">
          <p>
            本規約は、本サービスの利用に関する運営者とユーザーとの間のすべての関係に適用されます。本サービスを利用した時点で、本規約に同意したものとみなします。
          </p>
        </Section>

        <Section title="2. アカウント登録">
          <p>
            ユーザーは、真実かつ正確な情報で登録するものとします。パスワードおよびアカウントの管理はユーザー自身の責任で行い、第三者への譲渡・貸与はできません。
          </p>
        </Section>

        <Section title="3. 禁止事項">
          <p>ユーザーは、本サービスの利用にあたり、以下の行為をしてはなりません。</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>法令または公序良俗に違反する行為</li>
            <li>他者の著作権・商標権その他の知的財産権を侵害する行為（公式画像の無断転載を含む）</li>
            <li>他のユーザーまたは第三者を誹謗中傷し、嫌がらせをし、または名誉・信用を毀損する行為</li>
            <li>他者になりすます行為、虚偽の情報を登録・投稿する行為</li>
            <li>本サービスのシステムに不正にアクセスし、またはその運営を妨害する行為</li>
            <li>無断での広告・宣伝・勧誘、スパム行為</li>
            <li>その他、運営者が不適切と判断する行為</li>
          </ul>
        </Section>

        <Section title="4. 投稿コンテンツの取り扱い">
          <p>
            投稿された画像・文章等の著作権は、投稿したユーザー自身に帰属します。ただし、ユーザーは本サービスの提供・改善・宣伝に必要な範囲で、運営者が当該コンテンツを表示・複製・配信できることを許諾するものとします。
          </p>
          <p>
            運営者は、本規約に違反する投稿、または違反するおそれがあると判断した投稿について、事前の通知なく削除できるものとします。
          </p>
        </Section>

        <Section title="5. 免責事項">
          <ul className="list-disc space-y-1 pl-5">
            <li>運営者は、本サービスの内容を予告なく変更・中断・終了することがあります。</li>
            <li>運営者は、本サービスに事実上または法律上の瑕疵（安全性・信頼性・正確性・完全性等に関するものを含む）がないことを保証しません。</li>
            <li>ユーザー間またはユーザーと第三者との間で生じたトラブルについて、運営者は一切の責任を負いません。</li>
            <li>本サービスに起因してユーザーに生じた損害について、運営者に故意または重過失がある場合を除き、賠償責任を負いません。</li>
          </ul>
        </Section>

        <Section title="6. アカウントの停止・削除">
          <p>運営者は、ユーザーが以下のいずれかに該当すると判断した場合、事前の通知なくアカウントの利用停止・削除を行うことがあります。</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>本規約のいずれかの条項に違反した場合</li>
            <li>登録事項に虚偽の事実があることが判明した場合</li>
            <li>不正アクセスや他のユーザーへの迷惑行為があった場合</li>
            <li>その他、運営者が本サービスの利用に不適切と判断した場合</li>
          </ul>
        </Section>

        <Section title="7. 本規約の変更">
          <p>
            運営者は、必要と判断した場合、ユーザーへの事前通知なく本規約を変更できるものとします。変更後の規約は、本ページに掲載した時点から効力を生じるものとします。
          </p>
        </Section>

        <Section title="8. お問い合わせ">
          <p>
            本規約に関するお問い合わせは、
            <Link href="/contact" className="text-accent hover:underline">
              お問い合わせフォーム
            </Link>
            よりご連絡ください。
          </p>
        </Section>

        <p className="text-xs text-gray-400 dark:text-gray-500">制定日: 2026年10月8日</p>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      {children}
    </section>
  );
}
