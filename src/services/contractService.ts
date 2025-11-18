import { Document, Packer, Paragraph, TextRun, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';
import { Employee } from '../types/employee';

export const generateEmployeeContract = async (employee: Employee): Promise<Blob> => {
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: 'ТРУДОВОЙ ДОГОВОР',
              bold: true,
              size: 28
            })
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: {
            after: 200
          },
          children: [
            new TextRun({
              text: 'г. Алматы',
              size: 24
            }),
            new TextRun({
              text: '                                                                                           ',
              size: 24
            }),
            new TextRun({
              text: new Date().toLocaleDateString('ru-RU'),
              size: 24
            })
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: {
            after: 200
          },
          children: [
            new TextRun({
              text: 'ТОО "HotWell.KZ", БИН 180440039034, в лице Директора Милюк Виталия Игоревича, действующего на основании Устава, именуемый в дальнейшем «Исполнитель», с одной стороны и ',
              size: 24
            }),
            new TextRun({
              text: employee.lastName + ' ' + employee.firstName + ' ' + employee.middleName,
              bold: true,
              size: 24
            }),
            new TextRun({
              text: ', ИИН ' + employee.iin + ', именуемый(-ая) в дальнейшем «Работник», с другой стороны, заключили настоящий трудовой договор о нижеследующем:',
              size: 24
            })
          ]
        })
      ]
    }]
  });

  return Packer.toBlob(doc);
};

export const downloadEmployeeContract = async (employee: Employee) => {
  try {
    const blob = await generateEmployeeContract(employee);
    saveAs(blob, `Трудовой_договор_${employee.lastName}_${employee.firstName}.docx`);
    return true;
  } catch (error) {
    console.error('Error generating contract:', error);
    throw new Error('Не удалось сгенерировать договор');
  }
};