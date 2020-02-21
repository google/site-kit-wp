/**
 * WordPress dependencies
 */
import { createRegistry } from '@wordpress/data';

const siteKitRegistry = createRegistry();

export * from '@wordpress/data';

export const { registerStore } = siteKitRegistry;

export default siteKitRegistry;
