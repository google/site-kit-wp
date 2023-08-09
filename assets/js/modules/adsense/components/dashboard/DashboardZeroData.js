/**
 * AdSense Dashboard Zero Data component.
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
import { Cell, Grid, Row } from '../../../../material-components';
import SiteSteps from '../common/SiteSteps';
import useViewOnly from '../../../../hooks/useViewOnly';

/*
 * This component is essentially a reduced version of SetupSiteAdded, which
 * is displayed instead of the AdSense dashboard in case there is no data to
 * display. This special handling is necessary here because the site may not
 * be set up or ready for ads yet, and the user needs to be informed about
 * that.
 */
export default function DashboardZeroData() {
	const viewOnlyDashboard = useViewOnly();

	const description = viewOnlyDashboard
		? __( 'You don’t have any ad impressions yet.', 'google-site-kit' )
		: __(
				'You don’t have any ad impressions yet. Make sure you’ve completed these steps in AdSense:',
				'google-site-kit'
		  );
	return (
		<Grid fill>
			<Row>
				<Cell size={ 12 }>
					<h3 className="googlesitekit-heading-4 googlesitekit-setup-module__title">
						{ __( 'No ad impressions yet', 'google-site-kit' ) }
					</h3>

					<p>{ description }</p>

					{ ! viewOnlyDashboard && <SiteSteps /> }
				</Cell>
			</Row>
		</Grid>
	);
}
