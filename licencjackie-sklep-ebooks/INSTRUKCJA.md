# Instrukcja Wdrożenia - Krok po Kroku

## Przygotowanie

### 1. Konto Stripe

1. Załóż konto na [stripe.com](https://stripe.com)
2. Przejdź do **Developers > API Keys**
3. Skopiuj:
   - `Publishable key` (pk_test_... lub pk_live_...)
   - `Secret key` (sk_test_... lub sk_live_...)

### 2. AWS CLI

```bash
# Sprawdź czy masz zainstalowane
aws --version

# Jeśli nie, zainstaluj
# Windows: https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2-windows.html
# Mac: brew install awscli
# Linux: curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip" && unzip awscliv2.zip && sudo ./aws/install

# Skonfiguruj
aws configure
# Podaj: Access Key ID, Secret Access Key, Region (eu-central-1), Output format (json)
```

### 3. Weryfikacja domeny w AWS SES

```bash
# Zweryfikuj email (dla testów)
aws ses verify-email-identity --email-address sklep@licencjackie.pl --region eu-central-1

# Lub całą domenę (dla produkcji)
aws ses verify-domain-identity --domain licencjackie.pl --region eu-central-1
```

⚠️ **Ważne**: SES domyślnie jest w trybie sandbox - możesz wysyłać tylko na zweryfikowane adresy. 
Aby wysyłać do wszystkich, musisz złożyć wniosek o wyjście z sandbox:
https://console.aws.amazon.com/ses/home#/account

---

## Deployment

### 1. Skopiuj pliki do projektu

```bash
# Skopiuj folder aws-lambda do głównego katalogu projektu
cp -r aws-lambda/ d:/licencjackie.pl/

# Skopiuj strony sklepu
cp -r src/pages/sklep/ d:/licencjackie.pl/src/pages/

# Skopiuj skrypt deployment
cp deploy-aws.sh d:/licencjackie.pl/
```

### 2. Ustaw zmienne środowiskowe

```bash
# Windows (PowerShell)
$env:STRIPE_SECRET_KEY="sk_test_your_key_here"
$env:STRIPE_WEBHOOK_SECRET="whsec_your_secret_here"  # Ustawisz po kroku 4

# Linux/Mac
export STRIPE_SECRET_KEY="sk_test_your_key_here"
export STRIPE_WEBHOOK_SECRET="whsec_your_secret_here"
```

### 3. Uruchom deployment

```bash
cd d:/licencjackie.pl

# Nadaj uprawnienia (Linux/Mac/Git Bash)
chmod +x deploy-aws.sh

# Uruchom
./deploy-aws.sh
```

Skrypt wyświetli API URL, np:
```
API Endpoints:
  POST https://abc123xyz.execute-api.eu-central-1.amazonaws.com/prod/create-checkout
  POST https://abc123xyz.execute-api.eu-central-1.amazonaws.com/prod/webhook
```

### 4. Skonfiguruj Stripe Webhook

1. Przejdź do **Stripe Dashboard > Developers > Webhooks**
2. Kliknij **Add endpoint**
3. Wpisz URL: `https://YOUR_API_ID.execute-api.eu-central-1.amazonaws.com/prod/webhook`
4. Wybierz events:
   - `checkout.session.completed`
   - `checkout.session.async_payment_succeeded`
5. Skopiuj **Signing secret** (whsec_...)
6. Zaktualizuj zmienną `STRIPE_WEBHOOK_SECRET` i uruchom deployment ponownie

### 5. Wgraj ebooki do S3

```bash
# Struktura plików w S3:
# s3://licencjackie-ebooks/ebooks/poradnik-praca-licencjacka.pdf
# s3://licencjackie-ebooks/ebooks/metodologia-badan.pdf
# s3://licencjackie-ebooks/ebooks/pakiet-kompletny.zip

aws s3 cp twoj-ebook.pdf s3://licencjackie-ebooks/ebooks/poradnik-praca-licencjacka.pdf
aws s3 cp metodologia.pdf s3://licencjackie-ebooks/ebooks/metodologia-badan.pdf
aws s3 cp pakiet.zip s3://licencjackie-ebooks/ebooks/pakiet-kompletny.zip
```

### 6. Zaktualizuj Astro config

W pliku `src/pages/sklep/index.astro` zmień:

```javascript
const API_URL = "https://YOUR_API_ID.execute-api.eu-central-1.amazonaws.com/prod";
```

Lub dodaj do `astro.config.mjs`:

```javascript
export default defineConfig({
  // ...
  vite: {
    define: {
      'import.meta.env.PUBLIC_API_URL': JSON.stringify('https://YOUR_API_ID.execute-api.eu-central-1.amazonaws.com/prod')
    }
  }
});
```

### 7. Zbuduj i wdróż stronę

```bash
npm run build
# Deploy dist/ na swój hosting (S3 + CloudFront)
```

---

## Testowanie

### 1. Test w trybie Stripe Test

Użyj testowych kart:
- **Sukces**: `4242 4242 4242 4242`
- **Wymaga 3D Secure**: `4000 0025 0000 3155`
- **Odrzucona**: `4000 0000 0000 0002`

Data ważności: dowolna przyszła data
CVC: dowolne 3 cyfry

### 2. Sprawdź logi Lambda

```bash
# Logi create-checkout
aws logs tail /aws/lambda/licencjackie-create-checkout --follow

# Logi webhook-handler
aws logs tail /aws/lambda/licencjackie-webhook-handler --follow
```

### 3. Test webhook lokalnie (opcjonalnie)

```bash
# Zainstaluj Stripe CLI
# https://stripe.com/docs/stripe-cli

stripe listen --forward-to https://YOUR_API_ID.execute-api.eu-central-1.amazonaws.com/prod/webhook
```

---

## Przejście na produkcję

1. **Zmień klucze Stripe** z `sk_test_` na `sk_live_`
2. **Stwórz nowy webhook** z produkcyjnym endpointem
3. **Wyjdź z SES sandbox** - złóż wniosek w konsoli AWS
4. **Przetestuj pełny flow** z prawdziwą płatnością (małą kwotą)

---

## Monitoring i utrzymanie

### Koszty miesięczne (szacunkowo)

| Przy 100 sprzedaży/mies | Koszt |
|------------------------|-------|
| Lambda | ~$0 (free tier) |
| API Gateway | ~$0.04 |
| S3 | ~$0.01 |
| SES | ~$0.01 |
| **Suma** | **~$0.06** |

### Przydatne komendy

```bash
# Sprawdź status funkcji
aws lambda get-function --function-name licencjackie-create-checkout

# Zaktualizuj zmienne środowiskowe
aws lambda update-function-configuration \
  --function-name licencjackie-webhook-handler \
  --environment "Variables={STRIPE_SECRET_KEY=sk_live_xxx,...}"

# Sprawdź logi błędów
aws logs filter-log-events \
  --log-group-name /aws/lambda/licencjackie-webhook-handler \
  --filter-pattern "ERROR"
```

---

## Rozwiązywanie problemów

### Email nie przychodzi
1. Sprawdź logi webhook-handler
2. Sprawdź czy email jest zweryfikowany w SES
3. Sprawdź folder SPAM

### Błąd CORS
1. Sprawdź czy domena w Lambda CORS_HEADERS zgadza się z Twoją domeną
2. Sprawdź konfigurację CORS w API Gateway

### Webhook nie działa
1. Sprawdź Stripe Dashboard > Webhooks > Recent deliveries
2. Sprawdź czy STRIPE_WEBHOOK_SECRET jest poprawny
3. Sprawdź logi Lambda

---

## Kontakt

Masz pytania? Napisz do mnie, chętnie pomogę z wdrożeniem!
