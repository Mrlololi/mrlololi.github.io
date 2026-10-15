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

GitHub Pages сам выложит новую версию на https://mrlololi.github.io примерно через минуту. Настройки Pages: Deploy from branch, ветка `main`, папка `/ (root)`.

Портфолио живёт в отдельном репозитории `Webprojekte` и открывается по адресу https://mrlololi.github.io/Webprojekte/. Этот сайт его не трогает. Не создавай здесь папки `Webprojekte`, `GeoAPP` или `KittyCats`.

## Позже: свой домен mrlololi.com

Пока этого не делаем, шаги на будущее:

1. Купить `mrlololi.com` (Cloudflare Registrar или Namecheap).
2. GitHub: Profile Settings, Pages, «Add a domain». Добавить у регистратора TXT-запись `_github-pages-challenge-mrlololi.mrlololi.com` с выданным значением и нажать Verify. TXT-запись не удалять.
3. Репозиторий: Settings, Pages, Custom domain `mrlololi.com`, Save. Это создаст файл `CNAME` в ветке.
4. DNS у регистратора:
   - A-записи для корня: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - AAAA-записи: `2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153`, `2606:50c0:8003::153`
   - `www`: CNAME на `mrlololi.github.io`
   - Никаких wildcard-записей. В Cloudflare DNS эти записи ставить в режим «DNS only» (серое облако).
5. Когда DNS разойдётся, включить «Enforce HTTPS».
6. В `src/config.json` поменять `site_url` на `https://mrlololi.com`, пересобрать (canonical, hreflang, sitemap и og-ссылки обновятся сами) и опубликовать. Картинки для соцсетей пересобирать не нужно.
7. По желанию e-mail: бесплатная пересылка `hello@mrlololi.com` на Gmail через Cloudflare Email Routing. Потом поменять `contact_email` в `src/config.json`, пересобрать и опубликовать (Impressum и Datenschutz обновятся сами).

После подключения домена GitHub автоматически отдаёт портфолио по адресу mrlololi.com/Webprojekte/.
