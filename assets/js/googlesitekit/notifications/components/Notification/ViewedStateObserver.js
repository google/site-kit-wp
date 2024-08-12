/**
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

/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { CORE_UI } from '../../../datastore/ui/constants';
import useLatestIntersection from '../../../../hooks/useLatestIntersection';
import { useHasBeenViewed } from '../../hooks/useHasBeenViewed';

const { useDispatch } = Data;

export default function ViewedStateObserver( { id, observeRef, threshold } ) {
	const intersectionEntry = useLatestIntersection( observeRef, {
		threshold,
	} );

	const { setValue } = useDispatch( CORE_UI );
	const isInView = !! intersectionEntry?.isIntersecting;
	const viewed = useHasBeenViewed( id );

	useEffect( () => {
		if ( ! viewed && isInView ) {
			setValue( useHasBeenViewed.getKey( id ), true );
		}
	}, [ viewed, isInView, setValue, id ] );

	return null;
}

ViewedStateObserver.propTypes = {
	id: PropTypes.string,
	observeRef: PropTypes.object,
	threshold: PropTypes.number,
};
