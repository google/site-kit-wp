/**
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
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import { CORE_LOCATION } from '../../googlesitekit/datastore/location/constants';
import { USER_INPUT_QUESTIONS_LIST } from '../user-input/util/constants';
import { trackEvent } from '../../util';
import useViewContext from '../../hooks/useViewContext';
import SettingsKeyMetrics from './SettingsKeyMetrics';
import UserInputPreview from '../user-input/UserInputPreview';
import Layout from '../layout/Layout';
import { Grid, Cell, Row } from '../../material-components';
import Link from '../Link';

const { useSelect, useDispatch } = Data;

export default function SettingsCardKeyMetrics() {
	const viewContext = useViewContext();
	const isUserInputCompleted = useSelect( ( select ) =>
		select( CORE_USER ).isUserInputCompleted()
	);
	const userInputURL = useSelect( ( select ) =>
		select( CORE_SITE ).getAdminURL( 'googlesitekit-user-input' )
	);

	useEffect( () => {
		if ( isUserInputCompleted ) {
			trackEvent( viewContext, 'summary_view' );
		}
	}, [ isUserInputCompleted, viewContext ] );

	const { navigateTo } = useDispatch( CORE_LOCATION );
	const goTo = ( questionIndex = 1 ) => {
		const questionSlug = USER_INPUT_QUESTIONS_LIST[ questionIndex - 1 ];
		if ( questionSlug ) {
			trackEvent( viewContext, 'question_edit', questionSlug );

			navigateTo(
				addQueryArgs( userInputURL, {
					question: questionSlug,
					redirect_url: global.location.href,
					single: 'settings', // Allows the user to edit a single question then return to the settings page.
				} )
			);
		}
	};

	const hasUserPickedMetrics = useSelect( ( select ) =>
		select( CORE_USER ).getUserPickedMetrics()
	);

	const ctaLabel = !! hasUserPickedMetrics?.length
		? __( 'Set your site goals', 'google-site-kit' )
		: __( 'Personalize your metrics', 'google-site-kit' );

	return (
		<Layout title={ __( 'Key metrics', 'google-site-kit' ) } header rounded>
			<div className="googlesitekit-settings-module googlesitekit-settings-module--active googlesitekit-settings-user-input">
				<SettingsKeyMetrics />

				<Grid>
					{ isUserInputCompleted && (
						<Row>
							<Cell size={ 12 }>
								<UserInputPreview
									goTo={ goTo }
									noHeader
									noFooter
									settingsView
									showIndividualCTAs
								/>
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
						</Row>
					) }
				</Grid>
			</div>
		</Layout>
	);
}
