<?php
/**
 * Notification test case
 *
 * @package   Google\Site_Kit\Tests
 * @copyright 2020 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Notifications;

use Google\Site_Kit\Core\Notifications\Notification;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Notifications
 */
class NotificationTest extends TestCase {

	public function test_get_slug() {
		$notification = new Notification( 'test-slug', array() );

		$this->assertEquals( 'test-slug', $notification->get_slug() );

		$notification = new Notification( null, array() );

		$this->assertEquals( '', $notification->get_slug() );
	}

	public function test_prepare_for_js() {
		$notification = new Notification(
			'test-slug',
			array(
				'title'            => 'test-title',
				'content'          => 'test-content',
				'image'            => 'test-image-url',
				'cta_url'          => 'test-cta-url',
				'cta_label'        => 'test-cta-label',
				'cta_target'       => 'test-cta-target',
				'learn_more_url'   => 'test-learn-more-url',
				'learn_more_label' => 'test-learn-more-label',
				'dismissible'      => true,
				'dismiss_label'    => 'test-dismiss-label',
			)
		);

		$this->assertEqualSetsWithIndex(
			array(
				'title'          => 'test-title',
				'content'        => 'test-content',
				'image'          => 'test-image-url',
				'ctaURL'         => 'test-cta-url',
				'ctaLabel'       => 'test-cta-label',
				'ctaTarget'      => 'test-cta-target',
				'learnMoreURL'   => 'test-learn-more-url',
				'learnMoreLabel' => 'test-learn-more-label',
				'dismissible'    => true,
				'dismissLabel'   => 'test-dismiss-label',
				'id'             => 'test-slug',
			),
			$notification->prepare_for_js()
		);
	}
}
