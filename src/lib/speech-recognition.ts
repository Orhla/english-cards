export async function RussianMeaningSpeechRecognition(): Promise<string> {
    return new Promise((resolve, reject) => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

        if (!SpeechRecognition) {
            reject("Speech Recognition не поддерживается в этом браузере.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'ru-RU'
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onresult = ((event) => {
            const transcript = event.results[0][0].transcript
            resolve(transcript);
        })

        recognition.onerror = (event) => {
            reject(event.error);
        };

        recognition.onspeechend = () => {
            recognition.stop();
        };

        recognition.start()       
    });
}