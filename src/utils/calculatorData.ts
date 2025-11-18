// Базовые цены за квадратный метр (в тенге)
export const BASE_PRICES = [
  { min: 10, max: 24, price: 124781 },
  { min: 25, max: 49, price: 101895 },
  { min: 50, max: 74, price: 96589 },
  { min: 75, max: 99, price: 84482 },
  { min: 100, max: 149, price: 67661 },
  { min: 150, max: 199, price: 57670 },
  { min: 200, max: 249, price: 53309 },
  { min: 250, max: 299, price: 48950 },
  { min: 300, max: 349, price: 48400 },
  { min: 350, max: 399, price: 47300 },
  { min: 400, max: 499, price: 46200 },
  { min: 500, max: 1500, price: 45100 }
];

// Фундамент
export const FOUNDATION_OPTIONS = [
  { label: 'Ж/Б ленточ. Зас. ПГС, стяжка 80мм. Выс 40см', value: 7691 },
  { label: 'Без фундамента', value: 0 },
  { label: 'СИП пол (на сваях)', value: 23572 },
  { label: 'Баллочное перекрытие (балки 40х190 + ОСБ 18мм)', value: 7691 },
  { label: 'Фундамент на металлических сваях', value: 34178 },
  { label: 'Демонтаж кровли', value: 3884 },
  { label: 'Демонтаж кровли + сейсмопояс + балочное перекрытие', value: 11574 },
  { label: 'Демонтаж кровли + балочное перекрытие', value: 7691 },
  { label: 'Демонтаж кровли + демонтаж этажа', value: 7691 },
  { label: 'Ж/Б ленточный, Выс 50см', value: 10722 },
  { label: 'Ж/Б ленточный, Выс 100см', value: 14743 },
  { label: 'Ж/Б ленточный, Выс 150см', value: 21798 },
  { label: 'Монтаж межэтажного перекрытия', value: 7691 },
  { label: 'Ж/Б ленточный, Выс 60 см', value: 11535 },
  { label: 'Ж/Б ленточный, перепад Выс 250см', value: 37334 }
];

// Количество этажей и доплаты
export const FLOORS_OPTIONS = [
  { label: '1 этаж', value: '1', addition: 7295 },
  { label: '2 этажа', value: '2', addition: 1619 },
  { label: '3 этажа', value: '3', addition: 0 }
];

// Тип первого этажа (те же опции что и для второго/третьего)
export const FIRST_FLOOR_TYPE_OPTIONS = [
  { label: 'Полноценный', value: 'full', addition: 0 },
  { label: 'Мансардный', value: 'mansard', addition: 7736 }
];

// Тип второго этажа
export const SECOND_FLOOR_TYPE_OPTIONS = [
  { label: 'Полноценный', value: 'full', addition: 0 },
  { label: 'Мансардный', value: 'mansard', addition: 7736 }
];

// Тип третьего этажа (те же опции что и для второго)
export const THIRD_FLOOR_TYPE_OPTIONS = [
  { label: 'Полноценный', value: 'full', addition: 0 },
  { label: 'Мансардный', value: 'mansard', addition: 7736 }
];

// Высота этажей (без толщины, только высота)
export const FLOOR_HEIGHT_OPTIONS = [
  { label: '2,5 м', value: 2.5, addition: 0 },
  { label: '2,8 м', value: 2.8, addition: 3798 },
  { label: '2,9 м', value: 2.9, addition: 4233 },
  { label: '3,0 м', value: 3.0, addition: 5290 },
  { label: '3,5 м', value: 3.5, addition: 8241 },
  { label: '4,0 м', value: 4.0, addition: 12514 },
  { label: '4,5 м', value: 4.5, addition: 16786 },
  { label: '5,0 м', value: 5.0, addition: 21058 },
  { label: '5,5 м', value: 5.5, addition: 25328 },
  { label: '6,0 м', value: 6.0, addition: 29604 }
];

// Толщина SIP стен (новое поле)
export const WALL_THICKNESS_OPTIONS = [
  { label: 'SIP-163 мм', value: 163, addition: 0 },
  { label: 'SIP-174 мм', value: 174, addition: 0 },
  { label: 'SIP-214 мм', value: 214, addition: 0 },
  { label: 'SIP-219 мм', value: 219, addition: 0 },
  { label: 'SIP-224 мм', value: 224, addition: 0 }
];

// Не несущие перегородки
export const PARTITION_OPTIONS = {
  height_2_5: [
    { label: 'Профиль + гипсокартон + мин. вата, толщина 100 мм', addition: 0 },
    { label: 'Брус + гипсокартон + мин. вата, толщина 100 мм', addition: 0 },
    { label: 'Без перегородок', addition: -2432 },
    { label: 'СИП-панели 163 мм (цельная панель 2,5 м)', addition: 7768 }
  ],
  height_2_8: [
    { label: 'Профиль + гипсокартон + мин. вата, толщина 100 мм', addition: 0 },
    { label: 'Брус + гипсокартон + мин. вата, толщина 100 мм', addition: 0 },
    { label: 'Без перегородок', addition: -2432 },
    { label: 'СИП-панели 163 мм (цельная панель 2,8 м)', addition: 10203 }
  ],
  height_2_9: [
    { label: 'Профиль + гипсокартон + мин. вата, толщина 100 мм', addition: 0 },
    { label: 'Брус + гипсокартон + мин. вата, толщина 100 мм', addition: 0 },
    { label: 'Без перегородок', addition: -2432 },
    { label: 'СИП-панели 163 мм, высота 2,9 м', addition: 10867 }
  ],
  height_3_0: [
    { label: 'Профиль + гипсокартон + мин. вата, толщина 100 мм', addition: 0 },
    { label: 'Брус + гипсокартон + мин. вата, толщина 100 мм', addition: 0 },
    { label: 'Без перегородок', addition: -2432 },
    { label: 'СИП-панели 163 мм, высота 3,0 м', addition: 11108 }
  ],
  height_3_5: [
    { label: 'Профиль + гипсокартон + мин. вата, толщина 100 мм', addition: 0 },
    { label: 'Брус + гипсокартон + мин. вата, толщина 100 мм', addition: 0 },
    { label: 'Без перегородок', addition: -2432 },
    { label: 'СИП-панели 163 мм, высота 3,5 м', addition: 13968 }
  ],
  height_4_0: [
    { label: 'Профиль + гипсокартон + мин. вата, толщина 100 мм', addition: 0 },
    { label: 'Брус + гипсокартон + мин. вата, толщина 100 мм', addition: 0 },
    { label: 'Без перегородок', addition: -2432 },
    { label: 'СИП-панели 163 мм, высота 4,0 м', addition: 17065 }
  ]
};

// Межэтажные перекрытия
export const INTER_FLOOR_OPTIONS = [
  { label: 'Балочное перекрытие (балки 190×40, шаг 29 см, ОСБ 18 мм сверху)', addition: 0 }
];

// Потолок
export const CEILING_OPTIONS = [
  { label: 'Потолок утеплённый (пенополистирол 145 мм)', addition: 0 },
  { label: 'Без утепления потолка', addition: -1758 },
  { label: 'СИП-потолок (перекрытие)', addition: 25221 }
];

// Тип крыши
export const ROOF_OPTIONS = [
  { label: '1-скатная', addition: 0 },
  { label: '1-скатная в стиле Хайтек (стропильная система + металлочерепица)', addition: 1616 },
  { label: '2-скатная (строп. сист. + металлочерепица)', addition: 1616 },
  { label: '4-скатная (конверт, для двухэтажного дома)', addition: 4723, floors: '2' },
  { label: '4-скатная (конверт, для одноэтажного дома)', addition: 7085, floors: '1' },
  { label: 'Без крыши и без потолка', addition: -6507 },
  { label: 'Без крыши', addition: -6507 },
  { label: '1-скатная (строп. сист. без металлочерепицы)', addition: -1108 },
  { label: '2-скатная (строп. сист. без металлочерепицы)', addition: -601 },
  { label: '1-скатная мансардная (СИП + металлочерепица)', addition: 5630 },
  { label: '2-скатная мансардная (СИП + металлочерепица)', addition: 10352 },
  { label: '4-скатная мансардная (СИП + металлочерепица)', addition: 16621 }
];

// Форма дома
export const HOUSE_SHAPE_OPTIONS = [
  { label: 'Простая форма', addition: 0 },
  { label: 'Сложная форма', addition: 4676 }
];

// Дополнительные работы
export const ADDITIONAL_WORKS_OPTIONS = [
  { label: 'Без дополнительных работ', addition: 0 },
  { label: 'Обшивка СИП стен внутри дома гипсокартоном', addition: 10362 },
  { label: 'Обшивка СИП стен внутри дома гипсокартоном + электромонтаж', addition: 17152 },
  { label: 'Отделка фасада пеноплекс + мюнхенская штукатурка', addition: 16080 },
  { label: 'Отделка фасада пеноплексом', addition: 8037 },
  { label: 'Отделка фундамента пеноплексом', addition: 2420 },
  { label: 'Отделка фасада и фундамента пеноплексом', addition: 10480 }
];

// Процентное соотношение для разбивки стоимости
export const COST_BREAKDOWN = {
  foundation: 0.14, // 14% на фундамент
  houseKit: 0.71,   // 71% на домокомплект
  assembly: 0.15    // 15% на монтаж
};

// Ограничения площади
export const AREA_LIMITS = {
  min: 10,
  max: 1500
}; 