/**
 * WPVersionBumpNotification component.
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
import { __, sprintf } from '@wordpress/i18n';
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import BannerNotification from './BannerNotification';
import { getTimeInSeconds, trackEvent } from '../../util';
import useViewContext from '../../hooks/useViewContext';
const { useSelect } = Data;

export default function WPVersionBumpNotification() {
	const viewContext = useViewContext();
	const eventCategory = `${ viewContext }_wp52-version-notification`;

	const handleOnDismiss = useCallback( () => {
		trackEvent( eventCategory, 'dismiss_notification' );
	}, [ eventCategory ] );

	const handleOnCTAClick = useCallback( () => {
		trackEvent( eventCategory, 'confirm_notification' );
	}, [ eventCategory ] );

	useMount( () => {
		trackEvent( eventCategory, 'view_notification' );
	} );

	const hasMinimumWPVersion = useSelect( ( select ) =>
		select( CORE_SITE ).hasMinimumWordPressVersion()
	);
	const { version } = useSelect( ( select ) =>
		select( CORE_SITE ).getWPVersion()
	);

	// The `Update WordPress` CTA should be displayed if the user has `update_core` capability.
	// The `updateCoreURL` property will be available if the user has the `update_core` capability.
	// Otherwise, it will be `undefined`. See Assets::get_update_core_url() method.
	const updateCoreURL = useSelect( ( select ) =>
		select( CORE_SITE ).getUpdateCoreURL()
	);

	if ( hasMinimumWPVersion || version === undefined ) {
		return null;
	}

	return (
		<BannerNotification
			id="wp52-version-notification"
			title={ __(
				'Update your WordPress version to keep receiving Site Kit updates',
				'google-site-kit'
			) }
			description={ sprintf(
				/* translators: 1: WordPress version number */
				__(
					'Your WordPress version %s is out of date. Site Kit will require minimum WordPress version 5.2 with release 1.88.0 on November 21, 2022. If you don’t update WordPress, you won’t be able to receive the latest Site Kit features and enhancements.',
					'google-site-kit'
				),
				version
			) }
			ctaLabel={ __( 'Update WordPress', 'google-site-kit' ) }
			ctaLink={ updateCoreURL }
			dismiss={ __( 'Maybe later', 'google-site-kit' ) }
			dismissExpires={ getTimeInSeconds( 'day' ) * 3 }
			onCTAClick={ handleOnCTAClick }
			onDismiss={ handleOnDismiss }
			isDismissible
		/>
	);
}
