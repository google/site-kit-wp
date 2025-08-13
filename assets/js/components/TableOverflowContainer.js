/**
 * TableOverflowContainer component.
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
import PropTypes from 'prop-types';
import { debounce } from 'lodash';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useEffect, useRef, useState } from '@wordpress/element';

function TableOverflowContainer( { children } ) {
	const [ isScrolling, setScrolling ] = useState( false );
	const scrollRef = useRef();

	useEffect( () => {
		setIsScrolling();

		const resize = debounce( setIsScrolling, 100 );

		global.addEventListener( 'resize', resize );

		return () => global.removeEventListener( 'resize', resize );
	}, [] );

	function setIsScrolling() {
		if ( ! scrollRef.current ) {
			return;
		}

		const { scrollLeft, scrollWidth, offsetWidth } = scrollRef.current;
		const maxScroll = scrollWidth - offsetWidth;
		const scrolling = scrollLeft < maxScroll - 16 && 0 < maxScroll - 16; // 16 = $grid-gap-phone

		setScrolling( scrolling );
	}

	return (
		<div
			onScroll={ debounce( setIsScrolling, 100 ) }
			className={ classnames( 'googlesitekit-table-overflow', {
				'googlesitekit-table-overflow--gradient': isScrolling,
			} ) }
		>
			<div
				ref={ scrollRef }
				className="googlesitekit-table-overflow__container"
			>
				{ children }
			</div>
		</div>
	);
}

TableOverflowContainer.propTypes = {
	children: PropTypes.element,
};

export default TableOverflowContainer;
