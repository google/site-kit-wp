/**
 * EnableAutoUpdateBannerNotification component.
 *
 * Site Kit by Google, Copyright 2025 Google LLC
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
import { __ } from '@wordpress/i18n';
import { useCallback, useEffect, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useSelect, useDispatch } from 'googlesitekit-data';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { TYPES } from '@/js/components/Notice/constants';
import useViewContext from '@/js/hooks/useViewContext';
import ErrorNotice from '@/js/components/ErrorNotice';
import NoticeNotification from '@/js/googlesitekit/notifications/components/layout/NoticeNotification';

export const ENABLE_AUTO_UPDATES_BANNER_SLUG = 'auto-update-cta';

export default function EnableAutoUpdateBannerNotification( {
	id,
	Notification,
} ) {
	const viewContext = useViewContext();

	const siteKitAutoUpdatesEnabled = useSelect( ( select ) =>
		select( CORE_SITE ).getSiteKitAutoUpdatesEnabled()
	);
	const enableAutoUpdateError = useSelect( ( select ) =>
		select( CORE_SITE ).getErrorForAction( 'enableAutoUpdate', [] )
	);

	const { enableAutoUpdate } = useDispatch( CORE_SITE );
	const ctaActivate = useCallback( async () => {
		await enableAutoUpdate();
	}, [ enableAutoUpdate ] );

	const [ enabledViaCTA, setEnabledViaCTA ] = useState( false );

	// If auto-updates were enabled via this CTA banner, then set the state to
	// true to render the success banner variation.
	useEffect( () => {
		if ( enabledViaCTA === false && siteKitAutoUpdatesEnabled === true ) {
			setEnabledViaCTA( true );
		}
	}, [ enabledViaCTA, setEnabledViaCTA, siteKitAutoUpdatesEnabled ] );

	if ( enableAutoUpdateError?.message ) {
		return <ErrorNotice message={ enableAutoUpdateError.message } />;
	}

	// Render the "Auto Updates enabled successfully" banner variation
	// if auto updates were enabled using this banner CTA.
	if ( enabledViaCTA ) {
		// Use separate GA tracking event category for success banner variation.
		const gaTrackingEventArgs = {
			category: `${ viewContext }_${ ENABLE_AUTO_UPDATES_BANNER_SLUG }-success`,
		};

		return (
			<Notification>
				<NoticeNotification
					notificationID={ id }
					type={ TYPES.SUCCESS }
					gaTrackingEventArgs={ gaTrackingEventArgs }
					title={ __(
						'Thanks for enabling auto-updates',
						'google-site-kit'
					) }
					description={ __(
						'Auto-updates have been enabled. Your version of Site Kit will automatically be updated when new versions are available.',
						'google-site-kit'
					) }
					dismissButton={ {
						label: __( 'Dismiss', 'google-site-kit' ),
						dismissOptions: { expiresInSeconds: 1 },
					} }
				/>
			</Notification>
		);
	}

	return (
		<Notification>
			<NoticeNotification
				notificationID={ id }
				type={ TYPES.NEW }
				title={ __( 'Keep Site Kit up-to-date', 'google-site-kit' ) }
				description={ __(
					'Turn on auto-updates so you always have the latest version of Site Kit. We constantly introduce new features to help you get the insights you need to be successful on the web.',
					'google-site-kit'
				) }
				ctaButton={ {
					label: __( 'Enable auto-updates', 'google-site-kit' ),
					onClick: ctaActivate,
				} }
				dismissButton={ {
					label: __( 'Dismiss', 'google-site-kit' ),
				} }
			/>
		</Notification>
	);
}

EnableAutoUpdateBannerNotification.propTypes = {
	id: PropTypes.string.isRequired,
	Notification: PropTypes.elementType.isRequired,
};
