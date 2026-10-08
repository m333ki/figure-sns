import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default function PrivacyPage() {
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
        <h1 className="text-lg font-bold text-foreground">プライバシーポリシー</h1>
      </div>

      <div className="space-y-6 text-sm leading-relaxed text-muted">
        <p>
          Figgy（以下「本サービス」）は、ユーザーの皆さまに安心してご利用いただけるよう、以下の方針に基づいて個人情報を取り扱います。
        </p>

        <Section title="1. 取得する情報と利用目的">
          <p>本サービスは、会員登録・ご利用にあたり以下の情報を取得します。</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>メールアドレス（ログイン・本人確認のため）</li>
            <li>ユーザー名・表示名・自己紹介文などのプロフィール情報</li>
            <li>投稿画像・アイコン画像など、ユーザーがアップロードする写真データ</li>
            <li>投稿内容・コメント・メッセージなど、ユーザーが入力するテキスト</li>
            <li>フォロー関係、いいね・保存などの利用履歴</li>
          </ul>
          <p>
            これらの情報は、本サービスの提供・運営、ユーザー間のコミュニケーション機能の提供、お問い合わせへの対応、不正利用の防止のために利用します。
          </p>
        </Section>

        <Section title="2. セキュリティについて">
          <ul className="list-disc space-y-1 pl-5">
            <li>
              パスワードは暗号化（ハッシュ化）した状態で保管しており、本サービス運営者であっても元のパスワードを知ることはできません。
            </li>
            <li>本サービスと利用者間の通信は、すべてSSL/TLSにより暗号化されています。</li>
          </ul>
        </Section>

        <Section title="3. 広告配信について">
          <p>
            本サービスでは、運営維持のためGoogle
            AdSense等、第三者配信の広告サービスを利用する場合があります。これらの広告配信事業者は、ユーザーの興味に応じた広告を表示するためにCookie等を使用することがあります。Cookieを無効にする方法や、Googleの広告ポリシーについては、Google社の案内をご確認ください。
          </p>
        </Section>

        <Section title="4. 第三者への提供">
          <p>
            取得した情報は、法令に基づく場合を除き、ご本人の同意なく第三者に提供することはありません。なお、本サービスの運営上、サーバー・データベース（Supabase）やホスティング（Vercel）など外部サービスを利用しています。
          </p>
        </Section>

        <Section title="5. 情報の確認・削除について">
          <p>
            ご自身のプロフィール情報は、プロフィール編集画面からいつでも確認・修正できます。アカウントの削除をご希望の場合は、
            <Link href="/contact" className="text-accent hover:underline">
              お問い合わせフォーム
            </Link>
            よりご連絡ください。
          </p>
        </Section>

        <Section title="6. 本ポリシーの変更">
          <p>
            本ポリシーの内容は、必要に応じて予告なく変更することがあります。変更後の内容は、本ページに掲載した時点から効力を生じるものとします。
          </p>
        </Section>

        <p className="text-xs text-gray-400 dark:text-gray-500">制定日: 2026年10月7日</p>
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
