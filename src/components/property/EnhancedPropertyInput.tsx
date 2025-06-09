/**
 * Enhanced Property Input Component
 * 
 * Handles URL extraction with intelligent fallback to manual input
 * Achieves 100% success rate by guiding users through data collection
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, Check, AlertCircle, RefreshCw } from 'lucide-react';
import { unifiedPropertyService, type UnifiedPropertyData } from '@/services/unifiedPropertyService';
import { toast } from '@/components/ui/use-toast';

export interface PropertyInputResult {
  propertyData: UnifiedPropertyData;
  inputMethod: 'url_extraction' | 'manual_input' | 'assisted_input';
}

interface EnhancedPropertyInputProps {
  onPropertyExtracted: (result: PropertyInputResult) => void;
  placeholder?: string;
  title?: string;
  userId?: string;
}

export const EnhancedPropertyInput: React.FC<EnhancedPropertyInputProps> = ({
  onPropertyExtracted,
  placeholder = "Enter property URL or address...",
  title = "Property Information",
  userId
}) => {
  const [input, setInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [extractionResult, setExtractionResult] = useState<any>(null);
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualData, setManualData] = useState<Partial<UnifiedPropertyData>>({});

  // Handle initial URL/address submission
  const handleAnalyze = async () => {
    if (!input.trim()) return;

    setIsAnalyzing(true);
    setExtractionResult(null);

    try {
      console.log('🔍 Analyzing input:', input);

      // Determine if input is URL or address
      const urlRegex = /(https?:\/\/[^\s]+)/i;
      const isUrl = urlRegex.test(input);
      
      let result: UnifiedPropertyData;

      if (isUrl) {
        result = await unifiedPropertyService.analyzePropertyUrl(input, {
          includeRentCast: true,
          includeComparables: true,
          saveToMemory: !!userId,
          userId
        });
      } else {
        result = await unifiedPropertyService.analyzePropertyDetails(
          { address: input },
          { includeRentCast: true, saveToMemory: !!userId, userId }
        );
      }

      setExtractionResult(result);

      // Check extraction quality
      const missingFields = [];
      if (!result.address) missingFields.push('address');
      if (!result.rent) missingFields.push('rent');
      if (!result.beds) missingFields.push('bedrooms');
      if (!result.baths) missingFields.push('bathrooms');
      if (!result.sqft) missingFields.push('square footage');

      if (missingFields.length === 0) {
        // Perfect extraction - proceed immediately
        onPropertyExtracted({
          propertyData: result,
          inputMethod: 'url_extraction'
        });
        toast({
          title: "Property Analyzed",
          description: "All property details extracted successfully!",
        });
      } else {
        // Partial extraction - show fallback form
        setManualData({
          address: result.address || '',
          rent: result.rent || 0,
          beds: result.beds || '',
          baths: result.baths || '',
          sqft: result.sqft || '',
          zipcode: result.zipcode || '',
          propertyName: result.propertyName || ''
        });
        setShowManualForm(true);
        
        toast({
          title: "Partial Extraction",
          description: `Found some details. Please complete the missing: ${missingFields.join(', ')}`,
          variant: "destructive",
        });
      }

    } catch (error) {
      console.error('❌ Analysis failed:', error);
      
      // Complete failure - show manual form
      setShowManualForm(true);
      setManualData({ address: input });
      
      toast({
        title: "Extraction Failed", 
        description: "Please enter property details manually.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Handle manual form submission
  const handleManualSubmit = async () => {
    try {
      if (!manualData.address || !manualData.rent) {
        toast({
          title: "Missing Information",
          description: "Address and rent are required.",
          variant: "destructive",
        });
        return;
      }

      setIsAnalyzing(true);

      // Validate and enhance with RentCast
      const result = await unifiedPropertyService.analyzePropertyDetails(manualData, {
        includeRentCast: true,
        saveToMemory: !!userId,
        userId
      });

      onPropertyExtracted({
        propertyData: result,
        inputMethod: extractionResult ? 'assisted_input' : 'manual_input'
      });

      toast({
        title: "Property Added",
        description: "Property details saved successfully!",
      });

      // Reset form
      setInput('');
      setShowManualForm(false);
      setExtractionResult(null);
      setManualData({});

    } catch (error) {
      console.error('❌ Manual submission failed:', error);
      toast({
        title: "Error",
        description: "Failed to process property details. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Reset to initial state
  const handleReset = () => {
    setInput('');
    setShowManualForm(false);
    setExtractionResult(null);
    setManualData({});
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {title}
          {extractionResult && (
            <Badge variant={extractionResult.verdict === 'complete' ? 'default' : 'secondary'}>
              {extractionResult.extractionQuality || 'extracted'}
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Enter a property URL for automatic analysis, or provide details manually for 100% accuracy
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {!showManualForm ? (
          // Initial URL/Address Input
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={placeholder}
                onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
                disabled={isAnalyzing}
              />
              <Button 
                onClick={handleAnalyze} 
                disabled={!input.trim() || isAnalyzing}
              >
                {isAnalyzing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Analyze'
                )}
              </Button>
            </div>

            {/* Extraction Results Preview */}
            {extractionResult && (
              <Alert>
                <Check className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <div className="font-medium">Extracted Data:</div>
                    <div className="text-sm">
                      {extractionResult.address && <div>📍 {extractionResult.address}</div>}
                      {extractionResult.rent && <div>💰 ${extractionResult.rent}/month</div>}
                      {extractionResult.beds && <div>🛏️ {extractionResult.beds} bed / {extractionResult.baths || '?'} bath</div>}
                      {extractionResult.sqft && <div>📏 {extractionResult.sqft} sqft</div>}
                      {extractionResult.verdict && extractionResult.verdict !== 'unknown' && (
                        <div>📊 Market: {extractionResult.verdict} ({extractionResult.deltaPercent}%)</div>
                      )}
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <Button
              variant="outline"
              onClick={() => setShowManualForm(true)}
              className="w-full"
            >
              Enter Details Manually
            </Button>
          </div>
        ) : (
          // Manual Input Form
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {extractionResult ? (
                  extractionResult.userPrompt || "Please complete the missing property details below."
                ) : (
                  "Enter property details manually for accurate analysis."
                )}
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="address">Property Address *</Label>
                <Textarea
                  id="address"
                  value={manualData.address || ''}
                  onChange={(e) => setManualData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="123 Main St, Austin, TX 78701"
                  required
                />
              </div>

              <div>
                <Label htmlFor="rent">Monthly Rent *</Label>
                <Input
                  id="rent"
                  type="number"
                  value={manualData.rent || ''}
                  onChange={(e) => setManualData(prev => ({ ...prev, rent: parseInt(e.target.value) || 0 }))}
                  placeholder="2500"
                  required
                />
              </div>

              <div>
                <Label htmlFor="zipcode">Zip Code</Label>
                <Input
                  id="zipcode"
                  value={manualData.zipcode || ''}
                  onChange={(e) => setManualData(prev => ({ ...prev, zipcode: e.target.value }))}
                  placeholder="78701"
                />
              </div>

              <div>
                <Label htmlFor="beds">Bedrooms</Label>
                <Input
                  id="beds"
                  type="number"
                  value={manualData.beds || ''}
                  onChange={(e) => setManualData(prev => ({ ...prev, beds: parseInt(e.target.value) || 0 }))}
                  placeholder="2"
                />
              </div>

              <div>
                <Label htmlFor="baths">Bathrooms</Label>
                <Input
                  id="baths"
                  type="number"
                  step="0.5"
                  value={manualData.baths || ''}
                  onChange={(e) => setManualData(prev => ({ ...prev, baths: parseFloat(e.target.value) || 0 }))}
                  placeholder="2"
                />
              </div>

              <div>
                <Label htmlFor="sqft">Square Feet</Label>
                <Input
                  id="sqft"
                  type="number"
                  value={manualData.sqft || ''}
                  onChange={(e) => setManualData(prev => ({ ...prev, sqft: parseInt(e.target.value) || 0 }))}
                  placeholder="1200"
                />
              </div>

              <div>
                <Label htmlFor="propertyName">Property Name</Label>
                <Input
                  id="propertyName"
                  value={manualData.propertyName || ''}
                  onChange={(e) => setManualData(prev => ({ ...prev, propertyName: e.target.value }))}
                  placeholder="Apartment Complex Name"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={handleManualSubmit}
                disabled={!manualData.address || !manualData.rent || isAnalyzing}
                className="flex-1"
              >
                {isAnalyzing ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Check className="h-4 w-4 mr-2" />
                )}
                Add Property
              </Button>
              <Button variant="outline" onClick={handleReset}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Reset
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EnhancedPropertyInput;