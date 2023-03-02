// TODO: Headers, JSDoc and tests...

import invariant from 'invariant';

export function partitionAnalytics4Report( report, { dateRangeLength } ) {
	invariant(
		Array.isArray( report ),
		'report must be an array to partition.'
	);
	invariant(
		Number.isInteger( dateRangeLength ) && dateRangeLength > 0,
		'dateRangeLength must be a positive integer.'
	);

	const getRowsForDateRange = ( dateRange ) =>
		report.filter(
			( { dimensionValues } ) => dimensionValues[ 1 ].value === dateRange
		);

	// Use a negative date range length for reverse slicing.
	const _dateRangeLength = -1 * dateRangeLength;

	return {
		// The current range should always be sliced from the end.
		currentRange:
			getRowsForDateRange( 'date_range_0' ).slice( _dateRangeLength ),
		// The compare range continues from where the current left off (slicing towards the start),
		// and may be shorter (where older data is not available yet) which is fine.
		compareRange: getRowsForDateRange( 'date_range_1' ).slice(
			_dateRangeLength * 2,
			_dateRangeLength
		),
	};
}
