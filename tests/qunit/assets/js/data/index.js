var valuesToTest;
var testFunctions = window.googlesitekit.testFunctions;
var testUtilities = window.googlesitekit.testUtilities;

var simpleObject = { bKey: 'value', aKey: 'value' };
var simpleObjectSorted = { aKey: 'value', bKey: 'value' };
var complexObject = { bKey: [ 2, 1, 3 ], cKey: { inner2: 'innerValue', inner1: 'innerValue' }, aKey: 'value' };
var complexObjectSorted = { aKey: 'value', bKey: [ 2, 1, 3 ], cKey: { inner1: 'innerValue', inner2: 'innerValue' } };

const nativeSessionStorage = window.sessionStorage;
const nativeLocalStorage = window.localStorage;

QUnit.module( 'Data function tests' );

valuesToTest = [
	{
		key: 'stringKey',
		value: 'aString',
	},
	{
		key: 'integerKey',
		value: 33,
	},
	{
		key: 'boolKey',
		value: true,
	},
	{
		key: 'falsyKey',
		value: false,
	},
	{
		key: 'anotherFalsyKey',
		value: null,
	},
	{
		key: 'objectKey',
		value: { 'hello': 'world' },
	},
];

valuesToTest.forEach( function( valueToTest, i ) {
	QUnit.test( 'setCache/getCache/deleteCache::' + i + '::variableStorage', function( assert ) {
		var result;

		window.sessionStorage = undefined;
		window.localStorage = undefined;

		result = testFunctions.getCache( valueToTest.key );
		assert.deepEqual( result, undefined, 'Expect getCache( \'' + valueToTest.key + '\' ) to return undefined if value not found' );

		testFunctions.setCache( valueToTest.key, valueToTest.value );
		result = testFunctions.getCache( valueToTest.key );
		assert.deepEqual( result, valueToTest.value, 'Expect getCache( \'' + valueToTest.key + '\' ) to find value from setCache( \'' + valueToTest.key + '\', ' + valueToTest.value + ' )' );

		testFunctions.deleteCache( valueToTest.key );
		result = testFunctions.getCache( valueToTest.key );
		assert.deepEqual( result, undefined, 'Expect getCache( \'' + valueToTest.key + '\' ) to return undefined after deleteCache( \'' + valueToTest.key + '\' )' );

		window.googlesitekit.admin.datacache = {};

		window.sessionStorage = nativeSessionStorage;
		window.localStorage = nativeLocalStorage;
	} );

	if ( nativeSessionStorage ) {
		QUnit.test( 'setCache/getCache/deleteCache::' + i + '::sessionStorage', function( assert ) {
			var result;

			window.sessionStorage = nativeSessionStorage;
			window.localStorage = undefined;

			result = testFunctions.getCache( valueToTest.key );
			assert.deepEqual( result, undefined, 'Expect getCache( \'' + valueToTest.key + '\' ) to return undefined if value not found' );

			testFunctions.setCache( valueToTest.key, valueToTest.value );
			window.googlesitekit.admin.datacache = {}; // Clear variable storage so that it is skipped.
			result = testFunctions.getCache( valueToTest.key );
			assert.deepEqual( result, valueToTest.value, 'Expect getCache( \'' + valueToTest.key + '\' ) to find value from setCache( \'' + valueToTest.key + '\', ' + valueToTest.value + ' )' );

			testFunctions.deleteCache( valueToTest.key );
			window.googlesitekit.admin.datacache = {}; // Clear variable storage so that it is skipped.
			result = testFunctions.getCache( valueToTest.key );
			assert.deepEqual( result, undefined, 'Expect getCache( \'' + valueToTest.key + '\' ) to return undefined after deleteCache( \'' + valueToTest.key + '\' )' );

			window.googlesitekit.admin.datacache = {};
			window.sessionStorage.clear();

			window.localStorage = nativeLocalStorage;
		} );
	}

	if ( nativeLocalStorage ) {
		QUnit.test( 'setCache/getCache/deleteCache::' + i + '::localStorage', function( assert ) {
			var result;

			window.sessionStorage = undefined;
			window.localStorage = nativeLocalStorage;

			result = testFunctions.getCache( valueToTest.key );
			assert.deepEqual( result, undefined, 'Expect getCache( \'' + valueToTest.key + '\' ) to return undefined if value not found' );

			testFunctions.setCache( valueToTest.key, valueToTest.value );
			window.googlesitekit.admin.datacache = {}; // Clear variable storage so that it is skipped.
			result = testFunctions.getCache( valueToTest.key );
			assert.deepEqual( result, valueToTest.value, 'Expect getCache( \'' + valueToTest.key + '\' ) to find value from setCache( \'' + valueToTest.key + '\', ' + valueToTest.value + ' )' );

			testFunctions.deleteCache( valueToTest.key );
			window.googlesitekit.admin.datacache = {}; // Clear variable storage so that it is skipped.
			result = testFunctions.getCache( valueToTest.key );
			assert.deepEqual( result, undefined, 'Expect getCache( \'' + valueToTest.key + '\' ) to return undefined after deleteCache( \'' + valueToTest.key + '\' )' );

			window.googlesitekit.admin.datacache = {};
			window.localStorage.clear();

			window.sessionStorage = nativeSessionStorage;
		} );
	}
} );

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
		var result = testFunctions.getCacheKey.apply( testFunctions, valueToTest.args );
		assert.equal( result, valueToTest.expected );
	} );
} );

valuesToTest = [
	{
		keysToSet: [
			'type::identifier::datapoint',
			'type::identifier::datapoint::f7f67',
			'type::identifier::datapoint::gaff7f712f3',
			'type::identifier::datapoint2',
			'type::identifier2::datapoint',
			'type2::identifier::datapoint',
		],
		args: [ 'type' ],
		expectedKeys: [
			'type2::identifier::datapoint',
		],
	},
	{
		keysToSet: [
			'type::identifier::datapoint',
			'type::identifier::datapoint::f7f67',
			'type::identifier::datapoint::gaff7f712f3',
			'type::identifier::datapoint2',
			'type::identifier2::datapoint',
			'type2::identifier::datapoint',
		],
		args: [ 'type', 'identifier' ],
		expectedKeys: [
			'type::identifier2::datapoint',
			'type2::identifier::datapoint',
		],
	},
	{
		keysToSet: [
			'type::identifier::datapoint',
			'type::identifier::datapoint::f7f67',
			'type::identifier::datapoint::gaff7f712f3',
			'type::identifier::datapoint2',
			'type::identifier2::datapoint',
			'type2::identifier::datapoint',
		],
		args: [ 'type', 'identifier', 'datapoint' ],
		expectedKeys: [
			'type::identifier::datapoint2',
			'type::identifier2::datapoint',
			'type2::identifier::datapoint',
		],
	},
];

valuesToTest.forEach( function( valueToTest, i ) {
	QUnit.test( 'invalidateCacheGroup::' + i + '::variableStorage', function( assert ) {
		var result;

		window.sessionStorage = undefined;
		window.localStorage = undefined;

		valueToTest.keysToSet.forEach( function( key ) {
			testFunctions.setCache( key, 'value' );
		} );
		testFunctions.invalidateCacheGroup.apply( testFunctions, valueToTest.args );
		result = [];
		valueToTest.keysToSet.forEach( function( key ) {
			var cachedValue = testFunctions.getCache( key );
			if ( 'undefined' !== typeof cachedValue ) {
				result.push( key );
			}
		} );
		assert.deepEqual( result, valueToTest.expectedKeys );

		window.googlesitekit.admin.datacache = {};

		window.sessionStorage = nativeSessionStorage;
		window.localStorage = nativeLocalStorage;
	} );

	if ( nativeSessionStorage ) {
		QUnit.test( 'invalidateCacheGroup::' + i + '::sessionStorage', function( assert ) {
			var result;

			window.sessionStorage = nativeSessionStorage;
			window.localStorage = undefined;

			valueToTest.keysToSet.forEach( function( key ) {
				testFunctions.setCache( key, 'value' );
			} );
			window.googlesitekit.admin.datacache = {};
			testFunctions.invalidateCacheGroup.apply( testFunctions, valueToTest.args );
			result = [];
			valueToTest.keysToSet.forEach( function( key ) {
				var cachedValue = testFunctions.getCache( key );
				if ( 'undefined' !== typeof cachedValue ) {
					result.push( key );
				}
			} );
			assert.deepEqual( result, valueToTest.expectedKeys );

			window.googlesitekit.admin.datacache = {};
			window.sessionStorage.clear();

			window.localStorage = nativeLocalStorage;
		} );
	}

	if ( nativeLocalStorage ) {
		QUnit.test( 'invalidateCacheGroup::' + i + '::localStorage', function( assert ) {
			var result;

			window.sessionStorage = undefined;
			window.localStorage = nativeLocalStorage;

			valueToTest.keysToSet.forEach( function( key ) {
				testFunctions.setCache( key, 'value' );
			} );
			window.googlesitekit.admin.datacache = {};
			testFunctions.invalidateCacheGroup.apply( testFunctions, valueToTest.args );
			result = [];
			valueToTest.keysToSet.forEach( function( key ) {
				var cachedValue = testFunctions.getCache( key );
				if ( 'undefined' !== typeof cachedValue ) {
					result.push( key );
				}
			} );
			assert.deepEqual( result, valueToTest.expectedKeys );

			window.googlesitekit.admin.datacache = {};
			window.localStorage.clear();

			window.sessionStorage = nativeSessionStorage;
		} );
	}
} );
