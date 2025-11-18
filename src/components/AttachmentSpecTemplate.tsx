import React from 'react';

export const AttachmentSpecTemplate: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto p-8 bg-white">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold">ПРИЛОЖЕНИЕ №1</h1>
        <h2 className="text-xl font-semibold">к Договору подряда №003 от "18" январь 2025 г.</h2>
        <p className="mt-2 text-lg">ЗАЯВКА-СПЕЦИФИКАЦИЯ</p>
      </div>

      <div className="mb-8">
        <p className="mb-2">
          ТОО "HotWell.KZ", БИН 180440039034, в лице Директора Милюк Виталия Игоревича, действующего на основании Устава, именуемый в дальнейшем «Исполнитель», с одной стороны и в лице Литвинова Артёма Семёновича, ИИН 820411301955, именуемый(-ая) в дальнейшем «Заказчик», с другой стороны, составили настоящую Заявку - Спецификацию на Поставку Товара.
        </p>
        <p className="mb-2">
          Общая стоимость составляет <strong>13,228,000 тенге</strong> (тринадцать миллионов двести двадцать восемь тысяч) тенге.
        </p>
        <p className="mb-2">
          Общая площадь застройки, м<sup>2</sup> – <strong>190 м<sup>2</sup></strong>
        </p>
        <p className="mb-2">
          Железобетонный свайно-ленточный фундамент (марка М250) высота в самой высокой точке от 40 см до 65 см от земли, сваи глубиной от 70 см до 100 см.
        </p>
        <p className="mb-2">
          Стены первого этажа высотой 2,8 м и стен второго этажа высотой 2,5 м, внутренние перегородки из гипсокартона, металлического профиля и минеральной ваты.
        </p>
        <p className="mb-2">
          Подготовим проём под лестницу в междуэтажном перекрытии (лестница не входит в работы).
        </p>
        <p className="mb-2">
          Чердачное балочное перекрытие (шаг от края до края 1,2 м).
        </p>
        <p className="mb-2">
          Каркас для 4-скатной крыши, подшитой парапленкой для дома и глянцевой металлочерепицей 0,45 мм.
        </p>
        <p className="mb-2">
          Выступ карниза 450 мм.
        </p>
        <p className="mb-2">
          Гарантированные работы по акции - монтаж труб (теплого пола в стяжке, канализации, водопровода, черновая вентиляция внутри дома, в виде одного отверстия в стене на 1-ом и 2-ом этаже с выходом выше крыши).
        </p>
      </div>

      <div className="overflow-x-auto mb-8">
        <table className="min-w-full border border-gray-300">
          <thead className="bg-gray-100">
            <tr>
              <th className="border border-gray-300 px-2 py-1 text-sm">Наименование материала, описание работ</th>
              <th className="border border-gray-300 px-2 py-1 text-sm">Ед. измер.</th>
              <th className="border border-gray-300 px-2 py-1 text-sm">Кол-во</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            <tr>
              <td className="border border-gray-300 px-2 py-1">Фундамент + Стяжка (Фундамент высота 400 мм ширина 300 мм + Стяжка 80 мм)</td>
              <td className="border border-gray-300 px-2 py-1">м<sup>3</sup></td>
              <td className="border border-gray-300 px-2 py-1">16,02</td>
            </tr>
            <tr>
              <td className="border border-gray-300 px-2 py-1">Арматура 12 мм (Для армирования фундамента)</td>
              <td className="border border-gray-300 px-2 py-1">м/п</td>
              <td className="border border-gray-300 px-2 py-1">392</td>
            </tr>
            <tr>
              <td className="border border-gray-300 px-2 py-1">Сетка 15х15 (Для теплого пола в стяжку) размер 80 см на 2,4 м = 1,92 м<sup>2</sup></td>
              <td className="border border-gray-300 px-2 py-1">1 шт</td>
              <td className="border border-gray-300 px-2 py-1">84</td>
            </tr>
            <tr>
              <td className="border border-gray-300 px-2 py-1">Труба квадратная 80х80 1,5 мм (Для стойки балкона, навеса, или террасы)</td>
              <td className="border border-gray-300 px-2 py-1">метр</td>
              <td className="border border-gray-300 px-2 py-1">3</td>
            </tr>
            <tr>
              <td className="border border-gray-300 px-2 py-1">Проволока 6 (Для хомутов при армировании арматуры)</td>
              <td className="border border-gray-300 px-2 py-1">метр</td>
              <td className="border border-gray-300 px-2 py-1">51</td>
            </tr>
            <tr>
              <td className="border border-gray-300 px-2 py-1">ПГС Howo (Для засыпки внутри фундамента) (если высота 400 мм) (15 м<sup>3</sup>)</td>
              <td className="border border-gray-300 px-2 py-1">маш</td>
              <td className="border border-gray-300 px-2 py-1">3</td>
            </tr>
            <tr>
              <td className="border border-gray-300 px-2 py-1">Вязальная проволока 3 мм (Для крепления опалубки)</td>
              <td className="border border-gray-300 px-2 py-1">кг</td>
              <td className="border border-gray-300 px-2 py-1">4</td>
            </tr>
            <tr>
              <td className="border border-gray-300 px-2 py-1">Вязальная проволока (Для связки арматуры и монтажа теплого пола)</td>
              <td className="border border-gray-300 px-2 py-1">кг</td>
              <td className="border border-gray-300 px-2 py-1">6</td>
            </tr>
            <tr>
              <td className="border border-gray-300 px-2 py-1">Гвозди 120 (Для монтажа Опалубки)</td>
              <td className="border border-gray-300 px-2 py-1">кг</td>
              <td className="border border-gray-300 px-2 py-1">6</td>
            </tr>
            {/* Добавьте остальные строки спецификации аналогичным образом */}
          </tbody>
        </table>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4">Крыша</h2>
        <p className="mb-2">Брус 40х140х6000 (Для устройства стропильной системы крыши) – шт: 79</p>
        <p className="mb-2">Брус 25х100х6000 (Для обрешетки) – шт: 90</p>
        <p className="mb-2">Металлочерепица глянец (Сырье Россия) (Форм СуперМонтеррей толщ. 0,45мм) – м<sup>2</sup>: 140</p>
        <p className="mb-2">Конек бочкообразный (Для металлочерепицы двухметровый) – шт: 30</p>
        <p className="mb-2">Заглушка конусная (Для бочкообразного конька) – шт: 4</p>
        <p className="mb-2">Тройник (Для стыков бочкообразных коньков) – шт: 4</p>
        <p className="mb-2">Ендова внешняя 80х80мм (Для металлочерепицы двух метровая) – шт: 6</p>
        <p className="mb-2">Ендова внутренняя 600х600мм (Под металлочереп 600х600 двухметровая) – шт: 6</p>
        <p className="mb-2">Планка примыкания к стене 150х150мм (В местах примык. мет. чер. к стене) – шт: 2,8</p>
        <p className="mb-2">Паро пленка фасадная класс D (под обрешетку, и потолок 2-го этажа) – рул: 5</p>
        <p className="mb-2">Пенополистирол Толщ 145мм (Для утепления потолка 2-го этажа) – лист: 31</p>
        <p className="mb-2">Гвозди 120 (Для устройства стропильной системы) – кг: 12</p>
        <p className="mb-2">Гвозди 70 (Для монтажа обрешетки) – кг: 15</p>
        <p className="mb-2">Шурупы 4 (Для монтажа металлочерепицы) – пач: 10</p>
        <p className="mb-2">Пена монтажная 70л (Утепление потолка 2 этажа + утепление периферии перекрытия) – шт: 16</p>
        <p className="mb-2">Скобы (Для крепления паро пленки) – пач: 2</p>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4">Перегородки ненесущие из профиля и гипсокартона</h2>
        <p className="mb-2">Гипсокартон 12,5мм стеновой (Для межкомнатных перегородок) пр-ва Knauf – лист: 37</p>
        <p className="mb-2">Гипсокартон 12,5мм влагостойкий стеновой (Для межкомнатных перегородок) пр-ва Knauf – лист: 11</p>
        <p className="mb-2">Мин вата Экотерм (Для заполнения межкомнатных перегородок) – рул: 8</p>
        <p className="mb-2">Шурупы 3 мелкая резьба (Для монтажа гипсокартона к профилям) – пач: 7</p>
        <p className="mb-2">Шурупы семечки (Для монтажа профилей межкомнатных перегородок) – пач: 1</p>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4">Расходные материалы</h2>
        <p className="mb-2">Нить строительная – шт: 1</p>
        <p className="mb-2">Леска строительная – шт: 1</p>
        <p className="mb-2">Анкера 12х150 (Для крепления обвязки к фундаменту) – шт: 45</p>
        <p className="mb-2">Металлические Скобы (Для монтажа стропил) – шт: 100</p>
        <p className="mb-2">Насадка 8 на шуруповерт (Для шурупов по металлочерепице) – шт: 1</p>
        <p className="mb-2">Мешки мусорные – шт: 10</p>
        <p className="mb-2">Насадки крестовые на шуруповерт пр-ва ЗУБР – шт: 5</p>
        <p className="mb-2">Диски 150мм Rodex на болгарку – шт: 5</p>
        <p className="mb-2">Пистолет для пены – шт: 1</p>
        <p className="mb-2">Карандаши – шт: 5</p>
        <p className="mb-2">Лезвия для строительного ножа – шт: 2</p>
        <p className="mb-2">Перчатки – шт: 12</p>
        <p className="mb-2">Пленка от дождя самая плотная – метр: 7</p>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4">ДОПОЛНИТЕЛЬНЫЕ РАБОТЫ</h2>
        <p className="mb-2">Подложка под теплый пол – рулон: 2</p>
        <p className="mb-2">Теплый пол (для монтажа в стяжку) в одной бухте – бухта: 2</p>
        <p className="mb-2">Канализация, водопровод (Все материалы) – см. доп смету</p>
        <p className="mb-2">Вентиляция (Все материалы) – см. доп смету</p>
      </div>

      <div className="border-t pt-4">
        <p className="mb-2">ТОО "HotWell.KZ"</p>
        <p className="mb-2">Адрес: г. Алматы, ул. Панфилова, д. 264</p>
        <p className="mb-2">ИИН/БИН 180440039034</p>
        <p className="mb-2">ИИК KZ47722S000007871613</p>
        <p className="mb-2">КБе 17 АО "Kaspi Bank"</p>
        <p className="mb-2">БИК CASPKZKA</p>
        <p className="mb-2">КБе 14</p>
        <p className="mb-2">Тел: +7 705 3333503</p>
        <p className="mb-2">E-mail: HotWell.KZ@gmail.com</p>
        <br />
        <p className="mb-2">Литвинов Артём Семёнович</p>
        <p className="mb-2">ИИН 820411301955</p>
        <p className="mb-2">Адрес: г. Алматы, Алатауский район, пос. Айгерим 1, ул. В.Пика 1а</p>
        <p className="mb-2">E-mail: bradyga82@mail.ru</p>
      </div>

      <div className="mt-8">
        <div className="grid grid-cols-2 gap-8">
          <div>
            <h3 className="font-bold mb-2">Исполнитель:</h3>
            <p>ТОО "HotWell.KZ"</p>
            <p>БИН 180440039034</p>
            <p>Тел: +7 747 743 4343</p>
            <p>E-mail: HotWell.KZ@gmail.com</p>
            <div className="mt-4 border-t pt-2">
              <p>Директор Милюк В.И. /____________</p>
              <p className="text-sm text-gray-500">подпись</p>
            </div>
          </div>
          <div>
            <h3 className="font-bold mb-2">Заказчик:</h3>
            <p>Литвинов Артём Семёнович</p>
            <p>ИИН: 820411301955</p>
            <p>Адрес: г. Алматы, Алатауский район, пос. Айгерим 1, ул. В.Пика 1а</p>
            <p>E-mail: bradyga82@mail.ru</p>
            <div className="mt-4 border-t pt-2">
              <p>_____________ Литвинов А.С.</p>
              <p className="text-sm text-gray-500">подпись</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
