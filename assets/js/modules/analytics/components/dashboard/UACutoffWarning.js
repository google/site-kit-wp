/**
 * UACutoffWarning component.
 *
 * Site Kit by Google, Copyright 2023 Google LLC
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

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { CORE_MODULES } from '../../../../googlesitekit/modules/datastore/constants';
import { CORE_SITE } from '../../../../googlesitekit/datastore/site/constants';
import { CORE_USER } from '../../../../googlesitekit/datastore/user/constants';
import { UA_CUTOFF_DATE } from '../../constants';
import { stringToDate } from '../../../../util';
import { Grid, Row, Cell } from '../../../../material-components/layout';
import { Button } from 'googlesitekit-components';
import Link from '../../../../components/Link';
import SettingsNotice, {
	TYPE_WARNING,
} from '../../../../components/SettingsNotice';
import { useFeature } from '../../../../hooks/useFeature';
const { useSelect } = Data;

export default function UACutoffWarning( { className } ) {
	const ga4ReportingEnabled = useFeature( 'ga4Reporting' );

	const isAnalyticsConnected = useSelect( ( select ) =>
		select( CORE_MODULES ).isModuleConnected( 'analytics' )
	);

	const isGA4Connected = useSelect( ( select ) =>
		select( CORE_MODULES ).isModuleConnected( 'analytics-4' )
	);

	const referenceDate = useSelect( ( select ) =>
		select( CORE_USER ).getReferenceDate()
	);

	const documentationURL = useSelect( ( select ) => {
		return select( CORE_SITE ).getDocumentationLinkURL( 'ga4' );
	} );

	const shouldDisplayWarning =
		ga4ReportingEnabled &&
		isAnalyticsConnected &&
		! isGA4Connected &&
		stringToDate( referenceDate ) >= stringToDate( UA_CUTOFF_DATE );

	if ( ! shouldDisplayWarning ) {
		return null;
	}

	return (
		<Grid className={ className }>
			<Row>
				<Cell size={ 12 }>
					<SettingsNotice
						className="googlesitekit-settings-notice-ua-cutoff-warning"
						type={ TYPE_WARNING }
						CTA={ () => (
							<Button danger>
								{ __(
									'Set up Google Analytics 4',
									'google-site-kit'
								) }
							</Button>
						) }
						notice={
							<Fragment>
								<p className="googlesitekit-settings-notice-ua-cutoff-warning__notice">
									{ __(
										'Your data is stale because Universal Analytics stopped collecting data on July 1, 2023.',
										'google-site-kit'
									) }
								</p>
								<Link
									aria-label={ __(
										'Learn more',
										'google-site-kit'
									) }
									href={ documentationURL }
									external
								>
									{ __( 'Learn more', 'google-site-kit' ) }
								</Link>
							</Fragment>
						}
					/>
				</Cell>
			</Row>
		</Grid>
	);
}

UACutoffWarning.propTypes = {
	className: PropTypes.string,
};
