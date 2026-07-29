/**
 * Tests for the Conversion Insights payload builder.
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
 * Internal dependencies
 */
import { buildConversionInsightEvent } from './buildConversionInsightEvents';

const current = {
	conversions: 150,
	conversionRate: 0.025,
	sessions: 6000,
	engagementRate: 0.66,
};

const previous = {
	conversions: 100,
	conversionRate: 0.02,
	sessions: 5000,
	engagementRate: 0.6,
};

describe( 'buildConversionInsightEvent', () => {
	it( 'shapes camelCase metrics into the snake_case EventData contract', () => {
		const event = buildConversionInsightEvent( {
			keyEventName: 'submit_lead_form',
			monthStartDate: '2026-05-01',
			current,
			previous,
		} );

		expect( event ).toEqual( {
			key_event_name: 'submit_lead_form',
			month_start_date: '2026-05-01',
			current: {
				conversions: 150,
				conversion_rate: 0.025,
				sessions: 6000,
				engagement_rate: 0.66,
			},
			previous: {
				conversions: 100,
				conversion_rate: 0.02,
				sessions: 5000,
				engagement_rate: 0.6,
			},
		} );
	} );

	it( 'omits the yoy_* fields when no YoY data is provided', () => {
		const event = buildConversionInsightEvent( {
			keyEventName: 'purchase',
			monthStartDate: '2026-05-01',
			current,
			previous,
		} );

		expect( event ).not.toHaveProperty( 'yoy_current_conversions' );
		expect( event ).not.toHaveProperty( 'yoy_previous_conversions' );
	} );

	it( 'includes the yoy_* fields when YoY data is provided', () => {
		const event = buildConversionInsightEvent( {
			keyEventName: 'purchase',
			monthStartDate: '2026-05-01',
			current,
			previous,
			yoy: { current: 130, previous: 90 },
		} );

		expect( event.yoy_current_conversions ).toBe( 130 );
		expect( event.yoy_previous_conversions ).toBe( 90 );
	} );
} );
