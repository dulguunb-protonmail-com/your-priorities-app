import '@polymer/polymer/polymer-legacy.js';
import '@polymer/iron-flex-layout/iron-flex-layout-classes.js';
import '@polymer/iron-icon/iron-icon.js';
import '../yp-app-globals/yp-app-icons.js';
import { ypLanguageBehavior } from '../yp-behaviors/yp-language-behavior.js';
import { ypRemoveClassBehavior } from '../yp-behaviors/yp-remove-class-behavior.js';
import { Polymer } from '@polymer/polymer/lib/legacy/polymer-fn.js';
import { html } from '@polymer/polymer/lib/utils/html-tag.js';
Polymer({
  _template: html`
    <style include="iron-flex iron-flex-alignment">

      :host {
        background-color: transparent;
      }

      paper-fab {
        background-color: #999;
        color: #FFF;
        --paper-fab-iron-icon: {
          color: #fff;
        };
      }

      .heartButton {
        color: #999;
        cursor: pointer;
        width: 36px;
        height: 36px;
      }

      .member {
        background-color: var(--accent-color);
      }

      [hidden] {
        display: none !important;
      }
    </style>

    <paper-fab mini="" elevation="5" id="button" title\$="[[t('toggleMembership')]]" on-tap="_toggleMembership" disabled="[[disabled]]" class="heartButton" icon="favorite"></paper-fab>
    <yp-ajax class="ajax" id="membershipAjax" hidden\$="[[!disabled]]" method="POST" on-response="_membershipResponse"></yp-ajax>

    <lite-signal on-lite-signal-got-memberships="_updateMembershipFromSignal"></lite-signal>
`,

  is: 'yp-membership-button',

  behaviors: [
    ypLanguageBehavior,
    ypRemoveClassBehavior
  ],

  properties: {
    community: {
      type: Object,
      observer: "_communityChanged"
    },

    group: {
      type: Object,
      observer: "_groupChanged"
    },

    membershipValue: {
      type: Boolean,
      value: false
    },

    disabled: {
      type: Boolean,
      value: false
    },

    large: {
      type: Boolean,
      value: false
    }
  },

  _communityChanged: function (community) {
    if (community) {
      this._updateMembership();
    }
  },

  _groupChanged: function (group) {
    if (group) {
      this._updateMembership();
    }
  },

  _updateMembershipFromSignal: function () {
    this._updateMembership();
  },

  _updateMembership: function () {
    if (window.appUser && window.appUser.loggedIn() && window.appUser.membershipsIndex) {
      if (this.community) {
        this.set('membershipValue',  window.appUser.membershipsIndex.communities[this.community.id]);
      } else if (this.group) {
        this.set('membershipValue',  window.appUser.membershipsIndex.groups[this.group.id]);
      } else {
        this.set('membershipValue', false);
      }
    } else {
      this.set('membershipValue', false);
    }
    this._resetClasses();
  },

  _resetClasses: function () {
    if (this.membershipValue) {
      this.$.button.className += " " + "member";
    } else {
      this.removeClass(this.$.button, "member");
    }
  },

  _membershipResponse: function (event, detail) {
    this.set('disabled', false);
    this.set('membershipValue', detail.response.membershipValue);
    if (this.membershipValue) {
      window.appGlobals.notifyUserViaToast(this.t('membership.joined')+ " " + detail.response.name);
    } else {
      window.appGlobals.notifyUserViaToast(this.t('membership.left')+ " " + detail.response.name);
    }
    this._resetClasses();
    if (detail.response.membershipValue===true) {
      if (this.community) {
        window.appUser.membershipsIndex.communities[this.community.id] = true;
      } else if (this.group) {
        window.appUser.membershipsIndex.groups[this.group.id] = true;
      }
    } else {
      if (this.community) {
        window.appUser.membershipsIndex.communities[this.community.id] = null;
      } else if (this.group) {
        window.appUser.membershipsIndex.groups[this.group.id] = null;
      }
    }
  },

  generateMembershipFromLogin: function (value) {
    if (this.community) {
      if (!window.appUser.membershipsIndex.communities[this.community.id]) {
        this.generateMembership(value);
      }
    } else if (this.group) {
      if (!window.appUser.membershipsIndex.groups[this.group.id]) {
        this.generateMembership(value);
      }
    }
  },

  _toggleMembership: function () {
    if (this.community) {
      window.appGlobals.activity('clicked', 'toggleCommunityMembership', this.community.id);
    } else if (this.group) {
      window.appGlobals.activity('clicked', 'toggleGroupMembership', this.group.id);
    }
    this.generateMembership(!this.membershipValue)
  },

  generateMembership: function (value) {
    this.set('disabled', true);
    if (window.appUser.loggedIn()===true) {
      if (this.community) {
        this.$.membershipAjax.url = "/api/communities/" + this.community.id + "/user_membership";
      } else if (this.group) {
        this.$.membershipAjax.url = "/api/groups/" + this.group.id + "/user_membership";
      }
      this.$.membershipAjax.body = { value: value };

      if (value) {
        this.$.membershipAjax.method = "POST";
      } else {
        this.$.membershipAjax.method = "DELETE";
      }
      this.$.membershipAjax.generateRequest();
    } else {
      this.set('disabled', false);
      window.appUser.loginForMembership(this, { value: value } );
    }
  }
});