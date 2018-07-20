var yoti = require('yoti');
var passport = require('passport-strategy')
    , util = require('util');

function Strategy(options, verify) {
    passport.Strategy.call(this);

    if (!verify) throw new Error('Yoti strategy requires a verify function');
    if(!options.clientSdkId) throw new Error('clientSdkId is a required field');
    if(!options.prvKey) throw new Error('prvKey is a required field');

    this.name = 'yoti';
    this._verify = verify;
    this._passReqToCallback = options.passReqToCallback;
    this._yotiClient = new yoti.Client(options.clientSdkId, options.prvKey)
}

util.inherits(Strategy, passport.Strategy);

/**
 * Authenticate request based on the body which would contain token
 * header.
 *
 * @param {Object} req
 * @api protected
 */
Strategy.prototype.authenticate = function(req) {
    var self = this;
    function verified(err, user, info) {
		if (err) {
			return self.error(err);
		}
		if (!user) {
			return self.fail(info);
		}
		self.success(user, info);
	}
    this._yotiClient.getActivityDetails(req.query.token).then(function(activityDetails) {
        var userProfile = activityDetails.getUserProfile();
        var profile = activityDetails.getProfile();
        var userData = {
            userId: activityDetails.getUserId(),
            selfieUri: activityDetails.getBase64SelfieUri(),
            userProfile:userProfile,
            profile:profile
        };
        if (self._passReqToCallback)
        {
            self._verify(req,userData,verified);
        }
        else
        {
            self._verify(userData,verified);
        }
      }).catch(function(error) {
        self.error(error);
      });
}

module.exports = Strategy;
