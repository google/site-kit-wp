<?php

use Step\Idea_Hub\Widget as Widget_Tester;

class SavedIdeasCest {

	private $ideas;

	public function _before( Idea_HubTester $I ) { // phpcs:ignore PSR2.Methods.MethodDeclaration.Underscore
		$this->ideas = include __DIR__ . '/../../plugins/idea-hub/saved-ideas.php';

		$I->loginAsAdmin();
		$I->enableIdeaHubMocks();
		$I->connectSiteKit();
		$I->setupIdeaHub();
	}

	public function canSeeSavedIdeas( Widget_Tester $I ) {
		$I->amOnDashboardPage();
		$I->switchTabsTo( 'Saved' );

		foreach ( $this->ideas as $idea ) {
			$I->seeIdeaText( $idea );
			$I->seeIdeaTopics( $idea );
		}
	}

	public function canCreateDraftPostForSavedIdea( Widget_Tester $I ) {
		$idea = $this->ideas[ array_rand( $this->ideas ) ];

		$I->amOnDashboardPage();
		$I->switchTabsTo( 'Saved' );

		$I->canCreateDraftPost( $idea );
		$I->seeDraftedPost( $idea );
	}

}
