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
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useSelect } from 'googlesitekit-data';
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import BannerNotification from './BannerNotification';
import ZeroStateIcon from '../../../svg/graphics/zero-state-blue.svg';
import { DAY_IN_SECONDS } from '../../util';

export default function ZeroDataNotification() {
	const notEnoughTrafficURL = useSelect( ( select ) => {
		return select( CORE_SITE ).getDocumentationLinkURL(
			'not-enough-traffic'
		);
	} );

	return (
		<BannerNotification
			id="zero-data-notification"
			title={ __(
				'Not enough traffic yet to display stats',
				'google-site-kit'
			) }
			description={ __(
				'Site Kit will start showing stats on the dashboard as soon as enough people have visited your site. Keep working on your site to attract more visitors.',
				'google-site-kit'
			) }
			format="small"
			learnMoreLabel={ __( 'Learn more', 'google-site-kit' ) }
			learnMoreURL={ notEnoughTrafficURL }
			dismiss={ __( 'Remind me later', 'google-site-kit' ) }
			dismissExpires={ DAY_IN_SECONDS }
			SmallImageSVG={ ZeroStateIcon }
			isDismissible
		/>
	);
}
