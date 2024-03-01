/**
 * `core/ui` data store tests.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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
import { createTestRegistry } from '../../../../../tests/js/utils';
import { CORE_UI } from './constants';
import { LINK_ANALYTICS_ADSENSE_OVERLAY_NOTIFICATION } from '../../../components/OverlayNotification/constants';

describe( 'core/ui store', () => {
	let registry;

	beforeEach( () => {
		registry = createTestRegistry();
	} );

	describe( 'actions', () => {
		describe( 'resetInViewHook', () => {
			it( 'increments the value of core/ui useInViewResetCount', async () => {
				const resetCount = registry
					.select( CORE_UI )
					.getInViewResetCount();

				// The reset count starts at zero.
				expect( resetCount ).toBe( 0 );

				await registry.dispatch( CORE_UI ).resetInViewHook();

				const updatedResetCount = registry
					.select( CORE_UI )
					.getInViewResetCount();

				expect( updatedResetCount ).toBe( 1 );
			} );
		} );

		describe( 'setIsOnline', () => {
			it( 'sets the isOnline value', async () => {
				const isOnline = registry.select( CORE_UI ).getIsOnline();

				// isOnline has initial state set to true.
				expect( isOnline ).toBe( true );

				await registry.dispatch( CORE_UI ).setIsOnline( false );

				const updatedIsOnline = registry
					.select( CORE_UI )
					.getIsOnline();

				expect( updatedIsOnline ).toBe( false );
			} );
		} );

		describe( 'setOverlayNotificationToShow', () => {
			it( 'sets the isShowingOverlayNotification value', async () => {
				const isShowingOverlayNotification = registry
					.select( CORE_UI )
					.isShowingOverlayNotification();

				expect( isShowingOverlayNotification ).toBe( undefined );

				await registry
					.dispatch( CORE_UI )
					.setOverlayNotificationToShow(
						LINK_ANALYTICS_ADSENSE_OVERLAY_NOTIFICATION
					);

				const updatedIsShowingOverlayNotification = registry
					.select( CORE_UI )
					.isShowingOverlayNotification();

				expect( updatedIsShowingOverlayNotification ).toBe(
					LINK_ANALYTICS_ADSENSE_OVERLAY_NOTIFICATION
				);
			} );

			it( 'it does not set the isShowingOverlayNotification value if it is already set', () => {
				const isShowingOverlayNotification = registry
					.select( CORE_UI )
					.isShowingOverlayNotification();

				expect( isShowingOverlayNotification ).toBe( undefined );

				// Awaiting is itentionally omitted to simulate race condition.
				registry
					.dispatch( CORE_UI )
					.setOverlayNotificationToShow(
						LINK_ANALYTICS_ADSENSE_OVERLAY_NOTIFICATION
					);

				registry
					.dispatch( CORE_UI )
					.setOverlayNotificationToShow( 'TestNotification' );

				const updatedIsShowingOverlayNotification = registry
					.select( CORE_UI )
					.isShowingOverlayNotification();

				expect( updatedIsShowingOverlayNotification ).toBe(
					LINK_ANALYTICS_ADSENSE_OVERLAY_NOTIFICATION
				);
			} );

			it( 'it does not set the isShowingOverlayNotification value if it is already dismissed', async () => {
				await registry
					.dispatch( CORE_UI )
					.setOverlayNotificationToShow(
						LINK_ANALYTICS_ADSENSE_OVERLAY_NOTIFICATION
					);

				const isShowingOverlayNotification = registry
					.select( CORE_UI )
					.isShowingOverlayNotification();

				expect( isShowingOverlayNotification ).toBe(
					LINK_ANALYTICS_ADSENSE_OVERLAY_NOTIFICATION
				);

				registry
					.dispatch( CORE_UI )
					.dismissOverlayNotification(
						LINK_ANALYTICS_ADSENSE_OVERLAY_NOTIFICATION
					);

				registry
					.dispatch( CORE_UI )
					.setOverlayNotificationToShow(
						LINK_ANALYTICS_ADSENSE_OVERLAY_NOTIFICATION
					);

				const updatedIsShowingOverlayNotification = registry
					.select( CORE_UI )
					.isShowingOverlayNotification();

				expect( updatedIsShowingOverlayNotification ).toBe( undefined );
			} );
		} );

		describe( 'dismissOverlayNotification', () => {
			it( 'resets the isShowingOverlayNotification value and adds overlay notification in `dismissedOverlayNotifications` state value', async () => {
				await registry
					.dispatch( CORE_UI )
					.setOverlayNotificationToShow(
						LINK_ANALYTICS_ADSENSE_OVERLAY_NOTIFICATION
					);

				const isShowingOverlayNotification = registry
					.select( CORE_UI )
					.isShowingOverlayNotification();

				const dismissedOverlayNotifications = registry
					.select( CORE_UI )
					.getValue( 'dismissedOverlayNotifications' );

				expect( isShowingOverlayNotification ).toBe(
					LINK_ANALYTICS_ADSENSE_OVERLAY_NOTIFICATION
				);

				expect( dismissedOverlayNotifications ).toBe( undefined );

				await registry
					.dispatch( CORE_UI )
					.dismissOverlayNotification(
						LINK_ANALYTICS_ADSENSE_OVERLAY_NOTIFICATION
					);

				const updatedIsShowingOverlayNotification = registry
					.select( CORE_UI )
					.isShowingOverlayNotification();

				const updatedDismissedOverlayNotifications = registry
					.select( CORE_UI )
					.getValue( 'dismissedOverlayNotifications' );

				expect( updatedIsShowingOverlayNotification ).toBe( undefined );

				expect( updatedDismissedOverlayNotifications.length ).toBe( 1 );
				expect( updatedDismissedOverlayNotifications ).toEqual( [
					LINK_ANALYTICS_ADSENSE_OVERLAY_NOTIFICATION,
				] );
			} );

			it( 'it does not reset the isShowingOverlayNotification value if differnet overlay notification component is showing', async () => {
				await registry
					.dispatch( CORE_UI )
					.setOverlayNotificationToShow(
						LINK_ANALYTICS_ADSENSE_OVERLAY_NOTIFICATION
					);

				const isShowingOverlayNotification = registry
					.select( CORE_UI )
					.isShowingOverlayNotification();

				expect( isShowingOverlayNotification ).toBe(
					LINK_ANALYTICS_ADSENSE_OVERLAY_NOTIFICATION
				);

				await registry
					.dispatch( CORE_UI )
					.dismissOverlayNotification( 'TestNotification' );

				const updatedIsShowingOverlayNotification = registry
					.select( CORE_UI )
					.isShowingOverlayNotification();

				expect( updatedIsShowingOverlayNotification ).toBe(
					LINK_ANALYTICS_ADSENSE_OVERLAY_NOTIFICATION
				);
			} );
		} );

		describe( 'setValues', () => {
			it( 'requires the values param', () => {
				expect( () => {
					registry.dispatch( CORE_UI ).setValues();
				} ).toThrow( 'values must be an object.' );
			} );

			it( 'requires the values param to be an object not an array', () => {
				expect( () => {
					registry.dispatch( CORE_UI ).setValues( [] );
				} ).toThrow( 'values must be an object.' );
			} );

			it( 'does not throw if values is an object', () => {
				expect( () => {
					registry.dispatch( CORE_UI ).setValues( {} );
				} ).not.toThrow();
			} );

			it( 'requires the values param to be an object not a string', () => {
				expect( () => {
					registry.dispatch( CORE_UI ).setValues( 'values' );
				} ).toThrow( 'values must be an object.' );
			} );

			it( 'does not overwrite unrelated keys', () => {
				registry
					.dispatch( CORE_UI )
					.setValues( { key1: 'value1', key2: 'value2' } );

				registry.dispatch( CORE_UI ).setValues( { key1: 'value3' } );

				const uiValue = registry.select( CORE_UI ).getValue( 'key2' );
				expect( uiValue ).toEqual( 'value2' );
			} );

			it( 'returns a newly-set value if a new value for an existing key is set', () => {
				registry
					.dispatch( CORE_UI )
					.setValues( { key1: 'value1', key2: 'value2' } );

				registry.dispatch( CORE_UI ).setValues( { key1: 'value3' } );

				const uiValue = registry.select( CORE_UI ).getValue( 'key1' );
				expect( uiValue ).toEqual( 'value3' );
			} );

			it( 'does not overwrite unrelated keys when an empty object is supplied to values', () => {
				registry
					.dispatch( CORE_UI )
					.setValues( { key1: 'value1', key2: 'value2' } );

				registry.dispatch( CORE_UI ).setValues( {} );

				const uiValue = registry.select( CORE_UI ).getValue( 'key2' );
				expect( uiValue ).toEqual( 'value2' );
			} );

			it( 'works with empty values where the key value is updated', () => {
				registry.dispatch( CORE_UI ).setValues( {} );

				registry
					.dispatch( CORE_UI )
					.setValues( { key1: 'value1', key2: 'value2' } );

				const uiValue = registry.select( CORE_UI ).getValue( 'key2' );
				expect( uiValue ).toEqual( 'value2' );
			} );

			it( 'preserves data from state when new data is assigned', () => {
				registry
					.dispatch( CORE_UI )
					.setValues( { key1: 'value1', key2: 'value2' } );

				registry
					.dispatch( CORE_UI )
					.setValues( { key3: 'value3', key4: 'value4' } );

				const uiValue = registry.select( CORE_UI ).getValue( 'key2' );
				expect( uiValue ).toEqual( 'value2' );
			} );

			it( 'sets object values', () => {
				registry
					.dispatch( CORE_UI )
					.setValues( { key1: { childKey1: 'childValue1' } } );

				const uiValue = registry.select( CORE_UI ).getValue( 'key1' );
				expect( uiValue ).toEqual( { childKey1: 'childValue1' } );
			} );

			it( 'sets boolean values', () => {
				registry.dispatch( CORE_UI ).setValues( { key1: false } );

				const uiValue = registry.select( CORE_UI ).getValue( 'key1' );
				expect( uiValue ).toEqual( false );
			} );

			it( 'sets array values', () => {
				registry.dispatch( CORE_UI ).setValues( {
					key1: [ 'childKey1', 'childKey2', 'childKey3' ],
				} );

				const uiValue = registry.select( CORE_UI ).getValue( 'key1' );
				expect( uiValue ).toEqual( [
					'childKey1',
					'childKey2',
					'childKey3',
				] );
			} );
		} );

		describe( 'setValue', () => {
			it( 'requires the key param', () => {
				expect( () => {
					registry.dispatch( CORE_UI ).setValue();
				} ).toThrow( 'key is required.' );
			} );

			it( 'does not throw with a key', () => {
				expect( () => {
					registry.dispatch( CORE_UI ).setValue( 'key1', 'value1' );
				} ).not.toThrow();
			} );

			it( 'works with key and value', () => {
				registry.dispatch( CORE_UI ).setValue( 'key1', 'value1' );

				const uiValue = registry.select( CORE_UI ).getValue( 'key1' );
				expect( uiValue ).toEqual( 'value1' );
			} );

			it( 'works with a boolean value', () => {
				registry.dispatch( CORE_UI ).setValue( 'key1', false );

				const uiValue = registry.select( CORE_UI ).getValue( 'key1' );
				expect( uiValue ).toEqual( false );
			} );

			it( 'works with the value as an object', () => {
				registry.dispatch( CORE_UI ).setValue( 'key1', {
					childKey1: 'childValue1',
					childKey2: 'childValue2',
				} );

				const uiValue = registry.select( CORE_UI ).getValue( 'key1' );
				expect( uiValue ).toEqual( {
					childKey1: 'childValue1',
					childKey2: 'childValue2',
				} );
			} );

			it( 'works with the value as an array', () => {
				registry
					.dispatch( CORE_UI )
					.setValue( 'key1', [
						'childKey1',
						'childKey2',
						'childKey3',
					] );

				const uiValue = registry.select( CORE_UI ).getValue( 'key1' );
				expect( uiValue ).toEqual( [
					'childKey1',
					'childKey2',
					'childKey3',
				] );
			} );

			it( 'works with the value undefined', () => {
				registry.dispatch( CORE_UI ).setValue( 'key1' );

				const uiValue = registry.select( CORE_UI ).getValue( 'key1' );
				expect( uiValue ).toEqual( undefined );
			} );
		} );
	} );

	describe( 'selectors', () => {
		describe( 'getValue', () => {
			it( 'works with a key that does not exist', () => {
				const uiValue = registry.select( CORE_UI ).getValue( 'key2' );
				expect( uiValue ).toEqual( undefined );
			} );

			it( 'works with key where the key does not exist', () => {
				registry
					.dispatch( CORE_UI )
					.setValues( { key1: 'value1', key2: 'value2' } );

				const uiValue = registry.select( CORE_UI ).getValue( 'key3' );
				expect( uiValue ).toEqual( undefined );
			} );

			it( 'works with an existing key', () => {
				registry
					.dispatch( CORE_UI )
					.setValues( { key1: 'value1', key2: 'value2' } );

				const uiValue = registry.select( CORE_UI ).getValue( 'key2' );
				expect( uiValue ).toEqual( 'value2' );
			} );
		} );

		describe( 'getInViewResetCount', () => {
			it( 'returns a specific key in state', () => {
				const resetCount = registry
					.select( CORE_UI )
					.getInViewResetCount();

				// The reset count starts at zero.
				expect( resetCount ).toBe( 0 );

				registry
					.dispatch( CORE_UI )
					.setValue( 'useInViewResetCount', 2 );

				const updatedResetCount = registry
					.select( CORE_UI )
					.getInViewResetCount();

				expect( updatedResetCount ).toBe( 2 );
			} );
		} );

		describe( 'getIsOnline', () => {
			it( 'returns isOnline value from the state', () => {
				const isOnline = registry.select( CORE_UI ).getIsOnline();

				// isOnline has initial state set to true.
				expect( isOnline ).toBe( true );

				registry.dispatch( CORE_UI ).setValue( 'isOnline', false );

				const updatedIsOnline = registry
					.select( CORE_UI )
					.getIsOnline();

				expect( updatedIsOnline ).toBe( false );
			} );
		} );

		describe( 'isShowingOverlayNotification', () => {
			it( 'returns isShowingOverlayNotification value from the state', () => {
				const isShowingOverlayNotification = registry
					.select( CORE_UI )
					.isShowingOverlayNotification();

				expect( isShowingOverlayNotification ).toBe( undefined );

				registry
					.dispatch( CORE_UI )
					.setValue(
						'isShowingOverlayNotification',
						LINK_ANALYTICS_ADSENSE_OVERLAY_NOTIFICATION
					);

				const updatedIsShowingOverlayNotification = registry
					.select( CORE_UI )
					.isShowingOverlayNotification();

				expect( updatedIsShowingOverlayNotification ).toBe(
					LINK_ANALYTICS_ADSENSE_OVERLAY_NOTIFICATION
				);
			} );

			it( 'returns boolean if `overlayNotification` parameter is passed', () => {
				const isShowingOverlayNotification = registry
					.select( CORE_UI )
					.isShowingOverlayNotification();

				expect( isShowingOverlayNotification ).toBe( undefined );

				registry
					.dispatch( CORE_UI )
					.setValue(
						'isShowingOverlayNotification',
						LINK_ANALYTICS_ADSENSE_OVERLAY_NOTIFICATION
					);

				const updatedIsShowingOverlayNotification = registry
					.select( CORE_UI )
					.isShowingOverlayNotification(
						LINK_ANALYTICS_ADSENSE_OVERLAY_NOTIFICATION
					);

				expect( updatedIsShowingOverlayNotification ).toBe( true );
			} );
		} );
	} );
} );
