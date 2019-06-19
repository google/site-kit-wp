/**
 * UserMenu component.
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
import Dialog from 'GoogleComponents/dialog';
import Button from 'GoogleComponents/button';
import Menu from 'GoogleComponents/menu';
import { clearAppLocalStorage } from 'GoogleUtil';
import data from 'GoogleComponents/data';

const { Component, Fragment, createRef } = wp.element;
const { __ } = wp.i18n;
const { addQueryArgs } = wp.url;

class UserMenu extends Component {

	constructor( props ) {
		super( props );

		this.state = {
			dialogActive: false,
			menuOpen: false,
		};

		this.handleMenu = this.handleMenu.bind( this );
		this.handleMenuClose = this.handleMenuClose.bind( this );
		this.handleMenuItemSelect = this.handleMenuItemSelect.bind( this );
		this.handleDialog = this.handleDialog.bind( this );
		this.handleDialogClose = this.handleDialogClose.bind( this );
		this.handleUnlinkConfirm = this.handleUnlinkConfirm.bind( this );

		this.menuButtonRef = createRef();
		this.menuRef = createRef();
	}

	componentDidMount() {
		window.addEventListener( 'mouseup', this.handleMenuClose );
		window.addEventListener( 'keyup', this.handleMenuClose );
		window.addEventListener( 'keyup', this.handleDialogClose );
	}

	componentWillUnmount() {
		window.removeEventListener( 'mouseup', this.handleMenuClose );
		window.removeEventListener( 'keyup', this.handleMenuClose );
		window.removeEventListener( 'keyup', this.handleDialogClose );
	}

	handleMenu() {
		const { menuOpen } = this.state;
		this.setState( {
			menuOpen: ! menuOpen,
		} );
	}

	handleMenuClose( e ) {
		if (
			( ( 'keyup' === e.type && 27 === e.keyCode ) || 'mouseup' === e.type ) &&
			! this.menuButtonRef.current.buttonRef.current.contains( e.target ) &&
			! this.menuRef.current.menuRef.current.contains( e.target )
		) {
			this.setState( { menuOpen: false } );
		}
	}

	handleMenuItemSelect( index, e ) {
		if (
			( ( 'keydown' === e.type && (
				13 === e.keyCode || // Enter
				32 === e.keyCode // Space
			) ) ||
				'click' === e.type // Mouse
			) ) {

			switch ( index ) {
					case 0:
						this.handleDialog();
						break;
					default:
						this.handleMenu();
			}
		}
	}

	handleDialog() {
		this.setState( prevState => {
			return {
				dialogActive: ! prevState.dialogActive,
				menuOpen: false,
			};
		} );
	}

	handleDialogClose( e ) {
		if ( 27 === e.keyCode ) {
			this.setState( {
				dialogActive: false,
				menuOpen: false,
			} );
		}
	}

	// Log the user out if they confirm the dialog.
	async handleUnlinkConfirm() {

		// Disconnect the user.
		await data.set( 'core', 'user', 'disconnect' );

		// Close the modal.
		this.setState( {
			dialogActive: false,
		} );

		// Clear caches.
		clearAppLocalStorage();

		// Return to the Site Kit Dashboard.
		const { adminRoot } = googlesitekit.admin;

		document.location = addQueryArgs( adminRoot.replace( 'admin.php', '' ),
			{
				'notification': 'googlesitekit_user_disconnected'
			} );
	}

	render() {
		const { userData: { email = '', picture = '' } } = googlesitekit.admin;
		const { dialogActive, menuOpen } = this.state;

		return (
			<Fragment>
				<div className="googlesitekit-dropdown-menu mdc-menu-surface--anchor">
					<Button
						ref={ this.menuButtonRef }
						className="googlesitekit-header__dropdown mdc-button--dropdown"
						text
						onClick={ this.handleMenu }
						icon={ picture ?
							<i className="mdc-button__icon" aria-hidden="true"><img className="mdc-button__icon--image" src={ picture } alt={ __( 'User Avatar', 'google-site-kit' ) }/></i> :
							undefined
						}
						ariaHaspopup="menu"
						ariaExpanded={ menuOpen }
						ariaControls="user-menu"
					>
						{ email }
					</Button>
					<Menu
						ref={ this.menuRef }
						menuOpen={ menuOpen }
						menuItems={ [ __( 'Disconnect', 'google-site-kit' ) ] }
						onSelected={ this.handleMenuItemSelect }
						id="user-menu"/>
				</div>
				<Dialog
					dialogActive={ dialogActive }
					handleConfirm={ this.handleUnlinkConfirm }
					handleDialog={ this.handleDialog }
					title={ __( 'Disconnect', 'google-site-kit' ) }
					subtitle={ __( 'Disconnecting Site Kit by Google will remove your access to all services. After disconnecting, you will need to re-authorize to restore service.', 'google-site-kit' ) }
					confirmButton={ __( 'Disconnect', 'google-site-kit' ) }
					provides={ [] }
				/>
			</Fragment>

		);
	}
}

export default UserMenu;
