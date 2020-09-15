export const dashboardUniqueVisitorsVisitorArgs = {
	dateRange: 'last-28-days',
	multiDateRange: 1,
	metrics: [
		{
			expression: 'ga:users',
			alias: 'Total Users',
		},
	],
};

export const dashboardUniqueVisitorsSparkArgs = {
	dateRange: 'last-28-days',
	dimensions: 'ga:date',
	metrics: [
		{
			expression: 'ga:users',
			alias: 'Users',
		},
	],

};
