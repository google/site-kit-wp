/**
 * Internal dependencies
 */
import calculateOverviewData from './calculateOverviewData';

describe( 'calculateOverviewData', () => {
	it( 'returns false with no data passed', () => {
		expect( calculateOverviewData( ) ).toEqual( false );
	} );
	it( 'returns false with empty data array passed', () => {
		expect( calculateOverviewData( [] ) ).toEqual( false );
	} );

	const rangeData = [
		[
			[
				{ data: {
					totals: [
						{ values: [ '359', 412, 47.81, '120.6504854368932', '0', '1013' ] }, //last month
						{ values: [ '322', 416, 43.75, '234.09615384615384', '0', '1245' ] }, // previous month
					],
				},
				},
			],
			[
				-0.009615384615384616,
				0.09280000000000005,
				-0.48461141520426787,
				null,
				-0.18634538152610441,
			],
		],
		[
			[
				{
					data: {
						totals: [
							{ values: [ '4921', 5723, '54.23728813559322', '158.4193604752752', '0', '14629' ] }, //last month
							{ values: [ '4531', 5311, '71.88853323291282', '134.91602334776877', '0', '11286' ] }, // previous month
						],
					},
				},
			],
			[
				0.07757484466202222,
				-0.245536308831494,
				0.17420715897416142,
				null,
				0.29620769094453303,
			],
		],
	];
	it.each( rangeData )( 'calculating data overview', ( data, expected ) => {
		const overviewData = calculateOverviewData( data );
		expect( overviewData.totalSessionsChange ).toEqual( expected[ 0 ] );
		expect( overviewData.averageBounceRateChange ).toEqual( expected[ 1 ] );
		expect( overviewData.averageSessionDurationChange ).toEqual( expected[ 2 ] );
		expect( overviewData.goalCompletionsChange ).toEqual( expected[ 3 ] );
		expect( overviewData.totalPageViewsChange ).toEqual( expected[ 4 ] );
	} );
} );
