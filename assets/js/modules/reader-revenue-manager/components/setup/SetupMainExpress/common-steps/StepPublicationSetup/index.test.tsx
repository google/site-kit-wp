/**
 * Reader Revenue Manager StepPublicationSetup component tests.
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
import { MODULE_SLUG_READER_REVENUE_MANAGER } from '@/js/modules/reader-revenue-manager/constants';
import { publications } from '@/js/modules/reader-revenue-manager/datastore/__fixtures__';
import {
	MODULES_READER_REVENUE_MANAGER,
	READER_REVENUE_MANAGER_SETUP_FORM,
	SHOW_PUBLICATION_CREATE,
} from '@/js/modules/reader-revenue-manager/datastore/constants';
import {
	createTestRegistry,
	fireEvent,
	freezeFetch,
	provideModuleRegistrations,
	provideModules,
	providePublications,
	provideSiteInfo,
	render,
	waitFor,
} from '@tests/js/test-utils';
import StepPublicationSetup from '.';

describe( 'StepPublicationSetup', () => {
	let registry: Registry;

	const publicationsEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/reader-revenue-manager/data/publications'
	);

	beforeEach( () => {
		registry = createTestRegistry() as Registry;

		provideSiteInfo( registry );

		const moduleData = [
			{
				slug: MODULE_SLUG_READER_REVENUE_MANAGER,
				active: true,
				connected: false,
			},
		];

		provideModules( registry, moduleData );
		provideModuleRegistrations( registry, moduleData );

		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.receiveGetSettings( {
				postTypes: [ 'post' ],
				snippetMode: 'post_types',
			} );
	} );

	it( 'renders as a progress bar if publications are loading', () => {
		freezeFetch( publicationsEndpoint );

		const { getByRole, queryByRole } = render( <StepPublicationSetup />, {
			registry,
		} );

		expect( getByRole( 'progressbar' ) ).toBeInTheDocument();
		expect(
			queryByRole( 'heading', { name: 'Connect your publication' } )
		).not.toBeInTheDocument();
	} );

	it( 'renders as an error notice if getting publications fails', async () => {
		fetchMock.getOnce( publicationsEndpoint, {
			body: {},
			status: 500,
		} );

		const { getByRole } = render( <StepPublicationSetup />, {
			registry,
		} );

		await waitFor( () => {
			expect( getByRole( 'status' ) ).toHaveTextContent(
				/Getting your publications failed/
			);
		} );

		expect( console ).toHaveErrored();
	} );

	it( 'switches to the create form if no publications exist', async () => {
		providePublications( registry, [] );

		await waitFor( () => {
			expect(
				registry
					.select( CORE_FORMS )
					.getValue(
						READER_REVENUE_MANAGER_SETUP_FORM,
						SHOW_PUBLICATION_CREATE
					)
			).toBeUndefined();
		} );

		const { queryByRole } = render( <StepPublicationSetup />, {
			registry,
		} );

		expect(
			queryByRole( 'heading', { name: 'Connect your publication' } )
		).not.toBeInTheDocument();

		await waitFor( () => {
			expect(
				registry
					.select( CORE_FORMS )
					.getValue(
						READER_REVENUE_MANAGER_SETUP_FORM,
						SHOW_PUBLICATION_CREATE
					)
			).toBe( true );
		} );
	} );

	it( 'can switch between forms if publications exist', async () => {
		providePublications( registry, publications );

		const { getByRole, queryByRole } = render( <StepPublicationSetup />, {
			registry,
		} );

		expect(
			getByRole( 'heading', { name: 'Connect your publication' } )
		).toBeInTheDocument();

		await waitFor( () => {
			expect(
				registry
					.select( MODULES_READER_REVENUE_MANAGER )
					.getPublicationID()
			).toBeDefined();
		} );

		fireEvent.click(
			getByRole( 'button', { name: 'Create new publication' } )
		);

		expect(
			queryByRole( 'heading', { name: 'Connect your publication' } )
		).not.toBeInTheDocument();

		fireEvent.click(
			getByRole( 'button', { name: 'Use existing publication' } )
		);

		expect(
			getByRole( 'heading', { name: 'Connect your publication' } )
		).toBeInTheDocument();
	} );

	it( 'does not render the form switch button if no publications exist', () => {
		providePublications( registry, [] );

		const { queryByRole } = render( <StepPublicationSetup />, {
			registry,
		} );

		expect(
			queryByRole( 'button', { name: 'Create new publication' } )
		).not.toBeInTheDocument();

		expect(
			queryByRole( 'button', { name: 'Use existing publication' } )
		).not.toBeInTheDocument();
	} );
} );
