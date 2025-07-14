/**
 * Scout Dash 2.0 - Visual Registry
 * Central registry for all visual component types and their configurations
 */

import React from 'react';
import { ScoutVisualType, VisualBlueprint } from '../types';

export interface VisualComponentProps {
  blueprint: VisualBlueprint;
  data: any[];
  width: number;
  height: number;
  onSelection?: (field: string, selected: any[]) => void;
  onFilter?: (field: string, value: any, operator: string) => void;
  isSelected?: boolean;
  theme?: 'light' | 'dark';
}

export interface VisualRegistration {
  type: ScoutVisualType;
  name: string;
  description: string;
  category: 'chart' | 'kpi' | 'table' | 'map' | 'custom';
  component: React.ComponentType<VisualComponentProps>;
  icon: string; // Icon name or SVG
  
  // Configuration requirements
  requirements: {
    minFields: number;
    maxFields?: number;
    requiredEncodings: string[]; // e.g., ['x', 'y']
    optionalEncodings: string[];
    supportedDataTypes: ('nominal' | 'ordinal' | 'quantitative' | 'temporal')[];
  };
  
  // Default configuration
  defaults: {
    encoding: Partial<VisualBlueprint['encoding']>;
    style: Partial<VisualBlueprint['style']>;
    interactions: Partial<VisualBlueprint['interactions']>;
  };
  
  // Validation and recommendations
  validator?: (blueprint: VisualBlueprint) => { valid: boolean; issues: string[] };
  recommender?: (data: any[]) => { recommended: boolean; score: number; reason: string };
}

export class VisualRegistry {
  private visuals: Map<ScoutVisualType, VisualRegistration> = new Map();
  private categories: Map<string, ScoutVisualType[]> = new Map();

  /**
   * Register a new visual type
   */
  register(registration: VisualRegistration): void {
    this.visuals.set(registration.type, registration);
    
    // Update category index
    if (!this.categories.has(registration.category)) {
      this.categories.set(registration.category, []);
    }
    this.categories.get(registration.category)!.push(registration.type);
    
    console.log(`📊 Registered visual: ${registration.name} (${registration.type})`);
  }

  /**
   * Get visual registration by type
   */
  get(type: ScoutVisualType): VisualRegistration | undefined {
    return this.visuals.get(type);
  }

  /**
   * Get all registered visuals
   */
  getAll(): VisualRegistration[] {
    return Array.from(this.visuals.values());
  }

  /**
   * Get visuals by category
   */
  getByCategory(category: string): VisualRegistration[] {
    const types = this.categories.get(category) || [];
    return types.map(type => this.visuals.get(type)!).filter(Boolean);
  }

  /**
   * Get all categories
   */
  getCategories(): string[] {
    return Array.from(this.categories.keys());
  }

  /**
   * Find component for a visual type
   */
  getComponent(type: ScoutVisualType): React.ComponentType<VisualComponentProps> | undefined {
    return this.visuals.get(type)?.component;
  }

  /**
   * Validate a visual blueprint
   */
  validate(blueprint: VisualBlueprint): { valid: boolean; issues: string[] } {
    const registration = this.visuals.get(blueprint.type);
    if (!registration) {
      return { valid: false, issues: [`Unknown visual type: ${blueprint.type}`] };
    }

    const issues: string[] = [];

    // Check field requirements
    const encodingFields = Object.values(blueprint.encoding).filter(Boolean).length;
    if (encodingFields < registration.requirements.minFields) {
      issues.push(`Requires at least ${registration.requirements.minFields} fields, got ${encodingFields}`);
    }

    if (registration.requirements.maxFields && encodingFields > registration.requirements.maxFields) {
      issues.push(`Supports at most ${registration.requirements.maxFields} fields, got ${encodingFields}`);
    }

    // Check required encodings
    registration.requirements.requiredEncodings.forEach(encoding => {
      if (!blueprint.encoding[encoding as keyof typeof blueprint.encoding]) {
        issues.push(`Missing required encoding: ${encoding}`);
      }
    });

    // Run custom validator if available
    if (registration.validator) {
      const customValidation = registration.validator(blueprint);
      if (!customValidation.valid) {
        issues.push(...customValidation.issues);
      }
    }

    return { valid: issues.length === 0, issues };
  }

  /**
   * Recommend visuals for given data
   */
  recommendVisuals(data: any[]): Array<{ type: ScoutVisualType; score: number; reason: string }> {
    if (!data || data.length === 0) {
      return [];
    }

    const recommendations: Array<{ type: ScoutVisualType; score: number; reason: string }> = [];

    this.visuals.forEach((registration, type) => {
      if (registration.recommender) {
        const recommendation = registration.recommender(data);
        if (recommendation.recommended) {
          recommendations.push({
            type,
            score: recommendation.score,
            reason: recommendation.reason
          });
        }
      } else {
        // Default recommendation logic
        const defaultRecommendation = this.getDefaultRecommendation(type, data);
        if (defaultRecommendation.score > 0) {
          recommendations.push({
            type,
            score: defaultRecommendation.score,
            reason: defaultRecommendation.reason
          });
        }
      }
    });

    // Sort by score descending
    return recommendations.sort((a, b) => b.score - a.score);
  }

  /**
   * Default recommendation logic
   */
  private getDefaultRecommendation(type: ScoutVisualType, data: any[]): { score: number; reason: string } {
    const sampleRow = data[0] || {};
    const fields = Object.keys(sampleRow);
    const numericFields = fields.filter(field => 
      typeof sampleRow[field] === 'number' && !isNaN(sampleRow[field])
    );
    const categoricalFields = fields.filter(field => 
      typeof sampleRow[field] === 'string' || typeof sampleRow[field] === 'boolean'
    );
    const dateFields = fields.filter(field => 
      sampleRow[field] instanceof Date || 
      (typeof sampleRow[field] === 'string' && !isNaN(Date.parse(sampleRow[field])))
    );

    switch (type) {
      case 'bar.vertical':
      case 'bar.horizontal':
        if (categoricalFields.length >= 1 && numericFields.length >= 1) {
          return { score: 80, reason: 'Good for comparing categories' };
        }
        return { score: 0, reason: 'Requires categorical and numeric fields' };

      case 'line.basic':
        if (dateFields.length >= 1 && numericFields.length >= 1) {
          return { score: 90, reason: 'Perfect for time series data' };
        }
        if (numericFields.length >= 2) {
          return { score: 60, reason: 'Good for showing trends' };
        }
        return { score: 0, reason: 'Requires date/time and numeric fields' };

      case 'pie.basic':
        if (categoricalFields.length >= 1 && numericFields.length >= 1 && data.length <= 10) {
          return { score: 70, reason: 'Good for part-to-whole relationships' };
        }
        return { score: 0, reason: 'Works best with few categories' };

      case 'scatter.basic':
        if (numericFields.length >= 2) {
          return { score: 75, reason: 'Great for correlation analysis' };
        }
        return { score: 0, reason: 'Requires two numeric fields' };

      case 'table.basic':
        return { score: 50, reason: 'Universal fallback for any data' };

      case 'kpi.card':
        if (numericFields.length === 1 && data.length === 1) {
          return { score: 95, reason: 'Perfect for single metrics' };
        }
        return { score: 0, reason: 'Requires single numeric value' };

      default:
        return { score: 0, reason: 'No recommendation available' };
    }
  }

  /**
   * Create default blueprint for a visual type
   */
  createDefaultBlueprint(
    type: ScoutVisualType, 
    data: any[], 
    overrides: Partial<VisualBlueprint> = {}
  ): VisualBlueprint {
    const registration = this.visuals.get(type);
    if (!registration) {
      throw new Error(`Unknown visual type: ${type}`);
    }

    const sampleRow = data[0] || {};
    const fields = Object.keys(sampleRow);
    
    // Auto-assign fields to encodings based on data types
    const encoding = this.autoAssignEncodings(type, fields, sampleRow);

    const blueprint: VisualBlueprint = {
      id: `visual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      title: registration.name,
      layout: {
        x: 0,
        y: 0,
        w: 6, // Half width by default
        h: 4  // Standard height
      },
      data: {
        source: { type: 'dal' },
        query: {
          select: fields,
          from: 'data' // Will be updated by caller
        }
      },
      encoding: {
        ...registration.defaults.encoding,
        ...encoding
      },
      style: {
        theme: 'default',
        ...registration.defaults.style
      },
      interactions: {
        selection: { type: 'single' },
        hover: { tooltip: true, highlight: true },
        ...registration.defaults.interactions
      },
      ...overrides
    };

    return blueprint;
  }

  /**
   * Auto-assign fields to visual encodings
   */
  private autoAssignEncodings(type: ScoutVisualType, fields: string[], sampleRow: any): Partial<VisualBlueprint['encoding']> {
    const numericFields = fields.filter(field => 
      typeof sampleRow[field] === 'number' && !isNaN(sampleRow[field])
    );
    const categoricalFields = fields.filter(field => 
      typeof sampleRow[field] === 'string' || typeof sampleRow[field] === 'boolean'
    );
    const dateFields = fields.filter(field => 
      sampleRow[field] instanceof Date || 
      (typeof sampleRow[field] === 'string' && !isNaN(Date.parse(sampleRow[field])))
    );

    const encoding: any = {};

    switch (type) {
      case 'bar.vertical':
      case 'bar.horizontal':
        if (categoricalFields.length > 0) {
          encoding.x = {
            field: categoricalFields[0],
            type: 'nominal' as const
          };
        }
        if (numericFields.length > 0) {
          encoding.y = {
            field: numericFields[0],
            type: 'quantitative' as const,
            aggregate: 'sum'
          };
        }
        break;

      case 'line.basic':
        if (dateFields.length > 0) {
          encoding.x = {
            field: dateFields[0],
            type: 'temporal' as const
          };
        } else if (numericFields.length > 1) {
          encoding.x = {
            field: numericFields[0],
            type: 'quantitative' as const
          };
        }
        if (numericFields.length > 0) {
          const yField = dateFields.length > 0 ? numericFields[0] : numericFields[1] || numericFields[0];
          encoding.y = {
            field: yField,
            type: 'quantitative' as const
          };
        }
        break;

      case 'pie.basic':
        if (categoricalFields.length > 0) {
          encoding.color = {
            field: categoricalFields[0],
            type: 'nominal' as const
          };
        }
        if (numericFields.length > 0) {
          encoding.angle = {
            field: numericFields[0],
            type: 'quantitative' as const,
            aggregate: 'sum'
          };
        }
        break;

      case 'scatter.basic':
        if (numericFields.length >= 2) {
          encoding.x = {
            field: numericFields[0],
            type: 'quantitative' as const
          };
          encoding.y = {
            field: numericFields[1],
            type: 'quantitative' as const
          };
        }
        if (categoricalFields.length > 0) {
          encoding.color = {
            field: categoricalFields[0],
            type: 'nominal' as const
          };
        }
        break;

      case 'kpi.card':
        if (numericFields.length > 0) {
          encoding.text = {
            field: numericFields[0],
            type: 'quantitative' as const,
            aggregate: 'sum'
          };
        }
        break;
    }

    return encoding;
  }

  /**
   * Get visualization suggestions for data
   */
  getSuggestions(data: any[]): Array<{
    type: ScoutVisualType;
    name: string;
    score: number;
    reason: string;
    preview: VisualBlueprint;
  }> {
    const recommendations = this.recommendVisuals(data);
    
    return recommendations.map(rec => {
      const registration = this.visuals.get(rec.type)!;
      const preview = this.createDefaultBlueprint(rec.type, data);
      
      return {
        type: rec.type,
        name: registration.name,
        score: rec.score,
        reason: rec.reason,
        preview
      };
    });
  }

  /**
   * Check if visual type is supported
   */
  isSupported(type: ScoutVisualType): boolean {
    return this.visuals.has(type);
  }

  /**
   * Get visual metadata
   */
  getMetadata(type: ScoutVisualType): Omit<VisualRegistration, 'component'> | undefined {
    const registration = this.visuals.get(type);
    if (!registration) return undefined;

    const { component, ...metadata } = registration;
    return metadata;
  }
}

// Singleton registry instance
export const visualRegistry = new VisualRegistry();