/**
 * Selection Panel component.
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
import classnames from 'classnames';
import PropTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useDispatch } from 'googlesitekit-data';
import SideSheet from '@/js/components/SideSheet';
import { CORE_UI } from '@/js/googlesitekit/datastore/ui/constants';

export default function SelectionPanel( {
	children,
	isOpen,
	isLoading,
	onOpen,
	closePanel,
	className,
} ) {
	const { setValue } = useDispatch( CORE_UI );

	useEffect( () => {
		setValue( 'selectionPanelOpen', !! isOpen );

		return () => {
			setValue( 'selectionPanelOpen', false );
		};
	}, [ isOpen, setValue ] );

	const classNameSelector = className
		?.split( /\s+/ )
		.map( ( name ) => `.${ name }` )
		.join( '' );

	// Use a function for `initialFocus` so focus-trap resolves the element at
	// activation time. Returning `false` when no match is present falls back
	// to the first focusable element in the trap, avoiding the
	// "refers to no known node" error when items haven't rendered yet.
	const initialFocusSelector = classNameSelector
		? `${ classNameSelector } .googlesitekit-selection-panel-item .googlesitekit-selection-box input`
		: '.googlesitekit-selection-panel-item .googlesitekit-selection-box input';

	function initialFocus() {
		return document.querySelector( initialFocusSelector ) || false;
	}

	return (
		<SideSheet
			className={ classnames(
				'googlesitekit-selection-panel',
				className
			) }
			isOpen={ isOpen }
			isLoading={ isLoading }
			onOpen={ onOpen }
			closeSheet={ closePanel }
			focusTrapOptions={ {
				initialFocus,
			} }
		>
			{ children }
		</SideSheet>
	);
}

SelectionPanel.propTypes = {
	children: PropTypes.node,
	isOpen: PropTypes.bool,
	isLoading: PropTypes.bool,
	onOpen: PropTypes.func,
	closePanel: PropTypes.func,
	className: PropTypes.string,
};
