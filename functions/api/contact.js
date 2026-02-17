export async function onRequestPost(context) {
  try {
    const { request, env } = context;
    const formData = await request.formData();

    // フォームデータの取得
    const name = formData.get('name');
    const email = formData.get('email');
    const message = formData.get('message');

    // 必須項目のチェック
    if (!name || !email || !message) {
      return new Response(JSON.stringify({ error: '必須項目が不足しています。' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 環境変数のチェック
    const RESEND_API_KEY = env.RESEND_API_KEY;
    const ADMIN_EMAIL = env.ADMIN_EMAIL || 'admin@example.com';
    const FROM_EMAIL = env.FROM_EMAIL || 'onboarding@resend.dev';

    if (!RESEND_API_KEY) {
      console.error('Critical Error: RESEND_API_KEY is missing');
      return new Response(JSON.stringify({ error: 'サーバー設定エラーが発生しました。管理者に連絡してください。' }), {
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
      console.error('Resend Error (Admin):', JSON.stringify(errorData, null, 2));
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
      const errorData = await userEmailRes.json();
      console.warn('Resend Error (Auto-reply):', JSON.stringify(errorData, null, 2));
      // 自動返信失敗は致命的エラーにしない
    }

    return new Response(JSON.stringify({ message: '送信に成功しました。' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    console.error('Unhandled Exception:', err);
    return new Response(JSON.stringify({ error: '予期せぬエラーが発生しました。時間をおいて再度お試しください。' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
