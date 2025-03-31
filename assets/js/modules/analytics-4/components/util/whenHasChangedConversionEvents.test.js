/**
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

import { render } from '../../../../../../tests/js/test-utils';
import { createTestRegistry } from '../../../../../../tests/js/utils';
import { MODULES_ANALYTICS_4 } from '../../datastore/constants';
import whenHasChangedConversionEvents from './whenHasChangedConversionEvents';

function TestComponent() {
	return <div data-testid="component" />;
}
function FakeWidgetNull() {
	return <div data-testid="widget-null" />;
}

describe( 'whenHasChangedConversionEvents', () => {
	let registry;
	let provideNewEvents;
	let provideLostEvents;

	beforeEach( () => {
		registry = createTestRegistry();
		const { select, dispatch } = registry;
		const { getModuleData } = select( MODULES_ANALYTICS_4 );
		const { receiveModuleData } = dispatch( MODULES_ANALYTICS_4 );

		provideNewEvents = ( newEvents ) => {
			receiveModuleData( {
				...( getModuleData() || {} ),
				newEvents,
			} );
		};
		provideLostEvents = ( lostEvents ) => {
			receiveModuleData( {
				...( getModuleData() || {} ),
				lostEvents,
			} );
		};
	} );

	it( 'renders nothing if there are no changed conversion events', () => {
		provideNewEvents( [] );
		provideLostEvents( [] );
		const OutterComponent =
			whenHasChangedConversionEvents()( TestComponent );

		const { queryByTestID } = render( <OutterComponent />, {
			registry,
		} );

		expect( queryByTestID( 'component' ) ).not.toBeInTheDocument();
	} );

	it( 'renders if there are new conversion events', () => {
		provideNewEvents( [ 'foo' ] );
		provideLostEvents( [] );
		const OutterComponent =
			whenHasChangedConversionEvents()( TestComponent );

		const { queryByTestID } = render( <OutterComponent />, {
			registry,
		} );

		expect( queryByTestID( 'component' ) ).toBeInTheDocument();
	} );

	it( 'renders if there are lost conversion events', () => {
		provideNewEvents( [] );
		provideLostEvents( [ 'bar' ] );
		const OutterComponent =
			whenHasChangedConversionEvents()( TestComponent );

		const { queryByTestID } = render( <OutterComponent />, {
			registry,
		} );

		expect( queryByTestID( 'component' ) ).toBeInTheDocument();
	} );

	it( 'renders if there are new and lost conversion events', () => {
		provideNewEvents( [ 'foo' ] );
		provideLostEvents( [ 'bar', 'baz' ] );
		const OutterComponent =
			whenHasChangedConversionEvents()( TestComponent );

		const { queryByTestID } = render( <OutterComponent />, {
			registry,
		} );

		expect( queryByTestID( 'component' ) ).toBeInTheDocument();
	} );

	it( 'renders `WidgetNull` from the components ownProps if available when no changed conversion events', () => {
		provideNewEvents( [] );
		provideLostEvents( [] );
		const OutterComponent =
			whenHasChangedConversionEvents()( TestComponent );

		const { queryByTestID } = render(
			<OutterComponent WidgetNull={ FakeWidgetNull } />,
			{
				registry,
			}
		);

		expect( queryByTestID( 'component' ) ).not.toBeInTheDocument();
		// `WidgetNull` does not actually render anything,
		// a fake implementation is used here just for testing.
		expect( queryByTestID( 'widget-null' ) ).toBeInTheDocument();
	} );

	it( 'never renders inner component when no changed conversion events', () => {
		provideNewEvents( [] );
		provideLostEvents( [] );
		const InnerComponent = jest.fn();
		const OutterComponent =
			whenHasChangedConversionEvents()( InnerComponent );

		render( <OutterComponent />, {
			registry,
		} );

		expect( InnerComponent ).not.toHaveBeenCalled();
	} );
} );
