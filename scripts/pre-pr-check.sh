#!/bin/bash

set -e

echo "🚀 Running pre-PR checks..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_step() {
    echo -e "${YELLOW}📋 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "Not in the root directory of the project"
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    print_step "Installing dependencies..."
    pnpm install
    print_success "Dependencies installed"
fi

# Clean previous builds
print_step "Cleaning previous builds..."
pnpm clean
print_success "Previous builds cleaned"

# Build packages in dependency order
print_step "Building packages in dependency order..."

print_step "Building types package..."
pnpm build --filter=@dtinsight/molecule-types
if [ ! -f "packages/types/dist/index.d.ts" ]; then
    print_error "Types package build failed"
    exit 1
fi
print_success "Types package built successfully"

print_step "Building shared package..."
pnpm build --filter=@dtinsight/molecule-shared
if [ ! -f "packages/shared/dist/index.d.ts" ]; then
    print_error "Shared package build failed"
    exit 1
fi
print_success "Shared package built successfully"

print_step "Building core-legacy package..."
pnpm build --filter=@dtinsight/molecule-core-legacy
if [ ! -f "packages/core-legacy/dist/index.d.ts" ]; then
    print_error "Core-legacy package build failed"
    exit 1
fi
print_success "Core-legacy package built successfully"

print_step "Building core package..."
pnpm build --filter=@dtinsight/molecule-core
if [ ! -f "packages/core/dist/index.d.ts" ]; then
    print_error "Core package build failed"
    exit 1
fi
print_success "Core package built successfully"

print_step "Building UI package..."
pnpm build --filter=@dtinsight/molecule-ui
if [ ! -f "packages/ui/dist/index.d.ts" ]; then
    print_error "UI package build failed"
    exit 1
fi
print_success "UI package built successfully"

# Type checking
print_step "Running type checks..."
pnpm type-check
print_success "Type checks passed"

# Linting
print_step "Running linter..."
pnpm lint
print_success "Linting passed"

# Run tests if they exist
if [ -n "$(find . -name '*.test.*' -o -name '*.spec.*' | head -1)" ]; then
    print_step "Running tests..."
    pnpm test
    print_success "Tests passed"
else
    print_step "No tests found, skipping test step"
fi

print_success "🎉 All pre-PR checks passed! Ready to submit PR."

echo ""
echo "📝 Summary:"
echo "  ✅ Dependencies installed"
echo "  ✅ All packages built successfully"
echo "  ✅ Type checks passed"
echo "  ✅ Linting passed"
echo "  ✅ Tests passed (if any)"
echo ""
echo "🚀 Your code is ready for PR submission!"