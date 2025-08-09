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
import { useEffect, useState, Fragment } from '@wordpress/element';
import { getQueryArg } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { useDispatch, useSelect } from 'googlesitekit-data';
import { ProgressBar } from 'googlesitekit-components';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import { Grid, Row, Cell } from '../../material-components';
import Header from '../Header';
import HelpMenu from '../help/HelpMenu';
import PageHeader from '../PageHeader';
import UserInputQuestionnaire from './UserInputQuestionnaire';
import Layout from '../layout/Layout';
import { getUserInputQuestions } from './util/constants';
import ProgressSegments from '../ProgressSegments';
import CheckFill from '../../../svg/icons/check-fill.svg';
import { MODULES_ANALYTICS_4 } from '../../modules/analytics-4/datastore/constants';

export default function UserInputApp() {
	const questions = getUserInputQuestions();
	const questionTitle = questions[ 0 ]?.title || '';

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

	// TODO: Also check the query param `slug` is `analytics-4`, to be on the safe side.
	const showProgress = getQueryArg( location.href, 'showProgress' );

	const accountCreated = getQueryArg( location.href, 'accountCreated' );

	const [ isAccountCreatedVisible, setIsAccountCreatedVisible ] = useState(
		!! accountCreated
	);

	const [ isSyncingAudiences, setIsSyncingAudiences ] = useState( false );

	const { syncAvailableAudiences, fetchSyncAvailableCustomDimensions } =
		useDispatch( MODULES_ANALYTICS_4 );

	useEffect( () => {
		if ( ! accountCreated ) {
			return;
		}

		setIsAccountCreatedVisible( true );
		setTimeout( () => {
			setIsAccountCreatedVisible( false );
		}, 3000 );
	}, [ accountCreated ] );

	useEffect( () => {
		setIsSyncingAudiences( true );

		const syncAudiences = async () => {
			// Sync audiences and custom dimensions, so the `PrimaryUserSetupWidget` component
			// can quickly setup audiences when the user lands on the dashboard.
			// eslint-disable-next-line no-unused-vars
			const { error: syncAudiencesError } =
				await syncAvailableAudiences();

			// FIXME: Handle errors properly.
			if ( syncAudiencesError ) {
				return { error: syncAudiencesError };
			}

			const { error: syncDimensionsError } =
				await fetchSyncAvailableCustomDimensions();

			if ( syncDimensionsError ) {
				return { error: syncDimensionsError };
			}

			setIsSyncingAudiences( false );
		};

		syncAudiences();
	}, [ fetchSyncAvailableCustomDimensions, syncAvailableAudiences ] );

	return (
		<Fragment>
			<Header>
				<HelpMenu />
			</Header>
			{ showProgress && (
				// `currentSegment` and `totalSegments` can be hardcoded, at least for phase 1, although we might want to tweak their values.
				<ProgressSegments currentSegment={ 6 } totalSegments={ 7 } />
			) }
			<div className="googlesitekit-user-input">
				<div className="googlesite-user-input__notification">
					{ isAccountCreatedVisible && (
						<div className="googlesitekit-user-input__notification-wrapper">
							<p>
								<CheckFill width={ 24 } height={ 24 } />
								<span>
									Your account has been successfully created
								</span>
							</p>
						</div>
					) }
				</div>
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
											<UserInputQuestionnaire
												isSyncingAudiences={
													isSyncingAudiences
												}
											/>
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
