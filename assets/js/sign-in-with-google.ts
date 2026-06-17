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

export type SignInWithGoogleData = {
	clientID: string;
	connectNonce: string;
	defaultButtonOptions: google.accounts.id.GsiButtonConfiguration;
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

export async function handleCredentialResponse(
	response: google.accounts.id.CredentialResponse,
	data: SignInWithGoogleData
) {
	if ( data.isPreview ) {
		return;
	}

	const body = new URLSearchParams(); // eslint-disable-line sitekit/acronym-case

	body.append( 'credential', response.credential );
	body.append( 'select_by', response.select_by );

	if ( data.isExistingUserFlow ) {
		body.append( 'integration', 'existing_user' );
		body.append( 'connectNonce', data.connectNonce );
	} else if ( data.isWooCommerce && ! data.isWPLogin ) {
		body.append( 'integration', 'woocommerce' );
	}

	try {
		const res = await fetch( data.loginURI, {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body,
		} );

		/*
		 * Preserve comment text in case of redirect after login on a page
		 * with a Sign in with Google button in the WordPress comments.
		 */
		const commentField = <HTMLInputElement | null>(
			document.getElementById( 'comment' )
		);

		const postID = document
			.querySelector(
				'.googlesitekit-sign-in-with-google__comments-form-button'
			)
			?.className?.match(
				/googlesitekit-sign-in-with-google__comments-form-button-postid-(\d+)/
			)?.[ 1 ];

		if ( postID && commentField?.value ) {
			sessionStorage.setItem(
				`siwg-comment-text-${ postID }`,
				commentField.value
			);
		}

		if ( ! data.redirectTo && ! data.followsPostRedirect ) {
			location.reload();
		} else if ( res.ok && res.redirected ) {
			location.assign( res.url );
		}
	} catch ( error ) {
		console.error( error ); // eslint-disable-line no-console
	}
}

export function setupSignInWithGoogle( data: SignInWithGoogleData ) {
	if ( typeof google?.accounts?.id === 'undefined' ) {
		return;
	}

	google.accounts.id.initialize( {
		client_id: data.clientID, // eslint-disable-line camelcase
		callback: ( response ) => handleCredentialResponse( response, data ),
		library_name: 'Site-Kit', // eslint-disable-line camelcase
	} as google.accounts.id.IdConfiguration ); // eslint-disable-line sitekit/acronym-case

	if ( data.isWPLogin ) {
		const buttonDivToAddToLoginForm = document.createElement( 'div' );

		buttonDivToAddToLoginForm.classList.add(
			'googlesitekit-sign-in-with-google__frontend-output-button'
		);

		buttonDivToAddToLoginForm.dataset.googlesitekitSiwgWidth = '320';

		document
			.getElementById( 'login' )
			?.insertBefore(
				buttonDivToAddToLoginForm,
				document.getElementById( 'loginform' )
			);
	}

	if (
		! data.isUserLoggedIn ||
		data.isWPLogin ||
		data.isPreview ||
		data.isExistingUserFlow
	) {
		const buttons = document.querySelectorAll(
			'.googlesitekit-sign-in-with-google__frontend-output-button'
		);

		// eslint-disable-next-line sitekit/acronym-case
		buttons.forEach( ( siwgButtonDiv: HTMLElement ) => {
			const buttonOptions = {
				shape:
					siwgButtonDiv.dataset.googlesitekitSiwgShape ||
					data.defaultButtonOptions.shape,
				text:
					siwgButtonDiv.dataset.googlesitekitSiwgText ||
					data.defaultButtonOptions.text,
				theme:
					siwgButtonDiv.dataset.googlesitekitSiwgTheme ||
					data.defaultButtonOptions.theme,
			} as google.accounts.id.GsiButtonConfiguration;

			const width = Number(
				siwgButtonDiv.dataset.googlesitekitSiwgWidth
			);

			if ( ! isNaN( width ) && width > 0 ) {
				buttonOptions.width = width;
				siwgButtonDiv.style.maxInlineSize = `${ width }px`;
			}

			google.accounts.id.renderButton( siwgButtonDiv, buttonOptions );
		} );
	}

	if ( data.shouldShowOneTapPrompt ) {
		google.accounts.id.prompt();
	}

	if ( data.redirectTo ) {
		const expires = new Date(); // eslint-disable-line sitekit/no-direct-date

		expires.setTime( expires.getTime() + data.redirectCookieTTL );

		document.cookie = `${ data.redirectCookieName }=${
			data.redirectTo
		};expires=${ expires.toUTCString() };path=${ data.redirectCookiePath }`;
	}

	/*
	 * If there is a matching saved comment text in sessionStorage, restore it
	 * to the comment field and remove it from sessionStorage.
	 */
	const postID = document.body.className.match( /postid-(\d+)/ )?.[ 1 ];

	const commentField = <HTMLInputElement | null>(
		document.getElementById( 'comment' )
	);

	const commentText = sessionStorage.getItem(
		`siwg-comment-text-${ postID }`
	);

	if ( commentField && commentText && postID ) {
		commentField.value = commentText;
		sessionStorage.removeItem( `siwg-comment-text-${ postID }` );
	}
}

const data = window._googlesitekitSignInWithGoogleData;

if ( data ) {
	setupSignInWithGoogle( data );
}
