/**
 * Internal dependencies
 */
import { decodeHtmlEntity } from '../';

const valuesToTest = [
	[
		'&quot;Here are some pictures of things we&#039;ve done &amp; enjoyed&quot;',
		'"Here are some pictures of things we\'ve done & enjoyed"'
	],
	[
		'Greater &gt; &#62; and &lt; &#60; less',
		'Greater > > and < < less'
	],
	[
		'Symbols &#162; &#163; &#8364; &#165; &#169; &#174;',
		'Symbols ¢ £ € ¥ © ®'
	],
];

describe( 'decodeHtmlEntity', () => {
	it.each( valuesToTest )( 'for %s should return %s', ( value, expected ) => {
		expect( decodeHtmlEntity( value ) ).toStrictEqual( expected );
	} );
} );
