/**
 * Accordion component.
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
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useState, useCallback, useEffect } from '@wordpress/element';
import { ENTER, SPACE } from '@wordpress/keycodes';

export default function Accordion( {
	title,
	children,
	initialOpen,
	onOpen,
	onClose,
	disabled,
} ) {
	const [ isActive, setActive ] = useState( !! initialOpen );

	useEffect( () => {
		if ( isActive && onOpen && typeof onOpen === 'function' ) {
			onOpen();
		} else if ( ! isActive && onClose && typeof onClose === 'function' ) {
			onClose();
		}
	}, [ isActive, onClose, onOpen ] );

	useEffect( () => {
		if ( disabled && isActive ) {
			setActive( false );
		}
	}, [ disabled, isActive ] );

	const toggleAccordion = useCallback(
		( event ) => {
			if (
				event.type === 'keydown' &&
				! [ ENTER, SPACE ].includes( event.keyCode )
			) {
				return;
			}

			// Prevent scroll when spacebar is hit.
			event.preventDefault();

			setActive( ! isActive );
		},
		[ isActive ]
	);

	return (
		<div
			className={ classnames( 'googlesitekit-accordion', {
				'googlesitekit-accordion--disabled': disabled,
			} ) }
		>
			<div
				className={ classnames( 'googlesitekit-accordion__header', {
					'is-active': isActive,
				} ) }
				onClick={ toggleAccordion }
				onKeyDown={ toggleAccordion }
				tabIndex={ disabled ? -1 : 0 }
				role="button"
			>
				{ title }
			</div>
			<div
				className={ classnames( 'googlesitekit-accordion__content', {
					'is-active': isActive,
				} ) }
			>
				{ children }
			</div>
		</div>
	);
}

Accordion.propTypes = {
	title: PropTypes.node.isRequired,
	children: PropTypes.node.isRequired,
	initialOpen: PropTypes.bool,
	onOpen: PropTypes.func,
	onClose: PropTypes.func,
	disabled: PropTypes.bool,
};
