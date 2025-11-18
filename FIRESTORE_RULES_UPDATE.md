# Обновление правил Firestore для clientAggregates

## Проблема
При миграции агрегатов возникает ошибка: `Missing or insufficient permissions` для коллекции `clientAggregates`.

## Решение
Нужно добавить правила безопасности для коллекции `clientAggregates` в Firebase Console.

## Способ 1: Через Firebase Console (рекомендуется)

1. Откройте [Firebase Console](https://console.firebase.google.com/)
2. Выберите ваш проект
3. Перейдите в **Firestore Database** → **Rules**
4. Добавьте следующие правила перед закрывающей скобкой `}`:

```javascript
    // Client aggregates collection (предрасчитанные агрегаты для оптимизации)
    match /clientAggregates/{clientId} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated(); // Разрешаем запись аутентифицированным пользователям
    }
```

5. Нажмите **Publish**

## Способ 2: Через Firebase CLI

Если у вас настроен Firebase CLI:

```bash
firebase deploy --only firestore:rules
```

## Проверка

После обновления правил попробуйте снова запустить миграцию в админ-панели.

## Текущие правила

Файл `firestore.rules` уже обновлен локально. Нужно только развернуть его в Firebase.

