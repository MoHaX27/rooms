// ==UserScript==
// @name         Расшифровщик
// @namespace    http://tampermonkey.net/
// @version      3.4
// @description  Automatically decode Bnovo booking information
// @author       МоНаХ
// @match        https://online.bnovo.ru/booking/general/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=bnovo.ru
// @grant        GM_setClipboard
// @grant        unsafeWindow
// @grant        GM_xmlhttpRequest
// @connect      raw.githubusercontent.com
// ==/UserScript==

(function() {
    'use strict';

    function strHash(str) {
        const prime = 0x811C9DC5;
        let hash = prime;
        for (let i = 0; i < str.length; i++) {
            hash ^= str.charCodeAt(i);
            hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
        }
        return hash >>> 0;
    }
    function extractFromBookingPage(elem) {
        const Elem = document.querySelector(elem);

        if (Elem) {
            const AmountText = Elem.textContent.trim();
            return Math.abs(parseFloat(AmountText.replace(/\s|₽/g, '').replace(',', '.')));
        } else {
            console.log('Элемент не найден на странице бронирования: ', elem);
            return null;
        }
    }
    function parseDate(dateString) {
        const parts = dateString.match(/(\d{2})\.(\d{2})\.(\d{4}) \((\d{2}):(\d{2})\)/);
        return new Date(`${parts[3]}-${parts[2]}-${parts[1]}T${parts[4]}:${parts[5]}:00`);
    }
    function calculateDays(checkIn, checkOut) {
        const msPerDay = 24 * 60 * 60 * 1000;
        return Math.floor((checkOut - checkIn) / msPerDay); // Используем Math.floor, чтобы не включать день выезда
    }
    function calculateMonthlyDays(checkInDate, checkOutDate, isMorningCheckIn) {
        const adjustedCheckInDate = new Date(checkInDate);
        const adjustedCheckOutDate = new Date(checkOutDate);

        if (!isMorningCheckIn) {
            adjustedCheckInDate.setDate(adjustedCheckInDate.getDate() + 1);
        } else {
            adjustedCheckOutDate.setDate(adjustedCheckOutDate.getDate() - 1);
        }

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

            const key = isFirstMonth ? 1 : 2;
            result[key].days++;
            result[key].month = currentMonth;

            currentDate.setDate(currentDate.getDate() + 1);
        }

        return result;
    }

    // Extract booking information from the page
    function extractBookingInfo() {
		let rounded = (num, decimals) => Number(num.toFixed(decimals));

        const dateElement = document.querySelector('.form__room span.text__small');
        const guestsElement = document.querySelector('#guestsCount');

        const roomCategory = document.querySelector('.form__ellipsis').textContent.replace(/\s{2,}/g, ' ');
        console.log("Room category extracted:", roomCategory);
        console.log("Room category hash:", strHash(roomCategory));

        const roomNumber = document.querySelector('.form__room-number').textContent.replace(/[\s\u202f]/g, '');
        const tarif = strHash(document.querySelector('.form__inline.lh30').textContent);
		console.log("tarif:", tarif);

		if(tarif == 3841051839 || tarif == 2227469116){ return; } // вазовские брони в игнор

        const bazaId = document.querySelector('.offline-header.js-offline-header').getAttribute('data-account-id');
        console.log("bazaId:", bazaId);
        let discountReason = document.querySelector('.text.discountContainerReason');
        if(discountReason){
            discountReason = discountReason.textContent.replace(/\s{2,}/g, ' ');
            console.log("discountReason:", discountReason);
            console.log("discountReason hash:", strHash(discountReason));
        }
        const phoneField = document.querySelector('.form__inputs.input.m-transparent.guestChange');
        let phoneNumber;
        if (phoneField) {
            phoneNumber = phoneField.textContent || phoneField.value;
            phoneNumber = phoneNumber.replace(/[\s+]/g, '');
        }

        const discountAmount = Math.abs(extractFromBookingPage('.g-xl.status.m-text-green')); // Сумма скидки
        const summAmount = Math.abs(extractFromBookingPage('.g-xl')); // Стоимость без учета скидки
        const discountPercentage = ((Math.floor(discountAmount) / Math.floor(summAmount)) * 100).toFixed(0);

        var serviceName = 0;
        var servicePrice = 0;
        var serviceFoodCount = 0;
		var serviceMedCount = 0;

        // Parse total price
        const totalPrice = extractFromBookingPage('table.form__summary tbody tr th:nth-child(2)'); // Финальная стоимость со скидкой

        // Parse guest counts
        const adultsInput = guestsElement.querySelector('input[name="adults"]');
        const childrenInput = guestsElement.querySelector('input[name="children"]');
        const numAdults = parseInt(adultsInput.value) || 0;
        const numChildren = parseInt(childrenInput.value) || 0;

        const numTickets = numAdults + numChildren; // Общее количество гостей

        //console.log("Dates extracted:", datesText);
        const [checkInText, checkOutText] = dateElement.textContent.trim().split('–');
        const checkInDate = parseDate(checkInText.trim());
        const checkOutDate = parseDate(checkOutText.trim());
		if(checkInDate.getHours() != checkOutDate.getHours()){
			//alert("Расшифровка: Час заезда и выезда различается!");
		}
		checkOutDate.setHours(checkInDate.getHours());
        const isMorningCheckIn = checkInDate.getHours() < 13; // Заезд до 13:00

        const monthlyDays = calculateMonthlyDays(checkInDate, checkOutDate, isMorningCheckIn);
        console.log(monthlyDays[1], monthlyDays[2]);
        const numDays = monthlyDays[1].days + monthlyDays[2].days;

        // Format dates for display
        const formatDate = (date) => {
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            return `${day}.${month}`;
        };

        const adjustedCheckInDate = new Date(checkInDate);
        const adjustedCheckOutDate = new Date(checkOutDate);

        if (!isMorningCheckIn) {
            adjustedCheckInDate.setDate(adjustedCheckInDate.getDate() + 1);
        } else {
            adjustedCheckOutDate.setDate(adjustedCheckOutDate.getDate() - 1);
        }
        const formattedCheckIn = formatDate(adjustedCheckInDate);
        const formattedCheckOut = formatDate(adjustedCheckOutDate); // Вычитаем день выезда
        //console.log("Formatted dates:", formattedCheckIn, "-", formattedCheckOut);

		const serviceRows = document.querySelectorAll('.booking__service-row');
        if (serviceRows.length === 0) {
            console.warn('Услуги не найдены.');
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
			alert("Расшифровка: Тариф не найден!");
		}

		let summ = 0;
		if (room.maxBaseGuests != numAdults || room.maxExtraGuests != numChildren){
			//////alert("Расшифровка: Проверьте количество гостей, не совпадает с тарифом!");
		}

		let database = [];
		function addNumber(number, food, med, extra) {
			let existingEntry = database.find(entry => entry.number === number);

			if (existingEntry) {
				existingEntry.count += 1;
			} else {
				database.push({
					number: number,
					count: 1,
					food: food,
					med: med,
					extra: extra
				});
			}
		}
		const mainGuests = numTickets >= room.maxBaseGuests ? room.maxBaseGuests : numTickets;
	    	const extraGuests = numTickets >= room.maxBaseGuests ? (numTickets - room.maxBaseGuests) : 0;
	    	console.log("mainGuests: ", mainGuests, " extraGuests: ", extraGuests);
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
				addNumber(price, serviceFoodCount > 0 ? true : false, false, false);
				serviceFoodCount--;

			}else if(bazaId == 1535){ // АП
				let tempBasePrice = discountPercentage > 0 ? room.basePrice - (room.basePrice * (discountPercentage / 100)) : room.basePrice;
				let basePriceWithDisc = tempBasePrice * numDays;

				price = basePriceWithDisc + (serviceFoodCount > 0 ? (numDays * window.baza[bazaId].foodPrice) : 0) + (serviceMedCount > 0 ? (numDays * window.baza[bazaId].medicine) : 0);
				summ += price;
				addNumber(price, serviceFoodCount > 0 ? true : false, serviceMedCount > 0 ? true : false, false);
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
				addNumber(price, serviceFoodCount > 0 ? true : false, false, true);
				serviceFoodCount--;
			}else if(bazaId == 1535) { // АП
				let tempExtraPrice = discountPercentage > 0 ? room.extraPrice - (room.extraPrice * (discountPercentage / 100)) : room.extraPrice;
				let extraPriceWithDisc = tempExtraPrice * numDays;

				price = extraPriceWithDisc + (serviceFoodCount > 0 ? (numDays * window.baza[bazaId].foodPrice) : 0) + (serviceMedCount > 0 ? (numDays * window.baza[bazaId].medicine) : 0);
				summ += price;
				addNumber(price, serviceFoodCount > 0 ? true : false, serviceMedCount > 0 ? true : false, true);
				serviceFoodCount--;
				serviceMedCount--;
			}
		}
		console.log("Сумма брони: ", rounded(totalPrice, 0), " Расчет: ", summ);
		if(rounded(totalPrice, 0) != summ){
			alert("Расшифровка: Сумма брони не совпадает с расчетом! Проверьте бронь");
		}
		let output = '';
		for (let kek in database) {
			if (database.hasOwnProperty(kek)) {
				let entry = database[kek];
				if (entry.extra){ output += '       доп ';}
				output += `${entry.number}*${entry.count} `;
				output += entry.food ? 'c пит ' : 'без пит ' ;
				output += entry.med ? 'c леч        ' : '       ' ;
			}
		}
        output += `\t${formattedCheckIn}-${formattedCheckOut},         ${numDays} дн.\t${window.baza[bazaId].name} `;

        if(room.printName == "Стандарт" || room.printName == "Стандарт в 3х"){
            output += `\t${mainGuests}x ${room.printName}, ${roomNumber} `;
        }else{
            output += `\t${room.printName}, ${roomNumber} `;
        }
        output += `\t\t${phoneNumber} `;
        if(discountPercentage > 0){
            output += `\t${ discountPercentage }% ${ window.discount[strHash(discountReason)] ? window.discount[strHash(discountReason)].name : window.discount["null"].name}`;
        }

        console.log("Детали брони:", output);

        // Display the output on the page
        const resultDiv = document.createElement('div');
        resultDiv.style.padding = '10px';
        resultDiv.style.backgroundColor = '#e0f7fa';
        resultDiv.style.border = '1px solid #00acc1';
        resultDiv.style.marginTop = '10px';
        resultDiv.style.position = 'fixed';
        resultDiv.style.top = '10px';
        resultDiv.style.right = '10px';
        resultDiv.style.zIndex = '1000';
        resultDiv.textContent = `${output} ${bazaId}`;
        // document.body.appendChild(resultDiv);

        const targetElement = document.querySelector('.bookmarks__item.m-summary.d-tablet-none');

        if (targetElement) {
            // Создаем кнопку
            const button = document.createElement('button');
            button.classList.add('notes__submit', 'button', 'js-ym-send-hit'); // Добавляем классы

            // Уменьшаем ширину кнопки и добавляем закругленные углы
            button.style.cssText = `
            width: auto;
            border-radius: 4px !important; /* Принудительно применяем border-radius */
        `;

            // Добавляем текст кнопки
            const textDesktop = document.createElement('span');
            textDesktop.classList.add('d-mobile-none');
            textDesktop.textContent = 'Расшифровать';

            button.appendChild(textDesktop);

            // Создаем элемент для всплывающей подсказки
            const tooltip = document.createElement('div');
			if(rounded(totalPrice, 0) == summ){
				tooltip.textContent = 'Скопировано!';
				button.disabled = false; // Включаем кнопку
       			button.style.opacity = '1'; // Восстанавливаем прозрачность
			}else{
				tooltip.textContent = 'Ошибка: Сумма расчета!';
				button.disabled = true; // Выключаем кнопку
        		button.style.opacity = '0.5'; // Снижаем прозрачность
			}
            tooltip.style.cssText = `
            position: absolute;
            background-color: #333;
            color: #fff;
            padding: 5px 10px;
            border-radius: 4px;
            font-size: 12px;
            display: none;
            z-index: 1000;
            top: -130%;
            left: 50%;
            transform: translateX(-50%);
            margin-top: 5px;
            opacity: 0;
            transition: opacity 0.3s ease-in-out;
        `;

            // Обертка для кнопки и подсказки
            const buttonWrapper = document.createElement('div');
            buttonWrapper.style.cssText = `
            position: relative;
            display: inline-block;
        `;
            buttonWrapper.appendChild(button);
            buttonWrapper.appendChild(tooltip);

            // Добавляем обработчик события для кнопки
            button.addEventListener('click', () => {
		if(rounded(totalPrice, 0) == summ){
                	GM_setClipboard(output, 'text');
		}

                // Показываем подсказку с fade in эффектом
                tooltip.style.display = 'block';
                setTimeout(() => {
                    tooltip.style.opacity = '1';
                }, 10); // Небольшая задержка для запуска анимации

                // Скрываем подсказку с fade out эффектом через 2 секунды
                setTimeout(() => {
                    tooltip.style.opacity = '0';
                    setTimeout(() => {
                        tooltip.style.display = 'none';
                    }, 300); // Ждем завершения анимации fade out
                }, 1000);
            });

            // Вставляем кнопку после целевого элемента
            targetElement.insertAdjacentElement('afterend', buttonWrapper);
        } else {
            console.log('Элемент с классом bookmarks__item не найден.');
        }
    }
	function LoadMeems() {
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
					extractBookingInfo();
					//console.log('Данные категорий номеров:', window.roomCategories);
				} catch (e) {
					console.error('Ошибка загрузки данных:', e);
				}
			},
			onerror: function () {
				console.error('Ошибка сети.');
			}
		});
    }
	window.addEventListener('load', LoadMeems);
})();
