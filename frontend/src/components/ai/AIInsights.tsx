import React, { useState, useEffect } from 'react';
import { Brain, Lightbulb, AlertTriangle, Activity, Users, Clock, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react';
import { apiClient } from '../../utils/api';

interface AIInsightsProps {
  patientId: string;
  qrToken?: string;
  patientData?: {
    name: string;
    age?: number;
    gender?: string;
  };
}

interface AIInsight {
  type: 'clinical_assessment' | 'risk_analysis' | 'treatment_suggestions' | 'preventive_care' | 'family_history_insights';
  title: string;
  content: string;
  priority: 'high' | 'medium' | 'low';
  category: string;
}

interface QuickSuggestion {
  type: string;
  suggestion: string;
  reasoning: string;
  urgency: 'immediate' | 'soon' | 'routine';
}

const AIInsights: React.FC<AIInsightsProps> = ({ patientId, qrToken, patientData }) => {
  console.log('🟢 AIInsights component rendered with:', { patientId, qrToken, patientData });
  
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [quickSuggestions, setQuickSuggestions] = useState<QuickSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFullInsights, setShowFullInsights] = useState(false);
  const [showQuickSuggestions, setShowQuickSuggestions] = useState(true);

  const loadAIInsights = async () => {
    console.log('🟡 loadAIInsights called with patientId:', patientId);
    if (!patientId) {
      console.log('🔴 No patientId, returning early');
      return;
    }
    
    console.log('🟡 Setting loading state...');
    setIsLoading(true);
    setError(null);

    try {
      console.log('🟡 Making fetch request to /api/v1/qr/ai/insights');
      const response = await fetch('/api/v1/qr/ai/insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
          // Removed Authorization header since QR routes don't require JWT
        },
        body: JSON.stringify({
          patientId,
          qrToken
        })
      });

      console.log('🟡 Response received:', response.status, response.statusText);
      
      const data = await response.json();
      console.log('🟡 Response data:', data);

      const data = await response.json();

      if (data.success && data.data?.insights) {
        setInsights(data.data.insights);
      } else {
        setError(data.message || 'Failed to load AI insights');
      }
    } catch (err: any) {
      console.error('Error loading AI insights:', err);
      setError('Network error occurred while loading insights');
    } finally {
      setIsLoading(false);
    }
  };

  const loadQuickSuggestions = async () => {
    if (!patientId) return;

    // Get symptoms from patient data or use common symptoms from medical records
    const symptoms = patientData?.symptoms || ['headache', 'fatigue']; // Default symptoms for demo

    try {
      const response = await fetch('/api/v1/qr/ai/quick-suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
          // Removed Authorization header since QR routes don't require JWT
        },
        body: JSON.stringify({
          patientId,
          symptoms: symptoms, // Use actual or default symptoms
          chiefComplaint: ''
        })
      });

      const data = await response.json();
      console.log('🟡 Quick suggestions response:', data);

      if (data.success && data.data?.suggestions) {
        setQuickSuggestions(data.data.suggestions);
      }
    } catch (err: any) {
      console.error('Error loading quick suggestions:', err);
    }
  };

  useEffect(() => {
    if (patientId) {
      loadQuickSuggestions();
    }
  }, [patientId]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'medium':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'low':
        return 'bg-green-50 border-green-200 text-green-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'immediate':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'soon':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'routine':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'clinical_assessment':
        return <Activity className="w-5 h-5" />;
      case 'risk_analysis':
        return <AlertTriangle className="w-5 h-5" />;
      case 'treatment_suggestions':
        return <Lightbulb className="w-5 h-5" />;
      case 'preventive_care':
        return <TrendingUp className="w-5 h-5" />;
      case 'family_history_insights':
        return <Users className="w-5 h-5" />;
      default:
        return <Brain className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* AI Insights Header */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
              <Brain className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">AI Medical Insights</h3>
              <p className="text-sm text-gray-600">
                AI-powered analysis for {patientData?.name || 'this patient'}
              </p>
            </div>
          </div>
          <div className="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded-full">
            Powered by Gemini AI
          </div>
        </div>
      </div>

      {/* Quick Suggestions */}
      {quickSuggestions.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border">
          <div 
            className="p-4 border-b cursor-pointer hover:bg-gray-50"
            onClick={() => setShowQuickSuggestions(!showQuickSuggestions)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Lightbulb className="w-5 h-5 text-amber-600 mr-2" />
                <h4 className="font-medium text-gray-900">Quick AI Suggestions</h4>
                <span className="ml-2 bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full">
                  {quickSuggestions.length}
                </span>
              </div>
              {showQuickSuggestions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </div>
          
          {showQuickSuggestions && (
            <div className="p-4 space-y-3">
              {quickSuggestions.map((suggestion, index) => (
                <div key={index} className="border rounded-lg p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-1">
                        <span className="font-medium text-gray-900 text-sm">{suggestion.type}</span>
                        <span className={`ml-2 px-2 py-1 text-xs rounded-full border ${getUrgencyColor(suggestion.urgency)}`}>
                          {suggestion.urgency}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mb-1">{suggestion.suggestion}</p>
                      <p className="text-xs text-gray-500">{suggestion.reasoning}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Detailed AI Insights */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div 
          className="p-4 border-b cursor-pointer hover:bg-gray-50"
          onClick={() => setShowFullInsights(!showFullInsights)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Brain className="w-5 h-5 text-purple-600 mr-2" />
              <h4 className="font-medium text-gray-900">Detailed Medical Analysis</h4>
              {!showFullInsights && (
                <button
                  onClick={(e) => {
                    console.log('🔴 Generate Analysis button clicked!');
                    e.stopPropagation();
                    console.log('🔴 About to call loadAIInsights()');
                    loadAIInsights();
                    console.log('🔴 Setting showFullInsights to true');
                    setShowFullInsights(true);
                  }}
                  className="ml-3 px-3 py-1 bg-purple-600 text-white text-xs rounded-md hover:bg-purple-700"
                >
                  Generate Analysis
                </button>
              )}
            </div>
            {showFullInsights ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>

        {showFullInsights && (
          <div className="p-4">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Generating AI insights...</p>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-4" />
                <p className="text-red-600">{error}</p>
                <button
                  onClick={loadAIInsights}
                  className="mt-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm"
                >
                  Retry
                </button>
              </div>
            ) : insights.length > 0 ? (
              <div className="space-y-4">
                {insights.map((insight, index) => (
                  <div key={index} className={`border rounded-lg p-4 ${getPriorityColor(insight.priority)}`}>
                    <div className="flex items-start">
                      <div className="w-8 h-8 bg-white/50 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                        {getInsightIcon(insight.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-medium">{insight.title}</h5>
                          <span className="text-xs px-2 py-1 rounded-full bg-white/50">
                            {insight.category}
                          </span>
                        </div>
                        <p className="text-sm whitespace-pre-line">{insight.content}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Brain className="w-8 h-8 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Click "Generate Analysis" to get AI insights for this patient</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* AI Disclaimer */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
        <div className="flex items-start">
          <AlertTriangle className="w-4 h-4 text-amber-500 mr-2 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-gray-600">
            <p className="font-medium mb-1">AI Assistance Disclaimer</p>
            <p>
              These AI-generated insights are for reference only and should not replace clinical judgment. 
              Always verify recommendations against current medical guidelines and patient-specific factors.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIInsights;
