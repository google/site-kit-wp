/**
 * Dashboard PageSpeed CTA component.
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
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import ActivateModuleCTA from '../../../../components/ActivateModuleCTA';
import CompleteModuleActivationCTA from '../../../../components/CompleteModuleActivationCTA';
import { CORE_MODULES } from '../../../../googlesitekit/modules/datastore/constants';
import { CORE_USER, PERMISSION_MANAGE_OPTIONS } from '../../../../googlesitekit/datastore/user/constants';
const { useSelect } = Data;

function LegacyDashboardPageSpeedCTA() {
	const pagespeedInsightsModule = useSelect( ( select ) => select( CORE_MODULES ).getModule( 'pagespeed-insights' ) );
	const canManageOptions = useSelect( ( select ) => select( CORE_USER ).hasCapability( PERMISSION_MANAGE_OPTIONS ) );

	if ( ! pagespeedInsightsModule ) {
		return null;
	}

	const { active, connected } = pagespeedInsightsModule;

	if ( ! canManageOptions || ( active && connected ) ) {
		return null;
	}

	const description = __( 'Google PageSpeed Insights gives you metrics about performance, accessibility, SEO and PWA', 'google-site-kit' );

	return (
		<div className="
			mdc-layout-grid__cell
			mdc-layout-grid__cell--span-12
		">
			{
				( ! active )
					? (
						<ActivateModuleCTA
							moduleSlug="pagespeed-insights"
							description={ description }
						/>
					)
					: (
						<CompleteModuleActivationCTA
							moduleSlug="pagespeed-insights"
							description={ description }
						/>
					)
			}
		</div>
	);
}

export default LegacyDashboardPageSpeedCTA;
