export const generateYandexLLMRole = `Ты помощник для создания обучающих карточек английского языка.`

export const generateYandexLLMPrompt = (word: string) => `Проанализируй английское слово: "${word}"

Верни JSON в точно таком формате:
{
  "meanings": ["определение 1 на английском", "определение 2 на английском"],
  "examples": ["Example sentence 1.", "Example sentence 2.", "Example sentence 3."],
  "level": "B1",
  "topics": ["work", "communication"]
}

Правила:
- meanings: Напиши от 1 до 3 коротких, понятных определений слова "${word}" на английском языке.
- examples: Придумай от 2 до 4 естественных примеров предложений на английском языке, демонстрирующих контекст использования слова "${word}".
- level: Определи уровень владения языком (CEFR) для слова "${word}".
- topics: Выбери от 1 до 3 наиболее подходящих тематических категорий (topics) для слова "${word}".`