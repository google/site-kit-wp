/**
 * Sign in with Google web tag frontend script.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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

export type IdentityServices = typeof google.accounts.id;

import ButtonConfiguration = google.accounts.id.GsiButtonConfiguration;
import CredentialResponse = google.accounts.id.CredentialResponse;

export type SignInWithGoogleConfig = {
	clientID: string;
	connectNonce: string;
	defaultButtonOptions: ButtonConfiguration;
	followsPostRedirect: boolean;
	isExistingUserFlow: boolean;
	isPreview: boolean;
	isUserLoggedIn: boolean;
	isWooCommerce: boolean;
	isWPLogin: boolean;
	loginURI: string;
	redirectCookieName: string;
	redirectCookiePath: string;
	redirectCookieTTL: number;
	redirectTo: string;
	shouldShowOneTapPrompt: boolean;
};

function getCommentTextKey( element: HTMLTextAreaElement ) {
	if ( ! element.form ) {
		return 'siwg-comment-text-0';
	}

	const formData = new FormData( element.form );
	const postID = formData.get( 'comment_post_ID' );

	return `siwg-comment-text-${ postID }`;
}

function restoreCommentText( element: HTMLTextAreaElement ) {
	const key = getCommentTextKey( element );
	const commentText = sessionStorage.getItem( key );

	if ( commentText ) {
		element.value = commentText;
		sessionStorage.removeItem( key );
	}
}

function saveCommentText( element: HTMLTextAreaElement ) {
	const key = getCommentTextKey( element );

	if ( element.value ) {
		sessionStorage.setItem( key, element.value );
	}
}

async function handleCredentialResponse(
	response: CredentialResponse,
	config: SignInWithGoogleConfig
) {
	const {
		connectNonce,
		followsPostRedirect,
		isExistingUserFlow,
		isPreview,
		isWooCommerce,
		isWPLogin,
		loginURI,
		redirectTo,
	} = config;

	if ( isPreview ) {
		return;
	}

	const body = new URLSearchParams(); // eslint-disable-line sitekit/acronym-case

	body.append( 'credential', response.credential );
	body.append( 'select_by', response.select_by );

	if ( isExistingUserFlow ) {
		body.append( 'integration', 'existing_user' );
		body.append( 'connect_nonce', connectNonce );
	} else if ( isWooCommerce && ! isWPLogin ) {
		body.append( 'integration', 'woocommerce' );
	}

	const comment = <HTMLTextAreaElement | null>(
		document.getElementById( 'comment' )
	);

	if ( comment ) {
		saveCommentText( comment );
	}

	try {
		const res = await fetch( loginURI, {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body,
		} );

		if ( ! redirectTo && ! followsPostRedirect ) {
			location.reload();
		} else if ( res.ok && res.redirected ) {
			location.assign( res.url );
		}
	} catch ( error ) {
		global.console.error( error );
	}
}

export function setupSignInWithGoogle(
	identityServices: IdentityServices,
	config: SignInWithGoogleConfig
) {
	const { initialize, prompt, renderButton } = identityServices;

	const {
		clientID,
		defaultButtonOptions,
		isExistingUserFlow,
		isPreview,
		isUserLoggedIn,
		isWPLogin,
		redirectTo,
		redirectCookieTTL,
		redirectCookieName,
		redirectCookiePath,
		shouldShowOneTapPrompt,
	} = config;

	const idConfig = {
		client_id: clientID,
		callback: ( response: CredentialResponse ) =>
			handleCredentialResponse( response, config ),
		library_name: 'Site-Kit',
	};

	initialize( idConfig );

	const login = document.getElementById( 'login' );

	const shouldInsertButton = isWPLogin && login;

	if ( shouldInsertButton ) {
		const button = document.createElement( 'div' );
		const loginForm = document.getElementById( 'loginform' );

		button.classList.add(
			'googlesitekit-sign-in-with-google__frontend-output-button'
		);

		button.dataset.googlesitekitSiwgWidth = '320';

		login.insertBefore( button, loginForm );
	}

	const shouldRenderButton =
		! isUserLoggedIn || isWPLogin || isPreview || isExistingUserFlow;

	if ( shouldRenderButton ) {
		const buttons = document.querySelectorAll(
			'.googlesitekit-sign-in-with-google__frontend-output-button'
		);

		// eslint-disable-next-line sitekit/acronym-case
		buttons.forEach( ( element: HTMLElement ) => {
			const {
				googlesitekitSiwgShape: shape = defaultButtonOptions.shape,
				googlesitekitSiwgText: text = defaultButtonOptions.text,
				googlesitekitSiwgTheme: theme = defaultButtonOptions.theme,
				googlesitekitSiwgWidth,
			} = element.dataset;

			const buttonOptions = { shape, text, theme } as ButtonConfiguration;

			const width = Number( googlesitekitSiwgWidth );

			if ( ! isNaN( width ) && width > 0 ) {
				buttonOptions.width = width;
				element.style.maxInlineSize = `${ width }px`;
			}

			renderButton( element, buttonOptions );
		} );
	}

	if ( shouldShowOneTapPrompt ) {
		prompt();
	}

	if ( redirectTo ) {
		document.cookie = `${ redirectCookieName }=${ redirectTo };max-age=${ redirectCookieTTL };path=${ redirectCookiePath }`;
	}

	const comment = <HTMLTextAreaElement | null>(
		document.getElementById( 'comment' )
	);

	if ( comment ) {
		restoreCommentText( comment );
	}
}
