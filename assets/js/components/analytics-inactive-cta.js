/**
 * AnalyticsInactiveCTA component.
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
import {
	activateOrDeactivateModule,
	refreshAuthentication,
	getReAuthURL,
	showErrorNotification,
} from 'GoogleUtil';
import data from 'GoogleComponents/data';
import CTA from 'GoogleComponents/notifications/cta';
import PropTypes from 'prop-types';
import GenericError from 'GoogleComponents/notifications/generic-error';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

class AnalyticsInactiveCTA extends Component {
	static async setupAnalyticsClick() {
		try {
			await activateOrDeactivateModule( data, 'analytics', true );

			await refreshAuthentication();

			// Redirect to ReAuthentication URL
			global.location = getReAuthURL( 'analytics', true );
		} catch ( err ) {
			showErrorNotification( GenericError, {
				id: 'analytics-setup-error',
				title: __( 'Internal Server Error', 'google-site-kit' ),
				description: err.message,
				format: 'small',
				type: 'win-error',
			} );
		}
	}

	render() {
		const {
			title,
			description,
			ctaLabel,
		} = this.props;

		const { canManageOptions } = global.googlesitekit.permissions;

		if ( ! canManageOptions ) {
			return null;
		}

		return (
			<CTA
				title={ title }
				description={ description }
				onClick={ AnalyticsInactiveCTA.setupAnalyticsClick }
				ctaLabel={ ctaLabel }
			/>
		);
	}
}

AnalyticsInactiveCTA.propTypes = {
	title: PropTypes.string,
	description: PropTypes.string,
	ctaLabel: PropTypes.string,
};

AnalyticsInactiveCTA.defaultProps = {
	title: __( 'Learn more about what visitors do on your site.', 'google-site-kit' ),
	description: __( 'Connecting with Google Analytics to see unique vistors, goal completions, top pages and more.', 'google-site-kit' ),
	ctaLabel: __( 'Set up Analytics', 'google-site-kit' ),
};

export default AnalyticsInactiveCTA;
