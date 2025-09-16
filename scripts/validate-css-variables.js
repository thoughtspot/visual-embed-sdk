#!/usr/bin/env node

/**
 * Script to validate CSS variables consistency between repositories
 * This script extracts CSS variable names from the TypeScript interface
 * and compares them with the implementation in another repository
 */

const fs = require('fs');
const path = require('path');

/**
 * Extract CSS variable names from the TypeScript interface
 * @param {string} filePath - Path to the css-variables.ts file
 * @returns {string[]} Array of CSS variable names
 */
function extractVariablesFromInterface(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Extract variable names using regex
        const variableRegex = /'--ts-var-[^']+'/g;
        const matches = content.match(variableRegex);
        
        if (!matches) {
            console.error('No CSS variables found in the interface file');
            return [];
        }
        
        // Remove quotes and sort for consistent comparison
        return matches.map(match => match.replace(/'/g, '')).sort();
    } catch (error) {
        console.error(`Error reading interface file: ${error.message}`);
        return [];
    }
}

/**
 * Extract CSS variable names from the implementation object
 * @param {string} content - Content of the implementation file
 * @returns {string[]} Array of CSS variable names
 */
function extractVariablesFromImplementation(content) {
    try {
        // Extract variable names from object keys
        const variableRegex = /'--ts-var-[^']+':/g;
        const matches = content.match(variableRegex);
        
        if (!matches) {
            console.error('No CSS variables found in the implementation');
            return [];
        }
        
        // Remove quotes and colon, then sort for consistent comparison
        return matches.map(match => match.replace(/[':]/g, '')).sort();
    } catch (error) {
        console.error(`Error parsing implementation: ${error.message}`);
        return [];
    }
}

/**
 * Compare two arrays of CSS variables and report differences
 * @param {string[]} interfaceVars - Variables from TypeScript interface
 * @param {string[]} implementationVars - Variables from implementation
 * @returns {object} Comparison result
 */
function compareVariables(interfaceVars, implementationVars) {
    const missingInImplementation = interfaceVars.filter(varName => !implementationVars.includes(varName));
    const extraInImplementation = implementationVars.filter(varName => !interfaceVars.includes(varName));
    
    return {
        interfaceCount: interfaceVars.length,
        implementationCount: implementationVars.length,
        missingInImplementation,
        extraInImplementation,
        isConsistent: missingInImplementation.length === 0 && extraInImplementation.length === 0
    };
}

/**
 * Main validation function
 */
function validateCSSVariables() {
    // Path to the interface file
    const interfacePath = path.join(__dirname, '..', 'src', 'css-variables.ts');
    
    // Check if interface file exists
    if (!fs.existsSync(interfacePath)) {
        console.error(`❌ Interface file not found: ${interfacePath}`);
        process.exit(1);
    }
    
    // Extract variables from interface
    const interfaceVars = extractVariablesFromInterface(interfacePath);
    
    // Get implementation content from command line argument or environment
    const implementationContent = process.argv[2] || process.env.CSS_VARS_IMPLEMENTATION;
    
    if (!implementationContent) {
        console.log('⚠️  No implementation content provided');
        return;
    }
    
    // Extract variables from implementation
    const implementationVars = extractVariablesFromImplementation(implementationContent);
    
    // Compare variables
    const comparison = compareVariables(interfaceVars, implementationVars);
    
    if (comparison.isConsistent) {
        console.log('✅ CSS variables are consistent');
        process.exit(0);
    } else {
        console.log('❌ CSS variables are NOT consistent:');
        
        if (comparison.missingInImplementation.length > 0) {
            console.log('Missing in implementation:');
            comparison.missingInImplementation.forEach(varName => {
                console.log(`  - ${varName}`);
            });
        }
        
        if (comparison.extraInImplementation.length > 0) {
            console.log('Extra in implementation:');
            comparison.extraInImplementation.forEach(varName => {
                console.log(`  - ${varName}`);
            });
        }
        
        process.exit(1);
    }
}

// Run validation if this script is executed directly
if (require.main === module) {
    validateCSSVariables();
}

module.exports = {
    extractVariablesFromInterface,
    extractVariablesFromImplementation,
    compareVariables,
    validateCSSVariables
};
