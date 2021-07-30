/**
 * User Input App.
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
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import { useFeature } from '../../hooks/useFeature';
import { Grid, Row, Cell } from '../../material-components';
import Header from '../Header';
import HelpMenu from '../help/HelpMenu';
import PageHeader from '../PageHeader';
import ProgressBar from '../ProgressBar';
import UserInputQuestionnaire from './UserInputQuestionnaire';
const { useSelect } = Data;

export default function UserInputApp() {
	const userInputEnabled = useFeature( 'userInput' );
	const { hasFinishedGettingInputSettings } = useSelect( ( select ) => ( {
		userInputSettings: select( CORE_USER ).getUserInputSettings(), // This will be used in the children components.
		hasFinishedGettingInputSettings: select( CORE_USER ).hasFinishedResolution( 'getUserInputSettings' ),
	} ) );

	if ( ! userInputEnabled ) {
		return <div>{ __( 'Something went wrong.', 'google-site-kit' ) }</div>;
	}

	return (
		<Fragment>
			<Header>
				 <HelpMenu />
			</Header>
			<div className="googlesitekit-user-input">
				<div className="googlesitekit-module-page">
					{ ! hasFinishedGettingInputSettings && (
						<Grid>
							<Row>
								<Cell lgSize={ 12 } mdSize={ 8 } smSize={ 4 }>
									<ProgressBar />
								</Cell>
							</Row>
						</Grid>
					) }
					{ hasFinishedGettingInputSettings && (
						<Fragment>
							<Grid className="googlesitekit-user-input__header">
								<Row>
									<Cell lgSize={ 6 } mdSize={ 8 } smSize={ 4 }>
										<PageHeader
											className="googlesitekit-heading-2 googlesitekit-user-input__heading"
											title={ __( 'Customize Site Kit to match your goals', 'google-site-kit' ) }
											fullWidth
										/>
									</Cell>
									<Cell lgSize={ 6 } mdSize={ 8 } smSize={ 4 }>
										<span className="googlesitekit-user-input__subtitle">
											{ __( 'Get metrics and suggestions that are specific to your site by telling Site Kit more about your site', 'google-site-kit' ) }
										</span>
									</Cell>
								</Row>
							</Grid>

							<Grid className="googlesitekit-user-input__content">
								<Row>
									<Cell lgSize={ 12 } mdSize={ 8 } smSize={ 4 }>
										<UserInputQuestionnaire />
									</Cell>
								</Row>
							</Grid>
						</Fragment>
					) }
				</div>
			</div>
		</Fragment>
	);
}
