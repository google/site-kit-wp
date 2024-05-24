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
import { useSelect, useRegistry } from 'googlesitekit-data';
import PreviewBlock from '../../../../components/PreviewBlock';
import CTA from '../../../../components/notifications/CTA';
import { CORE_USER } from '../../../../googlesitekit/datastore/user/constants';
import { DATE_RANGE_OFFSET } from '../../../analytics-4/datastore/constants';
import { createPaxServices } from '../../pax/services';
import { useMemoOne } from 'use-memo-one';
import { formatPaxDate } from '../../pax/utils';

export default function PAXEmbeddedApp( {
	displayMode = 'default',
	onLaunch,
	onCampaignCreated,
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
		return createPaxServices( registry, { onCampaignCreated } );
	}, [ registry, onCampaignCreated ] );

	const paxDateRange = useSelect( ( select ) => {
		if ( displayMode !== 'reporting' ) {
			return {};
		}

		return select( CORE_USER ).getDateRangeDates( {
			offsetDays: DATE_RANGE_OFFSET,
		} );
	} );

	const isAdBlockerActive = useSelect( ( select ) =>
		select( CORE_USER ).isAdBlockerActive()
	);

	const instanceID = useInstanceId( PAXEmbeddedApp, 'PAXEmbeddedApp' );

	const paxAppRef = useRef();

	const elementID = useMemoOne( () => {
		return `googlesitekit-pax-embedded-app-${ instanceID }`;
	}, [ instanceID ] );

	const paxConfig = useMemoOne( () => {
		return {
			...( global?._googlesitekitPAXConfig || {} ),
			clientConfig: {
				contentContainer: `#${ elementID }`,
			},
			contentConfig: {
				partnerAdsExperienceConfig: {
					reportingStyle:
						displayMode === 'reporting'
							? 'REPORTING_STYLE_MINI'
							: 'REPORTING_STYLE_FULL',
				},
			},
		};
	}, [ elementID, displayMode ] );

	const setDateRangeForReportingMode = useCallback( () => {
		if (
			displayMode === 'reporting' &&
			paxAppRef?.current &&
			paxDateRange.startDate &&
			paxDateRange.endDate
		) {
			paxAppRef.current.getServices().adsDateRangeService.update( {
				startDate: formatPaxDate( paxDateRange.startDate ),
				endDate: formatPaxDate( paxDateRange.endDate ),
			} );
		}
	}, [ displayMode, paxDateRange.endDate, paxDateRange.startDate ] );

	const launchPAXApp = useCallback( async () => {
		if ( hasLaunchedPAXApp || paxAppRef.current ) {
			return;
		}

		setHasLaunchedPAXApp( true );

		try {
			paxAppRef.current =
				await global.google.ads.integration.integrator.launchGoogleAds(
					paxConfig,
					paxServices
				);

			setDateRangeForReportingMode();

			onLaunch?.( paxAppRef.current );
		} catch ( error ) {
			setLaunchError( error );
			global.console.error(
				'Google Ads Partner Experience Error:',
				error
			);
		}

		setIsLoading( false );
	}, [
		hasLaunchedPAXApp,
		paxConfig,
		paxServices,
		setDateRangeForReportingMode,
		onLaunch,
	] );

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
		// Supplying `null` as the interval will stop the interval, so we
		// use `null` once the app has been launched to prevent further
		// checking of whether the app is _ready_ to launch.
		hasLaunchedPAXApp ? null : 50
	);

	useEffect( () => {
		if ( launchGoogleAdsAvailable ) {
			launchPAXApp();
		}
	}, [
		hasLaunchedPAXApp,
		isLoading,
		launchGoogleAdsAvailable,
		launchPAXApp,
	] );

	useEffect( () => {
		setDateRangeForReportingMode();
	}, [
		setDateRangeForReportingMode,
		// `setDateRangeForReportingMode` will change whenever the date range
		// updates, causing this effect to run again, so the two date range
		// dependencies are technically redundant, but are explicitly listed
		// here to make the intent of the code clearer. (They're harmless
		// to include and do not cause extra renders/requests.)
		paxDateRange.startDate,
		paxDateRange.endDate,
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
