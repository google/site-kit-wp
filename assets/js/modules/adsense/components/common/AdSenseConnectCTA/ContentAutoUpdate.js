/**
 * AdSenseConnectCTA > ContentAutoUpdate component.
 *
 * Site Kit by Google, Copyright 2022 Google LLC
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
import { useState, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Content from './Content';

const minStage = 0;
const maxStage = 2;

export default function ContentAutoUpdate( { hasBeenInView } ) {
	const [ { stage, mode }, setContentState ] = useState( {
		stage: 0,
		mode: 'static',
	} );

	function onAnimationEnd() {
		if ( mode === 'enter' ) {
			setContentState( {
				stage,
				mode: 'leave',
			} );
		} else if ( mode === 'leave' ) {
			setContentState( {
				stage: stage === maxStage ? minStage : stage + 1,
				mode: 'enter',
			} );
		}
	}

	useEffect( () => {
		if ( ! hasBeenInView ) {
			return;
		}

		const timeoutID = setTimeout( () => {
			setContentState( {
				stage: 0,
				mode: 'leave',
			} );
		}, 7000 );

		return () => {
			clearTimeout( timeoutID );
		};
	}, [ hasBeenInView ] );

	return (
		<Content
			stage={ stage }
			mode={ mode }
			onAnimationEnd={ onAnimationEnd }
		/>
	);
}

ContentAutoUpdate.propTypes = {
	hasBeenInView: PropTypes.bool.isRequired,
};
