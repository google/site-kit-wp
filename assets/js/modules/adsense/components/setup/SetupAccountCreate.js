/**
 * AdSense Setup Account Create component.
 *
 * Site Kit by Google, Copyright 2020 Google LLC
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
 * WordPress dependencies
 */
import { Fragment, useCallback } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import Button from '../../../../components/button';
import Link from '../../../../components/link';
import { trackEvent } from '../../../../util';
import { sanitizeHTML } from '../../../../util/sanitize';
import { parseAccountID } from '../../util/parsing';
import { STORE_NAME } from '../../datastore/constants';
import { STORE_NAME as siteStoreName } from '../../../../googlesitekit/datastore/site/constants';
import { STORE_NAME as userStoreName } from '../../../../googlesitekit/datastore/user/constants';
import {
	ErrorNotices,
	UserProfile,
} from '../common';
const { useSelect } = Data;

export default function SetupAccountCreate() {
	const siteURL = useSelect( ( select ) => select( siteStoreName ).getReferenceSiteURL() );
	const userEmail = useSelect( ( select ) => select( userStoreName ).getEmail() );
	const existingTag = useSelect( ( select ) => select( STORE_NAME ).getExistingTag() );
	const signUpURL = useSelect( ( select ) => select( STORE_NAME ).getServiceCreateAccountURL() );

	const createAccountHandler = useCallback( async ( event ) => {
		event.preventDefault();
		await trackEvent( 'adsense_setup', 'create_adsense_account' );
		global.open( signUpURL, '_blank' );
	}, [ signUpURL ] );

	if ( ! siteURL || ! userEmail || undefined === existingTag ) {
		return null;
	}

	return (
		<Fragment>
			<h3 className="googlesitekit-heading-4 googlesitekit-setup-module__title">
				{ __( 'Create your AdSense account', 'google-site-kit' ) }
			</h3>

			<ErrorNotices />

			<p>
				{ __( 'Site Kit will place AdSense code on every page across your site. This means Google will automatically place ads for you in all the best places.', 'google-site-kit' ) }
			</p>

			<UserProfile />

			<div className="googlesitekit-setup-module__action">
				<Button
					onClick={ createAccountHandler }
					href={ signUpURL }
				>
					{ __( 'Create AdSense Account', 'google-site-kit' ) }
				</Button>
			</div>

			<p className="googlesitekit-setup-module__footer-text">
				{ existingTag && sprintf(
					/* translators: 1: client ID, 2: user email address, 3: account ID */
					__( 'Site Kit detected AdSense code %1$s on your page. We recommend you remove that code or add %2$s as a user to the AdSense account %3$s.', 'google-site-kit' ),
					existingTag,
					userEmail,
					parseAccountID( existingTag )
				) }
				{ ! existingTag && sprintf(
					/* translators: %s: user email address */
					__( 'Already use AdSense? Add %s as a user to an existing AdSense account.', 'google-site-kit' ),
					userEmail
				) }
				{ ' ' }
				<Link
					href="https://support.google.com/adsense/answer/2659101"
					inherit
					external
					dangerouslySetInnerHTML={ sanitizeHTML(
						__( 'Learn more<span class="screen-reader-text"> about adding a user to an existing AdSense account</span>', 'google-site-kit' ),
						{
							ALLOWED_TAGS: [ 'span' ],
							ALLOWED_ATTR: [ 'class' ],
						}
					) }
				/>
			</p>
		</Fragment>
	);
}
