<?php
/**
 * Plugin Name: E2E Tests Module Setup TagManager API Mock
 * Plugin URI:  https://github.com/google/site-kit-wp
 * Description: Utility plugin for mocking TagManager Setup API requests during E2E tests.
 * Author:      Google
 * Author URI:  https://opensource.google.com
 *
 * @package   Google\Site_Kit
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\E2E\Modules\TagManager;

use Google\Site_Kit\Core\REST_API\REST_Routes;

const ACCOUNT_ID_A = '100';
const ACCOUNT_ID_B = '101';

const PUBLIC_ID_X = 'GTM-ABCXYZ';
const PUBLIC_ID_Y = 'GTM-BCDWXY';

const CONTAINER_ID_X = '200';
const CONTAINER_ID_Y = '201';

function filter_by_account_id( $items, $account_id ) {
	return array_values(
		array_filter(
			$items,
			function ( $item ) use ( $account_id ) {
				return $item['accountId'] === $account_id;
			}
		)
	);
}

//function filter_by_public_id( $items, $public_id ) {
//	return array_values(
//		array_filter(
//			$items,
//			function ( $item ) use ( $public_id ) {
//				return $item['internalWebPropertyId'] === get_internal_id_by_public( $property_id );
//			}
//		)
//	);
//}

add_action( 'rest_api_init', function () {

	$accounts   = array(
		array(
			'accountId' => ACCOUNT_ID_A,
			'name'      => 'Test Account A',
		),
		array(
			'accountId' => ACCOUNT_ID_B,
			'name'      => 'Test Account B',
		),
	);
	$containers = array(
		array(
			'accountId'   => ACCOUNT_ID_A,
			'publicId'    => PUBLIC_ID_X,
			'containerId' => CONTAINER_ID_X,
			'name'        => 'Test Container X',
		),
		array(
			'accountId'   => ACCOUNT_ID_B,
			'publicId'    => PUBLIC_ID_Y,
			'containerId' => CONTAINER_ID_Y,
			'name'        => 'Test Container Y',
		),
	);

	register_rest_route(
		REST_Routes::REST_ROOT,
		'modules/tagmanager/data/accounts-containers',
		array(
			'callback' => function ( $request ) use ( $accounts, $containers ) {
				$account_id = $request['accountId'] ?: $accounts[0]['accountId'];

				return array(
					'accounts'   => $accounts,
					'containers' => filter_by_account_id( $containers, $account_id ),
				);
			}
		),
		true
	);

	register_rest_route(
		REST_Routes::REST_ROOT,
		'modules/tagmanager/data/containers',
		array(
			'callback' => function ( $request ) use ( $containers ) {
				return filter_by_account_id( $containers, $request['accountId'] );
			}
		),
		true
	);

}, 0 );
