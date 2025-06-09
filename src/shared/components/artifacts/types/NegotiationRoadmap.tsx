import React, { useState } from 'react';
import { NegotiationRoadmapData, VisualArtifact } from '@/shared/types/artifacts';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, 
  Circle, 
  Clock, 
  Target, 
  TrendingUp, 
  AlertTriangle, 
  Lightbulb,
  ChevronRight,
  ChevronDown,
  Mail,
  Phone,
  FileText,
  Calendar,
  BarChart3
} from 'lucide-react';

interface NegotiationRoadmapProps {
  data: NegotiationRoadmapData;
  artifact: VisualArtifact;
}

export default function NegotiationRoadmap({ data }: NegotiationRoadmapProps) {
  const [activeStep, setActiveStep] = useState<number>(
    data.steps.find(step => step.status === 'active')?.id || 
    data.steps.find(step => step.status === 'pending')?.id || 
    1
  );
  const [expandedPhases, setExpandedPhases] = useState<Set<number>>(new Set([1]));

  const togglePhase = (phaseId: number) => {
    const newExpanded = new Set(expandedPhases);
    if (newExpanded.has(phaseId)) {
      newExpanded.delete(phaseId);
    } else {
      newExpanded.add(phaseId);
    }
    setExpandedPhases(newExpanded);
  };

  const getSuccessColor = (probability: number) => {
    if (probability >= 75) return 'text-green-600';
    if (probability >= 50) return 'text-blue-600';
    if (probability >= 25) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getLeverageColor = (score: number) => {
    if (score >= 7) return 'bg-green-500';
    if (score >= 5) return 'bg-blue-500';
    if (score >= 3) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'active': return <Clock className="h-5 w-5 text-blue-600" />;
      case 'pending': return <Circle className="h-5 w-5 text-gray-400" />;
      default: return <Circle className="h-5 w-5 text-gray-400" />;
    }
  };

  const completedSteps = data.steps.filter(step => step.status === 'completed').length;
  const totalSteps = data.steps.length;
  const progressPercentage = (completedSteps / totalSteps) * 100;

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Header Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Negotiation Roadmap</CardTitle>
              <p className="text-muted-foreground mt-1">{data.strategy.name}</p>
            </div>
            <div className="text-right">
              <div className={`text-2xl font-bold ${getSuccessColor(data.successProbability.overall)}`}>
                {data.successProbability.overall}%
              </div>
              <p className="text-sm text-muted-foreground">Success Probability</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Strategy Overview */}
            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <Target className="h-4 w-4" />
                Strategy
              </h4>
              <p className="text-sm text-muted-foreground">{data.strategy.description}</p>
              <Badge variant="outline">{data.strategy.type.replace('_', ' ').toUpperCase()}</Badge>
            </div>

            {/* Leverage Score */}
            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Leverage Score
              </h4>
              <div className="flex items-center gap-2">
                <div className={`h-3 w-20 rounded-full ${getLeverageColor(data.leverageScore.total)}`}>
                  <div 
                    className="h-full bg-white rounded-full opacity-30"
                    style={{ width: `${(data.leverageScore.total / 10) * 100}%` }}
                  />
                </div>
                <span className="font-bold">{data.leverageScore.total}/10</span>
              </div>
              <div className="text-xs space-y-1">
                {data.leverageScore.strengths.slice(0, 2).map((strength, idx) => (
                  <div key={idx} className="text-green-600">+ {strength}</div>
                ))}
              </div>
            </div>

            {/* Timeline */}
            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Timeline
              </h4>
              <p className="text-sm">{data.timeline.estimatedDuration}</p>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>Progress</span>
                  <span>{completedSteps}/{totalSteps} steps</span>
                </div>
                <Progress value={progressPercentage} className="h-2" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Market Context */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Market Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">${data.marketContext.currentRent}</div>
              <p className="text-sm text-muted-foreground">Current Rent</p>
              {data.marketIntelligence?.marketTrends.avgRent && (
                <p className="text-xs text-blue-600">vs ${data.marketIntelligence.marketTrends.avgRent} avg</p>
              )}
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">${data.marketContext.targetRent}</div>
              <p className="text-sm text-muted-foreground">Target Rent</p>
              {data.marketIntelligence?.marketTrends.medianRent && (
                <p className="text-xs text-green-600">vs ${data.marketIntelligence.marketTrends.medianRent} median</p>
              )}
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{data.marketContext.negotiationRoom}%</div>
              <p className="text-sm text-muted-foreground">Negotiation Room</p>
              {data.marketIntelligence?.marketTrends.rentGrowth && (
                <p className="text-xs text-blue-600">{data.marketIntelligence.marketTrends.rentGrowth} growth</p>
              )}
            </div>
            <div className="text-center">
              <div className="text-lg font-bold">${data.marketContext.comparableRange.median}</div>
              <p className="text-sm text-muted-foreground">Market Median</p>
              {data.marketIntelligence?.comparableProperties.length ? (
                <p className="text-xs text-purple-600">{data.marketIntelligence.comparableProperties.length} comparables</p>
              ) : null}
            </div>
          </div>

          {/* Enhanced Market Intelligence */}
          {data.marketIntelligence && (
            <div className="mt-6 space-y-4">
              {/* Comparable Properties */}
              {data.marketIntelligence.comparableProperties.length > 0 && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <h5 className="font-medium text-blue-900 mb-3">Comparable Properties</h5>
                  <div className="space-y-2">
                    {data.marketIntelligence.comparableProperties.slice(0, 4).map((prop, index) => (
                      <div key={index} className="flex justify-between items-center text-sm">
                        <span className="text-blue-800">
                          {prop.type || 'Property'} {prop.address ? `(${prop.address})` : ''}
                        </span>
                        <span className="font-semibold text-blue-900">
                          ${prop.rent.toLocaleString()}{prop.distance ? ` • ${prop.distance}` : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Evidence Points */}
              {data.marketIntelligence.evidencePoints.length > 0 && (
                <div className="bg-green-50 rounded-lg p-4">
                  <h5 className="font-medium text-green-900 mb-3">Negotiation Evidence</h5>
                  <div className="space-y-2">
                    {data.marketIntelligence.evidencePoints.slice(0, 3).map((evidence, index) => (
                      <div key={index} className="flex items-start text-sm text-green-800">
                        <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                        <span>{evidence}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Location Insights */}
              {data.marketIntelligence.locationInsights && (
                <div className="bg-purple-50 rounded-lg p-4">
                  <h5 className="font-medium text-purple-900 mb-2">Location Insights</h5>
                  <p className="text-sm text-purple-800">{data.marketIntelligence.locationInsights}</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Success Probability Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Success Factors</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(data.successProbability.breakdown).map(([factor, score]) => (
              <div key={factor} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="capitalize">{factor.replace(/([A-Z])/g, ' $1').trim()}</span>
                  <span className="font-medium">{score}%</span>
                </div>
                <Progress value={score} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Alerts & Recommendations */}
      {(data.warningFlags.length > 0 || data.opportunityAlerts.length > 0 || data.currentRecommendations.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {data.warningFlags.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2 text-amber-600">
                  <AlertTriangle className="h-4 w-4" />
                  Warnings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {data.warningFlags.map((warning, idx) => (
                    <li key={idx} className="text-sm text-amber-700">{warning}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {data.opportunityAlerts.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2 text-green-600">
                  <TrendingUp className="h-4 w-4" />
                  Opportunities
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {data.opportunityAlerts.map((opportunity, idx) => (
                    <li key={idx} className="text-sm text-green-700">{opportunity}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {data.currentRecommendations.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2 text-blue-600">
                  <Lightbulb className="h-4 w-4" />
                  Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {data.currentRecommendations.map((rec, idx) => (
                    <li key={idx} className="text-sm text-blue-700">{rec}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Phase Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Negotiation Phases</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.timeline.phases.map((phase) => (
              <div key={phase.id} className="border rounded-lg">
                <div 
                  className="p-4 cursor-pointer hover:bg-muted/50"
                  onClick={() => togglePhase(phase.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(phase.status)}
                      <div>
                        <h4 className="font-medium">{phase.name}</h4>
                        <p className="text-sm text-muted-foreground">{phase.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{phase.duration}</Badge>
                      {expandedPhases.has(phase.id) ? 
                        <ChevronDown className="h-4 w-4" /> : 
                        <ChevronRight className="h-4 w-4" />
                      }
                    </div>
                  </div>
                </div>

                {expandedPhases.has(phase.id) && (
                  <div className="border-t p-4 space-y-4">
                    {data.steps
                      .filter(step => step.phase === phase.id)
                      .map((step) => (
                        <div 
                          key={step.id} 
                          className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                            activeStep === step.id ? 'border-blue-200 bg-blue-50' : 'hover:bg-muted/30'
                          }`}
                          onClick={() => setActiveStep(step.id)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3 flex-1">
                              {getStatusIcon(step.status)}
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h5 className="font-medium">{step.title}</h5>
                                  <Badge className={getDifficultyColor(step.difficulty)}>
                                    {step.difficulty}
                                  </Badge>
                                  <Badge variant="outline">{step.estimatedTime}</Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mb-3">{step.description}</p>

                                {/* Action Items */}
                                {step.actionItems.length > 0 && (
                                  <div className="space-y-2 mb-3">
                                    <h6 className="text-sm font-medium">Action Items:</h6>
                                    <ul className="space-y-1">
                                      {step.actionItems.map((action, actionIdx) => (
                                        <li key={actionIdx} className="text-sm flex items-center gap-2">
                                          <Circle className="h-3 w-3" />
                                          {action.description}
                                          {action.automated && (
                                            <Badge variant="secondary" className="text-xs">Auto</Badge>
                                          )}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                {/* Templates */}
                                {step.templates && (
                                  <div className="flex gap-2 mb-3">
                                    {step.templates.email && (
                                      <Button variant="outline" size="sm" className="text-xs">
                                        <Mail className="h-3 w-3 mr-1" />
                                        Email Template
                                      </Button>
                                    )}
                                    {step.templates.phoneScript && (
                                      <Button variant="outline" size="sm" className="text-xs">
                                        <Phone className="h-3 w-3 mr-1" />
                                        Phone Script
                                      </Button>
                                    )}
                                    {step.templates.followUp && (
                                      <Button variant="outline" size="sm" className="text-xs">
                                        <FileText className="h-3 w-3 mr-1" />
                                        Follow-up
                                      </Button>
                                    )}
                                  </div>
                                )}

                                {/* Tips */}
                                {step.tips.length > 0 && (
                                  <div className="bg-blue-50 p-3 rounded text-sm">
                                    <h6 className="font-medium text-blue-800 mb-1">Tips:</h6>
                                    <ul className="space-y-1 text-blue-700">
                                      {step.tips.map((tip, tipIdx) => (
                                        <li key={tipIdx}>• {tip}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Next Actions */}
      {data.nextBestActions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recommended Next Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.nextBestActions.map((action, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 border rounded-lg">
                  <Circle className="h-4 w-4 text-blue-500" />
                  <span className="text-sm">{action}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}