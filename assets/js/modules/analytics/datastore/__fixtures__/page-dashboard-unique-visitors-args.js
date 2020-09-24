export const pageDashboardUniqueVisitorsVisitorArgs = {
	dateRange: 'last-28-days',
	multiDateRange: 1,
	metrics: [
		{
			expression: 'ga:users',
			alias: 'Total Users',
		},
	],
};

export const pageDashboardUniqueVisitorsSparkArgs = {
	dateRange: 'last-28-days',
	dimensions: 'ga:date',
	metrics: [
		{
			expression: 'ga:users',
			alias: 'Users',
		},
	],
};
