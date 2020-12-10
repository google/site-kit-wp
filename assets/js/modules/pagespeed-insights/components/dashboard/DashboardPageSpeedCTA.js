/**
 * Dashboard PageSpeed CTA component.
 *
 * Site Kit by Google, Copyright 2020 Google LLC
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
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import {
	activateOrDeactivateModule,
	getReAuthURL,
	showErrorNotification,
} from '../../../../util';
import CTA from '../../../../components/legacy-notifications/cta';
import data from '../../../../components/data';
import GenericError from '../../../../components/legacy-notifications/generic-error';
import { STORE_NAME as MODULES_STORE } from '../../../../googlesitekit/modules/datastore/constants';
import { STORE_NAME as USER_STORE, PERMISSION_MANAGE_OPTIONS } from '../../../../googlesitekit/datastore/user/constants';
const { useSelect } = Data;

function DashboardPageSpeedCTA() {
	const pagespeedInsightsModule = useSelect( ( select ) => select( MODULES_STORE ).getModule( 'pagespeed-insights' ) );
	const canManageOptions = useSelect( ( select ) => select( USER_STORE ).hasCapability( PERMISSION_MANAGE_OPTIONS ) );

	if ( ! pagespeedInsightsModule ) {
		return null;
	}

	const { active, connected } = pagespeedInsightsModule;

	if ( ! canManageOptions || ( active && connected ) ) {
		return null;
	}

	const handleSetUpClick = async () => {
		try {
			await activateOrDeactivateModule( data, 'pagespeed-insights', true );
			global.location = getReAuthURL( 'pagespeed-insights' );
		} catch ( err ) {
			showErrorNotification( GenericError, {
				id: 'pagespeed-insights-setup-error',
				title: __( 'Internal Server Error', 'google-site-kit' ),
				description: err.message,
				format: 'small',
				type: 'win-error',
			} );
		}
	};

	return (
		<div className="
			mdc-layout-grid__cell
			mdc-layout-grid__cell--span-12
		">
			<CTA
				title={ ! connected && active
					? __( 'Complete PageSpeed Insights activation.', 'google-site-kit' )
					: __( 'Activate PageSpeed Insights.', 'google-site-kit' )
				}
				description={ __( 'Google PageSpeed Insights gives you metrics about performance, accessibility, SEO and PWA.', 'google-site-kit' ) }
				ctaLink={ '#' }
				ctaLabel={ ! connected && active
					? __( 'Complete activation', 'google-site-kit' )
					: __( 'Activate PageSpeed Insights', 'google-site-kit' )
				}
				onClick={ handleSetUpClick }
			/>
		</div>
	);
}

export default DashboardPageSpeedCTA;
