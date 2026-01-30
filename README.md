# Jira Time Logging Dashboard

A modern web-based dashboard for visualizing and analyzing Jira time logging data. Built with React, TypeScript, and Bun, this tool helps project managers and team leads gain actionable insights into time allocation across projects and team members.

## Features

### 📊 Data Visualization
- **Project Breakdown Chart**: Horizontal bar chart showing total hours logged per project
- **Team Member Breakdown**: Stacked bar chart displaying individual contributions across projects
- **Ticket Details Table**: Sortable, paginated table with ticket-level time tracking data
- **Project Drill-Down**: Click any project to see detailed ticket breakdowns

### 🔍 Filtering & Analysis
- **Date Range Filtering**: Choose from presets (This Sprint, Last Sprint, This Month, Last 30 Days) or select custom dates
- **Team Member Filter**: Filter all data by specific team member
- **Interactive Charts**: Click-through navigation from high-level overviews to detailed ticket information

### 🚀 Performance & UX
- **Smart Caching**: 5-minute in-memory cache reduces API calls
- **Loading States**: Visual feedback during data fetching
- **Error Handling**: User-friendly error messages with retry options
- **Responsive Design**: Works on desktop, tablet, and mobile devices

## Tech Stack

- **Runtime**: [Bun](https://bun.sh) v1.3.7+
- **Frontend**: React 19 + TypeScript
- **Styling**: Tailwind CSS 4.1
- **Charts**: Recharts
- **Routing**: React Router DOM v7
- **API Integration**: Jira Cloud REST API v3
- **Validation**: Zod schemas

## Prerequisites

- Bun v1.3.7 or higher ([Installation guide](https://bun.sh/docs/installation))
- A Jira Cloud account with API token access
- Jira projects with time logging enabled

## Setup

### 1. Install Dependencies

```bash
bun install
```

### 2. Configure Environment Variables

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Edit `.env` with your Jira credentials:

```env
# Jira Configuration
JIRA_DOMAIN=mycompany               # Your Jira domain (without .atlassian.net)
JIRA_EMAIL=your.email@company.com   # Your Jira email
JIRA_API_TOKEN=your_api_token_here  # Generate from Jira account settings
JIRA_PROJECT_KEYS=PROJ,ENG          # Comma-separated project keys to track

# Sprint Configuration (for "This Sprint" / "Last Sprint" presets)
SPRINT_START_DATE=2026-01-05        # ISO date when your sprints began
SPRINT_LENGTH_DAYS=14               # Duration of each sprint in days

# Server Configuration
NODE_ENV=development                # development or production
```

### 3. Generate Jira API Token

1. Go to [Atlassian Account Settings](https://id.atlassian.com/manage-profile/security/api-tokens)
2. Click "Create API token"
3. Give it a label (e.g., "Time Logging Dashboard")
4. Copy the token and paste it into your `.env` file

### 4. Find Your Jira Project Keys

Project keys are the uppercase prefixes in your Jira ticket IDs (e.g., "PROJ" in "PROJ-123"). You can find them:
- In the URL when viewing a project: `https://mycompany.atlassian.net/browse/PROJ`
- In any ticket ID from that project

## Usage

### Development Mode

Start the development server with hot reload:

```bash
bun dev
```

The dashboard will be available at `http://localhost:3000`

### Production Mode

Build and start the production server:

```bash
bun run build.ts  # Build for production
bun start         # Run production server
```

## Project Structure

```
/timelogging_dashboard
├── src/
│   ├── components/          # React components
│   │   ├── BarChart.tsx            # Reusable chart wrapper
│   │   ├── DashboardLayout.tsx     # Main layout component
│   │   ├── DateRangePicker.tsx     # Date range selector with presets
│   │   ├── Header.tsx              # Navigation header
│   │   ├── ProjectBreakdownChart.tsx    # Project bar chart
│   │   ├── ProjectDrillDown.tsx         # Project detail panel
│   │   ├── TabNav.tsx              # Tab navigation
│   │   ├── TeamMemberBreakdown.tsx      # Team member stacked chart
│   │   ├── TeamMemberFilter.tsx         # Team member dropdown filter
│   │   ├── TicketDetailsTable.tsx       # Ticket table with pagination
│   │   └── common/             # Shared UI components
│   │       ├── LoadingSpinner.tsx
│   │       ├── Toast.tsx
│   │       └── EmptyState.tsx
│   ├── hooks/              # Custom React hooks
│   │   ├── useWorklogData.ts    # Data fetching with caching
│   │   └── useSortableTable.ts  # Table sorting logic
│   ├── services/           # API clients
│   │   └── JiraApiClient.ts     # Jira REST API integration
│   ├── types/              # TypeScript definitions
│   │   ├── app.ts          # Application types
│   │   └── jira.ts         # Jira API types (Zod schemas)
│   ├── utils/              # Utility functions
│   │   ├── chartConfig.ts       # Chart styling defaults
│   │   ├── dataAggregation.ts   # Data transformation & aggregation
│   │   ├── datePresets.ts       # Date range calculations
│   │   ├── projectColorMap.ts   # Consistent project colors
│   │   └── timeCalculations.ts  # Time conversion utilities
│   ├── App.tsx             # Main application component
│   ├── frontend.tsx        # Frontend entry point
│   ├── index.ts            # Bun server
│   └── index.css           # Global styles
├── public/                 # Static assets
├── docs/                   # Documentation
│   ├── PRD.md                   # Product Requirements Document
│   └── feature_roadmap.md       # Feature implementation roadmap
├── build.ts                # Custom Bun build script
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── .env.example            # Environment variables template
```

## API Endpoints

The Bun server provides these endpoints:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/config` | GET | Returns sprint configuration (start date, length, Jira domain) |
| `/api/jira/test-connection` | POST | Validates Jira credentials |
| `/api/jira/worklogs` | POST | Fetches worklogs for specified date range |
| `/*` | GET | SPA fallback (serves React app) |

## How It Works

### Data Flow

1. **User Interaction**: User selects a date range and clicks "Apply"
2. **API Request**: Frontend sends POST to `/api/jira/worklogs` with date range
3. **Server Processing**:
   - Queries Jira API with JQL scoped to configured project keys
   - Fetches all worklogs for matching issues
   - Filters worklogs by date range
   - Returns structured data to frontend
4. **Data Transformation**:
   - Raw Jira data transformed into normalized `WorklogEntry` objects
   - Aggregated by project, team member, and ticket
   - Cached for 5 minutes
5. **Visualization**: Charts and tables update with aggregated data

### Caching Strategy

- **Cache Duration**: 5 minutes per unique date range
- **Cache Key**: Based on start date and end date
- **Benefits**: Reduces API calls when switching between views (Projects ↔ Team Members)
- **Invalidation**: Automatic after TTL expires; new date range creates new cache entry

### Authentication

- Uses Jira Cloud Basic Authentication (email + API token)
- Credentials stored server-side only (never exposed to browser)
- API token is more secure than password authentication

## Features Implemented

Based on the [Feature Roadmap](docs/feature_roadmap.md):

- ✅ **F1.1-F1.6**: Foundation (Project setup, types, API client, config, loading states)
- ✅ **F2.1-F2.5**: Data Visualization (Aggregation, charts, dashboard layout, team member view)
- ✅ **F3.1-F3.5**: Interaction & Filtering (Date picker, filters, ticket table, drill-down, team member filter)
- ⏭️ **F3.6**: Marked as redundant (search not needed with sorting/filtering)
- ⏭️ **F4.1-F4.8**: Enhancement phase (CSV export, caching, error handling, mobile optimization, etc.)

See the [Product Requirements Document](docs/PRD.md) for full specifications.

## Troubleshooting

### Authentication Errors

**Problem**: "Authentication failed" or 401 errors

**Solutions**:
- Verify your Jira email is correct in `.env`
- Regenerate your API token and update `.env`
- Check that your Jira domain doesn't include `.atlassian.net` (just the subdomain)
- Ensure you have permission to view worklogs in the specified projects

### No Data Showing

**Problem**: Dashboard loads but shows no data

**Solutions**:
- Verify project keys are correct (uppercase, comma-separated)
- Check that time has been logged in those projects during the selected date range
- Ensure you have permission to view the specified projects
- Try expanding the date range (e.g., select "Last 30 Days")

### Rate Limiting

**Problem**: "Rate limited" errors or slow performance

**Solutions**:
- Reduce the date range (shorter periods = fewer API calls)
- Wait a few minutes before retrying (Jira Cloud: 100 requests per 10 seconds)
- The built-in retry logic will handle transient rate limits automatically

### Build Errors

**Problem**: Build fails with TypeScript errors

**Solutions**:
- Run `bun install` to ensure all dependencies are installed
- Delete `node_modules` and run `bun install` again
- Verify you're using Bun v1.3.7 or higher: `bun --version`

## Development

### Running Tests

```bash
bun test
```

### Code Quality

This project uses:
- **TypeScript strict mode** for type safety
- **Zod schemas** for runtime validation
- **ESLint** for code linting (if configured)
- **Prettier** for code formatting (if configured)

### Adding New Features

1. Review the [Feature Roadmap](docs/feature_roadmap.md)
2. Plan the implementation
3. Create a feature branch: `git checkout -b f{number}/{feature-name}`
4. Implement and test
5. Create a pull request

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

[Add your license here]

## Acknowledgments

- Built with [Bun](https://bun.sh) - Fast all-in-one JavaScript runtime
- Charts powered by [Recharts](https://recharts.org)
- Styled with [Tailwind CSS](https://tailwindcss.com)
- Integrates with [Jira Cloud REST API v3](https://developer.atlassian.com/cloud/jira/platform/rest/v3/)

## Support

For issues, questions, or feature requests, please create an issue in the repository.

---

**Version**: 1.0  
**Last Updated**: January 30, 2026
