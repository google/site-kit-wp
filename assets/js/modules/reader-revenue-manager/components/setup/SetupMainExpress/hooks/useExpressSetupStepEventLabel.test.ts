/**
 * Reader Revenue Manager express setup `useExpressSetupStepEventLabel` hook tests.
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
import { publications } from '@/js/modules/reader-revenue-manager/datastore/__fixtures__';
import {
	MODULES_READER_REVENUE_MANAGER,
	READER_REVENUE_MANAGER_SETUP_FORM,
	SHOW_PUBLICATION_CREATE,
} from '@/js/modules/reader-revenue-manager/datastore/constants';
import { providePublications } from '@/js/modules/reader-revenue-manager/utils/test-utils';
import { createTestRegistry, renderHook } from '@tests/js/test-utils';
import useExpressSetupStepEventLabel from './useExpressSetupStepEventLabel';

describe( 'useExpressSetupStepEventLabel', () => {
	let registry: Registry;

	beforeEach( () => {
		registry = createTestRegistry() as Registry;
	} );

	it( 'should return the slug of a step other than the publication setup step', () => {
		const { result } = renderHook(
			() => useExpressSetupStepEventLabel( 'terms-of-service' ),
			{ registry }
		);

		expect( result.current ).toBe( 'terms-of-service' );
	} );

	it( 'should return undefined while the publications are loading', () => {
		const { result } = renderHook(
			() => useExpressSetupStepEventLabel( 'connect-publication' ),
			{ registry }
		);

		expect( result.current ).toBeUndefined();
	} );

	it( 'should return connect-publication when there are publications to connect', () => {
		providePublications( registry, publications );

		const { result } = renderHook(
			() => useExpressSetupStepEventLabel( 'connect-publication' ),
			{ registry }
		);

		expect( result.current ).toBe( 'connect-publication' );
	} );

	it( 'should return create-publication while the create form is shown', () => {
		providePublications( registry, publications );

		registry
			.dispatch( CORE_FORMS )
			.setValues( READER_REVENUE_MANAGER_SETUP_FORM, {
				[ SHOW_PUBLICATION_CREATE ]: true,
			} );

		const { result } = renderHook(
			() => useExpressSetupStepEventLabel( 'connect-publication' ),
			{ registry }
		);

		expect( result.current ).toBe( 'create-publication' );
	} );

	it( 'should return create-publication when there are no publications', () => {
		providePublications( registry, [] );

		const { result } = renderHook(
			() => useExpressSetupStepEventLabel( 'connect-publication' ),
			{ registry }
		);

		expect( result.current ).toBe( 'create-publication' );
	} );

	it( 'should return connect-publication when the publications fail to load', async () => {
		fetchMock.getOnce(
			new RegExp(
				'^/google-site-kit/v1/modules/reader-revenue-manager/data/publications'
			),
			{
				body: {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				},
				status: 500,
			}
		);

		await registry
			.resolveSelect( MODULES_READER_REVENUE_MANAGER )
			.getPublications();

		expect( console ).toHaveErrored();

		const { result } = renderHook(
			() => useExpressSetupStepEventLabel( 'connect-publication' ),
			{ registry }
		);

		expect( result.current ).toBe( 'connect-publication' );
	} );
} );
