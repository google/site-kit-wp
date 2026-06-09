/**
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
import renderGoogleChartToDataURI from './render-google-chart-to-data-uri';

const PNG_DATA_URI = 'data:image/png;base64,UE5HSU1H';
const JPEG_DATA_URI = 'data:image/jpeg;base64,/9j/TU9DSw==';

type Listeners = Record< string, () => void >;

let listeners: Listeners;
let capturedContainer: HTMLDivElement | null;
let drawBehavior: ( eventListeners: Listeners ) => void;
let originalImage: unknown;

function setGoogle( value: unknown ) {
	( global as unknown as { google?: unknown } ).google = value;
}

// Installs a minimal `google.visualization` mock for a single chart render.
function installGoogleChartsMock() {
	listeners = {};
	capturedContainer = null;
	drawBehavior = ( eventListeners ) => eventListeners.ready?.();

	const events = {
		addListener: (
			_source: object,
			eventName: string,
			handler: () => void
		) => {
			listeners[ eventName ] = handler;
		},
	};

	class LineChart {
		constructor( container: HTMLDivElement ) {
			capturedContainer = container;
		}
		draw() {
			drawBehavior( listeners );
		}
		getImageURI() {
			return PNG_DATA_URI;
		}
	}

	setGoogle( { visualization: { LineChart, events } } );
}

// Replaces the global `Image` with one whose `src` setter resolves `onload`.
function installImageMock() {
	class MockImage {
		onload: ( () => void ) | null = null;
		onerror: ( () => void ) | null = null;
		naturalWidth = 1080;
		naturalHeight = 400;
		width = 1080;
		height = 400;
		_src = '';
		set src( value: string ) {
			this._src = value;
			Promise.resolve().then( () => this.onload?.() );
		}
		get src() {
			return this._src;
		}
	}

	( global as unknown as { Image: unknown } ).Image = MockImage;
}

describe( 'renderGoogleChartToDataURI', () => {
	beforeEach( () => {
		installGoogleChartsMock();

		originalImage = ( global as unknown as { Image: unknown } ).Image;
		installImageMock();

		jest.spyOn(
			global.HTMLCanvasElement.prototype,
			'getContext'
		).mockImplementation(
			() =>
				( {
					drawImage: jest.fn(),
				} as unknown as CanvasRenderingContext2D )
		);
		jest.spyOn(
			global.HTMLCanvasElement.prototype,
			'toDataURL'
		).mockReturnValue( JPEG_DATA_URI );
	} );

	afterEach( () => {
		jest.restoreAllMocks();
		( global as unknown as { Image: unknown } ).Image = originalImage;
		setGoogle( undefined );
	} );

	it( 'should mount a hidden offscreen container at the scaled dimensions and return a JPEG data URI', async () => {
		const dataURI = await renderGoogleChartToDataURI( {
			chartType: 'LineChart',
			dataTable: {},
			options: {},
			width: 540,
			height: 200,
		} );

		expect( dataURI ).toBe( JPEG_DATA_URI );
		expect( dataURI ).toMatch( /^data:image\/jpeg;base64,/ );

		// The container is captured in the chart constructor before teardown.
		expect( capturedContainer ).not.toBeNull();
		// Default scaleFactor of 2 doubles the logical dimensions.
		expect( capturedContainer?.style.width ).toBe( '1080px' );
		expect( capturedContainer?.style.height ).toBe( '400px' );
		expect( capturedContainer?.style.position ).toBe( 'absolute' );
		expect( capturedContainer?.style.left ).toBe( '-10000px' );
	} );

	it( 'should tear down the offscreen container on success', async () => {
		await renderGoogleChartToDataURI( {
			chartType: 'LineChart',
			dataTable: {},
			options: {},
			width: 540,
			height: 200,
		} );

		expect( capturedContainer ).not.toBeNull();
		expect(
			global.document.body.contains( capturedContainer as Node )
		).toBe( false );
	} );

	it( 'should tear down the offscreen container when rendering throws', async () => {
		// Fire the chart's `error` event instead of `ready`.
		drawBehavior = ( eventListeners ) => eventListeners.error?.();

		await expect(
			renderGoogleChartToDataURI( {
				chartType: 'LineChart',
				dataTable: {},
				options: {},
				width: 540,
				height: 200,
			} )
		).rejects.toThrow( /failed to render the chart/i );

		expect( capturedContainer ).not.toBeNull();
		expect(
			global.document.body.contains( capturedContainer as Node )
		).toBe( false );
	} );

	it( 'should return the raw PNG data URI when format is png', async () => {
		const dataURI = await renderGoogleChartToDataURI( {
			chartType: 'LineChart',
			dataTable: {},
			options: {},
			width: 540,
			height: 200,
			format: 'png',
		} );

		expect( dataURI ).toBe( PNG_DATA_URI );
		expect(
			global.HTMLCanvasElement.prototype.toDataURL
		).not.toHaveBeenCalled();
	} );

	it( 'should reject with an AbortError without mounting a container when the signal is already aborted', async () => {
		const controller = new AbortController();
		controller.abort();

		await expect(
			renderGoogleChartToDataURI( {
				chartType: 'LineChart',
				dataTable: {},
				options: {},
				width: 540,
				height: 200,
				signal: controller.signal,
			} )
		).rejects.toMatchObject( { name: 'AbortError' } );

		// The abort check runs before the chart is instantiated.
		expect( capturedContainer ).toBeNull();
	} );
} );
