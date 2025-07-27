# 🎨 Particle Colors Update

## Проблема
При знищенні кульок анімація розпаду завжди показувала жовті іскри (`#FFD700`), незалежно від кольору знищених кульок.

## Рішення
Оновлено систему частинок щоб колір анімації відповідав типу знищених кульок.

## Зміни

### 1. Нова функція отримання кольорів (`getBubbleParticleColors`)

```javascript
getBubbleParticleColors(bubbleType) {
  const colorMap = {
    'blue': {
      primary: '#4A90E2',    // Основний синій
      variants: ['#5DADE2', '#3498DB', '#2E86C1'] // Відтінки синього
    },
    'red': {
      primary: '#E74C3C',    // Основний червоний
      variants: ['#EC7063', '#E55039', '#C0392B'] // Відтінки червоного
    },
    // ... інші кольори
  };
}
```

### 2. Функція випадкового кольору (`getBubbleParticleColor`)

```javascript
getBubbleParticleColor(bubbleType) {
  const colors = this.getBubbleParticleColors(bubbleType);
  const allColors = [colors.primary, ...colors.variants];
  return allColors[Math.floor(Math.random() * allColors.length)];
}
```

### 3. Оновлена функція створення ефектів

**Було:**
```javascript
createExplosionEffects(positions) {
  positions.forEach(pos => {
    const { x, y } = this.gridToPixel(pos.row, pos.col);
    this.createParticles(x, y, '#FFD700', 6); // Завжди жовтий
  });
}
```

**Стало:**
```javascript
createExplosionEffects(positions, bubbleType) {
  positions.forEach(pos => {
    const { x, y } = this.gridToPixel(pos.row, pos.col);
    
    // Кілька хвиль частинок з різними кольорами
    for (let wave = 0; wave < 2; wave++) {
      setTimeout(() => {
        const particleColor = this.getBubbleParticleColor(bubbleType);
        const particleCount = wave === 0 ? 8 : 4;
        this.createParticles(x, y, particleColor, particleCount);
      }, wave * 100);
    }
  });
}
```

### 4. Покращена анімація частинок

- **Випадковість позиції:** Частинки з'являються не точно в центрі кульки
- **Варіативність швидкості:** Різна швидкість для кожної частинки
- **Різні розміри:** Частинки мають різні розміри (2-6px)
- **Варіативність життя:** Різна тривалість анімації

## Кольорова схема

| Тип кульки | Основний колір | Відтінки |
|------------|----------------|----------|
| **Blue** | `#4A90E2` | Світло-синій, темно-синій |
| **Red** | `#E74C3C` | Рожевий, темно-червоний |
| **Yellow** | `#F1C40F` | Золотий, темно-жовтий |
| **Cyan** | `#1ABC9C` | Бірюзовий, темно-зелений |
| **Heart** | `#E91E63` | Рожевий, пурпурний |
| **Stone** | `#7F8C8D` | Сірий, сріблястий |

## Тестування

Створено тестовий файл `test-particle-colors.html` для перевірки:

1. **Відкрий файл** в браузері
2. **Натискай кнопки** для тестування різних типів кульок
3. **Клікай по canvas** для випадкових вибухів
4. **Перевір кольори** - вони мають відповідати типу кульки

## Результат

### До:
- ❌ Всі частинки жовті незалежно від кольору кульки
- ❌ Однакова анімація для всіх типів
- ❌ Менше візуального різноманіття

### Після:
- ✅ Частинки відповідають кольору знищених кульок
- ✅ Кожен тип має свою кольорову палітру
- ✅ Більше візуального різноманіття та реалізму
- ✅ Двохвильова анімація для кращого ефекту

## Файли що змінено

- `game/bubbleShooter.js` - Основна логіка частинок
- `test-particle-colors.html` - Тестовий файл (новий)
- `PARTICLE_COLORS_UPDATE.md` - Ця документація (нова)

Тепер анімація розпаду виглядає набагато реалістичніше та відповідає кольору знищених кульок!