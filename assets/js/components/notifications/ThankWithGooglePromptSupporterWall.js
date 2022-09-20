/**
 * ThankWithGooglePromptSupporterWall component.
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
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import { MODULES_THANK_WITH_GOOGLE } from '../../modules/thank-with-google/datastore/constants';
import SupporterWallPromptSVG from '../../../svg/graphics/twg-supporter-wall.svg';
import BannerNotification from './BannerNotification';
const { useSelect } = Data;

export default function ThankWithGooglePromptSupporterWall() {
	const promptSupporterWall = useSelect( ( select ) =>
		select( MODULES_THANK_WITH_GOOGLE ).getSupporterWallPrompt()
	);
	const supporterWallURL = useSelect( ( select ) =>
		select( CORE_SITE ).getWidgetsAdminURL()
	);

	if ( ! promptSupporterWall ) {
		return null;
	}

	return (
		<BannerNotification
			id="twg-prompt-supporter-wall"
			title={ __(
				'Add a Thank with Google supporter wall',
				'google-site-kit'
			) }
			description={ __(
				'A supporter wall widget shows the list of everyone who has supported your site using Thank with Google. It’s a nice way to thank your supporters back. You can find and add the supporter wall widget from your site’s Appearance settings.',
				'google-site-kit'
			) }
			ctaLabel={ __( 'Add Supporter Wall widget', 'google-site-kit' ) }
			ctaLink={ supporterWallURL }
			dismiss={ __( 'Maybe later', 'google-site-kit' ) }
			isDismissible
			format="large"
			WinImageSVG={ () => <SupporterWallPromptSVG height="195" /> }
		/>
	);
}
