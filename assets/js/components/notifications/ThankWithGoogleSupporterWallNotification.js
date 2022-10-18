/**
 * ThankWithGoogleSupporterWallNotification component.
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
 * External dependencies
 */
import { useMount } from 'react-use';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Fragment, useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import { MODULES_THANK_WITH_GOOGLE } from '../../modules/thank-with-google/datastore/constants';
import SupporterWallPromptSVG from '../../../svg/graphics/twg-supporter-wall.svg';
import BannerNotification from './BannerNotification';
import useViewContext from '../../hooks/useViewContext';
import { trackEvent } from '../../util';
const { useSelect } = Data;

export default function ThankWithGoogleSupporterWallNotification() {
	const supporterWallPrompt = useSelect( ( select ) =>
		select( MODULES_THANK_WITH_GOOGLE ).getSupporterWallPrompt()
	);
	const supporterWallURL = useSelect( ( select ) =>
		select( CORE_SITE ).getWidgetsAdminURL()
	);

	const viewContext = useViewContext();
	const eventCategory = `${ viewContext }_thank-with-google-supporter-wall-notification`;

	useMount( () => {
		if ( supporterWallPrompt ) {
			trackEvent( eventCategory, 'view_notification' );
		}
	} );

	const handleOnCTAClick = useCallback( () => {
		trackEvent( eventCategory, 'confirm_notification' );
	}, [ eventCategory ] );

	const handleOnDismiss = useCallback( () => {
		trackEvent( eventCategory, 'dismiss_notification' );
	}, [ eventCategory ] );

	if ( ! supporterWallPrompt ) {
		return null;
	}

	return (
		<BannerNotification
			id="twg-supporter-wall-prompt"
			className="googlesitekit-twg-supporter-wall-banner"
			title={ __(
				'Add a Thank with Google supporter wall',
				'google-site-kit'
			) }
			description={
				<Fragment>
					<span className="googlesitekit-display-block">
						{ __(
							'A supporter wall widget shows the list of everyone who has supported your site using Thank with Google. It’s a nice way to thank your supporters back.',
							'google-site-kit'
						) }
					</span>
					<span className="googlesitekit-display-block">
						{ __(
							'You can find and add the supporter wall widget from your site’s Appearance settings.',
							'google-site-kit'
						) }
					</span>
				</Fragment>
			}
			ctaLabel={ __( 'Add Supporter Wall widget', 'google-site-kit' ) }
			ctaLink={ supporterWallURL }
			dismiss={ __( 'Maybe later', 'google-site-kit' ) }
			isDismissible
			format="large"
			onCTAClick={ handleOnCTAClick }
			onDismiss={ handleOnDismiss }
			WinImageSVG={ () => <SupporterWallPromptSVG height="195" /> }
		/>
	);
}
