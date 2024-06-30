/**
 * ZeroDataNotification component.
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
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { CORE_SITE } from '../../../googlesitekit/datastore/site/constants';
import ZeroStateIcon from '../../../../svg/graphics/zero-state-blue.svg';

export default function ZeroDataNotification( { Notification, Dismiss } ) {
	const notEnoughTrafficURL = useSelect( ( select ) => {
		return select( CORE_SITE ).getDocumentationLinkURL(
			'not-enough-traffic'
		);
	} );

	return (
		<Notification
			title={ __(
				'Not enough traffic yet to display stats',
				'google-site-kit'
			) }
			description={ __(
				'Site Kit will start showing stats on the dashboard as soon as enough people have visited your site. Keep working on your site to attract more visitors.',
				'google-site-kit'
			) }
			learnMoreLabel={ __( 'Learn more', 'google-site-kit' ) }
			learnMoreURL={ notEnoughTrafficURL }
			dismiss={
				<Dismiss
					text={ __( 'Remind me later', 'google-site-kit' ) }
					primary
				/>
			}
			SmallImageSVG={ ZeroStateIcon }
		/>
	);
}
