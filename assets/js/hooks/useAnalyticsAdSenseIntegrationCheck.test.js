/**
 * `useAnalyticsAdSenseIntegrationCheck` hook tests.
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
 * Internal dependencies
 */
import { renderHook, actHook as act } from '../../../tests/js/test-utils';
import { createTestRegistry, provideModules } from '../../../tests/js/utils';
import { MODULES_ANALYTICS_4 } from '../modules/analytics-4/datastore/constants';
import { useAnalyticsAdSenseIntegrationCheck } from './useAnalyticsAdSenseIntegrationCheck';

describe( 'useAnalyticsAdSenseIntegrationCheck', () => {
	let registry;

	beforeEach( () => {
		registry = createTestRegistry();
	} );

	it( 'should return { connected: true, linked: true }.', async () => {
		registry.dispatch( MODULES_ANALYTICS_4 ).setSettings( {
			adSenseLinked: true,
		} );
		provideModules( registry, [
			{
				active: true,
				connected: true,
				slug: 'analytics-4',
			},
			{
				active: true,
				connected: true,
				slug: 'adsense',
			},
		] );

		let result;
		await act( async () => {
			( { result } = await renderHook(
				() => useAnalyticsAdSenseIntegrationCheck(),
				{ registry }
			) );
		} );

		expect( result.current ).toStrictEqual( {
			connected: true,
			linked: true,
		} );
	} );

	it( 'should return { connected: false, linked: true }.', async () => {
		registry.dispatch( MODULES_ANALYTICS_4 ).setSettings( {
			adSenseLinked: true,
		} );
		provideModules( registry, [
			{
				active: true,
				connected: true,
				slug: 'analytics-4',
			},
			{
				active: false,
				connected: false,
				slug: 'adsense',
			},
		] );

		let result;
		await act( async () => {
			( { result } = await renderHook(
				() => useAnalyticsAdSenseIntegrationCheck(),
				{ registry }
			) );
		} );

		expect( result.current ).toStrictEqual( {
			connected: false,
			linked: true,
		} );
	} );

	it( 'should return { connected: false, linked: false }.', async () => {
		registry.dispatch( MODULES_ANALYTICS_4 ).setSettings( {
			adSenseLinked: false,
		} );
		provideModules( registry, [
			{
				active: true,
				connected: true,
				slug: 'analytics-4',
			},
			{
				active: false,
				connected: false,
				slug: 'adsense',
			},
		] );

		let result;
		await act( async () => {
			( { result } = await renderHook(
				() => useAnalyticsAdSenseIntegrationCheck(),
				{ registry }
			) );
		} );

		expect( result.current ).toStrictEqual( {
			connected: false,
			linked: false,
		} );
	} );

	it( 'should return { connected: true, linked: false }.', async () => {
		registry.dispatch( MODULES_ANALYTICS_4 ).setSettings( {
			adSenseLinked: false,
		} );
		provideModules( registry, [
			{
				active: true,
				connected: true,
				slug: 'analytics-4',
			},
			{
				active: true,
				connected: true,
				slug: 'adsense',
			},
		] );

		let result;
		await act( async () => {
			( { result } = await renderHook(
				() => useAnalyticsAdSenseIntegrationCheck(),
				{ registry }
			) );
		} );

		expect( result.current ).toStrictEqual( {
			connected: true,
			linked: false,
		} );
	} );
} );
