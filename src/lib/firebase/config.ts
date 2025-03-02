interface Config<T> {
  [key: string]: T
}

const config: Config<string|undefined> = {
    apiKey: "AIzaSyAjE1T33tZtmmuUkdSsFOHjznB6pNLU3u0",
    authDomain: "concursus-adc0b.firebaseapp.com",
    projectId: "concursus-adc0b",
    storageBucket: "concursus-adc0b.firebasestorage.app",
    messagingSenderId: "258487625400",
    appId: "1:258487625400:web:ca8b5be552298982b9764d",
    measurementId: "G-6WQ9PPKT04"
  };
    
  export const firebaseConfig = config;

  