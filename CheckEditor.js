// ==UserScript==
// @name         Модификатор счета
// @namespace    http://tampermonkey.net/
// @version      2.1
// @description  Перехват DOCX, генерация QR и замена картинки прямо в документе
// @match        https://online.bnovo.ru/booking/general/*
// @grant        none
// @icon         https://www.google.com/s2/favicons?sz=64&domain=bnovo.ru
// @run-at       document-idle
// ==/UserScript==

(function () {
    'use strict';
	let qr, bookingNumber, container, surname, bazaId;
	function insertSchetFL() {
        const root = document.querySelector('span.d-mobile-none.g-ml-auto');
        if (!root) {
            console.warn('Не найден контейнер с шаблонами');
            return;
        }

        const bookingId = document.querySelector('input[name="booking_id"]')?.value;
        const guestId = document.querySelector('input[name="customer_id"]')?.value;
        surname = document.querySelector('input[name="surname"]')?.value || '';
        const name = document.querySelector('input[name="name"]')?.value || '';
        const guestName = (surname + name).replace(/\s/g, '');

        if (!bookingId || !guestId || !guestName) {
            console.warn('Недостаточно данных для вставки ссылки');
            return;
        }

        const schetFLLink = [...root.querySelectorAll('.drop__link')]
            .find(el => el.textContent.includes('счетФЛ'));

        if (!schetFLLink) {
            console.warn("Элемент 'счетФЛ' не найден");
            return;
        }

        const sublinksDiv = schetFLLink.nextElementSibling;
        if (!sublinksDiv || !sublinksDiv.classList.contains('drop__sublinks')) {
            console.warn('Блок .drop__sublinks не найден');
            return;
        }

        // Если ссылка уже есть, не добавляем повторно
        const existingLink = sublinksDiv.querySelector(`a[href*="template=счетФЛ"]`);
        if (existingLink) {
            console.log('Ссылка уже существует:', existingLink.href);
            return;
        }

        const newA = document.createElement('a');
        newA.className = 'drop__link';
        newA.target = '_blank';
        newA.href = `/booking/doc/${bookingId}/?template=счетФЛ&guest=${guestId}&type=doc`;
        newA.textContent = guestName;

        sublinksDiv.appendChild(newA);
        sublinksDiv.style.display = 'block';

        console.log('✅ Ссылка счетФЛ успешно добавлена:', newA.outerHTML);
    }

    // Дождёмся загрузки DOM и затем дождёмся появления нужного блока
    window.addEventListener('load', () => {
        const interval = setInterval(() => {
            const ready = document.querySelector('span.d-mobile-none.g-ml-auto') &&
                          document.querySelector('input[name="booking_id"]') &&
                          document.querySelector('input[name="customer_id"]') &&
                          document.querySelector('input[name="surname"]') &&
                          document.querySelector('input[name="name"]');
            if (ready) {
                clearInterval(interval);
                insertSchetFL();
            }
        }, 300);
    });

	 window.baza = {
        "1535": {
            name: "АП",
            foodPrice: 1420,
            medicine: 1200
        },
        "1534": {
            name: "Стрежень",
            foodPrice: 1130
        },
        "2756": {
            name: "ГГ",
            foodPrice: 1130
        }
    };
	const loadScripts = async () => {
        const jszip = await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js');
        await loadScript('https://cdn.jsdelivr.net/npm/qr-code-styling@1.5.0/lib/qr-code-styling.js');
        return jszip;
    };

    const loadScript = (src) => new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        document.head.appendChild(script);
    });

    function extractFromBookingPage(elem) {
        const Elem = document.querySelector(elem);
        if (Elem) {
            const AmountText = Elem.textContent.trim();
            return Math.abs(parseFloat(AmountText.replace(/\s|₽/g, '').replace(',', '.')));
        } else {
            console.log('Сумма не найдена: ', elem);
            return null;
        }
    }
	
	function LoadMeems() {
		surname = document.querySelector('input[name="surname"]').value.trim();
		bazaId = document.querySelector('.offline-header.js-offline-header').getAttribute('data-account-id');
		bookingNumber = document.querySelector('#bookingNumber')?.value || 'unk';
        const sum = extractFromBookingPage('table.form__summary tbody tr th:nth-child(2)') || 0.00;
        const sumFormatted = Math.round(sum * 100);

        const qrString =
                    `ST00012|` +
                    `|PersonalAcc=40702810254400005692` +
                    `|BIC=043601607` +
                    `|CorrespAcc=30101810200000000607` +
                    `|PayeeINN=6321261326` +
                    `|Sum=${sumFormatted}` +
                    `|Purpose=${bookingNumber} qr`;

		qr = new QRCodeStyling({
                    width: 256,
                    height: 256,
                    type: "canvas",
                    data: qrString,
                    image: "",
                    dotsOptions: {
                        color: "#000",
                        type: "square"
                    },
                    backgroundOptions: {
                        color: "#ffffff", // Обеспечим белый фон
                    },
                    qrOptions: {
                        errorCorrectionLevel: "L"
                    }
		});
		container = document.getElementById('qr-container');
		if (!container) {
			container = document.createElement('div');
			container.id = 'qr-container';
			Object.assign(container.style, {
				position: 'fixed',
				bottom: '80px',
				right: '20px',
				backgroundColor: '#fff',
				padding: '10px',
				border: '1px solid #ccc',
				zIndex: 9999
			});
			//document.body.appendChild(container);
		}

		container.innerHTML = '';
		qr.append(container);
    }

    loadScripts().then(() => {
		LoadMeems();
        document.addEventListener('click', async (e) => {
            const link = e.target.closest('a[href*="/booking/doc/"]');
            if (!link) return;

            e.preventDefault();
            const url = link.href;

            try {
				const currentDate = new Date();
				const datePlusWeek = new Date(currentDate);
				datePlusWeek.setDate(datePlusWeek.getDate() + 7); // Добавляем 7 дней
				const formattedDatePlusWeek = `${datePlusWeek.getDate().toString().padStart(2, '0')}.${(datePlusWeek.getMonth()+1).toString().padStart(2, '0')}.${datePlusWeek.getFullYear()}`;

                const response = await fetch(url);
                const blob = await response.blob();
                const zip = await JSZip.loadAsync(blob);
				let docXml = await zip.file('word/document.xml').async('string');
                docXml = docXml.replace(`<w:r><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/><w:b/><w:bCs/><w:sz w:val="20"/><w:szCs w:val="20"/><w:lang w:eastAsia="ru-RU"/></w:rPr><w:t xml:space="preserve">до  </w:t></w:r><w:r w:rsidRPr="00CA627F"><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/><w:b/><w:bCs/><w:sz w:val="20"/><w:szCs w:val="20"/><w:lang w:eastAsia="ru-RU"/></w:rPr><w:t>20</w:t></w:r><w:r w:rsidR="00323E5D"><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/><w:b/><w:bCs/><w:sz w:val="20"/><w:szCs w:val="20"/><w:lang w:eastAsia="ru-RU"/></w:rPr><w:t>2</w:t></w:r><w:r w:rsidR="00F463CD"><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/><w:b/><w:bCs/><w:sz w:val="20"/><w:szCs w:val="20"/><w:lang w:eastAsia="ru-RU"/></w:rPr><w:t>5</w:t></w:r>`,
										`<w:r><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/><w:b/><w:bCs/><w:sz w:val="20"/><w:szCs w:val="20"/><w:lang w:eastAsia="ru-RU"/></w:rPr><w:t xml:space="preserve">до  ${formattedDatePlusWeek}</w:t></w:r>`);
				zip.file('word/document.xml', docXml);
				const qrCanvas = container.querySelector('canvas');
                // Преобразуем канвас в DataURL
                const qrDataUrl = qrCanvas.toDataURL('image/png');
                // Конвертируем DataURL в Blob
                const qrBlob = await fetch(qrDataUrl)
                    .then(response => response.blob());

                const qrBinary = await qrBlob.arrayBuffer();

                // Заменим оригинальное изображение в DOCX
                const newImageFileName = 'image1.png'; // имя, которое уже используется в DOCX
                zip.file(`word/media/${newImageFileName}`, qrBinary);

                // Сгенерировать новый файл .docx
                const newBlob = await zip.generateAsync({ type: 'blob' });
                const a = document.createElement('a');
                a.href = URL.createObjectURL(newBlob);
                a.download = `${bookingNumber}, ${surname}, ${window.baza[bazaId].name}.docx`;
                a.click();
                URL.revokeObjectURL(a.href);

            } catch (err) {
                console.error('Ошибка при обработке DOCX:', err);
                alert('Не удалось заменить QR-код.');
            }
        });
    });
})();
