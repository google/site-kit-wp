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

		$this->assertEquals( array( 'last_updated_at' => 0 ), $this->setting->get(), 'Remote features should be unset before the first synchronization.' );

		$syncer->pull_remote_features();

		$this->assertEquals( array( 'enabled' => true ), $this->setting->get()['testFeature'], 'Synchronization should persist features returned by the remote source.' );
		$this->assertEqualsWithDelta(
			time(),
			$this->setting->get()['last_updated_at'],
			2,
			'Synchronization should record the current timestamp.'
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
		$this->assertEquals( array( 'last_updated_at' => 0 ), $this->setting->get(), 'Remote features should be unset before guarded synchronization.' );

		$syncer->pull_remote_features();

		$this->assertEquals( array( 'last_updated_at' => 0 ), $this->setting->get(), 'Synchronization should be skipped while every guard blocks it.' );

		$returns->a = true;
		$syncer->pull_remote_features();

		$this->assertEquals( array( 'last_updated_at' => 0 ), $this->setting->get(), 'Synchronization should be skipped while any guard still blocks it.' );

		$returns->b = true;
		$syncer->pull_remote_features();

		$this->assertEquals( array( 'enabled' => true ), $this->setting->get()['testFeature'], 'Synchronization should persist remote features after all guards allow it.' );
		$this->assertEqualsWithDelta(
			time(),
			$this->setting->get()['last_updated_at'],
			2,
			'Successful guarded synchronization should record the current timestamp.'
		);
	}
}
