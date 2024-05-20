/**
 * ChangeBadge component.
 *
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
import { GoogleGenerativeAI } from '@google/generative-ai';
import { get } from 'lodash';

/**
 * WordPress dependencies
 */
import { useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { SpinnerButton, TextField } from 'googlesitekit-components';
import { useEffect } from 'react';
import {
	DATE_RANGE_OFFSET,
	MODULES_ANALYTICS_4,
} from '../../modules/analytics-4/datastore/constants';
import { useSelect } from '@wordpress/data';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import { expandNumFmtOptions, numFmt } from '../../util';
import GeminiIcon from '../../../svg/graphics/gemini.svg';

// Prototype only, for production use we'd want to move the API
// integration to the server-side via PHP to keep the API key secure.
// Add your Gemini API key but DON'T COMMIT THIS TO THE REPO as it's public.
const GEMINI_API_KEY = '';

// Access your API key (see "Set up your API key" above)
const genAI = new GoogleGenerativeAI( GEMINI_API_KEY );
const model = genAI.getGenerativeModel( {
	model: 'gemini-pro',
} );

export default function Gemini() {
	const [ loading, setLoading ] = useState( true );
	const [ currentPrompt, setCurrentPrompt ] = useState( '' );
	const [ parts, setParts ] = useState( [] );

	const chatRef = useRef( null );

	// #region Report Queries

	const dates = useSelect( ( select ) =>
		select( CORE_USER ).getDateRangeDates( {
			offsetDays: DATE_RANGE_OFFSET,
			compare: true,
		} )
	);

	// Popular Content

	const popularContentReportOptions = {
		...dates,
		dimensions: [ 'pagePath' ],
		metrics: [ { name: 'screenPageViews' } ],
		orderby: [
			{
				metric: { metricName: 'screenPageViews' },
				desc: true,
			},
		],
		limit: 3,
	};

	const popularContentReport = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getReport( popularContentReportOptions )
	);

	const error = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getErrorForSelector( 'getReport', [
			popularContentReportOptions,
		] )
	);

	const titles = useSelect( ( select ) =>
		! error
			? select( MODULES_ANALYTICS_4 ).getPageTitles(
					popularContentReport,
					popularContentReportOptions
			  )
			: undefined
	);

	const popularContentPrompt =
		titles &&
		'Most popular content by pageviews:\n\n' +
			popularContentReport?.rows.map( ( row ) => {
				// Find the page title given the path
				const pageTitle = titles[ row.dimensionValues[ 0 ].value ];

				if ( row.dimensionValues[ 1 ].value !== 'date_range_0' ) {
					return '';
				}

				// return `${ row.dimensionValues[ 0 ].value }: ${ row.metricValues[ 0 ].value }`;
				return `${ pageTitle }: ${ row.metricValues[ 0 ].value }\n`;
			} );

	// New Visitors

	const makeFindNew = ( dateRange ) => ( row ) =>
		get( row, 'dimensionValues.0.value' ) === 'new' &&
		get( row, 'dimensionValues.1.value' ) === dateRange;

	const newVisitorsReportOptions = {
		...dates,
		dimensions: [ 'newVsReturning' ],
		metrics: [ { name: 'activeUsers' } ],
	};

	const newVisitorsReport = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getReport( newVisitorsReportOptions )
	);

	const newVisitors =
		newVisitorsReport?.rows.find( makeFindNew( 'date_range_0' ) )
			?.metricValues?.[ 0 ]?.value || 0;

	const totalNewVisitors =
		Number( newVisitorsReport?.totals[ 0 ]?.metricValues?.[ 0 ]?.value ) ||
		0;

	const prevTotalNewVisitors =
		Number( newVisitorsReport?.totals[ 1 ]?.metricValues?.[ 0 ]?.value ) ||
		0;

	const newVisitorsPrompt =
		newVisitorsReport &&
		`New Visitors:\n\n New Visitors: ${ newVisitors } Total: ${ totalNewVisitors }, that makes ${ numFmt(
			newVisitors / totalNewVisitors,
			expandNumFmtOptions( {
				style: 'percent',
				maximumFractionDigits: 1,
			} )
		) }% of total visitors. In the proceeding period there was a total of ${ prevTotalNewVisitors } new visitors.`;

	// Returning Visitors

	const makeFindReturning = ( dateRange ) => ( row ) =>
		get( row, 'dimensionValues.0.value' ) === 'returning' &&
		get( row, 'dimensionValues.1.value' ) === dateRange;

	const returningVisitorsReportOptions = {
		...dates,
		dimensions: [ 'newVsReturning' ],
		metrics: [ { name: 'activeUsers' } ],
	};

	const returningVisitorsReport = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getReport(
			returningVisitorsReportOptions
		)
	);

	const returning =
		returningVisitorsReport?.rows.find(
			makeFindReturning( 'date_range_0' )
		)?.metricValues?.[ 0 ]?.value || 0;

	const total =
		returningVisitorsReport?.totals[ 0 ]?.metricValues?.[ 0 ]?.value || 0;

	const prevReturning =
		returningVisitorsReport?.rows.find(
			makeFindReturning( 'date_range_1' )
		)?.metricValues?.[ 0 ]?.value || 0;

	const currentPercentage = total > 0 ? returning / total : 0;

	const returningVisitorsPrompt =
		returningVisitorsReport &&
		`Returning Visitors:\n\n Returning Visitors: ${ returning } Total: ${ total }, that makes ${ numFmt(
			currentPercentage,
			expandNumFmtOptions( {
				style: 'percent',
				maximumFractionDigits: 1,
			} )
		) }% of total visitors. In the proceeding period there was a total of ${ prevReturning } returning visitors.`;

	// Top Traffic Source

	const topTrafficSourceReportOptions = {
		...dates,
		dimensions: [ 'sessionDefaultChannelGroup' ],
		metrics: [
			{
				name: 'totalUsers',
			},
		],
		limit: 3,
		orderBy: 'totalUsers',
	};

	const topTrafficSourceReport = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getReport( topTrafficSourceReportOptions )
	);

	const topTrafficSourcePrompt =
		topTrafficSourceReport &&
		'Top Traffic Sources:\n\n' +
			topTrafficSourceReport?.rows.map( ( row ) =>
				row.dimensionValues[ 1 ].value === 'date_range_0'
					? ''
					: `${ row.dimensionValues[ 0 ].value }: ${ row.metricValues[ 0 ].value }\n`
			);

	// #endregion

	useEffect( () => {
		// Here is the crux of created a useful agent, loading data in to model
		// context. In this prototype, we need to loop through the Key Metrics
		// data, and pass it to the history of the chat with some reasonable
		// wrapping like "These were my most popular content by pageviews in the
		// last XX days: ..."

		// Wait for all reports to be fetched, then set the context from those reports.
		if (
			! popularContentPrompt ||
			! newVisitorsPrompt ||
			! returningVisitorsPrompt ||
			! topTrafficSourcePrompt
		) {
			return;
		}

		// console.log( popularContentPrompt );
		// console.log( newVisitorsPrompt );
		// console.log( returningVisitorsPrompt );
		// console.log( topTrafficSourcePrompt );

		// Start chat once all prompts are loaded.
		chatRef.current = model.startChat( {
			history: [
				{
					role: 'user',
					parts: [
						{
							text: 'Hello, here is some website data I want you to remember so I can ask questions about it later. All of this data is from the last 28 days.',
						},
					],
				},
				{
					role: 'model',
					parts: [
						{
							text: 'Great I will remember. Please give me as much detail as you can.',
						},
					],
				},
				{
					role: 'user',
					parts: [ { text: popularContentPrompt } ],
				},
				{
					role: 'model',
					parts: [
						{
							text: 'Great I will remember. Please give me as much detail as you can.',
						},
					],
				},
				{
					role: 'user',
					parts: [ { text: newVisitorsPrompt } ],
				},
				{
					role: 'model',
					parts: [
						{
							text: 'Great I will remember. Please give me as much detail as you can.',
						},
					],
				},
				{
					role: 'user',
					parts: [ { text: returningVisitorsPrompt } ],
				},
				{
					role: 'model',
					parts: [
						{
							text: 'Great I will remember. Please give me as much detail as you can.',
						},
					],
				},
				{
					role: 'user',
					parts: [ { text: topTrafficSourcePrompt } ],
				},
				{
					role: 'model',
					parts: [
						{
							text: 'Great I will remember. Please give me as much detail as you can.',
						},
					],
				},
			],
			generationConfig: {
				maxOutputTokens: 100,
			},
		} );

		setLoading( false );
	}, [
		popularContentPrompt,
		newVisitorsPrompt,
		returningVisitorsPrompt,
		topTrafficSourcePrompt,
	] );

	const chatTurn = async () => {
		const prompt = currentPrompt;

		setLoading( true );

		const result = await chatRef.current.sendMessage( prompt );
		const response = await result.response;
		// TODO: error handling.
		const text = response.text();

		setTimeout( () => {
			setCurrentPrompt( '' );
		}, 1000 );

		setParts( [
			...parts,
			{ role: 'user', parts: [ { text: prompt } ] },
			{ role: 'model', parts: [ { text } ] },
		] );

		setLoading( false );
	};

	return (
		<div className="googlesitekit-gemini-key-metrics googlesitekit-widget-area-header">
			<h3 className="googlesitekit-widget-area-header__title googlesitekit-heading-3">
				Explore your Key Metrics
			</h3>

			<div className="googlesitekit-gemini-key-metrics-chat">
				{ parts.map( ( { role, parts: chatPart }, index ) => (
					<div
						key={ index }
						className="googlesitekit-gemini-key-metrics-chat__message"
					>
						{ role === 'user' ? (
							<img
								className="googlesitekit-gemini-key-metrics-chat__message-icon"
								alt="User Profile"
								src="http://1.gravatar.com/avatar/747c5b3a9e784ce9c49cecf79a8481e5?s=26&d=mm&r=g"
							/>
						) : (
							<GeminiIcon className="googlesitekit-gemini-key-metrics-chat__message-icon" />
						) }
						<p>{ chatPart ? chatPart[ 0 ].text : '' }</p>
					</div>
				) ) }
			</div>

			<form
				className="googlesitekit-gemini-key-metrics__form"
				onSubmit={ chatTurn }
			>
				<TextField
					label={ __(
						'What do you want to know about your Key Metrics?',
						'google-site-kit'
					) }
					name="currentPrompt"
					outlined
					value={ currentPrompt }
					onChange={ ( event ) =>
						setCurrentPrompt( event.target.value )
					}
					disabled={ loading }
					on
				/>

				<SpinnerButton
					onClick={ chatTurn }
					disabled={ loading }
					isSaving={ loading }
				>
					Ask
				</SpinnerButton>
			</form>
		</div>
	);
}
