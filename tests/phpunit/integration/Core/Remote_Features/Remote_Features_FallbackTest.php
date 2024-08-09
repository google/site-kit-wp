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
use Google\Site_Kit\Core\Remote_Features\Remote_Features_Cron;
use Google\Site_Kit\Core\Remote_Features\Remote_Features_Fallback;
use Google\Site_Kit\Core\Remote_Features\Remote_Features_Provider;
use Google\Site_Kit\Core\Storage\Encrypted_Options;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Tests\Fake_Site_Connection_Trait;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Remote_Features
 */
class Remote_Features_FallbackTest extends TestCase {

	public function test_register() {
		$context = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$options = new Options( $context );

		$fallback = new Remote_Features_Fallback(
			$context,
			$options,
			new Credentials( $options )
		);

		$fallback->register();

		$this->assertTrue( has_action( 'wp_ajax_sk_pull_remote_features_fallback' ) );
	}
}
