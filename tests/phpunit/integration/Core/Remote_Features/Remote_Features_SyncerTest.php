<?php
/**
 * Remote_Features_SyncerTest
 *
 * @package   Google\Site_Kit\Tests\Core\Remote_Features
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Remote_Features;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Remote_Features\Remote_Features;
use Google\Site_Kit\Core\Remote_Features\Remote_Features_Syncer;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Tests\TestCase;
use Google\Site_Kit\Tests\TestGuard;

/**
 * @group Remote_Features
 */
class Remote_Features_SyncerTest extends TestCase {

	private Remote_Features $setting;

	public function set_up() {
		parent::set_up();
		$this->setting = new Remote_Features( new Options( new Context( __FILE__ ) ) );
	}

	public function test_pull_remote_features() {
		$syncer = new Remote_Features_Syncer(
			$this->setting,
			fn () => array( 'testFeature' => array( 'enabled' => true ) )
		);

		$this->assertEquals( array(), $this->setting->get() );

		$syncer->pull_remote_features();

		$this->assertEquals(
			array(
				'testFeature'     => array( 'enabled' => true ),
				'last_updated_at' => time(),
			),
			$this->setting->get()
		);
	}

	public function test_pull_remote_features__with_guards() {
		$returns    = new \stdClass();
		$returns->a = false;
		$returns->b = false;
		$syncer     = new Remote_Features_Syncer(
			$this->setting,
			fn () => array( 'testFeature' => array( 'enabled' => true ) ),
			new TestGuard( fn () => $returns->a ),
			new TestGuard( fn () => $returns->b ),
		);
		$this->assertEquals( array(), $this->setting->get() );

		$syncer->pull_remote_features();

		$this->assertEquals( array(), $this->setting->get() );

		$returns->a = true;
		$syncer->pull_remote_features();

		$this->assertEquals( array(), $this->setting->get() );

		$returns->b = true;
		$syncer->pull_remote_features();

		$this->assertEquals(
			array(
				'testFeature'     => array( 'enabled' => true ),
				'last_updated_at' => time(),
			),
			$this->setting->get()
		);
	}
}
