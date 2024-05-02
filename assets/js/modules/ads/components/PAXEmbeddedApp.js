/**
 * Ads Partner Ads Experience (PAX) Embedded App component.
 *
 * Site Kit by Google, Copyright 2024 Google LLC
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
import { useInterval } from 'react-use';

/**
 * WordPress dependencies
 */
import { useInstanceId } from '@wordpress/compose';
import {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { CORE_USER } from '../../../googlesitekit/datastore/user/constants';
import CTA from '../../../components/notifications/CTA';
import PreviewBlock from '../../../components/PreviewBlock';
import { createPaxServices } from '../pax/services';
const { useRegistry, useSelect } = Data;

export default function PAXEmbeddedApp( {
	// eslint-disable-next-line no-unused-vars
	displayMode = 'default',
	onLaunch,
} ) {
	const [ launchGoogleAdsAvailable, setLaunchGoogleAdsAvailable ] = useState(
		typeof global?.google?.ads?.integration?.integrator?.launchGoogleAds ===
			'function'
	);

	const [ hasLaunchedPAXApp, setHasLaunchedPAXApp ] = useState( false );
	const [ isLoading, setIsLoading ] = useState( true );
	const [ launchError, setLaunchError ] = useState( undefined );

	const registry = useRegistry();

	const paxServices = useMemo( () => {
		return createPaxServices( registry );
	}, [ registry ] );

	const isAdBlockerActive = useSelect( ( select ) =>
		select( CORE_USER ).isAdBlockerActive()
	);

	const instanceID = useInstanceId( PAXEmbeddedApp, 'PAXEmbeddedApp' );

	const paxAppRef = useRef();

	const elementID = `googlesitekit-pax-embedded-app-${ instanceID }`;

	const paxConfig = useMemo( () => {
		return {
			...( global?._googlesitekitPAXConfig || {} ),
			clientConfig: {
				contentContainer: `#${ elementID }`,
			},
		};
	}, [ elementID ] );

	const paxServicesWithAuthToken = useMemo( () => {
		return {
			authenticationService: {
				// Marked as async for clarity, despite there being no await calls here.
				// eslint-disable-next-line require-await
				get: async () => {
					return {
						accessToken:
							global?._googlesitekitPAXConfig?.authAccess
								?.oauthTokenAccess,
						authuser: '0',
					};
				},
				// Marked as async for clarity, despite there being no await calls here.
				// eslint-disable-next-line require-await
				fix: async () => {
					return {
						retryReady: true,
					};
				},
			},
			...paxServices,
		};
	}, [ paxServices ] );

	const launchPAXApp = useCallback( async () => {
		try {
			paxAppRef.current =
				await global.google.ads.integration.integrator.launchGoogleAds(
					paxConfig,
					paxServicesWithAuthToken
				);

			onLaunch?.( paxAppRef.current );
		} catch ( error ) {
			setLaunchError( error );
			global.console.error(
				'Google Ads Partner Experience Error:',
				error
			);
		}

		setIsLoading( false );
	}, [ paxConfig, paxServicesWithAuthToken, onLaunch ] );

	useInterval(
		() => {
			if ( launchGoogleAdsAvailable || hasLaunchedPAXApp ) {
				return;
			}

			if (
				typeof global?.google?.ads?.integration?.integrator
					?.launchGoogleAds === 'function'
			) {
				setLaunchGoogleAdsAvailable( true );
			}
		},
		hasLaunchedPAXApp ? null : 50
	);

	useEffect( () => {
		if ( launchGoogleAdsAvailable && ! hasLaunchedPAXApp ) {
			setHasLaunchedPAXApp( true );

			launchPAXApp();
		}
	}, [
		hasLaunchedPAXApp,
		isLoading,
		launchGoogleAdsAvailable,
		launchPAXApp,
	] );

	return (
		<div className="googlesitekit-pax-embedded-app">
			{ !! launchError && ! isAdBlockerActive && (
				<CTA
					title={ __( 'Google Ads error', 'google-site-kit' ) }
					description={ __(
						'Could not load Google Ads content.',
						'google-site-kit'
					) }
					error
				/>
			) }

			{ isLoading && <PreviewBlock width="100%" height="240px" /> }

			<div id={ elementID } />
		</div>
	);
}

PAXEmbeddedApp.propTypes = {
	displayMode: PropTypes.oneOf( [ 'default', 'reporting', 'setup' ] ),
	onLaunch: PropTypes.func,
};
