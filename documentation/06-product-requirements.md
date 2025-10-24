# Product Requirements Document: Sensei Structure Builder

## 1. Executive Summary

### 1.1 Product Vision
Transform Sensei Estimator into a universal AI-powered platform for designing, visualizing, and estimating various small structures, starting with garages and sheds.

### 1.2 Business Objectives
- Expand market reach by 40% by adding shed estimation capabilities
- Increase lead generation through broader customer acquisition
- Create cross-selling opportunities between different structure types
- Establish market leadership in AI-powered structure estimation

## 2. Product Scope

### 2.1 In Scope
- Multi-structure estimation (garages and sheds in v1)
- AI-powered conversational interface
- 3D visualization and realistic rendering
- Dynamic pricing based on materials and specifications
- Dealer integration and lead management

### 2.2 Out of Scope (Future Phases)
- Full backyard design suite
- Permitting and regulatory compliance
- Direct e-commerce functionality
- Advanced structural engineering

## 3. User Personas

### 3.1 Homeowner (Primary User)
- **Needs**: Easy way to design and estimate costs for garages/sheds
- **Pain Points**: Unclear pricing, difficulty visualizing final product
- **Goals**: Get accurate estimates, visualize different options, compare materials

### 3.2 Dealer (Secondary User)
- **Needs**: Generate qualified leads, provide quick quotes
- **Pain Points**: Time-consuming manual estimation, inconsistent pricing
- **Goals**: Increase conversion rates, reduce time per lead

## 4. User Flows

### 4.1 New User Flow
1. User selects structure type (Garage/Shed)
2. Conversational AI collects requirements
3. System generates 3D visualization
4. Real-time price estimation
5. Option to save, share, or request quote

### 4.2 Shed-Specific Flow
1. User selects "Shed" as structure type
2. AI asks key questions:
   - Intended use (storage, workshop, etc.)
   - Size requirements
   - Material preferences
   - Foundation type
   - Additional features (windows, electricity, etc.)
3. System generates shed-specific visualization and estimate

## 5. Technical Requirements

### 5.1 Data Model Extensions

#### Building (Base)
```typescript
interface Building {
  id: string;
  type: 'garage' | 'shed' | 'carport' | 'barn';
  width: number;
  length: number;
  height: number;
  roofType: string;
  material: string;
  createdAt: Date;
  updatedAt: Date;
}
```

#### Shed (Extension)
```typescript
interface Shed extends Building {
  doorType: 'single' | 'double' | 'overhead';
  windowCount: number;
  foundationType: 'concrete' | 'wood_floor' | 'gravel' | 'pier';
  purpose: 'storage' | 'workshop' | 'garden' | 'other';
  hasElectricity: boolean;
  isInsulated: boolean;
  shelving: boolean;
  ramp: boolean;
}
```

### 5.2 API Endpoints

#### Estimate Structure
```
POST /api/v2/estimates
{
  "type": "shed",
  "dimensions": {
    "width": 12,
    "length": 16,
    "height": 8
  },
  "features": {
    "doorType": "double",
    "windowCount": 2,
    "foundationType": "wood_floor",
    "material": "vinyl",
    "electricity": false,
    "insulation": false
  }
}
```

### 5.3 AI Prompt Templates

#### Shed Visualization Prompt
```
Generate a photorealistic image of a {material} shed with these specifications:
- Size: {width}ft x {length}ft x {height}ft
- Roof: {roofType}
- Doors: {doorType}
- Windows: {windowCount}
- Foundation: {foundationType}
- Setting: {setting} (e.g., backyard, garden, rural)
- Style: {style} (e.g., modern, rustic, industrial)
- Lighting: {lighting} (e.g., daylight, sunset, overcast)
```

## 6. Implementation Phases

### Phase 1: Core Infrastructure (Weeks 1-2)
- [ ] Extend database schema for multi-structure support
- [ ] Update API endpoints for structure-agnostic estimation
- [ ] Implement new validation rules for shed-specific fields

### Phase 2: AI & Conversational Flow (Weeks 3-4)
- [ ] Train intent detection for structure types
- [ ] Implement shed-specific conversation paths
- [ ] Update prompt engineering for shed visualization

### Phase 3: Frontend & Visualization (Weeks 5-6)
- [ ] Add structure type selector
- [ ] Implement dynamic form fields based on structure type
- [ ] Update 3D renderer for shed models

### Phase 4: Testing & Optimization (Weeks 7-8)
- [ ] User acceptance testing
- [ ] Performance optimization
- [ ] A/B testing of different conversation flows

## 7. Success Metrics

### 7.1 Key Performance Indicators
- Conversion rate from visitor to lead
- Average time to generate estimate
- Accuracy of initial estimates
- User satisfaction score (CSAT)

### 7.2 Business Impact
- Increase in total leads
- Reduction in time-to-quote for dealers
- Cross-sell ratio (users exploring multiple structure types)

## 8. Risks & Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| User confusion between structure types | Medium | Medium | Clear UI differentiation, guided flow |
| Increased complexity in estimation logic | High | High | Modular pricing engine, thorough testing |
| Performance impact of additional features | Medium | Low | Load testing, optimization |
| Training data limitations for AI | Medium | Medium | Continuous feedback loop, manual review |

## 9. Future Enhancements

### 9.1 Short-term (Next 6 months)
- Additional structure types (carports, pergolas)
- Material comparison tool
- Mobile app for on-site estimation

### 9.2 Long-term (6-12 months)
- AR/VR visualization
- Integration with local building codes
- Automated permit application
- Supply chain integration

## 10. Appendix

### A. Competitor Analysis
[Summary of key competitors and differentiators]

### B. Technical Dependencies
- Ollama/Anthropic for AI
- Three.js for 3D rendering
- Node.js/Express backend
- MySQL database
- Docker/Kubernetes for deployment

### C. Glossary
- **Gauge**: Thickness of metal panels
- **Foundation Type**: Base on which the structure is built
- **Purlin**: Horizontal beam along the length of the roof
- **Eave**: Edge of the roof that overhangs the wall
