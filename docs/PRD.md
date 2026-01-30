# Product Requirements Document: Jira Time Logging Dashboard

## Document Information
- **Version**: 1.1
- **Last Updated**: January 30, 2026
- **Status**: IMPLEMENTED ✅
- **Development Approach**: Shape Up methodology
- **Implementation**: Completed using Claude Code with incremental feature delivery

---

## Problem Statement

### The Raw Idea
Engineering teams need better visibility into time allocation across projects to make informed resource decisions and improve project planning accuracy.

### Appetite
**6-week cycle** (Shape Up standard cycle length)

This is a Big Batch project that warrants a full 6-week cycle given:
- Integration with external API (Jira)
- Data processing and aggregation logic
- Multiple visualization components
- Authentication and configuration needs

### The Problem
Project managers and engineering leads currently lack real-time visibility into:
1. How time is being spent across different projects and tickets
2. Whether time allocation matches sprint planning
3. Project timeline risks based on actual vs. estimated time
4. Individual and team capacity utilization

This leads to:
- Reactive rather than proactive project management
- Difficulty identifying bottlenecks early
- Poor resource allocation decisions
- Inaccurate future project estimates

---

## Solution Overview

### The Pitch
Build a web-based dashboard that connects to Jira's API and visualizes time logging data in an actionable format. The dashboard will answer key questions project managers ask daily without requiring them to dig through Jira reports.

### Key Capabilities (Breadboarding)

```
┌─────────────────────────────────────────────────────────┐
│ Time Logging Dashboard                                  │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  [Configure Jira Connection + Project Keys] → Storage   │
│                                                          │
│  [Select Date Range] → Filter Data                      │
│                                                          │
│  [View Project Breakdown] → Bar Chart Display           │
│     ↓                                                    │
│  [Drill into Project] → Ticket-Level Table              │
│     ↓                                                    │
│  [Analyze Team Member] → Individual Contribution View   │
│                                                          │
│  [Export Data] → CSV Download                           │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### User Flow (Fat Marker Sketch)
1. **First Time Setup**: User creates `.env` file with Jira credentials and project keys → Starts server → Dashboard loads
2. **Daily Usage**: User opens dashboard → Sees overview of current sprint → Identifies outliers → Drills down for details
3. **Weekly Review**: User selects custom date range → Reviews team performance → Exports data for leadership review

---

## User Stories & Acceptance Criteria

### Core User Stories

#### US-1: Jira Connection Setup
**As a** project manager  
**I want to** securely connect the dashboard to my Jira instance  
**So that** I can access my team's time logging data

**Acceptance Criteria:**
- User configures Jira domain, email, API token, and one or more project keys via a `.env` file
- Project keys scope all data fetching to only the specified projects
- Server validates configuration at startup and fails fast with clear error messages if invalid
- Credentials are kept server-side only (never sent to the browser)
- User can update configuration by editing `.env` and restarting the server

#### US-2: Time Data Visualization
**As a** project manager  
**I want to** see a visual breakdown of logged time by project  
**So that** I can quickly understand where team effort is going

**Acceptance Criteria:**
- Dashboard displays horizontal bar chart of projects
- Each bar shows total hours logged
- Projects are sorted by time (highest to lowest)
- Chart updates based on selected date range
- Visual indicates if data is loading or stale

#### US-3: Date Range Filtering
**As a** project manager  
**I want to** select custom date ranges for analysis  
**So that** I can review specific time periods (sprint, month, quarter)

**Acceptance Criteria:**
- User can select start and end dates
- Preset options available: "This Sprint", "Last Sprint", "This Month", "Last 30 Days"
- Date selection triggers data refresh
- Selected range is clearly displayed
- Invalid ranges (end before start) are prevented

#### US-4: Project Drill-Down
**As a** project manager  
**I want to** click on a project to see ticket-level details  
**So that** I can identify which specific tickets consumed the most time

**Acceptance Criteria:**
- Clicking a project bar expands to show tickets
- Ticket table includes: Ticket ID, Summary, Assignee, Hours Logged, Status
- Table is sortable by each column
- User can collapse back to project view
- Tickets link to Jira (open in new tab)

#### US-5: Team Member Analysis
**As a** project manager  
**I want to** see time logged per team member  
**So that** I can understand individual capacity and workload

**Acceptance Criteria:**
- Dashboard includes team member breakdown section
- Shows total hours per person for selected period
- Displays distribution across projects (stacked bar or pie chart)
- Highlights capacity utilization (e.g., % of expected hours)
- Can filter entire dashboard by team member

#### US-6: Data Export
**As a** project manager  
**I want to** export time logging data to CSV  
**So that** I can share reports with stakeholders or perform custom analysis

**Acceptance Criteria:**
- Export button downloads CSV file
- CSV includes all visible data (respects current filters)
- Filename includes date range for easy organization
- Export completes within 5 seconds for standard datasets
- CSV format is compatible with Excel/Google Sheets

---

## Technical Requirements

### Architecture (Fat Marker Level)
```
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│   Frontend   │ ←──────→│   Backend    │ ←──────→│  Jira API    │
│  (React/Vue) │  HTTP   │  (Node/Py)   │  REST   │              │
└──────────────┘         └──────────────┘         └──────────────┘
       ↓                         ↓
┌──────────────┐         ┌──────────────┐
│ LocalStorage │         │   Database   │
│ (Config)     │         │  (Optional)  │
└──────────────┘         └──────────────┘
```

### Technology Stack (Implemented)
- **Runtime**: Bun v1.3.7+ (all-in-one JavaScript runtime)
- **Frontend**: React 19 with TypeScript
- **Charting**: Recharts (React-native charting library)
- **API Client**: Native fetch (built into Bun)
- **State Management**: React hooks with Context API
- **Styling**: Tailwind CSS 4.1
- **Routing**: React Router DOM v7
- **Backend**: Bun server (native HTTP server)
- **Validation**: Zod schemas for runtime type safety
- **Storage**: In-memory caching (5-minute TTL)

### API Integration Specifications

#### Jira REST API v3 Endpoints
```
GET /rest/api/3/search
  - Query: worklog history
  - Params: JQL, fields, maxResults
  
GET /rest/api/3/issue/{issueKey}/worklog
  - Retrieves all worklogs for specific issue

GET /rest/api/3/myself
  - Validates authentication
```

#### Authentication (Implemented)
- Basic Auth with email + API token
- API token generated from user's Jira account settings at https://id.atlassian.com/manage-profile/security/api-tokens
- Credentials stored in `.env` file (server-side only, never exposed to browser)
- Server validates credentials at startup with Zod schema validation

#### Project Scoping
- User provides one or more Jira project keys (e.g., "PROJ", "ENG") during setup
- All JQL queries are scoped to these projects using `project IN ("PROJ", "ENG")`
- This reduces API call volume and ensures only relevant data is fetched

#### Rate Limiting Considerations
- Jira Cloud: 100 requests per 10 seconds per user
- Implement request queuing and caching
- Show loading states during data fetch

### Data Models

#### Worklog Entry
```typescript
interface WorklogEntry {
  id: string;
  issueKey: string;
  issueSummary: string;
  projectKey: string;
  projectName: string;
  author: {
    accountId: string;
    displayName: string;
    emailAddress: string;
  };
  timeSpentSeconds: number;
  started: string; // ISO 8601 date
  comment?: string;
}
```

#### Aggregated Project Data
```typescript
interface ProjectTimeData {
  projectKey: string;
  projectName: string;
  totalHours: number;
  ticketCount: number;
  contributors: string[];
  tickets: TicketTimeData[];
}

interface TicketTimeData {
  issueKey: string;
  summary: string;
  totalHours: number;
  assignee: string;
  status: string;
  worklogs: WorklogEntry[];
}
```

### Performance Requirements
- Initial dashboard load: < 3 seconds
- Date range filter update: < 2 seconds
- Project drill-down: < 1 second (client-side)
- Support up to 10,000 worklog entries without degradation
- Responsive on desktop, tablet, and mobile

### Security Requirements
- API tokens never exposed in frontend code
- HTTPS only for all API communication
- Input validation for all user-provided data
- XSS protection for rendering Jira content
- CSP headers to prevent injection attacks
- No sensitive data logged to browser console

---

## Scope Definition (Shape Up Boundaries)

### In Scope (Must Have for 6-Week Cycle) - COMPLETED ✅
✅ Jira API authentication setup (via .env configuration)
✅ Fetch worklogs for date range (with pagination, retry logic, timeout handling)
✅ Project-level time breakdown (horizontal bar chart with Recharts)
✅ Ticket-level drill-down (sortable, paginated table view)
✅ Team member time analysis (stacked bar chart by project)
✅ Date range filtering with presets (This Sprint, Last Sprint, This Month, Last 30 Days)
✅ Basic error handling and loading states (toast notifications, spinner overlays)
✅ Responsive design (Tailwind CSS responsive utilities)
✅ Data caching (5-minute TTL in-memory cache)
✅ Team member filtering (dropdown filter affects all views)
⏭️ CSV export functionality (deferred to Phase 4)  

### Out of Scope (Nice to Have / Future Cycles)
❌ Multi-Jira instance support  
❌ Real-time updates (WebSockets)  
❌ Advanced analytics (burn-down charts, velocity tracking)  
❌ User management and permissions  
❌ Scheduled email reports  
❌ Integrations with other tools (Slack, Teams)  
❌ Worklog editing/creation from dashboard  
❌ Mobile app (native iOS/Android)  
❌ Data persistence across sessions (beyond LocalStorage)  
❌ Comparison views (sprint vs. sprint, team vs. team)  

### Rabbit Holes to Avoid
🚫 **Over-engineering the backend**: Start with a simple proxy if needed; don't build a full REST API with database  
🚫 **Custom charting library**: Use existing solution rather than building from scratch  
🚫 **Complex permission model**: First version assumes single user or shared access  
🚫 **Perfect mobile experience**: Focus on desktop/tablet; mobile can be good enough  
🚫 **Elaborate caching strategy**: LocalStorage + simple in-memory cache is sufficient  

---

## Success Metrics

### Primary Metrics
1. **Time to Insight**: Project manager can answer "where did time go?" in < 30 seconds
2. **Adoption**: 80% of project managers use dashboard at least weekly
3. **Data Accuracy**: 100% match with Jira's native time reports

### Secondary Metrics
4. **Performance**: Dashboard loads in < 3 seconds on standard connection
5. **Reliability**: < 5% error rate on API calls
6. **User Satisfaction**: 4+ stars in internal feedback (if collected)

---

## Risk Assessment

### Technical Risks
| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Jira API rate limiting | Medium | High | Implement caching, batch requests, show warnings |
| Large dataset performance | Medium | Medium | Pagination, virtual scrolling, date range limits |
| Browser compatibility | Low | Medium | Test on Chrome, Firefox, Safari; use modern transpilation |
| API token security | Low | High | Clear documentation, encrypted storage, no logging |

### Product Risks
| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Feature creep | High | High | Strict scope adherence, "out of scope" list |
| Users want real-time data | Medium | Low | Set expectations: "refresh for latest data" |
| Integration complexity | Medium | Medium | Start with read-only; no write operations |
| Competing with Jira native | Low | Medium | Focus on specific use case Jira doesn't serve well |

---

## Dependencies

### External Dependencies
- Jira Cloud REST API v3 availability
- User's Jira permissions (must have worklog view access)
- User's ability to generate Jira API token

### Internal Dependencies
- None (standalone application)

### Development Dependencies
- Modern browser support (last 2 versions of major browsers)
- Node.js v18+ (for development tooling)
- Package manager (npm/yarn/pnpm)

---

## Testing Strategy

### Unit Testing
- Data transformation functions
- Date range calculation logic
- CSV generation logic
- Input validation functions

### Integration Testing
- Jira API connection flow
- Data fetching and parsing
- Error handling for API failures
- Authentication validation

### User Acceptance Testing
- Run through all user stories with real Jira data
- Test with different Jira configurations
- Validate export files open correctly
- Cross-browser testing (Chrome, Firefox, Safari, Edge)

### Performance Testing
- Load test with 1,000+ worklog entries
- Measure chart rendering time
- Test data aggregation with complex projects
- Mobile device testing (responsive design)

---

## Implementation Notes for Claude Code

### Development Approach
This project follows **incremental feature delivery**:
1. Each feature in the roadmap is independent
2. Features can be implemented in order of priority
3. Each feature should be fully functional before moving to next
4. Core functionality (connection + basic visualization) comes first
5. Enhancements and polish come after core is stable

### Claude Code Workflow
For each feature:
1. Engineer reviews PRD and feature_roadmap.md
2. Engineer selects next feature from roadmap
3. Engineer asks Claude Code to review all documentation and plan work
4. Claude Code provides implementation plan
5. Engineer approves plan
6. Claude Code implements feature
7. Engineer tests and validates
8. Move to next feature

### Code Organization (Implemented)
```
/timelogging_dashboard
├── /src
│   ├── /components       # React components (DashboardLayout, charts, tables, filters)
│   │   └── /common       # Shared UI components (LoadingSpinner, Toast, EmptyState)
│   ├── /services         # JiraApiClient.ts - API integration with error handling
│   ├── /utils            # Data aggregation, time calculations, chart config
│   ├── /hooks            # useWorklogData (caching), useSortableTable
│   ├── /types            # jira.ts (Zod schemas), app.ts (TypeScript interfaces)
│   ├── App.tsx           # Main application with routing and state management
│   ├── frontend.tsx      # Frontend entry point
│   ├── index.ts          # Bun server with API proxy routes
│   └── index.css         # Global styles + Tailwind directives
├── /public               # Static assets
├── /docs                 # PRD.md, feature_roadmap.md
├── build.ts              # Custom Bun build script with Tailwind plugin
└── .env.example          # Environment variables template
```

### Key Technical Decisions (Resolved)
1. **Proxy or Direct API?**: ✅ Backend proxy via Bun server (avoids CORS, protects credentials)
2. **State Management**: ✅ React hooks with Context API (no external library needed)
3. **Routing**: ✅ React Router DOM with SPA fallback on server
4. **Storage Strategy**: ✅ In-memory caching with 5-minute TTL (no persistence needed)
5. **Build Tool**: ✅ Custom Bun build script with Tailwind CSS plugin

---

## Implementation Decisions (Resolved)

### Resolved During Development
1. **Should we cache Jira data? For how long?** ✅ Yes, 5-minute in-memory cache per date range
2. **How should we handle Jira projects with no time logged?** ✅ EmptyState component with helpful message
3. **What date range should be default on first load?** ✅ No automatic load; user clicks "Apply" to fetch
4. **Should we auto-refresh data periodically?** ✅ No, manual refresh only (data doesn't change frequently enough)
5. **How detailed should error messages be?** ✅ User-friendly messages with retry option, technical details in console

### Future Enhancements (To Validate with Users)
1. Is project-level granularity sufficient or do we need epic-level?
2. Are the preset date ranges the right ones? (Current: This Sprint, Last Sprint, This Month, Last 30 Days)
3. What additional team member metrics would be valuable?
4. Should we include estimated vs. actual time comparisons?
5. Is CSV export needed for reporting workflows?

---

## Appendix

### Glossary
- **Worklog**: A time entry in Jira recording hours spent on an issue
- **Issue**: A Jira ticket (story, bug, task, etc.)
- **Project**: A collection of issues in Jira
- **Sprint**: A time-boxed iteration in agile development
- **API Token**: A secure credential for authenticating with Jira API
- **JQL**: Jira Query Language for filtering issues

### References
- [Jira REST API v3 Documentation](https://developer.atlassian.com/cloud/jira/platform/rest/v3/)
- [Shape Up Methodology](https://basecamp.com/shapeup)
- [Jira Time Tracking Overview](https://support.atlassian.com/jira-cloud-administration/docs/configure-time-tracking/)

### Version History
- v1.0 (January 27, 2026): Initial PRD based on product brief
- v1.1 (January 30, 2026): Updated to reflect completed implementation status, resolved technical decisions, and actual architecture
