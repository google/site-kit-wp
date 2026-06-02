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

const JPEG_QUALITY = 0.92;

export type GoogleChartType =
	| 'LineChart'
	| 'ColumnChart'
	| 'BarChart'
	| 'PieChart';

export type ChartImageFormat = 'jpeg' | 'png';

export interface RenderGoogleChartToDataURIParams {
	/** Google Charts class to instantiate from `google.visualization`. */
	chartType: GoogleChartType;
	/** A `google.visualization.DataTable` (or `DataView`) to draw. */
	dataTable: object;
	/** Google Charts options object for the chart. */
	options: object;
	/** Logical width, in PDF points, the image will occupy. */
	width: number;
	/** Logical height, in PDF points, the image will occupy. */
	height: number;
	/** Multiplier applied to the offscreen render size for crisper output. */
	scaleFactor?: number;
	/** Output encoding for the returned data URI. */
	format?: ChartImageFormat;
	/** Signal used to abort before any offscreen work happens. */
	signal?: AbortSignal;
}

interface GoogleVisualizationChart {
	draw( data: object, options: object ): void;
	getImageURI(): string;
}

type GoogleVisualizationChartConstructor = new (
	container: Element
) => GoogleVisualizationChart;

interface GoogleVisualizationEvents {
	addListener( source: object, eventName: string, handler: () => void ): void;
}

interface GoogleVisualization {
	LineChart?: GoogleVisualizationChartConstructor;
	ColumnChart?: GoogleVisualizationChartConstructor;
	BarChart?: GoogleVisualizationChartConstructor;
	PieChart?: GoogleVisualizationChartConstructor;
	events?: GoogleVisualizationEvents;
}

/**
 * Reads the (untyped) `google.visualization` global.
 *
 * @since n.e.x.t
 *
 * @return {Object|undefined} The `google.visualization` namespace, when present.
 */
function getVisualization(): GoogleVisualization | undefined {
	return (
		global as unknown as {
			google?: { visualization?: GoogleVisualization };
		}
	 ).google?.visualization;
}

/**
 * Re-encodes a PNG data URI as a JPEG data URI via an offscreen canvas.
 *
 * `getImageURI()` only emits PNG; JPEG keeps the embedded PDF image small.
 *
 * @since n.e.x.t
 *
 * @param {string} pngDataURI PNG data URI produced by `chart.getImageURI()`.
 * @return {Promise<string>} A `data:image/jpeg;base64,...` data URI.
 */
function convertPNGToJPEG( pngDataURI: string ): Promise< string > {
	return new Promise( ( resolve, reject ) => {
		const image = new global.Image();
		image.onload = () => {
			const canvas = global.document.createElement( 'canvas' );
			canvas.width = image.naturalWidth || image.width;
			canvas.height = image.naturalHeight || image.height;

			const context = canvas.getContext( '2d' );
			if ( ! context ) {
				reject(
					new Error(
						'Site Kit: could not acquire a 2D canvas context to encode the chart image.'
					)
				);
				return;
			}

			context.drawImage( image, 0, 0 );
			resolve( canvas.toDataURL( 'image/jpeg', JPEG_QUALITY ) );
		};
		image.onerror = () =>
			reject(
				new Error(
					'Site Kit: failed to decode the chart PNG for JPEG conversion.'
				)
			);
		image.src = pngDataURI;
	} );
}

/**
 * Rasterises a Google Chart to a data URI for embedding in a PDF.
 *
 * `@react-pdf/renderer` has no DOM, so charts cannot be drawn inside the PDF.
 * This draws the chart into a hidden, oversized offscreen container using the
 * Google Charts library, captures it via `getImageURI()`, and (for JPEG)
 * re-encodes it through a canvas. The container is always removed, on both
 * success and failure, so repeated exports cannot leak detached nodes.
 *
 * @since n.e.x.t
 *
 * @param {Object}      params                 Render parameters.
 * @param {string}      params.chartType       Google Charts class name to instantiate.
 * @param {Object}      params.dataTable       `google.visualization.DataTable` to draw.
 * @param {Object}      params.options         Google Charts options object.
 * @param {number}      params.width           Logical width, in PDF points.
 * @param {number}      params.height          Logical height, in PDF points.
 * @param {number}      [params.scaleFactor=2] Offscreen render multiplier.
 * @param {string}      [params.format=jpeg]   Output encoding (`jpeg` or `png`).
 * @param {AbortSignal} [params.signal]        Signal aborting before any work runs.
 * @return {Promise<string>} The rendered chart image as a data URI.
 */
export default async function renderGoogleChartToDataURI( {
	chartType,
	dataTable,
	options,
	width,
	height,
	scaleFactor = 2,
	format = 'jpeg',
	signal,
}: RenderGoogleChartToDataURIParams ): Promise< string > {
	if ( signal?.aborted ) {
		throw new DOMException( 'Aborted', 'AbortError' );
	}

	const visualization = getVisualization();
	const ChartConstructor = visualization?.[ chartType ];
	const events = visualization?.events;

	if ( typeof ChartConstructor !== 'function' || ! events ) {
		throw new Error(
			`Site Kit: Google Charts is not loaded or does not provide a "${ chartType }".`
		);
	}

	const container = global.document.createElement( 'div' );
	container.style.position = 'absolute';
	container.style.left = '-10000px';
	container.style.top = '0';
	container.style.width = `${ width * scaleFactor }px`;
	container.style.height = `${ height * scaleFactor }px`;
	global.document.body.appendChild( container );

	try {
		const chart = new ChartConstructor( container );

		const pngDataURI = await new Promise< string >( ( resolve, reject ) => {
			function cleanup() {
				signal?.removeEventListener( 'abort', onAbort );
			}

			function onAbort() {
				cleanup();
				reject( new DOMException( 'Aborted', 'AbortError' ) );
			}

			events.addListener( chart, 'ready', () => {
				cleanup();
				resolve( chart.getImageURI() );
			} );
			events.addListener( chart, 'error', () => {
				cleanup();
				reject(
					new Error(
						'Site Kit: Google Charts failed to render the chart.'
					)
				);
			} );

			signal?.addEventListener( 'abort', onAbort, { once: true } );

			chart.draw( dataTable, options );
		} );

		if ( format === 'png' ) {
			return pngDataURI;
		}

		return await convertPNGToJPEG( pngDataURI );
	} finally {
		container.remove();
	}
}
