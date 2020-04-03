/**
 * DashboardWinsAlerts component.
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
import { each } from 'lodash';

/**
 * WordPress dependencies
 */
import { Component, Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { addAction, removeAction } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import Notification from './notification';
import { winsNotificationsToRequest, getWinsNotifications } from './util';

class DashboardWinsAlerts extends Component {
	constructor( props ) {
		super( props );

		this.state = {
			data: false,
		};
	}

	componentWillMount() {
		// Wait until data is fully loaded before requesting wins data.
		addAction(
			'googlesitekit.dataLoaded',
			'googlesitekit.dataLoadedGetNotifications',
			() => {
				// Only handle the first completed data load.
				removeAction(
					'googlesitekit.dataLoaded',
					'googlesitekit.dataLoadedGetNotifications'
				);
				const wins = winsNotificationsToRequest();

				if ( wins ) {
					getWinsNotifications( wins ).then( ( response ) => {
						this.setState( {
							data: response.results,
						} );
					} );
				}
			}
		);
	}

	render() {
		const { data } = this.state;

		if ( 0 === Object.keys( data ).length ) {
			return null;
		}

		const notifications = [];

		Object.keys( data ).forEach( ( key ) => {
			each( data[ key ], ( notification ) => {
				notifications.push(
					<Notification
						key={ notification.id }
						id={ notification.id }
						title={ notification.title || '' }
						description={ notification.description || '' }
						blockData={ notification.blockData || [] }
						winImage={ notification.winImage || '' }
						format={ notification.format || 'small' }
						learnMoreURL={ notification.learnMoreURL || '' }
						learnMoreDescription={ notification.learnMoreDescription || '' }
						learnMoreLabel={ notification.learnMoreLabel || '' }
						ctaLink={ notification.ctaLink || '' }
						ctaLabel={ notification.ctaLabel || '' }
						type={ notification.severity || '' }
						dismiss={ notification.dismiss || __( 'OK, Got it!', 'google-site-kit' ) }
						isDismissable={ notification.isDismissable || true }
						logo={ notification.logo || false }
						pageIndex={ notification.pageIndex || '' }
						dismissExpires={ notification.dismissExpires || 0 }
						showOnce={ notification.showOnce || false }
					/>
				);
			} );
		} );
		return (
			<Fragment>
				{ notifications }
			</Fragment>
		);
	}
}

export default DashboardWinsAlerts;
