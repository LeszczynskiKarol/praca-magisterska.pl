# Sklep z Ebookami - Implementacja dla licencjackie.pl

## Architektura rozwiązania

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Astro Site    │────▶│   API Gateway   │────▶│     Lambda      │
│   (S3/CF)       │     │                 │     │ create-checkout │
└─────────────────┘     └─────────────────┘     └────────┬────────┘
                                                         │
                                                         ▼
                                                ┌─────────────────┐
                                                │     Stripe      │
                                                │    Checkout     │
                                                └────────┬────────┘
                                                         │
                                                         ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    S3 Bucket    │◀────│     Lambda      │◀────│ Stripe Webhook  │
│   (ebooki)      │     │ webhook-handler │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │
         ▼
┌─────────────────┐
│   SES Email     │
│ (link download) │
└─────────────────┘
```

## Szacunkowe koszty miesięczne

| Usługa | Darmowy tier | Koszt po przekroczeniu |
|--------|-------------|------------------------|
| Lambda | 1M requestów/mies | $0.20 za 1M |
| API Gateway | - | $3.50 za 1M requestów |
| S3 | 5GB storage | ~$0.023/GB |
| SES | 3000 emaili/mies (z EC2) | $0.10 za 1000 |

**Przy 100 sprzedaży/miesiąc: praktycznie $0**

## Struktura plików

```
licencjackie.pl/
├── src/
│   └── pages/
│       └── sklep/
│           ├── index.astro          # Lista ebooków
│           ├── sukces.astro         # Strona po udanej płatności
│           └── anulowano.astro      # Strona po anulowaniu
├── aws-lambda/
│   ├── create-checkout/
│   │   ├── index.mjs
│   │   └── package.json
│   ├── webhook-handler/
│   │   ├── index.mjs
│   │   └── package.json
│   └── products.json                # Definicja produktów
└── deploy-aws.sh                    # Skrypt deployment
```

## Wymagania

1. Konto Stripe (test + produkcja)
2. AWS CLI skonfigurowane
3. Zweryfikowana domena w AWS SES
4. Node.js 18+
