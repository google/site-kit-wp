/**
 * Legacy admin bar widgets.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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
import { STORE_NAME as CORE_MODULES } from '../../googlesitekit/modules/datastore/constants';
import AnalyticsAdminbarWidgetOverview from '../../modules/analytics/components/adminbar/AnalyticsAdminbarWidgetOverview';
import SearchConsoleAdminbarWidgetOverview from '../../modules/search-console/components/adminbar/SearchConsoleAdminbarWidgetOverview';
import { Grid, Row } from '../../material-components';
import AdminBarZeroData from './AdminBarZeroData';
const { useSelect } = Data;

export default function LegacyAdminBarWidgets() {
	const analyticsModuleActive = useSelect( ( select ) => select( CORE_MODULES ).isModuleActive( 'analytics' ) );
	const [ zeroDataSearchConsole, setZeroDataSearchConsole ] = useState( false );
	const [ zeroDataAnalytics, setZeroDataAnalytics ] = useState( false );
	const [ zeroData, setZeroData ] = useState( false );

	useEffect( () => {
		if ( zeroDataSearchConsole && zeroDataAnalytics ) {
			setZeroData( true );
		}
	}, [ zeroDataSearchConsole, zeroDataAnalytics ] );

	if ( zeroData ) {
		return <AdminBarZeroData />;
	}

	const handleSearchConsoleDataError = ( error, data ) => {
		global.console.log( 'handleSearchConsoleDataError', error, data );
		if ( ! error ) {
			setZeroDataSearchConsole( true );
		}
	};

	const handleAnalyticsDataError = ( error, data ) => {
		global.console.log( 'handleAnalyticsDataError', error, data );
		if ( ! error ) {
			setZeroDataAnalytics( true );
		}
	};

	return (
		<Grid>
			<Row>
				{ /* Legacy widgets include their own grid classes */ }
				<SearchConsoleAdminbarWidgetOverview
					handleDataError={ handleSearchConsoleDataError }
				/>

				{ /* Due to limitations of withData, the component must always render unconditionally */ }
				<AnalyticsAdminbarWidgetOverview
					handleDataError={ handleAnalyticsDataError }
					analyticsActive={ analyticsModuleActive }
				/>
			</Row>
		</Grid>
	);
}
