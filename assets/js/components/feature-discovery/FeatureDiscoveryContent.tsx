/**
 * Feature Discovery routed content.
 *
 * Site Kit by Google, Copyright 2026 Google LLC
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
import compareVersions from 'compare-versions';
import { FC } from 'react';
import { Redirect, Route, Switch, useLocation } from 'react-router-dom';

/**
 * WordPress dependencies
 */
import { useEffect, useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Select, useDispatch, useSelect } from 'googlesitekit-data';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import {
	DEFAULT_TAB_PATH,
	FEATURE_DISCOVERY_TABS,
	FEATURE_DISCOVERY_VISITED_ITEM_SLUG,
	FIRST_VISIT_TAB_PATH,
	HUB_LAUNCH_VERSION,
} from './constants';

const TAB_PATHS = FEATURE_DISCOVERY_TABS.map( ( { path } ) => path );

const FeatureDiscoveryContent: FC = () => {
	const location = useLocation();
	const isExplicitTab = TAB_PATHS.includes( location.pathname );

	const initialVersion = useSelect(
		( select: Select ) => select( CORE_USER ).getInitialSiteKitVersion(),
		[]
	);
	const hasResolvedInitialVersion = useSelect(
		( select: Select ) =>
			select( CORE_USER ).hasFinishedResolution(
				'getInitialSiteKitVersion'
			),
		[]
	);
	const hasVisitedHub = useSelect(
		( select: Select ) =>
			select( CORE_USER ).isItemDismissed(
				FEATURE_DISCOVERY_VISITED_ITEM_SLUG
			),
		[]
	);

	const { dismissItem } = useDispatch( CORE_USER );
	const hasMarkedVisitedRef = useRef( false );

	const isRoutingStateResolved =
		hasResolvedInitialVersion && hasVisitedHub !== undefined;

	useEffect( () => {
		if (
			! isRoutingStateResolved ||
			hasVisitedHub !== false ||
			hasMarkedVisitedRef.current
		) {
			return;
		}

		hasMarkedVisitedRef.current = true;
		dismissItem( FEATURE_DISCOVERY_VISITED_ITEM_SLUG );
	}, [ dismissItem, hasVisitedHub, isRoutingStateResolved ] );

	if ( ! isExplicitTab && ! isRoutingStateResolved ) {
		return null;
	}

	const isFirstVisitByNewUser =
		hasVisitedHub === false &&
		!! initialVersion &&
		compareVersions.compare( initialVersion, HUB_LAUNCH_VERSION, '>=' );

	const defaultPath = isFirstVisitByNewUser
		? FIRST_VISIT_TAB_PATH
		: DEFAULT_TAB_PATH;

	return (
		<Switch>
			{ FEATURE_DISCOVERY_TABS.map(
				( { path, tabID, panelID, Component } ) => (
					<Route key={ path } path={ path } exact>
						<div
							aria-labelledby={ tabID }
							id={ panelID }
							role="tabpanel"
							tabIndex={ 0 }
						>
							<Component />
						</div>
					</Route>
				)
			) }
			<Redirect to={ defaultPath } />
		</Switch>
	);
};

export default FeatureDiscoveryContent;
