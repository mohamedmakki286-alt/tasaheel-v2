# إعداد بريد تساهيل عبر Brevo SMTP

أصبح الباكند يستخدم `JavaMailSender` وبروتوكول SMTP فقط. لا توجد مفاتيح Brevo أو كلمات مرور داخل المستودع.

## 1. إنشاء بيانات SMTP

من Brevo افتح **SMTP & API > SMTP** ثم أنشئ **SMTP key**. اسم المستخدم الظاهر في صفحة SMTP يوضع في `MAIL_USERNAME`، والمفتاح الجديد يوضع في `MAIL_PASSWORD`.

مفتاح SMTP مخصص للمصادقة على `smtp-relay.brevo.com`. أما API key فيستخدم REST API ولا يصلح ككلمة مرور SMTP.

## 2. متغيرات البيئة

```env
MAIL_HOST=smtp-relay.brevo.com
MAIL_PORT=587
MAIL_USERNAME=your-brevo-smtp-login
MAIL_PASSWORD=your-brevo-smtp-key
MAIL_FROM=noreply@salabaa.com
MAIL_FROM_NAME=تساهيل
MAIL_ENABLED=true
CUSTOMER_APP_URL=https://tasaheel-customer.vercel.app
WORKSHOP_APP_URL=https://tasaheel-workshop.vercel.app
```

لا تضع القيم الحقيقية في `.env.example` أو Git. في Oracle أضفها إلى ملف البيئة الذي يقرأه Docker Compose ثم أعد إنشاء حاوية الباكند. للتطوير المحلي اترك `MAIL_ENABLED=false` ما لم تستخدم حساب اختبار.

## 3. توثيق المرسل والنطاق

أضف `noreply@salabaa.com` كمرسل في Brevo. الأفضل توثيق النطاق كاملاً من صفحة **Senders, Domains & Dedicated IPs > Domains**. انسخ سجلات DNS التي يعرضها Brevo إلى DNS في Squarespace حرفياً:

- DKIM: سجل TXT أو CNAME بالقيمة التي يصدرها Brevo.
- SPF: ادمج قيمة Brevo في سجل SPF الحالي؛ يجب ألا يوجد أكثر من سجل SPF واحد للنطاق.
- DMARC: ابدأ بسياسة مراقبة مثل `p=none` ثم شددها بعد مراجعة التقارير.

لا توجد قيمة DKIM ثابتة عامة؛ استخدم الاسم والقيمة اللذين يولدهما Brevo لنطاقك.

## 4. الاختبار

```powershell
cd backend
.\mvnw.cmd test
.\mvnw.cmd clean package
```

بعد النشر اختبر التسجيل والتحقق واستعادة كلمة المرور ودعوة الورشة. تأكد أن روابط الإنتاج لا تحتوي `localhost` وأن اسم المرسل هو «تساهيل».

## 5. معالجة المشاكل

- **Authentication failed:** تأكد أن `MAIL_USERNAME` هو SMTP login وأن `MAIL_PASSWORD` هو SMTP key وليس API key.
- **Sender not verified / From rejected:** وثق `MAIL_FROM` أو النطاق داخل Brevo.
- **Spam:** أكمل SPF وDKIM وDMARC، ولا تستخدم عنوان From غير موثق.
- **Timeout:** اسمح بخروج TCP إلى `smtp-relay.brevo.com:587` وتأكد من STARTTLS.
- **تعطيل آمن:** عيّن `MAIL_ENABLED=false`. سيقلع التطبيق دون SMTP ولن تُطبع رموز OTP في السجلات.
