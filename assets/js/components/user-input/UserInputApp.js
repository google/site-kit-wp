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
import { sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useSelect } from 'googlesitekit-data';
import { ProgressBar } from 'googlesitekit-components';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import { Grid, Row, Cell } from '../../material-components';
import Header from '../Header';
import HelpMenu from '../help/HelpMenu';
import PageHeader from '../PageHeader';
import UserInputQuestionnaire from './UserInputQuestionnaire';
import Layout from '../layout/Layout';
import {
	FORM_USER_INPUT_QUESTION_NUMBER,
	getUserInputQuestions,
} from './util/constants';
import { CORE_FORMS } from '../../googlesitekit/datastore/forms/constants';

export default function UserInputApp() {
	const questionNumber =
		useSelect( ( select ) =>
			select( CORE_FORMS ).getValue(
				FORM_USER_INPUT_QUESTION_NUMBER,
				'questionNumber'
			)
		) || 1;

	const questions = getUserInputQuestions();
	const questionTitle = questions[ questionNumber - 1 ]?.title || '';

	const hasFinishedGettingInputSettings = useSelect( ( select ) => {
		// This needs to be called here to check on its resolution,
		// as it's called/used by child components of this component,
		// but we need to call it here to know if it's resolving.
		//
		// This is sort of a select side-effect, but it's necessary here.
		select( CORE_USER ).getUserInputSettings();

		return select( CORE_USER ).hasFinishedResolution(
			'getUserInputSettings'
		);
	} );

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
						<Grid>
							<Layout rounded>
								<Grid className="googlesitekit-user-input__header">
									<Row>
										<Cell
											size={ 12 }
											className="googlesitekit-user-input__question-number"
										>
											{ sprintf(
												'%d / 3',
												questionNumber
											) }
										</Cell>
									</Row>

									<Row>
										<Cell lgSize={ 12 }>
											<PageHeader
												className="googlesitekit-heading-3 googlesitekit-user-input__heading"
												title={ questionTitle }
												fullWidth
											/>
										</Cell>
									</Row>
								</Grid>

								<Grid className="googlesitekit-user-input__content">
									<Row>
										<Cell
											lgSize={ 12 }
											mdSize={ 8 }
											smSize={ 4 }
										>
											<UserInputQuestionnaire />
										</Cell>
									</Row>
								</Grid>
							</Layout>
						</Grid>
					) }
				</div>
			</div>
		</Fragment>
	);
}
