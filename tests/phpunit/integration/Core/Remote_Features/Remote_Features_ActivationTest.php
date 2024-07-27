<?php
/**
 * Remote_Features_CronTest
 *
 * @package   Google\Site_Kit\Tests\Core\Remote_Features
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Remote_Features;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Remote_Features\Remote_Features;
use Google\Site_Kit\Core\Remote_Features\Remote_Features_Activation;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Remote_Features
 */
class Remote_Features_ActivationTest extends TestCase {

	private Remote_Features $setting;

	public function set_up() {
		parent::set_up();
		remove_all_filters( 'googlesitekit_is_feature_enabled' );
		$this->setting = new Remote_Features( new Options( new Context( __FILE__ ) ) );
	}

	public function test_register() {
		$activation = new Remote_Features_Activation( $this->setting );
		$this->assertFalse( has_filter( 'googlesitekit_is_feature_enabled' ) );

		$activation->register();

		$this->assertTrue( has_filter( 'googlesitekit_is_feature_enabled' ) );
	}

	public function test_feature_activation() {
		$activation = new Remote_Features_Activation( $this->setting );
		$activation->register();
		$this->setting->set(
			array( 'testFeature' => array( 'enabled' => true ) )
		);

		// Active features are loaded on the first invocation and cached.
		$this->assertTrue(
			apply_filters( 'googlesitekit_is_feature_enabled', false, 'testFeature' )
		);

		$this->assertFalse(
			apply_filters( 'googlesitekit_is_feature_enabled', false, 'non-existent-feature' )
		);

		// Subsequent updates wont' take effect until the next page load.
		$this->setting->set(
			array( 'testFeature' => array( 'enabled' => false ) )
		);
		$this->assertTrue(
			apply_filters( 'googlesitekit_is_feature_enabled', false, 'testFeature' )
		);
	}
}
