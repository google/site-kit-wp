// TODO - expected result should be what is current in story
// input should be input

// input
// referenceDate: '2020-08-26',
// options: {
//     dimensions: 'date',
//     startDate: '2020-07-01',
//     endDate: '2020-08-25',
// },

const expectedOutput = [
	{
		clicks: 3,
		ctr: 0,
		impressions: 6,
		keys: [
			'2020-07-01',
		],
		position: 0,
	},
	{
		clicks: 4,
		ctr: 0,
		impressions: 0,
		keys: [
			'2020-07-02',
		],
		position: 0,
	},
	{
		clicks: 0,
		ctr: 0,
		impressions: 0,
		keys: [
			'2020-07-03',
		],
		position: 0,
	},
	{
		clicks: 4,
		ctr: 0,
		impressions: 10,
		keys: [
			'2020-07-04',
		],
		position: 0,
	},
	{
		clicks: 10,
		ctr: 0,
		impressions: 0,
		keys: [
			'2020-07-05',
		],
		position: 0,
	},
	{
		clicks: 0,
		ctr: 0,
		impressions: 5,
		keys: [
			'2020-07-06',
		],
		position: 0,
	},
	{
		clicks: 0,
		ctr: 0,
		impressions: 0,
		keys: [
			'2020-07-07',
		],
		position: 0,
	},
	{
		clicks: 0,
		ctr: 0,
		impressions: 5,
		keys: [
			'2020-07-08',
		],
		position: 0,
	},
	{
		clicks: 0,
		ctr: 0,
		impressions: 6,
		keys: [
			'2020-07-09',
		],
		position: 0,
	},
	{
		clicks: 7,
		ctr: 0,
		impressions: 0,
		keys: [
			'2020-07-10',
		],
		position: 0,
	},
	{
		clicks: 10,
		ctr: 0,
		impressions: 2,
		keys: [
			'2020-07-11',
		],
		position: 0,
	},
	{
		clicks: 0,
		ctr: 0,
		impressions: 0,
		keys: [
			'2020-07-12',
		],
		position: 0,
	},
	{
		clicks: 5,
		ctr: 0,
		impressions: 0,
		keys: [
			'2020-07-13',
		],
		position: 0,
	},
	{
		clicks: 0,
		ctr: 0,
		impressions: 0,
		keys: [
			'2020-07-14',
		],
		position: 0,
	},
	{
		clicks: 3,
		ctr: 0,
		impressions: 6,
		keys: [
			'2020-07-15',
		],
		position: 0,
	},
	{
		clicks: 4,
		ctr: 0,
		impressions: 0,
		keys: [
			'2020-07-16',
		],
		position: 0,
	},
	{
		clicks: 0,
		ctr: 0,
		impressions: 0,
		keys: [
			'2020-07-17',
		],
		position: 0,
	},
	{
		clicks: 4,
		ctr: 0,
		impressions: 10,
		keys: [
			'2020-07-18',
		],
		position: 0,
	},
	{
		clicks: 10,
		ctr: 0,
		impressions: 0,
		keys: [
			'2020-07-19',
		],
		position: 0,
	},
	{
		clicks: 0,
		ctr: 0,
		impressions: 5,
		keys: [
			'2020-07-20',
		],
		position: 0,
	},
	{
		clicks: 0,
		ctr: 0,
		impressions: 0,
		keys: [
			'2020-07-21',
		],
		position: 0,
	},
	{
		clicks: 0,
		ctr: 0,
		impressions: 5,
		keys: [
			'2020-07-22',
		],
		position: 0,
	},
	{
		clicks: 0,
		ctr: 0,
		impressions: 6,
		keys: [
			'2020-07-23',
		],
		position: 0,
	},
	{
		clicks: 7,
		ctr: 0,
		impressions: 0,
		keys: [
			'2020-07-24',
		],
		position: 0,
	},
	{
		clicks: 10,
		ctr: 0,
		impressions: 2,
		keys: [
			'2020-07-25',
		],
		position: 0,
	},
	{
		clicks: 0,
		ctr: 0,
		impressions: 6,
		keys: [
			'2020-07-26',
		],
		position: 0,
	},
	{
		clicks: 7,
		ctr: 0,
		impressions: 0,
		keys: [
			'2020-09-27',
		],
		position: 0,
	},
	{
		clicks: 10,
		ctr: 0,
		impressions: 2,
		keys: [
			'2020-07-28',
		],
		position: 0,
	},
	{
		clicks: 0,
		ctr: 0,
		impressions: 0,
		keys: [
			'2020-07-29',
		],
		position: 0,
	},
	{
		clicks: 5,
		ctr: 0,
		impressions: 0,
		keys: [
			'2020-07-30',
		],
		position: 0,
	},
	{
		clicks: 0,
		ctr: 0,
		impressions: 0,
		keys: [
			'2020-07-31',
		],
		position: 0,
	},
	{
		clicks: 3,
		ctr: 0,
		impressions: 6,
		keys: [
			'2020-08-01',
		],
		position: 0,
	},
	{
		clicks: 4,
		ctr: 0,
		impressions: 0,
		keys: [
			'2020-08-02',
		],
		position: 0,
	},
	{
		clicks: 0,
		ctr: 0,
		impressions: 0,
		keys: [
			'2020-08-03',
		],
		position: 0,
	},
	{
		clicks: 4,
		ctr: 0,
		impressions: 10,
		keys: [
			'2020-08-04',
		],
		position: 0,
	},
	{
		clicks: 10,
		ctr: 0,
		impressions: 0,
		keys: [
			'2020-08-05',
		],
		position: 0,
	},
	{
		clicks: 0,
		ctr: 0,
		impressions: 5,
		keys: [
			'2020-08-06',
		],
		position: 0,
	},
	{
		clicks: 0,
		ctr: 0,
		impressions: 0,
		keys: [
			'2020-08-07',
		],
		position: 0,
	},
	{
		clicks: 0,
		ctr: 0,
		impressions: 5,
		keys: [
			'2020-08-08',
		],
		position: 0,
	},
	{
		clicks: 0,
		ctr: 0,
		impressions: 6,
		keys: [
			'2020-08-09',
		],
		position: 0,
	},
	{
		clicks: 7,
		ctr: 0,
		impressions: 0,
		keys: [
			'2020-08-10',
		],
		position: 0,
	},
	{
		clicks: 10,
		ctr: 0,
		impressions: 2,
		keys: [
			'2020-08-11',
		],
		position: 0,
	},
	{
		clicks: 0,
		ctr: 0,
		impressions: 0,
		keys: [
			'2020-08-12',
		],
		position: 0,
	},
	{
		clicks: 5,
		ctr: 0,
		impressions: 0,
		keys: [
			'2020-08-13',
		],
		position: 0,
	},
	{
		clicks: 0,
		ctr: 0,
		impressions: 0,
		keys: [
			'2020-08-14',
		],
		position: 0,
	},
	{
		clicks: 3,
		ctr: 0,
		impressions: 6,
		keys: [
			'2020-08-15',
		],
		position: 0,
	},
	{
		clicks: 4,
		ctr: 0,
		impressions: 0,
		keys: [
			'2020-08-16',
		],
		position: 0,
	},
	{
		clicks: 0,
		ctr: 0,
		impressions: 0,
		keys: [
			'2020-08-17',
		],
		position: 0,
	},
	{
		clicks: 4,
		ctr: 0,
		impressions: 10,
		keys: [
			'2020-08-18',
		],
		position: 0,
	},
	{
		clicks: 10,
		ctr: 0,
		impressions: 0,
		keys: [
			'2020-08-19',
		],
		position: 0,
	},
	{
		clicks: 0,
		ctr: 0,
		impressions: 5,
		keys: [
			'2020-08-20',
		],
		position: 0,
	},
	{
		clicks: 0,
		ctr: 0,
		impressions: 0,
		keys: [
			'2020-08-21',
		],
		position: 0,
	},
	{
		clicks: 0,
		ctr: 0,
		impressions: 5,
		keys: [
			'2020-08-22',
		],
		position: 0,
	},
	{
		clicks: 0,
		ctr: 0,
		impressions: 6,
		keys: [
			'2020-08-23',
		],
		position: 0,
	},
	{
		clicks: 7,
		ctr: 0,
		impressions: 0,
		keys: [
			'2020-08-24',
		],
		position: 0,
	},
	{
		clicks: 10,
		ctr: 0,
		impressions: 2,
		keys: [
			'2020-08-25',
		],
		position: 0,
	},
];

describe( 'Search console test utils', () => {
	describe( 'getSearchConsoleMockResponse', () => {
		it( 'should return array of results based on date inputs', () => {
			expect( expectedOutput ).toBe( expectedOutput );
		} );
	} );
} );

