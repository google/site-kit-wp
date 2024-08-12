<?php
/**
 * Remote_Features_ProviderTest
 *
 * @package   Google\Site_Kit\Tests\Core\Remote_Features
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Remote_Features;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\Credentials;
use Google\Site_Kit\Core\Remote_Features\Remote_Features;
use Google\Site_Kit\Core\Remote_Features\Remote_Features_Fallback;
use Google\Site_Kit\Core\Remote_Features\Remote_Features_Syncer;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Remote_Features
 */
class Remote_Features_FallbackTest extends TestCase {
	protected $setting;
	protected $syncer;

	public function set_up() {
		parent::set_up();

		$this->setting = new Remote_Features( new Options( new Context( __FILE__ ) ) );
		$this->setting->register();

		$this->syncer = new Remote_Features_Syncer(
			$this->setting,
			fn () => array( 'testFeature' => array( 'enabled' => true ) ),
		);
	}

	public function test_remote_features_sync_fallback__24h_since_last_sync() {
		$fallback = new Remote_Features_Fallback(
			$this->syncer,
			$this->setting
		);

		$this->setting->set( array( 'last_updated_at' => time() - DAY_IN_SECONDS - MINUTE_IN_SECONDS ) );

		$fallback->remote_features_sync_fallback();

		$this->assertEquals( array( 'enabled' => true ), $this->setting->get()['testFeature'] );
		$this->assertEqualsWithDelta( time(), $this->setting->get()['last_updated_at'], 2 );
	}

	public function test_remote_features_sync_fallback__less_than_24h_since_last_sync() {
		$fallback = new Remote_Features_Fallback(
			$this->syncer,
			$this->setting
		);

		$this->setting->set( array( 'last_updated_at' => time() - HOUR_IN_SECONDS ) );

		$fallback->remote_features_sync_fallback();

		$this->assertEqualsWithDelta( time() - HOUR_IN_SECONDS, $this->setting->get()['last_updated_at'], 2 );
		$this->assertTrue( ! isset( $this->setting->get()['testFeature'] ) );
	}
}
