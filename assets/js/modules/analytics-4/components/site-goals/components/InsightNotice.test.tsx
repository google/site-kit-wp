/**
 * Site Goals insight notice tests.
 *
 * Site Kit by Google, Copyright 2026 Google LLC
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
import { WPDataRegistry } from '@wordpress/data/build-types/registry';

/**
 * Internal dependencies
 */
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { GOAL_TYPES } from '@/js/modules/analytics-4/components/site-goals/goal-drivers/constants';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import {
	act,
	createTestRegistry,
	freezeFetch,
	render,
} from '@tests/js/test-utils';
import InsightNotice from './InsightNotice';

describe( 'InsightNotice', () => {
	let registry: WPDataRegistry;

	beforeEach( () => {
		registry = createTestRegistry();
		registry.dispatch( CORE_USER ).setReferenceDate( '2026-11-25' );
	} );

	it( 'should render a placeholder inside the live region while the insight loads', () => {
		freezeFetch(
			new RegExp(
				'^/google-site-kit/v1/modules/analytics-4/data/conversion-insights'
			)
		);

		const { getByRole } = render(
			<InsightNotice goalType={ GOAL_TYPES.LEAD } tabID="" />,
			{ registry }
		);

		expect(
			getByRole( 'status' ).querySelector(
				'.googlesitekit-preview-block.googlesitekit-ai-insight-preview'
			)
		).toBeInTheDocument();
	} );

	it( 'should render the AI icon, the insight’s text, and its explanation with bold parts in a polite live region', () => {
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveConversionInsight(
			{
				interactionID: '01M4ZDVWTA3J4SBF8QX8NVXT93',
				scenario: 'GROWTH_VOL_UP_CR_UP_NOT_SEASONAL',
				code: 'GROWTH_VOL_UP_CR_UP_NOT_SEASONAL',
				text: 'Leads are up **60%** over the past 28 days.',
				actionableRecommendation:
					'Both more site traffic and a higher conversion rate contributed.',
			},
			{ goalType: GOAL_TYPES.LEAD, tabID: '', endDate: '2026-11-24' }
		);

		const { container, getByRole } = render(
			<InsightNotice goalType={ GOAL_TYPES.LEAD } tabID="" />,
			{ registry }
		);

		const notice = getByRole( 'status' );

		expect( notice ).toHaveAttribute( 'aria-live', 'polite' );
		expect( notice ).toHaveTextContent(
			/^AI-generatedLeads are up 60% over the past 28 days\. Both more site traffic and a higher conversion rate contributed\.$/
		);
		expect( container.querySelector( 'strong' ) ).toHaveTextContent(
			/^60%$/
		);
	} );

	it( 'should render only the insight’s text when it has no explanation', () => {
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveConversionInsight(
			{
				interactionID: '01M4ZDVWTA3J4SBF8QX8NVXT93',
				scenario: 'GROWTH_VOL_UP_CR_UP_NOT_SEASONAL',
				code: 'GROWTH_VOL_UP_CR_UP_NOT_SEASONAL',
				text: 'Leads are up 60% over the past 28 days.',
				actionableRecommendation: null,
			},
			{ goalType: GOAL_TYPES.LEAD, tabID: '', endDate: '2026-11-24' }
		);

		const { getByRole } = render(
			<InsightNotice goalType={ GOAL_TYPES.LEAD } tabID="" />,
			{ registry }
		);

		expect( getByRole( 'status' ) ).toHaveTextContent(
			/^AI-generatedLeads are up 60% over the past 28 days\.$/
		);
	} );

	it( 'should render an empty live region when the insight has nothing to show', () => {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveConversionInsight( null, {
				goalType: GOAL_TYPES.LEAD,
				tabID: '',
				endDate: '2026-11-24',
			} );

		const { getByRole } = render(
			<InsightNotice goalType={ GOAL_TYPES.LEAD } tabID="" />,
			{ registry }
		);

		expect( getByRole( 'status' ) ).toBeEmptyDOMElement();
	} );

	it( 'should render an empty live region when the widget can’t show an insight', () => {
		registry.dispatch( CORE_USER ).setDateRangeSelection( {
			type: 'preset',
			slug: 'last-7-days',
		} );

		const { getByRole } = render(
			<InsightNotice goalType={ GOAL_TYPES.LEAD } tabID="" />,
			{ registry }
		);

		expect( getByRole( 'status' ) ).toBeEmptyDOMElement();
	} );

	it( 'should keep the live region on the page while the insight is hidden, so it is announced when it shows again', () => {
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveConversionInsight(
			{
				interactionID: '01M4ZDVWTA3J4SBF8QX8NVXT93',
				scenario: 'GROWTH_VOL_UP_CR_UP_NOT_SEASONAL',
				code: 'GROWTH_VOL_UP_CR_UP_NOT_SEASONAL',
				text: 'Leads are up 60% over the past 28 days.',
				actionableRecommendation: null,
			},
			{ goalType: GOAL_TYPES.LEAD, tabID: '', endDate: '2026-11-24' }
		);

		const { getByRole } = render(
			<InsightNotice goalType={ GOAL_TYPES.LEAD } tabID="" />,
			{ registry }
		);

		const liveRegion = getByRole( 'status' );

		act( () => {
			registry.dispatch( CORE_USER ).setDateRangeSelection( {
				type: 'preset',
				slug: 'last-7-days',
			} );
		} );

		expect( getByRole( 'status' ) ).toBe( liveRegion );
		expect( liveRegion ).toBeEmptyDOMElement();

		act( () => {
			registry.dispatch( CORE_USER ).setDateRangeSelection( {
				type: 'preset',
				slug: 'last-28-days',
			} );
		} );

		expect( getByRole( 'status' ) ).toBe( liveRegion );
		expect( liveRegion ).toHaveTextContent(
			'Leads are up 60% over the past 28 days.'
		);
	} );
} );
