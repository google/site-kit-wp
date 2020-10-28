/**
 * Internal dependencies
 */
import { sanitizeHTML, unTrailingSlashIt } from './sanitize';

describe( 'sanitizeHTML', () => {
	it( 'does not change links', () => {
		const html = '<a href="http://example.org">link</a>';
		expect( sanitizeHTML( html, [ 'a' ] ) ).toEqual( {
			__html: html,
		} );
	} );

	// This is a built-in feature of dompurify.
	it( 'removes `target` attribute on links without a config', () => {
		const html = '<a href="http://example.org" target="_blank">link</a>';
		expect( sanitizeHTML( html, [ 'a' ] ) ).toEqual( {
			__html: '<a href="http://example.org">link</a>',
		} );
	} );

	it( 'allows `target` attribute on links when configured', () => {
		const html = '<a href="http://example.org" target="_blank">link</a>';
		expect( sanitizeHTML( html, {
			ALLOWED_ATTR: [ 'href', 'target' ],
			ALLOWED_TAGS: [ 'a' ],
		} ) ).toEqual( {
			__html: '<a target="_blank" href="http://example.org">link</a>',
		} );
	} );
} );

describe( 'unTrailingSlashIt', () => {
	it( 'should return the same string if there is no trailing slash', () => {
		expect( unTrailingSlashIt( 'http://example.org' ) ).toEqual( 'http://example.org' );
	} );

	it( 'should return string without trailing slash in a string with trailing slash', () => {
		expect( unTrailingSlashIt( 'http://example.org/' ) ).toEqual( 'http://example.org' );
	} );

	it( 'should return string without trailing slashes in a string with multiple trailing slash', () => {
		expect( unTrailingSlashIt( 'http://example.org////' ) ).toEqual( 'http://example.org' );
	} );

	it( 'should return undefined if the parameter is not a string', () => {
		expect( unTrailingSlashIt( 1 ) ).toBeUndefined();
	} );
} );
