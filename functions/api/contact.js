export async function onRequestPost(context) {
  try {
    const { request, env } = context;
    const formData = await request.formData();

    // フォームデータの取得
    const name = formData.get('name');
    const email = formData.get('email');
    const message = formData.get('message');

    // 簡易バリデーション
    if (!name || !email || !message) {
      return new Response(JSON.stringify({ error: '必須項目が不足しています。' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 環境変数のチェック
    const RESEND_API_KEY = env.RESEND_API_KEY;
    const ADMIN_EMAIL = env.ADMIN_EMAIL || 'admin@example.com'; // 管理者の受信アドレス
    const FROM_EMAIL = env.FROM_EMAIL || 'onboarding@resend.dev'; // 送信元アドレス

    if (!RESEND_API_KEY) {
      console.error('RESEND_API_KEY is not set');
      return new Response(JSON.stringify({ error: 'サーバー設定エラー: APIキーが設定されていません。' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 1. 管理者への通知メール送信
    const adminEmailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: ADMIN_EMAIL,
        reply_to: email,
        subject: `【Webサイト問い合わせ】${name}様より`,
        html: `
          <h3>新しいお問い合わせがありました</h3>
          <p><strong>お名前:</strong> ${name}</p>
          <p><strong>メールアドレス:</strong> ${email}</p>
          <p><strong>メッセージ:</strong></p>
          <pre>${message}</pre>
        `
      })
    });

    if (!adminEmailRes.ok) {
      const errorData = await adminEmailRes.json();
      console.error('Resend Error (Admin):', errorData);
      throw new Error('管理者へのメール送信に失敗しました。');
    }

    // 2. ユーザーへの自動返信メール送信
    const userEmailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: email,
        subject: '【自動送信】お問い合わせありがとうございます',
        html: `
          <p>${name} 様</p>
          <p>この度はお問い合わせいただきありがとうございます。<br>
          以下の内容で受け付けました。担当者より改めてご連絡いたします。</p>
          <hr>
          <p><strong>お問い合わせ内容:</strong></p>
          <pre>${message}</pre>
          <hr>
          <p>※このメールは自動送信されています。</p>
        `
      })
    });

    if (!userEmailRes.ok) {
      // ユーザーへの返信失敗はログに残すが、処理自体は成功とする（スパム判定などで落ちることもあるため）
      const errorData = await userEmailRes.json();
      console.warn('Resend Error (Auto-reply):', errorData);
    }

    return new Response(JSON.stringify({ message: '送信に成功しました。' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
