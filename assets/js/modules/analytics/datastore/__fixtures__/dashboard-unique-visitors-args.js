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

export const dashboardUsersTotalV2Args = {
	startDate: '2020-12-09',
	endDate: '2021-01-05',
	metrics: [
		{
			expression: 'ga:users',
			alias: 'Total Users',
		},
	],
};

export const dashboardUniqueVisitorsVisitorV2Args = {
	startDate: '2020-12-09',
	endDate: '2021-01-05',
	dimensions: [ 'ga:date' ],
	metrics: [
		{
			expression: 'ga:users',
			alias: 'Users Over Time',
		},
	],
	orderby: {
		fieldName: 'ga:date',
		sortOrder: 'DESCENDING',
	},
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
