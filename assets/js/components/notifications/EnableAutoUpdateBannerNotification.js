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
import BannerNotification from './BannerNotification';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Fragment, useCallback, useEffect, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import { getTimeInSeconds } from '../../util';
import useQueryArg from '../../hooks/useQueryArg';
import {
	CORE_USER,
	PERMISSION_UPDATE_PLUGINS,
} from '../../googlesitekit/datastore/user/constants';
import { getItem, setItem } from '../../googlesitekit/api/cache';
import SpinnerButton from '../SpinnerButton';
import ErrorNotice from '../ErrorNotice';

const { useSelect, useDispatch } = Data;

const NOTIFICATION_ID = 'enable-plugin-auto-update-notification';
const HIDE_NOTIFICATION_ON_FIRST_SETUP =
	'auto-update-banner-hide-notification-on-first-setup';

const EnableAutoUpdateBannerNotification = () => {
	const hasUpdatePluginCapacity = useSelect( ( select ) =>
		select( CORE_USER ).hasCapability( PERMISSION_UPDATE_PLUGINS )
	);
	const autoUpdatesEnabled = useSelect( ( select ) =>
		select( CORE_SITE ).getAutoUpdatesEnabled()
	);
	const siteKitAutoUpdatesEnabled = useSelect( ( select ) =>
		select( CORE_SITE ).getSiteKitAutoUpdatesEnabled()
	);

	const isDoingEnableAutoUpdate = useSelect( ( select ) =>
		select( CORE_SITE ).isDoingEnableAutoUpdate()
	);

	const enableAutoUpdateError = useSelect( ( select ) =>
		select( CORE_SITE ).getErrorForAction( 'enableAutoUpdate', [] )
	);

	const { enableAutoUpdate } = useDispatch( CORE_SITE );

	const [ notification ] = useQueryArg( 'notification' );
	const [ slug ] = useQueryArg( 'slug' );

	const [ isInitialPluginSetup, setIsFirstPluginSetup ] = useState( true );
	const [ enabledViaCTA, setEnabledViaCTA ] = useState( undefined );

	// Set the `enabledViaCTA` state to the value of `siteKitAutoUpdatesEnabled`,
	// once `siteKitAutoUpdatesEnabled` is loaded.
	useEffect( () => {
		if (
			enabledViaCTA === undefined &&
			siteKitAutoUpdatesEnabled !== undefined
		) {
			setEnabledViaCTA( siteKitAutoUpdatesEnabled );
		}
	}, [ enabledViaCTA, siteKitAutoUpdatesEnabled ] );

	const ctaActivate = useCallback( async () => {
		await enableAutoUpdate();
	}, [ enableAutoUpdate ] );

	useEffect( () => {
		if ( enabledViaCTA === false && siteKitAutoUpdatesEnabled === true ) {
			setEnabledViaCTA( true );
		}
	}, [ enabledViaCTA, siteKitAutoUpdatesEnabled ] );

	const setFirstPluginSetup = useCallback(
		async ( isFirstSetup ) => {
			if ( isFirstSetup ) {
				await setItem( HIDE_NOTIFICATION_ON_FIRST_SETUP, true, {
					ttl: getTimeInSeconds() * 10,
				} );
				setIsFirstPluginSetup( isFirstSetup );
			} else {
				const { value } = await getItem(
					HIDE_NOTIFICATION_ON_FIRST_SETUP
				);
				setIsFirstPluginSetup( !! value );
			}
		},
		[ setIsFirstPluginSetup ]
	);

	/**
	 * If the user just set up Site Kit (eg. just returned from the
	 * initial OAuth sign-in flow) and is seeing the dashboard
	 * for the first time, we want to hide the notification for 10
	 * minutes so they aren't immediately bothered by
	 * CTA notifications.
	 */
	useEffect( () => {
		if (
			! hasUpdatePluginCapacity ||
			! autoUpdatesEnabled ||
			siteKitAutoUpdatesEnabled
		) {
			return;
		}
		setFirstPluginSetup(
			notification === 'authentication_success' && ! slug
		);
	}, [
		notification,
		slug,
		hasUpdatePluginCapacity,
		autoUpdatesEnabled,
		setFirstPluginSetup,
		siteKitAutoUpdatesEnabled,
	] );

	// Don't render anything if the user has no permission to update plugin,
	// plugin auto-updates are disabled or auto update are already enabled for
	// Site Kit.
	if (
		! hasUpdatePluginCapacity ||
		! autoUpdatesEnabled ||
		( siteKitAutoUpdatesEnabled && ! enabledViaCTA )
	) {
		return null;
	}

	// Don't show this banner if the user just came from the initial Site Kit
	// setup flow less than 10 minutes ago.
	if ( isInitialPluginSetup ) {
		return null;
	}

	return (
		<BannerNotification
			id={ NOTIFICATION_ID }
			title={
				enabledViaCTA
					? __(
							'Thanks for enabling auto-updates',
							'google-site-kit'
					  )
					: __( 'Keep Site Kit up-to-date', 'google-site-kit' )
			}
			description={
				enabledViaCTA
					? __(
							'Auto-updates have been enabled. Your version of Site Kit will automatically be updated when new versions are available.',
							'google-site-kit'
					  )
					: __(
							'Turn on auto-updates so you always have the latest version of Site Kit. We constantly introduce new features to help you get the insights you need to be successful on the web.',
							'google-site-kit'
					  )
			}
			ctaComponent={
				enabledViaCTA ? undefined : (
					<Fragment>
						{ enableAutoUpdateError && (
							<div>
								<ErrorNotice
									error={ enableAutoUpdateError }
									storeName={ CORE_SITE }
								/>
							</div>
						) }
						<SpinnerButton
							onClick={ ctaActivate }
							isSaving={ isDoingEnableAutoUpdate }
						>
							{ __( 'Enable auto-updates', 'google-site-kit' ) }
						</SpinnerButton>
					</Fragment>
				)
			}
			dismiss={ __( 'Dismiss', 'google-site-kit' ) }
			isDismissible
			dismissExpires={ 0 }
			dismissOnCTAClick={ enabledViaCTA }
		/>
	);
};

export default EnableAutoUpdateBannerNotification;
