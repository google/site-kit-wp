/**
 * SuccessBanner component.
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

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { CORE_SITE } from '../../../../../googlesitekit/datastore/site/constants';
import BannerNotification from '../../../../../components/notifications/BannerNotification';
import SuccessGreenSVG from '../../../../../../svg/graphics/ga4-success-green.svg';
import useViewContext from '../../../../../hooks/useViewContext';
import { trackEvent } from '../../../../../util/tracking';

const { useSelect } = Data;

export default function SuccessBanner() {
	const ga4DocumentationLinkURL = useSelect( ( select ) =>
		select( CORE_SITE ).getDocumentationLinkURL( 'ga4' )
	);

	const viewContext = useViewContext();
	const eventCategory = `${ viewContext }_ga4-success-notification`;

	const description = __(
		'Google Analytics 4 has started collecting data for your site. As soon there is enough data, you’ll be able to switch your Site Kit dashboard to show data from Google Analytics 4.',
		'google-site-kit'
	);

	useMount( () => {
		trackEvent( eventCategory, 'view_notification' );
	} );

	return (
		<BannerNotification
			id="ga4-activation-banner"
			title={ __(
				'You successfully set up your Google Analytics 4 property',
				'google-site-kit'
			) }
			description={ description }
			dismiss={ __( 'OK, Got it', 'google-site-kit' ) }
			WinImageSVG={ () => <SuccessGreenSVG /> }
			format="small"
			type="win-success"
			learnMoreLabel={ __(
				'Learn more about Google Analytics 4',
				'google-site-kit'
			) }
			learnMoreURL={ ga4DocumentationLinkURL }
		/>
	);
}
