export class GeminiService {
  private async getClient() {
    const { GoogleGenAI } = await import("@google/genai");

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    return new GoogleGenAI({
      apiKey,
    });
  }

  async generateTaskAnalysis(prompt: string) {
    const { Type } = await import("@google/genai");

    const client = await this.getClient();

    return client.models.generateContent({
      model: "gemini-2.5-flash",

      contents: prompt,

      config: {
        responseMimeType: "application/json",

        responseSchema: {
          type: Type.OBJECT,

          properties: {
            summary: {
              type: Type.STRING,
            },

            suggestedPriority: {
              type: Type.STRING,
              enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
            },

            suggestedSubtasks: {
              type: Type.ARRAY,
              items: {
                type: Type.STRING,
              },
            },

            risks: {
              type: Type.ARRAY,
              items: {
                type: Type.STRING,
              },
            },

            nextAction: {
              type: Type.STRING,
            },
          },

          required: [
            "summary",
            "suggestedPriority",
            "suggestedSubtasks",
            "risks",
            "nextAction",
          ],
        },
      },
    });
  }
}
