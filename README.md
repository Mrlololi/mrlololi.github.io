# mrlololi.github.io

Сайт Ивы Цацкриалашвили (mrlololi): маркетинг-автоматизация и техника для запусков онлайн-курсов. Немецкий по умолчанию (`/`), английский на `/en/`, правовые страницы, 404.

Статичный сайт: обычные HTML, CSS и JavaScript без фреймворков. GitHub Pages раздаёт файлы из корня ветки `main` как есть, ничего на сервере не собирается. Шрифты и GSAP лежат в самом репозитории: сайт не делает ни одного запроса к чужим серверам, не ставит cookies и не использует аналитику.

## Где что лежит

| Что | Где |
|---|---|
| Все тексты сайта (DE) | `src/content/de.mjs` |
| Все тексты сайта (EN) | `src/content/en.mjs` |
| E-mail, ссылки, адрес сайта, ссылка на запись, UID | `src/config.json` |
| Стили (цвета, шрифты, отступы) | `assets/css/main.css` (при сборке встраивается в каждую страницу) |
| Анимации, меню, калькулятор | `assets/js/main.js`, формула калькулятора: `assets/js/calc.js` |
| Шаблоны страниц | `src/templates/` |
| Исходники картинок | `src/images/` |
| Готовые страницы (их и раздаёт GitHub Pages) | `index.html`, `en/`, `impressum/`, `datenschutz/`, `404.html` и т. д. |

Готовые HTML-файлы собираются из `src/` и тоже лежат в репозитории. **Руками их не правь**: при следующей сборке изменения пропадут.

## Один раз на новом компьютере

Нужен Node.js (LTS). В папке `site`:

```bash
npm install
npm run browsers
```

Вторая команда ставит браузер для проверок в папку `../.playwright-browsers`, не в систему.

## Поменять цену или фразу

1. Открой `src/content/de.mjs` и поправь текст. Потом то же место в `src/content/en.mjs`.
   - Цены лежат в блоке `pricing`, строка про НДС в `smallPrint`.
   - Правила для текстов: без длинных и средних тире (только обычный дефис), без эмодзи, немецкий на «Sie». `npm test` это проверяет.
2. Собери и проверь:

```bash
npm run build
```

```bash
npm test
```

3. Посмотри результат локально (см. «Проверки» ниже) и опубликуй (см. «Публикация»).

**Ссылка на запись** (Calendly и т. п.): впиши её в `booking_url` в `src/config.json` и пересобери. Появятся кнопка «Termin buchen» / «Book a call» и раздел про запись в Datenschutz.
**UID**, когда он появится: впиши в `uid` в `src/config.json` и пересобери. В Impressum появится строка «UID-Nummer».

## Картинки, шрифты, иконки

Обычно не нужно. Если поменял портрет (`src/images/portrait-source.png`) или скриншот кейса:

```bash
npm run assets
```

Скриншот главной alexandrafry.ch переснимается командой `node src/tools/capture-case.mjs` (баннер cookie скрывается через CSS, на кнопки скрипт не нажимает). Нужно указать селекторы баннера, см. комментарий в файле.

## Проверки

```bash
npm run qa
```

Проверяет всё из брифа: снимки всех страниц на 375, 768, 1280 и 1440 px, режим без анимации, работу без JavaScript, «ни одного внешнего запроса», доступность (axe), Lighthouse (мобильный), ссылки, тексты без длинных тире и эмодзи, проход только с клавиатуры и вес JavaScript. Отчёт пишется в `../qa/report.md`, снимки в `../qa/shots/`. Lighthouse занимает пару минут. Без него:

```bash
node src/qa/run-all.mjs --no-lighthouse
```

## Публикация

```bash
git add -A
git commit -m "Preise aktualisiert"
git push
```

GitHub Pages сам выложит новую версию на https://mrlololi.com примерно через минуту. Настройки Pages: Deploy from branch, ветка `main`, папка `/ (root)`, Custom domain `mrlololi.com`, Enforce HTTPS включён.

Портфолио живёт в отдельном репозитории `Webprojekte` и открывается по адресу https://mrlololi.com/Webprojekte/. Этот сайт его не трогает. Не создавай здесь папки `Webprojekte`, `GeoAPP` или `KittyCats`.

## Домен mrlololi.com

Сайт живёт на https://mrlololi.com. Адреса https://mrlololi.github.io и https://www.mrlololi.com GitHub сам перенаправляет туда.

- Файл `CNAME` в корне создаёт `npm run build` из `site_url` в `src/config.json`. Руками его не правь и не удаляй: без него GitHub отключит домен. Тест `npm test` проверяет, что он на месте.
- Домен подтверждён в GitHub (Profile Settings, Pages, Verified domains). TXT-запись `_github-pages-challenge-mrlololi` в DNS не удалять.
- DNS в Cloudflare, все записи «DNS only» (серое облако):
  - A для корня: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
  - AAAA: `2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153`, `2606:50c0:8003::153`
  - `www`: CNAME на `mrlololi.github.io`
  - Никаких wildcard-записей.
- Проверка живого сайта, включая перенаправления и портфолио: `node src/qa/live.mjs`.

Позже по желанию: пересылка `hello@mrlololi.com` на Gmail (например, Cloudflare Email Routing). Потом поменять `contact_email` в `src/config.json`, пересобрать и опубликовать (Impressum и Datenschutz обновятся сами).
