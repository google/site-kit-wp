/**
 * OptIn component.
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
import Checkbox from 'GoogleComponents/checkbox';
import PropTypes from 'prop-types';
import { getMetaKeyForUserOption } from 'GoogleUtil';
import classnames from 'classnames';
/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { Component } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import {
	isTrackingEnabled,
	toggleTracking,
	trackEvent,
} from '../util/tracking';

class OptIn extends Component {
	constructor( props ) {
		super( props );

		this.state = {
			optIn: isTrackingEnabled(),
			error: false,
		};

		this.handleOptIn = this.handleOptIn.bind( this );
	}

	handleOptIn( e ) {
		const checked = !! e.target.checked;
		const trackingUserOptInKey = getMetaKeyForUserOption( 'googlesitekit_tracking_optin' );

		toggleTracking( checked );

		if ( checked ) {
			trackEvent( 'tracking_plguin', this.props.optinAction );
		}

		apiFetch( {
			path: '/wp/v2/users/me',
			method: 'POST',
			data: {
				meta: {
					[ trackingUserOptInKey ]: checked,
				},
			},
		} )
			.then( () => {
				this.setState( {
					optIn: checked,
					error: false,
				} );
			} )
			.catch( ( err ) => {
				this.setState( {
					optIn: ! checked,
					error: {
						errorCode: err.code,
						errorMsg: err.message,
					},
				} );
			} );
	}

	render() {
		const {
			optIn,
			error,
		} = this.state;

		const {
			id,
			name,
			className,
		} = this.props;

		return (
			<div className={ classnames(
				'googlesitekit-opt-in',
				className
			) }>
				<Checkbox
					id={ id }
					name={ name }
					value="1"
					checked={ optIn }
					onChange={ this.handleOptIn }
				>
					{ __( 'Help us improve the Site Kit plugin by allowing tracking of anonymous usage stats. All data are treated in accordance with ', 'google-site-kit' ) }
					<a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">{ __( 'Google Privacy Policy', 'google-site-kit' ) }</a>.
				</Checkbox>
				{ error &&
				<div className="googlesitekit-error-text">
					{ error.errorMsg }
				</div>
				}
			</div>
		);
	}
}

OptIn.propTypes = {
	id: PropTypes.string,
	name: PropTypes.string,
	className: PropTypes.string,
	optinAction: PropTypes.string,
};

OptIn.defaultProps = {
	id: 'googlesitekit-opt-in',
	name: 'optIn',
};

export default OptIn;
