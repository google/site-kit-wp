/**
 * Settings notice component.
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
import PropTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import { useEffect, useRef, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import SettingsNotice from './SettingsNotice';

// TODO: This could renamed/moved to be more generic e.g. `ComponentWithIntersectionObserver`,
// or refactored to a HOC.
function SettingsNoticeWithIntersectionObserver( {
	onInView,
	...settingsNoticeProps
} ) {
	const trackingRef = useRef();
	const intersectionEntry = useIntersection( trackingRef, {
		root: null,
		threshold: 0.45,
	} );
	const [ hasBeenInView, setHasBeenInView ] = useState( false );
	const inView =
		!! intersectionEntry?.isIntersecting &&
		!! intersectionEntry?.intersectionRatio;

	useEffect( () => {
		if ( ! intersectionEntry ) {
			return;
		}
		// eslint-disable-next-line no-console
		console.info( {
			inView,
			hasBeenInView,
			isIntersecting: intersectionEntry?.isIntersecting,
		} );

		if ( inView && ! hasBeenInView ) {
			onInView();
			setHasBeenInView( true );
		}
	}, [ hasBeenInView, inView, intersectionEntry, onInView ] );

	return <SettingsNotice ref={ trackingRef } { ...settingsNoticeProps } />;
}

SettingsNoticeWithIntersectionObserver.propTypes = {
	onInView: PropTypes.func.isRequired,
	...SettingsNotice.propTypes,
};

export default SettingsNoticeWithIntersectionObserver;
