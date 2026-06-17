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
import type { SignInWithGoogleData } from './sign-in-with-google';

const data: SignInWithGoogleData = {
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
	redirectCookieName: 'googlesitekit_siwg_redirect_to',
	redirectCookiePath: '/',
	redirectCookieTTL: 60000,
	redirectTo: '',
	shouldShowOneTapPrompt: false,
};

describe( 'sign-in-with-google', () => {
	beforeEach( () => {
		jest.resetModules();

		document.body.innerHTML =
			'<div class="googlesitekit-sign-in-with-google__frontend-output-button"></div>';

		window._googlesitekitSignInWithGoogleData = data;

		( window.google as unknown as {
			accounts: {
				id: {
					initialize: jest.Mock;
					renderButton: jest.Mock;
					prompt: jest.Mock;
				};
			};
		} ) = {
			accounts: {
				id: {
					initialize: jest.fn(),
					renderButton: jest.fn(),
					prompt: jest.fn(),
				},
			},
		};
	} );

	it( 'should initialize with config data and render a button', async () => {
		await import( './sign-in-with-google' );

		expect( window.google.accounts.id.initialize ).toHaveBeenCalledWith(
			expect.objectContaining( {
				client_id: data.clientID,
			} )
		);

		expect( window.google.accounts.id.prompt ).not.toHaveBeenCalled();
		expect( window.google.accounts.id.renderButton ).toHaveBeenCalled();
	} );

	it( 'should initialize with config data and show the One Tap prompt when configured', async () => {
		window._googlesitekitSignInWithGoogleData = {
			...data,
			shouldShowOneTapPrompt: true,
		};

		await import( './sign-in-with-google' );

		expect( window.google.accounts.id.initialize ).toHaveBeenCalledWith(
			expect.objectContaining( {
				client_id: data.clientID,
			} )
		);

		expect( window.google.accounts.id.prompt ).toHaveBeenCalled();
	} );

	it( 'should add a button to the login form when isWPLogin is true and the form is present', async () => {
		document.body.innerHTML =
			'<div id="login"><form id="loginform"></form></div>';

		window._googlesitekitSignInWithGoogleData = {
			...data,
			isWPLogin: true,
		};

		await import( './sign-in-with-google' );

		expect( window.google.accounts.id.initialize ).toHaveBeenCalledWith(
			expect.objectContaining( {
				client_id: data.clientID,
			} )
		);

		expect( window.google.accounts.id.renderButton ).toHaveBeenCalled();
	} );
} );
