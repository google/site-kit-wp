/**
 * WPDashboardApp component.
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
 * External dependencies
 */
import { useIntersection } from 'react-use';

/**
 * WordPress dependencies
 */
import { useEffect, useState, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useSelect } from 'googlesitekit-data';
import Link from '../Link';
import WPDashboardWidgets from './WPDashboardWidgets';
import InViewProvider from '../../components/InViewProvider';
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';

function WPDashboardApp() {
	const trackingRef = useRef();
	const intersectionEntry = useIntersection( trackingRef, {
		threshold: 0, // Trigger "in-view" as soon as one pixel is visible.
	} );

	const dashboardURL = useSelect( ( select ) =>
		select( CORE_SITE ).getAdminURL( 'googlesitekit-dashboard' )
	);

	const [ inViewState, setInViewState ] = useState( {
		key: 'WPDashboardApp',
		value: !! intersectionEntry?.intersectionRatio,
	} );

	useEffect( () => {
		setInViewState( {
			key: 'WPDashboardApp',
			value: !! intersectionEntry?.intersectionRatio,
		} );
	}, [ intersectionEntry ] );

	if ( dashboardURL === undefined ) {
		return <div ref={ trackingRef } />;
	}

	if ( ! dashboardURL ) {
		return null;
	}

	return (
		<InViewProvider value={ inViewState }>
			<div className="googlesitekit-wp-dashboard" ref={ trackingRef }>
				<div className="googlesitekit-wp-dashboard__cta">
					<Link
						className="googlesitekit-wp-dashboard__cta-link"
						href={ dashboardURL }
					>
						{ __(
							'Visit your Site Kit Dashboard',
							'google-site-kit'
						) }
					</Link>
				</div>
				<WPDashboardWidgets />
			</div>
		</InViewProvider>
	);
}

export default WPDashboardApp;
