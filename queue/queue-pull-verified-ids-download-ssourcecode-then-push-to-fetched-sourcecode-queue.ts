import * as request from 'request-promise-native';


request({
    method: 'HEAD',
    followRedirect: false,
    uri: 'https://www.strava.com/athletes/27793488'
}).then((response) => {
    console.log(response);
}).catch((error) => {

    if (parseInt(error.message, 10) !== 302) {
        console.log(error);
        return false;
    }

    // It was an 302 and therefore is was determined the profile doesnt exist
    // So continue

});