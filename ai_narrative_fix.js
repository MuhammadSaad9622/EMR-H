// Enhanced AI Narrative section for PatientDetails.tsx
// Replace the existing AI narrative section with this code

// AI NARRATIVE (formatted) - Always include for comprehensive reports
console.log('Processing AI Narrative:', {
  hasAiNarrative: !!aiNarrative,
  narrativeType: typeof aiNarrative,
  narrativeLength: aiNarrative ? aiNarrative.length : 0,
  narrativePreview: aiNarrative ? aiNarrative.substring(0, 100) + '...' : 'No content'
});

if (aiNarrative && aiNarrative.trim().length > 0) {
  // Add a prominent section for AI-generated comprehensive narrative
  if (y + 50 > 260) {
    doc.addPage();
    y = 30;
  }
  
  // Main AI Narrative heading with special styling
  doc.setFillColor(colors.purple[0], colors.purple[1], colors.purple[2]);
  doc.roundedRect(margin - 2, y - 6, pageWidth - margin * 2 + 4, 15, 3, 3, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text('COMPREHENSIVE MEDICAL NARRATIVE', pageWidth / 2, y + 4, { align: 'center' });
  y += 20;

  // Parse AI narrative sections and format them beautifully
  const matches = [...aiNarrative.matchAll(/\*\*(.+?):\*\*\s*([\s\S]*?)(?=\*\*|$)/g)];
  
  console.log('AI Narrative parsing:', {
    matchesFound: matches.length,
    sections: matches.map(([_, section]) => section.trim())
  });
  
  if (matches.length > 0) {
    matches.forEach(([_, section, content]) => {
      const sectionTitle = section.trim().toUpperCase();
      const sectionContent = content.trim();
      
      console.log(`Processing section: ${sectionTitle}, content length: ${sectionContent.length}`);
      
      // Check if we need a new page
      const contentLines = doc.splitTextToSize(sectionContent, pageWidth - margin * 2);
      const estimatedHeight = contentLines.length * 6 + 20; // 6pt per line + 20pt for title
      
      if (y + estimatedHeight > 260) {
        doc.addPage();
        y = 30;
      }
      
      // Section title with enhanced styling
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(colors.purple[0], colors.purple[1], colors.purple[2]);
      doc.text(sectionTitle, margin, y);
      
      // Add underline for section title
      const titleWidth = doc.getTextWidth(sectionTitle);
      doc.setDrawColor(colors.purple[0], colors.purple[1], colors.purple[2]);
      doc.line(margin, y + 2, margin + titleWidth, y + 2);
      y += 8;
      
      // Section content with improved formatting
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(50);
      
      // Format content with enhanced bullet points and spacing
      const formattedContent = formatAINarrativeContent(sectionContent);
      const paragraphs = formattedContent.split('\n').filter(p => p.trim());
      
      paragraphs.forEach(paragraph => {
        const trimmedParagraph = paragraph.trim();
        if (trimmedParagraph) {
          // Check if paragraph starts with bullet point indicators
          if (trimmedParagraph.startsWith('•')) {
            // Format as bullet points with enhanced styling
            const bulletContent = trimmedParagraph.replace(/^•\s*/, '');
            const bulletLines = doc.splitTextToSize(`• ${bulletContent}`, pageWidth - margin * 2 - 10);
            
            bulletLines.forEach((line, index) => {
              if (y + 6 > 260) {
                doc.addPage();
                y = 30;
              }
              
              if (index === 0) {
                // First line of bullet point
                doc.text(line, margin + 5, y);
              } else {
                // Continuation lines (indented)
                doc.text(line, margin + 15, y);
              }
              y += 6;
            });
            y += 3; // Extra spacing between bullet points
          } else if (trimmedParagraph.match(/^\d+\./)) {
            // Format as numbered lists
            const numberedLines = doc.splitTextToSize(trimmedParagraph, pageWidth - margin * 2 - 5);
            
            numberedLines.forEach((line, index) => {
              if (y + 6 > 260) {
                doc.addPage();
                y = 30;
              }
              
              if (index === 0) {
                // First line of numbered item
                doc.text(line, margin + 3, y);
              } else {
                // Continuation lines (indented)
                doc.text(line, margin + 13, y);
              }
              y += 6;
            });
            y += 3; // Extra spacing between numbered items
          } else {
            // Format as regular paragraph with improved spacing
            const lines = doc.splitTextToSize(trimmedParagraph, pageWidth - margin * 2);
            
            lines.forEach(line => {
              if (y + 6 > 260) {
                doc.addPage();
                y = 30;
              }
              doc.text(line, margin, y);
              y += 6;
            });
            y += 4; // Extra spacing between paragraphs
          }
        }
      });
      
      y += 8; // Extra spacing between sections
    });
  } else {
    console.log('No structured sections found, formatting as plain text');
    // Fallback: if no sections found, format the entire narrative as a single section
    const lines = doc.splitTextToSize(aiNarrative, pageWidth - margin * 2);
    
    lines.forEach(line => {
      if (y + 6 > 260) {
        doc.addPage();
        y = 30;
      }
      doc.text(line, margin, y);
      y += 6;
    });
  }
  
  y += 10; // Extra spacing after AI narrative section
} else {
  console.log('No AI narrative to display - adding placeholder');
  
  // Add a placeholder section when no AI narrative is available
  if (y + 50 > 260) {
    doc.addPage();
    y = 30;
  }
  
  // Placeholder heading
  doc.setFillColor(colors.warning[0], colors.warning[1], colors.warning[2]);
  doc.roundedRect(margin - 2, y - 6, pageWidth - margin * 2 + 4, 15, 3, 3, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text('COMPREHENSIVE MEDICAL NARRATIVE', pageWidth / 2, y + 4, { align: 'center' });
  y += 20;
  
  // Placeholder content
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(50);
  doc.text('AI-generated comprehensive medical narrative is not available.', margin, y);
  y += 8;
  doc.text('Please ensure the server is running and the OpenAI API key is configured.', margin, y);
  y += 8;
  doc.text('Check the browser console for error details.', margin, y);
  y += 15;
}