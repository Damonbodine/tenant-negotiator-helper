# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

**Build & Development:**
- `npm run dev` - Start development server with hot reload
- `npm run build` - Production build
- `npm run build:dev` - Development build
- `npm run preview` - Preview production build locally

**Code Quality:**
- `npm run lint` - Run ESLint for code linting

**Supabase Local Development:**
- Local Supabase runs on ports: API (54321), DB (54322), Studio (54323)
- Edge functions are in `supabase/functions/` directory

## Architecture Overview

### Technology Stack
- **Frontend:** React + TypeScript + Vite
- **UI:** shadcn/ui components + Tailwind CSS
- **Backend:** Supabase (PostgreSQL + Edge Functions)
- **State:** React Query + Context API
- **Voice:** ElevenLabs integration

### Core Application Structure

**Tenant Negotiation Helper** - A comprehensive rental negotiation platform with multiple tools:

1. **Property Analysis Tools:**
-Listing analyzer 
these routes should be harmonized together to great a unified resource. 
   - Listing Analyzer (`/market`) - Analyze rental listings for negotiation insights
   - Property Comparison (`/comparison`) - Compare multiple properties side-by-side
   both features s
   - Lease Analyzer (`/lease`) - Document analysis for lease terms

   

2. **Negotiation Tools:**
   - Voice Practice (`/practice/voice`) - AI voice chat for negotiation practice
   - Negotiation Chat (`/negotiation`) - Text-based negotiation assistance
   - Script Builder (`/script-builder`) - Generate negotiation emails/scripts

3. **Educational Resources:**
   - Down Payment Programs (`/resources/down-payment-programs`)
   - FAQ, Terms, Privacy pages

### Key Architectural Components

**Memory System (Rental Memory Architecture):**
- **Enhanced Memory Service** (`src/shared/services/enhancedMemoryService.ts`) - Backward-compatible wrapper
- **Rental Memory Service** (`src/services/rentalMemoryService.ts`) - New advanced memory system
- Database schema includes: user profiles, properties, conversations, messages, analyses
- Provides conversation continuity and personalized AI responses

**Feature Module Structure:**
- `src/chat/` - Chat components and hooks
- `src/negotiation/` - Negotiation-specific components  
- `src/propertyComparison/` - Property comparison tools
- `src/listingAnalyzer/` - Market insights and listing analysis
- `src/shared/` - Shared services, components, and utilities

**Edge Functions (Supabase):**
- `chat-ai-enhanced` - Main AI chat with memory integration
- `apartment-analysis` - Property analysis and market insights
- `lease-doc-analyzer` - Document analysis for leases
- `listing-analyzer` - Rental listing analysis
- `generate-speech` - Text-to-speech using ElevenLabs

**Service Layer:**
- Chat services with memory integration
- Property analysis services
- Voice/audio services for practice modes
- API key management utilities

### Component Patterns

**UI Components:**
- Use shadcn/ui components as base (`src/components/ui/`)
- Feature-specific components in module directories
- Shared layout components in `src/shared/components/layout/`

**State Management:**
- Context providers for auth and global state
- React Query for server state
- Custom hooks for feature-specific logic

**Error Handling:**
- ErrorBoundary component wraps the entire app
- useErrorHandling hook for consistent error management
- Toast notifications for user feedback

### Database Integration

**Supabase Client:**
- Configured in `src/integrations/supabase/client.ts`
- Types generated in `src/integrations/supabase/types.ts`

**Memory Architecture Tables:**
- `user_profiles_rental` - User rental preferences and profiles
- `properties` - Property information and analysis
- `user_properties` - User-property relationships
- `rental_conversations` - Conversation metadata
- `rental_messages` - Individual messages with AI insights
- `rental_analyses` - Saved property analyses

### Key Development Notes

**Memory Service Migration:**
- The app uses a gradual migration strategy from old to new memory system
- Enhanced Memory Service provides backward compatibility
- All chat features now use memory-enhanced AI responses

**Feature Flags:**
- Memory service includes feature flag support for gradual rollout
- Automatic fallback to legacy system on errors

**Voice Integration:**
- ElevenLabs integration for voice practice modes
- Voice settings and recording hooks in `src/hooks/`

**Property Data Flow:**
- Property analysis results flow through memory system
- Conversation context includes relevant property relationships
- AI responses leverage property history and user preferences

## CRITICAL SECURITY REQUIREMENTS

### Pre-Commit Security Checks
**MANDATORY: Before ANY git commit, push, or file creation, Claude MUST:**

1. **Scan for API Keys & Secrets:**
   - Search for patterns: `sk-proj-`, `eyJ[A-Za-z0-9+/=]+`, `service_role`, hardcoded URLs
   - Check for Supabase keys, OpenAI keys, authentication tokens
   - Verify no hardcoded credentials in any files

2. **Security Audit Command:**
   ```bash
   # Run this before EVERY commit:
   grep -r "sk-proj-\|eyJ.*\.\|service_role\|hardcoded.*key" . --include="*.js" --include="*.ts" --include="*.md" --exclude-dir=node_modules
   ```

3. **Required Actions if Secrets Found:**
   - IMMEDIATELY stop the commit process
   - Replace hardcoded secrets with environment variables
   - Add files with secrets to .gitignore if they're development-only
   - Only proceed after ALL secrets are removed

4. **Environment Variable Pattern:**
   ```typescript
   // ✅ CORRECT - Use environment variables
   const API_KEY = process.env.OPENAI_API_KEY || 'placeholder';
   const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder';
   
   // ❌ FORBIDDEN - Never hardcode
   const API_KEY = 'sk-proj-abc123...';
   const SUPABASE_KEY = 'eyJhbGciOiJIUzI1...';
   ```

5. **Development vs Production Files:**
   - Scripts in `/scripts/` directory: Add to .gitignore if they contain secrets
   - Test files (`test-*.js`): Add to .gitignore if they contain secrets  
   - Core application files: NEVER contain hardcoded secrets

### Git Commit Workflow
1. ✅ Complete all code changes
2. ✅ Run security audit command above
3. ✅ Verify NO secrets found
4. ✅ Replace any secrets with environment variables
5. ✅ Only then run `git add` and `git commit`

**NEVER commit without completing this security checklist.**


