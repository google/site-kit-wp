/**
 * Recent activity zero data component.
 *
 * Site Kit by Google, Copyright 2026 Google LLC
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
import { FC } from 'react';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import ZeroDataIllustration from '@/svg/graphics/recent-activity-zero-data.svg';
import RecentActivityMessage from './RecentActivityMessage';

const RecentActivityZeroData: FC = () => {
	return (
		<RecentActivityMessage
			className="googlesitekit-traffic-overview__recent-activity-zero-data"
			illustration={ <ZeroDataIllustration aria-hidden="true" /> }
			title={ __( 'No recent activity data found', 'google-site-kit' ) }
			sentences={ [
				__(
					'We haven’t received new visitor or search data yet.',
					'google-site-kit'
				),
				__(
					'It can take up to 6 hours to arrive, so check back soon.',
					'google-site-kit'
				),
			] }
		/>
	);
};

export default RecentActivityZeroData;
