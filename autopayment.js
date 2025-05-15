// ==UserScript==
// @name         Оплата 1Tap v2
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Авто оплата
// @author       MoHaX
// @match        https://online.bnovo.ru/booking/general/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=bnovo.ru
// @grant        unsafeWindow
// ==/UserScript==

(function() {
    'use strict';
	let price = 0;
	function formatPrice(num) {
	  // Приводим к числу и форматируем
	  return num.toFixed(2)
		.replace('.', ',')
		.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
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
	loadScript(`https://online.bnovo.ru/public/js/payment_form.js` , function () { console.log('payment_form загружен!'); });
	function paymentFormSubmit(action) {
	   let form = $('#payment_form');
	   let fiscal_check_printed = form.find('input[name=fiscal_check_printed]');
	   preloader_show();

	   if (fiscal_check_printed) {
		  form.find('select, input, textarea').prop('disabled', false);
	   }

	   form.ajaxSubmit({
		  url: '/booking/' + action,
		  dataType: 'json',
		  success: function(data) {
			 if (fiscal_check_printed) {
				makeFiscalCheckPrintedForm();
			 }
			 if ( data.result == 'success' || data == 'session_expired' ) {
			   	const bookingId = form.find('input[name^=booking_id]').val();
			   	document.dispatchEvent(new CustomEvent("booking-legacy-edit", {detail: {bookingId: bookingId}}));
				form.arcticmodal('close');
				 const formatted = formatPrice(price);

				// Вставляем в элемент
				const el = document.querySelector('.status.m-text-green');
				if (el) {
				  // Удаляем старый текст, кроме валютного знака
				  const currency = el.querySelector('.currency-sign');
				  if (currency) {
					el.textContent = formatted;
					el.appendChild(currency);
				  } else {
					el.textContent = formatted + ' ₽'; // Если знак не найден — добавляем вручную
				  }
				}
				// paymentDone = true;
			   	//location.reload();
			 }
			 else if (data.result == 'unauthorized_action') {
				preloader_hide();
				access_restricted_show( false );
			 }
			 else if (data.errors) {
				preloader_hide();
				displayPaymentErrors(data.errors);
			 }
			 else {
				preloader_hide();
			 }
		  },
		  error: function(jqXHR, exception) {
			 if (fiscal_check_printed) {
				makeFiscalCheckPrintedForm();
			 }
			 preloader_hide();
			 error_show(I18nUI.__('Ошибка отправки запроса. Попробуйте позже'), 'm-red');
		  }
	   });
	}
	function ensurePaymentModalExists() {
	  if (!document.getElementById('payment_modal')) {
		const wrapper = document.createElement('div');
		wrapper.style.display = 'none';

		wrapper.innerHTML = `
		  <div id="payment_modal" class="modal">
			<div class="grid m-padding m-cellpadding">
			  <div id="payment_form_container" class="grid__cell">
				<!-- payment form will be loaded here -->
			  </div>
			</div>
			<div class="modal__close arcticmodal-close i-close"></div>
		  </div>
		`;

		document.body.appendChild(wrapper);
	  }
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
    // Extract booking information from the page
    function extractBookingInfo() {

        let rounded = (num, decimals) => Number(num.toFixed(decimals));
        const bookingIdInput = document.getElementById('bookingID');
		const bookingId = bookingIdInput ? bookingIdInput.value : null;

        const targetElement = document.querySelector('.bookmarks__item.m-summary.d-tablet-none');
		const totalPrice = rounded(extractFromBookingPage('table.form__summary tbody tr th:nth-child(2)'),0); // Финальная стоимость со скидкой
		price = totalPrice;
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
            textDesktop.textContent = 'Оплатить';

            button.appendChild(textDesktop);

            // Обертка для кнопки и подсказки
            const buttonWrapper = document.createElement('div');
            buttonWrapper.style.cssText = `
            position: relative;
			left: 1%;
            display: inline-block;
			color: #00ccff !important;
        `;
            buttonWrapper.appendChild(button);

            // Добавляем обработчик события для кнопки
            button.addEventListener('click', () => {
				ensurePaymentModalExists();
				openPaymentForm(bookingId, 0, 0, 0, 0, 0, function(){
					var payment_form = document.getElementById('payment_form');
					payment_form.querySelector('select[name="services[method_id][]"]').value = "1";
					payment_form.querySelector('input[name="services[amount][]"]').value = totalPrice;
					var action = payment_form.querySelector('input[name=action]').value;
					paymentFormSubmit(action);
				}, 0);
            });

            // Вставляем кнопку после целевого элемента
            targetElement.insertAdjacentElement('afterend', buttonWrapper);
        }
    }

    window.addEventListener('load', extractBookingInfo);
})();
