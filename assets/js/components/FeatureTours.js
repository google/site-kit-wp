/**
 * Feature Tours component.
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
import { useMount } from 'react-use';

/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { CORE_USER } from '../googlesitekit/datastore/user/constants';
import useViewContext from '../hooks/useViewContext';
import TourTooltips from './TourTooltips';
const { useSelect, useDispatch } = Data;

export default function FeatureTours() {
	const viewContext = useViewContext();
	const { triggerTourForView } = useDispatch( CORE_USER );

	useMount( () => {
		triggerTourForView( viewContext );
	} );

	const tour = useSelect( ( select ) =>
		select( CORE_USER ).getCurrentTour()
	);

	useEffect( () => {
		if ( ! tour ) {
			return;
		}

		const dashboardElement = document.getElementById(
			'js-googlesitekit-main-dashboard'
		);

		if ( ! dashboardElement ) {
			return;
		}

		const observer = new ResizeObserver( () => {
			global.dispatchEvent( new Event( 'resize' ) );
		} );

		observer.observe( dashboardElement );

		return () => {
			observer.disconnect();
		};
	}, [ tour ] );

	if ( ! tour ) {
		return null;
	}

	return (
		<TourTooltips
			tourID={ tour.slug }
			steps={ tour.steps }
			gaEventCategory={ tour.gaEventCategory }
			callback={ tour.callback }
		/>
	);
}
