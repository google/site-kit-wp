/**
 * External dependencies
 */
import md5 from 'md5';

/**
 * Internal dependencies
 */
import { getCacheKey } from '../cache';

const simpleObject = { bKey: 'value', aKey: 'value' };
const simpleObjectSorted = { aKey: 'value', bKey: 'value' };
const complexObject = { bKey: [ 2, 1, 3 ], cKey: { inner2: 'innerValue', inner1: 'innerValue' }, aKey: 'value' };
const complexObjectSorted = { aKey: 'value', bKey: [ 2, 1, 3 ], cKey: { inner1: 'innerValue', inner2: 'innerValue' } };

const valuesToTest = [
	[
		[],
		'',
	],
	[
		[ 'aType' ],
		'aType',
	],
	[
		[ 'aType', undefined, 'aDatapoint' ],
		'aType',
	],
	[
		[ 'aType', 'anIdentifier' ],
		'aType::anIdentifier',
	],
	[
		[ 'aType', 'anIdentifier', undefined, simpleObject ],
		'aType::anIdentifier',
	],
	[
		[ 'aType', 'anIdentifier', 'aDatapoint' ],
		'aType::anIdentifier::aDatapoint',
	],
	[
		[ 'aType', 'anIdentifier', 'aDatapoint', {} ],
		'aType::anIdentifier::aDatapoint',
	],
	[
		[ 'aType', 'anIdentifier', 'aDatapoint', simpleObject ],
		'aType::anIdentifier::aDatapoint::' + md5( JSON.stringify( simpleObjectSorted ) ),
	],
	[
		[ 'aType', 'anIdentifier', 'aDatapoint', complexObject ],
		'aType::anIdentifier::aDatapoint::' + md5( JSON.stringify( complexObjectSorted ) ),
	],
];

describe( 'getCacheKey', () => {
	it.each( valuesToTest )( 'generates cache key', ( args, expected ) => {
		expect( getCacheKey( ...args ) ).toStrictEqual( expected );
	} );
} );
