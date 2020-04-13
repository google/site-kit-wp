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
				'11.5',
				'-1.0',
				'-8.5',
				'94.0',
				'',
				'23.0',
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
				'8.6',
				'7.8',
				'-24.6',
				'17.4',
				'',
				'29.6',
			],
		],
	];
	it.each( rangeData )( 'given %d and %d should return %s', ( data, expected ) => {
		const overviewData = calculateOverviewData( data );
		expect( overviewData.totalUsersChange ).toEqual( expected[ 0 ] );
		expect( overviewData.totalSessionsChange ).toEqual( expected[ 1 ] );
		expect( overviewData.averageBounceRateChange ).toEqual( expected[ 2 ] );
		expect( overviewData.averageSessionDurationChange ).toEqual( expected[ 3 ] );
		expect( overviewData.goalCompletionsChange ).toEqual( expected[ 4 ] );
		expect( overviewData.totalPageViewsChange ).toEqual( expected[ 5 ] );
	} );
} );
