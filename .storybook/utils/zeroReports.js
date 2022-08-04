export function replaceValuesInAnalyticsReportWithZeroData( report ) {
	const zeroValues = ( { values } ) => ( {
		values: values.map( () => 0 ),
	} );

	return report.map( ( single ) => ( {
		...single,
		data: {
			...single.data,
			totals: single.data.totals.map( zeroValues ),
			maximums: single.data.maximums.map( zeroValues ),
			minimums: single.data.minimums.map( zeroValues ),
			rows: single.data.rows.map( ( { dimensions, metrics } ) => ( {
				dimensions,
				metrics: metrics.map( zeroValues ),
			} ) ),
		},
	} ) );
}
