import key from "~/../config/key.json";
import { getGoogleAuthToken } from "./getGoogleAuthToken";

export interface SpeechOptions {
  text: string;
}

export class TTSService {
  authToken = "";

  tokenLastFetched = 0;

  constructor() {}

  async getSpeechBase64(speechOptions: SpeechOptions): Promise<string> {
    const { text } = speechOptions;

    const body = {
      input: {
        text,
      },
      voice: {
        languageCode: "ja-JP",
        ssmlGender: "FEMALE",
      },
      audioConfig: {
        audioEncoding: "MP3",
      },
    };

    const response = await fetch("https://texttospeech.googleapis.com/v1/text:synthesize", {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.authToken}`,
      },
      body: JSON.stringify(body),
    });

    const json = await response.json();

    return json.audioContent;
  }

  async ensureAuthTokenValid() {
    if (Date.now() - this.tokenLastFetched > 1800 * 1000) {
      const token = await getGoogleAuthToken(
        key.client_email,
        key.private_key,
        "https://www.googleapis.com/auth/cloud-platform",
      );
      console.log({token});
      this.authToken = token;
      this.tokenLastFetched = Date.now();
    }
  }
}
