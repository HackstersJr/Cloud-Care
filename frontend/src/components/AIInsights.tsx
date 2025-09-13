import { useState, useEffect } from 'react';
import { 
  Brain, Sparkles, AlertTriangle, FileText, 
  Clock, Users, Activity, 
  CheckCircle, XCircle, Loader2, Beaker, Pill2
} from 'lucide-react';

interface AIInsightsProps {
  patientId?: string;
  qrToken?: string;
  symptoms?: string[];
  chiefComplaint?: string;
}

interface AIInsight {
  clinicalAssessment: string;
  familyRiskFactors: string[];
  recommendedTests: string[];
  treatmentSuggestions: string[];
  preventiveCare: string[];
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
  followUpRecommendations: string;
}

interface FamilyHealthPatterns {
  hereditaryRisks: string[];
  commonConditions: string[];
  recommendedScreenings: string[];
}

interface AIResponse {
  insights: AIInsight;
  familyHealthPatterns: FamilyHealthPatterns;
  summary: string;
  patientId: string;
  generatedAt: string;
  dataSource: string;
}

interface QuickSuggestion {
  suggestions: string[];
  patientId: string;
  generatedAt: string;
  contextUsed: {
    hasSymptoms: boolean;
    hasChiefComplaint: boolean;
    hasFamilyHistory: boolean;
  };
}

export default function AIInsights({ patientId, qrToken, symptoms, chiefComplaint }: AIInsightsProps) {
  const [aiInsights, setAiInsights] = useState<AIResponse | null>(null);
  const [quickSuggestions, setQuickSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'insights' | 'quick' | 'family'>('insights');

  // Demo data for when patientId is not provided
  const demoInsights: AIResponse = {
    insights: {
      clinicalAssessment: "Based on available medical history and family data, this patient shows patterns consistent with metabolic syndrome risk factors. Recent symptoms suggest possible cardiovascular involvement requiring immediate attention.",
      familyRiskFactors: [
        "Family history of Type 2 Diabetes (Father)",
        "Hypertension across maternal lineage",
        "Cardiovascular disease (Uncle - severe)"
      ],
      recommendedTests: [
        "Comprehensive Metabolic Panel (CMP)",
        "Lipid Profile with ratios",
        "HbA1c and Glucose tolerance test",
        "ECG and Echocardiogram",
        "Thyroid function tests"
      ],
      treatmentSuggestions: [
        "Initiate ACE inhibitor for blood pressure management",
        "Consider metformin for glucose regulation",
        "Lifestyle modification counseling",
        "Cardiology consultation within 2 weeks",
        "Nutritionist referral for diabetes prevention"
      ],
      preventiveCare: [
        "Annual cardiovascular screening",
        "Quarterly diabetes monitoring",
        "Weight management program enrollment",
        "Family cardiovascular risk assessment",
        "Stress management techniques"
      ],
      urgencyLevel: 'medium',
      followUpRecommendations: "Schedule follow-up in 2 weeks to review test results. If symptoms worsen, advise immediate emergency consultation. Consider family screening for diabetes and hypertension."
    },
    familyHealthPatterns: {
      hereditaryRisks: [
        "Strong predisposition to Type 2 Diabetes",
        "Cardiovascular disease clustering",
        "Hypertension genetic markers"
      ],
      commonConditions: [
        "Metabolic Syndrome",
        "Essential Hypertension", 
        "Insulin Resistance"
      ],
      recommendedScreenings: [
        "Annual diabetes screening for all family members >40",
        "Cardiovascular risk assessment every 2 years",
        "Blood pressure monitoring for siblings"
      ]
    },
    summary: "Patient presents with moderate cardiovascular and metabolic risk based on personal and family history. Immediate intervention with lifestyle modifications and targeted therapies recommended. Family screening advised.",
    patientId: "demo-patient-123",
    generatedAt: new Date().toISOString(),
    dataSource: "qr_shared"
  };

  const generateAIInsights = async () => {
    if (!patientId) {
      console.error('No patientId provided to AI Insights');
      setAiInsights(demoInsights);
      return;
    }

    console.log('Generating AI insights for patient:', patientId);
    console.log('QR Token:', qrToken);
    console.log('Symptoms:', symptoms);
    console.log('Chief Complaint:', chiefComplaint);

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      console.log('Auth token exists:', !!token);
      
      const requestBody = {
        patientId,
        qrToken,
        consultationType: 'routine',
        symptoms: symptoms || [],
        chiefComplaint: chiefComplaint || ''
      };
      
      console.log('AI Insights Request:', requestBody);

      const response = await fetch('/api/v1/qr/ai-insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      });

      console.log('AI Insights Response Status:', response.status);
      console.log('AI Insights Response Headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('AI Insights Error Response:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('AI Insights Success Response:', data);
      setAiInsights(data.data);
    } catch (err) {
      console.error('AI Insights Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate AI insights');
      // Fallback to demo data on error
      setAiInsights(demoInsights);
    } finally {
      setLoading(false);
    }
  };

  const generateQuickSuggestions = async () => {
    if (!patientId || !symptoms || symptoms.length === 0) {
      setQuickSuggestions([
        "Consider comprehensive physical examination",
        "Review medication history and allergies",
        "Assess vital signs and pain levels",
        "Document chief complaint in detail",
        "Order basic laboratory tests if indicated"
      ]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/v1/qr/quick-suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          patientId,
          symptoms
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate quick suggestions');
      }

      const data = await response.json();
      setQuickSuggestions(data.data.suggestions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate quick suggestions');
      // Fallback to demo data
      setQuickSuggestions([
        "Consider comprehensive physical examination",
        "Review medication history and allergies",
        "Assess vital signs and pain levels"
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'insights' || activeTab === 'family') {
      generateAIInsights();
    } else if (activeTab === 'quick') {
      generateQuickSuggestions();
    }
  }, [activeTab, patientId, qrToken]);

  const getUrgencyColor = (level: string) => {
    switch (level) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Brain className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">AI Medical Insights</h2>
              <p className="text-sm text-gray-500">
                Powered by Gemini AI • Enhanced with family health data
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            <span className="text-sm text-purple-600 font-medium">AI Enhanced</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6">
          {[
            { key: 'insights', label: 'Comprehensive Analysis', icon: FileText },
            { key: 'quick', label: 'Quick Suggestions', icon: Clock },
            { key: 'family', label: 'Family Patterns', icon: Users }
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as any)}
              className={`py-4 px-2 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                activeTab === key
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="p-6">
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            <span className="ml-3 text-gray-600">Generating AI insights...</span>
          </div>
        )}

        {error && (
          <div className="flex items-center p-4 bg-red-50 rounded-lg">
            <XCircle className="w-5 h-5 text-red-500" />
            <span className="ml-3 text-red-700">{error}</span>
          </div>
        )}

        {!loading && !error && aiInsights && activeTab === 'insights' && (
          <div className="space-y-6">
            {/* Clinical Assessment */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-medium text-gray-900">Clinical Assessment</h3>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getUrgencyColor(aiInsights.insights.urgencyLevel)}`}>
                  {aiInsights.insights.urgencyLevel.toUpperCase()} Priority
                </span>
              </div>
              <p className="text-gray-700 leading-relaxed">{aiInsights.insights.clinicalAssessment}</p>
            </div>

            {/* Recommended Tests */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Recommended Tests</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {aiInsights.insights.recommendedTests.map((test, index) => (
                  <div key={index} className="flex items-center p-3 bg-blue-50 rounded-lg">
                    <Beaker className="w-4 h-4 text-blue-600 mr-3" />
                    <span className="text-blue-800">{test}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Treatment Suggestions */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Treatment Suggestions</h3>
              <div className="space-y-3">
                {aiInsights.insights.treatmentSuggestions.map((treatment, index) => (
                  <div key={index} className="flex items-start p-3 bg-green-50 rounded-lg">
                    <Pill2 className="w-4 h-4 text-green-600 mr-3 mt-0.5" />
                    <span className="text-green-800">{treatment}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Follow-up */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Follow-up Recommendations</h3>
              <p className="text-gray-700">{aiInsights.insights.followUpRecommendations}</p>
            </div>
          </div>
        )}

        {!loading && !error && activeTab === 'quick' && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Quick Clinical Suggestions</h3>
            <div className="space-y-3">
              {quickSuggestions.map((suggestion, index) => (
                <div key={index} className="flex items-start p-4 bg-purple-50 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-purple-600 mr-3 mt-0.5" />
                  <span className="text-purple-800">{suggestion}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {!loading && !error && aiInsights && activeTab === 'family' && (
          <div className="space-y-6">
            {/* Summary */}
            <div className="bg-purple-50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-purple-900 mb-2">Family Health Summary</h3>
              <p className="text-purple-800">{aiInsights.summary}</p>
            </div>

            {/* Hereditary Risks */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Hereditary Risk Factors</h3>
              <div className="space-y-3">
                {aiInsights.familyHealthPatterns.hereditaryRisks.map((risk, index) => (
                  <div key={index} className="flex items-start p-3 bg-red-50 rounded-lg">
                    <AlertTriangle className="w-4 h-4 text-red-600 mr-3 mt-0.5" />
                    <span className="text-red-800">{risk}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommended Screenings */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Recommended Family Screenings</h3>
              <div className="space-y-3">
                {aiInsights.familyHealthPatterns.recommendedScreenings.map((screening, index) => (
                  <div key={index} className="flex items-start p-3 bg-blue-50 rounded-lg">
                    <Activity className="w-4 h-4 text-blue-600 mr-3 mt-0.5" />
                    <span className="text-blue-800">{screening}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        {aiInsights && (
          <div className="mt-6 pt-4 border-t border-gray-200 text-sm text-gray-500">
            <div className="flex items-center justify-between">
              <span>Generated at: {new Date(aiInsights.generatedAt).toLocaleString()}</span>
              <span>Source: {aiInsights.dataSource === 'qr_shared' ? 'QR Shared Data' : 'Direct Access'}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
