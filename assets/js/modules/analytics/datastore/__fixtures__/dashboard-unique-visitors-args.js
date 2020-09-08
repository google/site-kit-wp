export const dashboardUniqueVisitorsVisitorArgs = {
	multiDateRange: 1,
	metrics: [
		{
			expression: 'ga:users',
			alias: 'Total Users',
		},
	],
	dateRange: 'last-28-days',
};

export const dashboardUniqueVisitorsSparkArgs = {
	compareDateRanges: 1,
	dimensions: 'ga:date',
	metrics: [
		{
			expression: 'ga:users',
			alias: 'Users',
		},
		{
			expression: 'ga:sessions',
			alias: 'Sessions',
		},
		{
			expression: 'ga:bounceRate',
			alias: 'Bounce Rate',
		},
		{
			expression: 'ga:avgSessionDuration',
			alias: 'Average Session Duration',
		},
		{
			expression: 'ga:goalCompletionsAll',
			alias: 'Goal Completions',
		},
	],
	limit: 180,
	dateRange: 'last-28-days',
};
