/**
 * Analytics useMigrateAdsConversionID custom hook.
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
 * WordPress dependencies
 */
import { useEffect, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useSelect, useDispatch } from 'googlesitekit-data';
import { CORE_MODULES } from '../../../googlesitekit/modules/datastore/constants';
import { MODULES_ANALYTICS_4 } from '../datastore/constants';
import { MODULES_ADS } from '../../ads/datastore/constants';

/**
 * Migrates the Ads Conversion ID from Analytics to the Ads module.
 *
 * @since 1.124.0
 *
 * @return {boolean} True if the migration is in progress, otherwise false.
 */
export default function useMigrateAdsConversionID() {
	const [ loading, setLoading ] = useState( false );

	const legacyAdsConversionID = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getAdsConversionID()
	);
	const isDoingSubmitChanges = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).isDoingSubmitChanges()
	);
	const adsModuleAvailable = useSelect( ( select ) =>
		select( CORE_MODULES ).isModuleAvailable( 'ads' )
	);
	const adsModuleActive = useSelect( ( select ) =>
		select( CORE_MODULES ).isModuleActive( 'ads' )
	);
	const adsModuleConnected = useSelect( ( select ) =>
		select( CORE_MODULES ).isModuleConnected( 'ads' )
	);
	const adsConversionID = useSelect( ( select ) => {
		if ( ! adsModuleAvailable ) {
			return null;
		}

		return select( MODULES_ADS ).getConversionID();
	} );

	const { activateModule, fetchGetModules } = useDispatch( CORE_MODULES );
	const {
		setAdsConversionID: setLegacyAdsConversionID,
		setAdsConversionIDMigratedAtMs,
		submitChanges: submitAnalyticsChanges,
	} = useDispatch( MODULES_ANALYTICS_4 );

	const { setConversionID, submitChanges } = useDispatch( MODULES_ADS );

	useEffect( () => {
		if (
			isDoingSubmitChanges ||
			loading ||
			! adsModuleAvailable ||
			adsModuleConnected ||
			adsConversionID ||
			! legacyAdsConversionID
		) {
			return;
		}

		const migrate = async () => {
			setLoading( true );

			await setConversionID( legacyAdsConversionID );
			await submitChanges();

			await setLegacyAdsConversionID( '' );
			await setAdsConversionIDMigratedAtMs( Date.now() );
			await submitAnalyticsChanges();

			// Activate the module after the migration so that it appears
			// connected immediately.
			if ( ! adsModuleActive ) {
				await activateModule( 'ads' );

				// Refresh modules from server to make Ads appear in the list
				// of connected modules immediately after activation.
				await fetchGetModules();
			}

			setLoading( false );
		};

		migrate();
	}, [
		activateModule,
		adsConversionID,
		adsModuleActive,
		adsModuleAvailable,
		adsModuleConnected,
		fetchGetModules,
		isDoingSubmitChanges,
		legacyAdsConversionID,
		loading,
		setAdsConversionIDMigratedAtMs,
		setConversionID,
		setLegacyAdsConversionID,
		submitAnalyticsChanges,
		submitChanges,
	] );

	return loading;
}
