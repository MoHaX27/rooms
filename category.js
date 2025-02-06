window.roomCategories = {
	0: { //  Затычка что бы не крашило
            basePrice: 0,
            extraPrice: 0,
            baseOverPrice: 0,
            extraOverPrice: 0,
            maxBaseGuests: 0,
	    maxExtraGuests: 0,
            printName: "Null"
        },
	////////////////////////// СТРЕЖЕНЬ /////////////////////////
        "184076863": { //  Стандарт 2х местный
            basePrice: 1400, // Стоимость основного места
            extraPrice: 800, // Стоимость дополнительного места
            baseOverPrice: 2170, // Стоимость основного места ВЫСОКИЙ СЕЗОН
            extraOverPrice: 1070, // Стоимость дополнительного места ВЫСОКИЙ СЕЗОН
            maxBaseGuests: 2, // Максимальное количество основных мест
	    maxExtraGuests: 0, // Максимальное количество доп мест
            printName: "Стандарт"
        },
        "3628094238": { //  Стандарт (2+1) 2х местный
            basePrice: 1400,
            extraPrice: 800,
            baseOverPrice: 2170,
            extraOverPrice: 1070,
            maxBaseGuests: 2,
	    maxExtraGuests: 1,
            printName: "Стандарт"
        },
        "3682376564": { //  Стандарт 3х местный
            basePrice: 1270,
            extraPrice: 800,
            baseOverPrice: 1970,
            extraOverPrice: 1070,
            maxBaseGuests: 3,
	    maxExtraGuests: 0,
            printName: "Стандарт"
        },
        "1889936227": { //  Двухместное размещение в 3х мест
            basePrice: 1650,
            extraPrice: 800,
            baseOverPrice: 2550,
            extraOverPrice: 1070,
            maxBaseGuests: 2,
	    maxExtraGuests: 0,
            printName: "Стандарт в 3х"
        },
        "372022831": { //  Комфорт 2 местный 2х комнатный
            basePrice: 2160,
            extraPrice: 900,
            baseOverPrice: 2810,
            extraOverPrice: 1270,
            maxBaseGuests: 2,
	    maxExtraGuests: 0,
            printName: "Комфорт"
        },
        "3121715328": { //  Комфорт (2+1)
            basePrice: 2160,
            extraPrice: 900,
            baseOverPrice: 2810,
            extraOverPrice: 1270,
            maxBaseGuests: 2,
	    maxExtraGuests: 1,
            printName: "Комфорт"
        },
        "2844400129": { //  Комфорт (2+2)
            basePrice: 2160,
            extraPrice: 900,
            baseOverPrice: 2810,
            extraOverPrice: 1270,
            maxBaseGuests: 2,
	    maxExtraGuests: 2,
            printName: "Комфорт"
        },
        "1334863395": { //  Дуплекс 2х местный 2х комнатный
            basePrice: 1700,
            extraPrice: 800,
            baseOverPrice: 2470,
            extraOverPrice: 1070,
            maxBaseGuests: 2,
	    maxExtraGuests: 0,
            printName: "Дуплекс"
        },
        "1204873745": { //  Дуплекс (2+1)
            basePrice: 1700,
            extraPrice: 800,
            baseOverPrice: 2470,
            extraOverPrice: 1070,
            maxBaseGuests: 2,
	    maxExtraGuests: 1,
            printName: "Дуплекс"
        },
        "4109240830": { //  Улучшенный Стандарт 2х местный
            basePrice: 1620,
            extraPrice: 900,
            baseOverPrice: 2390,
            extraOverPrice: 1270,
            maxBaseGuests: 2,
	    maxExtraGuests: 0,
            printName: "Улучш Стандарт"
        },
        "1463994523": { //  Улучшенный Стандарт (2+1) 2х местный
            basePrice: 1620,
            extraPrice: 900,
            baseOverPrice: 2390,
            extraOverPrice: 1270,
            maxBaseGuests: 2,
	    maxExtraGuests: 1,
            printName: "Улучш Стандарт"
        },
        "2570918383": { //  Семейный 4х местный 2х комнатный
            basePrice: 1240,
            extraPrice: 800,
            baseOverPrice: 1840,
            extraOverPrice: 1070,
            maxBaseGuests: 4,
	    maxExtraGuests: 0,
            printName: "Семейный"
        },
        "2729833985": { //  Семейный (4+1)
            basePrice: 1240,
            extraPrice: 800,
            baseOverPrice: 1840,
            extraOverPrice: 1070,
            maxBaseGuests: 4,
	    maxExtraGuests: 1,
            printName: "Семейный"
        },
	////////////////////////// АЛЫЕ ПАРУСА /////////////////////////
	"1428382152": { //  Стандарт 2-х местный (место в номере) 
            basePrice: 1880,
            extraPrice: 840,
            baseOverPrice: 1880,
            extraOverPrice: 840,
            maxBaseGuests: 1,
	    maxExtraGuests: 1,
            printName: "2х Стандарт"
        },
    };

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
        "GG": {
            name: "ГГ",
            foodPrice: 1130
        }
    };

window.discount = {
        "null": { name: "" }, // Обоснование: именинник-20%
        "2033228569": { name: "Работник АВЗ" }, // Обоснование: работник группы АВТОВАЗ 20%
        "3597439000": { name: "Работник АВЗ" }, // Обоснование: Работник группы АВТОВАЗ- 20%   // АП
        "618700338": { name: "Именинник" }, // Обоснование: именинник-20%
        "2803113729": { name : "Пенсионер" }, // Обоснование: Пенсионер 20%
	"3033163572": { name : "Пенсионер" }, // Обоснование: Пенсионер - 20% // АП
	"4190677307": { name : "РБ" }, // Обоснование: Раннее бронирование 20% 
    };
