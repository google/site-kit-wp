/**
 * AdSense SetupCreateAccount component.
 *
 * Site Kit by Google, Copyright 2022 Google LLC
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
import {
	createInterpolateElement,
	Fragment,
	useCallback,
} from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useSelect } from 'googlesitekit-data';
import { Button } from 'googlesitekit-components';
import SupportLink from '../../../../components/SupportLink';
import { trackEvent } from '../../../../util';
import { parseAccountID } from '../../util/parsing';
import { MODULES_ADSENSE } from '../../datastore/constants';
import { CORE_USER } from '../../../../googlesitekit/datastore/user/constants';
import { ErrorNotices, UserProfile } from '../common';
import useViewContext from '../../../../hooks/useViewContext';

export default function SetupCreateAccount() {
	const viewContext = useViewContext();
	const eventCategory = `${ viewContext }_adsense`;
	const userEmail = useSelect( ( select ) => select( CORE_USER ).getEmail() );
	const existingTag = useSelect( ( select ) =>
		select( MODULES_ADSENSE ).getExistingTag()
	);
	const signUpURL = useSelect( ( select ) =>
		select( MODULES_ADSENSE ).getServiceCreateAccountURL()
	);

	const createAccountHandler = useCallback(
		async ( event ) => {
			event.preventDefault();
			await trackEvent( eventCategory, 'create_account' );
			global.open( signUpURL, '_blank' );
		},
		[ signUpURL, eventCategory ]
	);

	return (
		<Fragment>
			<h3 className="googlesitekit-heading-4 googlesitekit-setup-module__title">
				{ __( 'Create your AdSense account', 'google-site-kit' ) }
			</h3>

			<ErrorNotices />

			<p>
				{ __(
					'Once you create your account, Site Kit will place AdSense code on every page across your site. This means your site will be automatically optimized to help you earn money from your content.',
					'google-site-kit'
				) }
			</p>

			<UserProfile />

			<div className="googlesitekit-setup-module__action">
				<Button onClick={ createAccountHandler } href={ signUpURL }>
					{ __( 'Create AdSense account', 'google-site-kit' ) }
				</Button>
			</div>

			<p className="googlesitekit-setup-module__footer-text">
				{ existingTag &&
					sprintf(
						/* translators: 1: client ID, 2: user email address, 3: account ID */
						__(
							'Site Kit detected AdSense code %1$s on your page. We recommend you remove that code or add %2$s as a user to the AdSense account %3$s.',
							'google-site-kit'
						),
						existingTag,
						userEmail,
						parseAccountID( existingTag )
					) }
				{ ! existingTag &&
					createInterpolateElement(
						sprintf(
							/* translators: %s: user email address */
							__(
								'Already use AdSense? Add %s as a user to an existing AdSense account. <a>Learn more</a>',
								'google-site-kit'
							),
							userEmail
						),
						{
							a: (
								<SupportLink
									path="/adsense/answer/2659101"
									external
									aria-label={ __(
										'Learn more about adding a user to an existing AdSense account',
										'google-site-kit'
									) }
								/>
							),
						}
					) }
			</p>
		</Fragment>
	);
}
