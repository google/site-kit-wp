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

namespace Google\Service\WebContentPublisher;

class DomainProperty extends \Google\Model
{
  /**
   * Optional. Whether the domain ownership has been verified (e.g., via Google
   * Search Console).
   *
   * @var bool
   */
  public $ownershipVerified;
  /**
   * Required. The URL of the domain property (e.g., "https://example.com").
   *
   * @var string
   */
  public $url;

  /**
   * Optional. Whether the domain ownership has been verified (e.g., via Google
   * Search Console).
   *
   * @param bool $ownershipVerified
   */
  public function setOwnershipVerified($ownershipVerified)
  {
    $this->ownershipVerified = $ownershipVerified;
  }
  /**
   * @return bool
   */
  public function getOwnershipVerified()
  {
    return $this->ownershipVerified;
  }
  /**
   * Required. The URL of the domain property (e.g., "https://example.com").
   *
   * @param string $url
   */
  public function setUrl($url)
  {
    $this->url = $url;
  }
  /**
   * @return string
   */
  public function getUrl()
  {
    return $this->url;
  }
}

// Adding a class alias for backwards compatibility with the previous class name.
class_alias(DomainProperty::class, 'Google_Service_WebContentPublisher_DomainProperty');
