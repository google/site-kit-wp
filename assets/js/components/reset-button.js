/**
 * ResetButton component.
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

/**
 * External dependencies
 */
import data, { TYPE_CORE } from 'GoogleComponents/data';
import {
	clearWebStorage,
} from 'GoogleUtil';
import Dialog from 'GoogleComponents/dialog';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component, Fragment } from '@wordpress/element';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import Link from './link';
import Modal from './modal';

export default class ResetButton extends Component {
	constructor( props ) {
		super( props );
		const { splashURL } = global._googlesitekitBaseData;

		this.state = {
			dialogActive: false,
			postResetURL: addQueryArgs( splashURL, { notification: 'reset_success' } ),
		};

		this.handleDialog = this.handleDialog.bind( this );
		this.handleUnlinkConfirm = this.handleUnlinkConfirm.bind( this );
		this.handleCloseModal = this.handleCloseModal.bind( this );
	}

	componentDidMount() {
		global.addEventListener( 'keyup', this.handleCloseModal, false );
	}

	componentWillUnmount() {
		global.removeEventListener( 'keyup', this.handleCloseModal );
	}

	async handleUnlinkConfirm() {
		await data.set( TYPE_CORE, 'site', 'reset' );
		clearWebStorage();
		this.handleDialog();
		document.location = this.state.postResetURL;
	}

	handleCloseModal( e ) {
		if ( 27 === e.keyCode ) {
			this.setState( {
				dialogActive: false,
			} );
		}
	}

	handleDialog() {
		this.setState( ( prevState ) => {
			return {
				dialogActive: ! prevState.dialogActive,
			};
		} );
	}

	render() {
		const {
			children,
		} = this.props;
		const {
			dialogActive,
		} = this.state;

		return (
			<Fragment>
				<Link
					className="googlesitekit-reset-button"
					onClick={ () => this.setState( { dialogActive: true } ) }
					inherit
				>
					{ children || __( 'Reset Site Kit', 'google-site-kit' ) }
				</Link>
				<Modal>
					<Dialog
						dialogActive={ dialogActive }
						handleConfirm={ this.handleUnlinkConfirm }
						handleDialog={ this.handleDialog }
						title={ __( 'Reset Site Kit', 'google-site-kit' ) }
						subtitle={ __( 'Resetting this site will remove access to all services. After disconnecting, you will need to re-authorize your access to restore service.', 'google-site-kit' ) }
						confirmButton={ __( 'Reset', 'google-site-kit' ) }
						provides={ [] }
					/>
				</Modal>
			</Fragment>
		);
	}
}
