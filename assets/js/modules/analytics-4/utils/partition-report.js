/**
 * External dependencies
 */
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

	const getRowsForDateRange = ( dateRange ) => {
		// Filter the report to get only rows that match the given date range.
		return report.filter(
			( { dimensionValues: [ , dateValue ] } ) =>
				dateValue.value === dateRange
		);
	};

	// Use a negative date range length for reverse slicing.
	const reverseDateRangeLength = -1 * dateRangeLength;

	// Get the rows for the current date range and the compare date range.
	// The current range should always be sliced from the end.
	const currentRange = getRowsForDateRange( 'date_range_0' ).slice(
		reverseDateRangeLength
	);
	// The compare range continues from where the current left off (slicing towards the start),
	// and may be shorter (where older data is not available yet) which is fine.
	const compareRange = getRowsForDateRange( 'date_range_1' ).slice(
		reverseDateRangeLength * 2,
		reverseDateRangeLength
	);

	return { currentRange, compareRange };
}
