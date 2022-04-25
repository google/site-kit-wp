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
 * External dependencies
 */
import { useMount } from 'react-use';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import BannerNotification from '../BannerNotification';
import ZeroStateIcon from '../../../../svg/graphics/zero-state-blue.svg';
import { getTimeInSeconds, trackEvent } from '../../../util';
import useViewContext from '../../../hooks/useViewContext';

export default function ZeroDataNotification() {
	const viewContext = useViewContext();
	const eventCategory = `${ viewContext }_zero-data-notification`;

	const handleOnDismiss = useCallback( () => {
		trackEvent( eventCategory, 'dismiss_notification' );
	}, [ eventCategory ] );

	const handleOnLearnMoreClick = useCallback( () => {
		trackEvent( eventCategory, 'click_learn_more_link' );
	}, [ eventCategory ] );

	useMount( () => {
		trackEvent( eventCategory, 'view_notification' );
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
			learnMoreURL="https://sitekit.withgoogle.com/documentation/using-site-kit/using-the-site-kit-dashboard/#not-enough-traffic"
			dismiss={ __( 'Remind me later', 'google-site-kit' ) }
			dismissExpires={ getTimeInSeconds( 'day' ) }
			SmallImageSVG={ ZeroStateIcon }
			onDismiss={ handleOnDismiss }
			onLearnMoreClick={ handleOnLearnMoreClick }
			isDismissible
		/>
	);
}
