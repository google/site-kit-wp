/**
 * GatheringDataNotification component.
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
import PropTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import { __, _n, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import useModuleGatheringZeroData from '@/js/hooks/useModuleGatheringZeroData';
import BannerNotification, {
	TYPES,
} from '@/js/googlesitekit/notifications/components/layout/BannerNotification';
import SVGGraphic from '@/svg/graphics/banner-gathering-data.svg?url';

export default function GatheringDataNotification( { id, Notification } ) {
	const { analyticsGatheringData, searchConsoleGatheringData } =
		useModuleGatheringZeroData();

	let gatheringDataTitle;
	// Analytics requires up to 72 hours to gather data.
	let gatheringDataWaitTimeInHours = 72;
	if ( analyticsGatheringData && searchConsoleGatheringData ) {
		gatheringDataTitle = __(
			'Search Console and Analytics are gathering data',
			'google-site-kit'
		);
	} else if ( analyticsGatheringData ) {
		gatheringDataTitle = __(
			'Analytics is gathering data',
			'google-site-kit'
		);
	} else if ( searchConsoleGatheringData ) {
		// If only Search Console is gathering data, show a lower wait
		// time, since it only requires 48 hours.
		gatheringDataWaitTimeInHours = 48;
		gatheringDataTitle = __(
			'Search Console is gathering data',
			'google-site-kit'
		);
	}

	if ( ! gatheringDataWaitTimeInHours ) {
		return null;
	}

	return (
		<Notification>
			<BannerNotification
				notificationID={ id }
				type={ TYPES.INFO }
				title={ gatheringDataTitle }
				description={ sprintf(
					/* translators: %s: the number of hours the site can be in a gathering data state */
					_n(
						'It may take up to %s hour before stats show up for your site',
						'It may take up to %s hours before stats show up for your site',
						gatheringDataWaitTimeInHours,
						'google-site-kit'
					),
					gatheringDataWaitTimeInHours
				) }
				svg={ {
					desktop: SVGGraphic,
					mobile: undefined,
					verticalPosition: 'center',
				} }
			/>
		</Notification>
	);
}

GatheringDataNotification.propTypes = {
	id: PropTypes.string,
	Notification: PropTypes.elementType,
};
