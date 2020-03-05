/**
 * SetupModule component.
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
import PropTypes from 'prop-types';
import data from 'GoogleComponents/data';
import Spinner from 'GoogleComponents/spinner';
import Link from 'GoogleComponents/link';
import ModuleSettingsWarning from 'GoogleComponents/notifications/module-settings-warning';
import {
	activateOrDeactivateModule,
	refreshAuthentication,
	getReAuthURL,
	showErrorNotification,
	moduleIcon,
} from 'GoogleUtil';
import GenericError from 'GoogleComponents/notifications/generic-error';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { sprintf, __ } from '@wordpress/i18n';
import { Component } from '@wordpress/element';
import { applyFilters } from '@wordpress/hooks';

/**
 * A single module. Keeps track of its own active state and settings.
 */
class SetupModule extends Component {
	constructor( props ) {
		super( props );

		this.state = {
			isSaving: false,
			active: props.active,
		};

		this.activateOrDeactivate = this.activateOrDeactivate.bind( this );
	}

	async activateOrDeactivate() {
		try {
			const { active } = this.state;
			const { slug } = this.props;

			this.setState( { isSaving: true } );
			await activateOrDeactivateModule( data, slug, ! active );

			await refreshAuthentication();

			// Redirect to ReAuthentication URL.
			global.location = getReAuthURL( slug, true );
		} catch ( err ) {
			showErrorNotification( GenericError, {
				id: 'activate-module-error',
				title: __( 'Internal Server Error', 'google-site-kit' ),
				description: err.message,
				format: 'small',
				type: 'win-error',
			} );
			this.setState( { isSaving: false } );
		}
	}

	render() {
		const {
			isSaving,
		} = this.state;
		const {
			slug,
			name,
			description,
			showLink,
		} = this.props;

		let blockedByParentModule = false;

		const { modules } = global.googlesitekit;

		// Check if required module is active.
		if ( modules[ slug ].required.length ) {
			const requiredModules = modules[ slug ].required;

			requiredModules.forEach( ( requiredModule ) => {
				if ( ! modules[ requiredModule ].setupComplete ) {
					blockedByParentModule = true;
				}
			} );
		}

		return (
			<div
				className={ classnames(
					'googlesitekit-settings-connect-module',
					`googlesitekit-settings-connect-module--${ slug }`,
					{ 'googlesitekit-settings-connect-module--disabled': blockedByParentModule }
				) }
				key={ slug }
			>
				<div className="googlesitekit-settings-connect-module__switch">
					<Spinner isSaving={ isSaving } />
				</div>
				<div className="googlesitekit-settings-connect-module__logo">
					{ moduleIcon( slug ) }
				</div>
				<h3 className="
					googlesitekit-subheading-1
					googlesitekit-settings-connect-module__title
				">
					{ name }
				</h3>
				<p className="googlesitekit-settings-connect-module__text">
					{ description }
				</p>

				<ModuleSettingsWarning slug={ slug } context="modules-list" />

				{ applyFilters( 'googlesitekit.SetupModuleShowLink', showLink, slug ) &&
					<p className="googlesitekit-settings-connect-module__cta">
						<Link
							onClick={ this.activateOrDeactivate }
							href=""
							inherit
							disabled={ blockedByParentModule }
							arrow
						>
							{
								! blockedByParentModule ?
									sprintf( __( 'Set up %s', 'google-site-kit' ), name ) :
									sprintf( __( 'Setup Analytics to gain access to %s', 'google-site-kit' ), name )
							}
						</Link>
					</p>
				}
			</div>
		);
	}
}

SetupModule.propTypes = {
	slug: PropTypes.string,
	name: PropTypes.string,
	description: PropTypes.string,
	homepage: PropTypes.string,
	active: PropTypes.bool,
	onActive: PropTypes.func,
};

SetupModule.defaultProps = {
	slug: '',
	name: '',
	description: '',
	homepage: '',
	active: false,
};

export default SetupModule;
