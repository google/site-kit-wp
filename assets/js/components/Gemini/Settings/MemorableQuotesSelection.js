/**
 * Site Kit by Google, Copyright 2024 Google LLC
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
import { cloneDeep } from 'lodash';

/**
 * WordPress dependencies
 */
import { Fragment, useState, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import { useDispatch, useSelect } from 'googlesitekit-data';
import { Checkbox, SpinnerButton } from 'googlesitekit-components';
import { CORE_SITE } from '../../../googlesitekit/datastore/site/constants';
import Portal from '../../Portal';
import ModalDialog from '../../ModalDialog';
import PreviewBlock from '../../PreviewBlock';
import LoadingWrapper from '../../LoadingWrapper';

export default function MemorableQuotesSelection( { loading } ) {
	const [ posts, setPosts ] = useState( [] );
	const [ dialogActive, setDialogActive ] = useState( false );

	const isMemorableQuotesEnabled = useSelect( ( select ) =>
		select( CORE_SITE ).isMemorableQuotesEnabled()
	);

	useEffect( () => {
		apiFetch( {
			path: 'wp/v2/posts?per_page=10',
		} ).then( ( wpPosts ) => {
			setPosts( wpPosts );
		} );
	}, [] );

	// Selected Posts.
	const memorableQuotesPosts =
		useSelect( ( select ) =>
			select( CORE_SITE ).getMemorableQuotesPosts()
		) || [];

	const {
		setMemorableQuotesPosts,
		generateQuotes,
		setMemorableQuotes,
		saveGeminiSettings,
		setMemorableQuotesAutoPublish,
	} = useDispatch( CORE_SITE );

	const handlePostChange = ( event ) => {
		if ( event.currentTarget.checked ) {
			setMemorableQuotesPosts( [
				...memorableQuotesPosts,
				Number( event.target.value ),
			] );
		} else {
			setMemorableQuotesPosts(
				memorableQuotesPosts.filter(
					( post ) => post !== Number( event.target.value )
				)
			);
		}
	};

	const generatingQuotes = useSelect( ( select ) =>
		select( CORE_SITE ).isGeneratingQuotes()
	);

	// Generated Quotes.
	const memorableQuotes = useSelect( ( select ) =>
		select( CORE_SITE ).getMemorableQuotes()
	);

	const handleQuoteChange = ( event ) => {
		const quoteID = event.target.value;

		const mutatedMemorableQuotes = cloneDeep( memorableQuotes );
		mutatedMemorableQuotes[ quoteID ].published = !! event.target.checked;
		setMemorableQuotes( mutatedMemorableQuotes );
	};

	const saveQuotes = () => {
		// Save quotes using module settings store.
		saveGeminiSettings();

		// Show modal to tell user to add shortcode to page.
		setDialogActive( true );
	};

	const savingQuotes = useSelect( ( select ) => {
		const { hasFinishedResolution, isResolving } = select( CORE_SITE );

		return (
			! hasFinishedResolution( 'getMemorableQuotes' ) &&
			isResolving( 'getMemorableQuotes' )
		);
	} );

	const uniquePosts = memorableQuotes?.reduce( ( acc, { postID } ) => {
		if ( ! acc.includes( postID ) ) {
			acc.push( postID );
		}
		return acc;
	}, [] );

	const showQuotesSelector = memorableQuotes && ! generatingQuotes && posts;

	const hasPublishableQuotes = memorableQuotes?.some(
		( quote ) => quote.published
	);

	// Auto Publish.
	const shouldAutoPublishMemorableQuotes =
		useSelect( ( select ) =>
			select( CORE_SITE ).shouldAutoPublishMemorableQuotes()
		) || false;

	if ( ! isMemorableQuotesEnabled ) {
		return null;
	}

	return (
		<Fragment>
			<LoadingWrapper loading={ loading } width="200px" height="200px">
				<div className="googlesitekit-settings-gemini__memorable-quotes">
					<div className="googlesitekit-settings-gemini__columns">
						<div className="googlesitekit-settings-gemini__select">
							<div className="googlesitekit-settings-gemini__header">
								<h4 className="googlesitekit-settings-module__fields-group-title">
									Select Posts
								</h4>
								<em className="googlesitekit-settings-gemini__description">
									Select posts to generate memorable quotes
								</em>
							</div>
							<div className="googlesitekit-settings-gemini__list">
								{ ! posts?.length && (
									<Fragment>
										<PreviewBlock
											width="100%"
											height="52px"
											padding="12px"
										/>
										<PreviewBlock
											width="100%"
											height="52px"
											padding="12px"
										/>
										<PreviewBlock
											width="100%"
											height="52px"
											padding="12px"
										/>
									</Fragment>
								) }
								{ posts?.length > 0 &&
									posts?.map( ( { id, title } ) => (
										<div
											key={ id }
											className="googlesitekit-settings-gemini__post"
										>
											<Checkbox
												id={ `post-${ id }` }
												value={ String( id ) }
												checked={ memorableQuotesPosts.includes(
													id
												) }
												onChange={ handlePostChange }
											>
												{ title?.rendered }
											</Checkbox>
										</div>
									) ) }
							</div>

							<div className="googlesitekit-settings-gemini__submit">
								<SpinnerButton
									onClick={ generateQuotes }
									isSaving={ generatingQuotes }
									disabled={
										! memorableQuotesPosts.length ||
										generatingQuotes
									}
								>
									Generate Quotes
								</SpinnerButton>
							</div>
						</div>
						<div className="googlesitekit-settings-gemini__results">
							<div className="googlesitekit-settings-gemini__results-header">
								<h4 className="googlesitekit-settings-module__fields-group-title">
									Choose Quotes
								</h4>
								<em className="googlesitekit-settings-gemini__description">
									Choose quotes to show in the memorable
									quotes block
								</em>
							</div>
							<div className="googlesitekit-settings-gemini__list">
								{ ! showQuotesSelector && (
									<div className="googlesitekit-settings-gemini__no-quotes">
										{ generatingQuotes
											? 'Generating Quotes...'
											: 'Select posts to generate quotes' }
									</div>
								) }
								{ showQuotesSelector &&
									uniquePosts.map( ( postID ) => (
										<div
											key={ postID }
											className="googlesitekit-settings-gemini__group"
										>
											<h5 className="googlesitekit-settings-gemini__post">
												{ posts.find(
													( { id } ) =>
														id === Number( postID )
												)?.title?.rendered || '' }
											</h5>
											<div className="googlesitekit-settings-gemini__quotes">
												{ memorableQuotes
													?.filter(
														( quote ) =>
															quote.postID ===
															postID
													)
													.map(
														( {
															id,
															quote,
															author,
															published,
														} ) => (
															<div
																key={ id }
																className="googlesitekit-settings-gemini__quote"
																data-postid={
																	postID
																}
															>
																<Checkbox
																	id={ `quote-${ id }` }
																	value={ id }
																	checked={
																		published
																	}
																	onChange={
																		handleQuoteChange
																	}
																>
																	&quot;
																	{ quote }
																	&quot;
																	{ author !==
																		'' &&
																		` — ${ author }` }
																</Checkbox>
															</div>
														)
													) }
											</div>
										</div>
									) ) }
							</div>

							<div className="googlesitekit-settings-gemini__submit">
								<SpinnerButton
									onClick={ saveQuotes }
									isSaving={ savingQuotes }
									disabled={
										! hasPublishableQuotes || savingQuotes
									}
								>
									Publish Quotes
								</SpinnerButton>
								<Checkbox
									id="auto-publish"
									checked={ shouldAutoPublishMemorableQuotes }
									value="auto-publish"
									disabled={ ! hasPublishableQuotes }
									onChange={ ( event ) =>
										setMemorableQuotesAutoPublish(
											event.target.checked
										)
									}
								>
									Automatically publish quotes for new posts
								</Checkbox>
							</div>
						</div>
					</div>
				</div>
				<Portal>
					<ModalDialog
						dialogActive={ dialogActive }
						onClose={ () => setDialogActive( false ) }
						handleConfirm={ () => setDialogActive( false ) }
						title={ __( 'Quotes Saved', 'google-site-kit' ) }
						subtitle={
							shouldAutoPublishMemorableQuotes
								? __(
										'Your quotes have been published. They will be displayed in any active Memorable Quotes block. When you publish a new post, new quotes will be generated and published automatically.',
										'google-site-kit'
								  )
								: __(
										'Your quotes have been published. They will be displayed in any active Memorable Quotes block.',
										'google-site-kit'
								  )
						}
						confirmButton={ __( 'Done', 'google-site-kit' ) }
						small
						hideCancel
					/>
				</Portal>
			</LoadingWrapper>
		</Fragment>
	);
}
