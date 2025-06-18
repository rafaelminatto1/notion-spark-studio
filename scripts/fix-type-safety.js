#!/usr/bin/env node

/**
 * Script para correção sistemática de type safety
 * Corrige problemas em lotes organizados por prioridade
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuração das fases de correção
const CORRECTION_PHASES = [
  {
    name: 'Phase 1: Template Expressions',
    pattern: 'restrict-template-expressions',
    priority: 'HIGH',
    autofix: true,
    estimatedTime: '30min'
  },
  {
    name: 'Phase 2: Floating Promises', 
    pattern: 'no-floating-promises',
    priority: 'HIGH',
    autofix: true,
    estimatedTime: '45min'
  },
  {
    name: 'Phase 3: Require Await',
    pattern: 'require-await',
    priority: 'HIGH', 
    autofix: true,
    estimatedTime: '60min'
  },
  {
    name: 'Phase 4: Explicit Any Types',
    pattern: 'no-explicit-any',
    priority: 'MEDIUM',
    autofix: false,
    estimatedTime: '2-3 days'
  },
  {
    name: 'Phase 5: Unsafe Operations',
    pattern: 'no-unsafe-',
    priority: 'CRITICAL',
    autofix: false,
    estimatedTime: '1-2 weeks'
  }
];

function runPhase(phase) {
  console.log(`\n🚀 Starting ${phase.name}`);
  console.log(`⏱️  Estimated time: ${phase.estimatedTime}`);
  console.log(`🎯 Priority: ${phase.priority}`);
  
  try {
    if (phase.autofix) {
      console.log('Running automatic fixes...');
      execSync(`npx eslint src --fix --rule "${phase.pattern}: error"`, { stdio: 'inherit' });
    } else {
      console.log('Manual fixes required. Generating report...');
      const output = execSync(`npx eslint src --format=json --rule "${phase.pattern}: error"`);
      
      const report = JSON.parse(output.toString());
      const reportPath = `reports/phase-${phase.name.toLowerCase().replace(/\s+/g, '-')}.json`;
      
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
      console.log(`📊 Report saved to: ${reportPath}`);
    }
    
    console.log(`✅ ${phase.name} completed`);
  } catch (error) {
    console.error(`❌ Error in ${phase.name}:`, error.message);
  }
}

function generateProgressReport() {
  console.log('\n📊 Generating progress report...');
  
  try {
    const output = execSync('npx eslint src --format=json', { stdio: 'pipe' });
    const results = JSON.parse(output.toString());
    
    let totalErrors = 0;
    let totalWarnings = 0;
    const ruleStats = {};
    
    results.forEach(file => {
      file.messages.forEach(msg => {
        if (msg.severity === 2) totalErrors++;
        if (msg.severity === 1) totalWarnings++;
        
        ruleStats[msg.ruleId] = (ruleStats[msg.ruleId] || 0) + 1;
      });
    });
    
    const report = {
      timestamp: new Date().toISOString(),
      totalErrors,
      totalWarnings,
      totalProblems: totalErrors + totalWarnings,
      topRules: Object.entries(ruleStats)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([rule, count]) => ({ rule, count }))
    };
    
    fs.writeFileSync('reports/progress-report.json', JSON.stringify(report, null, 2));
    console.log('📈 Progress report saved to reports/progress-report.json');
    
    return report;
  } catch (error) {
    console.error('Error generating report:', error.message);
    return null;
  }
}

// Main execution
function main() {
  console.log('🔧 TypeScript Type Safety Correction Tool');
  console.log('==========================================');
  
  // Ensure reports directory exists
  if (!fs.existsSync('reports')) {
    fs.mkdirSync('reports');
  }
  
  // Generate initial report
  const initialReport = generateProgressReport();
  if (initialReport) {
    console.log(`📊 Initial state: ${initialReport.totalProblems} problems (${initialReport.totalErrors} errors, ${initialReport.totalWarnings} warnings)`);
  }
  
  // Run phases based on command line argument
  const phaseArg = process.argv[2];
  
  if (phaseArg === 'all') {
    CORRECTION_PHASES.forEach(runPhase);
  } else if (phaseArg && !isNaN(parseInt(phaseArg))) {
    const phaseIndex = parseInt(phaseArg) - 1;
    if (phaseIndex >= 0 && phaseIndex < CORRECTION_PHASES.length) {
      runPhase(CORRECTION_PHASES[phaseIndex]);
    } else {
      console.error('Invalid phase number');
    }
  } else {
    console.log('\nAvailable phases:');
    CORRECTION_PHASES.forEach((phase, index) => {
      console.log(`  ${index + 1}. ${phase.name} (${phase.estimatedTime})`);
    });
    console.log('\nUsage:');
    console.log('  node scripts/fix-type-safety.js 1    # Run phase 1');
    console.log('  node scripts/fix-type-safety.js all  # Run all phases');
  }
  
  // Generate final report
  console.log('\n📊 Generating final report...');
  generateProgressReport();
}

if (require.main === module) {
  main();
} 