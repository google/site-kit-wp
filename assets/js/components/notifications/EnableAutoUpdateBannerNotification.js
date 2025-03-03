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
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useCallback, useEffect, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useSelect, useDispatch } from 'googlesitekit-data';
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import useViewContext from '../../hooks/useViewContext';
import SimpleNotification from '../../googlesitekit/notifications/components/layout/SimpleNotification';
import Description from '../../googlesitekit/notifications/components/common/Description';
import ActionsCTALinkDismiss from '../../googlesitekit/notifications/components/common/ActionsCTALinkDismiss';
import Dismiss from '../../googlesitekit/notifications/components/common/Dismiss';

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
	}, [ enabledViaCTA, siteKitAutoUpdatesEnabled ] );

	// Render the "Auto Updates enabled successfully" banner variation
	// if auto updates were enabled using this banner CTA.
	if ( enabledViaCTA ) {
		// Use separate GA tracking event category for success banner variation.
		const gaTrackingEventArgs = {
			category: `${ viewContext }_${ ENABLE_AUTO_UPDATES_BANNER_SLUG }-success`,
		};

		return (
			<Notification className="googlesitekit-publisher-win">
				<SimpleNotification
					title={ __(
						'Thanks for enabling auto-updates',
						'google-site-kit'
					) }
					description={
						<Description
							text={ __(
								'Auto-updates have been enabled. Your version of Site Kit will automatically be updated when new versions are available.',
								'google-site-kit'
							) }
							errorText={ enableAutoUpdateError?.message }
						/>
					}
					actions={
						<Dismiss
							id={ id }
							dismissLabel={ __( 'Dismiss', 'google-site-kit' ) }
							gaTrackingEventArgs={ gaTrackingEventArgs }
							dismissExpires={ 1 } // Expire the dismissal instantly to allow showing the banner again if auto-updates are disabled later.
						/>
					}
				/>
			</Notification>
		);
	}

	return (
		<Notification className="googlesitekit-publisher-win">
			<SimpleNotification
				title={ __( 'Keep Site Kit up-to-date', 'google-site-kit' ) }
				description={
					<Description
						text={ __(
							'Turn on auto-updates so you always have the latest version of Site Kit. We constantly introduce new features to help you get the insights you need to be successful on the web.',
							'google-site-kit'
						) }
						errorText={ enableAutoUpdateError?.message }
					/>
				}
				actions={
					<ActionsCTALinkDismiss
						id={ id }
						ctaLabel={ __(
							'Enable auto-updates',
							'google-site-kit'
						) }
						dismissOnCTAClick={ false }
						onCTAClick={ ctaActivate }
						dismissLabel={ __( 'Dismiss', 'google-site-kit' ) } // This dismissal is permanent since the user specifically chose not to enable auto-updates.
					/>
				}
			/>
		</Notification>
	);
}
