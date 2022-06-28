/**
 * AdSenseConnectCTA > ContentSwipeable component.
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
import { useSwipeable } from 'react-swipeable';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Content from './Content';

const minStage = 0;
const maxStage = 2;

export default function ContentSwipeable() {
	const [ { stage, mode, nextStage }, setContentState ] = useState( {
		stage: 0,
		mode: 'enter',
		nextStage: 0,
	} );

	const { ref } = useSwipeable( {
		onSwipedLeft: () =>
			setContentState( {
				stage,
				mode: 'leave',
				nextStage: nextStage === maxStage ? minStage : nextStage + 1,
			} ),
		onSwipedRight: () =>
			setContentState( {
				stage,
				mode: 'leave',
				nextStage: nextStage === minStage ? maxStage : nextStage - 1,
			} ),
	} );

	function onAnimationEnd() {
		if ( mode === 'leave' ) {
			setContentState( {
				stage: nextStage,
				mode: 'enter',
				nextStage,
			} );
		}
	}

	return (
		<Content
			ref={ ref }
			stage={ stage }
			mode={ mode }
			onAnimationEnd={ onAnimationEnd }
		/>
	);
}
