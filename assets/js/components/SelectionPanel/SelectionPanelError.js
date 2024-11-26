/**
 * Selection Panel Error
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
 * External dependencies
 */
import PropTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import { useEffect, useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { elementsOverlap } from '../../util/geometry';
import ErrorNotice from '../ErrorNotice';
import WarningSVG from '../../../svg/icons/warning.svg';

export default function SelectionPanelError( {
	error,
	noPrefix = true,
	skipRetryMessage = true,
} ) {
	const noticeRef = useRef();

	// Scroll the metric item (normally the last item in the panel)
	// being overlapped by the error.
	useEffect( () => {
		if ( error ) {
			const currentFocusedElement = global.document.activeElement;

			if (
				currentFocusedElement &&
				currentFocusedElement.closest(
					'.googlesitekit-selection-panel-item'
				) &&
				elementsOverlap( noticeRef.current, currentFocusedElement )
			) {
				currentFocusedElement.scrollIntoView();
			}
		}
	}, [ error ] );

	if ( ! error ) {
		return null;
	}

	return (
		<div className="googlesitekit-selection-panel-error" ref={ noticeRef }>
			<ErrorNotice
				Icon={ WarningSVG }
				error={ error }
				noPrefix={ noPrefix }
				skipRetryMessage={ skipRetryMessage }
			/>
		</div>
	);
}

SelectionPanelError.propTypes = {
	error: PropTypes.shape( {
		message: PropTypes.string,
	} ),
	noPrefix: PropTypes.bool,
	skipRetryMessage: PropTypes.bool,
};
