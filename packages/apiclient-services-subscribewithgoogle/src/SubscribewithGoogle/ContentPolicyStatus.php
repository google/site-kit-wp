<?php
/*
 * Copyright 2014 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

namespace Google\Service\SubscribewithGoogle;

class ContentPolicyStatus extends \Google\Model
{
  /**
   * @var string
   */
  public $contentPolicyState;
  /**
   * @var string
   */
  public $policyInfoLink;

  /**
   * @param string
   */
  public function setContentPolicyState($contentPolicyState)
  {
    $this->contentPolicyState = $contentPolicyState;
  }
  /**
   * @return string
   */
  public function getContentPolicyState()
  {
    return $this->contentPolicyState;
  }
  /**
   * @param string
   */
  public function setPolicyInfoLink($policyInfoLink)
  {
    $this->policyInfoLink = $policyInfoLink;
  }
  /**
   * @return string
   */
  public function getPolicyInfoLink()
  {
    return $this->policyInfoLink;
  }
}

// Adding a class alias for backwards compatibility with the previous class name.
class_alias(ContentPolicyStatus::class, 'Google_Service_SubscribewithGoogle_ContentPolicyStatus');
