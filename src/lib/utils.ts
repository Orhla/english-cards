export async function withRetry<T>(fn: () => Promise<T>, attempts: number = 5, delay: number = 1000): Promise<T> {

    if (attempts <= 0) {
        throw new Error("Параметр attempts должен быть больше 0");
    }

    if (delay < 0) {
        throw new Error("Параметр delay должен быть больше или равен 0");
    }

    for (let i = 0; i < attempts; i++) {
        try {
            return await fn();
        } catch (error) {
            if (i === attempts - 1) {
                throw error;
            }

            const currentDelay = delay * Math.pow(2, i);
            await new Promise((resolve) => setTimeout(resolve, currentDelay));
        }
    }
    throw new Error("Неизвестная ошибка");
}


export async function asyncPool<T, V> (array: T[], poolLimit: number, fn: (item: T) => Promise<V>): Promise<V[]> {
    const results: V[] = new Array(array.length);
    const batches: Promise<void>[] = [];
    const iterator = array.entries();

    const worker = async () => {
        for (const [index, item] of iterator) {
            results[index] = await fn(item);
        }
    };

    for (let i = 0; i < Math.min(poolLimit, array.length); i++) {
        batches.push(worker());
    }

    await Promise.all(batches);
    return results;
}