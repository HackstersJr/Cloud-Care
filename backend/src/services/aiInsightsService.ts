import { GoogleGenerativeAI } from '@google/generative-ai';
import { logger } from '../utils/logger';
import { config } from '../config/environment';

interface PatientData {
  name: string;
  dateOfBirth: string;
  gender: string;
  records: Array<{
    id: string;
    title: string;
    description: string;
    recordType: string;
    diagnosis: string;
    medications: string;
    labResults: string;
    notes: string;
    visitDate: string;
    severity: string;
  }>;
}

interface FamilyData {
  familyGroups: Array<{
    groupId: string;
    groupName: string;
    relationship: string;
    members: Array<{
      id: string;
      name: string;
      relationship: string;
      age: number | null;
      gender: string;
      bloodType: string;
      emergencyContact: any;
    }>;
  }>;
  sharedMedicalHistory: Array<{
    recordId: string;
    fromPatient: string;
    recordType: string;
    diagnosis: string;
    medications: string;
    notes: string;
    severity: string;
    shareLevel: string;
    sharedAt: string;
  }>;
  emergencyContacts: Array<{
    name: string;
    relationship: string;
    contact: any;
  }>;
}

interface AIInsightRequest {
  patientData: PatientData;
  familyData: FamilyData | null;
  consultationType: 'routine' | 'emergency' | 'follow_up' | 'initial';
  symptoms?: string[];
  chiefComplaint?: string;
}

interface AIInsightResponse {
  insights: {
    clinicalAssessment: string;
    familyRiskFactors: string[];
    recommendedTests: string[];
    treatmentSuggestions: string[];
    preventiveCare: string[];
    urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
    followUpRecommendations: string;
  };
  familyHealthPatterns: {
    hereditaryRisks: string[];
    commonConditions: string[];
    recommendedScreenings: string[];
  };
  summary: string;
}

class AIInsightsService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    const apiKey = config.ai.geminiApiKey;
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  }

  /**
   * Generate AI-powered medical insights for doctors
   */
  async generateMedicalInsights(request: AIInsightRequest): Promise<AIInsightResponse> {
    try {
      const prompt = this.constructMedicalPrompt(request);
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Parse the AI response
      const insights = this.parseAIResponse(text);
      
      logger.info('AI medical insights generated successfully');
      return insights;

    } catch (error: any) {
      logger.error('Error generating AI medical insights:', error);
      throw new Error('Failed to generate AI insights: ' + error.message);
    }
  }

  /**
   * Construct a comprehensive medical prompt for Gemini AI
   */
  private constructMedicalPrompt(request: AIInsightRequest): string {
    const { patientData, familyData, consultationType, symptoms, chiefComplaint } = request;

    const prompt = `
You are an experienced medical AI assistant helping a doctor analyze patient information and provide clinical insights. 
Please provide a comprehensive medical analysis in JSON format.

PATIENT INFORMATION:
- Name: ${patientData.name}
- Age: ${this.calculateAge(patientData.dateOfBirth)} years old
- Gender: ${patientData.gender}
- Date of Birth: ${patientData.dateOfBirth}
- Consultation Type: ${consultationType}
${chiefComplaint ? `- Chief Complaint: ${chiefComplaint}` : ''}
${symptoms && symptoms.length > 0 ? `- Current Symptoms: ${symptoms.join(', ')}` : ''}

PATIENT MEDICAL HISTORY:
${patientData.records.map(record => `
- ${record.recordType} (${record.visitDate}):
  * Diagnosis: ${record.diagnosis || 'Not specified'}
  * Medications: ${record.medications || 'None listed'}
  * Severity: ${record.severity || 'Not specified'}
  * Notes: ${record.notes || 'No additional notes'}
`).join('\n')}

${familyData && familyData.familyGroups.length > 0 ? `
FAMILY MEDICAL HISTORY:
Family Group: ${familyData.familyGroups[0]?.groupName || 'Family'}

Family Members:
${familyData.familyGroups[0]?.members.map(member => `
- ${member.name} (${member.relationship}, ${member.age ? member.age + ' years old' : 'age unknown'}, ${member.gender})
  * Blood Type: ${member.bloodType || 'Unknown'}
`).join('\n')}

Shared Family Medical Records:
${familyData.sharedMedicalHistory.map(record => `
- From ${record.fromPatient} (${record.recordType}):
  * Diagnosis: ${record.diagnosis || 'Not specified'}
  * Medications: ${record.medications || 'None'}
  * Severity: ${record.severity || 'Not specified'}
  * Share Level: ${record.shareLevel}
`).join('\n')}

Emergency Contacts:
${familyData.emergencyContacts.map(contact => `
- ${contact.name} (${contact.relationship})
`).join('\n')}
` : 'FAMILY MEDICAL HISTORY: No family data available'}

INSTRUCTIONS:
As a medical AI assistant, analyze this information and provide insights in the following JSON format. 
Focus on evidence-based medical recommendations and highlight any concerning patterns or risk factors.

Please respond with ONLY valid JSON in this exact structure:

{
  "insights": {
    "clinicalAssessment": "Brief clinical assessment based on patient data and current presentation",
    "familyRiskFactors": ["List of hereditary/family risk factors identified"],
    "recommendedTests": ["List of diagnostic tests or screenings recommended"],
    "treatmentSuggestions": ["Evidence-based treatment suggestions"],
    "preventiveCare": ["Preventive care recommendations"],
    "urgencyLevel": "low|medium|high|critical",
    "followUpRecommendations": "Follow-up care recommendations"
  },
  "familyHealthPatterns": {
    "hereditaryRisks": ["Hereditary conditions to monitor"],
    "commonConditions": ["Common conditions in family history"],
    "recommendedScreenings": ["Family history-based screening recommendations"]
  },
  "summary": "Concise 2-3 sentence summary for quick reference"
}

MEDICAL GUIDELINES:
- Base recommendations on evidence-based medicine
- Consider patient age, gender, and medical history
- Account for family history patterns and genetic predispositions
- Highlight urgent concerns that need immediate attention
- Suggest appropriate follow-up intervals
- Consider preventive care based on risk factors
- Be specific about test recommendations and timeframes
`;

    return prompt;
  }

  /**
   * Parse AI response and ensure proper JSON structure
   */
  private parseAIResponse(aiText: string): AIInsightResponse {
    try {
      // Clean up the response to extract JSON
      let jsonText = aiText.trim();
      
      // Remove markdown code blocks if present
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      
      // Find JSON object boundaries
      const startIndex = jsonText.indexOf('{');
      const lastIndex = jsonText.lastIndexOf('}');
      
      if (startIndex !== -1 && lastIndex !== -1) {
        jsonText = jsonText.substring(startIndex, lastIndex + 1);
      }

      const parsed = JSON.parse(jsonText);
      
      // Validate required structure
      if (!parsed.insights || !parsed.familyHealthPatterns || !parsed.summary) {
        throw new Error('Invalid response structure');
      }

      return parsed as AIInsightResponse;

    } catch (error) {
      logger.error('Failed to parse AI response:', error);
      
      // Return fallback response
      return {
        insights: {
          clinicalAssessment: "AI analysis temporarily unavailable. Please review patient data manually.",
          familyRiskFactors: [],
          recommendedTests: ["Complete physical examination", "Basic metabolic panel"],
          treatmentSuggestions: ["Follow standard clinical protocols"],
          preventiveCare: ["Regular health screenings as per age and risk factors"],
          urgencyLevel: "medium",
          followUpRecommendations: "Schedule appropriate follow-up based on clinical judgment"
        },
        familyHealthPatterns: {
          hereditaryRisks: [],
          commonConditions: [],
          recommendedScreenings: []
        },
        summary: "AI insights temporarily unavailable. Please proceed with standard clinical assessment."
      };
    }
  }

  /**
   * Calculate age from date of birth
   */
  private calculateAge(dateOfBirth: string): number {
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }

  /**
   * Generate quick diagnostic suggestions based on symptoms
   */
  async generateQuickSuggestions(symptoms: string[], patientAge: number, gender: string): Promise<string[]> {
    try {
      const prompt = `
As a medical AI, provide 3-5 quick diagnostic considerations for:
- Patient: ${gender}, ${patientAge} years old
- Symptoms: ${symptoms.join(', ')}

Respond with ONLY a JSON array of strings (no other text):
["Differential diagnosis 1", "Differential diagnosis 2", "Differential diagnosis 3"]

Focus on most likely diagnoses based on symptoms and demographics.
`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text().trim();
      
      // Parse JSON array
      const suggestions = JSON.parse(text);
      return Array.isArray(suggestions) ? suggestions : [];

    } catch (error) {
      logger.error('Error generating quick suggestions:', error);
      return ['Review symptoms systematically', 'Consider common diagnoses for age group', 'Perform focused physical examination'];
    }
  }
}

export const aiInsightsService = new AIInsightsService();
export { AIInsightRequest, AIInsightResponse };
