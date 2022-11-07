/**
 * Menu component.
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
import classnames from 'classnames';
import PropTypes from 'prop-types';
import useMergedRef from '@react-hook/merged-ref';

/**
 * WordPress dependencies
 */
import {
	forwardRef,
	useCallback,
	useEffect,
	useRef,
	useState,
} from '@wordpress/element';

/**
 * Internal dependencies
 */
import { MDCMenu } from '../../material-components';

const Menu = forwardRef(
	(
		{
			children,
			className,
			menuOpen,
			menuItems,
			onSelected,
			nonInteractive,
			id,
		},
		ref
	) => {
		const [ menu, setMenu ] = useState( null );

		const menuRef = useRef( null );
		const mergedRefs = useMergedRef( ref, menuRef );

		const handleMenuSelected = useCallback(
			( event ) => {
				const {
					detail: { index },
				} = event;

				onSelected( index, event );
			},
			[ onSelected ]
		);

		useEffect( () => {
			if ( ! menuRef?.current ) {
				return;
			}

			const menuComponent = new MDCMenu( menuRef.current );
			menuComponent.listen( 'MDCMenu:selected', handleMenuSelected );
			menuComponent.quickOpen = true;

			setMenu( menuComponent );

			return () => {
				menuComponent.unlisten(
					'MDCMenu:selected',
					handleMenuSelected
				);

				menuComponent.destroy();
			};
		}, [ menuRef, handleMenuSelected, nonInteractive ] );

		useEffect( () => {
			if ( menu ) {
				menu.open = menuOpen;
				menu.setDefaultFocusState( 1 );
			}
		}, [ menu, menuOpen ] );

		return (
			<div
				className={ classnames(
					'mdc-menu',
					'mdc-menu-surface',
					className
				) }
				ref={ mergedRefs }
			>
				<ul
					aria-hidden={ ! menuOpen }
					aria-orientation="vertical"
					className={ classnames( 'mdc-list', {
						'mdc-list--non-interactive': nonInteractive,
					} ) }
					id={ id }
					role="menu"
					tabIndex="-1"
				>
					{ ! children &&
						menuItems.map( ( item, index ) => (
							<li
								key={ index }
								className="mdc-list-item"
								role="menuitem"
							>
								<span className="mdc-list-item__text">
									{ item }
								</span>
							</li>
						) ) }
					{ children }
				</ul>
			</div>
		);
	}
);

Menu.displayName = 'Menu';

Menu.propTypes = {
	className: PropTypes.string,
	children: PropTypes.node,
	menuOpen: PropTypes.bool.isRequired,
	menuItems: PropTypes.array,
	id: PropTypes.string.isRequired,
	onSelected: PropTypes.func,
	nonInteractive: PropTypes.bool,
};

Menu.defaultProps = {
	onSelected: () => {},
	nonInteractive: false,
};

export default Menu;
