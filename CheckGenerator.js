// ==UserScript==
// @name         Excel check generator
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Загружает Excel-шаблон, вставляет данные, сохраняет
// @author       MoHaX
// @match        https://online.bnovo.ru/bookinggroup/general/*
// @grant        GM_xmlhttpRequest
// @grant        GM_setClipboard
// @require      https://cdnjs.cloudflare.com/ajax/libs/exceljs/4.3.0/exceljs.min.js
// ==/UserScript==

(function () {
    'use strict';
	let fullName, surname, formattedDate, formattedDatePlusWeek, dateCheckIn, dateCheckOut, bazaId, iDays, roomStatus;
	let bInit = false;
	let database = [];
	let totalSumm = 0;
	function safeMerge(sheet, range) {
		try {
			sheet.mergeCells(range);
		} catch (e) {
			if (!e.message.includes('Cannot merge already merged cells')) {
				throw e;
			}
			// Иначе — просто пропускаем, т.к. уже объединено
		}
	}
	function strHash(str) {
        const prime = 0x811C9DC5;
        let hash = prime;
        for (let i = 0; i < str.length; i++) {
            hash ^= str.charCodeAt(i);
            hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
        }
        return hash >>> 0;
    }
	function parseDate(dateString) {
        const parts = dateString.match(/(\d{2})\.(\d{2})\.(\d{4}) \((\d{2}):(\d{2})\)/);
        return new Date(`${parts[3]}-${parts[2]}-${parts[1]}T${parts[4]}:${parts[5]}:00`);
    }
	function calculateMonthlyDays(checkInDate, checkOutDate, isMorningCheckIn) {
        const adjustedCheckInDate = new Date(checkInDate);
        const adjustedCheckOutDate = new Date(checkOutDate);

        if (!isMorningCheckIn) 	adjustedCheckInDate.setDate(adjustedCheckInDate.getDate() + 1);
        else 					adjustedCheckOutDate.setDate(adjustedCheckOutDate.getDate() - 1);

        const result = {
            1: { days: 0, month: 0 },
            2: { days: 0, month: 0 }
        };

        let currentDate = new Date(adjustedCheckInDate);
        const firstMonth = adjustedCheckInDate.getMonth() + 1;
        const firstYear = adjustedCheckInDate.getFullYear();

        let monthTracker = 1;

        while (currentDate <= adjustedCheckOutDate) {
            const currentMonth = currentDate.getMonth() + 1;
            const isFirstMonth = currentMonth === firstMonth && currentDate.getFullYear() === firstYear;

            const key = (currentMonth == 7 || currentMonth == 8) ? 1 : 2;//isFirstMonth ? 1 : 2;
            result[key].days++;
            result[key].month = currentMonth;

            currentDate.setDate(currentDate.getDate() + 1);
        }

        return result;
    }

	async function extractBookingPage(url) {
        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'text/html',
                    'Content-Type': 'text/html',
                },
            });

            if (response.ok) {
                const html = await response.text();
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');

                return doc;
            } else {
                console.error('Ошибка при получении страницы бронирования: ', response.status);
                return null;
            }
        } catch (error) {
            console.error('Ошибка extractBookingPage: ', error);
            return null;
        }
    }

	async function extractBookingInfo(url) {
		let serviceName = 0;
        let servicePrice = 0;
        let serviceFoodCount = 0;
		let serviceMedCount = 0;

		let page = await extractBookingPage(url);
		const statusId = page.getElementById('previousStatus').value;
		if (statusId == 2) return; // Проверка брони на отмену

		const bookingNumber = page.querySelector('#bookingNumber')?.value || 'unk';
		const roomCategory	= page.querySelector('.form__ellipsis').textContent.replace(/\s{2,}/g, ' ');
		const roomNumber 	= page.querySelector('.form__room-number').textContent.replace(/\s{2,}/g, '');
		const tarif 		= strHash(page.querySelector('.form__inline.lh30').textContent);

        const numAdults 	= parseInt(page.querySelector('#guestsCount').querySelector('input[name="adults"]').value) || 0;
        const numChildren 	= parseInt(page.querySelector('#guestsCount').querySelector('input[name="children"]').value) || 0;
        const numTickets 	= numAdults + numChildren; // Общее количество гостей

		const [checkInText, checkOutText] = page.querySelector('.form__room span.text__small').textContent.trim().split('–');
        const checkInDate 	= parseDate(checkInText.trim());
        const checkOutDate 	= parseDate(checkOutText.trim());
		checkOutDate.setHours(checkInDate.getHours());
        const isMorningCheckIn = checkInDate.getHours() < 13; // Заезд до 13:00

		const monthlyDays = calculateMonthlyDays(checkInDate, checkOutDate, isMorningCheckIn);
        const numDays = monthlyDays[1].days + monthlyDays[2].days;
		iDays = numDays;
		const discountElement = page.querySelector('.g-xl.status.m-text-green');
		let discAmm;
		if (discountElement){
			discAmm = parseFloat(discountElement.textContent.trim().replace(/\s|₽/g, '').replace(',', '.'));
		}
		const discountAmount = Math.abs(discAmm); // Сумма скидки
        const summAmount = Math.abs(parseFloat(page.querySelector('.g-xl').textContent.trim().replace(/\s|₽/g, '').replace(',', '.'))); // Стоимость без учета скидки
        const discountPercentage = ((Math.floor(discountAmount) / Math.floor(summAmount)) * 100).toFixed(0);
		const totalPrice = Math.abs(parseFloat(page.querySelector('table.form__summary tbody tr th:nth-child(2)').textContent.trim().replace(/\s|₽/g, '').replace(',', '.'))); // Финальная стоимость со скидкой


		const serviceRows = page.querySelectorAll('.booking__service-row');
        if (serviceRows.length === 0) {
            //console.warn('Услуги не найдены.');
        }else{
			for (const card of serviceRows) {
				serviceName = card.querySelector('.booking__service-name').textContent.trim();
				servicePrice = Math.abs(parseFloat(card.querySelector('.booking__service-price').textContent.trim().replace(/\s|₽/g, '').replace(',', '.')));
				if(serviceName == "Питание"){ serviceFoodCount = servicePrice / (window.baza[bazaId].foodPrice * numDays); }
				if(serviceName == "_Лечение"){ serviceMedCount = servicePrice / (window.baza[bazaId].medicine * numDays); }
			}
		}

        const bFood = (tarif == 2711387350 || tarif == 1145766435 || tarif == 3136482944 || serviceFoodCount == numTickets);
		if(bFood){ serviceFoodCount = numTickets }
		const bMed = (tarif == 1145766435 || serviceMedCount == numTickets);
		if(bMed){ serviceMedCount = numTickets }
        let room = window.roomCategories[strHash(roomCategory)];
		if(!room){
			room = window.roomCategories[0];
			alert(`${bookingNumber}: Расшифровка: Тариф не найден!`);
		}

		let summ = 0;

		function addNumber(number, food, med, extra, roomName, roomsNumber) {
			let existingEntry = database.find(entry => entry.number === number);

			if (existingEntry) {
				existingEntry.count += 1;
				existingEntry.roomsNumber = `${existingEntry.roomsNumber.replace(` ${roomsNumber},`, '')} ${roomsNumber},`
			} else {
				database.push({
					number: number,
					count: 1,
					food: food,
					med: med,
					extra: extra,
					roomsNumber: ` ${roomsNumber},`,
					roomName: roomName
				});
			}
		}
		const mainGuests = numTickets >= room.maxBaseGuests ? room.maxBaseGuests : numTickets;
	    const extraGuests = numTickets >= room.maxBaseGuests ? (numTickets - room.maxBaseGuests) : 0;

		for (let i = 1; i <= mainGuests; i++) { // Расчет основных мест
			let price = 0;
			if(bazaId == 1534 || bazaId == 2756){ // Стрежень Гавань
				let basePrice = monthlyDays[1].month == 7 || monthlyDays[1].month == 8 ? room.baseOverPrice : room.basePrice;
				let tempBasePrice = discountPercentage > 0 ? basePrice - (basePrice * (discountPercentage / 100)) : basePrice;
				let basePriceWithDisc = tempBasePrice * monthlyDays[1].days;

				basePrice = monthlyDays[2].month == 7 || monthlyDays[2].month == 8 ? room.baseOverPrice : room.basePrice;
				tempBasePrice = discountPercentage > 0 ? basePrice - (basePrice * (discountPercentage / 100)) : basePrice;
				basePriceWithDisc += (tempBasePrice * monthlyDays[2].days);

				price = (room.maxBaseGuests / mainGuests * basePriceWithDisc) + (serviceFoodCount > 0 ? (numDays * window.baza[bazaId].foodPrice) : 0);
				summ += price;
				addNumber(price, serviceFoodCount > 0 ? true : false, false, false, room.checkName, roomNumber);
				serviceFoodCount--;

			}else if(bazaId == 1535){ // АП
				let tempBasePrice = discountPercentage > 0 ? room.basePrice - (room.basePrice * (discountPercentage / 100)) : room.basePrice;
				let basePriceWithDisc = tempBasePrice * numDays;

				price = basePriceWithDisc + (serviceFoodCount > 0 ? (numDays * window.baza[bazaId].foodPrice) : 0) + (serviceMedCount > 0 ? (numDays * window.baza[bazaId].medicine) : 0);
				summ += price;
				addNumber(price, serviceFoodCount > 0 ? true : false, serviceMedCount > 0 ? true : false, false, room.checkName, roomNumber.replace("-А",``).replace("-Б",``));
				serviceFoodCount--;
				serviceMedCount--;
			}
		}
		for (let i = 1; i <= extraGuests; i++) { // Расчет доп. мест
			let price = 0;
			if(bazaId == 1534 || bazaId == 2756) { // Стрежень Гавань
				let extraPrice = monthlyDays[1].month == 7 || monthlyDays[1].month == 8 ? room.extraOverPrice : room.extraPrice;
				let tempExtraPrice = discountPercentage > 0 ? extraPrice - (extraPrice * (discountPercentage / 100)) : extraPrice;
				let extraPriceWithDisc = tempExtraPrice * monthlyDays[1].days;

				extraPrice = monthlyDays[2].month == 7 || monthlyDays[2].month == 8 ? room.extraOverPrice : room.extraPrice;
				tempExtraPrice = discountPercentage > 0 ? extraPrice - (extraPrice * (discountPercentage / 100)) : extraPrice;
				extraPriceWithDisc += (tempExtraPrice * monthlyDays[2].days);

				price = extraPriceWithDisc + (serviceFoodCount > 0 ? (numDays * window.baza[bazaId].foodPrice) : 0);
				summ += price;
				addNumber(price, serviceFoodCount > 0 ? true : false, false, true, room.checkName, roomNumber);
				serviceFoodCount--;
			}else if(bazaId == 1535) { // АП
				let tempExtraPrice = discountPercentage > 0 ? room.extraPrice - (room.extraPrice * (discountPercentage / 100)) : room.extraPrice;
				let extraPriceWithDisc = tempExtraPrice * numDays;

				price = extraPriceWithDisc + (serviceFoodCount > 0 ? (numDays * window.baza[bazaId].foodPrice) : 0) + (serviceMedCount > 0 ? (numDays * window.baza[bazaId].medicine) : 0);
				summ += price;
				addNumber(price, serviceFoodCount > 0 ? true : false, serviceMedCount > 0 ? true : false, true, room.checkName, roomNumber.replace("-А",``).replace("-Б",``));
				serviceFoodCount--;
				serviceMedCount--;
			}
		}
		let rounded = (num, decimals) => Number(num.toFixed(decimals));
		console.log("Сумма брони: ", rounded(totalPrice, 0), " Расчет: ", summ);
		if(rounded(totalPrice, 0) != summ) alert(`${bookingNumber}: Сумма брони не совпадает с расчетом! Проверьте бронь`);

		totalSumm += summ;
	}

	async function extractBookingLinks() {
        let links = [];

        document.querySelectorAll('table.data-grid a[href*="/booking/general/"]').forEach(a => { links.push(a.href); } );

		if (links.length === 0) {
            console.error('Карточки бронирования не найдены.');
            return;
        }

        for (const card of links) {
            await extractBookingInfo(card);
        }
		bInit = true;
		console.log(database, totalSumm);
    }

	function loadScript(src, callback) {
		const script = document.createElement('script');
		script.src = src;
		script.onload = () => {
			if (typeof callback === 'function') {
				callback();
			}
		};
		document.head.appendChild(script);
	}

	function InitGenerator() {
		loadScript(`https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js` , function () { console.log('JSZip загружен!'); });
		loadScript(`https://cdn.jsdelivr.net/npm/qr-code-styling@1.5.0/lib/qr-code-styling.js` , function () { console.log('QR загружен!'); });

		bazaId = document.querySelector('.offline-header.js-offline-header').getAttribute('data-account-id');

		const dataElement = document.querySelector('.accordion__content');
		surname = dataElement.querySelector('input[name="surname"]').value.trim();
        const name = dataElement.querySelector('input[name="name"]').value.trim();
        const middlename = dataElement.querySelector('input[name="middlename"]').value.trim();
        fullName = [surname, name, middlename].filter(Boolean).join(' ');

		const currentDate = new Date();
		formattedDate = `${currentDate.getDate().toString().padStart(2, '0')}.${(currentDate.getMonth()+1).toString().padStart(2, '0')}.${currentDate.getFullYear()}`;
		const datePlusWeek = new Date(currentDate);
		datePlusWeek.setDate(datePlusWeek.getDate() + 7); // Добавляем 7 дней
		formattedDatePlusWeek = `${datePlusWeek.getDate().toString().padStart(2, '0')}.${(datePlusWeek.getMonth()+1).toString().padStart(2, '0')}.${datePlusWeek.getFullYear()}`;

		const row = document.querySelector('.data.bookingsSortTable.data-grid.js-sort');
		dateCheckIn = row.querySelector('td:nth-child(5)').textContent.replace('Заезд', '').trim();
		dateCheckOut = row.querySelector('td:nth-child(6)').textContent.replace('Выезд', '').trim();

		const url = 'https://raw.githubusercontent.com/MoHaX27/rooms/refs/heads/main/category.js';
        GM_xmlhttpRequest({
			method: 'GET',
			url: url,
			headers: {
				'Accept': 'text/plain'
			},
			onload: function (response) {
				try {
					eval(response.responseText);
					extractBookingLinks();
				} catch (e) {
					console.error('Ошибка загрузки данных:', e);
				}
			},
			onerror: function () {
				console.error('Ошибка сети.');
			}
		});
	}
	window.addEventListener('load', InitGenerator);
	document.addEventListener('click', async (e) => {
            const link = e.target.closest('a[href*="/booking/doc_predefined/"]');
            if (!link) return;
			e.preventDefault();
			if (!bInit) return;

            const urlqwe = link.href;

            try{
				GM_setClipboard(`${formattedDate}\t${surname}\t${window.baza[bazaId].name}`, 'text');
				const invoiceNumber = prompt('Введите номер счёта:');
				if(!invoiceNumber) return;

				let data = {
					fio: fullName,
					date: formattedDate,
					dateWeek: formattedDatePlusWeek,
					checkIn: dateCheckIn,
					checkOut: dateCheckOut,
					numDays: iDays,
					items: [ ]//{ name: 'Путевки на б/о "Стрежень" Стандарт 3х местный', count: 3, price: 2540 },
				};
				let totalSumm = 0;
				for (let kek in database) {
					if (database.hasOwnProperty(kek)) {
						let entry = database[kek];
						let itemName = ""
						if (!entry.extra){
							itemName = `Путевки на ${window.baza[bazaId].checkName}  ${entry.roomName}, ${entry.food ? "с питанием" : "без питания"}, ${entry.med ? "с лечением," : ""}${entry.roomsNumber}`;
						}else{
							itemName = `Путевки на ${window.baza[bazaId].checkName} Доп. место в ${entry.roomName}, ${entry.food ? "с питанием" : "без питания"}, ${entry.med ? "с лечением," : ""}${entry.roomsNumber}`;
						}
						data.items.push({ name: itemName, count: entry.count, price: entry.number });
						totalSumm += entry.count * entry.number;
					}
				}

				const response = await fetch('https://gleaming-quokka-52212a.netlify.app/images/ticket.xlsx');
				const arrayBuffer = await response.arrayBuffer();

				const workbook = new ExcelJS.Workbook();
				await workbook.xlsx.load(arrayBuffer);
				const sheet = workbook.worksheets[0]; // Получаем первый лист

				// Заменяем шаблонные значения
				sheet.eachRow((row, rowNumber) => {
					row.eachCell((cell, colNumber) => {
						if (cell.value && typeof cell.value === 'string') {
							cell.value = cell.value
								.replace('{FIO}', data.fio)
								.replace('{date}', data.date)
								.replace('{dateWeek}', data.dateWeek)
								.replace('{dateIn}', data.checkIn)
								.replace('{dateOut}', data.checkOut)
								.replace('СЧЕТ № 000', `СЧЕТ № ${invoiceNumber}`)
								.replace('{numDays}', data.numDays);
						}
					});
				});

				let rowStart = 17;
				sheet.spliceRows(rowStart, 1);
				data.items.forEach((item, index) => {
					const sum = item.count * item.price;
					sheet.spliceRows(rowStart + index, 0,
						[index + 1, item.name, 'шт.', item.count, item.price, sum]
					);

					const row = sheet.getRow(rowStart + index);
					row.alignment = { wrapText: true, vertical: 'middle', horizontal: 'center' };
					row.getCell(5).numFmt = '# ##0.00'; // Цена
					row.getCell(6).numFmt = '# ##0.00'; // Сумма
					row.getCell(6).value = {
						formula: `PRODUCT(D${rowStart + index},E${rowStart + index})`,
					};
				});

				// Подсчёт итога
				const totalRow = rowStart + data.items.length;
				sheet.getCell(`F${totalRow}`).value = {
					formula: `SUM(F17:F${totalRow - 1})`,
				};

				safeMerge(sheet, `D${totalRow}:E${totalRow}`);
				safeMerge(sheet, `A${26 + data.items.length - 1}:D${26 + data.items.length - 1}`);
				safeMerge(sheet, `E${26 + data.items.length - 1}:F${26 + data.items.length - 1}`);
				// Сохраняем границы ячеек
				sheet.eachRow((row, rowNumber) => {
					row.eachCell((cell, colNumber) => {
						if (!cell.border) {
							cell.border = {
								top: { style: 'thin' },
								left: { style: 'thin' },
								bottom: { style: 'thin' },
								right: { style: 'thin' }
							};
						}
					});
				});

				// Скачать готовый файл
				const buffer = await workbook.xlsx.writeBuffer();
				const blob = new Blob([buffer], { type: 'application/octet-stream' });
				const sumFormatted = Math.round(totalSumm * 100);
				const qrString =
                    `ST00012|` +
                    `|PersonalAcc=40702810254400005692` +
                    `|BIC=043601607` +
                    `|CorrespAcc=30101810200000000607` +
                    `|PayeeINN=6321261326` +
                    `|Sum=${sumFormatted}` +
                    `|Purpose=${invoiceNumber} qr`;

				let qr = new QRCodeStyling({
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

				let container = document.createElement('div');
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


				container.innerHTML = '';
				qr.append(container);

				const zip = await JSZip.loadAsync(blob);

				const qrCanvas = container.querySelector('canvas');
                const qrDataUrl = qrCanvas.toDataURL('image/png');
                const qrBlob = await fetch(qrDataUrl)
                    .then(response => response.blob());
                const qrBinary = await qrBlob.arrayBuffer();
                const newImageFileName = 'image1.png';
                zip.file(`xl/media/${newImageFileName}`, qrBinary);

                const newBlob = await zip.generateAsync({ type: 'blob' });
                const a = document.createElement('a');
                a.href = URL.createObjectURL(newBlob);
				a.download = `${invoiceNumber}, ${surname}, ${window.baza[bazaId].name}.xlsx`;
				a.click();
				URL.revokeObjectURL(a.href);

			} catch (err) {
                console.error('Ошибка при обработке счёта:', err);
                alert('Не удалось сгенерировать счёт');
            }
        });
})();
