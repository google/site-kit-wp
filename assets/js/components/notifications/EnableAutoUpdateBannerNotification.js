/**
 * EnableAutoUpdateBannerNotification component.
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
import { useCallback, useEffect, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useSelect, useDispatch } from 'googlesitekit-data';
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import { MINUTE_IN_SECONDS } from '../../util';
import useQueryArg from '../../hooks/useQueryArg';
import SimpleNotification from '../../googlesitekit/notifications/components/layout/SimpleNotification';
import Description from '../../googlesitekit/notifications/components/common/Description';
import ActionsCTALinkDismiss from '../../googlesitekit/notifications/components/common/ActionsCTALinkDismiss';
import Dismiss from '../../googlesitekit/notifications/components/common/Dismiss';
import { useMount } from 'react-use';
import { CORE_NOTIFICATIONS } from '../../googlesitekit/notifications/datastore/constants';

export default function EnableAutoUpdateBannerNotification( {
	id,
	Notification,
} ) {
	const siteKitAutoUpdatesEnabled = useSelect( ( select ) =>
		select( CORE_SITE ).getSiteKitAutoUpdatesEnabled()
	);
	const enableAutoUpdateError = useSelect( ( select ) =>
		select( CORE_SITE ).getErrorForAction( 'enableAutoUpdate', [] )
	);

	const { dismissNotification } = useDispatch( CORE_NOTIFICATIONS );
	const { enableAutoUpdate } = useDispatch( CORE_SITE );

	const [ notification ] = useQueryArg( 'notification' );

	const [ enabledViaCTA, setEnabledViaCTA ] = useState( false );

	const ctaActivate = useCallback( async () => {
		await enableAutoUpdate();
	}, [ enableAutoUpdate ] );

	useEffect( () => {
		if ( enabledViaCTA === false && siteKitAutoUpdatesEnabled === true ) {
			setEnabledViaCTA( true );
		}
	}, [ enabledViaCTA, siteKitAutoUpdatesEnabled ] );

	/**
	 * If the user just set up Site Kit (eg. just returned from the
	 * initial OAuth sign-in flow) and is seeing the dashboard
	 * for the first time, we want to hide the notification for 10
	 * minutes so they aren't immediately bothered by
	 * CTA notifications.
	 */
	useMount( () => {
		if ( notification === 'authentication_success' ) {
			dismissNotification( id, {
				expiresInSeconds: MINUTE_IN_SECONDS * 10,
			} );
		}
	} );

	// Render the "Auto Updates enabled successfully" banner variation
	// if auto updates were enabled using this banner CTA.
	if ( enabledViaCTA ) {
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
							errorText={ enableAutoUpdateError }
						/>
					}
					actions={
						<Dismiss
							id={ id }
							dismissLabel={ __( 'Dismiss', 'google-site-kit' ) }
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
					/>
				}
				actions={
					<ActionsCTALinkDismiss
						id={ id }
						ctaLabel={ __(
							'Enable auto-updates',
							'google-site-kit'
						) }
						onCTAClick={ ctaActivate }
						dismissLabel={ __( 'Dismiss', 'google-site-kit' ) }
					/>
				}
			/>
		</Notification>
	);
}
