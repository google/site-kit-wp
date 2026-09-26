/**
 * Reader Revenue Manager ExpressSetupSteps component tests.
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
import { Registry } from '@/js/googlesitekit-data';
import { CORE_FORMS } from '@/js/googlesitekit/datastore/forms/constants';
import {
	publicationPoliciesStep,
	publicationSetupStep,
	setupCompleteStep,
	termsOfServiceStep,
} from '@/js/modules/reader-revenue-manager/components/setup/SetupMainExpress/common-steps';
import { SetupStep } from '@/js/modules/reader-revenue-manager/components/setup/SetupMainExpress/types';
import {
	READER_REVENUE_MANAGER_SETUP_FORM,
	SHOW_PUBLICATION_CREATE,
} from '@/js/modules/reader-revenue-manager/datastore/constants';
import { act, createTestRegistry, render } from '@tests/js/test-utils';
import ExpressSetupSteps from './ExpressSetupSteps';

function StepContent() {
	return null;
}

const STEPS: SetupStep[] = [
	{ slug: 'first', label: 'First step', Component: StepContent },
	{ slug: 'second', label: 'Second step', Component: StepContent },
	{ slug: 'third', label: 'Third step', Component: StepContent },
];

describe( 'ExpressSetupSteps', () => {
	let registry: Registry;

	beforeEach( () => {
		registry = createTestRegistry() as Registry;
	} );

	function getSteps( container: Element ) {
		return container.querySelectorAll( '.googlesitekit-stepper__step' );
	}

	it( 'should render the steps it is given, in the order it is given them', () => {
		const { container } = render( <ExpressSetupSteps steps={ STEPS } />, {
			registry,
		} );

		const steps = getSteps( container );

		expect( steps ).toHaveLength( 3 );
		expect( steps[ 0 ] ).toHaveTextContent( 'First step' );
		expect( steps[ 1 ] ).toHaveTextContent( 'Second step' );
		expect( steps[ 2 ] ).toHaveTextContent( 'Third step' );
	} );

	it( 'should render the labels of the shared step definitions', () => {
		const { container } = render(
			<ExpressSetupSteps
				steps={ [
					publicationSetupStep,
					termsOfServiceStep,
					publicationPoliciesStep,
					setupCompleteStep,
				] }
			/>,
			{ registry }
		);

		const steps = getSteps( container );

		expect( steps[ 0 ] ).toHaveTextContent( 'Connect publication' );
		expect( steps[ 1 ] ).toHaveTextContent( 'Accept terms of service' );
		expect( steps[ 2 ] ).toHaveTextContent( 'Add publication policies' );
		expect( steps[ 3 ] ).toHaveTextContent( 'Setup complete' );
	} );

	it( 'should resolve a function label against state', () => {
		const { container } = render(
			<ExpressSetupSteps steps={ [ publicationSetupStep ] } />,
			{ registry }
		);

		expect( getSteps( container )[ 0 ] ).toHaveTextContent(
			'Connect publication'
		);

		act( () => {
			registry
				.dispatch( CORE_FORMS )
				.setValues( READER_REVENUE_MANAGER_SETUP_FORM, {
					[ SHOW_PUBLICATION_CREATE ]: true,
				} );
		} );

		expect( getSteps( container )[ 0 ] ).toHaveTextContent(
			'Create publication'
		);
	} );

	it( 'should mark the step matching the active slug as active', () => {
		const { container } = render(
			<ExpressSetupSteps steps={ STEPS } activeSlug="second" />,
			{ registry }
		);

		const steps = getSteps( container );

		expect( steps[ 0 ] ).toHaveClass(
			'googlesitekit-stepper__step--completed'
		);
		expect( steps[ 1 ] ).toHaveClass(
			'googlesitekit-stepper__step--active'
		);
		expect( steps[ 2 ] ).toHaveClass(
			'googlesitekit-stepper__step--upcoming'
		);
	} );

	it( 'should mark every step as upcoming when no step is active', () => {
		const { container } = render( <ExpressSetupSteps steps={ STEPS } />, {
			registry,
		} );

		getSteps( container ).forEach( ( step ) => {
			expect( step ).toHaveClass(
				'googlesitekit-stepper__step--upcoming'
			);
		} );
	} );
} );
