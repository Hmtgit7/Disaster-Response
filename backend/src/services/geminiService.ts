import { GoogleGenerativeAI } from '@google/generative-ai';
import { GeocodingResult, ImageVerificationResult } from '../types';
import { getCachedData, setCachedData } from './cacheService';
import logger from '../utils/logger';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export class GeminiService {
  private model = genAI.getGenerativeModel({ model: 'gemini-pro' });
  private visionModel = genAI.getGenerativeModel({ model: 'gemini-pro-vision' });

  /**
   * Extract location names from disaster descriptions using Gemini AI
   */
  async extractLocation(description: string): Promise<GeocodingResult | null> {
    try {
      const cacheKey = `location_extraction:${Buffer.from(description).toString('base64')}`;
      
      // Check cache first
      const cached = await getCachedData(cacheKey);
      if (cached) {
        logger.info('Location extraction result retrieved from cache');
        return cached as GeocodingResult;
      }

      const prompt = `
        Extract the location name from the following disaster description. 
        Return only the location name in a clear, standardized format.
        If multiple locations are mentioned, return the primary one.
        If no clear location is found, return null.
        
        Description: "${description}"
        
        Return format: Just the location name (e.g., "Manhattan, NYC", "Los Angeles, CA")
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const locationName = response.text().trim();

      if (!locationName || locationName.toLowerCase().includes('null') || locationName.toLowerCase().includes('no location')) {
        logger.warn('No location found in description', { description });
        return null;
      }

      const geocodingResult: GeocodingResult = {
        location_name: locationName,
        lat: 0, // Will be filled by geocoding service
        lng: 0, // Will be filled by geocoding service
        formatted_address: locationName
      };

      // Cache the result
      await setCachedData(cacheKey, geocodingResult, 3600); // 1 hour cache

      logger.info('Location extracted successfully', { 
        description: description.substring(0, 100), 
        location: locationName 
      });

      return geocodingResult;
    } catch (error) {
      logger.error('Error extracting location with Gemini', { error, description });
      throw new Error('Failed to extract location from description');
    }
  }

  /**
   * Verify image authenticity using Gemini Vision API
   */
  async verifyImage(imageUrl: string, disasterContext?: string): Promise<ImageVerificationResult> {
    try {
      const cacheKey = `image_verification:${Buffer.from(imageUrl).toString('base64')}`;
      
      // Check cache first
      const cached = await getCachedData(cacheKey);
      if (cached) {
        logger.info('Image verification result retrieved from cache');
        return cached as ImageVerificationResult;
      }

      // Download image for analysis
      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
        throw new Error('Failed to fetch image for verification');
      }

      const imageBuffer = await imageResponse.arrayBuffer();
      const imageData = {
        inlineData: {
          data: Buffer.from(imageBuffer).toString('base64'),
          mimeType: imageResponse.headers.get('content-type') || 'image/jpeg'
        }
      };

      const prompt = `
        Analyze this image for authenticity in the context of disaster reporting.
        
        ${disasterContext ? `Disaster Context: ${disasterContext}` : ''}
        
        Please assess:
        1. Does this image appear to show a real disaster situation?
        2. Are there signs of digital manipulation or editing?
        3. Does the content match typical disaster scenarios?
        4. What is your confidence level in the authenticity (0-100)?
        
        Return your analysis in JSON format:
        {
          "is_authentic": boolean,
          "confidence": number (0-100),
          "analysis": "detailed explanation",
          "detected_manipulations": ["list of any detected manipulations"]
        }
      `;

      const result = await this.visionModel.generateContent([prompt, imageData]);
      const response = await result.response;
      const analysisText = response.text();

      // Parse JSON response
      let verificationResult: ImageVerificationResult;
      try {
        const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          verificationResult = JSON.parse(jsonMatch[0]);
        } else {
          // Fallback parsing
          verificationResult = {
            is_authentic: !analysisText.toLowerCase().includes('fake') && !analysisText.toLowerCase().includes('manipulated'),
            confidence: analysisText.includes('high') ? 80 : analysisText.includes('medium') ? 60 : 40,
            analysis: analysisText,
            detected_manipulations: analysisText.toLowerCase().includes('manipulation') ? ['Potential editing detected'] : []
          };
        }
      } catch (parseError) {
        logger.warn('Failed to parse Gemini response as JSON, using fallback', { analysisText });
        verificationResult = {
          is_authentic: true, // Default to authentic if parsing fails
          confidence: 50,
          analysis: analysisText,
          detected_manipulations: []
        };
      }

      // Cache the result
      await setCachedData(cacheKey, verificationResult, 3600); // 1 hour cache

      logger.info('Image verification completed', { 
        imageUrl, 
        isAuthentic: verificationResult.is_authentic,
        confidence: verificationResult.confidence 
      });

      return verificationResult;
    } catch (error) {
      logger.error('Error verifying image with Gemini', { error, imageUrl });
      
      // Return fallback result
      return {
        is_authentic: true, // Default to authentic on error
        confidence: 30,
        analysis: 'Unable to verify image due to technical error',
        detected_manipulations: []
      };
    }
  }

  /**
   * Analyze social media content for priority classification
   */
  async classifySocialMediaPriority(content: string): Promise<'low' | 'medium' | 'high' | 'urgent'> {
    try {
      const cacheKey = `priority_classification:${Buffer.from(content).toString('base64')}`;
      
      // Check cache first
      const cached = await getCachedData(cacheKey);
      if (cached) {
        return cached as 'low' | 'medium' | 'high' | 'urgent';
      }

      const prompt = `
        Analyze this social media post for disaster response priority.
        
        Content: "${content}"
        
        Classify the priority level based on:
        - URGENT: Immediate life-threatening situations, SOS calls, critical needs
        - HIGH: Serious situations requiring immediate attention
        - MEDIUM: Important but not immediately critical
        - LOW: General information, updates, non-critical
        
        Return only one word: URGENT, HIGH, MEDIUM, or LOW
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const priority = response.text().trim().toLowerCase() as 'low' | 'medium' | 'high' | 'urgent';

      // Validate priority
      const validPriorities = ['low', 'medium', 'high', 'urgent'];
      const finalPriority = validPriorities.includes(priority) ? priority : 'medium';

      // Cache the result
      await setCachedData(cacheKey, finalPriority, 1800); // 30 minutes cache

      logger.info('Social media priority classified', { content: content.substring(0, 100), priority: finalPriority });

      return finalPriority;
    } catch (error) {
      logger.error('Error classifying social media priority', { error, content });
      return 'medium'; // Default priority on error
    }
  }
}

export const geminiService = new GeminiService(); 