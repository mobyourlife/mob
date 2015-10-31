// config/auth.js

// expose our config directly to our application using module.exports
module.exports = {

    'facebookAuth' : {
        'clientID'      : '', // your App ID
        'clientSecret'  : '', // your App Secret
        'callbackURL'   : 'https://www.mobyourlife.com.br/auth/facebook/callback',
        'realtimeURL'   : 'https://www.mobyourlife.com.br/api/facebook/realtime'
    }

};
