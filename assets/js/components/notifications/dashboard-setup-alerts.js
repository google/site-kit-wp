/**
 * DashboardSetupAlerts component.
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
import { getQueryParameter } from 'GoogleUtil';

/**
 * WordPress dependencies
 */
import { Component, Fragment } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { applyFilters } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import Notification from './notification';
import ModulesList from '../modules-list';

class DashboardSetupAlerts extends Component {
	render() {
		// Only show the connected win when the user completes setup flow.
		const notification = getQueryParameter( 'notification' );
		if ( ( ! notification ) || '' === notification ) {
			return null;
		}

		let winData = {
			id: 'connected-successfully',
			setupTitle: __( 'Site Kit', 'google-site-kit' ),
			description: __( 'Now you’ll be able to see how your site is doing in search. To get even more detailed stats, activate more modules. Here are our recommendations for what to include in your Site Kit:', 'google-site-kit' ),
			learnMore: {
				label: '',
				url: '',
				description: '',
			},
		};

		const { canManageOptions } = global.googlesitekit.permissions;

		switch ( notification ) {
			case 'authentication_success':
				if ( ! canManageOptions ) {
					return null;
				}

				const slug = getQueryParameter( 'slug' );

				if ( slug && global.googlesitekit.modules[ slug ] && ! global.googlesitekit.modules[ slug ].active ) {
					return null;
				}

				if ( slug && global.googlesitekit.modules[ slug ] ) {
					winData.id = `${ winData.id }-${ slug }`;
					winData.setupTitle = global.googlesitekit.modules[ slug ].name;
					winData.description = __( 'Here are some other services you can connect to see even more stats:', 'google-site-kit' );

					winData = applyFilters( ` global.googlesitekit.SetupWinNotification-${ slug }`, winData );
				}

				return (
					<Fragment>
						<Notification
							id={ winData.id }
							/* translators: %s: the name of a module that setup was completed for */
							title={ sprintf( __( 'Congrats on completing the setup for %s!', 'google-site-kit' ), winData.setupTitle ) }
							description={ winData.description }
							handleDismiss={ () => {} }
							winImage={ global.googlesitekit.admin.assetsRoot + 'images/rocket.png' }
							dismiss={ __( 'OK, Got it!', 'google-site-kit' ) }
							format="large"
							type="win-success"
							learnMoreLabel={ winData.learnMore.label }
							learnMoreDescription={ winData.learnMore.description }
							learnMoreURL={ winData.learnMore.url }
						>
							<ModulesList />
						</Notification>
					</Fragment>
				);

			case 'authentication_failure':
				return (
					<Fragment>
						<Notification
							id="connection error"
							title={ __( 'There was a problem connecting to Google!', 'google-site-kit' ) }
							description={ '' }
							handleDismiss={ () => {} }
							format="small"
							type="win-error"
						/>

					</Fragment>
				);
		}
	}
}

export default DashboardSetupAlerts;
