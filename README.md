# VexaAI

## راه‌اندازی ربات

1. پیش‌نیازها را نصب کنید:

   ```bash
   pip install -r requirements.txt
   ```

2. متغیرهای محیطی موردنیاز را تنظیم کنید (مقدار آن‌ها در secrets ذخیره شده است):

   ```bash
   export RUNWAY_API=<Runway API Key>
   export BOT_TOKEN=<Telegram Bot Token>
   ```

3. ربات را اجرا کنید:

   ```bash
   python bot.py
   ```

هر پیامی که به ربات ارسال کنید به عنوان پرامپت به سرویس Runway فرستاده می‌شود و نتیجه به صورت تصویر برگشت داده می‌شود.