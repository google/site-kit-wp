// Mock `window.fetch`.
require( 'jest-fetch-mock' ).enableMocks();

jest.spyOn( global.console, 'error' );
jest.spyOn( global.console, 'warn' );
jest.spyOn( global.console, 'log' );
jest.spyOn( global.console, 'info' );
jest.spyOn( global.console, 'debug' );
