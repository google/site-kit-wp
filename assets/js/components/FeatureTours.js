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
 * WordPress dependencies
 */
import { useContext } from '@wordpress/element';

/**
 * External dependencies
 */
import PropTypes from 'prop-types';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import ViewContextContext from '../components/Root/ViewContextContext';
import { CORE_USER } from '../googlesitekit/datastore/user/constants';
import TourTooltips from './TourTooltips';
const { useSelect } = Data;

export default function FeatureTours() {
	const viewContext = useContext( ViewContextContext );

	const nextTour = useSelect(
		( select ) =>
			select( CORE_USER ).getFeatureToursForView( viewContext )?.[ 0 ]
	);
	const toursAreOnCooldown = useSelect( ( select ) =>
		select( CORE_USER ).areFeatureToursOnCooldown()
	);

	if ( ! nextTour || toursAreOnCooldown ) {
		return null;
	}

	return (
		<TourTooltips
			tourID={ nextTour.slug }
			steps={ nextTour.steps }
			gaEventCategory={ nextTour.gaEventCategory }
			callback={ nextTour.callback }
		/>
	);
}

FeatureTours.propTypes = {
	viewContext: PropTypes.string,
};
