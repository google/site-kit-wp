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
import { MODULE_SLUG_READER_REVENUE_MANAGER } from '@/js/modules/reader-revenue-manager/constants';
import { publications } from '@/js/modules/reader-revenue-manager/datastore/__fixtures__';
import { MODULES_READER_REVENUE_MANAGER } from '@/js/modules/reader-revenue-manager/datastore/constants';
import { providePublications } from '@/js/modules/reader-revenue-manager/utils/test-utils';
import {
	createTestRegistry,
	fireEvent,
	provideModuleRegistrations,
	provideModules,
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
			.receiveGetSettings( {} );

		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.finishResolution( 'getSettings', [] );
	} );

	it( 'should render as a progress bar if publications are loading', () => {
		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.startResolution( 'getPublications', [] );

		const { getByRole } = render(
			<StepPublicationSetup onComplete={ () => {} } />,
			{
				registry,
			}
		);

		expect( getByRole( 'progressbar' ) ).toBeInTheDocument();
	} );

	it( 'should automatically switch to the create publication form if getting publications fails', async () => {
		fetchMock.getOnce( publicationsEndpoint, {
			body: {
				code: 'internal_server_error',
				message: 'Internal server error',
				data: { status: 500 },
			},
			status: 500,
		} );

		const { getByText, queryByRole } = render(
			<StepPublicationSetup onComplete={ () => {} } />,
			{
				registry,
			}
		);

		await waitFor( () => {
			expect(
				getByText(
					'RRM express setup placeholder: publication setup step.'
				)
			).toBeInTheDocument();
		} );

		expect(
			queryByRole( 'heading', { name: 'Connect your publication' } )
		).not.toBeInTheDocument();

		expect( console ).toHaveErrored();
	} );

	it( 'should automatically switch to the create publication form if no publications exist', () => {
		providePublications( registry, [] );

		const { getByText, queryByRole } = render(
			<StepPublicationSetup onComplete={ () => {} } />,
			{
				registry,
			}
		);

		expect(
			getByText(
				'RRM express setup placeholder: publication setup step.'
			)
		).toBeInTheDocument();

		expect(
			queryByRole( 'heading', { name: 'Connect your publication' } )
		).not.toBeInTheDocument();
	} );

	it( 'should not render the form switch button if no publications exist', () => {
		providePublications( registry, [] );

		const { getByText } = render(
			<StepPublicationSetup onComplete={ () => {} } />,
			{
				registry,
			}
		);

		expect(
			getByText(
				'RRM express setup placeholder: publication setup step.'
			)
		).toBeInTheDocument();
	} );

	it( 'should be possible to switch between forms if publications exist', async () => {
		providePublications( registry, publications );

		const { getByRole, getByText } = render(
			<StepPublicationSetup onComplete={ () => {} } />,
			{
				registry,
			}
		);

		await waitFor( () => {
			expect(
				getByRole( 'heading', { name: 'Connect your publication' } )
			).toBeInTheDocument();
		} );

		fireEvent.click(
			getByRole( 'button', { name: 'Create new publication' } )
		);

		expect(
			getByText(
				'RRM express setup placeholder: publication setup step.'
			)
		).toBeInTheDocument();

		fireEvent.click(
			getByRole( 'button', { name: 'Use existing publication' } )
		);

		expect(
			getByRole( 'heading', { name: 'Connect your publication' } )
		).toBeInTheDocument();
	} );
} );
