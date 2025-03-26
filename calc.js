// ==UserScript==
// @name         Rooms Calc
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Калькулятор стоимости номера
// @author       MoHaX
// @match        https://online.bnovo.ru/planning*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Данные о ценах в виде объекта, добавляем цену дополнительного места
    const priceLow = {
		//Стрежень
		"Повышенный Комфорт 2-х местный 2-х комнатный" : 	{ basePrice: 0, extraPrice: 0 },
		"Комфорт 2 местный 2х комнатный" : 					{ basePrice: 4320, extraPrice: 900 },
		"Дуплекс  2х местный 2х комнатный" : 				{ basePrice: 3400, extraPrice: 800 },
		"Улучшенный Стандарт 2х местный" : 					{ basePrice: 3240, extraPrice: 900 },
		"Стандарт  2х местный" : 							{ basePrice: 2800, extraPrice: 800 },
		"Стандарт 3х местный" : 							{ basePrice: 3810, extraPrice: 800 },
		"Семейный  4х местный 2х комнатный" : 				{ basePrice: 4960, extraPrice: 800 },
		"Комфорт 2-х местный 2-х комнатный" : 				{ basePrice: 0, extraPrice: 0 },
		"Дуплекс 2-х местный 2-х комнатный" : 				{ basePrice: 0, extraPrice: 0 },
		"Стандарт 2-х местный" : 							{ basePrice: 0, extraPrice: 0 },
		"Семейный  4-х местный 2-х комнатный" : 			{ basePrice: 0, extraPrice: 0 },
		// Голубая гавань
        "1-но местный Стандарт": 							{ basePrice: 1230, extraPrice: 550 },
        "2х местный Стандарт": 								{ basePrice: 2120, extraPrice: 550 },
        "3х местный Стандарт": 								{ basePrice: 2700, extraPrice: 550 },
        "2х местный 2х комнатный Комфорт": 					{ basePrice: 3080, extraPrice: 650 },
        "2х мест 2х комнат Комфорт (с кухней)": 			{ basePrice: 3560, extraPrice: 700 },
        "4х местный 2х комнатный Семейный (с кухней)": 		{ basePrice: 5120, extraPrice: 550 },
        "4х местный 3х комнатный номер": 					{ basePrice: 0, extraPrice: 0 },
        "2х местный Эконом": 								{ basePrice: 1300, extraPrice: 0 },
        "3х местный Эконом": 								{ basePrice: 1860, extraPrice: 0 },
        "4х местный Шалаш": 								{ basePrice: 0, extraPrice: 0 },
		// Алые паруса
		"Стандарт 2-х местный (место в номере)" : 			{ basePrice: 1880, extraPrice: 840 },
		"Стандарт 2х местный (место в ном)-Корпус 1" : 		{ basePrice: 0, extraPrice: 0 },
		"2-х местный 2-х комнатный Комфорт" : 				{ basePrice: 4760, extraPrice: 1250 },
		"Люкс-Cтудия" : 									{ basePrice: 5020, extraPrice: 1420 },
		"1-но местный стандарт" : 							{ basePrice: 2840, extraPrice: 840 },
		"1но местный - Корпус 1" : 							{ basePrice: 0, extraPrice: 0 },
		"2-х местный стандарт" : 							{ basePrice: 3760, extraPrice: 840 },
		"Аппартаменты" : 									{ basePrice: 0, extraPrice: 0 },
    };
	const priceHigh = {
		//Стрежень
		"Повышенный Комфорт 2-х местный 2-х комнатный" : 	{ basePrice: 0, extraPrice: 0 },
		"Комфорт 2 местный 2х комнатный" : 					{ basePrice: 5620, extraPrice: 1270 },
		"Дуплекс  2х местный 2х комнатный" : 				{ basePrice: 4940, extraPrice: 1070 },
		"Улучшенный Стандарт 2х местный" : 					{ basePrice: 4780, extraPrice: 1270 },
		"Стандарт  2х местный" : 							{ basePrice: 4340, extraPrice: 1070 },
		"Стандарт 3х местный" : 							{ basePrice: 5910, extraPrice: 1070 },
		"Семейный  4х местный 2х комнатный" : 				{ basePrice: 7360, extraPrice: 1070 },
		"Комфорт 2-х местный 2-х комнатный" : 				{ basePrice: 0, extraPrice: 0 },
		"Дуплекс 2-х местный 2-х комнатный" : 				{ basePrice: 0, extraPrice: 0 },
		"Стандарт 2-х местный" : 							{ basePrice: 0, extraPrice: 0 },
		"Семейный  4-х местный 2-х комнатный" : 			{ basePrice: 0, extraPrice: 0 },
		// Голубая гавань
        "1-но местный Стандарт": 							{ basePrice: 1640, extraPrice: 670 },
        "2х местный Стандарт": 								{ basePrice: 3020, extraPrice: 670 },
        "3х местный Стандарт": 								{ basePrice: 4260, extraPrice: 670 },
        "2х местный 2х комнатный Комфорт": 					{ basePrice: 4140, extraPrice: 760 },
        "2х мест 2х комнат Комфорт (с кухней)": 			{ basePrice: 4540, extraPrice: 880 },
        "4х местный 2х комнатный Семейный (с кухней)": 		{ basePrice: 7360, extraPrice: 670 },
        "4х местный 3х комнатный номер": 					{ basePrice: 0, extraPrice: 0 },
        "2х местный Эконом": 								{ basePrice: 1760, extraPrice: 0 },
        "3х местный Эконом": 								{ basePrice: 2490, extraPrice: 0 },
        "4х местный Шалаш": 								{ basePrice: 0, extraPrice: 0 },
		// Алые паруса
		"Стандарт 2-х местный (место в номере)" : 			{ basePrice: 1880, extraPrice: 840 },
		"Стандарт 2х местный (место в ном)-Корпус 1" : 		{ basePrice: 0, extraPrice: 0 },
		"2-х местный 2-х комнатный Комфорт" : 				{ basePrice: 4760, extraPrice: 1250 },
		"Люкс-Cтудия" : 									{ basePrice: 5020, extraPrice: 1420 },
		"1-но местный стандарт" : 							{ basePrice: 2840, extraPrice: 840 },
		"1но местный - Корпус 1" : 							{ basePrice: 0, extraPrice: 0 },
		"2-х местный стандарт" : 							{ basePrice: 3760, extraPrice: 840 },
		"Аппартаменты" : 									{ basePrice: 0, extraPrice: 0 },
    };
  	const baza = {
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

//    function getRoomCategories() {
//        let categories = new Set();
//        document.querySelectorAll('.planning-roomtype-name__text').forEach(el => {
//            categories.add(el.textContent.trim());
//        });
//		//console.log("categories ", categories);
//        return Array.from(categories);
//    }
    function getRoomCategories() {
	    let categories = new Set();
	    document.querySelectorAll('.planning-roomtype-name__text').forEach(el => {
	        let text = el.textContent.trim();
	        // Пропускаем, если текст начинается с дефиса
	        if (!text.startsWith("-")) {
	            categories.add(text);
	        }
	    });
	    //console.log("categories ", categories);
	    return Array.from(categories);
     }
	let categorySelect, discountSlider, extraPlacesSlider, foodSlider, healSlider, daysSlider, seasonCheckbox, priceDisplay, bazaId, priceData;

    function createCategorySelect() {
        categorySelect = document.createElement('select');
        categorySelect.className = 'v-select theme--light';
        categorySelect.style.width = '100%';
        categorySelect.style.marginBottom = '10px';
        categorySelect.style.padding = '5px';

        let categories = getRoomCategories();
        categories.forEach(category => {
            let option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categorySelect.appendChild(option);
        });

        return categorySelect;
    }

    function createDiscountSlider() {
        let SliderContainer = document.createElement('div');
        SliderContainer.style.width = '100%';
        SliderContainer.style.marginBottom = '10px';

        let labelContainer = document.createElement('div');
        labelContainer.style.display = 'flex';
        labelContainer.style.justifyContent = 'space-between';
        labelContainer.style.alignItems = 'center';
        labelContainer.style.marginBottom = '5px';

        let label = document.createElement('label');
        label.innerText = 'Скидка (%):';

        let valueDisplay = document.createElement('span');
        valueDisplay.innerText = '0%';

        labelContainer.appendChild(label);
        labelContainer.appendChild(valueDisplay);

        discountSlider = document.createElement('input');
        discountSlider.type = 'range';
        discountSlider.min = '0';
        discountSlider.max = '50';
        discountSlider.step = '5';
        discountSlider.value = '0';
        discountSlider.style.width = '100%';

        discountSlider.oninput = function() {
            valueDisplay.innerText = discountSlider.value + '%';
            updatePriceDisplay();
        };

        SliderContainer.appendChild(labelContainer);
        SliderContainer.appendChild(discountSlider);

        return SliderContainer;
    }

    function createExtraPlacesSlider() {
        let SliderContainer = document.createElement('div');
        SliderContainer.style.width = '100%';
        SliderContainer.style.marginBottom = '10px';

        let labelContainer = document.createElement('div');
        labelContainer.style.display = 'flex';
        labelContainer.style.justifyContent = 'space-between';
        labelContainer.style.alignItems = 'center';
        labelContainer.style.marginBottom = '5px';

        let label = document.createElement('label');
        label.innerText = 'Доп. места (0-3):';

        let valueDisplay = document.createElement('span');
        valueDisplay.innerText = '0';

        labelContainer.appendChild(label);
        labelContainer.appendChild(valueDisplay);

        extraPlacesSlider = document.createElement('input');
        extraPlacesSlider.type = 'range';
        extraPlacesSlider.min = '0';
        extraPlacesSlider.max = '3';
        extraPlacesSlider.step = '1';
        extraPlacesSlider.value = '0';
        extraPlacesSlider.style.width = '100%';

        extraPlacesSlider.oninput = function() {
            valueDisplay.innerText = extraPlacesSlider.value;
            updatePriceDisplay();
        };

        SliderContainer.appendChild(labelContainer);
        SliderContainer.appendChild(extraPlacesSlider);

        return SliderContainer;
    }

	function createFoodSlider() {
        let SliderContainer = document.createElement('div');
        SliderContainer.style.width = '100%';
        SliderContainer.style.marginBottom = '10px';

        let labelContainer = document.createElement('div');
        labelContainer.style.display = 'flex';
        labelContainer.style.justifyContent = 'space-between';
        labelContainer.style.alignItems = 'center';
        labelContainer.style.marginBottom = '5px';

        let label = document.createElement('label');
        label.innerText = 'Питание (0-6):';

        let valueDisplay = document.createElement('span');
        valueDisplay.innerText = '0';

        labelContainer.appendChild(label);
        labelContainer.appendChild(valueDisplay);

        foodSlider = document.createElement('input');
        foodSlider.type = 'range';
        foodSlider.min = '0';
        foodSlider.max = '6';
        foodSlider.step = '1';
        foodSlider.value = '0';
        foodSlider.style.width = '100%';

        foodSlider.oninput = function() {
            valueDisplay.innerText = foodSlider.value;
            updatePriceDisplay();
        };

        SliderContainer.appendChild(labelContainer);
        SliderContainer.appendChild(foodSlider);

        return SliderContainer;
    }

	function createHealSlider() {
        let SliderContainer = document.createElement('div');
        SliderContainer.style.width = '100%';
        SliderContainer.style.marginBottom = '10px';

        let labelContainer = document.createElement('div');
        labelContainer.style.display = 'flex';
        labelContainer.style.justifyContent = 'space-between';
        labelContainer.style.alignItems = 'center';
        labelContainer.style.marginBottom = '5px';

        let label = document.createElement('label');
        label.innerText = 'Лечение (0-4):';

        let valueDisplay = document.createElement('span');
        valueDisplay.innerText = '0';

        labelContainer.appendChild(label);
        labelContainer.appendChild(valueDisplay);

        healSlider = document.createElement('input');
        healSlider.type = 'range';
        healSlider.min = '0';
        healSlider.max = '4';
        healSlider.step = '1';
        healSlider.value = '0';
        healSlider.style.width = '100%';

        healSlider.oninput = function() {
            valueDisplay.innerText = healSlider.value;
            updatePriceDisplay();
        };

        SliderContainer.appendChild(labelContainer);
        SliderContainer.appendChild(healSlider);

        return SliderContainer;
    }

	function createDaysSlider() {
        let SliderContainer = document.createElement('div');
        SliderContainer.style.width = '100%';
        SliderContainer.style.marginBottom = '10px';

        let labelContainer = document.createElement('div');
        labelContainer.style.display = 'flex';
        labelContainer.style.justifyContent = 'space-between';
        labelContainer.style.alignItems = 'center';
        labelContainer.style.marginBottom = '5px';

        let label = document.createElement('label');
        label.innerText = 'Дни (1-30):';

        let valueDisplay = document.createElement('span');
        valueDisplay.innerText = '0';

        labelContainer.appendChild(label);
        labelContainer.appendChild(valueDisplay);

        daysSlider = document.createElement('input');
        daysSlider.type = 'range';
        daysSlider.min = '1';
        daysSlider.max = '30';
        daysSlider.step = '1';
        daysSlider.value = '1';
        daysSlider.style.width = '100%';

        daysSlider.oninput = function() {
            valueDisplay.innerText = daysSlider.value;
            updatePriceDisplay();
        };

        SliderContainer.appendChild(labelContainer);
        SliderContainer.appendChild(daysSlider);

        return SliderContainer;
    }

	function createSeasonCheckbox() {
        let container = document.createElement('div');
        container.style.marginBottom = '10px';

        let label = document.createElement('label');
        label.innerText = 'Высокий сезон (01.07-31.08)';
        label.style.marginLeft = '5px';

        seasonCheckbox = document.createElement('input');
        seasonCheckbox.type = 'checkbox';
        seasonCheckbox.style.marginRight = '5px';

        container.appendChild(seasonCheckbox);
        container.appendChild(label);

        return container;
    }

    function updatePriceDisplay() {
		if (!categorySelect) {
            return;
        }
        let selectedCategory = categorySelect.value || 0;
		if (selectedCategory == "Категории") {
            return;
        }
		//console.log("selectedCategory ", selectedCategory);
		let isHighSeason = seasonCheckbox.checked;
		priceData = isHighSeason ? priceHigh : priceLow;
        let basePrice = priceData[selectedCategory].basePrice || 0;
        let extraPrice = priceData[selectedCategory].extraPrice || 0;
        let extraPlaces = parseInt(extraPlacesSlider.value) || 0;
		let foodCount = parseInt(foodSlider.value) || 0;
		let healCount = parseInt(healSlider.value) || 0;
		let daysCount = parseInt(daysSlider.value) || 0;
        let discountPercentage = parseInt(discountSlider.value) || 0;
        let extraCost = extraPlaces * extraPrice;
        let discountAmount = ((basePrice + extraCost) * discountPercentage) / 100;
        let finalPrice = basePrice + extraCost - discountAmount + (baza[bazaId].foodPrice * foodCount) + (bazaId == 1535 ? (baza[bazaId].medicine * healCount) : 0);
		let finalFullPrice = finalPrice * daysCount;

        if (priceDisplay) {
			if(daysCount > 1){
            	priceDisplay.innerText = `Цена за сутки: ${finalPrice} ₽\nЦена за ${daysCount} суток: ${finalFullPrice} ₽`;
			}else{
				priceDisplay.innerText = `Цена за сутки: ${finalPrice} ₽`;
			}
        }
    }

    // Создание модального окна
    function createModal() {
		bazaId = document.querySelector('.offline-header.js-offline-header').getAttribute('data-account-id');
        console.log("bazaId:", bazaId);

        let modal = document.createElement('div');
        modal.id = 'custom-modal';
        modal.className = 'v-menu__content theme--light menuable__content__active';
        modal.style.minWidth = 'auto';
        modal.style.maxWidth = '272px';
        modal.style.position = 'fixed';
        modal.style.top = '105px';
        modal.style.left = '50%';
        modal.style.transform = 'translateX(-50%)';
        modal.style.zIndex = '15';
        modal.style.display = 'none';
        modal.tabIndex = '-1';

        let modalWrapper = document.createElement('div');
        modalWrapper.className = 'v-picker v-card v-picker--date theme--light';

        let modalBody = document.createElement('div');
        modalBody.className = 'v-picker__body v-picker__body--no-title theme--light';
        modalBody.style.width = '272px';
        modalBody.style.padding = '10px';
        modalBody.style.background = 'white';
        modalBody.style.borderRadius = '8px';
        modalBody.style.boxShadow = '0px 2px 10px rgba(0, 0, 0, 0.2)';

        let categorySelect = createCategorySelect();
        let discountSlider = createDiscountSlider();
        let extraPlacesSlider = createExtraPlacesSlider();
		let seasonCheckboxElement = createSeasonCheckbox();
		let daysSlider = createDaysSlider();
		let foodSlider = createFoodSlider();
		let healSlider = createHealSlider();

        // Элемент для отображения стоимости
        priceDisplay = document.createElement('div');
        priceDisplay.style.marginTop = '10px';
        priceDisplay.style.fontSize = '16px';
        priceDisplay.style.fontWeight = 'bold';
        priceDisplay.style.textAlign = 'center';
        priceDisplay.innerText = 'Цена за сутки: 0 ₽';

        modalBody.appendChild(categorySelect);
		modalBody.appendChild(extraPlacesSlider);
		modalBody.appendChild(foodSlider);
		if(bazaId == 1535){
			modalBody.appendChild(healSlider);
		}
        modalBody.appendChild(discountSlider);
		if(bazaId != 1535){
			modalBody.appendChild(seasonCheckboxElement);
		}
		modalBody.appendChild(daysSlider);
        modalBody.appendChild(priceDisplay);
        modalWrapper.appendChild(modalBody);
        modal.appendChild(modalWrapper);
        document.body.appendChild(modal);

        modal.addEventListener('focusout', (event) => {
            setTimeout(() => {
                if (!modal.contains(document.activeElement)) {
                    modal.style.display = 'none';
                }
            }, 150);
        });

        // Возвращаем модальное окно
        return modal;
    }

    // Добавление кнопки для открытия калькулятора
    function addButton() {
        let targetElement = document.querySelector('.bnovo-header-menu-item--button');
        if (!targetElement) return;

        let newButton = document.createElement('div');
        newButton.className = 'bnovo-header-menu-item--button';
        newButton.innerHTML = '<div><div class="bnovo-header-menu-item--button__text">Калькулятор</div></div>';
        newButton.style.cursor = 'pointer';
        newButton.onclick = (event) => {
            event.stopPropagation();
            let modal = document.getElementById('custom-modal') || createModal();
            modal.style.display = 'block';
            modal.focus();
        };

        targetElement.parentNode.insertBefore(newButton, targetElement);
    }

    // Запуск скрипта с небольшой задержкой
    setTimeout(() => {
        addButton();
		setInterval(updatePriceDisplay, 200);
    }, 1000);  // Задержка 1 секунда

})();
