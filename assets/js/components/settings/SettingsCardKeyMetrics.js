/**
 * SettingsCardKeyMetrics component.
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
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import { DAY_IN_SECONDS, trackEvent } from '../../util';
import useViewContext from '../../hooks/useViewContext';
import { useInView } from '../../hooks/useInView';
import SettingsKeyMetrics from './SettingsKeyMetrics';
import UserInputPreview from '../user-input/UserInputPreview';
import Layout from '../layout/Layout';
import { Grid, Cell, Row } from '../../material-components';
import Link from '../Link';
import SurveyViewTrigger from '../surveys/SurveyViewTrigger';

const { useSelect } = Data;

export default function SettingsCardKeyMetrics() {
	const viewContext = useViewContext();
	const inView = useInView();
	const isUserInputCompleted = useSelect( ( select ) =>
		select( CORE_USER ).isUserInputCompleted()
	);
	const userInputURL = useSelect( ( select ) =>
		select( CORE_SITE ).getAdminURL( 'googlesitekit-user-input' )
	);

	const gaEventCategory = `${ viewContext }_kmw`;

	useEffect( () => {
		if ( isUserInputCompleted ) {
			trackEvent( gaEventCategory, 'summary_view' );
		}
	}, [ isUserInputCompleted, gaEventCategory ] );

	const hasUserPickedMetrics = useSelect( ( select ) =>
		select( CORE_USER ).getUserPickedMetrics()
	);

	const ctaLabel = !! hasUserPickedMetrics?.length
		? __( 'Set your site goals', 'google-site-kit' )
		: __( 'Personalize your metrics', 'google-site-kit' );

	return (
		<Layout title={ __( 'Key Metrics', 'google-site-kit' ) } header rounded>
			<div className="googlesitekit-settings-module googlesitekit-settings-module--active googlesitekit-settings-user-input">
				<SettingsKeyMetrics />

				<Grid>
					{ isUserInputCompleted && (
						<Row>
							<Cell size={ 12 }>
								<UserInputPreview settingsView />
							</Cell>
						</Row>
					) }

					{ isUserInputCompleted === false && (
						<Row>
							<Cell
								className="googlesitekit-user-input__notification"
								size={ 12 }
							>
								<p>
									<span>
										{ __(
											'Answer 3 quick questions to help us show the most relevant data for your site',
											'google-site-kit'
										) }
									</span>
								</p>

								<Link href={ userInputURL }>{ ctaLabel }</Link>
							</Cell>
							{ inView && (
								<SurveyViewTrigger
									triggerID="view_kmw_setup_cta"
									ttl={ DAY_IN_SECONDS }
								/>
							) }
						</Row>
					) }
				</Grid>
			</div>
		</Layout>
	);
}
