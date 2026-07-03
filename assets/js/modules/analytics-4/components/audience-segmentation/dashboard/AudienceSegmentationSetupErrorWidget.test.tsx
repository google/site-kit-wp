/**
 * AudienceSegmentationSetupErrorWidget tests.
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
 * External dependencies
 */
import type { FC, ReactNode } from 'react';

/**
 * WordPress dependencies
 */
import { WPDataRegistry } from '@wordpress/data/build-types/registry';

/**
 * Internal dependencies
 */
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { ERROR_REASON_INSUFFICIENT_PERMISSIONS } from '@/js/util/errors';
import { fireEvent, render } from '@tests/js/test-utils';
import { createTestRegistry, provideSiteInfo } from '@tests/js/utils';
import AudienceSegmentationSetupErrorWidget from './AudienceSegmentationSetupErrorWidget';

const MockWidget: FC< {
	className?: string;
	noPadding?: boolean;
	children?: ReactNode;
} > = ( { className, children } ) => {
	return <div className={ className }>{ children }</div>;
};

describe( 'AudienceSegmentationSetupErrorWidget', () => {
	let registry: WPDataRegistry;

	beforeEach( () => {
		registry = createTestRegistry();
		provideSiteInfo( registry );
	} );

	it.each( [
		{
			testName: 'audience creation permissions error',
			errors: {
				code: 'test_error',
				message: 'Error message.',
				data: { reason: ERROR_REASON_INSUFFICIENT_PERMISSIONS },
			},
			isAudienceCreationVariant: true,
			onDismiss: jest.fn(),
			expectedTitle: 'Creating visitor groups failed',
			expectedDescription:
				'It seems that you don’t have the required permissions to create visitor groups.You can contact your administrator and ask for Analytics write permissions and then retry. Learn more',
		},
		{
			testName: 'audience creation general error',
			errors: {
				code: 'test_error',
				message: 'Error message.',
				data: { status: 500 },
			},
			isAudienceCreationVariant: true,
			onDismiss: jest.fn(),
			expectedTitle: 'Creating visitor groups failed',
			expectedDescription:
				'To create your audience groups we’ll need to update your Analytics property which failed during setup. Learn more',
		},
		{
			testName: 'visitor groups setup permissions error',
			errors: {
				code: 'test_error',
				message: 'Error message.',
				data: { reason: ERROR_REASON_INSUFFICIENT_PERMISSIONS },
			},
			isAudienceCreationVariant: false,
			onDismiss: jest.fn(),
			expectedTitle: 'Visitor groups setup failed',
			expectedDescription:
				'It seems that you don’t have the required permissions to set up visitor groups.You can contact your administrator. Learn more',
		},
		{
			testName: 'visitor groups setup general error',
			errors: {
				code: 'test_error',
				message: 'Error message.',
				data: { status: 500 },
			},
			isAudienceCreationVariant: false,
			onDismiss: jest.fn(),
			expectedTitle: 'Visitor groups setup failed',
			expectedDescription:
				'An error occurred while setting up visitor groups, please try again. Learn more',
		},
	] )(
		'renders the $testName variant',
		( {
			errors,
			isAudienceCreationVariant,
			onDismiss,
			expectedTitle,
			expectedDescription,
		} ) => {
			const expectedHelpURL = registry
				.select( CORE_SITE )
				.getDocumentationLinkURL( 'visitor-groups' );

			const { container, getByRole, getByText } = render(
				<AudienceSegmentationSetupErrorWidget
					Widget={ MockWidget }
					errors={ errors }
					isAudienceCreationVariant={ isAudienceCreationVariant }
					onRetry={ () => {} }
					onDismiss={ onDismiss }
				/>,
				{ registry }
			);

			expect( getByText( expectedTitle ) ).toBeInTheDocument();

			const description = container.querySelector(
				'.googlesitekit-notice__description'
			);
			expect( description ).toBeInTheDocument();
			expect( description ).toHaveTextContent( expectedDescription );

			const learnMoreLink = getByRole( 'link', {
				name: /learn more/i,
			} );
			expect( learnMoreLink ).toHaveAttribute( 'href', expectedHelpURL );

			expect(
				getByRole( 'button', { name: 'Retry' } )
			).toBeInTheDocument();
			expect(
				getByRole( 'button', { name: 'No thanks' } )
			).toBeInTheDocument();
		}
	);

	it( 'calls onRetry when the Retry button is clicked', () => {
		const onRetry = jest.fn();

		const { getByRole } = render(
			<AudienceSegmentationSetupErrorWidget
				Widget={ MockWidget }
				errors={ {
					code: 'test_error',
					message: 'Error message.',
					data: { status: 500 },
				} }
				isAudienceCreationVariant={ false }
				onRetry={ onRetry }
				onDismiss={ () => {} }
			/>,
			{ registry }
		);

		fireEvent.click( getByRole( 'button', { name: 'Retry' } ) );

		expect( onRetry ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'calls onDismiss when the "No thanks" button is clicked', () => {
		const onDismiss = jest.fn();

		const { getByRole } = render(
			<AudienceSegmentationSetupErrorWidget
				Widget={ MockWidget }
				errors={ {
					code: 'test_error',
					message: 'Error message.',
					data: { status: 500 },
				} }
				isAudienceCreationVariant={ false }
				onRetry={ () => {} }
				onDismiss={ onDismiss }
			/>,
			{ registry }
		);

		fireEvent.click( getByRole( 'button', { name: 'No thanks' } ) );

		expect( onDismiss ).toHaveBeenCalledTimes( 1 );
	} );
} );
