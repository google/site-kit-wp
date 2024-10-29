/**
 * Full Screen Metric Selection App.
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
import { Fragment, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useSelect, useDispatch } from 'googlesitekit-data';
import { CORE_LOCATION } from '../../googlesitekit/datastore/location/constants';
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';

export default function FullScreenMetricSelectionApp() {
	const { navigateTo } = useDispatch( CORE_LOCATION );

	const isKeyMetricActive = useSelect( ( select ) => {
		select( CORE_USER ).isKeyMetricActive();
	} );

	const mainDashboardURL = useSelect( ( select ) =>
		select( CORE_SITE ).getAdminURL( 'googlesitekit-dashboard' )
	);

	useEffect( () => {
		// If key metrics have been set up, redirect the user to the main dashboard.
		if ( isKeyMetricActive && mainDashboardURL ) {
			navigateTo( mainDashboardURL );
		}
	}, [ isKeyMetricActive, mainDashboardURL ] );

	return (
		<Fragment>
			<div className="googlesitekit-metric-selection">
				<div className="googlesitekit-module-page">
					<h1>New page test...</h1>
				</div>
			</div>
		</Fragment>
	);
}
