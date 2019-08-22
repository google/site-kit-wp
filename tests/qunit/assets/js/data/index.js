var valuesToTest;
var testFunctions = window.googlesitekit.testFunctions;
var testUtilities = window.googlesitekit.testUtilities;

var simpleObject = { bKey: 'value', aKey: 'value' };
var simpleObjectSorted = { aKey: 'value', bKey: 'value' };
var complexObject = { bKey: [ 2, 1, 3 ], cKey: { inner2: 'innerValue', inner1: 'innerValue' }, aKey: 'value' };
var complexObjectSorted = { aKey: 'value', bKey: [ 2, 1, 3 ], cKey: { inner1: 'innerValue', inner2: 'innerValue' } };

QUnit.module( 'Data function tests' );

valuesToTest = [
	{
		args: [],
		expected: '',
	},
	{
		args: [ 'aType' ],
		expected: 'aType',
	},
	{
		args: [ 'aType', undefined, 'aDatapoint' ],
		expected: 'aType',
	},
	{
		args: [ 'aType', 'anIdentifier' ],
		expected: 'aType::anIdentifier',
	},
	{
		args: [ 'aType', 'anIdentifier', undefined, simpleObject ],
		expected: 'aType::anIdentifier',
	},
	{
		args: [ 'aType', 'anIdentifier', 'aDatapoint' ],
		expected: 'aType::anIdentifier::aDatapoint',
	},
	{
		args: [ 'aType', 'anIdentifier', 'aDatapoint', {} ],
		expected: 'aType::anIdentifier::aDatapoint',
	},
	{
		args: [ 'aType', 'anIdentifier', 'aDatapoint', simpleObject ],
		expected: 'aType::anIdentifier::aDatapoint::' + testUtilities.md5( JSON.stringify( simpleObjectSorted ) ),
	},
	{
		args: [ 'aType', 'anIdentifier', 'aDatapoint', complexObject ],
		expected: 'aType::anIdentifier::aDatapoint::' + testUtilities.md5( JSON.stringify( complexObjectSorted ) ),
	},
];

valuesToTest.forEach( function( valueToTest, i ) {
	QUnit.test( 'getCacheKey::' + i, function( assert ) {
		var result = testFunctions.getCacheKey.apply( undefined, valueToTest.args );
		assert.equal( result, valueToTest.expected );
	} );
} );
