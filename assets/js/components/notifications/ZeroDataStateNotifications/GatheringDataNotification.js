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
import { __, sprintf } from '@wordpress/i18n';
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import BannerNotification from '../BannerNotification';
import GatheringDataIcon from '../../../../svg/graphics/zero-state-red.svg';
import { getTimeInSeconds, trackEvent } from '../../../util';
import useViewContext from '../../../hooks/useViewContext';

export default function GatheringDataNotification( {
	title,
	gatheringDataWaitTime,
} ) {
	const viewContext = useViewContext();
	const eventCategory = `${ viewContext }_gathering-data-notification`;
	const handleOnView = useCallback( () => {
		trackEvent( eventCategory, 'view_notification' );
	}, [ eventCategory ] );
	const handleOnDismiss = useCallback( () => {
		trackEvent( eventCategory, 'dismiss_notification' );
	}, [ eventCategory ] );

	if ( ! gatheringDataWaitTime ) {
		return null;
	}

	return (
		<BannerNotification
			id="gathering-data-notification"
			title={ title }
			description={ sprintf(
				/* translators: %s: the number of hours the site can be in a gathering data state */
				__(
					'It can take up to %s hours before stats show up for your site. While you’re waiting, connect more services to get more stats.',
					'google-site-kit'
				),
				gatheringDataWaitTime
			) }
			format="small"
			onView={ handleOnView }
			dismiss={ __( 'OK, Got it!', 'google-site-kit' ) }
			dismissExpires={ getTimeInSeconds( 'day' ) }
			SmallImageSVG={ GatheringDataIcon }
			onDismiss={ handleOnDismiss }
			isDismissible
		/>
	);
}

GatheringDataNotification.propTypes = {
	title: PropTypes.string,
	gatheringDataWaitTime: PropTypes.string,
};
