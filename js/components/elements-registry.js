/**
 * Elements Registry - Simplified Component Aggregation
 * 
 * This file replaces elements.js and elementsUtils.js with a much simpler approach.
 * It aggregates all components into the StandardElements object that the rest of the app expects.
 */

// Dependencies: All component files should be loaded before this file

console.log('🔄 Aggregating components into StandardElements...');

// Debug: Check what components are available
console.log('🔍 Available components:', {
  SharedUtilities: !!window.SharedUtilities,
  LayoutComponents: !!window.LayoutComponents,
  InteractionComponents: !!window.InteractionComponents,
  ProgressComponents: !!window.ProgressComponents,
  PartitionedRectangleComponent: !!window.PartitionedRectangleComponent,
  NumberPadComponent: !!window.NumberPadComponent,
  TableGridComponent: !!window.TableGridComponent,
  FillBlanksComponent: !!window.FillBlanksComponent,
  ArrangeStepsComponent: !!window.ArrangeStepsComponent,
  SolutionStepComponent: !!window.SolutionStepComponent,
  FeedbackTextboxComponent: !!window.FeedbackTextboxComponent,
  TileComponent: !!window.TileComponent,
  HotspotComponent: !!window.HotspotComponent,
  LineComponent: !!window.LineComponent,
  StageComponent: !!window.StageComponent,
  CalculationStepsComponent: !!window.CalculationStepsComponent,
  QuadrilateralComponent: !!window.QuadrilateralComponent,
  AngleMarkerComponent: !!window.AngleMarkerComponent,
  PropertyIndicatorComponent: !!window.PropertyIndicatorComponent,
  PropertyPanelComponent: !!window.PropertyPanelComponent,
  ImageStackComponent: !!window.ImageStackComponent
});

// Import all component configurations
const layoutElements = window.LayoutComponents?.LayoutElements || {};
const interactionElements = window.InteractionComponents?.InteractionElements || {};
const progressElements = window.ProgressComponents?.ProgressElements || {};
const partitionedRectangleElement = window.PartitionedRectangleComponent?.PartitionedRectangleElement || {};
const numberPadElement = window.NumberPadComponent?.NumberPadElement || {};
const tableGridElement = window.TableGridComponent?.TableGridElement || {};
const fillBlanksElement = window.FillBlanksComponent?.FillBlanksElement || {};
const arrangeStepsElement = window.ArrangeStepsComponent?.ArrangeStepsElement || {};
const solutionStepElement = window.SolutionStepComponent?.SolutionStepElement || {};
const feedbackTextboxElement = window.FeedbackTextboxComponent?.FeedbackTextboxElement || {};
const tileElement = window.TileComponent?.TileElement || {};
const hotspotElement = window.HotspotComponent?.HotspotElement || {};
const lineElement = window.LineComponent?.LineElement || {};
const stageElement = window.StageComponent?.StageElement || {};
const calculationStepsElement = window.CalculationStepsComponent?.CalculationStepsElement || {};
const quadrilateralElement = window.QuadrilateralComponent?.QuadrilateralElement || {};
const angleMarkerElement = window.AngleMarkerComponent?.AngleMarkerElement || {};
const propertyIndicatorElement = window.PropertyIndicatorComponent?.PropertyIndicatorElement || {};
const propertyPanelElement = window.PropertyPanelComponent?.PropertyPanelElement || {};
const imageStackElement = window.ImageStackComponent?.ImageStackElement || {};

// Create the StandardElements object that the rest of the app expects
const StandardElements = {
  // Layout elements
  ...layoutElements,
  
  // Interaction elements  
  ...interactionElements,
  
  // Progress elements
  ...progressElements,
  
  // Complex elements
  ...partitionedRectangleElement,
  ...numberPadElement,
  ...tableGridElement,
  ...fillBlanksElement,
  ...feedbackTextboxElement,
  ...tileElement,
  ...hotspotElement,
  ...lineElement,
  ...stageElement,
  ...calculationStepsElement,
  
  // Quadrilateral system elements
  ...quadrilateralElement,
  ...angleMarkerElement,
  ...propertyIndicatorElement,
  ...propertyPanelElement,
  
  // Image stack element
  ...imageStackElement
};

// Export StandardElements globally (this is what gridpositions.js and other files expect)
window.StandardElements = StandardElements;
window.StandardElementsReact18 = StandardElements; // React 18 version

// Export context utilities from shared utilities
window.ElementProvider = window.SharedUtilities?.ElementProvider;
window.useElements = window.SharedUtilities?.useElements;
window.ElementLoadingFallback = window.SharedUtilities?.ElementLoadingFallback;

console.log('✅ StandardElements created with keys:', Object.keys(StandardElements));

// Create simplified ElementsUtils with only the functions that are actually used
const ElementsUtils = {
  // Table element creator (used by math-applet.js)
  createTableElement: (currentPage) => {
    return React.createElement('div', {
      className: 'table-element-container',
      'data-element-type': 'table',
      'data-page': currentPage
    }, 'Table content will be rendered here');
  },
  
  // Partitioned rectangle element creator (used by math-applet.js)
  createPartitionedRectangleElement: (currentPage, elementName, coordinates, elementProps, zIndex) => {
    const PartitionedRectangleComponent = window.PartitionedRectangleComponent?.PartitionedRectangleComponent;
    if (PartitionedRectangleComponent) {
      return React.createElement(PartitionedRectangleComponent, {
        currentPage,
        elementName,
        coordinates,
        elementProps,
        zIndex
      });
    }
    return React.createElement('div', {
      className: 'partitioned-rectangle-container',
      'data-element-type': 'partitioned-rectangle'
    }, 'Partitioned rectangle content');
  },
  
  // Number pad panel element creator (used by math-applet.js)
  createNumberPadPanelElement: (props) => {
    const NumberPadPanelComponent = window.NumberPadComponent?.NumberPadPanelComponent;
    if (NumberPadPanelComponent) {
      return React.createElement(NumberPadPanelComponent, props);
    }
    return React.createElement('div', {
      className: 'number-pad-panel-container',
      'data-element-type': 'number-pad-panel'
    }, 'Number pad content');
  },
  
  // Line element creator (used by math-applet.js)
  createLineElement: (currentPage, elementName, coordinates, elementProps, zIndex) => {
    const LineComponent = window.LineComponent?.LineComponent;
    if (LineComponent) {
      // Remove componentType from props as it's not needed by LineComponent
      const { componentType, ...lineProps } = elementProps || {};
      return React.createElement(LineComponent, {
        id: elementName,
        elementName,
        currentPage,
        coordinates,
        ...lineProps,
        zIndex
      });
    }
    return React.createElement('div', {
      className: 'line-container',
      'data-element-type': 'line'
    }, 'Line content');
  },
  
  // Custom component creator (used for ProblemSolveHeaderComponent and other custom components)
  createCustomElement: (props) => {
    const textFromProps = props.text;
    let { componentType, processedStyles, elementName, ...otherProps } = props;
    // Fallback: infer componentType from elementName or id when missing (e.g. page1 custom elements, page2 division grid, page2 instruction text)
    if (!componentType && (elementName || otherProps.id)) {
      const nameToType = {
        'question-text-box': 'QuestionComponent',
        'division-problem-display': 'DivisionProblemDisplay',
        'instruction-text': 'TeacherNoteComponent',
        'page2-instruction-text': 'TeacherNoteComponent',
        'page1-header': 'Page1Header',
        'page2-header': 'Page1Header',
        'division-grid-default': 'LongDivisionGrid'
      };
      componentType = nameToType[elementName] || (otherProps.id === 'page2-division-grid-default' ? 'LongDivisionGrid' : undefined) || (otherProps.id === 'page2-instruction-text' ? 'TeacherNoteComponent' : undefined);
    }

    console.log('🔍 createCustomElement called with props:', props);
    console.log('🔍 createCustomElement componentType:', componentType);
    console.log('🔍 createCustomElement processedStyles:', processedStyles);
    console.log('🔍 createCustomElement otherProps:', otherProps);
    
    if (componentType === 'TableGridComponent') {
      console.log('🔍 createCustomElement: TableGridComponent detected!');
    }
    
    // Handle ProblemSolveHeaderComponent
    if (componentType === 'ProblemSolveHeaderComponent') {
      const ProblemSolveHeaderComponent = window.LayoutComponents?.ProblemSolveHeaderComponent;
      if (ProblemSolveHeaderComponent) {
        // Merge processed styles with other props to ensure gc units are applied
        const mergedProps = {
          ...otherProps,
          ...processedStyles, // This contains the processed gc units like fontSize
          processedStyles: processedStyles // Also pass it separately for the component to use
        };
        
        console.log('🔍 createCustomElement creating ProblemSolveHeaderComponent with mergedProps:', mergedProps);
        return React.createElement(ProblemSolveHeaderComponent, mergedProps);
      }
    }
    
    // Handle QuestionComponent
    if (componentType === 'QuestionComponent') {
      console.log('🔍 createCustomElement: Found QuestionComponent!');
      const QuestionComponent = window.LayoutComponents?.QuestionComponent;
      if (QuestionComponent) {
        console.log('🔍 createCustomElement: QuestionComponent exists in window.LayoutComponents');
        // Merge processed styles with other props to ensure gc units are applied
        const mergedProps = {
          ...otherProps,
          ...processedStyles, // This contains the processed gc units like fontSize
          processedStyles: processedStyles // Also pass it separately for the component to use
        };
        
        console.log('🔍 createCustomElement creating QuestionComponent with mergedProps:', mergedProps);
        return React.createElement(QuestionComponent, mergedProps);
      } else {
        console.log('🔍 createCustomElement: QuestionComponent NOT found in window.LayoutComponents');
      }
    }
    
    // Handle InformationAnalysisComponent
    if (componentType === 'InformationAnalysisComponent') {
      console.log('🔍 createCustomElement: Found InformationAnalysisComponent!');
      const InformationAnalysisComponent = window.LayoutComponents?.InformationAnalysisComponent;
      if (InformationAnalysisComponent) {
        console.log('🔍 createCustomElement: InformationAnalysisComponent exists in window.LayoutComponents');
        // Merge processed styles with other props to ensure gc units are applied
        const mergedProps = {
          ...otherProps,
          ...processedStyles, // This contains the processed gc units like fontSize
          processedStyles: processedStyles // Also pass it separately for the component to use
        };
        
        console.log('🔍 createCustomElement creating InformationAnalysisComponent with mergedProps:', mergedProps);
        return React.createElement(InformationAnalysisComponent, mergedProps);
      } else {
        console.log('🔍 createCustomElement: InformationAnalysisComponent NOT found in window.LayoutComponents');
      }
    }
    
    // Handle ConceptSummaryComponent
    if (componentType === 'ConceptSummaryComponent') {
      console.log('🔍 createCustomElement: Found ConceptSummaryComponent!');
      const ConceptSummaryComponent = window.LayoutComponents?.ConceptSummaryComponent;
      if (ConceptSummaryComponent) {
        console.log('🔍 createCustomElement: ConceptSummaryComponent exists in window.LayoutComponents');
        // Merge processed styles with other props to ensure gc units are applied
        const mergedProps = {
          ...otherProps,
          ...processedStyles, // This contains the processed gc units like fontSize
          processedStyles: processedStyles // Also pass it separately for the component to use
        };
        
        console.log('🔍 createCustomElement creating ConceptSummaryComponent with mergedProps:', mergedProps);
        return React.createElement(ConceptSummaryComponent, mergedProps);
      } else {
        console.log('🔍 createCustomElement: ConceptSummaryComponent NOT found in window.LayoutComponents');
      }
    }
    
    // Handle Page1HeaderComponent (reads dividend/divisor from window.question)
    if (componentType === 'Page1Header') {
      const Page1HeaderComponent = window.LayoutComponents?.Page1HeaderComponent;
      if (Page1HeaderComponent) {
        const mergedProps = {
          ...otherProps,
          ...processedStyles,
          processedStyles: processedStyles
        };
        return React.createElement(Page1HeaderComponent, mergedProps);
      }
    }

    // Handle StaticImageComponent (e.g. tap.gif hint near next button)
    if (componentType === 'StaticImageComponent') {
      const StaticImageComponent = window.LayoutComponents?.StaticImageComponent;
      if (StaticImageComponent) {
        const mergedProps = {
          ...otherProps,
          ...processedStyles,
          position: otherProps.position,
          elementZIndex: otherProps.elementZIndex
        };
        return React.createElement(StaticImageComponent, mergedProps);
      }
    }

    // Handle DivisionProblemDisplayComponent
    if (componentType === 'DivisionProblemDisplay') {
      const DivisionProblemDisplayComponent = window.LayoutComponents?.DivisionProblemDisplayComponent;
      if (DivisionProblemDisplayComponent) {
        const mergedProps = {
          ...otherProps,
          ...processedStyles,
          processedStyles: processedStyles
        };
        return React.createElement(DivisionProblemDisplayComponent, mergedProps);
      }
    }

    // Handle TeacherNoteComponent
    if (componentType === 'TeacherNoteComponent') {
      console.log('🔍 createCustomElement: Found TeacherNoteComponent!');
      const TeacherNoteComponent = window.LayoutComponents?.TeacherNoteComponent;
      if (TeacherNoteComponent) {
        console.log('🔍 createCustomElement: TeacherNoteComponent exists in window.LayoutComponents');
        // Merge processed styles with other props; ensure text is never lost (e.g. page1-header)
        const mergedProps = {
          ...otherProps,
          ...processedStyles,
          processedStyles: processedStyles,
          text: textFromProps ?? otherProps.text ?? processedStyles?.text
        };
        
        console.log('🔍 createCustomElement creating TeacherNoteComponent with mergedProps:', mergedProps);
        return React.createElement(TeacherNoteComponent, mergedProps);
      } else {
        console.log('🔍 createCustomElement: TeacherNoteComponent NOT found in window.LayoutComponents');
      }
    }
    
    // Handle SectionHeaderComponent
    if (componentType === 'SectionHeaderComponent') {
      console.log('🔍 createCustomElement: Found SectionHeaderComponent!');
      const SectionHeaderComponent = window.LayoutComponents?.SectionHeaderComponent;
      if (SectionHeaderComponent) {
        console.log('🔍 createCustomElement: SectionHeaderComponent exists in window.LayoutComponents');
        // Merge processed styles with other props to ensure gc units are applied
        const mergedProps = {
          ...otherProps,
          ...processedStyles, // This contains the processed gc units like fontSize
          processedStyles: processedStyles // Also pass it separately for the component to use
        };
        
        console.log('🔍 createCustomElement creating SectionHeaderComponent with mergedProps:', mergedProps);
        return React.createElement(SectionHeaderComponent, mergedProps);
      } else {
        console.log('🔍 createCustomElement: SectionHeaderComponent NOT found in window.LayoutComponents');
      }
    }
    
    // Handle QuizPanelComponent
    if (componentType === 'QuizPanelComponent') {
      console.log('🔍 createCustomElement: Found QuizPanelComponent!');
      console.log('🔍 createCustomElement: otherProps:', otherProps);
      console.log('🔍 createCustomElement: otherProps.options:', otherProps.options);
      const QuizPanelComponent = window.LayoutComponents?.QuizPanelComponent;
      if (QuizPanelComponent) {
        console.log('🔍 createCustomElement: QuizPanelComponent exists in window.LayoutComponents');
        // Merge processed styles with other props to ensure gc units are applied
        const mergedProps = {
          ...otherProps,
          ...processedStyles, // This contains the processed gc units like fontSize
          processedStyles: processedStyles // Also pass it separately for the component to use
        };
        
        console.log('🔍 createCustomElement creating QuizPanelComponent with mergedProps:', mergedProps);
        console.log('🔍 createCustomElement mergedProps.options:', mergedProps.options);
        return React.createElement(QuizPanelComponent, mergedProps);
      } else {
        console.log('🔍 createCustomElement: QuizPanelComponent NOT found in window.LayoutComponents');
      }
    }
    
    // Handle CalculationsDetailComponent
    if (componentType === 'CalculationsDetailComponent') {
      console.log('🔍 createCustomElement: Found CalculationsDetailComponent!');
      const CalculationsDetailComponent = window.LayoutComponents?.CalculationsDetailComponent;
      if (CalculationsDetailComponent) {
        console.log('🔍 createCustomElement: CalculationsDetailComponent exists in window.LayoutComponents');
        // Merge processed styles with other props to ensure gc units are applied
        const mergedProps = {
          ...otherProps,
          ...processedStyles, // This contains the processed gc units like fontSize
          processedStyles: processedStyles // Also pass it separately for the component to use
        };
        
        console.log('🔍 createCustomElement creating CalculationsDetailComponent with mergedProps:', mergedProps);
        return React.createElement(CalculationsDetailComponent, mergedProps);
      } else {
        console.log('🔍 createCustomElement: CalculationsDetailComponent NOT found in window.LayoutComponents');
      }
    }
    
    // Handle ComputeBoxComponent
    if (componentType === 'ComputeBoxComponent') {
      console.log('🔍 createCustomElement: Found ComputeBoxComponent!');
      const ComputeBoxComponent = window.LayoutComponents?.ComputeBoxComponent;
      if (ComputeBoxComponent) {
        console.log('🔍 createCustomElement: ComputeBoxComponent exists in window.LayoutComponents');
        // Merge processed styles with other props to ensure gc units are applied
        const mergedProps = {
          ...otherProps,
          ...processedStyles, // This contains the processed gc units like fontSize
          processedStyles: processedStyles // Also pass it separately for the component to use
        };
        
        console.log('🔍 createCustomElement creating ComputeBoxComponent with mergedProps:', mergedProps);
        return React.createElement(ComputeBoxComponent, mergedProps);
      } else {
        console.log('🔍 createCustomElement: ComputeBoxComponent NOT found in window.LayoutComponents');
      }
    }
    
    // Handle TableGridComponent
    if (componentType === 'TableGridComponent') {
      console.log('🔍 createCustomElement: Found TableGridComponent!');
      console.log('🔍 createCustomElement: window.TableGridComponent:', window.TableGridComponent);
      const TableGridComponent = window.TableGridComponent?.TableGridComponent;
      if (TableGridComponent) {
        console.log('🔍 createCustomElement: TableGridComponent exists in window.TableGridComponent');
        // Merge processed styles with other props to ensure gc units are applied
        const mergedProps = {
          ...otherProps,
          ...processedStyles, // This contains the processed gc units like fontSize
          processedStyles: processedStyles, // Also pass it separately for the component to use
          elementName: elementName // Pass elementName for unique cell IDs
        };
        
        console.log('🔍 createCustomElement creating TableGridComponent with mergedProps:', mergedProps);
        return React.createElement(TableGridComponent, mergedProps);
      } else {
        console.log('🔍 createCustomElement: TableGridComponent NOT found in window.TableGridComponent');
        console.log('🔍 createCustomElement: Available window objects:', Object.keys(window).filter(key => key.includes('Table')));
      }
    }
    
    // Handle FillBlanksComponent
    if (componentType === 'FillBlanksComponent') {
      console.log('🔍 createCustomElement: Found FillBlanksComponent!');
      console.log('🔍 createCustomElement: window.FillBlanksComponent:', window.FillBlanksComponent);
      const FillBlanksComponent = window.FillBlanksComponent?.FillBlanksComponent;
      if (FillBlanksComponent) {
        console.log('🔍 createCustomElement: FillBlanksComponent exists in window.FillBlanksComponent');
        // Merge processed styles with other props to ensure gc units are applied
        const mergedProps = {
          ...otherProps,
          ...processedStyles, // This contains the processed gc units like fontSize
          processedStyles: processedStyles // Also pass it separately for the component to use
        };
        
        console.log('🔍 createCustomElement creating FillBlanksComponent with mergedProps:', mergedProps);
        return React.createElement(FillBlanksComponent, mergedProps);
      } else {
        console.log('🔍 createCustomElement: FillBlanksComponent NOT found in window.FillBlanksComponent');
      }
    }
    
    // Handle ArrangeStepsComponent
    if (componentType === 'ArrangeStepsComponent') {
      console.log('🔍 createCustomElement: Found ArrangeStepsComponent!');
      const ArrangeStepsComponent = window.ArrangeStepsComponent?.ArrangeStepsComponent;
      if (ArrangeStepsComponent) {
        console.log('🔍 createCustomElement: ArrangeStepsComponent exists in window.ArrangeStepsComponent');
        // Merge processed styles with other props to ensure gc units are applied
        const mergedProps = {
          ...otherProps,
          ...processedStyles,
          processedStyles: processedStyles
        };
        
        console.log('🔍 createCustomElement creating ArrangeStepsComponent with mergedProps:', mergedProps);
        return React.createElement(ArrangeStepsComponent, mergedProps);
      } else {
        console.log('🔍 createCustomElement: ArrangeStepsComponent NOT found in window.ArrangeStepsComponent');
      }
    }
    
    // Handle SolutionStepComponent
    if (componentType === 'SolutionStepComponent') {
      console.log('🔍 createCustomElement: Found SolutionStepComponent!');
      const SolutionStepComponent = window.SolutionStepComponent?.SolutionStepComponent;
      if (SolutionStepComponent) {
        console.log('🔍 createCustomElement: SolutionStepComponent exists in window.SolutionStepComponent');
        // Merge processed styles with other props to ensure gc units are applied
        const mergedProps = {
          ...otherProps,
          ...processedStyles,
          processedStyles: processedStyles
        };
        
        console.log('🔍 createCustomElement creating SolutionStepComponent with mergedProps:', mergedProps);
        return React.createElement(SolutionStepComponent, mergedProps);
      } else {
        console.log('🔍 createCustomElement: SolutionStepComponent NOT found in window.SolutionStepComponent');
      }
    }
    
    // Handle HotspotComponent
    if (componentType === 'HotspotComponent') {
      console.log('🔍 createCustomElement: Found HotspotComponent!');
      console.log('🔍 createCustomElement: window.HotspotComponent:', window.HotspotComponent);
      const HotspotComponent = window.HotspotComponent?.HotspotComponent;
      if (HotspotComponent) {
        console.log('🔍 createCustomElement: HotspotComponent exists in window.HotspotComponent');
        // Extract coordinates from position object (passed from ElementRenderer)
        const coordinates = otherProps.position?.coordinates;
        const id = otherProps.id;
        const zIndex = otherProps.zIndex || otherProps.elementZIndex;
        
        // Get current page
        const currentPage = typeof window !== 'undefined' && window.getCurrentPage ? window.getCurrentPage() : 1;
        
        // Get element name from id or name prop
        const elementName = otherProps.elementName || otherProps.name || id;
        
        // Merge processed styles with other props to ensure gc units are applied
        const mergedProps = {
          ...otherProps,
          ...processedStyles,
          currentPage: currentPage,
          elementName: elementName,
          coordinates: coordinates,
          zIndex: zIndex
        };
        console.log('🔍 createCustomElement creating HotspotComponent with mergedProps:', mergedProps);
        return React.createElement(HotspotComponent, mergedProps);
      } else {
        console.log('🔍 createCustomElement: HotspotComponent NOT found in window.HotspotComponent');
      }
    }
    
    // Handle TileComponent
    if (componentType === 'TileComponent') {
      console.log('🔍 createCustomElement: Found TileComponent!');
      console.log('🔍 createCustomElement: window.TileComponent:', window.TileComponent);
      const TileComponent = window.TileComponent?.TileComponent;
      if (TileComponent) {
        console.log('🔍 createCustomElement: TileComponent exists in window.TileComponent');
        // Extract coordinates from position object (passed from ElementRenderer)
        const coordinates = otherProps.position?.coordinates;
        const id = otherProps.id;
        const zIndex = otherProps.zIndex || otherProps.elementZIndex;
        
        // Get current page
        const currentPage = typeof window !== 'undefined' && window.getCurrentPage ? window.getCurrentPage() : 1;
        
        // Get element name from id or name prop
        const elementName = otherProps.elementName || otherProps.name || id;
        
        // Merge processed styles with other props to ensure gc units are applied
        const mergedProps = {
          ...otherProps,
          ...processedStyles,
          currentPage: currentPage,
          elementName: elementName,
          coordinates: coordinates,
          zIndex: zIndex
        };
        console.log('🔍 createCustomElement creating TileComponent with mergedProps:', mergedProps);
        return React.createElement(TileComponent, mergedProps);
      } else {
        console.log('🔍 createCustomElement: TileComponent NOT found in window.TileComponent');
      }
    }
    
    // Handle LineComponent
    if (componentType === 'LineComponent') {
      console.log('🔍 createCustomElement: Found LineComponent!');
      console.log('🔍 createCustomElement: window.LineComponent:', window.LineComponent);
      const LineComponent = window.LineComponent?.LineComponent;
      if (LineComponent) {
        console.log('🔍 createCustomElement: LineComponent exists in window.LineComponent');
        // Extract coordinates from position object (passed from ElementRenderer)
        const coordinates = otherProps.position?.coordinates;
        const id = otherProps.id;
        const zIndex = otherProps.zIndex || otherProps.elementZIndex;
        
        // Get current page
        const currentPage = typeof window !== 'undefined' && window.getCurrentPage ? window.getCurrentPage() : 1;
        
        // Get element name from id or name prop
        const elementName = otherProps.elementName || otherProps.name || id;
        
        // Merge processed styles with other props to ensure gc units are applied
        const mergedProps = {
          ...otherProps,
          ...processedStyles,
          currentPage: currentPage,
          elementName: elementName,
          coordinates: coordinates,
          zIndex: zIndex
        };
        console.log('🔍 createCustomElement creating LineComponent with mergedProps:', mergedProps);
        return React.createElement(LineComponent, mergedProps);
      } else {
        console.log('🔍 createCustomElement: LineComponent NOT found in window.LineComponent');
      }
    }
    
    // Handle StageComponent
    if (componentType === 'StageComponent') {
      console.log('🔍 createCustomElement: Found StageComponent!');
      console.log('🔍 createCustomElement: window.StageComponent:', window.StageComponent);
      const StageComponent = window.StageComponent?.StageComponent;
      if (StageComponent) {
        console.log('🔍 createCustomElement: StageComponent exists in window.StageComponent');
        // Merge processed styles with other props to ensure gc units are applied
        const mergedProps = {
          ...otherProps,
          ...processedStyles,
          processedStyles: processedStyles
        };
        console.log('🔍 createCustomElement creating StageComponent with mergedProps:', mergedProps);
        return React.createElement(StageComponent, mergedProps);
      } else {
        console.log('🔍 createCustomElement: StageComponent NOT found in window.StageComponent');
      }
    }
    
    // Handle NumberPadPanelComponent
    if (componentType === 'NumberPadPanelComponent') {
      console.log('🔍 createCustomElement: Found NumberPadPanelComponent!');
      console.log('🔍 createCustomElement: window.NumberPadComponent:', window.NumberPadComponent);
      const NumberPadPanelComponent = window.NumberPadComponent?.NumberPadPanelComponent;
      if (NumberPadPanelComponent) {
        console.log('🔍 createCustomElement: NumberPadPanelComponent exists in window.NumberPadComponent');
        
        // Extract coordinates from position object (passed from ElementRenderer)
        const coordinates = otherProps.position?.coordinates;
        
        // Get current page
        const currentPage = typeof window !== 'undefined' && window.getCurrentPage ? window.getCurrentPage() : 1;
        
        // Get element name from id or name prop
        const elementName = otherProps.name || otherProps.id || 'number-pad';
        
        // Extract elementProps (config) from otherProps, excluding position/processedStyles/componentType
        const { position, processedStyles, componentType, id, name, elementZIndex, ...elementProps } = otherProps;
        
        // Merge processed styles into elementProps for gc unit support
        const configWithStyles = {
          ...elementProps,
          ...processedStyles
        };
        
        const mergedProps = {
          currentPage,
          elementName,
          coordinates,
          elementProps: configWithStyles,
          zIndex: elementZIndex || 1000
        };
        
        console.log('🔍 createCustomElement creating NumberPadPanelComponent with mergedProps:', mergedProps);
        return React.createElement(NumberPadPanelComponent, mergedProps);
      } else {
        console.log('🔍 createCustomElement: NumberPadPanelComponent NOT found in window.NumberPadComponent');
      }
    }
    
    // Handle TapGifComponent (shows/hides based on page completion; receives position from otherProps)
    if (componentType === 'TapGifComponent') {
      const TapGifComponent = window.InteractionComponents?.TapGifComponent;
      if (TapGifComponent) {
        const mergedProps = {
          ...otherProps,
          ...processedStyles,
          processedStyles: processedStyles,
          position: otherProps.position,
          elementZIndex: otherProps.elementZIndex
        };
        return React.createElement(TapGifComponent, mergedProps);
      }
    }
    
    // Handle FeedbackTextboxComponent
    if (componentType === 'FeedbackTextboxComponent') {
      console.log('🔍 createCustomElement: Found FeedbackTextboxComponent!');
      console.log('🔍 createCustomElement: window.FeedbackTextboxComponent:', window.FeedbackTextboxComponent);
      const FeedbackTextboxComponent = window.FeedbackTextboxComponent?.FeedbackTextboxComponent;
      if (FeedbackTextboxComponent) {
        console.log('🔍 createCustomElement: FeedbackTextboxComponent exists in window.FeedbackTextboxComponent');
        // Merge processed styles with other props to ensure gc units are applied
        // Extract id from otherProps if it exists (from element.id)
        const elementId = otherProps.id || (typeof otherProps.elementId !== 'undefined' ? otherProps.elementId : null);
        const mergedProps = {
          ...otherProps,
          id: elementId, // Ensure id is passed
          position: otherProps.position, // Pass position prop for positioning
          elementZIndex: otherProps.elementZIndex, // Pass zIndex
          ...processedStyles, // This contains the processed gc units like fontSize
          processedStyles: processedStyles // Also pass it separately for the component to use
        };
        
        console.log('🔍 createCustomElement creating FeedbackTextboxComponent with mergedProps:', mergedProps);
        console.log('🔍 createCustomElement mergedProps.id:', mergedProps.id);
        console.log('🔍 createCustomElement mergedProps.position:', mergedProps.position);
        return React.createElement(FeedbackTextboxComponent, mergedProps);
      } else {
        console.log('🔍 createCustomElement: FeedbackTextboxComponent NOT found in window.FeedbackTextboxComponent');
      }
    }
    
    // Handle Times4TextboxComponent
    if (componentType === 'Times4TextboxComponent') {
      console.log('🔍 createCustomElement: Found Times4TextboxComponent!');
      const Times4TextboxComponent = window.FeedbackTextboxComponent?.Times4TextboxComponent;
      if (Times4TextboxComponent) {
        console.log('🔍 createCustomElement: Times4TextboxComponent exists');
        const elementId = otherProps.id || (typeof otherProps.elementId !== 'undefined' ? otherProps.elementId : null);
        const mergedProps = {
          ...otherProps,
          id: elementId,
          ...processedStyles,
          processedStyles: processedStyles
        };
        console.log('🔍 createCustomElement creating Times4TextboxComponent with mergedProps:', mergedProps);
        return React.createElement(Times4TextboxComponent, mergedProps);
      } else {
        console.log('🔍 createCustomElement: Times4TextboxComponent NOT found');
      }
    }
    
    // Handle DragDropGame Component
    if (componentType === 'DragDropGame') {
      console.log('🔍 createCustomElement: Found DragDropGame!');
      console.log('🔍 createCustomElement: window.DragDropGameComponent:', window.DragDropGameComponent);
      const DragDropGame = window.DragDropGameComponent?.DragDropGame;
      if (DragDropGame) {
        console.log('🔍 createCustomElement: DragDropGame exists in window.DragDropGameComponent');
        // Merge processed styles with other props to ensure gc units are applied
        const mergedProps = {
          ...otherProps,
          ...processedStyles, // This contains the processed gc units like fontSize
          processedStyles: processedStyles // Also pass it separately for the component to use
        };
        
        console.log('🔍 createCustomElement creating DragDropGame with mergedProps:', mergedProps);
        return React.createElement(DragDropGame, mergedProps);
      } else {
        console.log('🔍 createCustomElement: DragDropGame NOT found in window.DragDropGameComponent');
      }
    }
    
    // Handle Draggable Component
    if (componentType === 'Draggable') {
      console.log('🔍 createCustomElement: Found Draggable!');
      const Draggable = window.DraggableComponent?.Draggable;
      if (Draggable) {
        console.log('🔍 createCustomElement: Draggable exists in window.DraggableComponent');
        const mergedProps = {
          ...otherProps,
          ...processedStyles,
          processedStyles: processedStyles
        };
        console.log('🔍 createCustomElement creating Draggable with mergedProps:', mergedProps);
        return React.createElement(Draggable, mergedProps);
      } else {
        console.log('🔍 createCustomElement: Draggable NOT found in window.DraggableComponent');
      }
    }
    
    // Handle QuadrilateralComponent
    if (componentType === 'QuadrilateralComponent') {
      console.log('🔍 createCustomElement: Found QuadrilateralComponent!');
      const QuadrilateralComponent = window.QuadrilateralComponent?.QuadrilateralComponent;
      if (QuadrilateralComponent) {
        console.log('🔍 createCustomElement: QuadrilateralComponent exists in window.QuadrilateralComponent');
        const mergedProps = {
          ...otherProps,
          ...processedStyles,
          processedStyles: processedStyles
        };
        console.log('🔍 createCustomElement creating QuadrilateralComponent with mergedProps:', mergedProps);
        return React.createElement(QuadrilateralComponent, mergedProps);
      } else {
        console.log('🔍 createCustomElement: QuadrilateralComponent NOT found in window.QuadrilateralComponent');
      }
    }
    
    // Handle ImageStackComponent
    if (componentType === 'ImageStackComponent') {
      console.log('🔍 createCustomElement: Found ImageStackComponent!');
      console.log('🔍 createCustomElement: window.ImageStackComponent:', window.ImageStackComponent);
      const ImageStackComponent = window.ImageStackComponent?.ImageStackComponent;
      if (ImageStackComponent) {
        console.log('🔍 createCustomElement: ImageStackComponent exists in window.ImageStackComponent');
        // Extract coordinates from position object (passed from ElementRenderer)
        const coordinates = otherProps.position?.coordinates;
        const id = otherProps.id;
        const zIndex = otherProps.zIndex || otherProps.elementZIndex;
        
        // Get current page
        const currentPage = typeof window !== 'undefined' && window.getCurrentPage ? window.getCurrentPage() : 1;
        
        // Get element name from id or name prop
        const elementName = otherProps.elementName || otherProps.name || id;
        
        // Merge processed styles with other props to ensure gc units are applied
        const mergedProps = {
          ...otherProps,
          ...processedStyles,
          currentPage: currentPage,
          elementName: elementName,
          coordinates: coordinates,
          zIndex: zIndex
        };
        console.log('🔍 createCustomElement creating ImageStackComponent with mergedProps:', mergedProps);
        return React.createElement(ImageStackComponent, mergedProps);
      } else {
        console.log('🔍 createCustomElement: ImageStackComponent NOT found in window.ImageStackComponent');
      }
    }
    
    // Handle CalculationStepsComponent
    if (componentType === 'CalculationStepsComponent') {
      console.log('🔍 createCustomElement: Found CalculationStepsComponent!');
      console.log('🔍 createCustomElement: window.CalculationStepsComponent:', window.CalculationStepsComponent);
      const CalculationStepsComponent = window.CalculationStepsComponent?.CalculationStepsComponent;
      if (CalculationStepsComponent) {
        console.log('🔍 createCustomElement: CalculationStepsComponent exists in window.CalculationStepsComponent');
        // Merge processed styles with other props to ensure gc units are applied
        const mergedProps = {
          ...otherProps,
          ...processedStyles,
          processedStyles: processedStyles
        };
        console.log('🔍 createCustomElement creating CalculationStepsComponent with mergedProps:', mergedProps);
        return React.createElement(CalculationStepsComponent, mergedProps);
      } else {
        console.log('🔍 createCustomElement: CalculationStepsComponent NOT found in window.CalculationStepsComponent');
      }
    }
    
    // Handle MultiplicationGrid Component
    if (componentType === 'MultiplicationGrid' || componentType === 'multiplication-grid') {
      console.log('🔍 createCustomElement: Found MultiplicationGrid!');
      console.log('🔍 createCustomElement: window.MultiplicationGrid:', window.MultiplicationGrid);
      const MultiplicationGrid = window.MultiplicationGrid;
      if (MultiplicationGrid) {
        console.log('🔍 createCustomElement: MultiplicationGrid exists in window.MultiplicationGrid');
        // Extract position and coordinates for proper positioning
        const position = otherProps.position || {};
        const coordinates = position.coordinates;
        const zIndex = otherProps.elementZIndex || otherProps.zIndex || 402;
        
        // Merge processed styles with other props to ensure gc units are applied
        const mergedProps = {
          ...otherProps,
          ...processedStyles,
          processedStyles: processedStyles,
          position: position,
          coordinates: coordinates
        };
        
        // Wrap in a positioned container to apply coordinates
        return React.createElement('div', {
          style: {
            ...position.css,
            zIndex: zIndex,
            position: 'absolute',
            overflow: 'visible',
            boxSizing: 'border-box'
          }
        }, React.createElement(MultiplicationGrid, mergedProps));
      } else {
        console.log('🔍 createCustomElement: MultiplicationGrid NOT found in window.MultiplicationGrid');
      }
    }
    
    // Handle LongDivisionGrid Component
    if (componentType === 'LongDivisionGrid' || componentType === 'long-division-grid') {
      console.log('🔍 createCustomElement: Found LongDivisionGrid!');
      console.log('🔍 createCustomElement: window.LongDivisionGrid:', window.LongDivisionGrid);
      const LongDivisionGrid = window.LongDivisionGrid;
      if (LongDivisionGrid) {
        console.log('🔍 createCustomElement: LongDivisionGrid exists in window.LongDivisionGrid');
        // Extract position and coordinates for proper positioning
        const position = otherProps.position || {};
        const coordinates = position.coordinates;
        const zIndex = otherProps.elementZIndex || otherProps.zIndex || 402;
        const wrapperCss = position.css || {
          position: 'absolute',
          left: '25%',
          top: '6%',
          width: '50%',
          height: '40%'
        };
        
        // Merge processed styles with other props to ensure gc units are applied
        const mergedProps = {
          ...otherProps,
          ...processedStyles,
          processedStyles: processedStyles,
          position: position,
          coordinates: coordinates
        };
        
        // Wrap in a positioned container to apply coordinates
        return React.createElement('div', {
          style: {
            ...wrapperCss,
            zIndex: zIndex,
            position: 'absolute',
            overflow: 'visible',
            boxSizing: 'border-box'
          }
        }, React.createElement(LongDivisionGrid, mergedProps));
      } else {
        console.log('🔍 createCustomElement: LongDivisionGrid NOT found in window.LongDivisionGrid');
      }
    }
    
    // Handle LongAdditionGrid Component
    if (componentType === 'LongAdditionGrid' || componentType === 'long-addition-grid') {
      console.log('🔍 createCustomElement: Found LongAdditionGrid!');
      console.log('🔍 createCustomElement: window.LongAdditionGrid:', window.LongAdditionGrid);
      const LongAdditionGrid = window.LongAdditionGrid;
      if (LongAdditionGrid) {
        console.log('🔍 createCustomElement: LongAdditionGrid exists in window.LongAdditionGrid');
        // Extract position and coordinates for proper positioning
        const position = otherProps.position || {};
        const coordinates = position.coordinates;
        const zIndex = otherProps.elementZIndex || otherProps.zIndex || 402;
        
        // Merge processed styles with other props to ensure gc units are applied
        const mergedProps = {
          ...otherProps,
          ...processedStyles,
          processedStyles: processedStyles,
          position: position,
          coordinates: coordinates
        };
        
        // Wrap in a positioned container to apply coordinates
        return React.createElement('div', {
          style: {
            ...position.css,
            zIndex: zIndex,
            position: 'absolute',
            overflow: 'visible',
            boxSizing: 'border-box'
          }
        }, React.createElement(LongAdditionGrid, mergedProps));
      } else {
        console.log('🔍 createCustomElement: LongAdditionGrid NOT found in window.LongAdditionGrid');
      }
    }
    
    // Handle LongSubtractionGrid Component
    if (componentType === 'LongSubtractionGrid' || componentType === 'long-subtraction-grid') {
      console.log('🔍 createCustomElement: Found LongSubtractionGrid!');
      console.log('🔍 createCustomElement: window.LongSubtractionGrid:', window.LongSubtractionGrid);
      const LongSubtractionGrid = window.LongSubtractionGrid;
      if (LongSubtractionGrid) {
        console.log('🔍 createCustomElement: LongSubtractionGrid exists in window.LongSubtractionGrid');
        // Extract position and coordinates for proper positioning
        const position = otherProps.position || {};
        const coordinates = position.coordinates;
        const zIndex = otherProps.elementZIndex || otherProps.zIndex || 402;
        
        // Merge processed styles with other props to ensure gc units are applied
        const mergedProps = {
          ...otherProps,
          ...processedStyles,
          processedStyles: processedStyles,
          position: position,
          coordinates: coordinates
        };
        
        // Wrap in a positioned container to apply coordinates
        return React.createElement('div', {
          style: {
            ...position.css,
            zIndex: zIndex,
            position: 'absolute',
            overflow: 'visible',
            boxSizing: 'border-box'
          }
        }, React.createElement(LongSubtractionGrid, mergedProps));
      } else {
        console.log('🔍 createCustomElement: LongSubtractionGrid NOT found in window.LongSubtractionGrid');
      }
    }
    
    // Handle SimpleInputComponent - simple input box with label (using TileComponent)
    if (componentType === 'SimpleInputComponent') {
      const { label, defaultValue, inputType = 'text', min, style = {} } = otherProps;
      const elementId = otherProps.id || `simple-input-${Date.now()}`;
      const inputId = `${elementId}-value`;
      
      // Use TileComponent as the container
      const TileComponent = window.TileComponent?.TileComponent;
      if (TileComponent) {
        // Extract position and coordinates
        const position = otherProps.position || {};
        const coordinates = position.coordinates;
        const currentPage = typeof window !== 'undefined' && window.getCurrentPage ? window.getCurrentPage() : 1;
        const elementName = otherProps.elementName || otherProps.name || elementId;
        const zIndex = otherProps.zIndex || otherProps.elementZIndex || 60;
        
        // Create label element if provided
        const labelElement = label ? React.createElement('label', {
          key: 'label',
          htmlFor: inputId,
          style: {
            position: 'absolute',
            top: '-25px',
            left: '0',
            fontSize: '16px',
            fontWeight: 'bold',
            color: '#333'
          }
        }, label) : null;
        
        // Create input element as child
        const inputElement = React.createElement('input', {
          key: 'input',
          id: inputId,
          type: inputType,
          min: min,
          defaultValue: defaultValue,
          style: {
            width: '100%',
            height: '100%',
            border: 'none',
            outline: 'none',
            backgroundColor: 'transparent',
            textAlign: 'center',
            fontSize: 'inherit',
            color: 'inherit',
            ...style
          },
          onKeyPress: (e) => {
            if (e.key === 'Enter') {
              // Trigger update on Enter key
              const updateButton = document.getElementById('page20-update-button');
              if (updateButton) {
                const clickEvent = new MouseEvent('click', { bubbles: true });
                updateButton.dispatchEvent(clickEvent);
              }
            }
          }
        });
        
        // Create container with label and input
        const containerContent = React.createElement('div', {
          style: {
            position: 'relative',
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }
        }, [labelElement, inputElement].filter(Boolean));
        
        // Wrap TileComponent in a positioned container to avoid getPosition call
        return React.createElement('div', {
          style: {
            ...(position.css || {}),
            zIndex: zIndex,
            position: 'absolute',
            overflow: 'visible',
            boxSizing: 'border-box'
          }
        }, React.createElement(TileComponent, {
          id: elementId,
          elementName: elementName,
          currentPage: currentPage,
          coordinates: null, // Pass null to avoid getPosition call
          zIndex: zIndex,
          backgroundColor: '#FFFFFF',
          borderColor: '#2196F3',
          borderWidth: '2px',
          borderRadius: '8px',
          color: '#333',
          fontSize: '20gc',
          padding: '10px',
          style: {
            width: '100%',
            height: '100%',
            position: 'relative'
          }
        }, containerContent));
      }
      
      // Fallback if TileComponent not available
      return React.createElement('div', {
        id: elementId,
        className: 'simple-input-component',
        style: {
          display: 'flex',
          flexDirection: 'column',
          gap: '5px',
          ...processedStyles
        }
      }, [
        label && React.createElement('label', {
          key: 'label',
          htmlFor: inputId,
          style: {
            fontSize: '16px',
            fontWeight: 'bold',
            color: '#333'
          }
        }, label),
        React.createElement('input', {
          key: 'input',
          id: inputId,
          type: inputType,
          min: min,
          defaultValue: defaultValue,
          style: {
            padding: '8px 12px',
            fontSize: '18px',
            border: '2px solid #2196F3',
            borderRadius: '6px',
            backgroundColor: '#FFFFFF',
            outline: 'none',
            width: '100%',
            boxSizing: 'border-box',
            ...style
          },
          onKeyPress: (e) => {
            if (e.key === 'Enter') {
              const updateButton = document.getElementById('page20-update-button');
              if (updateButton) {
                const clickEvent = new MouseEvent('click', { bubbles: true });
                updateButton.dispatchEvent(clickEvent);
              }
            }
          }
        })
      ]);
    }
    
    // Handle PageInitComponent - component that runs initialization code
    if (componentType === 'PageInitComponent') {
      const PageInitComponent = React.memo((props) => {
        const { onInit } = props;
        React.useEffect(() => {
          if (onInit && typeof onInit === 'function') {
            onInit();
          }
        }, [onInit]);
        return null; // This component doesn't render anything
      });
      return React.createElement(PageInitComponent, otherProps);
    }
    
    // Fallback for unknown custom components
    return React.createElement('div', {
      className: 'custom-component-container',
      'data-element-type': 'custom',
      'data-component-type': componentType
    }, `Custom component: ${componentType}`);
  }
};

// Export ElementsUtils globally (this is what math-applet.js expects)
window.ElementsUtils = ElementsUtils;
window.ElementsUtilsReact18 = ElementsUtils;

console.log('✅ ElementsUtils created with keys:', Object.keys(ElementsUtils));
console.log('✅ Elements registry loaded successfully');
console.log('📊 StandardElements contains:', Object.keys(StandardElements));
console.log('🔧 ElementsUtils contains:', Object.keys(ElementsUtils));
