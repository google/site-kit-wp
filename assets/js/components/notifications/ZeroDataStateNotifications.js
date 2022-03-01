/**
 * ZeroDataStateNotifications component.
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
import { Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { CORE_MODULES } from '../../googlesitekit/modules/datastore/constants';
import { MODULES_ANALYTICS } from '../../modules/analytics/datastore/constants';
import { MODULES_SEARCH_CONSOLE } from '../../modules/search-console/datastore/constants';
import BannerNotification from './BannerNotification';
import { getTimeInSeconds } from '../../util';
import ZeroState from '../../../svg/graphics/zero-state-blue.svg';
const { useSelect, useInViewSelect } = Data;

export default function ZeroDataStateNotifications() {
	const isAnalyticsConnected = useSelect( ( select ) =>
		select( CORE_MODULES ).isModuleConnected( 'analytics' )
	);
	const hasAnalyticsZeroData = useInViewSelect( ( select ) =>
		isAnalyticsConnected ? select( MODULES_ANALYTICS ).hasZeroData() : false
	);
	const hasSearchConsoleZeroData = useInViewSelect( ( select ) =>
		select( MODULES_SEARCH_CONSOLE ).hasZeroData()
	);

	return (
		<Fragment>
			{ hasAnalyticsZeroData || hasSearchConsoleZeroData ? (
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
					learnMoreURL="https://sitekit.withgoogle.com/documentation/using-site-kit/dashboard-data-display/"
					dismiss={ __( 'Remind me later', 'google-site-kit' ) }
					isDismissible={ true }
					dismissExpires={ getTimeInSeconds( 'day' ) }
					SmallImageSVG={ ZeroState }
				/>
			) : null }
		</Fragment>
	);
}
