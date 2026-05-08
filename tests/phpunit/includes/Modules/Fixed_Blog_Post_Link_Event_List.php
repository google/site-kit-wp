<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Fixed_Blog_Post_Link_Event_List
 *
 * @package   Google\Site_Kit\Tests\Modules
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules;

use Google\Site_Kit\Modules\Analytics_4\Advanced_Tracking\Event_List;
use Google\Site_Kit\Modules\Analytics_4\Advanced_Tracking\Event;

class Fixed_Blog_Post_Link_Event_List extends Event_List {

	/**
	 * Registers an event for when someone views or edits a single post from within the blog.
	 *
	 * The events are registered non-dynamically, i.e. there is no context data provided.
	 */
	public function register() {
		$this->add_event(
			new Event(
				array(
					'action'   => 'view_blog_post',
					'selector' => '.blog .post a[rel="bookmark"]',
					'on'       => 'click',
					'metadata' => array(
						'event_category' => 'engagement',
					),
				)
			)
		);

		$this->add_event(
			new Event(
				array(
					'action'   => 'edit_blog_post',
					'selector' => '.blog .post a.post-edit-link',
					'on'       => 'click',
					'metadata' => array(
						'event_category' => 'engagement',
					),
				)
			)
		);
	}
}
