<?php
/**
 * Class Google\Site_Kit\Tests\Modules\AdSense\Datapoints\Sync_Ad_Blocking_Recovery_TagsTest
 *
 * @package   Google\Site_Kit\Tests\Modules\AdSense\Datapoints
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\AdSense\Datapoints;

use Google\Site_Kit\Core\REST_API\Data_Request;
use Google\Site_Kit\Modules\AdSense;
use Google\Site_Kit\Modules\AdSense\Datapoints\Sync_Ad_Blocking_Recovery_Tags;

/**
 * @group Modules
 * @group AdSense
 * @group Datapoints
 */
class Sync_Ad_Blocking_Recovery_TagsTest extends DatapointTestCase {
	public function test_parse_response_persists_tag_values() {
		$tag_store = new class() {
			public $value;

			public function set( $value ) {
				$this->value = $value;
			}
		};

		$datapoint = new Sync_Ad_Blocking_Recovery_Tags(
			array(
				'service'                  => function () {
					return $this->service;
				},
				'settings'                 => $this->adsense->get_settings(),
				'ad_blocking_recovery_tag' => $tag_store,
				'normalize_account_id'     => function ( $account_id ) {
					return AdSense::normalize_account_id( $account_id );
				},
			)
		);

		$response = new class() {
			public function getTag() {
				return 'test-recovery-tag';
			}

			public function getErrorProtectionCode() {
				return 'test-error-protection-code';
			}
		};

		$parsed = $datapoint->parse_response(
			$response,
			new Data_Request( 'POST', 'modules', 'adsense', 'sync-ad-blocking-recovery-tags', array() )
		);

		$this->assertEquals( array( 'success' => true ), $parsed->get_data(), 'Expected the sync response to report success.' );
		$this->assertEquals( 'test-recovery-tag', $tag_store->value['tag'], 'Expected the returned tag to be stored.' );
	}
}
