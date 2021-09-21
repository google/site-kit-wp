<?php

namespace Step\Idea_Hub;

use Page\Idea_Hub\Widget as Widget_Page_Object;

class Widget extends \Idea_HubTester {

	public function seeIdeaText( $idea ) {
		$I = $this;
		$I->see( $idea['text'], Widget_Page_Object::idea_row_id( $idea ) );
	}

	public function seeIdeaTopics( $idea ) {
		$I  = $this;
		$id = Widget_Page_Object::idea_row_id( $idea );
		foreach ( $idea['topics'] as $topic ) {
			$I->see( $topic['displayName'], $id );
		}
	}

	public function canCreateDraftPost( $idea ) {
		$I  = $this;
		$id = Widget_Page_Object::idea_row_id( $idea );

		$I->click( '.googlesitekit-idea-hub__actions--create', $id );
		$I->waitForElement( "{$id} .googlesitekit-idea-hub__actions--view" );
	}

	public function seeDraftedPost( $idea ) {
		$I = $this;
		$I->amOnPostsPage();
		$I->see( sprintf( 'Idea Hub Draft “%s”', $idea['text'] ), '.post-state' );
	}

	public function switchTabsTo( $tab ) {
		$I = $this;
		$I->click( $tab, '.googlesitekit-idea-hub__tabs' );
	}

}
