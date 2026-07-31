# متغيرات بيئة منصة تساهيل

## الباكند — Oracle Cloud / Docker

| المتغير | المصدر | مطلوب | الافتراضي |
|---|---|---:|---|
| `SPRING_DATASOURCE_URL` | PostgreSQL / Supabase | نعم | — |
| `SPRING_DATASOURCE_USERNAME` | PostgreSQL / Supabase | نعم | — |
| `SPRING_DATASOURCE_PASSWORD` | PostgreSQL / Supabase | نعم | — |
| `SPRING_PROFILES_ACTIVE` | ثابت | نعم | `prod` |
| `APPLICATION_JWT_SECRET` | سر 256-bit | نعم | — |
| `MAIL_HOST` | Brevo SMTP | نعم | `smtp-relay.brevo.com` |
| `MAIL_PORT` | Brevo SMTP | نعم | `587` |
| `MAIL_USERNAME` | Brevo SMTP login | نعم | — |
| `MAIL_PASSWORD` | Brevo SMTP key | نعم | — |
| `MAIL_FROM` | مرسل موثق | نعم | `noreply@salabaa.com` |
| `MAIL_FROM_NAME` | اسم المرسل | نعم | `تساهيل` |
| `MAIL_ENABLED` | ثابت | نعم | `true` |
| `CUSTOMER_APP_URL` | Vercel | نعم | `https://tasaheel-customer.vercel.app` |
| `WORKSHOP_APP_URL` | Vercel | نعم | `https://tasaheel-workshop.vercel.app` |
| `APPLICATION_UPLOAD_DIR` | التخزين المحلي الاحتياطي | لا | `/tmp/tasaheel/uploads` |
| `MOYASAR_SECRET_KEY` | Moyasar | لا | — |
| `GOOGLE_MAPS_API_KEY` | Google Cloud | لا | — |
| `GEMINI_API_KEY` | Google AI | لا | — |

تفاصيل إعداد Brevo وDNS موثقة في [BREVO_EMAIL_SETUP.md](BREVO_EMAIL_SETUP.md).

## الواجهات — Vercel

تستخدم واجهات العميل والورشة والإدارة:

| المتغير | القيمة |
|---|---|
| `VITE_API_URL` | `https://api.salabaa.com/api` |

## التطوير المحلي

اترك `MAIL_ENABLED=false` إذا لم تتوفر بيانات SMTP. سيعمل الباكند، لكن لن يرسل البريد ولن يطبع OTP أو أسراراً في السجلات.
