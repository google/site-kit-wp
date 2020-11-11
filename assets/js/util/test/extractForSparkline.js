/**
 * Internal dependencies
 */
import extractForSparkline from '../extract-for-sparkline';

const valuesToTest = [
	[
		[
			[
				'1/1/2019',
				1,
				2,
				3,
			],
			[
				'1/2/2019',
				4,
				5,
				6,
			],
		],
		1,
		[
			[
				'1/1/2019',
				1,
			],
			[
				'1/2/2019',
				4,
			],
		],
	],
	[
		[
			[
				'1/1/2019',
				1,
				2,
				3,
			],
			[
				'1/2/2019',
				4,
				5,
				6,
			],
		],
		2,
		[
			[
				'1/1/2019',
				2,
			],
			[
				'1/2/2019',
				5,
			],
		],
	],
	[
		[
			[
				'1/1/2019',
				1,
				2,
				3,
			],
			[
				'1/2/2019',
				4,
				5,
				6,
			],
		],
		3,
		[
			[
				'1/1/2019',
				3,
			],
			[
				'1/2/2019',
				6,
			],
		],
	],
	[
		[
			[
				'1/1/2019',
				1,
				2,
				3,
			],
			[
				'1/2/2019',
				4,
				5,
				6,
			],
		],
		0,
		[
			[
				'1/1/2019',
				'1/1/2019',
			],
			[
				'1/2/2019',
				'1/2/2019',
			],
		],
	],
];

const columnIndexValuesToTest = [
	[
		[
			[
				'1/1/2019',
				1,
				2,
				3,
			],
			[
				'1/2/2019',
				4,
				5,
				6,
			],
		],
		0,
		[
			[ '1/1/2019', '1/1/2019' ], [ '1/2/2019', '1/2/2019' ],
		],
	],
	[
		[
			[
				'1/1/2019',
				1,
				2,
				3,
			],
			[
				'1/2/2019',
				4,
				5,
				6,
			],
		],
		1,
		[
			[ 1, '1/1/2019' ], [ 4, '1/2/2019' ],
		],
	],
	[
		[
			[
				'1/1/2019',
				1,
				2,
				3,
			],
			[
				'1/2/2019',
				4,
				5,
				6,
			],
		],
		2,
		[
			[ 2, '1/1/2019' ], [ 5, '1/2/2019' ],
		],
	],
	[
		[
			[
				'1/1/2019',
				1,
				2,
				3,
			],
			[
				'1/2/2019',
				4,
				5,
				6,
			],
		],
		3,
		[
			[ 3, '1/1/2019' ], [ 6, '1/2/2019' ],
		],
	],
];

describe( 'extractForSparkline', () => {
	it.each( valuesToTest )( 'for start date %s and end date %s should returns %s', ( data, column, expected ) => {
		expect( extractForSparkline( data, column ) ).toStrictEqual( expected );
	} );

	it.each( columnIndexValuesToTest )( 'for start date %s and columnIndex %s it should return %s', ( data, columnIndex, expected ) => {
		expect( extractForSparkline( data, 0, columnIndex ) ).toStrictEqual( expected );
	} );

	const data = [
		{
			dimensions: [
				'Site Kit Test 1',
				'/',
			],
			metrics: [
				{
					values: [
						'1469',
					],
				},
			],
		},
		{
			dimensions: [
				'Site Kit Test 2',
				'/site-kit-tests/',
			],
			metrics: [
				{
					values: [
						'616',
					],
				},
			],
		},
	];

	it( 'returns data from an index passed as a string', () => {
		expect( extractForSparkline( data, 0, 'metrics.0.values.0' ) ).toStrictEqual( [ [ '1469', '' ], [ '616', 0 ] ] );
		expect( extractForSparkline( data, 1, 'dimensions.1' ) ).toStrictEqual( [ [ '/', '' ], [ '/site-kit-tests/', 0 ] ] );
	} );
} );
