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
import Data from 'googlesitekit-data';
import { CORE_MODULES } from '../../../googlesitekit/modules/datastore/constants';
import { MODULES_ANALYTICS_4 } from '../datastore/constants';
import { MODULES_ADS } from '../../ads/datastore/constants';

const { useSelect, useDispatch } = Data;

/**
 * Migrates the Ads Conversion ID from Analytics to the Ads module.
 *
 * @since n.e.x.t
 *
 * @return {boolean} True if the migration is in progress, otherwise false.
 */
export default function useMigrateAdsConversionID() {
	const [ loading, setLoading ] = useState( false );

	const legacyAdsConversionID = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getAdsConversionID()
	);
	const adsConversionID = useSelect( ( select ) =>
		select( MODULES_ADS ).getAdsConversionID()
	);
	const isDoingSubmitChanges = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).isDoingSubmitChanges()
	);
	const adsModuleActive = useSelect( ( select ) =>
		select( CORE_MODULES ).isModuleActive( 'ads' )
	);

	const { activateModule } = useDispatch( CORE_MODULES );
	const { setAdsConversionID, submitChanges: submitAdsChanges } =
		useDispatch( MODULES_ADS );
	const {
		setAdsConversionID: setLegacyAdsConversionID,
		submitChanges: submitAnalyticsChanges,
	} = useDispatch( MODULES_ANALYTICS_4 );

	useEffect( () => {
		const migrate = async () => {
			if ( isDoingSubmitChanges || loading ) {
				return;
			}

			if ( adsConversionID ) {
				return;
			}

			if ( legacyAdsConversionID ) {
				setLoading( true );

				if ( ! adsModuleActive ) {
					await activateModule( 'ads' );
				}

				await setAdsConversionID( legacyAdsConversionID );
				await submitAdsChanges();

				await setLegacyAdsConversionID( '' );
				await submitAnalyticsChanges();

				setLoading( false );
			}
		};

		migrate();
	}, [
		activateModule,
		adsConversionID,
		adsModuleActive,
		isDoingSubmitChanges,
		legacyAdsConversionID,
		loading,
		setAdsConversionID,
		setLegacyAdsConversionID,
		submitAdsChanges,
		submitAnalyticsChanges,
	] );

	return loading;
}
