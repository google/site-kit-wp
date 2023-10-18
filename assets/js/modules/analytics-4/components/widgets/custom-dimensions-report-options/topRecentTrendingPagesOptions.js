import { getDateString, getPreviousDate } from '../../../../../util';

/**
 * Computes the dates for the last three days relative to today.
 *
 * Utilizing the current date, the function calculates the dates
 * for the previous day, two days ago, and three days ago.
 *
 * @since n.e.x.t
 *
 * @return {Object} An object containing the dates for yesterday, two days ago, and three days ago.
 */
export const getDates = () => {
	const today = new Date();
	const todayDateString = getDateString( today );

	const yesterday = getPreviousDate( todayDateString, 1 );
	const twoDaysAgo = getPreviousDate( todayDateString, 2 );
	const threeDaysAgo = getPreviousDate( todayDateString, 3 );

	return {
		yesterday,
		twoDaysAgo,
		threeDaysAgo,
	};
};

/**
 * Generates the report options required for fetching data in `topRecentTrendingPagesWidget`.
 *
 * The function utilizes the dates from the last three days to
 * prepare the filter and structure required for the report.
 *
 * @since n.e.x.t
 *
 * @return {Object} The report options containing dimensions, filters, metrics, and other parameters.
 */
export const getReportOptions = () => {
	const { yesterday, twoDaysAgo, threeDaysAgo } = getDates();

	const dates = {
		startDate: threeDaysAgo,
		endDate: yesterday,
	};

	const reportOptions = {
		...dates,
		dimensions: [ 'pagePath' ],
		dimensionFilters: {
			'customEvent:googlesitekit_post_date': {
				filterType: 'inListFilter',
				value: [
					yesterday.replace( /-/g, '' ),
					twoDaysAgo.replace( /-/g, '' ),
					threeDaysAgo.replace( /-/g, '' ),
				],
			},
		},
		metrics: [ { name: 'screenPageViews' } ],
		orderby: [
			{
				metric: {
					metricName: 'screenPageViews',
				},
				desc: true,
			},
		],
		limit: 3,
	};

	return reportOptions;
};
