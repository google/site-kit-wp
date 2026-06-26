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
} );
