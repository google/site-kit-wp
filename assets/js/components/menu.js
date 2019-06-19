/**
 * Menu component.
 *
 * Site Kit by Google, Copyright 2019 Google LLC
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

import { MDCMenu } from 'SiteKitCore/material-components';
import PropTypes from 'prop-types';

const { Component, createRef } = wp.element;

class Menu extends Component {
	constructor( props ) {
		super( props );

		this.menuRef = createRef();
	}

	componentDidMount() {
		const { menuOpen } = this.props;

		this.menu = new MDCMenu( this.menuRef.current );
		this.menu.open = menuOpen;
		this.menu.setDefaultFocusState( 1 );
	}

	componentDidUpdate( prevProps ) {
		const { menuOpen } = this.props;

		if ( menuOpen !== prevProps.menuOpen ) {
			this.menu.open = menuOpen;
		}
	}

	render() {
		const {
			menuOpen,
			menuItems,
			onSelected,
			id,
		} = this.props;

		return (
			<div className="mdc-menu mdc-menu-surface" ref={ this.menuRef }>
				<ul id={ id } className="mdc-list" role="menu" aria-hidden={ ! menuOpen } aria-orientation="vertical" tabIndex="-1">
					{ menuItems.map( ( item, index ) => (
						<li
							key={ index }
							className="mdc-list-item"
							role="menuitem"
							onClick={ onSelected.bind( null, index ) }
							onKeyDown={ onSelected.bind( null, index ) }
						>
							<span className="mdc-list-item__text">{ item }</span>
						</li>
					) ) }
				</ul>
			</div>
		);
	}
}

Menu.propTypes = {
	menuOpen: PropTypes.bool.isRequired,
	menuItems: PropTypes.array.isRequired,
	id: PropTypes.string.isRequired,
};

export default Menu;
