/**
 * Reader Revenue Manager create publication component tests.
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
	CREATE_PUBLICATION_FORM,
	READER_REVENUE_MANAGER_SETUP_FORM,
	SHOW_PUBLICATION_CREATE,
} from '@/js/modules/reader-revenue-manager/datastore/constants';
import { mockLocation } from '@tests/js/mock-browser-utils';
import {
	act,
	createTestRegistry,
	fireEvent,
	freezeFetch,
	provideModuleRegistrations,
	provideModules,
	provideSiteInfo,
	render,
	waitFor,
} from '@tests/js/test-utils';
import CreatePublication from './CreatePublication';

describe( 'CreatePublication', () => {
	let registry: Registry;

	const createPublicationEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/reader-revenue-manager/data/create-publication'
	);
	const settingsEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/reader-revenue-manager/data/settings'
	);

	mockLocation();

	beforeEach( () => {
		registry = createTestRegistry() as Registry;

		provideSiteInfo( registry, { siteLocale: 'en-US' } );

		const moduleData = [
			{
				slug: MODULE_SLUG_READER_REVENUE_MANAGER,
				active: true,
				connected: false,
			},
		];

		provideModules( registry, moduleData );
		provideModuleRegistrations( registry, moduleData );
	} );

	it.each( [
		[ 'en', 'English', 'US', 'United States', 'en-US' ],
		[ 'en', 'English', 'GB', 'United Kingdom', 'en-GB' ],
		[ 'en', 'English', '', '', 'en' ],
		[ '', '', '', '', 'abc-XYZ' ],
		[ '', '', '', '', undefined ],
	] )(
		'should pre-select `%s` "%s" and `%s` "%s" for site locale `%s`',
		( languageCode, language, regionCode, region, locale ) => {
			provideSiteInfo( registry, { siteLocale: locale } );

			const { container } = render(
				<CreatePublication onComplete={ () => {} } />,
				{
					registry,
				}
			);

			const selectLabels = container.querySelectorAll(
				'.mdc-select__selected-text'
			);

			const selectValues = container.querySelectorAll< HTMLInputElement >(
				'input[name="enhanced-select"]'
			);

			expect( selectValues[ 0 ] ).toHaveValue( languageCode );
			expect( selectLabels[ 0 ] ).toHaveTextContent( language );
			expect( selectValues[ 1 ] ).toHaveValue( regionCode );
			expect( selectLabels[ 1 ] ).toHaveTextContent( region );
		}
	);

	it( 'should disable submission until all fields are complete', () => {
		provideSiteInfo( registry, {
			siteLocale: undefined,
			siteName: undefined,
		} );

		const { getByRole } = render(
			<CreatePublication onComplete={ () => {} } />,
			{
				registry,
			}
		);

		const submitButton = getByRole( 'button', {
			name: 'Create publication',
		} );

		expect( submitButton ).toBeDisabled();

		for ( const [ key, value ] of [
			[ CREATE_PUBLICATION_FORM.DISPLAY_NAME, 'Test Publication' ],
			[ CREATE_PUBLICATION_FORM.LANGUAGE_CODE, 'en' ],
			[ CREATE_PUBLICATION_FORM.REGION_CODE, 'US' ],
		] ) {
			act( () => {
				registry
					.dispatch( CORE_FORMS )
					.setValues( READER_REVENUE_MANAGER_SETUP_FORM, {
						[ key ]: value,
					} );
			} );

			expect( submitButton ).toBeDisabled();
		}

		fireEvent.click( getByRole( 'checkbox' ) );

		expect( submitButton ).toBeEnabled();
	} );

	it( 'should disable submission when submission is in progress', async () => {
		fetchMock.postOnce( createPublicationEndpoint, {
			body: publications[ 0 ],
			status: 200,
		} );

		freezeFetch( settingsEndpoint );

		const { getByRole } = render(
			<CreatePublication onComplete={ () => {} } />,
			{
				registry,
			}
		);

		const submitButton = getByRole( 'button', {
			name: 'Create publication',
		} );

		fireEvent.click( getByRole( 'checkbox' ) );

		expect( submitButton ).toBeEnabled();

		fireEvent.click( submitButton );

		await waitFor( () => {
			expect( submitButton ).toBeDisabled();
		} );
	} );

	it( 'should call the complete handler if submission is successful', async () => {
		fetchMock.postOnce( createPublicationEndpoint, {
			body: publications[ 0 ],
			status: 200,
		} );

		fetchMock.postOnce( settingsEndpoint, {} );

		const onComplete = jest.fn();

		const { getByRole } = render(
			<CreatePublication onComplete={ onComplete } />,
			{
				registry,
			}
		);

		fireEvent.click( getByRole( 'checkbox' ) );

		fireEvent.click(
			getByRole( 'button', { name: 'Create publication' } )
		);

		await waitFor( () => {
			expect( onComplete ).toHaveBeenCalledWith( false );
		} );

		expect( fetchMock ).toHaveFetched( createPublicationEndpoint );
		expect( fetchMock ).toHaveFetched( settingsEndpoint );
	} );

	it( 'should display an error notice if creating the publication fails', async () => {
		fetchMock.postOnce( createPublicationEndpoint, {
			body: {
				code: 'internal_server_error',
				message: 'Internal server error',
				data: { status: 500 },
			},
			status: 500,
		} );

		const onComplete = jest.fn();

		const { getByRole } = render(
			<CreatePublication onComplete={ onComplete } />,
			{
				registry,
			}
		);

		fireEvent.click( getByRole( 'checkbox' ) );

		fireEvent.click(
			getByRole( 'button', { name: 'Create publication' } )
		);

		await waitFor( () => {
			expect( getByRole( 'status' ) ).toHaveTextContent(
				/Internal server error/
			);
		} );

		expect( onComplete ).not.toHaveBeenCalled();
		expect( fetchMock ).not.toHaveFetched( settingsEndpoint );
		expect( console ).toHaveErrored();
	} );

	it( 'should flip to connect publication if saving settings fails', async () => {
		fetchMock.postOnce( createPublicationEndpoint, {
			body: publications[ 0 ],
			status: 200,
		} );

		fetchMock.postOnce( settingsEndpoint, {
			body: {
				code: 'internal_server_error',
				message: 'Internal server error',
				data: { status: 500 },
			},
			status: 500,
		} );

		const onComplete = jest.fn();

		const { getByRole } = render(
			<CreatePublication onComplete={ onComplete } />,
			{
				registry,
			}
		);

		fireEvent.click( getByRole( 'checkbox' ) );

		fireEvent.click(
			getByRole( 'button', { name: 'Create publication' } )
		);

		await waitFor( () => {
			expect(
				registry
					.select( CORE_FORMS )
					.getValue(
						READER_REVENUE_MANAGER_SETUP_FORM,
						SHOW_PUBLICATION_CREATE
					)
			).toBe( false );
		} );

		expect( onComplete ).not.toHaveBeenCalled();
		expect( console ).toHaveErrored();
	} );
} );
