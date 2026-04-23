import { Injectable, signal } from '@angular/core';
import { GoogleGenAI, Type } from "@google/genai";

@Injectable({ providedIn: 'root' })
export class AiAdvisoryService {
  private ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  
  isLoading = signal(false);

  /**
   * Diagnostique une maladie de culture à partir d'une image.
   */
  async diagnoseCrop(base64Image: string, mimeType: string): Promise<string> {
    this.isLoading.set(true);
    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          {
            inlineData: {
              data: base64Image,
              mimeType: mimeType
            }
          },
          {
            text: `Agis comme un expert agronome africain senior. 
            Analyse cette image de culture. 
            1. Identifie la culture.
            2. Détecte les signes de maladies, ravageurs ou stress hydrique.
            3. Donne des conseils de traitement immédiats et biologiques (accessibles localement).
            4. Réponds de manière concise, encourageante et ultra-lisible (puces).
            Si l'image n'est pas une culture ou est trop floue, demande poliment une meilleure photo.`
          }
        ],
        config: {
          systemInstruction: "Tu es KivuShamba IA, l'expert agronome de poche pour les agriculteurs du Kivu et d'Afrique de l'Ouest. Ton ton est professionnel, protecteur et focalisé sur des solutions pratiques."
        }
      });
      
      return response.text || "Désolé, je n'ai pas pu analyser cette image. Veuillez réessayer.";
    } catch (error) {
      console.error("Gemini Diagnosis Error:", error);
      return "Une erreur technique s'est produite lors de l'analyse IA.";
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Génère un calendrier de semis adapté au climat.
   */
  async getSowingCalendar(crop: string, location: string): Promise<string> {
    this.isLoading.set(true);
    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ parts: [{ text: `Génère un calendrier de semis et d'entretien pour le ${crop} à ${location}. 
        Prends en compte les cycles de pluie typiques de la région en 2026.
        Réponds par un tableau simple avec Mois / Action / Conseil.` }] }]
      });
      return response.text || "Calendrier indisponible.";
    } catch (error) {
      console.error("Calendar Error:", error);
      return "Erreur lors de la génération du calendrier.";
    } finally {
      this.isLoading.set(false);
    }
  }
}
