/**
 * Menghasilkan kata sandi yang aman secara kriptografi (CSPRNG)
 * Bebas dari modulo bias menggunakan rejection sampling.
 */
export function generateSecurePassword(
    length: number,
    options: { upper: boolean; lower: boolean; numbers: boolean; symbols: boolean },
    keyword: string = '',
    keywordPosition: 'random' | 'front' | 'back' = 'random'
): string {
    const charSets = {
        upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
        lower: 'abcdefghijklmnopqrstuvwxyz',
        numbers: '0123456789',
        symbols: '!@#$%^&*()_+~`|}{[]:;?><,./-='
    };

    let charset = '';
    if (options.upper) charset += charSets.upper;
    if (options.lower) charset += charSets.lower;
    if (options.numbers) charset += charSets.numbers;
    if (options.symbols) charset += charSets.symbols;

    if (charset === '') return keyword;

    const randomLength = Math.max(0, length - keyword.length);
    let randomPart = '';
    const charsetLength = charset.length;
    
    // Maksimal nilai byte (0-255) yang habis dibagi dengan panjang charset
    // untuk menghindari modulo bias sepenuhnya.
    const maxValid = Math.floor(256 / charsetLength) * charsetLength;
    
    // Alokasi buffer yang lebih besar untuk meminimalisir pemanggilan API kriptografi berulang
    const randomBuffer = new Uint8Array(randomLength * 2);

    while (randomPart.length < randomLength) {
        window.crypto.getRandomValues(randomBuffer);
        for (let i = 0; i < randomBuffer.length && randomPart.length < randomLength; i++) {
            const randomByte = randomBuffer[i];
            if (randomByte < maxValid) {
                randomPart += charset[randomByte % charsetLength];
            }
        }
    }

    if (!keyword) return randomPart;

    if (keywordPosition === 'front') {
        return keyword + randomPart;
    } else if (keywordPosition === 'back') {
        return randomPart + keyword;
    }

    // Posisi acak: Sisipkan keyword di posisi acak yang aman secara kriptografi
    const positionArray = new Uint32Array(1);
    window.crypto.getRandomValues(positionArray);
    const insertPos = positionArray[0] % (randomLength + 1);

    return randomPart.slice(0, insertPos) + keyword + randomPart.slice(insertPos);
}

/**
 * Menghitung entropi (kekuatan matematis) dari kata sandi berdasarkan panjang dan ukuran kumpulan karakter.
 */
export function calculateEntropy(passwordLength: number, charsetLength: number, keywordLength: number = 0): number {
    if (passwordLength === 0 || charsetLength === 0) return 0;
    const randomLength = Math.max(0, passwordLength - keywordLength);
    // Entropi hanya dihitung dari bagian yang diacak
    let entropy = randomLength * Math.log2(charsetLength);
    // Tambahan entropi dari kemungkinan posisi keyword
    if (keywordLength > 0 && randomLength > 0) {
        entropy += Math.log2(randomLength + 1);
    }
    return entropy;
}

export function getStrengthFeedback(entropy: number): { label: string, color: string, textColor: string, score: number } {
    if (entropy <= 0) return { label: 'Sangat Lemah', color: 'bg-red-500', textColor: 'text-red-500', score: 0 };
    if (entropy < 35) return { label: 'Lemah', color: 'bg-orange-500', textColor: 'text-orange-500', score: 1 };
    if (entropy < 60) return { label: 'Sedang', color: 'bg-yellow-500', textColor: 'text-yellow-500', score: 2 };
    if (entropy < 90) return { label: 'Kuat', color: 'bg-emerald-500', textColor: 'text-emerald-500', score: 3 };
    return { label: 'Sangat Kuat', color: 'bg-emerald-400', textColor: 'text-emerald-400', score: 4 };
}

export function getTimeToCrack(entropy: number): string {
    if (entropy <= 0) return 'Instan';
    // Asumsi 100 miliar tebakan per detik (Serangan offline cepat)
    const guessesPerSecond = 100_000_000_000;
    const totalGuesses = Math.pow(2, entropy);
    const seconds = totalGuesses / guessesPerSecond;

    if (seconds < 1) return 'Instan';
    if (seconds < 60) return `${Math.floor(seconds)} detik`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)} menit`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} jam`;
    if (seconds < 31536000) return `${Math.floor(seconds / 86400)} hari`;
    
    const years = seconds / 31536000;
    if (years < 100) return `${Math.floor(years)} tahun`;
    if (years < 1000) return `${Math.floor(years / 100)} abad`;
    if (years < 1_000_000) return `${Math.floor(years / 1000)} ribu tahun`;
    if (years < 1_000_000_000) return `${Math.floor(years / 1_000_000)} juta tahun`;
    return 'Miliaran tahun';
}
