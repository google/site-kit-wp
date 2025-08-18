/**
 * ModuleRecoveryAlert utility functions tests.
 *
 * Site Kit by Google, Copyright 2025 Google LLC
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
import { MODULE_SLUG_ANALYTICS_4 } from '../../../modules/analytics-4/constants';
import { MODULE_SLUG_ADSENSE } from '../../../modules/adsense/constants';
import { MODULE_SLUG_SEARCH_CONSOLE } from '../../../modules/search-console/constants';
import { MODULE_SLUG_TAGMANAGER } from '../../../modules/tagmanager/constants';
import { computeAriaLabel } from './utils';

describe( 'computeAriaLabel', () => {
	const mockRecoverableModules = {
		[ MODULE_SLUG_ANALYTICS_4 ]: { name: 'Analytics 4' },
		[ MODULE_SLUG_ADSENSE ]: { name: 'AdSense' },
		[ MODULE_SLUG_SEARCH_CONSOLE ]: { name: 'Search Console' },
		[ MODULE_SLUG_TAGMANAGER ]: { name: 'Tag Manager' },
	};

	describe( 'when user has no recoverable modules', () => {
		it( 'should return undefined when hasUserRecoverableModules is false', () => {
			const result = computeAriaLabel( {
				recoverableModules: mockRecoverableModules,
				userRecoverableModuleSlugs: [ 'analytics-4' ],
				selectedModuleSlugs: [ 'analytics-4' ],
				hasUserRecoverableModules: false,
				hasMultipleRecoverableModules: false,
			} );

			expect( result ).toBeUndefined();
		} );
	} );

	describe( 'when user has a single recoverable module', () => {
		it( 'should return formatted label for single module', () => {
			const result = computeAriaLabel( {
				recoverableModules: mockRecoverableModules,
				userRecoverableModuleSlugs: [ MODULE_SLUG_ANALYTICS_4 ],
				selectedModuleSlugs: [ MODULE_SLUG_ANALYTICS_4 ],
				hasUserRecoverableModules: true,
				hasMultipleRecoverableModules: false,
			} );

			expect( result ).toBe( 'Recover Analytics 4' );
		} );
	} );

	describe( 'when user has multiple recoverable modules', () => {
		it( 'should return undefined when no modules are selected', () => {
			const result = computeAriaLabel( {
				recoverableModules: mockRecoverableModules,
				userRecoverableModuleSlugs: [
					MODULE_SLUG_ANALYTICS_4,
					MODULE_SLUG_ADSENSE,
				],
				selectedModuleSlugs: [],
				hasUserRecoverableModules: true,
				hasMultipleRecoverableModules: true,
			} );

			expect( result ).toBeUndefined();
		} );

		it( 'should return undefined when selectedModuleSlugs is null', () => {
			const result = computeAriaLabel( {
				recoverableModules: mockRecoverableModules,
				userRecoverableModuleSlugs: [
					MODULE_SLUG_ANALYTICS_4,
					MODULE_SLUG_ADSENSE,
				],
				selectedModuleSlugs: null,
				hasUserRecoverableModules: true,
				hasMultipleRecoverableModules: true,
			} );

			expect( result ).toBeUndefined();
		} );

		it( 'should return undefined when selectedModuleSlugs is undefined', () => {
			const result = computeAriaLabel( {
				recoverableModules: mockRecoverableModules,
				userRecoverableModuleSlugs: [
					MODULE_SLUG_ANALYTICS_4,
					MODULE_SLUG_ADSENSE,
				],
				selectedModuleSlugs: undefined,
				hasUserRecoverableModules: true,
				hasMultipleRecoverableModules: true,
			} );

			expect( result ).toBeUndefined();
		} );

		it( 'should return formatted label for single selected module', () => {
			const result = computeAriaLabel( {
				recoverableModules: mockRecoverableModules,
				userRecoverableModuleSlugs: [
					MODULE_SLUG_ANALYTICS_4,
					MODULE_SLUG_ADSENSE,
				],
				selectedModuleSlugs: [ MODULE_SLUG_ANALYTICS_4 ],
				hasUserRecoverableModules: true,
				hasMultipleRecoverableModules: true,
			} );

			expect( result ).toBe( 'Recover Analytics 4' );
		} );

		it( 'should return formatted label for two selected modules', () => {
			const result = computeAriaLabel( {
				recoverableModules: mockRecoverableModules,
				userRecoverableModuleSlugs: [
					MODULE_SLUG_ANALYTICS_4,
					MODULE_SLUG_ADSENSE,
				],
				selectedModuleSlugs: [
					MODULE_SLUG_ANALYTICS_4,
					MODULE_SLUG_ADSENSE,
				],
				hasUserRecoverableModules: true,
				hasMultipleRecoverableModules: true,
			} );

			expect( result ).toBe( 'Recover Analytics 4 and AdSense' );
		} );

		it( 'should return formatted label for three or more selected modules', () => {
			const result = computeAriaLabel( {
				recoverableModules: mockRecoverableModules,
				userRecoverableModuleSlugs: [
					MODULE_SLUG_ANALYTICS_4,
					MODULE_SLUG_ADSENSE,
					MODULE_SLUG_SEARCH_CONSOLE,
				],
				selectedModuleSlugs: [
					MODULE_SLUG_ANALYTICS_4,
					MODULE_SLUG_ADSENSE,
					MODULE_SLUG_SEARCH_CONSOLE,
				],
				hasUserRecoverableModules: true,
				hasMultipleRecoverableModules: true,
			} );

			expect( result ).toBe(
				'Recover Analytics 4, AdSense and Search Console'
			);
		} );
	} );
} );
