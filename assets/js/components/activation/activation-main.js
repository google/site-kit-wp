/**
 * Activation Main component.
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
import { Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import PropTypes from 'prop-types';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { Grid, Row, Cell } from '../../material-components';
import { useFeature } from '../../hooks/useFeature';
import { CORE_MODULES } from '../../googlesitekit/modules/datastore/constants';
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import {
	CORE_USER,
	PERMISSION_VIEW_DASHBOARD,
} from '../../googlesitekit/datastore/user/constants';
import Button from '../Button';
import Logo from '../Logo';
import OptIn from '../OptIn';
import CompatibilityChecks from '../setup/CompatibilityChecks';
import ActivateAnalyticsNotice from '../setup/ActivateAnalyticsNotice';
const { useSelect } = Data;
export function ActivationMain( { buttonURL, onButtonClick, buttonLabel } ) {
	const serviceSetupV2Enabled = useFeature( 'serviceSetupV2' );

	const isUsingProxy = useSelect( ( select ) =>
		select( CORE_SITE ).isUsingProxy()
	);
	const canViewDashboard = useSelect( ( select ) =>
		select( CORE_USER ).hasCapability( PERMISSION_VIEW_DASHBOARD )
	);
	const analyticsModuleActive = useSelect( ( select ) =>
		select( CORE_MODULES ).isModuleActive( 'analytics' )
	);

	return (
		<Grid>
			<Row>
				<Cell size={ 12 }>
					<Logo />

					<h3 className="googlesitekit-heading-3 googlesitekit-activation__title">
						{ __(
							'Congratulations, the Site Kit plugin is now activated.',
							'google-site-kit'
						) }
					</h3>

					{ serviceSetupV2Enabled &&
						isUsingProxy &&
						! canViewDashboard &&
						! analyticsModuleActive && <ActivateAnalyticsNotice /> }

					<CompatibilityChecks>
						{ ( { complete, inProgressFeedback, ctaFeedback } ) => (
							<Fragment>
								{ ctaFeedback }

								<OptIn />

								<div className="googlesitekit-start-setup-wrap">
									<Button
										id="start-setup-link"
										className="googlesitekit-start-setup"
										href={ buttonURL }
										onClick={ onButtonClick }
										disabled={ ! complete }
									>
										{ buttonLabel }
									</Button>
									{ inProgressFeedback }
								</div>
							</Fragment>
						) }
					</CompatibilityChecks>
				</Cell>
			</Row>
		</Grid>
	);
}

ActivationMain.propTypes = {
	buttonURL: PropTypes.string.isRequired,
	onButtonClick: PropTypes.func,
	buttonLabel: PropTypes.string.isRequired,
};
