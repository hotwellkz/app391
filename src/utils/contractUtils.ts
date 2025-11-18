export const generateContractContent = (clientData: any) => {
  const today = new Date().toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  return `
    <div class="contract-content">
      <h1>Договор подряда №${clientData.clientNumber}</h1>
      
      <div class="contract-header">
        <span>г. Алматы</span>
        <span>«${today}»</span>
      </div>

      <p>
        ТОО "HotWell.KZ", БИН 180440039034, в лице Директора Милюк Виталия Игоревича, 
        действующего на основании Устава, именуемый в дальнейшем «Исполнитель», с одной 
        стороны и ${clientData.lastName} ${clientData.firstName} ${clientData.middleName}, 
        ИИН ${clientData.iin}, именуемый(-ая) в дальнейшем «Заказчик», с другой стороны, 
        далее совместно именуемые «Стороны», заключили настоящий Договор о нижеследующем:
      </p>

      <h2>1. Предмет Договора</h2>
      <p>
        1.1. Заказчик поручает, а Исполнитель принимает на себя обязательство по возведению 
        дома из Структурно-Изоляционных Панелей (СИП) на земельном участке, расположенном 
        по адресу: ${clientData.constructionAddress}.
      </p>

      <h2>2. Цена Договора и порядок расчетов</h2>
      <p>
        2.1. Общая стоимость работ составляет ${Number(clientData.totalAmount).toLocaleString('ru-RU')} тенге.
      </p>
      <p>
        2.2. Оплата производится следующими траншами:
        - Задаток: ${Number(clientData.deposit).toLocaleString('ru-RU')} тенге
        - Первый транш: ${Number(clientData.firstPayment).toLocaleString('ru-RU')} тенге
        - Второй транш: ${Number(clientData.secondPayment).toLocaleString('ru-RU')} тенге
        - Третий транш: ${Number(clientData.thirdPayment).toLocaleString('ru-RU')} тенге
        - Четвертый транш: ${Number(clientData.fourthPayment).toLocaleString('ru-RU')} тенге
      </p>

      <!-- Остальные разделы договора -->

      <div class="contract-signatures">
        <div class="signature-block">
          <h3>Исполнитель:</h3>
          <p>ТОО "HotWell.KZ"</p>
          <p>Адрес: г.Алматы, пос. Бесагаш, ул. Алтай 12</p>
          <p>БИН 180440039034</p>
          <p>ИИК KZ47722S000007871613</p>
          <p>КБе 17 АО "Kaspi Bank"</p>
          <p>БИК CASPKZKA</p>
          <p>Тел: +7 747 743 4343</p>
          <p>WhatsApp: +7 747 743 4343</p>
          <p>E-mail: HotWell.KZ@gmail.com</p>
        </div>

        <div class="signature-block">
          <h3>Заказчик:</h3>
          <p>${clientData.lastName} ${clientData.firstName} ${clientData.middleName}</p>
          <p>ИИН: ${clientData.iin}</p>
          <p>Адрес: ${clientData.address}</p>
          <p>Тел: ${clientData.phone}</p>
          <p>Email: ${clientData.email}</p>
        </div>
      </div>
    </div>
  `;
};