/**
 * Sign in with Google web tag frontend script tests.
 *
 * Site Kit by Google, Copyright 2026 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Internal dependencies
 */
import {
	type IdentityServices,
	type SignInWithGoogleConfig,
	setupSignInWithGoogle,
} from './sign-in-with-google';

const config: SignInWithGoogleConfig = {
	clientID: 'test-client-id.apps.googleusercontent.com',
	connectNonce: '',
	defaultButtonOptions: {
		shape: 'rectangular',
		text: 'signin_with',
		theme: 'outline',
		type: 'standard',
	},
	followsPostRedirect: false,
	isExistingUserFlow: false,
	isPreview: false,
	isUserLoggedIn: false,
	isWooCommerce: false,
	isWPLogin: false,
	loginURI: 'http://example.com/wp-login.php?action=googlesitekit_auth',
	nonceCookieName: 'googlesitekit_auth_nonce',
	nonceCookiePath: '/',
	nonceCookieTTL: 900,
	redirectCookieName: 'googlesitekit_siwg_redirect_to',
	redirectCookiePath: '/',
	redirectCookieTTL: 300,
	redirectTo: '',
	shouldShowOneTapPrompt: false,
};

const identityServices = {
	initialize: jest.fn(),
	prompt: jest.fn(),
	renderButton: jest.fn(),
} as unknown as IdentityServices;

describe( 'sign-in-with-google', () => {
	beforeEach( () => {
		document.body.innerHTML =
			'<div class="googlesitekit-sign-in-with-google__frontend-output-button"></div>';
	} );

	it( 'should initialize with config data and render a button', () => {
		setupSignInWithGoogle( identityServices, config );

		expect( identityServices.initialize ).toHaveBeenCalledWith(
			expect.objectContaining( {
				client_id: config.clientID,
			} )
		);

		expect( identityServices.prompt ).not.toHaveBeenCalled();
		expect( identityServices.renderButton ).toHaveBeenCalled();
	} );

	it( 'should initialize with config data and show the One Tap prompt when configured', () => {
		setupSignInWithGoogle( identityServices, {
			...config,
			shouldShowOneTapPrompt: true,
		} );

		expect( identityServices.initialize ).toHaveBeenCalledWith(
			expect.objectContaining( {
				client_id: config.clientID,
			} )
		);

		expect( identityServices.prompt ).toHaveBeenCalled();
	} );

	it( 'should add a button to the login form when isWPLogin is true and the form is present', () => {
		document.body.innerHTML =
			'<div id="login"><form id="loginform"></form></div>';

		setupSignInWithGoogle( identityServices, {
			...config,
			isWPLogin: true,
		} );

		expect( identityServices.initialize ).toHaveBeenCalledWith(
			expect.objectContaining( {
				client_id: config.clientID,
			} )
		);

		expect( identityServices.renderButton ).toHaveBeenCalled();
	} );

	it( 'should not render with an explicit width by default', () => {
		setupSignInWithGoogle( identityServices, config );

		expect( identityServices.renderButton ).toHaveBeenCalledWith(
			expect.any( HTMLElement ),
			expect.not.objectContaining( {
				width: expect.anything(),
			} )
		);
	} );

	it( 'should render with an explicit width if the width attribute is used', () => {
		document.body.innerHTML =
			'<div class="googlesitekit-sign-in-with-google__frontend-output-button" data-googlesitekit-siwg-width="200"></div>';

		setupSignInWithGoogle( identityServices, config );

		expect( identityServices.renderButton ).toHaveBeenCalledWith(
			expect.any( HTMLElement ),
			expect.objectContaining( {
				width: 200,
			} )
		);
	} );

	it( 'should render width an explicit width of 320 on the login form', () => {
		document.body.innerHTML =
			'<div id="login"><form id="loginform"></form></div>';

		setupSignInWithGoogle( identityServices, {
			...config,
			isWPLogin: true,
		} );

		expect( identityServices.renderButton ).toHaveBeenCalledWith(
			expect.any( HTMLElement ),
			expect.objectContaining( {
				width: 320,
			} )
		);
	} );

	describe( 'nonce', () => {
		beforeEach( () => {
			// jsdom keeps one cookie jar for the whole file, and the nonce is
			// now reused when present, so clear it between tests.
			document.cookie = `${ config.nonceCookieName }=;max-age=0;path=${ config.nonceCookiePath }`;
		} );

		function getInitializedNonce() {
			const calls = ( identityServices.initialize as jest.Mock ).mock
				.calls;

			return calls[ calls.length - 1 ][ 0 ].nonce;
		}

		it( 'should pass a nonce to the identity services library', () => {
			setupSignInWithGoogle( identityServices, config );

			expect( getInitializedNonce() ).toEqual(
				expect.stringMatching( /^[0-9a-f]{32}$/ )
			);
		} );

		it( 'should store the same nonce it passes to the library in a cookie', () => {
			setupSignInWithGoogle( identityServices, config );

			expect( document.cookie ).toContain(
				`${ config.nonceCookieName }=${ getInitializedNonce() }`
			);
		} );

		it( 'should reuse the value already in the cookie', () => {
			setupSignInWithGoogle( identityServices, config );
			const first = getInitializedNonce();

			setupSignInWithGoogle( identityServices, config );

			// Loading a second page must not replace the value an attempt
			// started on the first page is waiting on.
			expect( getInitializedNonce() ).toEqual( first );
		} );

		it( 'should generate a new value when the cookie is empty', () => {
			setupSignInWithGoogle( identityServices, config );
			const first = getInitializedNonce();

			document.cookie = `${ config.nonceCookieName }=;max-age=0;path=${ config.nonceCookiePath }`;

			setupSignInWithGoogle( identityServices, config );

			expect( getInitializedNonce() ).not.toEqual( first );
		} );

		it( 'should set no nonce on a page which offers no sign-in', () => {
			setupSignInWithGoogle( identityServices, {
				...config,
				isUserLoggedIn: true,
			} );

			expect( getInitializedNonce() ).toBeUndefined();
			expect( document.cookie ).not.toMatch(
				new RegExp( `${ config.nonceCookieName }=.+` )
			);
		} );

		it( 'should set the nonce before initializing, so One Tap cannot run first', () => {
			const callOrder: string[] = [];

			( identityServices.initialize as jest.Mock ).mockImplementationOnce(
				() => {
					callOrder.push(
						document.cookie.includes( config.nonceCookieName )
							? 'cookie-set'
							: 'cookie-missing'
					);
				}
			);

			setupSignInWithGoogle( identityServices, config );

			expect( callOrder ).toEqual( [ 'cookie-set' ] );
		} );
	} );
} );
