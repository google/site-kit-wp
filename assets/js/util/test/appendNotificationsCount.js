/**
 * Internal dependencies
 */
import { appendNotificationsCount } from '../';

describe( 'appendNotificationsCount', () => {
	it( 'should append the notifications count', () => {
		const expected = '<span class="plugin-count" aria-hidden="true">1</span><span class="screen-reader-text">1 notification</span>';
		const wrapper = document.createElement( 'span' );
		wrapper.setAttribute( 'id', 'wp-admin-bar-google-site-kit' );
		const inner = document.createElement( 'span' );
		inner.setAttribute( 'class', 'ab-item' );
		wrapper.appendChild( inner );

		document.body.appendChild( wrapper );

		const actual = appendNotificationsCount( 1 ).innerHTML;

		expect( actual ).toStrictEqual( expected );
	} );
} );
